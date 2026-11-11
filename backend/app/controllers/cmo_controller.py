from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.grievance_repository import GrievanceRepository
from app.repositories.department_repository import DepartmentRepository
from app.schemas.grievance_schema import (
    AssignRequest,
    StatusUpdateRequest,
    RemarksRequest,
    EscalateRequest,
)
from app.services.grievance_service import serialize_grievance
from app.models.models import User

VALID_CMO_STATUSES = {"SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REOPENED"}


async def get_all_grievances(
    district: Optional[str],
    category: Optional[str],
    priority: Optional[str],
    status_filter: Optional[str],
    page: int,
    limit: int,
    db: AsyncSession,
):
    repo = GrievanceRepository(db)
    safe_page = max(page, 1)
    safe_limit = max(min(limit, 100), 1)
    skip = (safe_page - 1) * safe_limit
    grievances = await repo.get_all(
        district=district or None,
        category=category or None,
        priority=priority or None,
        status=status_filter or None,
        skip=skip,
        limit=safe_limit,
    )
    total = await repo.count_all(
        district=district or None,
        category=category or None,
        priority=priority or None,
        status=status_filter or None,
    )
    return {
        "success": True,
        "data": {
            "grievances": [
                serialize_grievance(
                    g,
                    include_citizen=True,
                    include_citizen_mobile=True,
                    include_dept=True,
                )
                for g in grievances
            ],
            "total": total,
            "page": safe_page,
            "limit": safe_limit,
        },
    }


async def get_grievance_by_id(gid: str, db: AsyncSession):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    return {
        "success": True,
        "data": serialize_grievance(
            g,
            include_citizen=True,
            include_citizen_mobile=True,
            include_dept=True,
            include_history=True,
            include_attachments=True,
            include_assignments=True,
            include_feedback=True,
        ),
    }


async def assign_grievance(
    gid: str, req: AssignRequest, current_user: User, db: AsyncSession
):
    g_repo = GrievanceRepository(db)
    d_repo = DepartmentRepository(db)
    g = await g_repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    dept = await d_repo.get_by_id(req.department_id)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Department not found"
        )
    g.assigned_dept_id = req.department_id
    g.status = "IN_PROGRESS"
    await g_repo.add_history(
        gid,
        "IN_PROGRESS",
        req.remarks or f"Forwarded to {dept.name}",
        current_user.id,
    )
    await g_repo.add_assignment(gid, req.department_id, current_user.id)
    await db.commit()
    updated = await g_repo.get_by_id(gid)
    return {
        "success": True,
        "data": serialize_grievance(
            updated,
            include_citizen=True,
            include_citizen_mobile=True,
            include_dept=True,
            include_history=True,
            include_assignments=True,
        ),
        "message": f"Grievance assigned to {dept.name}",
    }


async def add_remarks(gid: str, req: RemarksRequest, db: AsyncSession):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    await repo.update(g, cmo_remarks=req.remarks)
    updated = await repo.get_by_id(gid)
    return {"success": True, "data": serialize_grievance(updated)}


async def update_status(
    gid: str, req: StatusUpdateRequest, current_user: User, db: AsyncSession
):
    if req.status not in VALID_CMO_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status"
        )
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    g.status = req.status
    await repo.add_history(gid, req.status, req.remarks, current_user.id)
    await db.commit()
    updated = await repo.get_by_id(gid)
    return {
        "success": True,
        "data": serialize_grievance(updated, include_history=True),
    }


async def escalate_grievance(
    gid: str, req: EscalateRequest, current_user: User, db: AsyncSession
):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    g.is_escalated = True
    g.escalated_at = datetime.utcnow()
    g.priority = "HIGH"
    remarks = (req.remarks or "").strip() or "Escalated by CMO due to delay"
    await repo.add_history(gid, g.status, remarks, current_user.id)
    await db.commit()
    updated = await repo.get_by_id(gid)
    return {
        "success": True,
        "data": serialize_grievance(
            updated,
            include_citizen=True,
            include_dept=True,
            include_history=True,
            include_assignments=True,
        ),
        "message": "Grievance escalated to HIGH priority",
    }


async def get_stats(db: AsyncSession):
    repo = GrievanceRepository(db)
    stats = await repo.get_stats()
    return {"success": True, "data": stats}
