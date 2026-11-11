from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.models import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str):
        r = await self.db.execute(select(User).where(User.email == email))
        return r.scalar_one_or_none()

    async def get_by_id(self, user_id: str):
        r = await self.db.execute(
            select(User)
            .options(selectinload(User.department))
            .where(User.id == user_id)
        )
        return r.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        u = User(**kwargs)
        self.db.add(u)
        await self.db.commit()
        await self.db.refresh(u)
        return u
