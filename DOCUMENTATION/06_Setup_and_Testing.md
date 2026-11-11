# 06 — Local Setup, Configuration & Testing Guide

This guide walks through setting up the **CM Kerala Public Grievance Redressal Portal** locally on Windows/macOS/Linux and running manual and automated verification checks.

---

## 1. Prerequisites

| Tool | Target Version | Notes |
| :--- | :--- | :--- |
| **Python** | `3.12` (or `3.11+`, verified on `3.11.9`) | Required for FastAPI backend, SQLAlchemy Async, and Alembic |
| **Node.js & npm** | `Node.js 20+` / `24.x` (verified on `v24.16.0`, `npm 11.13.0`) | Required for Vite + React + TypeScript frontend |
| **PostgreSQL** | `18.x` (verified on `PostgreSQL 18.4`) | Relational database listening on port `5432` |
| **Groq API Key** | Optional | Enables live `openai/gpt-oss-120b` AI triage (falls back cleanly if omitted) |

---

## 2. Step-by-Step Local Installation

### Step 1: Provision PostgreSQL 18 Database
Ensure the PostgreSQL 18 service is running, then create the application database (`cm_kerala`):
```sql
CREATE DATABASE cm_kerala;
```
*(Via `psql` CLI: `psql -U postgres -c "CREATE DATABASE cm_kerala;"`)*

---

### Step 2: Backend Setup (`backend/`)
Open a terminal in the repository root (`CM_Kerala/`):

```powershell
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate          # macOS / Linux

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Create backend/.env from example template
Copy-Item .env.example .env
# Edit backend/.env with your PostgreSQL password, SECRET_KEY, and GROQ_API_KEY
```

---

### Step 3: Database Migration & Seeding
With your virtual environment active inside `backend/`:

```powershell
# Apply Alembic initial schema migration (creates all 8 PostgreSQL tables)
alembic upgrade head

# Verify current Alembic revision
alembic current
# Expected: 001_initial_schema (head)

# Seed 10 departments, 4 demo users, and 15 sample grievances (idempotent)
python seed.py
# Expected output:
# PostgreSQL seed completed successfully (10 departments, 4 users, 15 grievances).
```

> **Idempotency:** Running `python seed.py` multiple times safely skips existing departments (matched by `code`), users (matched by `email`), and grievances (matched by `reference_id`).

---

### Step 4: Start the Backend Server
```powershell
# From backend/ with venv activated
python run.py
```
This launches Uvicorn on `http://0.0.0.0:8000` with hot reload (`uvicorn app.main:app --reload`).
Verify at:
- Health Check: `http://localhost:8000/api/health`
- Swagger UI: `http://localhost:8000/docs`

---

### Step 5: Frontend Setup & Launch (`frontend/`)
Open a second terminal in the repository root:

```powershell
cd frontend

# 1. Install Node packages
npm install

# 2. Ensure frontend/.env points to your backend API
# VITE_API_URL=http://localhost:8000

# 3. Start Vite dev server (http://localhost:5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Environment Variables Reference

See the root [`.env.example`](../.env.example) and [`backend/.env.example`](../backend/.env.example). **Never commit real credentials or API keys.**

| Variable | Location | Required | Default / Example Placeholder | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `backend/.env` | Yes | `postgresql+asyncpg://postgres:your_password@localhost:5432/cm_kerala` | Async SQLAlchemy + `asyncpg` connection URI |
| `SECRET_KEY` | `backend/.env` | Yes | `replace-with-a-strong-random-jwt-secret` | HMAC secret for signing JWT access tokens |
| `ALGORITHM` | `backend/.env` | No | `HS256` | JWT cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_DAYS` | `backend/.env` | No | `7` | JWT validity duration in days |
| `GROQ_API_KEY` | `backend/.env` | Recommended | `your-groq-api-key-here` | Groq Cloud API key for `openai/gpt-oss-120b`; empty triggers labelled fallback classifier |
| `FRONTEND_URL` | `backend/.env` | No | `http://localhost:5173` | Allowed CORS origin for the React SPA |
| `PORT` | `backend/.env` | No | `8000` | Backend Uvicorn listening port |
| `VITE_API_URL` | `frontend/.env` | Yes | `http://localhost:8000` | Base URL consumed by Axios (`frontend/src/lib/api.ts`) |

---

## 4. Manual End-to-End Workflow Test Cases

Use the seeded demo credentials (`Demo@1234`) to verify every user role and workflow:

