import json
import re
from typing import List, Optional
from openai import AsyncOpenAI
from app.config import settings

MODEL_NAME = "openai/gpt-oss-120b"

client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

DEPARTMENTS = [
    "Public Works Department",
    "Health Services",
    "Education Department",
    "Revenue Department",
    "Water Resources",
    "Kerala State Electricity Board",
    "Agriculture Department",
    "Transport Department",
    "Forest Department",
    "Social Welfare Department",
]

DEPARTMENT_ALIASES = {
    "public works": "Public Works Department",
    "pwd": "Public Works Department",
    "health": "Health Services",
    "health services": "Health Services",
    "education": "Education Department",
    "revenue": "Revenue Department",
    "water": "Water Resources",
    "water resources": "Water Resources",
    "electricity": "Kerala State Electricity Board",
    "electricity board": "Kerala State Electricity Board",
    "kseb": "Kerala State Electricity Board",
    "agriculture": "Agriculture Department",
    "transport": "Transport Department",
    "forest": "Forest Department",
    "forest department": "Forest Department",
    "social welfare": "Social Welfare Department",
}

DISTRICT_ALIASES = {
    "trivandrum": "Thiruvananthapuram",
    "thiruvananthapuram": "Thiruvananthapuram",
    "kollam": "Kollam",
    "quilon": "Kollam",
    "pathanamthitta": "Pathanamthitta",
    "alappuzha": "Alappuzha",
    "alleppey": "Alappuzha",
    "kottayam": "Kottayam",
    "idukki": "Idukki",
    "ernakulam": "Ernakulam",
    "kochi": "Ernakulam",
    "cochin": "Ernakulam",
    "thrissur": "Thrissur",
    "trichur": "Thrissur",
    "palakkad": "Palakkad",
    "palghat": "Palakkad",
    "malappuram": "Malappuram",
    "kozhikode": "Kozhikode",
    "calicut": "Kozhikode",
    "wayanad": "Wayanad",
    "kannur": "Kannur",
    "cannanor": "Kannur",
    "kasaragod": "Kasaragod",
}

STOPWORDS = {
    "this", "that", "with", "from", "have", "been", "were", "they", "their",
    "there", "about", "which", "when", "what", "where", "very", "more", "some",
    "than", "also", "into", "over", "near", "here", "please", "kindly", "issue",
    "problem", "grievance", "complaint", "kerala", "keralam", "days", "week", "month",
    "road", "roads", "street", "streets", "area", "water", "heavy", "work", "works",
    "action", "public", "people", "accident", "accidents", "damage", "damaged",
    "broken", "danger", "dangerous", "traffic", "vehicle", "vehicles", "daily",
    "morning", "evening", "night", "drain", "drainage", "overflow", "leakage",
    "culvert", "railing", "bridge", "pipe", "pipes", "pothole", "potholes",
    "supply", "cleaning", "waste", "garbage", "cable", "cables", "power",
    "electric", "electricity", "light", "lights", "station", "urgent",
    "immediately", "authorities", "concerned", "resident", "residents",
    "facing", "severe", "causing", "since", "yesterday", "today", "tomorrow",
}


def _detect_district(text: str) -> Optional[str]:
    lowered = (text or "").lower()
    for alias, canonical in DISTRICT_ALIASES.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", lowered):
            return canonical
    return None


CATEGORIES = [
    "Roads & Infrastructure",
    "Water Supply & Sanitation",
    "Electricity & Power",
    "Healthcare & Hospitals",
    "Education & Schools",
    "Revenue & Land Records",
    "Agriculture & Irrigation",
    "Public Transport",
    "Forest & Environment",
    "Social Welfare & Pensions",
    "General",
]


