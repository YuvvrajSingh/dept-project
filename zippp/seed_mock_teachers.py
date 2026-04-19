import sys
import os

# Add parent dir to path if running from scripts folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def seed_teachers():
    print("Legacy teachers seed is deprecated.")
    print("Use time-table-backend admin flows to create Teacher + User records.")

if __name__ == "__main__":
    seed_teachers()
