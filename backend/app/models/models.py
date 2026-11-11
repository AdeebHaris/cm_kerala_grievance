import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="CITIZEN")
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship(
        "Department", back_populates="officers", foreign_keys=[department_id]
    )
    grievances = relationship(
        "Grievance", back_populates="citizen", foreign_keys="Grievance.citizen_id"
    )
    history_entries = relationship("GrievanceHistory", back_populates="changed_by")
    assignments = relationship("DepartmentAssignment", back_populates="assigned_by")
    attachments = relationship("Attachment", back_populates="uploaded_by")


class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    officers = relationship(
        "User", back_populates="department", foreign_keys="User.department_id"
    )
    grievances = relationship("Grievance", back_populates="assigned_dept")
    assignments = relationship("DepartmentAssignment", back_populates="department")


class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(String, primary_key=True, default=gen_uuid)
    reference_id = Column(String(30), unique=True, nullable=False, index=True)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    district = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(10), nullable=False, default="MEDIUM")
    status = Column(String(20), nullable=False, default="SUBMITTED")
    assigned_dept_id = Column(String, ForeignKey("departments.id"), nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_category = Column(String(100), nullable=True)
    ai_priority = Column(String(10), nullable=True)
    ai_department = Column(String(100), nullable=True)
    is_duplicate_risk = Column(Boolean, default=False)
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime, nullable=True)
    cmo_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship(
        "User", back_populates="grievances", foreign_keys=[citizen_id]
    )
    assigned_dept = relationship("Department", back_populates="grievances")
    history = relationship(
        "GrievanceHistory",
        back_populates="grievance",
        order_by="GrievanceHistory.changed_at",
    )
    attachments = relationship("Attachment", back_populates="grievance")
    assignments = relationship("DepartmentAssignment", back_populates="grievance")
    feedback = relationship("CitizenFeedback", back_populates="grievance", uselist=False)


class GrievanceHistory(Base):
    __tablename__ = "grievance_history"
    id = Column(String, primary_key=True, default=gen_uuid)
    grievance_id = Column(String, ForeignKey("grievances.id"), nullable=False)
    status = Column(String(20), nullable=False)
    remarks = Column(Text, nullable=True)
    changed_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    grievance = relationship("Grievance", back_populates="history")
    changed_by = relationship("User", back_populates="history_entries")


class DepartmentAssignment(Base):
    __tablename__ = "department_assignments"
    id = Column(String, primary_key=True, default=gen_uuid)
    grievance_id = Column(String, ForeignKey("grievances.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    assigned_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    action_report = Column(Text, nullable=True)
    resolution_details = Column(Text, nullable=True)

    grievance = relationship("Grievance", back_populates="assignments")
    department = relationship("Department", back_populates="assignments")
    assigned_by = relationship("User", back_populates="assignments")


class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(String, primary_key=True, default=gen_uuid)
    grievance_id = Column(String, ForeignKey("grievances.id"), nullable=False)
    url = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    grievance = relationship("Grievance", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="attachments")


class CitizenFeedback(Base):
    __tablename__ = "citizen_feedback"
    id = Column(String, primary_key=True, default=gen_uuid)
    grievance_id = Column(
        String, ForeignKey("grievances.id"), unique=True, nullable=False
    )
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    grievance = relationship("Grievance", back_populates="feedback")


class ContactEnquiry(Base):
    __tablename__ = "contact_enquiries"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
