from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
from app.models.models import (
    Grievance,
    GrievanceHistory,
    DepartmentAssignment,
    Attachment,
    CitizenFeedback,
    Department,
)

CATEGORY_FILTER_MAP = {
    "Roads & Infrastructure": ["Roads & Infrastructure", "Roads & Bridges", "Roads"],
    "Water Supply & Sanitation": ["Water Supply & Sanitation", "Water Supply", "Water"],
    "Electricity & Power": ["Electricity & Power", "Electricity", "Power"],
    "Healthcare & Hospitals": ["Healthcare & Hospitals", "Healthcare", "Health"],
    "Education & Schools": ["Education & Schools", "Education", "Schools"],
    "Revenue & Land Records": ["Revenue & Land Records", "Revenue & Land", "Revenue", "Land"],
    "Agriculture & Irrigation": ["Agriculture & Irrigation", "Agriculture", "Irrigation"],
    "Public Transport": ["Public Transport", "Transport"],
    "Forest & Environment": ["Forest & Environment", "Wildlife & Forest", "Forest"],
    "Social Welfare & Pensions": ["Social Welfare & Pensions", "Social Welfare", "Welfare"],
}


def _category_filter_condition(cat: str):
    aliases = CATEGORY_FILTER_MAP.get(cat, [cat])
    primary = cat.split("&")[0].strip() if "&" in cat else cat.split()[0].strip()
    return or_(
        Grievance.category.in_(aliases),
        Grievance.category.ilike(f"%{primary}%"),
    )


class GrievanceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Grievance:
        g = Grievance(**kwargs)
        self.db.add(g)
        await self.db.flush()
        return g

    async def get_by_reference_id(self, ref_id: str) -> Optional[Grievance]:
        r = await self.db.execute(
            select(Grievance)
            .options(
                selectinload(Grievance.citizen),
                selectinload(Grievance.assigned_dept),
                selectinload(Grievance.history).selectinload(GrievanceHistory.changed_by),
                selectinload(Grievance.attachments),
                selectinload(Grievance.feedback),
            )
            .where(Grievance.reference_id == ref_id)
        )
        return r.scalar_one_or_none()

    async def get_by_id(self, gid: str) -> Optional[Grievance]:
        r = await self.db.execute(
            select(Grievance)
            .options(
                selectinload(Grievance.citizen),
                selectinload(Grievance.assigned_dept),
                selectinload(Grievance.history).selectinload(GrievanceHistory.changed_by),
                selectinload(Grievance.attachments),
                selectinload(Grievance.assignments).selectinload(DepartmentAssignment.department),
                selectinload(Grievance.assignments).selectinload(DepartmentAssignment.assigned_by),
                selectinload(Grievance.feedback),
            )
            .where(Grievance.id == gid)
        )
        return r.scalar_one_or_none()

    async def get_by_id_and_dept(self, gid: str, dept_id: str) -> Optional[Grievance]:
        r = await self.db.execute(
            select(Grievance)
            .options(
                selectinload(Grievance.citizen),
                selectinload(Grievance.assigned_dept),
                selectinload(Grievance.history).selectinload(GrievanceHistory.changed_by),
                selectinload(Grievance.attachments),
                selectinload(Grievance.assignments).selectinload(DepartmentAssignment.department),
                selectinload(Grievance.assignments).selectinload(DepartmentAssignment.assigned_by),
                selectinload(Grievance.feedback),
            )
            .where(and_(Grievance.id == gid, Grievance.assigned_dept_id == dept_id))
        )
        return r.scalar_one_or_none()

    async def get_by_citizen(self, citizen_id: str) -> List[Grievance]:
        r = await self.db.execute(
            select(Grievance)
            .options(
                selectinload(Grievance.assigned_dept),
                selectinload(Grievance.history),
            )
            .where(Grievance.citizen_id == citizen_id)
            .order_by(Grievance.created_at.desc())
        )
        return r.scalars().all()

    async def get_recent_summaries(
        self, district: Optional[str] = None, limit: int = 25
    ) -> List[dict]:
        q = select(
            Grievance.reference_id,
            Grievance.subject,
            Grievance.description,
            Grievance.ai_summary,
            Grievance.status,
            Grievance.district,
            Grievance.category,
            Grievance.created_at,
        ).order_by(Grievance.created_at.desc())
        if district:
            q = q.where(Grievance.district == district)
        r = await self.db.execute(q.limit(limit))
        return [
            {
                "reference_id": row[0],
                "subject": row[1],
                "description": row[2],
                "ai_summary": row[3] or "",
                "status": row[4],
                "district": row[5],
                "category": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
            }
            for row in r.all()
        ]

    async def get_all(
        self,
        district: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Grievance]:
        q = select(Grievance).options(
            selectinload(Grievance.citizen),
            selectinload(Grievance.assigned_dept),
        )
        filters = []
        if district:
            filters.append(Grievance.district == district)
        if category:
            filters.append(_category_filter_condition(category))
        if priority:
            filters.append(Grievance.priority == priority)
        if status:
            filters.append(Grievance.status == status)
        if filters:
            q = q.where(and_(*filters))
        r = await self.db.execute(
            q.order_by(Grievance.created_at.desc()).offset(skip).limit(limit)
        )
        return r.scalars().all()

    async def count_all(
        self,
        district: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
    ) -> int:
        q = select(func.count()).select_from(Grievance)
        filters = []
        if district:
            filters.append(Grievance.district == district)
        if category:
            filters.append(_category_filter_condition(category))
        if priority:
            filters.append(Grievance.priority == priority)
        if status:
            filters.append(Grievance.status == status)
        if filters:
            q = q.where(and_(*filters))
        r = await self.db.execute(q)
        return r.scalar() or 0

    async def get_by_dept(
        self, dept_id: str, status_filter: Optional[str] = None
    ) -> List[Grievance]:
        filters = [Grievance.assigned_dept_id == dept_id]
        if status_filter:
            filters.append(Grievance.status == status_filter)
        else:
            filters.append(
                Grievance.status.in_(
                    ["IN_PROGRESS", "UNDER_REVIEW", "REOPENED", "RESOLVED"]
                )
            )
        r = await self.db.execute(
            select(Grievance)
            .options(
                selectinload(Grievance.citizen),
                selectinload(Grievance.assigned_dept),
                selectinload(Grievance.history),
            )
            .where(and_(*filters))
            .order_by(Grievance.created_at.desc())
        )
        return r.scalars().all()

    async def update(self, g: Grievance, **kwargs):
        for k, v in kwargs.items():
            setattr(g, k, v)
        await self.db.commit()
        await self.db.refresh(g)
        return g

    async def add_history(
        self,
        grievance_id: str,
        status: str,
        remarks: Optional[str],
        changed_by_id: str,
    ):
        entry = GrievanceHistory(
            grievance_id=grievance_id,
            status=status,
            remarks=remarks,
            changed_by_id=changed_by_id,
        )
        self.db.add(entry)
        return entry

    async def add_assignment(
        self,
        grievance_id: str,
        department_id: str,
        assigned_by_id: str,
    ):
        assignment = DepartmentAssignment(
            grievance_id=grievance_id,
            department_id=department_id,
            assigned_by_id=assigned_by_id,
        )
        self.db.add(assignment)
        return assignment

    async def update_assignment_report(
        self,
        grievance_id: str,
        department_id: str,
        assigned_by_id: str,
        action_report: Optional[str] = None,
        resolution_details: Optional[str] = None,
    ):
        r = await self.db.execute(
            select(DepartmentAssignment)
            .where(
                and_(
                    DepartmentAssignment.grievance_id == grievance_id,
                    DepartmentAssignment.department_id == department_id,
                )
            )
            .order_by(DepartmentAssignment.assigned_at.desc())
        )
        assignment = r.scalars().first()
        if not assignment:
            assignment = DepartmentAssignment(
                grievance_id=grievance_id,
                department_id=department_id,
                assigned_by_id=assigned_by_id,
            )
            self.db.add(assignment)
        if action_report is not None:
            assignment.action_report = action_report
        if resolution_details is not None:
            assignment.resolution_details = resolution_details
        return assignment

    async def upsert_feedback(
        self, grievance_id: str, rating: int, comment: Optional[str]
    ):
        r = await self.db.execute(
            select(CitizenFeedback).where(CitizenFeedback.grievance_id == grievance_id)
        )
        fb = r.scalar_one_or_none()
        if fb:
            fb.rating = rating
            fb.comment = comment
        else:
            fb = CitizenFeedback(
                grievance_id=grievance_id, rating=rating, comment=comment
            )
            self.db.add(fb)
        await self.db.commit()
        await self.db.refresh(fb)
        return fb

    async def add_attachment(
        self,
        grievance_id: str,
        url: str,
        filename: str,
        file_type: str,
        uploaded_by_id: str,
    ):
        a = Attachment(
            grievance_id=grievance_id,
            url=url,
            filename=filename,
            file_type=file_type,
            uploaded_by_id=uploaded_by_id,
        )
        self.db.add(a)
        await self.db.commit()
        await self.db.refresh(a)
        return a

    async def get_stats(self):
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        t = (
            await self.db.execute(select(func.count()).select_from(Grievance))
        ).scalar() or 0
        p = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(
                    Grievance.status.in_(
                        ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "REOPENED"]
                    )
                )
            )
        ).scalar() or 0
        res = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(Grievance.status == "RESOLVED")
            )
        ).scalar() or 0
        ov = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(
                    and_(
                        Grievance.status.in_(
                            ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "REOPENED"]
                        ),
                        Grievance.created_at < seven_days_ago,
                    )
                )
            )
        ).scalar() or 0
        esc = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(Grievance.is_escalated == True)
            )
        ).scalar() or 0
        bs = (
            await self.db.execute(
                select(Grievance.status, func.count()).group_by(Grievance.status)
            )
        ).all()
        bd = (
            await self.db.execute(
                select(Grievance.district, func.count())
                .group_by(Grievance.district)
                .order_by(func.count().desc())
                .limit(14)
            )
        ).all()
        bdept = (
            await self.db.execute(
                select(Department.name, func.count(Grievance.id))
                .join(Grievance, Grievance.assigned_dept_id == Department.id)
                .group_by(Department.name)
            )
        ).all()
        return {
            "total": t,
            "pending": p,
            "resolved": res,
            "overdue": ov,
            "escalated": esc,
            "by_status": [{"status": r[0], "count": r[1]} for r in bs],
            "by_district": [{"district": r[0], "count": r[1]} for r in bd],
            "by_department": [{"department": r[0], "count": r[1]} for r in bdept],
        }

    async def get_public_stats(self):
        t = (
            await self.db.execute(select(func.count()).select_from(Grievance))
        ).scalar() or 0
        res = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(Grievance.status == "RESOLVED")
            )
        ).scalar() or 0
        p = (
            await self.db.execute(
                select(func.count())
                .select_from(Grievance)
                .where(
                    Grievance.status.in_(
                        ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "REOPENED"]
                    )
                )
            )
        ).scalar() or 0
        dept_count = (
            await self.db.execute(select(func.count()).select_from(Department))
        ).scalar() or 0
        return {
            "total": t,
            "resolved": res,
            "pending": p,
            "departments_count": dept_count,
        }
