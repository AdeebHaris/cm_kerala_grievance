from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.common_schema import ContactCreate
from app.controllers import contact_controller

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def submit_contact(req: ContactCreate, db: AsyncSession = Depends(get_db)):
    return await contact_controller.submit_contact(req, db)
