from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.grievance_schema import GrievanceCreate, FeedbackCreate, ReopenRequest
from app.controllers import grievance_controller
from app.middlewares.auth_middleware import get_current_user, require_role
from app.models.models import User

router = APIRouter(prefix="/api/grievances", tags=["Grievances"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def submit_grievance(
    req: GrievanceCreate,
    current_user: User = Depends(require_role("CITIZEN", "CMO_ADMIN", "OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.submit_grievance(req, current_user, db)


@router.get("/my")
async def get_my_grievances(
    current_user: User = Depends(require_role("CITIZEN", "CMO_ADMIN", "OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.get_my_grievances(current_user, db)


@router.get("/track/{ref_id}")
async def track_grievance(ref_id: str, db: AsyncSession = Depends(get_db)):
    return await grievance_controller.track_grievance(ref_id, db)


@router.get("/{id}")
async def get_grievance_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.get_grievance_detail(id, current_user, db)


@router.post("/{id}/reopen")
async def reopen_grievance(
    id: str,
    req: ReopenRequest,
    current_user: User = Depends(require_role("CITIZEN")),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.reopen_grievance(id, req, current_user, db)


@router.post("/{id}/feedback")
async def submit_feedback(
    id: str,
    req: FeedbackCreate,
    current_user: User = Depends(require_role("CITIZEN")),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.submit_feedback(id, req, current_user, db)


@router.post("/{id}/attachments")
async def upload_attachment(
    id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await grievance_controller.upload_attachment(id, file, current_user, db)
