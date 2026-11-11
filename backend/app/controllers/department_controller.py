from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department_schema import DepartmentOut


async def get_departments(db: AsyncSession):
    depts = await DepartmentRepository(db).get_all()
    return {
        "success": True,
        "data": [DepartmentOut.model_validate(d).model_dump() for d in depts],
    }
