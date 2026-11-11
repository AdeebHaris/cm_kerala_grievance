from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Department


class DepartmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        r = await self.db.execute(select(Department).order_by(Department.name))
        return r.scalars().all()

    async def get_by_id(self, dept_id: str):
        r = await self.db.execute(select(Department).where(Department.id == dept_id))
        return r.scalar_one_or_none()
