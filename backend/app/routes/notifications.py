from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from typing import List
from app.database import notifications_col, users_col, doc_to_dict
from app.models.models import NotificationType, NotificationChannel
from app.schemas import NotificationCreate, NotificationResponse, NotificationUpdate, NotificationListResponse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your-password")


def send_email_notification(recipient_email: str, subject: str, message: str):
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject

        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Synergy Pharmaceuticals LMS</h2>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>{message}</p>
                    </div>
                    <p style="color: #7f8c8d; font-size: 12px;">
                        This is an automated notification from Synergy Pharmaceuticals LMS.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    channels: List[str] = None,
    related_course_id: str = None,
    related_quiz_id: str = None,
    related_user_id: str = None,
    action_url: str = None,
):
    if channels is None:
        channels = ["in_app"]

    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
    except (InvalidId, Exception):
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_notifications = []

    for channel in channels:
        notification_doc = {
            "user_id": user_id,
            "notification_type": notification_type,
            "channel": channel,
            "title": title,
            "message": message,
            "is_read": False,
            "related_course_id": related_course_id,
            "related_quiz_id": related_quiz_id,
            "related_user_id": related_user_id,
            "action_url": action_url,
            "created_at": datetime.utcnow(),
            "read_at": None,
        }
        result = notifications_col.insert_one(notification_doc)
        created = notifications_col.find_one({"_id": result.inserted_id})
        created_notifications.append(doc_to_dict(created))

        if channel == "email":
            send_email_notification(user["email"], title, message)

    return created_notifications


@router.get("/unread/count")
def get_unread_count(user_id: str = Query(...)):
    count = notifications_col.count_documents({"user_id": user_id, "is_read": False})
    return {"unread_count": count}


@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    user_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    notifications = list(
        notifications_col.find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    total = notifications_col.count_documents({"user_id": user_id})
    unread_count = notifications_col.count_documents({"user_id": user_id, "is_read": False})

    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": [doc_to_dict(n) for n in notifications],
    }


@router.post("/read-all")
def mark_all_as_read(user_id: str = Query(...)):
    notifications_col.update_many(
        {"user_id": user_id},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    return {"message": "All notifications marked as read"}


@router.delete("/")
def delete_all_notifications(user_id: str = Query(...)):
    notifications_col.delete_many({"user_id": user_id})
    return {"message": "All notifications deleted"}


@router.post("/{notification_id}/read")
def mark_as_read(notification_id: str):
    try:
        oid = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = notifications_col.update_one(
        {"_id": oid}, {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.post("/{notification_id}/unread")
def mark_as_unread(notification_id: str):
    try:
        oid = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = notifications_col.update_one(
        {"_id": oid}, {"$set": {"is_read": False, "read_at": None}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as unread"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: str):
    try:
        result = notifications_col.delete_one({"_id": ObjectId(notification_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}


# Helper functions for creating specific notification types

def notify_quiz_completed(user_id: str, quiz_id: str, score: float, passed: bool):
    status_str = "passed" if passed else "failed"
    create_notification(
        user_id=user_id,
        notification_type=NotificationType.QUIZ_COMPLETED.value,
        title=f"Quiz {status_str.capitalize()}",
        message=f"You have {status_str} the quiz with a score of {score}%",
        channels=["in_app", "email", "toast"],
        related_quiz_id=quiz_id,
        action_url=f"/quizzes/{quiz_id}/results",
    )


def notify_course_assigned(user_id: str, course_id: str, course_title: str):
    create_notification(
        user_id=user_id,
        notification_type=NotificationType.COURSE_ASSIGNED.value,
        title="New Course Assignment",
        message=f"You have been assigned to the course: {course_title}",
        channels=["in_app", "email", "toast"],
        related_course_id=course_id,
        action_url=f"/courses/{course_id}",
    )


def notify_certificate_generated(
    user_id: str, course_id: str, course_title: str, certificate_number: str
):
    create_notification(
        user_id=user_id,
        notification_type=NotificationType.CERTIFICATE_GENERATED.value,
        title="Certificate Earned",
        message=f"Congratulations! You have earned a certificate for {course_title}. Certificate #: {certificate_number}",
        channels=["in_app", "email", "toast"],
        related_course_id=course_id,
        action_url=f"/certificates/{certificate_number}",
    )


def notify_progress_update(user_id: str, course_id: str, completion_percentage: float):
    create_notification(
        user_id=user_id,
        notification_type=NotificationType.PROGRESS_UPDATE.value,
        title="Progress Update",
        message=f"Your course progress has been updated to {completion_percentage}% completion",
        channels=["in_app"],
        related_course_id=course_id,
        action_url=f"/courses/{course_id}/progress",
    )


def notify_admin_alert(
    admin_user_id: str, alert_type: str, message: str, related_user_id: str = None
):
    create_notification(
        user_id=admin_user_id,
        notification_type=NotificationType.ADMIN_ALERT.value,
        title=f"Admin Alert: {alert_type}",
        message=message,
        channels=["in_app", "email"],
        related_user_id=related_user_id,
    )