def _normalize_category(raw_cat: str) -> str:
    if not raw_cat:
        return "General"
    cleaned = raw_cat.strip()
    for cat in CATEGORIES:
        if cleaned.lower() == cat.lower():
            return cat
    low = cleaned.lower()
    if any(k in low for k in ["road", "pothole", "bridge", "culvert", "street", "highway", "traffic", "pavement"]):
        return "Roads & Infrastructure"
    if any(k in low for k in ["water", "pipe", "leak", "sewage", "drain", "drainage", "tap", "drinking"]):
        return "Water Supply & Sanitation"
    if any(k in low for k in ["electric", "power", "kseb", "light", "wire", "cable", "transformer", "outage"]):
        return "Electricity & Power"
    if any(k in low for k in ["health", "hospital", "doctor", "clinic", "medicine", "sanitation", "disease", "food safety"]):
        return "Healthcare & Hospitals"
    if any(k in low for k in ["school", "education", "college", "teacher", "student", "classroom"]):
        return "Education & Schools"
    if any(k in low for k in ["land", "revenue", "pattayam", "certificate", "tax", "village office"]):
        return "Revenue & Land Records"
    if any(k in low for k in ["farm", "agriculture", "crop", "paddy", "irrigation", "krishi"]):
        return "Agriculture & Irrigation"
    if any(k in low for k in ["bus", "transport", "ksrtc", "vehicle", "route"]):
        return "Public Transport"
    if any(k in low for k in ["forest", "wildlife", "animal", "tree", "environment", "nature"]):
        return "Forest & Environment"
    if any(k in low for k in ["pension", "welfare", "disability", "senior", "allowance", "widow"]):
        return "Social Welfare & Pensions"
    return "General"


def _normalize_department(raw_dept: str) -> str:
    if not raw_dept:
        return "Public Works Department"
    cleaned = raw_dept.strip()
    if cleaned in DEPARTMENTS:
        return cleaned
    lowered = cleaned.lower()
    if lowered in DEPARTMENT_ALIASES:
        return DEPARTMENT_ALIASES[lowered]
    for dept in DEPARTMENTS:
        if lowered in dept.lower() or dept.lower() in lowered:
            return dept
    return "Public Works Department"


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z]{4,}", (text or "").lower())
    return {w for w in words if w not in STOPWORDS}


def _find_keyword_duplicates(
    description: str, recent_grievances: List[dict], district: Optional[str] = None
) -> List[dict]:
    desc_tokens = _tokenize(description)
    if not desc_tokens or not recent_grievances:
        return []
    scored = []
    effective_district = district or _detect_district(description)
    for g in recent_grievances:
        # Strictly require same district to avoid false cross-district duplicate alerts
        if effective_district and g.get("district") and g.get("district") != effective_district:
            continue
        g_text = f"{g.get('subject', '')} {g.get('description', '')} {g.get('ai_summary', '')}"
        g_tokens = _tokenize(g_text)
        overlap = desc_tokens & g_tokens
        # Require genuine location/name overlap (at least 3 distinctive proper nouns/location tokens)
        if len(overlap) >= 3 and len(overlap) / max(len(desc_tokens | g_tokens), 1) >= 0.2:
            scored.append((len(overlap), g))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "reference_id": g["reference_id"],
            "subject": g["subject"],
            "status": g["status"],
        }
        for _, g in scored[:3]
    ]


