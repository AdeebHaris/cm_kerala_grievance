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

STOPWORDS = {
    "this", "that", "with", "from", "have", "been", "were", "they", "their",
    "there", "about", "which", "when", "what", "where", "very", "more", "some",
    "than", "also", "into", "over", "near", "here", "please", "kindly", "issue",
    "problem", "grievance", "complaint", "kerala", "days", "week", "month",
}


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


def _find_keyword_duplicates(description: str, recent_grievances: List[dict]) -> List[dict]:
    desc_tokens = _tokenize(description)
    if not desc_tokens or not recent_grievances:
        return []
    scored = []
    for g in recent_grievances:
        g_text = f"{g.get('subject', '')} {g.get('description', '')} {g.get('ai_summary', '')}"
        g_tokens = _tokenize(g_text)
        overlap = desc_tokens & g_tokens
        if len(overlap) >= 3 or (
            len(overlap) >= 2 and len(overlap) / max(len(desc_tokens | g_tokens), 1) >= 0.15
        ):
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
    description: str, recent_grievances: Optional[List[dict]] = None
) -> dict:
    recent = recent_grievances or []
    keyword_candidates = _find_keyword_duplicates(description, recent)
    recent_by_ref = {g["reference_id"]: g for g in recent if "reference_id" in g}

    recent_context = ""
    if recent:
        lines = [
            f"- {g['reference_id']} [{g['status']}] ({g.get('district', '')}): {g['subject']}"
            for g in recent[:10]
        ]
        recent_context = "\nRecent existing grievances for duplicate checking:\n" + "\n".join(lines)

    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant for the Kerala CM Grievance Portal. "
                        "Analyze grievances and return ONLY valid JSON, no markdown or extra text. "
                        f"Available departments (choose exact name): {', '.join(DEPARTMENTS)}. "
                        "Priority: LOW=minor, MEDIUM=daily life impact, HIGH=urgent/safety. "
                        "If the new grievance strongly overlaps with any recent existing grievances, "
                        "set is_duplicate_risk=true and list matching reference_ids in duplicate_ref_ids."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f'Analyze this grievance: "{description}"{recent_context}\n'
                        'Return ONLY valid JSON: {"department":"<exact department name>",'
                        '"category":"<short category>","priority":"LOW|MEDIUM|HIGH",'
                        '"summary":"<max 100 chars>","is_duplicate_risk":false,"duplicate_ref_ids":[]}'
                    ),
                },
            ],
            temperature=0.2,
            max_tokens=1024,
            response_format={"type": "json_object"},
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

        merged_candidates = []
        seen_refs = set()
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
        for c in keyword_candidates:
            if c["reference_id"] not in seen_refs:
                merged_candidates.append(c)
                seen_refs.add(c["reference_id"])

        is_dup = bool(parsed.get("is_duplicate_risk", False)) or len(merged_candidates) > 0

        return {
            "department": dept,
            "category": str(parsed.get("category", "General"))[:100],
            "priority": priority,
            "summary": str(parsed.get("summary", description[:100]))[:100],
            "is_duplicate_risk": is_dup,
            "duplicate_candidates": merged_candidates[:3],
            "model_used": MODEL_NAME,
            "is_fallback": False,
        }
    except Exception as e:
        return {
            "department": "Public Works Department",
            "category": "General",
            "priority": "MEDIUM",
            "summary": description[:100],
            "is_duplicate_risk": len(keyword_candidates) > 0,
            "duplicate_candidates": keyword_candidates,
            "model_used": MODEL_NAME,
            "is_fallback": True,
            "fallback_reason": str(e),
        }
