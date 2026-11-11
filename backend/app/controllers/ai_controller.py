from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.grievance_repository import GrievanceRepository
from app.schemas.common_schema import AIAnalyzeRequest
from app.services.ai_service import analyze_grievance


async def analyze_grievance_ai(req: AIAnalyzeRequest, db: AsyncSession):
    if not req.description or len(req.description.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Description too short"
        )
    # Filter recent grievances by the user's selected district to prevent false cross-district duplicate alerts
    recent_grievances = await GrievanceRepository(db).get_recent_summaries(
        district=req.district, limit=25
    )
    result = await analyze_grievance(
        req.description.strip(),
        district=req.district,
        recent_grievances=recent_grievances,
    )
    return {"success": True, "data": result}
