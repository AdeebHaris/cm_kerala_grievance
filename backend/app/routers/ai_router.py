from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.common_schema import AIAnalyzeRequest
from app.controllers import ai_controller
from app.middlewares.auth_middleware import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/analyze")
async def analyze_grievance(
    req: AIAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ai_controller.analyze_grievance_ai(req, db)
