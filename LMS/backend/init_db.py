"""
Run this script once to create all MongoDB collections and indexes.
It is also called automatically when the FastAPI app starts.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import (
    users_col,
    courses_col,
    sops_col,
    quizzes_col,
    questions_col,
    question_options_col,
    quiz_attempts_col,
    enrollments_col,
    progress_col,
    certificates_col,
    notifications_col,
    db,
)
from pymongo import ASCENDING, DESCENDING


def init_db():
    # ── users ────────────────────────────────────────────────────────────────
    users_col.create_index([("email", ASCENDING)], unique=True, name="idx_users_email")
    users_col.create_index([("username", ASCENDING)], unique=True, name="idx_users_username")
    users_col.create_index([("role", ASCENDING)], name="idx_users_role")

    # ── courses ──────────────────────────────────────────────────────────────
    courses_col.create_index([("is_active", ASCENDING)], name="idx_courses_is_active")
    courses_col.create_index([("title", ASCENDING)], name="idx_courses_title")

    # ── sops ─────────────────────────────────────────────────────────────────
    sops_col.create_index([("is_active", ASCENDING)], name="idx_sops_is_active")
    sops_col.create_index([("course_ids", ASCENDING)], name="idx_sops_course_ids")
    sops_col.create_index([("created_by", ASCENDING)], name="idx_sops_created_by")

    # ── quizzes ──────────────────────────────────────────────────────────────
    quizzes_col.create_index([("course_id", ASCENDING)], name="idx_quizzes_course_id")

    # ── questions ────────────────────────────────────────────────────────────
    questions_col.create_index([("quiz_id", ASCENDING)], name="idx_questions_quiz_id")
    questions_col.create_index(
        [("quiz_id", ASCENDING), ("order", ASCENDING)], name="idx_questions_quiz_order"
    )

    # ── question_options ─────────────────────────────────────────────────────
    question_options_col.create_index(
        [("question_id", ASCENDING)], name="idx_question_options_question_id"
    )

    # ── quiz_attempts ────────────────────────────────────────────────────────
    quiz_attempts_col.create_index([("user_id", ASCENDING)], name="idx_quiz_attempts_user_id")
    quiz_attempts_col.create_index([("quiz_id", ASCENDING)], name="idx_quiz_attempts_quiz_id")
    quiz_attempts_col.create_index([("passed", ASCENDING)], name="idx_quiz_attempts_passed")
    quiz_attempts_col.create_index(
        [("user_id", ASCENDING), ("quiz_id", ASCENDING)],
        name="idx_quiz_attempts_user_quiz",
    )

    # ── enrollments ──────────────────────────────────────────────────────────
    enrollments_col.create_index([("user_id", ASCENDING)], name="idx_enrollments_user_id")
    enrollments_col.create_index([("course_id", ASCENDING)], name="idx_enrollments_course_id")
    enrollments_col.create_index([("status", ASCENDING)], name="idx_enrollments_status")
    enrollments_col.create_index(
        [("user_id", ASCENDING), ("course_id", ASCENDING)],
        unique=True,
        name="idx_enrollments_user_course_unique",
    )

    # ── progress ─────────────────────────────────────────────────────────────
    progress_col.create_index([("user_id", ASCENDING)], name="idx_progress_user_id")
    progress_col.create_index([("course_id", ASCENDING)], name="idx_progress_course_id")
    progress_col.create_index(
        [("user_id", ASCENDING), ("course_id", ASCENDING)],
        unique=True,
        name="idx_progress_user_course_unique",
    )

    # ── certificates ─────────────────────────────────────────────────────────
    certificates_col.create_index(
        [("certificate_number", ASCENDING)],
        unique=True,
        name="idx_certificates_number_unique",
    )
    certificates_col.create_index([("user_id", ASCENDING)], name="idx_certificates_user_id")
    certificates_col.create_index(
        [("user_id", ASCENDING), ("course_id", ASCENDING)],
        name="idx_certificates_user_course",
    )

    # ── notifications ────────────────────────────────────────────────────────
    notifications_col.create_index([("user_id", ASCENDING)], name="idx_notifications_user_id")
    notifications_col.create_index([("is_read", ASCENDING)], name="idx_notifications_is_read")
    notifications_col.create_index(
        [("created_at", DESCENDING)], name="idx_notifications_created_at"
    )
    notifications_col.create_index(
        [("user_id", ASCENDING), ("is_read", ASCENDING)],
        name="idx_notifications_user_unread",
    )

    print("MongoDB collections and indexes initialized successfully.")
    print(f"  Database : {db.name}")
    print(f"  Collections : {', '.join(db.list_collection_names())}")


if __name__ == "__main__":
    init_db()
