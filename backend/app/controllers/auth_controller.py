from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import RegisterRequest, LoginRequest, UserOut
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.models.models import User


async def register_user(req: RegisterRequest, db: AsyncSession):
    if not req.name.strip() or not req.mobile.strip() or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="All fields required"
        )
    repo = UserRepository(db)
    existing = await repo.get_by_email(req.email.lower().strip())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = await repo.create(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        mobile=req.mobile.strip(),
        password_hash=hash_password(req.password),
        role="CITIZEN",
    )
    token = create_access_token(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "department_id": user.department_id,
        }
    )
    return {
        "success": True,
        "data": {
            "token": token,
            "user": UserOut.model_validate(user).model_dump(),
        },
    }


async def login_user(req: LoginRequest, db: AsyncSession):
    repo = UserRepository(db)
    user = await repo.get_by_email(req.email.lower().strip())
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_access_token(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "department_id": user.department_id,
        }
    )
    return {
        "success": True,
        "data": {
            "token": token,
            "user": UserOut.model_validate(user).model_dump(),
        },
    }


async def get_me(current_user: User):
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "mobile": current_user.mobile,
            "role": current_user.role,
            "department_id": current_user.department_id,
            "created_at": current_user.created_at,
            "department": (
                {"name": current_user.department.name}
                if current_user.department
                else None
            ),
        },
    }
