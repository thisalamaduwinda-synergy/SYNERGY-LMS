"""
Full MongoDB seed script for Synergy Pharmaceuticals LMS.
Run once: python seed_db.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database import (
    users_col, courses_col, sops_col, quizzes_col, questions_col,
    question_options_col, quiz_attempts_col, enrollments_col,
    progress_col, certificates_col, notifications_col, db,
)
from bson import ObjectId
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def h(p): return pwd_context.hash(p)
def now(): return datetime.utcnow()
def days_ago(n): return datetime.utcnow() - timedelta(days=n)


# ─── CLEAR EXISTING DATA ──────────────────────────────────────────────────────
print("Clearing existing data...")
for col in [users_col, courses_col, sops_col, quizzes_col, questions_col,
            question_options_col, quiz_attempts_col, enrollments_col,
            progress_col, certificates_col, notifications_col]:
    col.delete_many({})
print("  Done.\n")


# ─── USERS ────────────────────────────────────────────────────────────────────
print("Creating users...")

admin_id   = ObjectId()
mgr1_id    = ObjectId()
mgr2_id    = ObjectId()
emp1_id    = ObjectId()
emp2_id    = ObjectId()
emp3_id    = ObjectId()
emp4_id    = ObjectId()
emp5_id    = ObjectId()
emp6_id    = ObjectId()

users = [
    {
        "_id": admin_id,
        "email": "admin@synergy.com",
        "username": "admin",
        "full_name": "System Administrator",
        "role": "admin",
        "department": "IT",
        "phone": "+94 11 234 5678",
        "hashed_password": h("Admin@123"),
        "is_active": True,
        "is_admin": True,
        "created_at": days_ago(90),
        "updated_at": days_ago(1),
    },
    {
        "_id": mgr1_id,
        "email": "manager.qc@synergy.com",
        "username": "mgr_qc",
        "full_name": "Kamal Perera",
        "role": "manager",
        "department": "Quality Control",
        "phone": "+94 77 123 4567",
        "hashed_password": h("Manager@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(80),
        "updated_at": days_ago(5),
    },
    {
        "_id": mgr2_id,
        "email": "manager.prod@synergy.com",
        "username": "mgr_prod",
        "full_name": "Nimal Silva",
        "role": "manager",
        "department": "Production",
        "phone": "+94 71 987 6543",
        "hashed_password": h("Manager@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(75),
        "updated_at": days_ago(3),
    },
    {
        "_id": emp1_id,
        "email": "amara.k@synergy.com",
        "username": "amara_k",
        "full_name": "Amara Kumari",
        "role": "employee",
        "department": "Quality Control",
        "phone": "+94 76 111 2222",
        "hashed_password": h("Employee@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(60),
        "updated_at": days_ago(2),
    },
    {
        "_id": emp2_id,
        "email": "ruwan.d@synergy.com",
        "username": "ruwan_d",
        "full_name": "Ruwan Dissanayake",
        "role": "employee",
        "department": "Production",
        "phone": "+94 72 333 4444",
        "hashed_password": h("Employee@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(55),
        "updated_at": days_ago(4),
    },
    {
        "_id": emp3_id,
        "email": "sandya.r@synergy.com",
        "username": "sandya_r",
        "full_name": "Sandya Rajapaksha",
        "role": "employee",
        "department": "Regulatory Affairs",
        "phone": "+94 75 555 6666",
        "hashed_password": h("Employee@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(45),
        "updated_at": days_ago(1),
    },
    {
        "_id": emp4_id,
        "email": "priya.f@synergy.com",
        "username": "priya_f",
        "full_name": "Priya Fernando",
        "role": "employee",
        "department": "Quality Control",
        "phone": "+94 78 777 8888",
        "hashed_password": h("Employee@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(40),
        "updated_at": days_ago(6),
    },
    {
        "_id": emp5_id,
        "email": "chaminda.w@synergy.com",
        "username": "chaminda_w",
        "full_name": "Chaminda Wickrama",
        "role": "employee",
        "department": "Production",
        "phone": "+94 77 999 0000",
        "hashed_password": h("Employee@123"),
        "is_active": True,
        "is_admin": False,
        "created_at": days_ago(30),
        "updated_at": days_ago(2),
    },
    {
        "_id": emp6_id,
        "email": "dilani.j@synergy.com",
        "username": "dilani_j",
        "full_name": "Dilani Jayasinghe",
        "role": "employee",
        "department": "Regulatory Affairs",
        "phone": "+94 70 112 2334",
        "hashed_password": h("Employee@123"),
        "is_active": False,
        "is_admin": False,
        "created_at": days_ago(20),
        "updated_at": days_ago(10),
    },
]
users_col.insert_many(users)
print(f"  {len(users)} users created.")


# ─── COURSES ──────────────────────────────────────────────────────────────────
print("Creating courses...")

c1_id = ObjectId()
c2_id = ObjectId()
c3_id = ObjectId()
c4_id = ObjectId()
c5_id = ObjectId()

courses = [
    {
        "_id": c1_id,
        "title": "Good Manufacturing Practice (GMP) Fundamentals",
        "description": "Core GMP principles for pharmaceutical manufacturing compliance.",
        "duration_hours": 4,
        "sop_code": "SOP-GMP-001",
        "version": "2.1",
        "department": "Production",
        "owner": "Nimal Silva",
        "training_status": "Active",
        "priority": "Mandatory",
        "passing_score": 75.0,
        "due_date": "2026-06-30",
        "is_active": True,
        "created_at": days_ago(60),
        "updated_at": days_ago(5),
    },
    {
        "_id": c2_id,
        "title": "Quality Control & Testing Procedures",
        "description": "Standard QC testing methods and documentation requirements.",
        "duration_hours": 6,
        "sop_code": "SOP-QC-002",
        "version": "1.5",
        "department": "Quality Control",
        "owner": "Kamal Perera",
        "training_status": "Active",
        "priority": "Mandatory",
        "passing_score": 80.0,
        "due_date": "2026-07-15",
        "is_active": True,
        "created_at": days_ago(50),
        "updated_at": days_ago(3),
    },
    {
        "_id": c3_id,
        "title": "Regulatory Compliance & Documentation",
        "description": "FDA and local regulatory requirements for pharmaceutical companies.",
        "duration_hours": 3,
        "sop_code": "SOP-REG-003",
        "version": "1.0",
        "department": "Regulatory Affairs",
        "owner": "System Administrator",
        "training_status": "Active",
        "priority": "Mandatory",
        "passing_score": 70.0,
        "due_date": "2026-08-01",
        "is_active": True,
        "created_at": days_ago(40),
        "updated_at": days_ago(2),
    },
    {
        "_id": c4_id,
        "title": "Workplace Safety & Chemical Handling",
        "description": "Safe handling of chemicals and laboratory safety procedures.",
        "duration_hours": 2,
        "sop_code": "SOP-HSE-004",
        "version": "3.0",
        "department": "All",
        "owner": "System Administrator",
        "training_status": "Active",
        "priority": "Mandatory",
        "passing_score": 70.0,
        "due_date": "2026-05-31",
        "is_active": True,
        "created_at": days_ago(35),
        "updated_at": days_ago(1),
    },
    {
        "_id": c5_id,
        "title": "Cleanroom Operations & Gowning",
        "description": "Proper gowning procedures and behavior in cleanroom environments.",
        "duration_hours": 2,
        "sop_code": "SOP-CRM-005",
        "version": "1.2",
        "department": "Production",
        "owner": "Nimal Silva",
        "training_status": "Draft",
        "priority": "Role Based",
        "passing_score": 75.0,
        "due_date": "2026-09-01",
        "is_active": False,
        "created_at": days_ago(10),
        "updated_at": days_ago(1),
    },
]
courses_col.insert_many(courses)
print(f"  {len(courses)} courses created.")


# ─── SOPS ─────────────────────────────────────────────────────────────────────
print("Creating SOPs...")

sop1_id = ObjectId()
sop2_id = ObjectId()
sop3_id = ObjectId()
sop4_id = ObjectId()

sops = [
    {
        "_id": sop1_id,
        "title": "GMP Fundamentals Standard Operating Procedure",
        "description": "Defines GMP standards for all manufacturing activities.",
        "content": "This SOP covers all Good Manufacturing Practice requirements including facility hygiene, equipment calibration, personnel training, documentation standards, and batch record keeping. All employees must adhere to these procedures at all times.",
        "version": "2.1",
        "file_url": None,
        "is_active": True,
        "course_ids": [str(c1_id)],
        "created_by": str(admin_id),
        "created_at": days_ago(60),
        "updated_at": days_ago(5),
    },
    {
        "_id": sop2_id,
        "title": "QC Testing & Sampling Procedure",
        "description": "Outlines sampling methods and testing protocols for QC.",
        "content": "This SOP defines the sampling plan, testing frequency, acceptance criteria and documentation requirements for all quality control activities. Samples must be collected, labeled and tested according to validated methods.",
        "version": "1.5",
        "file_url": None,
        "is_active": True,
        "course_ids": [str(c2_id)],
        "created_by": str(mgr1_id),
        "created_at": days_ago(50),
        "updated_at": days_ago(3),
    },
    {
        "_id": sop3_id,
        "title": "Regulatory Documentation & Submission SOP",
        "description": "Covers preparation and submission of regulatory documents.",
        "content": "This SOP outlines the requirements for preparing, reviewing and submitting regulatory documents to local and international health authorities. All submissions must be reviewed by the Regulatory Affairs team before dispatch.",
        "version": "1.0",
        "file_url": None,
        "is_active": True,
        "course_ids": [str(c3_id)],
        "created_by": str(admin_id),
        "created_at": days_ago(40),
        "updated_at": days_ago(2),
    },
    {
        "_id": sop4_id,
        "title": "Chemical Safety & Hazardous Materials Handling",
        "description": "Safe handling, storage and disposal of hazardous chemicals.",
        "content": "This SOP provides guidance on chemical safety including proper PPE usage, chemical storage, spill response procedures, and waste disposal. MSDS sheets must be reviewed before handling any chemical.",
        "version": "3.0",
        "file_url": None,
        "is_active": True,
        "course_ids": [str(c4_id)],
        "created_by": str(admin_id),
        "created_at": days_ago(35),
        "updated_at": days_ago(1),
    },
]
sops_col.insert_many(sops)
print(f"  {len(sops)} SOPs created.")


# ─── QUIZZES ──────────────────────────────────────────────────────────────────
print("Creating quizzes...")

q1_id = ObjectId()
q2_id = ObjectId()
q3_id = ObjectId()
q4_id = ObjectId()

quizzes = [
    {
        "_id": q1_id,
        "title": "GMP Fundamentals Assessment",
        "description": "Test your knowledge of Good Manufacturing Practices.",
        "course_id": str(c1_id),
        "passing_score": 75.0,
        "max_attempts": 3,
        "created_at": days_ago(58),
    },
    {
        "_id": q2_id,
        "title": "Quality Control Procedures Quiz",
        "description": "Assess understanding of QC testing and sampling.",
        "course_id": str(c2_id),
        "passing_score": 80.0,
        "max_attempts": 3,
        "created_at": days_ago(48),
    },
    {
        "_id": q3_id,
        "title": "Regulatory Compliance Assessment",
        "description": "Test on regulatory documentation requirements.",
        "course_id": str(c3_id),
        "passing_score": 70.0,
        "max_attempts": 3,
        "created_at": days_ago(38),
    },
    {
        "_id": q4_id,
        "title": "Workplace Safety Quiz",
        "description": "Chemical handling and safety procedures test.",
        "course_id": str(c4_id),
        "passing_score": 70.0,
        "max_attempts": 3,
        "created_at": days_ago(33),
    },
]
quizzes_col.insert_many(quizzes)
print(f"  {len(quizzes)} quizzes created.")


# ─── QUESTIONS & OPTIONS ──────────────────────────────────────────────────────
print("Creating questions and options...")

def make_question(quiz_id, text, correct, wrong1, wrong2, wrong3, order):
    qid = ObjectId()
    q = {
        "_id": qid,
        "quiz_id": str(quiz_id),
        "question_text": text,
        "question_type": "multiple_choice",
        "correct_answer": correct,
        "points": 1.0,
        "order": order,
    }
    opts = [
        {"question_id": str(qid), "option_text": correct,  "is_correct": True,  "order": 1},
        {"question_id": str(qid), "option_text": wrong1,   "is_correct": False, "order": 2},
        {"question_id": str(qid), "option_text": wrong2,   "is_correct": False, "order": 3},
        {"question_id": str(qid), "option_text": wrong3,   "is_correct": False, "order": 4},
    ]
    return q, opts

all_questions = []
all_options   = []

# GMP Quiz questions
for q, o in [
    make_question(q1_id, "What does GMP stand for?",
        "Good Manufacturing Practice", "General Medical Procedure", "Global Medicine Protocol", "General Manufacturing Policy", 1),
    make_question(q1_id, "Which document records all steps taken during pharmaceutical manufacturing?",
        "Batch Record", "Purchase Order", "Work Instruction", "Delivery Note", 2),
    make_question(q1_id, "How often should equipment be calibrated under GMP?",
        "According to the validated calibration schedule", "Only when equipment fails", "Once a year regardless of usage", "When a customer requests it", 3),
    make_question(q1_id, "What is the purpose of a deviation report?",
        "To document and investigate unexpected departures from procedures", "To report employee absences", "To record production targets", "To track customer complaints", 4),
    make_question(q1_id, "Under GMP, who is responsible for product quality?",
        "Every employee involved in manufacturing", "Only the QC department", "Only the production manager", "Only the CEO", 5),
]:
    all_questions.append(q); all_options.extend(o)

# QC Quiz questions
for q, o in [
    make_question(q2_id, "What is the first step before collecting a QC sample?",
        "Review the sampling SOP and wear appropriate PPE", "Collect the sample immediately", "Inform the production team", "Fill in the results form", 1),
    make_question(q2_id, "What does OOS stand for in QC?",
        "Out of Specification", "Order of Supply", "On-site Observation Sheet", "Official Output Summary", 2),
    make_question(q2_id, "When a result is OOS, what should be done first?",
        "Initiate an investigation before any retesting", "Discard the sample and retest immediately", "Report to management and ignore it", "Release the batch and investigate later", 3),
    make_question(q2_id, "What information must appear on every QC sample label?",
        "Sample ID, batch number, date collected, and initials", "Only the batch number", "Only the product name", "The analyst name and test result", 4),
    make_question(q2_id, "Which statistical tool is commonly used for QC process monitoring?",
        "Control Charts (SPC)", "Pie Charts", "Bar Graphs", "Histograms only", 5),
]:
    all_questions.append(q); all_options.extend(o)

# Regulatory Quiz questions
for q, o in [
    make_question(q3_id, "What is a CAPA in regulatory terms?",
        "Corrective and Preventive Action", "Chemical Analysis Procedure and Audit", "Compliance Assessment and Protocol Approval", "Central Authority for Pharmaceutical Approvals", 1),
    make_question(q3_id, "Which body regulates pharmaceuticals in Sri Lanka?",
        "National Medicines Regulatory Authority (NMRA)", "Ministry of Finance", "WHO only", "SLSI", 2),
    make_question(q3_id, "How long must pharmaceutical records typically be retained?",
        "At least one year beyond the product's shelf life", "6 months", "Until the next audit", "Forever", 3),
    make_question(q3_id, "What is the purpose of a change control process?",
        "To formally evaluate and document changes before implementation", "To change production schedules", "To update employee contracts", "To modify customer orders", 4),
    make_question(q3_id, "An SOP must be reviewed at minimum every:",
        "2 years or after any significant change", "5 years", "Only when problems arise", "10 years", 5),
]:
    all_questions.append(q); all_options.extend(o)

# Safety Quiz questions
for q, o in [
    make_question(q4_id, "What does MSDS / SDS stand for?",
        "Material Safety Data Sheet", "Manufacturing Standard Documentation System", "Medical Supply Distribution Schedule", "Mandatory Safety Display Sheet", 1),
    make_question(q4_id, "Before handling a new chemical, you must:",
        "Read the SDS and don the correct PPE", "Start work immediately to save time", "Ask a colleague to handle it", "Dilute it with water first", 2),
    make_question(q4_id, "In the event of a chemical spill, what is the first action?",
        "Alert others and evacuate if necessary, then contain the spill", "Wipe it up immediately with bare hands", "Ignore small spills", "Leave the area without telling anyone", 3),
    make_question(q4_id, "Hazardous chemical waste must be disposed of by:",
        "Following the approved waste disposal SOP and using labelled containers", "Pouring it down the drain", "Leaving it on the workbench", "Mixing it with regular waste", 4),
    make_question(q4_id, "PPE for chemical handling typically includes:",
        "Gloves, safety goggles, lab coat, and closed-toe shoes", "Only gloves", "No PPE needed for dilute solutions", "A face mask only", 5),
]:
    all_questions.append(q); all_options.extend(o)

questions_col.insert_many(all_questions)
question_options_col.insert_many(all_options)
print(f"  {len(all_questions)} questions and {len(all_options)} options created.")


# ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
print("Creating enrollments...")

# emp1 (Amara) enrolled in c1, c2, c4 — completed c4
# emp2 (Ruwan) enrolled in c1, c4 — completed c1
# emp3 (Sandya) enrolled in c3, c4 — completed both
# emp4 (Priya) enrolled in c2, c4
# emp5 (Chaminda) enrolled in c1
# mgr1 enrolled in c1, c2
# mgr2 enrolled in c1, c4

enrollments_data = [
    (emp1_id, c1_id, "enrolled",   days_ago(30), None),
    (emp1_id, c2_id, "enrolled",   days_ago(28), None),
    (emp1_id, c4_id, "completed",  days_ago(25), days_ago(20)),
    (emp2_id, c1_id, "completed",  days_ago(40), days_ago(35)),
    (emp2_id, c4_id, "enrolled",   days_ago(20), None),
    (emp3_id, c3_id, "completed",  days_ago(35), days_ago(28)),
    (emp3_id, c4_id, "completed",  days_ago(30), days_ago(22)),
    (emp4_id, c2_id, "enrolled",   days_ago(15), None),
    (emp4_id, c4_id, "enrolled",   days_ago(10), None),
    (emp5_id, c1_id, "enrolled",   days_ago(12), None),
    (mgr1_id, c1_id, "completed",  days_ago(50), days_ago(45)),
    (mgr1_id, c2_id, "completed",  days_ago(48), days_ago(42)),
    (mgr2_id, c1_id, "completed",  days_ago(55), days_ago(50)),
    (mgr2_id, c4_id, "completed",  days_ago(35), days_ago(30)),
]

enrollment_ids = {}
enrollments = []
for uid, cid, status, enrolled_at, completed_at in enrollments_data:
    eid = ObjectId()
    enrollment_ids[(str(uid), str(cid))] = eid
    enrollments.append({
        "_id": eid,
        "user_id": str(uid),
        "course_id": str(cid),
        "status": status,
        "enrolled_at": enrolled_at,
        "completed_at": completed_at,
    })
enrollments_col.insert_many(enrollments)
print(f"  {len(enrollments)} enrollments created.")


# ─── PROGRESS ─────────────────────────────────────────────────────────────────
print("Creating progress records...")

progress_records = [
    (emp1_id, c1_id, 45.0,  days_ago(10)),
    (emp1_id, c2_id, 30.0,  days_ago(8)),
    (emp1_id, c4_id, 100.0, days_ago(20)),
    (emp2_id, c1_id, 100.0, days_ago(35)),
    (emp2_id, c4_id, 20.0,  days_ago(5)),
    (emp3_id, c3_id, 100.0, days_ago(28)),
    (emp3_id, c4_id, 100.0, days_ago(22)),
    (emp4_id, c2_id, 55.0,  days_ago(7)),
    (emp4_id, c4_id, 10.0,  days_ago(3)),
    (emp5_id, c1_id, 25.0,  days_ago(4)),
    (mgr1_id, c1_id, 100.0, days_ago(45)),
    (mgr1_id, c2_id, 100.0, days_ago(42)),
    (mgr2_id, c1_id, 100.0, days_ago(50)),
    (mgr2_id, c4_id, 100.0, days_ago(30)),
]

progress = []
for uid, cid, pct, last_accessed in progress_records:
    progress.append({
        "_id": ObjectId(),
        "user_id": str(uid),
        "course_id": str(cid),
        "completion_percentage": pct,
        "last_accessed_at": last_accessed,
        "updated_at": last_accessed,
    })
progress_col.insert_many(progress)
print(f"  {len(progress)} progress records created.")


# ─── QUIZ ATTEMPTS ────────────────────────────────────────────────────────────
print("Creating quiz attempts...")

attempts = []
# Completed users get passing attempts
passing_attempts = [
    (emp1_id, q4_id, 85.0, days_ago(20)),
    (emp2_id, q1_id, 90.0, days_ago(35)),
    (emp3_id, q3_id, 92.0, days_ago(28)),
    (emp3_id, q4_id, 88.0, days_ago(22)),
    (mgr1_id, q1_id, 95.0, days_ago(45)),
    (mgr1_id, q2_id, 96.0, days_ago(42)),
    (mgr2_id, q1_id, 88.0, days_ago(50)),
    (mgr2_id, q4_id, 82.0, days_ago(30)),
]
for uid, qid, score, completed_at in passing_attempts:
    quiz = quizzes_col.find_one({"_id": qid})
    attempts.append({
        "_id": ObjectId(),
        "user_id": str(uid),
        "quiz_id": str(qid),
        "score": score,
        "passed": score >= quiz["passing_score"],
        "started_at": completed_at - timedelta(minutes=30),
        "completed_at": completed_at,
    })

# Some failed attempts
failed_attempts = [
    (emp1_id, q1_id, 60.0, days_ago(28)),
    (emp4_id, q2_id, 55.0, days_ago(12)),
    (emp5_id, q1_id, 50.0, days_ago(8)),
]
for uid, qid, score, completed_at in failed_attempts:
    quiz = quizzes_col.find_one({"_id": qid})
    attempts.append({
        "_id": ObjectId(),
        "user_id": str(uid),
        "quiz_id": str(qid),
        "score": score,
        "passed": score >= quiz["passing_score"],
        "started_at": completed_at - timedelta(minutes=25),
        "completed_at": completed_at,
    })

quiz_attempts_col.insert_many(attempts)
print(f"  {len(attempts)} quiz attempts created.")


# ─── CERTIFICATES ─────────────────────────────────────────────────────────────
print("Creating certificates...")

cert_data = [
    (emp1_id, c4_id, "SYN-C4-EMP1-001", days_ago(20)),
    (emp2_id, c1_id, "SYN-C1-EMP2-002", days_ago(35)),
    (emp3_id, c3_id, "SYN-C3-EMP3-003", days_ago(28)),
    (emp3_id, c4_id, "SYN-C4-EMP3-004", days_ago(22)),
    (mgr1_id, c1_id, "SYN-C1-MGR1-005", days_ago(45)),
    (mgr1_id, c2_id, "SYN-C2-MGR1-006", days_ago(42)),
    (mgr2_id, c1_id, "SYN-C1-MGR2-007", days_ago(50)),
    (mgr2_id, c4_id, "SYN-C4-MGR2-008", days_ago(30)),
]

certs = []
for uid, cid, cert_num, issued_at in cert_data:
    certs.append({
        "_id": ObjectId(),
        "user_id": str(uid),
        "course_id": str(cid),
        "certificate_number": cert_num,
        "issued_at": issued_at,
        "valid_until": issued_at + timedelta(days=365),
    })
certificates_col.insert_many(certs)
print(f"  {len(certs)} certificates created.")


# ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
print("Creating notifications...")

notifs = []
for uid, title, msg, ntype, is_read, created in [
    (emp1_id, "New Course Assigned", "You have been assigned: GMP Fundamentals", "course_assigned",   False, days_ago(30)),
    (emp1_id, "Quiz Failed",         "You scored 60% on GMP quiz. Minimum is 75%", "quiz_completed",  True,  days_ago(28)),
    (emp1_id, "Certificate Earned",  "Congrats! You passed the Safety quiz and earned a certificate.", "certificate_generated", False, days_ago(20)),
    (emp2_id, "Course Completed",    "You completed GMP Fundamentals!", "quiz_completed",              True,  days_ago(35)),
    (emp2_id, "New Course Assigned", "Workplace Safety course is now assigned to you.", "course_assigned", False, days_ago(20)),
    (emp3_id, "Certificate Earned",  "Certificate issued for Regulatory Compliance.", "certificate_generated", True, days_ago(28)),
    (emp3_id, "Certificate Earned",  "Certificate issued for Workplace Safety.", "certificate_generated", False, days_ago(22)),
    (emp4_id, "New Course Assigned", "QC Testing Procedures has been assigned.", "course_assigned",    False, days_ago(15)),
    (emp5_id, "New Course Assigned", "GMP Fundamentals training is mandatory.", "course_assigned",     False, days_ago(12)),
    (mgr1_id, "Admin Alert",         "3 employees have pending mandatory trainings.", "admin_alert",   False, days_ago(5)),
    (admin_id, "Admin Alert",        "New user Dilani Jayasinghe account is inactive.", "admin_alert", False, days_ago(10)),
]:
    notifs.append({
        "_id": ObjectId(),
        "user_id": str(uid),
        "notification_type": ntype,
        "channel": "in_app",
        "title": title,
        "message": msg,
        "is_read": is_read,
        "related_course_id": None,
        "related_quiz_id": None,
        "related_user_id": None,
        "action_url": None,
        "created_at": created,
        "read_at": created + timedelta(hours=2) if is_read else None,
    })
notifications_col.insert_many(notifs)
print(f"  {len(notifs)} notifications created.")


# ─── SUMMARY ──────────────────────────────────────────────────────────────────
print("\n" + "="*55)
print("  DATABASE SEEDED SUCCESSFULLY")
print("="*55)
for col_name in ["users","courses","sops","quizzes","questions","question_options",
                 "enrollments","progress","quiz_attempts","certificates","notifications"]:
    count = db[col_name].count_documents({})
    print(f"  {col_name:<22} : {count:>3} documents")
print("="*55)
print("\nLogin credentials:")
print("  Admin    : admin@synergy.com      / Admin@123")
print("  Manager  : manager.qc@synergy.com / Manager@123")
print("  Employee : amara.k@synergy.com    / Employee@123")
