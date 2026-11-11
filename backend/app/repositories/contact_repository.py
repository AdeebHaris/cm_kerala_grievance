from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import ContactEnquiry


class ContactRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> ContactEnquiry:
        c = ContactEnquiry(**kwargs)
        self.db.add(c)
        await self.db.commit()
        await self.db.refresh(c)
        return c
