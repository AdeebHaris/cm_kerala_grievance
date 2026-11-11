from pydantic import BaseModel
from typing import Optional


class GrievanceCreate(BaseModel):
    district: str
    category: str
    subject: str
    description: str
    priority: Optional[str] = "MEDIUM"
    ai_summary: Optional[str] = None
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_department: Optional[str] = None
    is_duplicate_risk: Optional[bool] = False


class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReopenRequest(BaseModel):
    reason: str


class AssignRequest(BaseModel):
    department_id: str
    remarks: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    remarks: Optional[str] = None


class RemarksRequest(BaseModel):
    remarks: str


class EscalateRequest(BaseModel):
    remarks: Optional[str] = None


class OfficerUpdateRequest(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    action_report: Optional[str] = None
    resolution_details: Optional[str] = None
