from pymongo import MongoClient
from bson import ObjectId
from app.config import settings

client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB_NAME]

# Collections
users_col = db["users"]
courses_col = db["courses"]
sops_col = db["sops"]
quizzes_col = db["quizzes"]
questions_col = db["questions"]
question_options_col = db["question_options"]
quiz_attempts_col = db["quiz_attempts"]
enrollments_col = db["enrollments"]
progress_col = db["progress"]
certificates_col = db["certificates"]
notifications_col = db["notifications"]
training_sessions_col = db["training_sessions"]


def doc_to_dict(doc):
    """Convert a MongoDB document to a plain dict with string 'id' field."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc
