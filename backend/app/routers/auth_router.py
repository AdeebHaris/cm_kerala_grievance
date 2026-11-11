from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth_schema import RegisterRequest, LoginRequest
from app.controllers import auth_controller
from app.middlewares.auth_middleware import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.register_user(req, db)


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.login_user(req, db)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return await auth_controller.get_me(current_user)
