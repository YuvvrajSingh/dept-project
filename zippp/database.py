import hashlib
import os
from urllib.parse import urlparse

import certifi
from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv()


BRANCHES = ["CSE", "IT", "ADS"]
YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]


def _require_env(name: str, fallback: str = "") -> str:
    value = os.getenv(name, fallback).strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _db_name_from_uri(uri: str, fallback: str) -> str:
    parsed = urlparse(uri)
    if parsed.path and parsed.path != "/":
        return parsed.path.lstrip("/")
    return fallback


# Single DB mode: all AI workflow + timetable source-of-truth collections live in one DB.
DATABASE_URL = _require_env("DATABASE_URL", os.getenv("TIMETABLE_MONGO_URI", ""))
TIMETABLE_DB_NAME = os.getenv(
    "TIMETABLE_DB_NAME",
    _db_name_from_uri(DATABASE_URL, "department_timetable"),
).strip() or "department_timetable"


_ca_file = certifi.where()

mongo_client = MongoClient(DATABASE_URL, tlsCAFile=_ca_file)

ai_db = mongo_client[TIMETABLE_DB_NAME]
timetable_db = ai_db

# Backward-compatible alias for existing scripts that still import `db`.
db = ai_db


def hash_password(password: str) -> str:
    """Legacy SHA256 hashing used by older teacher records."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def init_db() -> None:
    """Create indexes for AI workflow collections and key timetable lookups."""
    ai_db.config.create_index("key", unique=True)
    ai_db.exams.create_index("teacher_name")
    ai_db.exams.create_index("is_active")
    ai_db.questions.create_index([("exam_id", 1), ("question_number", 1)], unique=True)
    ai_db.submission_queue.create_index([("exam_id", 1), ("roll_number", 1)], unique=True)
    ai_db.submission_queue.create_index([("exam_id", 1), ("status", 1)])
    ai_db.student_results.create_index([("exam_id", 1), ("roll_number", 1), ("question_number", 1)], unique=True)
    ai_db.student_results.create_index([("exam_id", 1), ("roll_number", 1)])
    ai_db.objections.create_index([("exam_id", 1), ("roll_number", 1)])

    print("MongoDB collections and indexes initialized.")
