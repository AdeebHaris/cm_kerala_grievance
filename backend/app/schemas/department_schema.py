from pydantic import BaseModel
from datetime import datetime

class DepartmentOut(BaseModel):
    id: str
    name: str
    description: str
    code: str
    created_at: datetime
    model_config = {"from_attributes": True}
