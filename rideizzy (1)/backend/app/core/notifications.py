"""
Simple notification writer. The mobile app polls GET /notifications/me
(and a separate admin feed) rather than this needing a push service yet -
swap in Firebase Cloud Messaging here later without changing callers.
"""
from datetime import datetime, timezone
from app.core.firebase import db


def notify_user(user_id: str, title: str, body: str, notif_type: str = "info"):
    db.collection("notifications").add({
        "audience": "user",
        "userId": user_id,
        "title": title,
        "body": body,
        "type": notif_type,
        "read": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })


def notify_admins(title: str, body: str, notif_type: str = "info"):
    """Broadcast to the admin feed rather than one uid - any admin can see it."""
    db.collection("notifications").add({
        "audience": "admin_broadcast",
        "userId": None,
        "title": title,
        "body": body,
        "type": notif_type,
        "read": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })
