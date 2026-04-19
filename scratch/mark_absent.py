import re

filepath = r'c:\Users\YUVRAJ SINGH\Vault\dept-project\zippp\api.py'
with open(filepath, 'r') as f:
    content = f.read()

mark_absent_code = '''
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

'''

content = content.replace('if __name__ == "__main__":', mark_absent_code + 'if __name__ == "__main__":')

with open(filepath, 'w') as f:
    f.write(content)
print("Mark absent endpoint added.")
