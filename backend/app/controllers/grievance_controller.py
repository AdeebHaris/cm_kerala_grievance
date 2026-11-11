import os
import time
import random
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.grievance_repository import GrievanceRepository
from app.schemas.grievance_schema import GrievanceCreate, FeedbackCreate, ReopenRequest
from app.services.grievance_service import generate_reference_id, serialize_grievance
from app.models.models import User

ALLOWED_EXTENSIONS = {".jpeg", ".jpg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt"}
MAX_FILE_SIZE = 5 * 1024 * 1024


async def submit_grievance(req: GrievanceCreate, current_user: User, db: AsyncSession):
    if (
        not req.district.strip()
        or not req.category.strip()
        or not req.subject.strip()
        or not req.description.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing required fields"
        )
    repo = GrievanceRepository(db)
    ref_id = generate_reference_id()
    while await repo.get_by_reference_id(ref_id):
        ref_id = generate_reference_id()

    priority = (req.priority or "MEDIUM").upper()
    if priority not in {"LOW", "MEDIUM", "HIGH"}:
        priority = "MEDIUM"

    g = await repo.create(
        reference_id=ref_id,
        citizen_id=current_user.id,
        district=req.district.strip(),
        category=req.category.strip(),
        subject=req.subject.strip(),
        description=req.description.strip(),
        priority=priority,
        status="SUBMITTED",
        ai_summary=req.ai_summary,
        ai_category=req.ai_category,
        ai_priority=req.ai_priority,
        ai_department=req.ai_department,
        is_duplicate_risk=bool(req.is_duplicate_risk),
    )
    await repo.add_history(
        g.id, "SUBMITTED", "Grievance submitted by citizen", current_user.id
    )
    await db.commit()
    created = await repo.get_by_id(g.id)
    return {
        "success": True,
        "data": serialize_grievance(created),
        "message": f"Grievance submitted. Reference ID: {ref_id}",
    }


async def track_grievance(ref_id: str, db: AsyncSession):
    repo = GrievanceRepository(db)
    g = await repo.get_by_reference_id(ref_id.strip())
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
            include_feedback=True,
        ),
    }


async def get_my_grievances(current_user: User, db: AsyncSession):
    repo = GrievanceRepository(db)
    grievances = await repo.get_by_citizen(current_user.id)
    return {
        "success": True,
        "data": [
            serialize_grievance(
                g,
                include_citizen=False,
                include_dept=True,
                include_history=True,
            )
            for g in grievances
        ],
    }


async def get_grievance_detail(gid: str, current_user: User, db: AsyncSession):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    if current_user.role == "CITIZEN" and g.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
    if (
        current_user.role == "OFFICER"
        and g.assigned_dept_id != current_user.department_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
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
            include_feedback=True,
        ),
    }


async def reopen_grievance(
    gid: str, req: ReopenRequest, current_user: User, db: AsyncSession
):
    if not req.reason or not req.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Reopen reason is required"
        )
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g or g.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    if g.status != "RESOLVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only resolved grievances can be reopened",
        )
    g.status = "REOPENED"
    await repo.add_history(gid, "REOPENED", req.reason.strip(), current_user.id)
    await db.commit()
    updated = await repo.get_by_id(gid)
    return {
        "success": True,
        "data": serialize_grievance(
            updated,
            include_dept=True,
            include_history=True,
            include_assignments=True,
            include_feedback=True,
        ),
        "message": "Grievance reopened",
    }


async def submit_feedback(
    gid: str, req: FeedbackCreate, current_user: User, db: AsyncSession
):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g or g.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    if g.status != "RESOLVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only give feedback on resolved grievances",
        )
    if not (1 <= req.rating <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )
    fb = await repo.upsert_feedback(gid, req.rating, req.comment)
    return {
        "success": True,
        "data": {
            "id": fb.id,
            "grievance_id": fb.grievance_id,
            "rating": fb.rating,
            "comment": fb.comment,
            "submitted_at": fb.submitted_at,
        },
    }


async def upload_attachment(
    gid: str, file: UploadFile, current_user: User, db: AsyncSession
):
    repo = GrievanceRepository(db)
    g = await repo.get_by_id(gid)
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found"
        )
    if (
        current_user.role == "CITIZEN" and g.citizen_id != current_user.id
    ) or (
        current_user.role == "OFFICER"
        and g.assigned_dept_id != current_user.department_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    original_name = file.filename or "attachment"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type"
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit",
        )

    os.makedirs("uploads", exist_ok=True)
    unique_name = f"{int(time.time() * 1000)}-{random.randint(100000, 999999)}{ext}"
    file_path = os.path.join("uploads", unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    att = await repo.add_attachment(
        grievance_id=gid,
        url=f"/uploads/{unique_name}",
        filename=original_name,
        file_type=file.content_type or "application/octet-stream",
        uploaded_by_id=current_user.id,
    )
    return {
        "success": True,
        "data": {
            "id": att.id,
            "grievance_id": att.grievance_id,
            "url": att.url,
            "filename": att.filename,
            "file_type": att.file_type,
            "uploaded_by_id": att.uploaded_by_id,
            "created_at": att.created_at,
        },
    }


async def get_public_stats(db: AsyncSession):
    stats = await GrievanceRepository(db).get_public_stats()
    return {"success": True, "data": stats}
