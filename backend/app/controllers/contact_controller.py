from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.contact_repository import ContactRepository
from app.schemas.common_schema import ContactCreate


async def submit_contact(req: ContactCreate, db: AsyncSession):
    if (
        not req.name.strip()
        or not req.email.strip()
        or not req.subject.strip()
        or not req.message.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="All fields required"
        )
    enquiry = await ContactRepository(db).create(
        name=req.name.strip(),
        email=req.email.strip(),
        subject=req.subject.strip(),
        message=req.message.strip(),
    )
    return {
        "success": True,
        "data": {
            "id": enquiry.id,
            "name": enquiry.name,
            "email": enquiry.email,
            "subject": enquiry.subject,
            "message": enquiry.message,
            "submitted_at": enquiry.submitted_at,
        },
        "message": "Your message has been sent",
    }
