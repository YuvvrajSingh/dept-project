import re
import os

filepath = r'c:\Users\YUVRAJ SINGH\Vault\dept-project\zippp\api.py'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update PhotoData
content = content.replace(
    '''class PhotoData(BaseModel):
    question_number: int
    image_base64: str''',
    '''class PhotoData(BaseModel):
    question_number: int
    images_base64: List[str]'''
)

# 2. Add SHARED_SECRET config safely
if 'GRADEAI_SHARED_SECRET' not in content:
    content = content.replace('init_db()', 'init_db()\n\nSHARED_SECRET = os.getenv("GRADEAI_SHARED_SECRET", "super-secret-backend-key")')

# Optional string import fix
if 'from fastapi import Request' not in content:
    content = content.replace('from fastapi import FastAPI, File, Form, HTTPException, UploadFile', 'from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request, Header')

# 3. Rewrite verify_teacher function
verify_teacher_new = '''def verify_teacher(request: Request, teacher_name: str = None, password: str = None) -> Dict[str, Any]:
    x_secret = request.headers.get("x-backend-secret")
    x_teacher = request.headers.get("x-teacher-identity")
    
    if x_secret and x_secret == SHARED_SECRET:
        if not x_teacher:
            raise HTTPException(status_code=401, detail="X-Teacher-Identity missing")
        profile = ai_db.teachers.find_one({"name": x_teacher}) or {}
        return {
            "teacher_name": x_teacher,
            "assigned_subjects": profile.get("assigned_subjects", {"Odd": [], "Even": []})
        }

    if not teacher_name or not password:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    return _authenticate_teacher(teacher_name, password)'''

content = re.sub(
    r'def verify_teacher\(identifier: str, password: str\) -> Dict\[str, Any\]:\n\s+return _authenticate_teacher\(identifier, password\)',
    verify_teacher_new,
    content
)

# 4. Make Form fields optional
content = re.sub(
    r'teacher_name: str = Form\((\.\.\.)?\)',
    r'teacher_name: Optional[str] = Form(None)',
    content
)
content = re.sub(
    r'password: str = Form\((\.\.\.)?\)',
    r'password: Optional[str] = Form(None)',
    content
)

# 5. Inject Request dependency in explicit POSTs and GETs
content = re.sub(
    r'def ([a-zA-Z0-9_]+)\((.*?)(teacher_name: str, password: str)(.*?)\) ->',
    r'def \1(request: Request, \2teacher_name: Optional[str] = None, password: Optional[str] = None\4) ->',
    content
)

# For POST functions that already had their Form tags replaced but didn't trigger rule 5
# match `teacher_name: Optional[str]` inside function args.
# Add request: Request to it if missing.
content = re.sub(
    r'def ([a-zA-Z0-9_]+)\((?!request: Request)(.*?teacher_name: Optional\[str\].*?)\) ->',
    r'def \1(request: Request, \2) ->',
    content
)

# 6. Replace verify_teacher calls to include request
content = re.sub(
    r'verify_teacher\((teacher_name|name), password\)',
    r'verify_teacher(request, \1, password)',
    content
)
content = re.sub(
    r'verify_teacher\(teacher_name, old_password\)',
    r'verify_teacher(request, teacher_name, old_password)',
    content
)

# 7. Add exam_name to create_exam
content = re.sub(
    r'exam_type: str = Form\(\.\.\.\),',
    r'exam_type: str = Form(...),\n    exam_name: str = Form(None),',
    content
)
content = re.sub(
    r'"exam_type": exam_type,',
    r'"exam_type": exam_type,\n            "exam_name": exam_name,',
    content
)

# 8. Add update-marks new endpoint BEFORE if __name__ main
update_marks_code = '''
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

'''

content = content.replace('if __name__ == "__main__":', update_marks_code + 'if __name__ == "__main__":')

# Also write to file
with open(filepath, 'w') as f:
    f.write(content)
print("Rewrite complete.")
