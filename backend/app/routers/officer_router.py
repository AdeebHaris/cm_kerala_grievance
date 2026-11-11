from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.grievance_schema import OfficerUpdateRequest
from app.controllers import officer_controller
from app.middlewares.auth_middleware import require_role
from app.models.models import User

router = APIRouter(prefix="/api/officer", tags=["Department Officer"])


@router.get("/grievances")
async def get_officer_grievances(
    status: Optional[str] = Query(default=None),
    current_user: User = Depends(require_role("OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    return await officer_controller.get_officer_grievances(status, current_user, db)


@router.get("/grievances/{id}")
async def get_officer_grievance_by_id(
    id: str,
    current_user: User = Depends(require_role("OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    return await officer_controller.get_officer_grievance_by_id(id, current_user, db)


@router.patch("/grievances/{id}/update")
async def update_officer_grievance(
    id: str,
    req: OfficerUpdateRequest,
    current_user: User = Depends(require_role("OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    return await officer_controller.update_officer_grievance(id, req, current_user, db)
