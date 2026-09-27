from app.models.audit_log import AuditLog
from app.models.notification import Notification

def create_audit_log(db, user_id, action, details):
    """
    Creates an audit log entry in the current session without prematurely committing.
    Flushes changes to generate IDs while preserving transaction atomicity and row locks.
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(log)
    db.flush()
    return log

def create_notification(db, user_id, title, message):
    """
    Creates a notification entry in the current session without prematurely committing.
    Flushes changes to generate IDs while preserving transaction atomicity and row locks.
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )
    db.add(notification)
    db.flush()
    return notification
