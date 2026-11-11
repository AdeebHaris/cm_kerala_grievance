from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department_id: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    token: str
    user: UserOut
