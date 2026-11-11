from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.controllers import department_controller

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("")
@router.get("/", include_in_schema=False)
async def get_departments(db: AsyncSession = Depends(get_db)):
    return await department_controller.get_departments(db)
