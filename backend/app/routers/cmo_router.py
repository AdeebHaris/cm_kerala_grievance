from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.grievance_schema import (
    AssignRequest,
    RemarksRequest,
    StatusUpdateRequest,
    EscalateRequest,
)
from app.controllers import cmo_controller
from app.middlewares.auth_middleware import require_role
from app.models.models import User

router = APIRouter(prefix="/api/cmo", tags=["CMO Admin"])


@router.get("/grievances")
async def get_all_grievances(
    district: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.get_all_grievances(
        district, category, priority, status, page, limit, db
    )


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.get_stats(db)


@router.get("/grievances/{id}")
async def get_grievance_by_id(
    id: str,
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.get_grievance_by_id(id, db)


@router.patch("/grievances/{id}/assign")
async def assign_grievance(
    id: str,
    req: AssignRequest,
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.assign_grievance(id, req, current_user, db)


@router.patch("/grievances/{id}/remarks")
async def add_remarks(
    id: str,
    req: RemarksRequest,
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.add_remarks(id, req, db)


@router.patch("/grievances/{id}/status")
async def update_status(
    id: str,
    req: StatusUpdateRequest,
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.update_status(id, req, current_user, db)


@router.patch("/grievances/{id}/escalate")
async def escalate_grievance(
    id: str,
    req: EscalateRequest,
    current_user: User = Depends(require_role("CMO_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    return await cmo_controller.escalate_grievance(id, req, current_user, db)
