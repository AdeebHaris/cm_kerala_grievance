from pydantic import BaseModel
from typing import Any, Optional

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class AIAnalyzeRequest(BaseModel):
    description: str
    district: Optional[str] = None
    subject: Optional[str] = None
