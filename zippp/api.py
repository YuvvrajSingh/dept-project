import base64
import csv
import io
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import bcrypt
import httpx
from bson import ObjectId
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymongo import ReturnDocument
from starlette.datastructures import UploadFile as StarletteUploadFile

from database import ai_db, hash_password, init_db, timetable_db


AI_FASTAPI_BASE_URL = (
    os.getenv("AI_FASTAPI_BASE_URL")
    or os.getenv("GPU_FASTAPI_BASE_URL", "")
).strip().rstrip("/")
AI_PROXY_TIMEOUT_SECONDS = float(
    os.getenv("AI_PROXY_TIMEOUT_SECONDS")
    or os.getenv("GPU_PROXY_TIMEOUT_SECONDS", "300")
)
AI_EXECUTION_DEVICE = os.getenv("AI_EXECUTION_DEVICE", "cpu").strip().lower()
AI_LOCAL_MODE = os.getenv("AI_LOCAL_MODE", "auto").strip().lower()
try:
    SERVICE_PORT = int(os.getenv("PORT", "8000"))
except ValueError:
    SERVICE_PORT = 8000

UPLOAD_DIR = "uploads"
DIAGRAM_DIR = "diagrams"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DIAGRAM_DIR, exist_ok=True)


app = FastAPI(title="timetable-ai-service", version="2.0.0")

_cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "*").strip()
allow_origins = ["*"] if _cors_origins == "*" else [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/diagrams", StaticFiles(directory=DIAGRAM_DIR), name="diagrams")
init_db()

SHARED_SECRET = (os.getenv("GRADEAI_SHARED_SECRET") or os.getenv("GRADEAI_SECRET") or "").strip()
if not SHARED_SECRET:
    raise RuntimeError("GRADEAI_SHARED_SECRET (or GRADEAI_SECRET) env var is required")


class StudentVerifyRequest(BaseModel):
    exam_id: int
    roll_number: str


class PhotoData(BaseModel):
    question_number: int
    images_base64: List[str]


class StudentUploadRequest(BaseModel):
    exam_id: int
    student_name: str
    roll_number: str
    year: str
    branch: str
    email: Optional[str] = ""
    questions: List[PhotoData]


def to_jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: to_jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_jsonable(v) for v in value]
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def get_active_session() -> str:
    conf = ai_db.config.find_one({"key": "current_session"})
    return conf["value"] if conf and conf.get("value") else "2025-26"


def get_next_id(collection_name: str) -> int:
    result = ai_db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if not result or "seq" not in result:
        raise HTTPException(status_code=500, detail=f"Counter generation failed for {collection_name}")
    return int(result["seq"])


