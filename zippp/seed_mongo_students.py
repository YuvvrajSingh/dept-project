from database import db, BRANCHES, YEARS

def seed_data():
    print("Seeding MongoDB with Student data...")
    print("Teacher/User auth records are managed by time-table-backend.")

    # 1. Seed Students (60 per branch per year)
    # Total = 60 * 3 branches * 4 years = 720 students
    
    # Standard format: 25U... for 2nd year, 24U... for 3rd, etc.
    year_map = {
        "1st Year": "26",
        "2nd Year": "25",
        "3rd Year": "24",
        "4th Year": "23"
    }
    
    branch_map = {
        "CSE": "UCSE3", # e.g. 25UCSE3001
        "IT": "UITE4",
        "ADS": "UADS4"
    }

    students_to_insert = []
    
    # Names pool (just for variety)
    first_names = ["Arjun", "Sneha", "Rohan", "Anjali", "Vikram", "Ishita", "Rahul", "Pooja", "Amit", "Kavya"]
    last_names = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Jain", "Mehta", "Patel", "Reddy", "Nair"]

    for year in YEARS:
        y_prefix = year_map[year]
        for branch in BRANCHES:
            b_mid = branch_map[branch]
            start_num = 1
            if branch == "IT": start_num = 1 # We can vary if needed
            
            for i in range(1, 61):
                roll = f"{y_prefix}{b_mid}{str(start_num + i - 1).zfill(3)}"
                name = f"{first_names[(i-1) % 10]} {last_names[(i-1) % 10]}"
                students_to_insert.append({
                    "roll_number": roll,
                    "name": name,
                    "email": f"{roll.lower()}@college.edu",
                    "year": year,
                    "branch": branch
                })

    # Clear old students first to avoid duplicates if re-running
    db.Student.delete_many({})
    
    if students_to_insert:
        db.Student.insert_many(students_to_insert)
    
    print(f"Inserted {len(students_to_insert)} students into MongoDB.")
    print("Seed complete! You can now login with admin/admin123")

if __name__ == "__main__":
    seed_data()
