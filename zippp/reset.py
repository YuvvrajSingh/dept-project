"""
Reset GradeAI runtime data (AI collections + local upload/diagram folders).

Usage:
    python reset.py
"""

import os
import shutil

from database import ai_db, init_db


def reset_all() -> None:
    print("\n" + "=" * 50)
    print("GRADEAI COMPLETE RESET")
    print("=" * 50)
    confirm = input("This will delete AI exam data. Continue? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Reset cancelled.")
        return

    collections = [
        "objections",
        "submission_queue",
        "student_results",
        "questions",
        "exams",
        "teachers",
        "students",
        "config",
        "counters",
    ]

    print("\nDeleting documents from collections:")
    for name in collections:
        count = ai_db[name].count_documents({})
        print(f"- {name}: {count}")
        ai_db[name].delete_many({})

    for folder in ["uploads", "diagrams"]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder, exist_ok=True)
        print(f"- Reset folder: {folder}")

    init_db()
    print("\nReset complete.")


if __name__ == "__main__":
    reset_all()
