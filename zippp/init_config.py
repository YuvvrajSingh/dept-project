import sys
import os

# Add parent dir to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import db

def init_config():
    # Set current academic session
    db.config.update_one(
        {"key": "current_session"},
        {"$set": {"value": "2025-2026"}},
        upsert=True
    )
    # Set status prefix mapping (Optional but good for reference)
    db.config.update_one(
        {"key": "system_status"},
        {"$set": {"last_updated": True}},
        upsert=True
    )
    print("SUCCESS: System Config initialized with Session 2025-2026.")

if __name__ == "__main__":
    init_config()
