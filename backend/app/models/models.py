import enum


class NotificationType(str, enum.Enum):
    QUIZ_COMPLETED = "quiz_completed"
    COURSE_ASSIGNED = "course_assigned"
    CERTIFICATE_GENERATED = "certificate_generated"
    ADMIN_ALERT = "admin_alert"
    PROGRESS_UPDATE = "progress_update"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    TOAST = "toast"
    PUSH = "push"
