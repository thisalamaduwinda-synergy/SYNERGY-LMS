# Notification System Documentation

## Overview

A comprehensive real-time notification system for the Synergy Pharmaceuticals LMS that supports multiple notification types and delivery channels.

## Features

### Notification Types

1. **Quiz Completed** - Triggered when user completes a quiz
2. **Course Assigned** - Triggered when a new course is assigned to a user
3. **Certificate Generated** - Triggered when user earns a certificate
4. **Admin Alert** - Triggered for important admin events
5. **Progress Update** - Triggered when course progress is updated

### Notification Channels

1. **In-App** - Notifications displayed within the application
2. **Email** - Email notifications sent to user's email address
3. **Toast** - Temporary popup notifications
4. **Push** - Push notifications (optional)

---

## Backend Setup

### Database Model

```python
class Notification(Base):
    __tablename__ = "notifications"

    id: Primary Key
    user_id: Foreign Key to User
    notification_type: Enum (quiz_completed, course_assigned, certificate_generated, admin_alert, progress_update)
    channel: Enum (in_app, email, toast, push)
    title: String - Notification title
    message: Text - Notification message
    is_read: Boolean - Read status
    related_course_id: Foreign Key to Course (optional)
    related_quiz_id: Foreign Key to Quiz (optional)
    related_user_id: Foreign Key to User (optional)
    created_at: DateTime
    read_at: DateTime (optional)
    action_url: String - URL for action button (optional)
```

### API Endpoints

#### Get Notifications

```
GET /api/notifications/?user_id={user_id}&skip={skip}&limit={limit}

Response:
{
  "total": 25,
  "unread_count": 5,
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "notification_type": "quiz_completed",
      "channel": "in_app",
      "title": "Quiz Passed",
      "message": "You have passed the quiz with a score of 85%",
      "is_read": false,
      "created_at": "2026-04-28T10:30:00",
      "read_at": null,
      "action_url": "/quizzes/1/results"
    }
  ]
}
```

#### Get Unread Count

```
GET /api/notifications/unread/count?user_id={user_id}

Response:
{
  "unread_count": 5
}
```

#### Mark as Read

```
POST /api/notifications/{notification_id}/read

Response:
{
  "message": "Notification marked as read"
}
```

#### Mark All as Read

```
POST /api/notifications/read-all?user_id={user_id}

Response:
{
  "message": "All notifications marked as read"
}
```

#### Delete Notification

```
DELETE /api/notifications/{notification_id}

Response:
{
  "message": "Notification deleted"
}
```

#### Delete All Notifications

```
DELETE /api/notifications/?user_id={user_id}

Response:
{
  "message": "All notifications deleted"
}
```

### Backend Helper Functions

#### Create Notification

```python
from app.routes.notifications import create_notification

create_notification(
    db=db_session,
    user_id=1,
    notification_type="quiz_completed",
    title="Quiz Completed",
    message="You have completed the Math Quiz",
    channels=["in_app", "email", "toast"],
    related_quiz_id=5,
    action_url="/quizzes/5/results"
)
```

#### Specific Notification Functions

```python
# Quiz Completed
notify_quiz_completed(db, user_id=1, quiz_id=5, score=85.0, passed=True)

# Course Assigned
notify_course_assigned(db, user_id=1, course_id=3, course_title="Advanced Training")

# Certificate Generated
notify_certificate_generated(db, user_id=1, course_id=3, course_title="Advanced Training", certificate_number="CERT-2026-001")

# Progress Update
notify_progress_update(db, user_id=1, course_id=3, completion_percentage=75.0)

# Admin Alert
notify_admin_alert(db, admin_user_id=1, alert_type="Low Completion Rate", message="User has low completion rate", related_user_id=5)
```

---

## Frontend Implementation

### 1. Add NotificationBell Component to TopNav

```jsx
import NotificationBell from "./components/NotificationBell";

export default function TopNav() {
  const userId = localStorage.getItem("user_id");

  return (
    <div className="top-nav">
      <h2>Dashboard</h2>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <NotificationBell userId={userId} />
        {/* other nav items */}
      </div>
    </div>
  );
}
```