| Test ID | Workflow / Feature | Steps to Execute | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Public Stats & Departments** | Open `/`, `/departments`, and `/contact`. | Home page displays live counts (`15` total, `4` resolved, `11` pending, `10` departments). `/departments` lists 10 searchable Kerala departments. Contact form posts to `POST /api/contact` and shows success banner. |
| **TC-02** | **Public Grievance Tracking** | Open `/track` (logged out) and enter `GRV-20261101-TVM01`. | Displays Thiruvananthapuram road grievance, `HIGH` priority, `IN_PROGRESS` status, PWD assignment, CMO remarks, and history timeline without exposing citizen mobile. |
| **TC-03** | **Citizen Registration & Duplicate Email** | Open `/register` and register a new citizen account. Then retry registering with `citizen@demo.com`. | First registration returns `201` and redirects to `/citizen/dashboard`. Duplicate email returns `409 Conflict` (`"Email already registered"`). |
| **TC-04** | **AI Triage & Duplicate Detection** | Log in as `citizen@demo.com` -> `/citizen/submit`. Enter `"Severe potholes and waterlogging near Kazhakootam junction"` and click **Analyze with AI**. | Right panel displays AI suggestion (`Public Works Department`, `HIGH`, `<=100` char summary), green `AI (openai/gpt-oss-120b)` badge, and red duplicate risk alert referencing `GRV-20261101-TVM01`. |
| **TC-05** | **AI Fallback Classifier** | Temporarily clear `GROQ_API_KEY` in `backend/.env`, restart backend, and click **Analyze with AI**. | Returns HTTP `200` with `is_fallback: true`, orange `Fallback Classifier` badge, default classification (`Public Works Department`, `General`, `MEDIUM`), and local keyword duplicates if matched. |
| **TC-06** | **Submit Grievance + File Attachment** | Fill District, Subject, Description; optionally click **Apply AI Suggestions to Form**; attach a `.jpg` or `.pdf` (`<= 5 MB`); click **Submit Grievance**. | Modal displays generated `GRV-YYYYMMDD-XXXXX`. File uploads via `POST /api/grievances/{id}/attachments` and loads via `GET /uploads/...`. |
| **TC-07** | **CMO Analytics, Filters & Overdue View** | Log in as `cmo@demo.com` -> `/cmo/dashboard`. Inspect KPI cards, charts, and check **Overdue Only (>7d)**. | Displays 5 KPI cards (`Total`, `Pending`, `Resolved`, `Overdue (>7d)`, `Escalated`), 3 Recharts charts, and filters table to unresolved cases older than 7 days with `OVERDUE` tags. |
| **TC-08** | **CMO Remarks, Escalation & Dept Assignment** | Open the newly submitted grievance on `/cmo/grievances/:id`. Save CMO remarks, escalate case, and assign to `Public Works Department (PWD)`. | Remarks saved; escalation sets `is_escalated=true` and `priority=HIGH`; assignment sets `assigned_dept_id`, updates status to `IN_PROGRESS`, and adds timeline entries. |
| **TC-09** | **Officer Investigation & Resolution** | Log in as `officer@demo.com` -> `/officer/dashboard`. Open the assigned grievance. Change status to `UNDER_REVIEW`, save; then set status to `RESOLVED` with Action Taken Report, Resolution Details, and a report file. | Officer sees only `PWD` cases. Timeline records `UNDER_REVIEW` and `RESOLVED` updates; Citizen and CMO views show Action Report, Resolution Details, and officer attachment. |
| **TC-10** | **Citizen Feedback & Reopen Flow** | Log in as owning citizen -> open the `RESOLVED` grievance. Submit a `5`-star rating and comment. Then click **Not Satisfied? Reopen Grievance** and enter a reason. | Feedback saves via `POST /api/grievances/{id}/feedback`. Reopen transitions status to `REOPENED` and appends citizen's reopen reason to the timeline. |
| **TC-11** | **RBAC & Ownership Isolation** | As `citizen@demo.com`, attempt `GET /api/cmo/stats` or view another user's grievance ID. As `health.officer@demo.com`, attempt to open a `PWD` grievance. | Backend returns `403 Forbidden` (or `404` for out-of-department officer lookup); frontend `<ProtectedRoute>` redirects unauthorized roles to their own dashboard. |

---

## 5. Automated Build, Lint & API Verification Commands

> **Note on Test Suites:** This repository does not include a pre-written `pytest` directory; verification combines frontend TypeScript/linter checks, Alembic/seed integrity checks, and live API HTTP checks.

### 5.1 Frontend Lint & Production Build Verification
```powershell
cd frontend

# Run oxlint static checks
npm run lint

# Run TypeScript typecheck (tsc -b) + Vite production bundle
npm run build
```

### 5.2 Backend Migration & Seed Idempotency Check
```powershell
cd backend
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe seed.py
.\venv\Scripts\python.exe seed.py   # Second run confirms idempotency
```

### 5.3 Quick PowerShell API Smoke Test (against live `localhost:8000`)
```powershell
# 1. Health & Public Stats
Invoke-RestMethod -Uri "http://localhost:8000/api/health"
Invoke-RestMethod -Uri "http://localhost:8000/api/stats/public"
Invoke-RestMethod -Uri "http://localhost:8000/api/departments"

# 2. Login as Citizen & Test AI Triage
$loginBody = @{ email = "citizen@demo.com"; password = "Demo@1234" } | ConvertTo-Json
$auth = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/auth/login" -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($auth.data.token)" }

$aiBody = @{ description = "Broken streetlight and potholes on MG Road causing accidents at night" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/ai/analyze" -Headers $headers -ContentType "application/json" -Body $aiBody

# 3. Verify RBAC Blocks Citizen from CMO Stats (expects 403)
try {
    Invoke-RestMethod -Uri "http://localhost:8000/api/cmo/stats" -Headers $headers
} catch {
    $_.Exception.Response.StatusCode.value__   # Expected: 403
}
```
