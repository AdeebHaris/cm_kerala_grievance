from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.grievance_repository import GrievanceRepository
from app.schemas.grievance_schema import OfficerUpdateRequest
from app.services.grievance_service import serialize_grievance
from app.models.models import User

VALID_OFFICER_STATUSES = {"IN_PROGRESS", "UNDER_REVIEW", "RESOLVED", "REOPENED"}


async def get_officer_grievances(
    status_filter: Optional[str], current_user: User, db: AsyncSession
):
    if not current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No department assigned"
        )
    repo = GrievanceRepository(db)
    grievances = await repo.get_by_dept(
        current_user.department_id, status_filter=status_filter or None
    )
    return {
        "success": True,
        "data": [
            serialize_grievance(
                g,
                include_citizen=True,
                include_dept=True,
                include_history=True,
            )
            for g in grievances
        ],
    }


async def get_officer_grievance_by_id(gid: str, current_user: User, db: AsyncSession):
    if not current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No department assigned"
        )
    repo = GrievanceRepository(db)
    g = await repo.get_by_id_and_dept(gid, current_user.department_id)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    return {
        "success": True,
        "data": serialize_grievance(
            g,
            include_citizen=True,
            include_dept=True,
            include_history=True,
            include_attachments=True,
            include_assignments=True,
        ),
    }


async def update_officer_grievance(
    gid: str, req: OfficerUpdateRequest, current_user: User, db: AsyncSession
):
    if not current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No department assigned"
        )
    if req.status and req.status not in VALID_OFFICER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status"
        )
    repo = GrievanceRepository(db)
    g = await repo.get_by_id_and_dept(gid, current_user.department_id)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )

    if req.status:
        g.status = req.status
        await repo.add_history(
            gid,
            req.status,
            req.remarks or "Updated by department officer",
            current_user.id,
        )
    elif req.remarks:
        await repo.add_history(gid, g.status, req.remarks, current_user.id)

    if req.action_report is not None or req.resolution_details is not None:
        await repo.update_assignment_report(
            grievance_id=gid,
            department_id=current_user.department_id,
            assigned_by_id=current_user.id,
            action_report=req.action_report,
            resolution_details=req.resolution_details,
        )

    await db.commit()
    return {"success": True, "message": "Grievance updated successfully"}