### 2. Add Toast Notification System to App

```jsx
import { useToast } from "./components/ToastNotification";

export default function App() {
  const { toasts, addToast, removeToast, ToastContainer } = useToast();

  // Global toast function for entire app
  window.showToast = (type, title, message) => {
    addToast(type, title, message);
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* App routes */}
    </div>
  );
}
```

### 3. Use NotificationService

```jsx
import NotificationService from "./services/NotificationService";

// Get notifications
const fetchNotifications = async () => {
  try {
    const data = await NotificationService.getNotifications(userId);
    console.log(data.notifications);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Get unread count
const getUnreadCount = async () => {
  try {
    const data = await NotificationService.getUnreadCount(userId);
    console.log(data.unread_count);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Mark as read
const handleMarkAsRead = async (notificationId) => {
  try {
    await NotificationService.markAsRead(notificationId);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

---

## Integration Examples

### Quiz Completed Notification

```python
# In your quiz completion endpoint
from app.routes.notifications import notify_quiz_completed

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, answers: dict, db: Session = Depends(get_db)):
    # ... process quiz submission ...
    score = calculate_score(answers, quiz_id, db)
    passed = score >= 70

    # Send notification
    notify_quiz_completed(db, user_id=1, quiz_id=quiz_id, score=score, passed=passed)

    return {"score": score, "passed": passed}
```

### Course Assignment Notification

```python
@router.post("/courses/{course_id}/assign")
def assign_course(course_id: int, user_ids: List[int], db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    for user_id in user_ids:
        # Create enrollment
        enrollment = Enrollment(user_id=user_id, course_id=course_id)
        db.add(enrollment)

        # Send notification
        notify_course_assigned(db, user_id, course_id, course.title)

    db.commit()
    return {"message": "Course assigned"}
```

### Certificate Generation Notification

```python
@router.post("/certificates/generate")
def generate_certificate(user_id: int, course_id: int, db: Session = Depends(get_db)):
    certificate_number = f"CERT-{datetime.now().year}-{user_id}-{course_id}"

    cert = Certificate(
        user_id=user_id,
        course_id=course_id,
        certificate_number=certificate_number
    )
    db.add(cert)
    db.commit()

    # Get course title for notification
    course = db.query(Course).filter(Course.id == course_id).first()

    # Send notification
    notify_certificate_generated(
        db, user_id, course_id, course.title, certificate_number
    )

    return {"certificate_number": certificate_number}
```

---

## Environment Configuration

Add these to your `.env` file:

```
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
```

---

## Testing

### Test Notification Creation

```python
# In FastAPI shell or Python script
from app.routes.notifications import create_notification
from app.database import SessionLocal

db = SessionLocal()

create_notification(
    db=db,
    user_id=1,
    notification_type="quiz_completed",
    title="Test Notification",
    message="This is a test notification",
    channels=["in_app", "email"],
    action_url="/dashboard"
)
```

### Test Frontend Components

```jsx
import NotificationBell from "./components/NotificationBell";

export default function TestNotifications() {
  return <NotificationBell userId="1" />;
}
```

---

## Best Practices

1. **Use appropriate channels**
   - Critical notifications: Use email + in-app
   - User actions: Use toast
   - Updates: Use in-app only

2. **Clear messaging**
   - Always provide actionable titles
   - Be specific in messages
   - Include relevant context

3. **Performance**
   - Implement pagination for notification list
   - Use intervals for polling (30-60 seconds)
   - Archive old notifications regularly

4. **User Experience**
   - Let users control notification preferences
   - Batch similar notifications
   - Provide "mark all as read" functionality

5. **Security**
   - Validate user authorization before fetching notifications
   - Sanitize notification messages
   - Rate limit notification endpoints

---

## Future Enhancements

- [ ] WebSocket real-time notifications
- [ ] Push notifications
- [ ] Notification preferences/settings
- [ ] Notification scheduling
- [ ] Analytics on notification engagement
- [ ] Notification templates
- [ ] Multi-language support
- [ ] Notification unsubscribe links
