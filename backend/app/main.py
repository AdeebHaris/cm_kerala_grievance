import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, update, delete
from app.config import settings
from app.database import engine, Base, get_db, AsyncSessionLocal
from app.models.models import Grievance, DepartmentAssignment
from app.controllers import grievance_controller
from app.routers import (
    auth_router,
    grievance_router,
    cmo_router,
    officer_router,
    department_router,
    ai_router,
    contact_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Automatically normalize any legacy grievance categories in live PostgreSQL database
    try:
        async with AsyncSessionLocal() as db:
            category_migration = {
                "Roads & Bridges": "Roads & Infrastructure",
                "Water Supply": "Water Supply & Sanitation",
                "Electricity": "Electricity & Power",
                "Healthcare": "Healthcare & Hospitals",
                "Education": "Education & Schools",
                "Revenue & Land": "Revenue & Land Records",
                "Agriculture": "Agriculture & Irrigation",
                "Wildlife & Forest": "Forest & Environment",
                "Social Welfare": "Social Welfare & Pensions",
            }
            for old_cat, new_cat in category_migration.items():
                await db.execute(
                    update(Grievance)
                    .where(Grievance.category == old_cat)
                    .values(category=new_cat)
                )

            # Reset GRV-20261114-KSD14 to unassigned and not escalated
            res = await db.execute(select(Grievance).where(Grievance.reference_id == "GRV-20261114-KSD14"))
            ksd14 = res.scalar_one_or_none()
            if ksd14:
                ksd14.assigned_dept_id = None
                ksd14.status = "SUBMITTED"
                ksd14.is_escalated = False
                ksd14.escalated_at = None
                ksd14.cmo_remarks = None
                ksd14.action_report = None
                ksd14.resolution_details = None
                await db.execute(delete(DepartmentAssignment).where(DepartmentAssignment.grievance_id == ksd14.id))

            await db.commit()
    except Exception as e:
        print(f"Startup check warning: {e}")

    yield


app = FastAPI(
    title="CM Kerala Grievance Portal API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        settings.FRONTEND_URL,
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "detail": exc.detail},
    )


os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router.router)
app.include_router(grievance_router.router)
app.include_router(cmo_router.router)
app.include_router(officer_router.router)
app.include_router(department_router.router)
app.include_router(ai_router.router)
app.include_router(contact_router.router)


@app.get("/api/stats/public", tags=["Public Stats"])
async def public_stats(db: AsyncSession = Depends(get_db)):
    return await grievance_controller.get_public_stats(db)


@app.get("/api/health", tags=["Health"])
async def health():
    return {"success": True, "message": "CM Kerala API running", "version": "1.0.0"}


@app.get("/api/public/reset-ksd14", tags=["Demo Reset"])
async def reset_ksd14_endpoint(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Grievance).where(Grievance.reference_id == "GRV-20261114-KSD14"))
    g = res.scalar_one_or_none()
    if g:
        g.assigned_dept_id = None
        g.status = "SUBMITTED"
        g.is_escalated = False
        g.escalated_at = None
        g.cmo_remarks = None
        g.action_report = None
        g.resolution_details = None
        await db.execute(delete(DepartmentAssignment).where(DepartmentAssignment.grievance_id == g.id))
        await db.commit()
        return {"success": True, "message": "GRV-20261114-KSD14 successfully reset to SUBMITTED, unassigned, and not escalated"}
    return {"success": False, "message": "Grievance GRV-20261114-KSD14 not found"}
