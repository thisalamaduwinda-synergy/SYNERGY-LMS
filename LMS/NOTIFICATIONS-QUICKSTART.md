# Notification System - Quick Setup Guide

## 🚀 Quick Start

### Backend Setup

1. **Models already created** in `backend/app/models/models.py`
   - `Notification` model
   - `NotificationType` enum
   - `NotificationChannel` enum

2. **Schemas created** in `backend/app/schemas.py`
   - `NotificationCreate`
   - `NotificationResponse`
   - `NotificationListResponse`

3. **Routes created** in `backend/app/routes/notifications.py`
   - All API endpoints
   - Helper functions for each notification type
   - Email sending functionality

4. **Main app updated** in `backend/main.py`
   - Notifications router included

### Frontend Setup

1. **Components created**
   - `NotificationBell.jsx` - Notification dropdown with bell icon
   - `ToastNotification.jsx` - Toast notification component

2. **Styles created**
   - `notifications.css` - Notification bell styles
   - `toast.css` - Toast styles

3. **Service created**
   - `NotificationService.js` - All API calls

---

## 📝 How to Use

### 1. Send Quiz Completion Notification (Backend)

```python
from app.routes.notifications import notify_quiz_completed

# In your quiz submission endpoint
@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, answers: dict, db: Session = Depends(get_db)):
    score = calculate_score(answers, quiz_id, db)
    passed = score >= 70

    # Send notification
    notify_quiz_completed(db, user_id=1, quiz_id=quiz_id, score=score, passed=passed)

    return {"score": score, "passed": passed}
```

### 2. Send Course Assignment Notification (Backend)

```python
from app.routes.notifications import notify_course_assigned

@router.post("/courses/{course_id}/assign-users")
def assign_course_to_users(course_id: int, user_ids: List[int], db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    for user_id in user_ids:
        # ... create enrollment ...
        notify_course_assigned(db, user_id, course_id, course.title)

    return {"message": "Course assigned"}
```

### 3. Send Certificate Notification (Backend)

```python
from app.routes.notifications import notify_certificate_generated

@router.post("/certificates/issue")
def issue_certificate(user_id: int, course_id: int, db: Session = Depends(get_db)):
    cert_number = f"CERT-{datetime.now().year}-{user_id}-{course_id}"

    certificate = Certificate(
        user_id=user_id,
        course_id=course_id,
        certificate_number=cert_number
    )
    db.add(certificate)
    db.commit()

    course = db.query(Course).filter(Course.id == course_id).first()
    notify_certificate_generated(db, user_id, course_id, course.title, cert_number)

    return {"certificate_number": cert_number}
```

### 4. Display Notifications (Frontend)

```jsx
import NotificationBell from "./components/NotificationBell";

function App() {
  const userId = localStorage.getItem("user_id");

  return (
    <div>
      {/* Add to TopNav or Header */}
      <NotificationBell userId={userId} />
    </div>
  );
}
```

### 5. Show Toast Notifications (Frontend)

```jsx
import { useToast } from "./components/ToastNotification";

function MyComponent() {
  const { toasts, addToast, removeToast, ToastContainer } = useToast();

  const handleSuccess = () => {
    addToast("success", "Success", "Operation completed successfully");
  };

  const handleError = () => {
    addToast("error", "Error", "Something went wrong");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

---

## 🔧 Configuration

### Email Setup (Optional)

Create or update `.env` file in backend:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
```

For Gmail:

1. Enable "Less secure app access" or
2. Generate an "App Password" from Google Account

---

## 📊 File Structure

```
Backend:
├── app/
│   ├── models/
│   │   └── models.py (Notification, NotificationType, NotificationChannel)
│   ├── routes/
│   │   └── notifications.py (All endpoints & helper functions)
│   └── schemas.py (Notification schemas)
└── main.py (Route included)

Frontend:
├── src/
│   ├── components/
│   │   ├── NotificationBell.jsx
│   │   └── ToastNotification.jsx
│   ├── services/
│   │   └── NotificationService.js
│   └── styles/
│       ├── notifications.css
│       └── toast.css
└── NOTIFICATIONS.md (Complete documentation)
```

---

## 🔑 Key Features Implemented

✅ **Multiple Notification Types**

- Quiz Completed
- Course Assigned
- Certificate Generated
- Admin Alerts
- Progress Updates

✅ **Multiple Channels**

- In-App (Dashboard)
- Email
- Toast (Popup)
- Push (Ready for expansion)

✅ **Core Features**

- Get all notifications
- Get unread count
- Mark as read (single/all)
- Delete notifications (single/all)
- Notification Bell with Badge
- Toast notification system
- Email notifications

---

## 💡 Next Steps

1. Test the API endpoints manually using Postman or curl
2. Add NotificationBell to your TopNav component
3. Add ToastContainer to your App component
4. Integrate helper functions in your existing endpoints
5. Configure email settings in .env
6. Test end-to-end notifications

---

## 🐛 Troubleshooting

**Notifications not appearing?**

- Check if notifications endpoint is accessible
- Verify user_id is correct
- Check browser console for errors

**Emails not sending?**

- Verify SMTP credentials in .env
- Check email configuration
- Enable "Less secure apps" for Gmail

**Import errors?**

- Ensure all files are in correct directories
- Check file paths
- Verify imports match your project structure

---

## 📚 Full Documentation

See `NOTIFICATIONS.md` for:

- Complete API reference
- Database schema details
- Integration examples
- Best practices
- Future enhancements