def _matches_password(plain_password: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
        except ValueError:
            return False
    return hash_password(plain_password) == stored_hash


def _hash_new_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _ci_query(value: str) -> Dict[str, Any]:
    return {"$regex": f"^{re.escape(value.strip())}$", "$options": "i"}


def _assigned_subjects_from_teacher(teacher: Optional[Dict[str, Any]]) -> Dict[str, List[str]]:
    if not teacher or not teacher.get("_id"):
        return {"Odd": [], "Even": []}

    teacher_subject_links = list(
        timetable_db.TeacherSubject.find(
            {"teacherId": teacher["_id"]},
            {"subjectId": 1},
        )
    )
    subject_ids = [link.get("subjectId") for link in teacher_subject_links if link.get("subjectId")]
    if not subject_ids:
        return {"Odd": [], "Even": []}

    class_subject_links = list(
        timetable_db.ClassSubject.find(
            {"subjectId": {"$in": subject_ids}},
            {"subjectId": 1, "classSectionId": 1},
        )
    )
    if not class_subject_links:
        return {"Odd": [], "Even": []}

    class_section_ids = [link.get("classSectionId") for link in class_subject_links if link.get("classSectionId")]
    class_sections = list(
        timetable_db.ClassSection.find(
            {"_id": {"$in": class_section_ids}},
            {"semester": 1},
        )
    )
    semester_by_section: Dict[Any, int] = {}
    for section in class_sections:
        semester_raw = section.get("semester")
        try:
            semester_by_section[section.get("_id")] = int(semester_raw)
        except (TypeError, ValueError):
            continue

    odd_subject_ids: set = set()
    even_subject_ids: set = set()
    for link in class_subject_links:
        subject_id = link.get("subjectId")
        class_section_id = link.get("classSectionId")
        semester = semester_by_section.get(class_section_id)
        if not subject_id or not semester:
            continue
        if semester in {1, 3, 5, 7}:
            odd_subject_ids.add(subject_id)
        elif semester in {2, 4, 6, 8}:
            even_subject_ids.add(subject_id)

    label_subject_ids = list(odd_subject_ids | even_subject_ids)
    if not label_subject_ids:
        return {"Odd": [], "Even": []}

    subjects = list(
        timetable_db.Subject.find(
            {"_id": {"$in": label_subject_ids}},
            {"code": 1, "name": 1},
        )
    )
    subject_label_by_id: Dict[Any, str] = {}
    for subject in subjects:
        label = (subject.get("code") or subject.get("name") or "").strip()
        if label:
            subject_label_by_id[subject.get("_id")] = label

    odd_labels = sorted({subject_label_by_id[sid] for sid in odd_subject_ids if sid in subject_label_by_id})
    even_labels = sorted({subject_label_by_id[sid] for sid in even_subject_ids if sid in subject_label_by_id})

    return {"Odd": odd_labels, "Even": even_labels}


def _resolve_teacher_identity(identity: str) -> Optional[Dict[str, Any]]:
    normalized = identity.strip()
    if not normalized:
        return None

    query = _ci_query(normalized)
    local = normalized.split("@", 1)[0].strip()
    local_query = _ci_query(local) if local else query

    user = timetable_db.User.find_one({"email": query, "isActive": {"$ne": False}})
    if user and user.get("teacherId"):
        teacher = timetable_db.Teacher.find_one({"_id": user["teacherId"], "isActive": {"$ne": False}})
        if teacher:
            return teacher

    teacher = timetable_db.Teacher.find_one({"name": query, "isActive": {"$ne": False}})
    if teacher:
        return teacher

    teacher = timetable_db.Teacher.find_one({"abbreviation": query, "isActive": {"$ne": False}})
    if teacher:
        return teacher

    if local:
        teacher = timetable_db.Teacher.find_one({"abbreviation": local_query, "isActive": {"$ne": False}})
        if teacher:
            return teacher
        teacher = timetable_db.Teacher.find_one({"name": local_query, "isActive": {"$ne": False}})
        if teacher:
            return teacher

    return None


def _authenticate_teacher(identifier: str, password: str) -> Dict[str, Any]:
    normalized_identifier = identifier.strip()
    query = _ci_query(normalized_identifier)
    identifier_local = normalized_identifier.split("@", 1)[0].strip()
    local_query = _ci_query(identifier_local) if identifier_local else query

    user = timetable_db.User.find_one({"email": query, "isActive": {"$ne": False}})
    teacher = None

    if user and user.get("teacherId"):
        teacher = timetable_db.Teacher.find_one({"_id": user["teacherId"]})

    if teacher is None:
        teacher = timetable_db.Teacher.find_one({"name": query, "isActive": {"$ne": False}})
        if teacher is None:
            teacher = timetable_db.Teacher.find_one({"abbreviation": query, "isActive": {"$ne": False}})
        if teacher is None and identifier_local:
            teacher = timetable_db.Teacher.find_one({"abbreviation": local_query, "isActive": {"$ne": False}})
        if teacher is None and identifier_local:
            teacher = timetable_db.Teacher.find_one({"name": local_query, "isActive": {"$ne": False}})

    if user is None and teacher is not None:
        user = timetable_db.User.find_one({"teacherId": teacher["_id"], "isActive": {"$ne": False}})
        if user is None:
            user = timetable_db.User.find_one({"email": local_query, "isActive": {"$ne": False}})

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = (user.get("role") or "").lower()
    if role and role not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Only teacher/admin users are allowed")

    if not _matches_password(password, user.get("passwordHash")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if teacher is None and user.get("teacherId"):
        teacher = timetable_db.Teacher.find_one({"_id": user["teacherId"]})
    if teacher is None:
        teacher = timetable_db.Teacher.find_one({"name": local_query, "isActive": {"$ne": False}})
    if teacher is None:
        teacher = timetable_db.Teacher.find_one({"abbreviation": local_query, "isActive": {"$ne": False}})

    if role == "teacher" and teacher is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    teacher_name = teacher.get("name") if teacher else user.get("email", identifier)
    assigned_subjects = _assigned_subjects_from_teacher(teacher)

    return {
        "user": user,
        "teacher": teacher,
        "teacher_name": teacher_name,
        "assigned_subjects": assigned_subjects,
    }


def verify_teacher(request: Request, teacher_name: str = None, password: str = None) -> Dict[str, Any]:
    x_secret = request.headers.get("x-backend-secret")
    x_teacher = request.headers.get("x-teacher-identity")
    
    if x_secret and x_secret == SHARED_SECRET:
        if not x_teacher:
            raise HTTPException(status_code=401, detail="X-Teacher-Identity missing")

        teacher = _resolve_teacher_identity(x_teacher)
        resolved_name = teacher.get("name") if teacher else x_teacher.strip()
        return {
            "user": None,
            "teacher": teacher,
            "teacher_name": resolved_name,
            "assigned_subjects": _assigned_subjects_from_teacher(teacher),
        }

    if not teacher_name or not password:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    return _authenticate_teacher(teacher_name, password)


def _normalize_year(raw_year: Any) -> str:
    if isinstance(raw_year, int):
        if raw_year == 1:
            return "1st Year"
        if raw_year == 2:
            return "2nd Year"
        if raw_year == 3:
            return "3rd Year"
        if raw_year == 4:
            return "4th Year"

    txt = str(raw_year or "").strip()
    if txt.lower().endswith("year"):
        return txt

    m = re.search(r"[1-4]", txt)
    if not m:
        return txt

    year_num = int(m.group(0))
    return _normalize_year(year_num)


def _year_to_number(year_text: Any) -> Optional[int]:
    m = re.search(r"[1-4]", str(year_text or ""))
    if not m:
        return None
    return int(m.group(0))


def _normalize_branch(raw_branch: Any) -> str:
    b = str(raw_branch or "").strip().upper().replace(" ", "")
    if b in {"CS", "CSE"}:
        return "CSE"
    if b in {"IT"}:
        return "IT"
    if b in {"ADS", "AIDS", "AI&DS", "AIDATASCIENCE", "AIDS"}:
        return "ADS"
    if "AI" in b and "DS" in b:
        return "ADS"
    return str(raw_branch or "").strip().upper()


def get_student_profile(roll_number: str) -> Optional[Dict[str, Any]]:
    rn = roll_number.strip().upper()
    student = timetable_db.Student.find_one({"rollNumber": _ci_query(rn), "isActive": {"$ne": False}})
    if not student:
        return None

    class_section = None
    if student.get("classSectionId"):
        class_section = timetable_db.ClassSection.find_one({"_id": student["classSectionId"]})

    branch_doc = None
    if class_section and class_section.get("branchId"):
        branch_doc = timetable_db.Branch.find_one({"_id": class_section["branchId"]})

    return {
        "roll_number": rn,
        "name": student.get("name", ""),
        "email": student.get("email", ""),
        "year": _normalize_year(class_section.get("year") if class_section else ""),
        "branch": _normalize_branch(branch_doc.get("name") if branch_doc else ""),
    }


def get_students_for_exam(exam: Dict[str, Any]) -> List[Dict[str, Any]]:
    target_year_num = _year_to_number(exam.get("year"))
    target_branch = _normalize_branch(exam.get("branch"))

    branch_ids = []
    for branch in timetable_db.Branch.find({}):
        if _normalize_branch(branch.get("name")) == target_branch:
            branch_ids.append(branch["_id"])

    if not branch_ids:
        return []

    section_query: Dict[str, Any] = {"branchId": {"$in": branch_ids}}
    if target_year_num is not None:
        section_query["year"] = {"$in": [target_year_num, str(target_year_num)]}

    class_sections = list(timetable_db.ClassSection.find(section_query, projection={"_id": 1}))
    section_ids = [sec["_id"] for sec in class_sections]
    if not section_ids:
        return []

    students = list(
        timetable_db.Student.find(
            {"classSectionId": {"$in": section_ids}, "isActive": {"$ne": False}},
            projection={"_id": 0, "rollNumber": 1, "name": 1, "email": 1},
        )
    )

    return [
        {
            "RollNo": s.get("rollNumber", "").upper(),
            "Name": s.get("name", ""),
            "Email": s.get("email", ""),
        }
        for s in students
    ]


def _is_self_ai_base_url(base_url: str) -> bool:
    if not base_url:
        return False

    try:
        parsed = urlparse(base_url if "://" in base_url else f"http://{base_url}")
    except Exception:
        return False

    host = (parsed.hostname or "").strip().lower()
    if not host:
        return False

    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80

    return host in {"127.0.0.1", "localhost", "0.0.0.0"} and port == SERVICE_PORT


def _use_local_ai() -> bool:
    if AI_LOCAL_MODE in {"1", "true", "yes", "on"}:
        return True
    if AI_LOCAL_MODE in {"0", "false", "no", "off"}:
        return False

    # Auto mode: run local AI when no upstream is configured or it points to this same service.
    if not AI_FASTAPI_BASE_URL:
        return True
    return _is_self_ai_base_url(AI_FASTAPI_BASE_URL)


def _safe_file_stem(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", str(value or "").strip())
    return cleaned or "unknown"


def _guess_ext_from_bytes(raw: bytes) -> str:
    if raw.startswith(b"\xFF\xD8\xFF"):
        return ".jpg"
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if raw.startswith(b"%PDF"):
        return ".pdf"
    return ".bin"


def _grade_from_percentage(percentage: float) -> str:
    if percentage >= 90:
        return "A"
    if percentage >= 75:
        return "B"
    if percentage >= 60:
        return "C"
    if percentage >= 40:
        return "D"
    return "F"


def _persist_question_images(exam_id: int, roll_number: str, questions: List[PhotoData]) -> List[Dict[str, Any]]:
    safe_roll = _safe_file_stem(roll_number.upper())
    base_dir = os.path.join(UPLOAD_DIR, f"exam_{exam_id}", safe_roll)
    os.makedirs(base_dir, exist_ok=True)

    saved_questions: List[Dict[str, Any]] = []
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    for question in questions:
        question_paths: List[str] = []

        for index, image_b64 in enumerate(question.images_base64, start=1):
            try:
                raw = base64.b64decode(image_b64.encode("utf-8"), validate=False)
            except Exception:
                continue

            if not raw:
                continue

            ext = _guess_ext_from_bytes(raw)
            filename = f"q{question.question_number}_{index}_{timestamp}{ext}"
            file_path = os.path.join(base_dir, filename)

            with open(file_path, "wb") as out:
                out.write(raw)

            question_paths.append(file_path.replace("\\", "/"))

        if question_paths:
            saved_questions.append(
                {
                    "question_number": int(question.question_number),
                    "image_paths": question_paths,
                }
            )

    return saved_questions


def _enqueue_local_submission(data: StudentUploadRequest) -> Dict[str, Any]:
    exam = ai_db.exams.find_one({"_id": data.exam_id, "is_active": True})
    if not exam:
        raise HTTPException(status_code=404, detail="Invalid or inactive Exam ID")

    roll_number = data.roll_number.strip().upper()
    profile = get_student_profile(roll_number)

    if profile:
        student_name = profile.get("name", "")
        year = profile.get("year", "")
        branch = profile.get("branch", "")
        email = profile.get("email", "")
    else:
        student_name = data.student_name.strip()
        year = _normalize_year(data.year)
        branch = _normalize_branch(data.branch)
        email = (data.email or "").strip()

    if not student_name or not year or not branch:
        raise HTTPException(status_code=422, detail="student_name, year, and branch are required")

    if branch != _normalize_branch(exam.get("branch")) or year != _normalize_year(exam.get("year")):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Branch/Year mismatch for exam. Expected {_normalize_year(exam.get('year'))} "
                f"{_normalize_branch(exam.get('branch'))}."
            ),
        )

    saved_questions = _persist_question_images(data.exam_id, roll_number, data.questions)
    if not saved_questions:
        raise HTTPException(status_code=422, detail="No valid question images were provided")

    now = datetime.utcnow()
    ai_db.student_results.delete_many({"exam_id": data.exam_id, "roll_number": roll_number})

    ai_db.submission_queue.update_one(
        {"exam_id": data.exam_id, "roll_number": roll_number},
        {
            "$set": {
                "student_name": student_name,
                "year": year,
                "branch": branch,
                "email": email,
                "answers": saved_questions,
                "status": "pending",
                "error": None,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": "Submission queued for local grading",
        "exam_id": data.exam_id,
        "roll_number": roll_number,
        "questions_received": len(saved_questions),
    }


def _process_pending_local(exam_id: int, target_roll: Optional[str] = None) -> Dict[str, Any]:
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    query: Dict[str, Any] = {"exam_id": exam_id, "status": {"$in": ["pending", "failed", "processing"]}}
    if target_roll:
        query["roll_number"] = target_roll.strip().upper()

    queue_entries = list(ai_db.submission_queue.find(query))
    if not queue_entries:
        return {
            "success": True,
            "mode": "local",
            "exam_id": exam_id,
            "processed": 0,
            "failed": 0,
            "graded_questions": 0,
        }

    questions = list(ai_db.questions.find({"exam_id": exam_id}))
    questions_by_number = {int(q.get("question_number")): q for q in questions if q.get("question_number") is not None}
    if not questions_by_number:
        raise HTTPException(status_code=400, detail="No questions configured for exam")

    try:
        from ocr import extract_text_from_image
        from grader import get_ai_grade
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local AI modules unavailable: {exc}") from exc

    processed = 0
    failed = 0
    graded_questions = 0

    for entry in queue_entries:
        roll = str(entry.get("roll_number", "")).strip().upper()
        answers = entry.get("answers") or []
        now = datetime.utcnow()

        if not roll or not isinstance(answers, list) or not answers:
            ai_db.submission_queue.update_one(
                {"_id": entry["_id"]},
                {
                    "$set": {
                        "status": "failed",
                        "error": "No answer payload found for submission",
                        "updated_at": now,
                    }
                },
            )
            failed += 1
            continue

        ai_db.submission_queue.update_one(
            {"_id": entry["_id"]},
            {"$set": {"status": "processing", "error": None, "updated_at": now}},
        )

        ai_db.student_results.delete_many({"exam_id": exam_id, "roll_number": roll})

        try:
            graded_for_submission = 0

            for answer in answers:
                try:
                    question_number = int(answer.get("question_number"))
                except Exception:
                    continue

                question = questions_by_number.get(question_number)
                if not question:
                    continue

                image_paths = [p for p in answer.get("image_paths", []) if isinstance(p, str) and p]
                extracted_parts: List[str] = []

                for image_path in image_paths:
                    try:
                        extracted_parts.append(extract_text_from_image(image_path))
                    except Exception as ocr_exc:
                        extracted_parts.append(f"[OCR_ERROR] {ocr_exc}")

                extracted_text = "\n\n".join([txt for txt in extracted_parts if txt]).strip()
                model_answer = str(question.get("model_answer") or "")
                total_marks = float(question.get("total_marks") or 0)

                try:
                    grade_data = get_ai_grade(
                        extracted_text or "No readable answer extracted.",
                        model_answer,
                        total_marks=total_marks,
                    )
                except Exception as grade_exc:
                    grade_data = {
                        "marks_awarded": 0,
                        "grade": "F",
                        "feedback": f"Local grading failed: {grade_exc}",
                    }

                marks_awarded = float(grade_data.get("marks_awarded") or 0)
                if marks_awarded < 0:
                    marks_awarded = 0
                if total_marks > 0:
                    marks_awarded = min(marks_awarded, total_marks)

                percentage = (marks_awarded / total_marks * 100) if total_marks > 0 else 0
                grade = str(grade_data.get("grade") or _grade_from_percentage(percentage))
                feedback = str(grade_data.get("feedback") or "")

                ai_db.student_results.update_one(
                    {
                        "exam_id": exam_id,
                        "roll_number": roll,
                        "question_number": question_number,
                    },
                    {
                        "$set": {
                            "student_name": entry.get("student_name", ""),
                            "marks_awarded": marks_awarded,
                            "total_marks": total_marks,
                            "grade": grade,
                            "feedback": feedback,
                            "image_path": ",".join(image_paths),
                            "extracted_ocr_text": extracted_text,
                            "model_answer": model_answer,
                            "updated_at": now,
                        },
                        "$setOnInsert": {"created_at": now},
                    },
                    upsert=True,
                )

                graded_for_submission += 1
                graded_questions += 1

            if graded_for_submission == 0:
                ai_db.submission_queue.update_one(
                    {"_id": entry["_id"]},
                    {
                        "$set": {
                            "status": "failed",
                            "error": "No matching questions found while grading submission",
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )
                failed += 1
                continue

            ai_db.submission_queue.update_one(
                {"_id": entry["_id"]},
                {
                    "$set": {
                        "status": "done",
                        "error": None,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            processed += 1
        except Exception as exc:
            ai_db.submission_queue.update_one(
                {"_id": entry["_id"]},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(exc),
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            failed += 1

    return {
        "success": failed == 0,
        "mode": "local",
        "exam_id": exam_id,
        "processed": processed,
        "failed": failed,
        "graded_questions": graded_questions,
    }


def _gpu_proxy_url(path: str) -> str:
    if not AI_FASTAPI_BASE_URL:
        raise HTTPException(
            status_code=503,
            detail="AI_FASTAPI_BASE_URL is not configured. Cannot proxy AI operation.",
        )
    if _is_self_ai_base_url(AI_FASTAPI_BASE_URL):
        raise HTTPException(
            status_code=500,
            detail=(
                "AI_FASTAPI_BASE_URL points to this same zippp service. "
                "Use local mode (AI_LOCAL_MODE=auto/true) or configure a separate upstream AI worker."
            ),
        )
    if not path.startswith("/"):
        path = "/" + path
    return f"{AI_FASTAPI_BASE_URL}{path}"


async def proxy_to_gpu(
    *,
    method: str,
    path: str,
    json_payload: Optional[Dict[str, Any]] = None,
    form_payload: Optional[Dict[str, Any]] = None,
    files_payload: Optional[Dict[str, Any]] = None,
) -> Response:
    url = _gpu_proxy_url(path)
    timeout = httpx.Timeout(AI_PROXY_TIMEOUT_SECONDS, connect=min(15.0, AI_PROXY_TIMEOUT_SECONDS))

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.request(
                method=method,
                url=url,
                json=json_payload,
                data=form_payload,
                files=files_payload,
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"AI proxy request failed: {exc}") from exc

    content_type = resp.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            payload = resp.json()
        except ValueError:
            payload = {"detail": resp.text}
        return JSONResponse(status_code=resp.status_code, content=to_jsonable(payload))

    passthrough_headers = {}
    if "content-disposition" in resp.headers:
        passthrough_headers["content-disposition"] = resp.headers["content-disposition"]

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=content_type if content_type else None,
        headers=passthrough_headers,
    )


@app.get("/healthz")
def healthz() -> Dict[str, Any]:
    ai_db.command("ping")
    timetable_db.command("ping")
    return {
        "ok": True,
        "service": "timetable-ai-service",
        "ai_proxy_configured": bool(AI_FASTAPI_BASE_URL),
        "gpu_proxy_configured": bool(AI_FASTAPI_BASE_URL),
        "ai_execution_device": AI_EXECUTION_DEVICE,
        "ai_runtime_mode": "local" if _use_local_ai() else "proxy",
        "active_session": get_active_session(),
    }


@app.get("/api/proxy/status")
def proxy_status() -> Dict[str, Any]:
    return {
        "ai_proxy_configured": bool(AI_FASTAPI_BASE_URL),
        "ai_base_url": AI_FASTAPI_BASE_URL or None,
        "gpu_proxy_configured": bool(AI_FASTAPI_BASE_URL),
        "gpu_base_url": AI_FASTAPI_BASE_URL or None,
        "ai_execution_device": AI_EXECUTION_DEVICE,
        "ai_local_mode_config": AI_LOCAL_MODE,
        "ai_runtime_mode": "local" if _use_local_ai() else "proxy",
    }


@app.get("/options")
def get_options() -> Dict[str, List[str]]:
    return {"branches": BRANCHES, "years": YEARS}


@app.post("/api/teacher/register")
def register_teacher() -> Dict[str, str]:
    raise HTTPException(
        status_code=405,
        detail="Teacher registration is managed by department_timetable backend.",
    )


@app.post("/api/teacher/login")
def login_teacher(name: str = Form(...), password: Optional[str] = Form(None)) -> Dict[str, Any]:
    auth = _authenticate_teacher(name, password)

    return {
        "message": "Login successful",
        "teacher_name": auth["teacher_name"],
        "assigned_subjects": auth["assigned_subjects"],
    }


@app.post("/api/teacher/change-password")
def change_password(
    request: Request,
    teacher_name: Optional[str] = Form(None),
    old_password: Optional[str] = Form(None),
    new_password: Optional[str] = Form(None),
) -> Dict[str, str]:
    auth = verify_teacher(request, teacher_name, old_password)
    if not auth.get("user"):
        raise HTTPException(status_code=403, detail="Password update requires direct teacher credentials")

    timetable_db.User.update_one(
        {"_id": auth["user"]["_id"]},
        {"$set": {"passwordHash": _hash_new_password(new_password), "updatedAt": datetime.utcnow()}},
    )
    return {"message": "Password updated successfully"}


@app.post("/api/teacher/delete-account")
def delete_teacher_account(
    request: Request,
    name: str = Form(...),
    password: Optional[str] = Form(None),
) -> Dict[str, str]:
    auth = verify_teacher(request, name, password)
    if not auth.get("user"):
        raise HTTPException(status_code=403, detail="Account deactivation requires direct teacher credentials")

    timetable_db.User.update_one(
        {"_id": auth["user"]["_id"]},
        {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}},
    )
    return {"message": "Account deactivated successfully"}


@app.get("/api/config/session")
def get_session_api() -> Dict[str, str]:
    return {"current_session": get_active_session()}


@app.post("/api/config/session")
def update_session_api(
    request: Request,
    session: str = Form(...),
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    if "-" not in session:
        raise HTTPException(status_code=400, detail="Invalid session format. Use e.g. 2025-26")
    ai_db.config.update_one({"key": "current_session"}, {"$set": {"value": session}}, upsert=True)
    return {"message": f"Academic session updated to {session}"}


@app.post("/api/teacher/create-exam")
def create_exam(
    request: Request,
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    year: str = Form(...),
    branch: str = Form(...),
    subject: str = Form(...),
    semester: str = Form(...),
    exam_type: str = Form(...),
    exam_name: str = Form(None),
) -> Dict[str, Any]:
    auth = verify_teacher(request, teacher_name, password)

    normalized_year = _normalize_year(year)
    normalized_branch = _normalize_branch(branch)

    active_same_subject = ai_db.exams.find({"subject": subject, "is_active": True})
    for exam in active_same_subject:
        if _normalize_year(exam.get("year")) == normalized_year and _normalize_branch(exam.get("branch")) == normalized_branch:
            raise HTTPException(status_code=400, detail="Active exam already exists")

    exam_id = get_next_id("exams")
    ai_db.exams.insert_one(
        {
            "_id": exam_id,
            "teacher_name": auth["teacher_name"],
            "academic_year": get_active_session(),
            "semester": semester,
            "exam_type": exam_type,
            "exam_name": exam_name,
            "year": normalized_year,
            "branch": normalized_branch,
            "subject": subject,
            "is_active": True,
            "results_published": False,
            "created_at": datetime.utcnow(),
        }
    )
    return {"exam_id": exam_id, "message": "Exam created successfully"}


@app.post("/api/teacher/add-question")
async def add_question(
    request: Request,
    exam_id: int = Form(...),
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    question_number: int = Form(...),
    question_text: str = Form(...),
    model_answer: str = Form(...),
    total_marks: int = Form(...),
    diagram_image: UploadFile = File(None),
    diagram_url: str = Form(None),
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)

    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    diagram_path = None
    if diagram_image and diagram_image.filename:
        contents = await diagram_image.read()
        if contents:
            diagram_path = f"{DIAGRAM_DIR}/exam{exam_id}_Q{question_number}_diagram.jpg"
            with open(diagram_path, "wb") as f:
                f.write(contents)
    elif diagram_url:
        diagram_path = diagram_url

    ai_db.questions.update_one(
        {"exam_id": exam_id, "question_number": question_number},
        {
            "$set": {
                "question_text": question_text,
                "model_answer": model_answer,
                "total_marks": total_marks,
                "diagram_image_path": diagram_path,
            }
        },
        upsert=True,
    )
    return {"message": "Question added successfully"}


@app.get("/api/teacher/get_attendance/{exam_id}")
def get_attendance(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    students = get_students_for_exam(exam)
    return {"students": students}


@app.get("/api/teacher/get_submissions/{exam_id}")
def get_submissions(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)
    pending_rolls = ai_db.submission_queue.distinct("roll_number", {"exam_id": exam_id})
    result_rolls = ai_db.student_results.distinct("roll_number", {"exam_id": exam_id})
    return {"submitted_rolls": sorted(set(pending_rolls + result_rolls))}


@app.get("/api/teacher/my-exams")
@app.get("/api/teacher/active-exams")
def get_my_exams(request: Request, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    auth = verify_teacher(request, teacher_name, password)
    exams = list(ai_db.exams.find({"teacher_name": auth["teacher_name"]}).sort("created_at", -1))
    for exam in exams:
        exam["student_count"] = len(ai_db.student_results.distinct("roll_number", {"exam_id": exam["_id"]}))
        exam["pending_count"] = ai_db.submission_queue.count_documents(
            {"exam_id": exam["_id"], "status": "pending"}
        )
        exam["q_count"] = ai_db.questions.count_documents({"exam_id": exam["_id"]})
    return {"exams": to_jsonable(exams)}


@app.post("/api/teacher/publish-results/{exam_id}")
def publish_results(
    request: Request,
    exam_id: int,
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    ai_db.exams.update_one({"_id": exam_id}, {"$set": {"results_published": True}})
    return {"message": "Results published successfully"}


@app.post("/api/teacher/toggle-exam-status/{exam_id}")
def toggle_exam_status(
    request: Request,
    exam_id: int,
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    is_active = not exam.get("is_active", False)
    ai_db.exams.update_one({"_id": exam_id}, {"$set": {"is_active": is_active}})
    return {"is_active": is_active}


@app.delete("/api/teacher/delete-exam/{exam_id}")
def delete_exam(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    ai_db.exams.delete_one({"_id": exam_id})
    ai_db.questions.delete_many({"exam_id": exam_id})
    ai_db.submission_queue.delete_many({"exam_id": exam_id})
    ai_db.student_results.delete_many({"exam_id": exam_id})
    ai_db.objections.delete_many({"exam_id": exam_id})
    return {"message": "Exam and related data deleted"}


@app.get("/api/teacher/objections/{exam_id}")
def get_teacher_objections(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)
    objections = list(ai_db.objections.find({"exam_id": exam_id}))
    return {"objections": to_jsonable(objections)}


@app.post("/api/teacher/resolve-objection")
def resolve_objection(
    request: Request,
    obj_id: str = Form(...),
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    new_marks: Optional[float] = Form(None),
    feedback: str = Form(...),
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    obj = ai_db.objections.find_one({"_id": ObjectId(obj_id)})
    if not obj:
        raise HTTPException(status_code=404, detail="Objection not found")

    update_data: Dict[str, Any] = {"status": "resolved", "teacher_feedback": feedback}
    if new_marks is not None:
        update_data["final_marks"] = new_marks
        ai_db.student_results.update_one(
            {
                "exam_id": obj["exam_id"],
                "roll_number": obj["roll_number"],
                "question_number": obj["question_number"],
            },
            {"$set": {"marks_awarded": new_marks, "feedback": f"RESOLVED: {feedback}"}},
        )

    ai_db.objections.update_one({"_id": ObjectId(obj_id)}, {"$set": update_data})
    return {"message": "Objection resolved"}


@app.get("/api/teacher/grading_progress/{exam_id}")
def grading_progress(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, int]:
    verify_teacher(request, teacher_name, password)
    total = ai_db.submission_queue.count_documents({"exam_id": exam_id})
    if total == 0:
        graded_any = ai_db.student_results.count_documents({"exam_id": exam_id}) > 0
        return {"progress": 100 if graded_any else 0, "total": 0, "graded": 0, "failed": 0}

    graded = ai_db.submission_queue.count_documents({"exam_id": exam_id, "status": "done"})
    failed = ai_db.submission_queue.count_documents({"exam_id": exam_id, "status": "failed"})
    progress = int((graded / float(total)) * 100)
    return {"progress": progress, "total": total, "graded": graded, "failed": failed}


@app.get("/api/teacher/get-results/{exam_id}")
def get_results(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)

    total_q_marks = list(
        ai_db.questions.aggregate(
            [
                {"$match": {"exam_id": exam_id}},
                {"$group": {"_id": None, "total": {"$sum": "$total_marks"}}},
            ]
        )
    )
    max_marks = total_q_marks[0]["total"] if total_q_marks else 0

    results = list(
        ai_db.student_results.aggregate(
            [
                {"$match": {"exam_id": exam_id}},
                {
                    "$group": {
                        "_id": "$roll_number",
                        "name": {"$first": "$student_name"},
                        "total_obtained": {"$sum": "$marks_awarded"},
                        "questions_graded": {"$sum": 1},
                    }
                },
            ]
        )
    )

    processed = []
    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    total_scores = 0.0

    for row in results:
        percentage = (row["total_obtained"] / max_marks * 100) if max_marks > 0 else 0
        grade = "F"
        if percentage >= 90:
            grade = "A"
        elif percentage >= 75:
            grade = "B"
        elif percentage >= 60:
            grade = "C"
        elif percentage >= 40:
            grade = "D"

        grade_dist[grade] += 1
        total_scores += float(row["total_obtained"])

        processed.append(
            {
                "roll_number": row["_id"],
                "name": row.get("name", ""),
                "obtained": round(float(row["total_obtained"]), 2),
                "max": max_marks,
                "percentage": round(percentage, 1),
                "grade": grade,
                "questions_graded": row["questions_graded"],
            }
        )

    avg_score = round(total_scores / len(processed), 2) if processed else 0

    return {
        "students": processed,
        "analytics": {
            "avg_score": avg_score,
            "max_marks": max_marks,
            "grade_distribution": grade_dist,
            "total_students": len(processed),
        },
    }


@app.get("/api/teacher/get-student-details/{exam_id}/{roll_number}")
def get_student_details(request: Request, exam_id: int, roll_number: str, teacher_name: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    verify_teacher(request, teacher_name, password)
    details = list(
        ai_db.student_results.find({"exam_id": exam_id, "roll_number": roll_number}).sort("question_number", 1)
    )
    for detail in details:
        question = ai_db.questions.find_one(
            {"exam_id": exam_id, "question_number": detail.get("question_number")},
            projection={"_id": 0, "model_answer": 1},
        )
        if question:
            detail["model_answer"] = question.get("model_answer")
    return {"details": to_jsonable(details)}


@app.get("/api/teacher/export-results-csv/{exam_id}")
def export_results_csv(request: Request, exam_id: int, teacher_name: Optional[str] = None, password: Optional[str] = None) -> StreamingResponse:
    verify_teacher(request, teacher_name, password)

    total_q_marks = list(
        ai_db.questions.aggregate(
            [
                {"$match": {"exam_id": exam_id}},
                {"$group": {"_id": None, "total": {"$sum": "$total_marks"}}},
            ]
        )
    )
    max_marks = total_q_marks[0]["total"] if total_q_marks else 0

    results = list(
        ai_db.student_results.aggregate(
            [
                {"$match": {"exam_id": exam_id}},
                {
                    "$group": {
                        "_id": "$roll_number",
                        "name": {"$first": "$student_name"},
                        "total_obtained": {"$sum": "$marks_awarded"},
                    }
                },
            ]
        )
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Roll Number", "Name", "Marks Obtained", "Total Marks", "Percentage", "Grade"])

    for row in results:
        perc = (row["total_obtained"] / max_marks * 100) if max_marks > 0 else 0
        grade = "F"
        if perc >= 90:
            grade = "A"
        elif perc >= 75:
            grade = "B"
        elif perc >= 60:
            grade = "C"
        elif perc >= 40:
            grade = "D"

        writer.writerow([row["_id"], row.get("name", ""), row["total_obtained"], max_marks, f"{perc:.1f}%", grade])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=results_exam_{exam_id}.csv"},
    )


@app.post("/api/teacher/process-pending/{exam_id}")
async def process_pending_proxy(
    request: Request,
    exam_id: int,
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
) -> Response:
    verify_teacher(request, teacher_name, password)
    if _use_local_ai():
        return JSONResponse(content=to_jsonable(_process_pending_local(exam_id)))
    return await proxy_to_gpu(
        method="POST",
        path=f"/api/teacher/process-pending/{exam_id}",
        form_payload={"teacher_name": teacher_name, "password": password},
    )


@app.get("/api/student/active-exams/{roll_number}")
def get_active_exams(roll_number: str) -> Dict[str, Any]:
    student = get_student_profile(roll_number)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    exams = list(
        ai_db.exams.find(
            {
                "year": student["year"],
                "branch": student["branch"],
                "is_active": True,
            }
        )
    )

    for exam in exams:
        existing = ai_db.submission_queue.find_one(
            {"exam_id": exam["_id"], "roll_number": student["roll_number"]},
            projection={"_id": 1},
        )
        exam["has_submitted"] = bool(existing)
        exam["q_count"] = ai_db.questions.count_documents({"exam_id": exam["_id"]})

    return {"student_name": student["name"], "exams": to_jsonable(exams)}


@app.post("/api/student/verify")
def student_verify(req: StudentVerifyRequest) -> Dict[str, Any]:
    exam = ai_db.exams.find_one({"_id": req.exam_id, "is_active": True})
    if not exam:
        return {"error": "Invalid or inactive Exam ID"}

    student = get_student_profile(req.roll_number)
    if not student:
        return {"error": "Roll Number not found in class records."}

    exam_year = _normalize_year(exam.get("year"))
    exam_branch = _normalize_branch(exam.get("branch"))
    student_year = _normalize_year(student.get("year"))
    student_branch = _normalize_branch(student.get("branch"))

    if student_branch != exam_branch or student_year != exam_year:
        return {
            "error": (
                f"Branch/Year Mismatch: This exam is for {exam_year} {exam_branch} "
                f"students only. Your profile is {student_year} {student_branch}."
            )
        }

    existing = ai_db.submission_queue.find_one(
        {"exam_id": req.exam_id, "roll_number": student["roll_number"]},
        projection={"_id": 1},
    )
    q_count = ai_db.questions.count_documents({"exam_id": req.exam_id})

    return {
        "success": True,
        "name": student["name"],
        "email": student.get("email", ""),
        "year": student_year,
        "branch": student_branch,
        "subject": exam.get("subject"),
        "total_questions": q_count,
        "exam_id": exam["_id"],
        "has_submitted": bool(existing),
        "results_published": exam.get("results_published", False),
    }


@app.post("/api/student/upload")
async def api_student_upload(request: Request, background_tasks: BackgroundTasks) -> Response:
    content_type = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type:
        form = await request.form()
        exam_id_raw = form.get("exam_id")
        roll_number_raw = form.get("roll_number")

        if exam_id_raw is None or roll_number_raw is None:
            raise HTTPException(status_code=422, detail="multipart upload requires exam_id and roll_number")

        try:
            exam_id = int(str(exam_id_raw).strip())
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="exam_id must be an integer") from exc

        roll_number = str(roll_number_raw).strip().upper()
        if not roll_number:
            raise HTTPException(status_code=422, detail="roll_number cannot be empty")

        if "scanned_sheet" in form:
            raise HTTPException(
                status_code=422,
                detail="Single-sheet upload is no longer supported. Upload files using question keys like q_1, q_2.",
            )

        # Question-wise files in multipart, where each field key is q_<questionNumber>
        question_images: Dict[int, List[str]] = {}
        for key, value in form.multi_items():
            if not key.startswith("q_"):
                continue
            if not isinstance(value, StarletteUploadFile):
                continue

            q_raw = key[2:].strip()
            if not q_raw.isdigit():
                raise HTTPException(status_code=422, detail=f"Invalid question file field: {key}")

            q_num = int(q_raw)
            if q_num < 1:
                raise HTTPException(status_code=422, detail=f"Invalid question number in field: {key}")

            file_bytes = await value.read()
            if not file_bytes:
                continue

            encoded = base64.b64encode(file_bytes).decode("utf-8")
            question_images.setdefault(q_num, []).append(encoded)

        if not question_images:
            raise HTTPException(
                status_code=422,
                detail=(
                    "multipart upload requires question-wise files with keys like q_1, q_2"
                ),
            )

        student_name = str(form.get("student_name") or "").strip()
        year = str(form.get("year") or "").strip()
        branch = str(form.get("branch") or "").strip()
        email = str(form.get("email") or "").strip()

        if not (student_name and year and branch):
            profile = get_student_profile(roll_number)
            if profile:
                student_name = student_name or profile.get("name", "")
                year = year or profile.get("year", "")
                branch = branch or profile.get("branch", "")
                email = email or profile.get("email", "")

        if not student_name or not year or not branch:
            raise HTTPException(
                status_code=422,
                detail="student_name, year, and branch are required for question-wise upload",
            )

        questions_payload = [
            {"question_number": q_num, "images_base64": images}
            for q_num, images in sorted(question_images.items())
        ]

        data = StudentUploadRequest(
            exam_id=exam_id,
            student_name=student_name,
            roll_number=roll_number,
            year=year,
            branch=branch,
            email=email,
            questions=questions_payload,
        )

        if _use_local_ai():
            queued = _enqueue_local_submission(data)
            # Run grading in the background to prevent NEXTJS proxy socket hang up
            background_tasks.add_task(_process_pending_local, data.exam_id, data.roll_number)
            return JSONResponse(
                content=to_jsonable(
                    {
                        **queued,
                        "mode": "local",
                        "processing": "grading_in_background",
                    }
                )
            )

        return await proxy_to_gpu(
            method="POST",
            path="/api/student/upload",
            json_payload=to_jsonable(data.model_dump()),
        )

    if "application/json" in content_type or not content_type:
        try:
            payload = await request.json()
            data = StudentUploadRequest.model_validate(payload)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Invalid JSON upload payload: {exc}") from exc

        if _use_local_ai():
            queued = _enqueue_local_submission(data)
            processed = _process_pending_local(data.exam_id, target_roll=data.roll_number)
            return JSONResponse(
                content=to_jsonable(
                    {
                        **queued,
                        "mode": "local",
                        "processing": processed,
                    }
                )
            )

        return await proxy_to_gpu(
            method="POST",
            path="/api/student/upload",
            json_payload=to_jsonable(data.model_dump()),
        )

    raise HTTPException(
        status_code=415,
        detail="Unsupported Content-Type. Use multipart/form-data or application/json",
    )


@app.get("/api/student/results/{exam_id}/{roll_number}")
def get_student_results(exam_id: int, roll_number: str) -> Dict[str, Any]:
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam or not exam.get("results_published"):
        raise HTTPException(status_code=403, detail="Not available")

    results = list(ai_db.student_results.find({"exam_id": exam_id, "roll_number": roll_number.strip().upper()}))
    if not results:
        raise HTTPException(status_code=404, detail="Results not found")

    return {
        "student_name": results[0].get("student_name", ""),
        "total_marks": sum(float(r.get("marks_awarded", 0)) for r in results),
        "total_possible": sum(float(r.get("total_marks", 0)) for r in results),
        "questions": [
            {
                "question_number": r.get("question_number"),
                "marks_awarded": r.get("marks_awarded"),
                "total_marks": r.get("total_marks"),
                "grade": r.get("grade"),
                "feedback": r.get("feedback"),
                "image_paths": str(r.get("image_path", "")).split(",") if r.get("image_path") else [],
            }
            for r in results
        ],
    }


@app.post("/api/admin/trigger-grading")
async def trigger_grading(exam_id: int = Form(...)) -> Response:
    if _use_local_ai():
        return JSONResponse(content=to_jsonable(_process_pending_local(exam_id)))
    return await proxy_to_gpu(
        method="POST",
        path="/api/admin/trigger-grading",
        form_payload={"exam_id": str(exam_id)},
    )



@app.post("/api/teacher/update-marks")
def update_marks(
    request: Request,
    exam_id: int = Form(...),
    roll_number: str = Form(...),
    question_number: int = Form(...),
    marks_awarded: float = Form(...),
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None)
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    result = ai_db.student_results.update_one(
        {
            "exam_id": exam_id,
            "roll_number": roll_number,
            "question_number": question_number,
        },
        {"$set": {
            "marks_awarded": marks_awarded,
            "feedback": "MANUALLY OVERRIDDEN BY TEACHER"
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student result not found to override")

    return {"message": "Marks manually updated."}


@app.post("/api/teacher/mark-absent")
def mark_absent(
    request: Request,
    exam_id: int = Form(...),
    roll_number: str = Form(...),
    teacher_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None)
) -> Dict[str, str]:
    verify_teacher(request, teacher_name, password)
    
    exam = ai_db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    ai_db.submission_queue.update_one(
        {"exam_id": exam_id, "roll_number": roll_number},
        {"$set": {"status": "absent", "updated_at": datetime.utcnow()}},
        upsert=True
    )
    
    return {"message": "Student marked as absent."}

if __name__ == "__main__":
    import uvicorn

    # On Windows, reload/worker subprocess mode uses SelectorEventLoop and can hit
    # "too many file descriptors in select()" under larger workspaces.
    reload_raw = os.getenv("UVICORN_RELOAD", "0").strip().lower()
    reload_enabled = reload_raw in {"1", "true", "yes", "on"}
    if os.name == "nt" and reload_enabled:
        print(
            f"[zippp] UVICORN_RELOAD={reload_raw} detected on Windows; forcing reload off for stability.",
            flush=True,
        )
        reload_enabled = False

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=reload_enabled,
        workers=1,
    )