async def analyze_grievance(
    description: str,
    district: Optional[str] = None,
    recent_grievances: Optional[List[dict]] = None,
) -> dict:
    effective_district = district or _detect_district(description)
    recent = recent_grievances or []
    if effective_district:
        recent = [g for g in recent if not g.get("district") or g.get("district") == effective_district]

    keyword_candidates = _find_keyword_duplicates(
        description, recent, district=effective_district
    )
    recent_by_ref = {g["reference_id"]: g for g in recent if "reference_id" in g}

    recent_context = ""
    if recent:
        lines = [
            f"- {g['reference_id']} [{g['status']}] ({g.get('district', '')}): {g['subject']}"
            for g in recent[:10]
        ]
        recent_context = "\nRecent existing grievances for duplicate checking:\n" + "\n".join(lines)

    clean_desc = (description or "").replace('"', "'").strip()
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant for the Kerala CM Grievance Portal. "
                "You must return ONLY a single valid JSON object, without markdown formatting or code blocks. "
                f"Available departments (choose exact name): {', '.join(DEPARTMENTS)}. "
                f"Available categories (choose exact name): {', '.join(CATEGORIES)}. "
                "Priority: LOW=minor, MEDIUM=daily life impact, HIGH=urgent/safety."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Analyze this grievance:\n{clean_desc}\n{recent_context}\n\n"
                "Return a JSON object with this exact structure:\n"
                "{\n"
                '  "department": "<one of the exact department names above>",\n'
                '  "category": "<one of the exact category names above>",\n'
                '  "subject": "<informative title under 80 chars>",\n'
                '  "priority": "LOW" | "MEDIUM" | "HIGH",\n'
                '  "summary": "<one sentence briefing under 100 chars>",\n'
                '  "is_duplicate_risk": false,\n'
                '  "duplicate_ref_ids": []\n'
                "}"
            ),
        },
    ]

    try:
        response = None
        # Try primary model with json_object
        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                temperature=0.1,
                max_tokens=1024,
                response_format={"type": "json_object"},
            )
        except Exception:
            # If Groq strict JSON validator returns 400 or fails, call without response_format and extract JSON
            try:
                response = await client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024,
                )
            except Exception:
                # Secondary fallback model on Groq
                response = await client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024,
                )

        content = (response.choices[0].message.content or "").strip()
        match = re.search(r"\{[\s\S]*\}", content)
        if not match:
            raise ValueError("Model response did not contain JSON")

        parsed = json.loads(match.group())
        priority = str(parsed.get("priority", "MEDIUM")).upper()
        if priority not in {"LOW", "MEDIUM", "HIGH"}:
            priority = "MEDIUM"

        dept = _normalize_department(str(parsed.get("department", "")))

        suggested_subject = str(parsed.get("subject") or parsed.get("title") or "").strip()
        if not suggested_subject:
            first_sentence = description.split(".")[0].strip()
            suggested_subject = first_sentence[:80] if len(first_sentence) > 5 else description[:80].strip()

        merged_candidates = []
        seen_refs = set()
        is_llm_flagged = bool(parsed.get("is_duplicate_risk", False))
        for ref_id in parsed.get("duplicate_ref_ids") or []:
            if ref_id in recent_by_ref and ref_id not in seen_refs:
                g = recent_by_ref[ref_id]
                merged_candidates.append(
                    {
                        "reference_id": g["reference_id"],
                        "subject": g["subject"],
                        "status": g["status"],
                    }
                )
                seen_refs.add(ref_id)

        # Only add keyword candidates if they were verified in the same district
        for c in keyword_candidates:
            if c["reference_id"] not in seen_refs:
                merged_candidates.append(c)
                seen_refs.add(c["reference_id"])

        # True duplicate risk requires either LLM confirmation or confirmed same-district overlap
        is_dup = len(merged_candidates) > 0 and (is_llm_flagged or bool(effective_district))

        return {
            "department": dept,
            "category": _normalize_category(str(parsed.get("category", ""))),
            "subject": suggested_subject[:120],
            "priority": priority,
            "summary": str(parsed.get("summary", description[:100]))[:100],
            "is_duplicate_risk": is_dup,
            "duplicate_candidates": merged_candidates[:3],
            "model_used": MODEL_NAME,
            "is_fallback": False,
        }
    except Exception as e:
        first_sentence = description.split(".")[0].strip()
        fallback_subject = first_sentence[:80] if len(first_sentence) > 5 else description[:80].strip()
        return {
            "department": "Public Works Department",
            "category": _normalize_category(description),
            "subject": fallback_subject,
            "priority": "MEDIUM",
            "summary": description[:100],
            "is_duplicate_risk": len(keyword_candidates) > 0 and bool(effective_district),
            "duplicate_candidates": keyword_candidates,
            "model_used": MODEL_NAME,
            "is_fallback": True,
            "fallback_reason": "Rule-based classifier applied",
        }
