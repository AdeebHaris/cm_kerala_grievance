import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import engine, AsyncSessionLocal, Base
from app.models.models import (
    User,
    Department,
    Grievance,
    GrievanceHistory,
    DepartmentAssignment,
    CitizenFeedback,
    ContactEnquiry,
)
from app.services.auth_service import hash_password

DEPARTMENTS_DATA = [
    {
        "name": "Public Works Department",
        "code": "PWD",
        "description": "State highways, district roads, bridges, culverts, and public building maintenance across Kerala.",
    },
    {
        "name": "Health Services",
        "code": "HLTH",
        "description": "Government medical colleges, taluk hospitals, primary health centres, and public sanitation.",
    },
    {
        "name": "Education Department",
        "code": "EDU",
        "description": "Government schools, higher secondary infrastructure, midday meal programs, and digital classrooms.",
    },
    {
        "name": "Revenue Department",
        "code": "REV",
        "description": "Land records, pattayam issuance, village offices, disaster relief compensation, and certificates.",
    },
    {
        "name": "Water Resources",
        "code": "WTR",
        "description": "Drinking water supply pipelines, irrigation canals, borewells, and watershed conservation.",
    },
    {
        "name": "Kerala State Electricity Board",
        "code": "KSEB",
        "description": "Power distribution lines, transformers, streetlights, outage restoration, and rural electrification.",
    },
    {
        "name": "Agriculture Department",
        "code": "AGRI",
        "description": "Crop insurance, paddy procurement, farmer subsidies, soil testing, and Krishi Bhavan services.",
    },
    {
        "name": "Transport Department",
        "code": "TRNS",
        "description": "KSRTC bus schedules, rural route permits, road safety signage, and motor vehicle services.",
    },
    {
        "name": "Forest Department",
        "code": "FRST",
        "description": "Human-wildlife conflict mitigation, solar fencing, forest boundary protection, and eco-conservation.",
    },
    {
        "name": "Social Welfare Department",
        "code": "SWD",
        "description": "Welfare pensions, senior citizen care, disability support, women & child welfare schemes.",
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Departments (idempotent)
        dept_map = {}
        for d_info in DEPARTMENTS_DATA:
            res = await db.execute(
                select(Department).where(Department.code == d_info["code"])
            )
            dept = res.scalar_one_or_none()
            if not dept:
                dept = Department(**d_info)
                db.add(dept)
                await db.flush()
            dept_map[d_info["code"]] = dept
        await db.commit()

        # Refresh dept references
        for code in list(dept_map.keys()):
            res = await db.execute(select(Department).where(Department.code == code))
            dept_map[code] = res.scalar_one()

        # 2. Seed Demo Users (idempotent)
        demo_pw_hash = hash_password("Demo@1234")
        users_spec = [
            {
                "email": "citizen@demo.com",
                "name": "Rahul Nair",
                "mobile": "9847012345",
                "role": "CITIZEN",
                "department_id": None,
            },
            {
                "email": "cmo@demo.com",
                "name": "CMO Administrator",
                "mobile": "9847000001",
                "role": "CMO_ADMIN",
                "department_id": None,
            },
            # Department Officers for all 10 Departments
            {
                "email": "officer@demo.com",
                "name": "Suresh Kumar",
                "mobile": "9847098765",
                "role": "OFFICER",
                "department_id": dept_map["PWD"].id,
            },
            {
                "email": "health.officer@demo.com",
                "name": "Dr. Meera Menon",
                "mobile": "9847055555",
                "role": "OFFICER",
                "department_id": dept_map["HLTH"].id,
            },
            {
                "email": "edu.officer@demo.com",
                "name": "Prof. Thomas Mathew",
                "mobile": "9847011111",
                "role": "OFFICER",
                "department_id": dept_map["EDU"].id,
            },
            {
                "email": "rev.officer@demo.com",
                "name": "Geetha Krishnan",
                "mobile": "9847022222",
                "role": "OFFICER",
                "department_id": dept_map["REV"].id,
            },
            {
                "email": "water.officer@demo.com",
                "name": "Rajeev Nambiar",
                "mobile": "9847033333",
                "role": "OFFICER",
                "department_id": dept_map["WTR"].id,
            },
            {
                "email": "kseb.officer@demo.com",
                "name": "Vinod Chandran",
                "mobile": "9847044444",
                "role": "OFFICER",
                "department_id": dept_map["KSEB"].id,
            },
            {
                "email": "agri.officer@demo.com",
                "name": "Suma Varma",
                "mobile": "9847066666",
                "role": "OFFICER",
                "department_id": dept_map["AGRI"].id,
            },
            {
                "email": "trans.officer@demo.com",
                "name": "Deepa R. Nair",
                "mobile": "9847077777",
                "role": "OFFICER",
                "department_id": dept_map["TRNS"].id,
            },
            {
                "email": "forest.officer@demo.com",
                "name": "Manoj K. V.",
                "mobile": "9847088888",
                "role": "OFFICER",
                "department_id": dept_map["FRST"].id,
            },
            {
                "email": "social.officer@demo.com",
                "name": "Lakshmi Priya",
                "mobile": "9847099999",
                "role": "OFFICER",
                "department_id": dept_map["SWD"].id,
            },
        ]

        user_map = {}
        for u_spec in users_spec:
            res = await db.execute(select(User).where(User.email == u_spec["email"]))
            user = res.scalar_one_or_none()
            if not user:
                user = User(
                    name=u_spec["name"],
                    email=u_spec["email"],
                    mobile=u_spec["mobile"],
                    password_hash=demo_pw_hash,
                    role=u_spec["role"],
                    department_id=u_spec["department_id"],
                )
                db.add(user)
                await db.flush()
            else:
                user.name = u_spec["name"]
                user.role = u_spec["role"]
                user.department_id = u_spec["department_id"]
                user.password_hash = demo_pw_hash
            user_map[u_spec["email"]] = user
        await db.commit()

        citizen = user_map["citizen@demo.com"]
        cmo = user_map["cmo@demo.com"]
        officer_by_dept = {
            "PWD": user_map["officer@demo.com"],
            "HLTH": user_map["health.officer@demo.com"],
            "EDU": user_map["edu.officer@demo.com"],
            "REV": user_map["rev.officer@demo.com"],
            "WTR": user_map["water.officer@demo.com"],
            "KSEB": user_map["kseb.officer@demo.com"],
            "AGRI": user_map["agri.officer@demo.com"],
            "TRNS": user_map["trans.officer@demo.com"],
            "FRST": user_map["forest.officer@demo.com"],
            "SWD": user_map["social.officer@demo.com"],
        }
        pwd_officer = user_map["officer@demo.com"]
        health_officer = user_map["health.officer@demo.com"]

        # 3. Seed 15 Grievances across all 14 Kerala districts (idempotent by reference_id)
        now = datetime.utcnow()
        grievances_spec = [
            {
                "reference_id": "GRV-20261101-TVM01",
                "district": "Thiruvananthapuram",
                "category": "Roads & Infrastructure",
                "subject": "Severe potholes and waterlogging near Kazhakootam bypass",
                "description": "The service road near Kazhakootam Technopark junction has developed deep potholes causing daily traffic bottlenecks and two-wheeler accidents during evening rains.",
                "priority": "HIGH",
                "status": "IN_PROGRESS",
                "dept_code": "PWD",
                "days_ago": 10,
                "is_escalated": True,
                "cmo_remarks": "Priority repair requested before monsoon intensification.",
                "action_report": "Site inspection completed by Assistant Engineer. Patch material sanctioned.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261102-KLM02",
                "district": "Kollam",
                "category": "Water Supply & Sanitation",
                "subject": "Irregular drinking water supply in Chavara coastal ward",
                "description": "Piped drinking water has been disrupted for six consecutive days in Ward 12 of Chavara panchayat due to a burst main valve.",
                "priority": "HIGH",
                "status": "UNDER_REVIEW",
                "dept_code": "WTR",
                "days_ago": 9,
                "is_escalated": False,
                "cmo_remarks": "Water Resources dept instructed to deploy emergency tankers.",
                "action_report": "Valve replacement spare ordered; temporary tanker service initiated.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261103-PTA03",
                "district": "Pathanamthitta",
                "category": "Electricity & Power",
                "subject": "Frequent voltage fluctuations damaging appliances in Adoor",
                "description": "Low voltage and frequent tripping from the 11kV feeder near Adoor Central has been affecting homes and small clinics for two weeks.",
                "priority": "MEDIUM",
                "status": "IN_PROGRESS",
                "dept_code": "KSEB",
                "days_ago": 6,
                "is_escalated": False,
                "cmo_remarks": "KSEB electrical division instructed to inspect line and balance phase loads.",
                "action_report": "11kV line patrolling completed; transformer tap setting adjusted and load balanced.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261104-ALP04",
                "district": "Alappuzha",
                "category": "Agriculture & Irrigation",
                "subject": "Delayed paddy procurement payment in Kuttanad block",
                "description": "Farmers who supplied paddy during the Puncha harvest at Mankombu procurement centre are still awaiting bank credit after 45 days.",
                "priority": "HIGH",
                "status": "IN_PROGRESS",
                "dept_code": "AGRI",
                "days_ago": 12,
                "is_escalated": True,
                "cmo_remarks": "Coordinate with Civil Supplies and Agriculture wing immediately.",
                "action_report": "Verification of 38 farmer receipts completed; payment batch uploaded.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261105-KTM05",
                "district": "Kottayam",
                "category": "Healthcare & Hospitals",
                "subject": "Shortage of insulin and pediatric doctors at PHC Ettumanoor",
                "description": "Patients visiting the primary health centre report unavailability of routine diabetes medication and absence of evening OP duty doctor.",
                "priority": "HIGH",
                "status": "IN_PROGRESS",
                "dept_code": "HLTH",
                "days_ago": 8,
                "is_escalated": False,
                "cmo_remarks": "Forwarded to District Medical Officer for urgent stock replenishment.",
                "action_report": "KMSCL emergency indent raised; temporary medical officer deputed.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261106-IDK06",
                "district": "Idukki",
                "category": "Forest & Environment",
                "subject": "Damaged solar fencing near Munnar settlement causing elephant entry",
                "description": "A 400-meter stretch of solar fencing bordering Chinnakanal estate has collapsed, allowing wild elephants into residential lanes at night.",
                "priority": "HIGH",
                "status": "UNDER_REVIEW",
                "dept_code": "FRST",
                "days_ago": 5,
                "is_escalated": False,
                "cmo_remarks": "Rapid Response Team alerted.",
                "action_report": "Forest range officer inspected perimeter and submitted estimate.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261107-EKM07",
                "district": "Ernakulam",
                "category": "Public Transport",
                "subject": "Need additional morning KSRTC buses on Aluva-Kakkanad Infopark route",
                "description": "Commuters face severe overcrowding between 8:30 AM and 10:00 AM along the Seaport-Airport road corridor.",
                "priority": "MEDIUM",
                "status": "RESOLVED",
                "dept_code": "TRNS",
                "days_ago": 14,
                "is_escalated": False,
                "cmo_remarks": "Approved for schedule optimization.",
                "action_report": "Passenger load survey conducted during peak hours.",
                "resolution_details": "Two additional low-floor KSRTC trips introduced at 8:40 AM and 9:10 AM from Aluva depot.",
                "feedback": {"rating": 5, "comment": "Additional buses started within a week. Very helpful!"},
            },
            {
                "reference_id": "GRV-20261108-TSR08",
                "district": "Thrissur",
                "category": "Roads & Infrastructure",
                "subject": "Broken culvert railing on Guruvayur-Kunnamkulam link road",
                "description": "Guard rails on the narrow culvert near Choondal have rusted and broken off, posing serious danger to school buses.",
                "priority": "HIGH",
                "status": "IN_PROGRESS",
                "dept_code": "PWD",
                "days_ago": 6,
                "is_escalated": False,
                "cmo_remarks": "Assigned to PWD Thrissur division.",
                "action_report": "Temporary reflective barricades installed; fabrication of steel rails underway.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261109-PKD09",
                "district": "Palakkad",
                "category": "Revenue & Land Records",
                "subject": "Pending mutation and digital land tax update in Ottapalam village",
                "description": "Application for pokkuvaravu mutation filed three months ago remains pending without field verification date.",
                "priority": "LOW",
                "status": "IN_PROGRESS",
                "dept_code": "REV",
                "days_ago": 3,
                "is_escalated": False,
                "cmo_remarks": "Village office directed to complete field verification within 48 hours.",
                "action_report": "Notice issued to applicant; boundary survey and field verification scheduled.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261110-MLP10",
                "district": "Malappuram",
                "category": "Education & Schools",
                "subject": "Roof leakage in Government LP School classrooms at Tirur",
                "description": "Two classrooms in the old block leak heavily during rain, forcing students to share the hall.",
                "priority": "MEDIUM",
                "status": "RESOLVED",
                "dept_code": "EDU",
                "days_ago": 16,
                "is_escalated": False,
                "cmo_remarks": "Sanctioned under school maintenance grant.",
                "action_report": "Engineering wing assessed roof trusses and tile damage.",
                "resolution_details": "Roof sheets replaced and waterproofing completed before reopening.",
                "feedback": {"rating": 4, "comment": "Work completed properly before rains worsened."},
            },
            {
                "reference_id": "GRV-20261111-KKD11",
                "district": "Kozhikode",
                "category": "Healthcare & Hospitals",
                "subject": "Request for fogging and drainage cleaning near Beach Hospital ward",
                "description": "Stagnant water in blocked roadside drains behind Kozhikode Beach Hospital is causing mosquito breeding and dengue fear.",
                "priority": "HIGH",
                "status": "RESOLVED",
                "dept_code": "HLTH",
                "days_ago": 11,
                "is_escalated": False,
                "cmo_remarks": "Coordinated with Corporation Health Wing.",
                "action_report": "Vector control unit dispatched for anti-larval spraying.",
                "resolution_details": "Drains desilted and three rounds of thermal fogging completed.",
                "feedback": {"rating": 5, "comment": "Prompt action by the health team."},
            },
            {
                "reference_id": "GRV-20261112-WYD12",
                "district": "Wayanad",
                "category": "Social Welfare & Pensions",
                "subject": "Old-age welfare pension biometric verification issue in Kalpetta",
                "description": "Several bedridden senior citizens in Meppadi gram panchayat are unable to complete fingerprint mustering for pension renewal.",
                "priority": "MEDIUM",
                "status": "IN_PROGRESS",
                "dept_code": "SWD",
                "days_ago": 4,
                "is_escalated": False,
                "cmo_remarks": "Direct home-visit verification ordered.",
                "action_report": "Panchayat welfare officer scheduled door-to-door iris verification.",
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261113-KNR13",
                "district": "Kannur",
                "category": "Roads & Infrastructure",
                "subject": "Streetlight non-functional along Thalassery-Mahe highway stretch",
                "description": "Over 25 LED streetlights have remained off for three weeks along the newly widened bridge approach, causing safety hazards.",
                "priority": "MEDIUM",
                "status": "REOPENED",
                "dept_code": "PWD",
                "days_ago": 15,
                "is_escalated": False,
                "cmo_remarks": "Reopened after citizen reported partial outage persisted.",
                "action_report": "Initial timer switch replaced, however underground cable fault detected in Sector 2.",
                "resolution_details": "First phase restored; cable trenching re-scheduled.",
            },
            {
                "reference_id": "GRV-20261114-KSD14",
                "district": "Kasaragod",
                "category": "Water Supply & Sanitation",
                "subject": "Salinity intrusion in Bekal coastal drinking water well project",
                "description": "Residents near Bekal fort coastal belt are getting brackish water from the public borewell network since last month.",
                "priority": "HIGH",
                "status": "SUBMITTED",
                "dept_code": None,
                "days_ago": 1,
                "is_escalated": False,
                "cmo_remarks": None,
                "action_report": None,
                "resolution_details": None,
            },
            {
                "reference_id": "GRV-20261115-TVM15",
                "district": "Thiruvananthapuram",
                "category": "Roads & Infrastructure",
                "subject": "Pedestrian zebra crossing and footpath repair near Medical College",
                "description": "Broken concrete slabs on the footpath outside Thiruvananthapuram Medical College gate are making it difficult for wheelchair users and elderly patients.",
                "priority": "MEDIUM",
                "status": "RESOLVED",
                "dept_code": "PWD",
                "days_ago": 18,
                "is_escalated": False,
                "cmo_remarks": "Completed and verified.",
                "action_report": "Damaged footpath slabs lifted and accessible ramp constructed.",
                "resolution_details": "New interlocking tiles, tactile paving, and fresh zebra crossing markings laid.",
                "feedback": {"rating": 5, "comment": "Very clean footpath and ramp installed."},
            },
            {
                "reference_id": "GRV-20261116-KNR16",
                "district": "Kannur",
                "category": "Forest & Environment",
                "subject": "Wild boar menace damaging tapioca and plantain crops in Iritty",
                "description": "Farming families in Iritty hilly area report severe nocturnal crop damage by wild boar herds; request immediate forest squad action.",
                "priority": "HIGH",
                "status": "SUBMITTED",
                "dept_code": None,
                "days_ago": 1,
                "is_escalated": False,
                "cmo_remarks": None,
                "action_report": None,
                "resolution_details": None,
            },
        ]

        for spec in grievances_spec:
            res = await db.execute(
                select(Grievance).where(Grievance.reference_id == spec["reference_id"])
            )
            existing_g = res.scalar_one_or_none()
            if existing_g:
                continue

            created_at = now - timedelta(days=spec["days_ago"])
            dept_id = dept_map[spec["dept_code"]].id if spec["dept_code"] else None
            dept_name = dept_map[spec["dept_code"]].name if spec["dept_code"] else "Public Works Department"

            g = Grievance(
                reference_id=spec["reference_id"],
                citizen_id=citizen.id,
                district=spec["district"],
                category=spec["category"],
                subject=spec["subject"],
                description=spec["description"],
                priority=spec["priority"],
                status=spec["status"],
                assigned_dept_id=dept_id,
                ai_summary=spec["subject"][:100],
                ai_category=spec["category"],
                ai_priority=spec["priority"],
                ai_department=dept_name,
                is_duplicate_risk=False,
                is_escalated=spec["is_escalated"],
                escalated_at=(created_at + timedelta(days=7)) if spec["is_escalated"] else None,
                cmo_remarks=spec["cmo_remarks"],
                created_at=created_at,
                updated_at=created_at + timedelta(days=1),
            )
            db.add(g)
            await db.flush()

            # Initial submission history
            db.add(
                GrievanceHistory(
                    grievance_id=g.id,
                    status="SUBMITTED",
                    remarks="Grievance submitted by citizen",
                    changed_by_id=citizen.id,
                    changed_at=created_at,
                )
            )

            # Assignment & progress history
            if dept_id:
                db.add(
                    DepartmentAssignment(
                        grievance_id=g.id,
                        department_id=dept_id,
                        assigned_by_id=cmo.id,
                        assigned_at=created_at + timedelta(hours=6),
                        action_report=spec["action_report"],
                        resolution_details=spec["resolution_details"],
                    )
                )
                db.add(
                    GrievanceHistory(
                        grievance_id=g.id,
                        status="IN_PROGRESS",
                        remarks=f"Forwarded to {dept_name}",
                        changed_by_id=cmo.id,
                        changed_at=created_at + timedelta(hours=6),
                    )
                )

                officer_actor = officer_by_dept.get(
                    spec["dept_code"], pwd_officer
                )

                if spec["status"] == "UNDER_REVIEW":
                    db.add(
                        GrievanceHistory(
                            grievance_id=g.id,
                            status="UNDER_REVIEW",
                            remarks=spec["action_report"] or "Submitted to CMO for review",
                            changed_by_id=officer_actor.id,
                            changed_at=created_at + timedelta(days=1),
                        )
                    )
                elif spec["status"] == "RESOLVED":
                    db.add(
                        GrievanceHistory(
                            grievance_id=g.id,
                            status="RESOLVED",
                            remarks=spec["resolution_details"] or "Issue resolved",
                            changed_by_id=officer_actor.id,
                            changed_at=created_at + timedelta(days=2),
                        )
                    )
                elif spec["status"] == "REOPENED":
                    db.add(
                        GrievanceHistory(
                            grievance_id=g.id,
                            status="RESOLVED",
                            remarks="Initial repair completed",
                            changed_by_id=officer_actor.id,
                            changed_at=created_at + timedelta(days=2),
                        )
                    )
                    db.add(
                        GrievanceHistory(
                            grievance_id=g.id,
                            status="REOPENED",
                            remarks="Lights in Sector 2 stopped working again after rain.",
                            changed_by_id=citizen.id,
                            changed_at=created_at + timedelta(days=4),
                        )
                    )

            if spec.get("feedback"):
                db.add(
                    CitizenFeedback(
                        grievance_id=g.id,
                        rating=spec["feedback"]["rating"],
                        comment=spec["feedback"]["comment"],
                        submitted_at=created_at + timedelta(days=3),
                    )
                )

        # Seed sample Contact Enquiries
        existing_enquiries = (await db.execute(select(ContactEnquiry))).scalars().all()
        if not existing_enquiries:
            db.add_all([
                ContactEnquiry(
                    name="Ananya Pillai",
                    email="ananya.pillai@example.com",
                    subject="Inquiry regarding rural water supply project in Alappuzha",
                    message="Could you provide details on the expected timeline for completion of the pipeline extension in Kuttanad?",
                    submitted_at=datetime.utcnow() - timedelta(days=2),
                ),
                ContactEnquiry(
                    name="George Varghese",
                    email="george.v@example.com",
                    subject="KSEB Online Bill Payment Receipts",
                    message="Where can I download consolidated annual receipts for electricity bill payments made through the portal?",
                    submitted_at=datetime.utcnow() - timedelta(days=1),
                ),
            ])

        await db.commit()
        print("PostgreSQL seed completed successfully (10 departments, 12 demo users with all 10 dept officers, 16 grievances, contact enquiries).")


if __name__ == "__main__":
    asyncio.run(seed())
