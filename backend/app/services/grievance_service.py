import random
import string
from datetime import datetime
from app.models.models import Grievance


def generate_reference_id() -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"GRV-{date_str}-{suffix}"


def serialize_grievance(
    g: Grievance,
    include_citizen: bool = False,
    include_citizen_mobile: bool = False,
    include_dept: bool = False,
    include_history: bool = False,
    include_attachments: bool = False,
    include_assignments: bool = False,
    include_feedback: bool = False,
) -> dict:
    data = {
        "id": g.id,
        "reference_id": g.reference_id,
        "citizen_id": g.citizen_id,
        "district": g.district,
        "category": g.category,
        "subject": g.subject,
        "description": g.description,
        "priority": g.priority,
        "status": g.status,
        "assigned_dept_id": g.assigned_dept_id,
        "ai_summary": g.ai_summary,
        "ai_category": g.ai_category,
        "ai_priority": g.ai_priority,
        "ai_department": g.ai_department,
        "is_duplicate_risk": g.is_duplicate_risk,
        "is_escalated": bool(g.is_escalated),
        "escalated_at": g.escalated_at,
        "cmo_remarks": g.cmo_remarks,
        "created_at": g.created_at,
        "updated_at": g.updated_at,
    }
    if include_citizen and "citizen" in g.__dict__ and g.citizen:
        citizen_data = {
            "id": g.citizen.id,
            "name": g.citizen.name,
            "email": g.citizen.email,
        }
        if include_citizen_mobile:
            citizen_data["mobile"] = g.citizen.mobile
        data["citizen"] = citizen_data
    if include_dept:
        data["assigned_dept"] = (
            {
                "id": g.assigned_dept.id,
                "name": g.assigned_dept.name,
                "description": g.assigned_dept.description,
                "code": g.assigned_dept.code,
            }
            if "assigned_dept" in g.__dict__ and g.assigned_dept
            else None
        )
    if include_history:
        data["history"] = [
            {
                "id": h.id,
                "grievance_id": h.grievance_id,
                "status": h.status,
                "remarks": h.remarks,
                "changed_by_id": h.changed_by_id,
                "changed_at": h.changed_at,
                "changed_by": (
                    {"name": h.changed_by.name, "role": h.changed_by.role}
                    if "changed_by" in h.__dict__ and h.changed_by
                    else None
                ),
            }
            for h in (g.history or [])
        ]
    if include_attachments:
        data["attachments"] = [
            {
                "id": a.id,
                "grievance_id": a.grievance_id,
                "url": a.url,
                "filename": a.filename,
                "file_type": a.file_type,
                "uploaded_by_id": a.uploaded_by_id,
                "created_at": a.created_at,
            }
            for a in (g.attachments or [])
        ]
    if include_assignments:
        data["assignments"] = [
            {
                "id": asgn.id,
                "grievance_id": asgn.grievance_id,
                "department_id": asgn.department_id,
                "assigned_by_id": asgn.assigned_by_id,
                "assigned_at": asgn.assigned_at,
                "action_report": asgn.action_report,
                "resolution_details": asgn.resolution_details,
                "department": (
                    {
                        "id": asgn.department.id,
                        "name": asgn.department.name,
                        "code": asgn.department.code,
                    }
                    if "department" in asgn.__dict__ and asgn.department
                    else None
                ),
                "assigned_by": (
                    {"name": asgn.assigned_by.name}
                    if "assigned_by" in asgn.__dict__ and asgn.assigned_by
                    else None
                ),
            }
            for asgn in (g.assignments or [])
        ]
    if include_feedback:
        data["feedback"] = (
            {
                "id": g.feedback.id,
                "grievance_id": g.feedback.grievance_id,
                "rating": g.feedback.rating,
                "comment": g.feedback.comment,
                "submitted_at": g.feedback.submitted_at,
            }
            if "feedback" in g.__dict__ and g.feedback
            else None
        )
    return data
