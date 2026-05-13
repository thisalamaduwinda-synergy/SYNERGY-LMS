from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from app.models.models import Notification, User, NotificationType, NotificationChannel
from app.schemas import NotificationCreate, NotificationResponse, NotificationUpdate, NotificationListResponse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your-password")


def send_email_notification(recipient_email: str, subject: str, message: str):
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject

        # HTML email body
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
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    channels: List[str] = None,
    related_course_id: int = None,
    related_quiz_id: int = None,
    related_user_id: int = None,
    action_url: str = None,
):
    """Create notification in multiple channels"""
    if channels is None:
        channels = ["in_app"]

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_notifications = []

    for channel in channels:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            channel=channel,
            title=title,
            message=message,
            related_course_id=related_course_id,
            related_quiz_id=related_quiz_id,
            related_user_id=related_user_id,
            action_url=action_url,
        )
        db.add(notification)
        created_notifications.append(notification)

        # Send email if email channel is specified
        if channel == "email":
            send_email_notification(user.email, title, message)

    db.commit()
    return created_notifications


@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    user_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get notifications for a user"""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = db.query(Notification).filter(Notification.user_id == user_id).count()
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )

    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": [NotificationResponse.from_orm(n) for n in notifications],
    }


@router.get("/unread/count")
def get_unread_count(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get unread notification count"""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )
    return {"unread_count": count}


@router.post("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    notification = (
        db.query(Notification).filter(Notification.id == notification_id).first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification marked as read"}


@router.post("/read-all")
def mark_all_as_read(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Mark all notifications as read for a user"""
    db.query(Notification).filter(Notification.user_id == user_id).update(
        {Notification.is_read: True, Notification.read_at: datetime.utcnow()}
    )
    db.commit()

    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    notification = (
        db.query(Notification).filter(Notification.id == notification_id).first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted"}


@router.delete("/")
def delete_all_notifications(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Delete all notifications for a user"""
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.commit()

    return {"message": "All notifications deleted"}


# Helper functions for creating specific notification types


def notify_quiz_completed(
    db: Session, user_id: int, quiz_id: int, score: float, passed: bool
):
    """Notify user when quiz is completed"""
    status = "passed" if passed else "failed"
    message = f"You have {status} the quiz with a score of {score}%"

    create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.QUIZ_COMPLETED.value,
        title=f"Quiz {status.capitalize()}",
        message=message,
        channels=["in_app", "email", "toast"],
        related_quiz_id=quiz_id,
        action_url=f"/quizzes/{quiz_id}/results",
    )


def notify_course_assigned(db: Session, user_id: int, course_id: int, course_title: str):
    """Notify user when course is assigned"""
    message = f"You have been assigned to the course: {course_title}"

    create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.COURSE_ASSIGNED.value,
        title="New Course Assignment",
        message=message,
        channels=["in_app", "email", "toast"],
        related_course_id=course_id,
        action_url=f"/courses/{course_id}",
    )


def notify_certificate_generated(
    db: Session, user_id: int, course_id: int, course_title: str, certificate_number: str
):
    """Notify user when certificate is generated"""
    message = f"Congratulations! You have earned a certificate for {course_title}. Certificate #: {certificate_number}"

    create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.CERTIFICATE_GENERATED.value,
        title="Certificate Earned",
        message=message,
        channels=["in_app", "email", "toast"],
        related_course_id=course_id,
        action_url=f"/certificates/{certificate_number}",
    )


def notify_progress_update(
    db: Session, user_id: int, course_id: int, completion_percentage: float
):
    """Notify user of progress update"""
    message = f"Your course progress has been updated to {completion_percentage}% completion"

    create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.PROGRESS_UPDATE.value,
        title="Progress Update",
        message=message,
        channels=["in_app"],
        related_course_id=course_id,
        action_url=f"/courses/{course_id}/progress",
    )


def notify_admin_alert(
    db: Session, admin_user_id: int, alert_type: str, message: str, related_user_id: int = None
):
    """Notify admin of important events"""
    create_notification(
        db=db,
        user_id=admin_user_id,
        notification_type=NotificationType.ADMIN_ALERT.value,
        title=f"Admin Alert: {alert_type}",
        message=message,
        channels=["in_app", "email"],
        related_user_id=related_user_id,
    )
