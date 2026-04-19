import pandas as pd
import os

# Alphabetical 60 Indian names
names = [
    "Aarav Patel", "Abhinav Singh", "Aditi Sharma", "Akash Gupta", "Amit Kumar",
    "Ananya Iyer", "Anjali Verma", "Ankit Desai", "Anshul Joshi", "Aryan Rao",
    "Avinash Nair", "Ayush Reddy", "Bhavya Chawla", "Chaitanya Bhat", "Chirag Mehta",
    "Darshan Shetty", "Deepak Pillai", "Devansh Menon", "Dhruv Malik", "Divya Thakur",
    "Esha Kapoor", "Gaurav Malhotra", "Hardik Chauhan", "Harshvardhan Sinha", "Ishan Das",
    "Ishita Agarwal", "Jayesh Panday", "Kabir Trivedi", "Karan Ahuja", "Karthik Shenoy",
    "Kavya Bhatt", "Kunal Tiwari", "Lakshya Bhatia", "Manav Mittal", "Megha Jain",
    "Mukul Kadam", "Neha Saxena", "Nikhil Rathi", "Nishant Bhasin", "Omkar Soni",
    "Palak Kothari", "Parth Kulkarni", "Pranav Deshmukh", "Pratik Doshi", "Priya Mahajan",
    "Rahul Saini", "Rajat Arora", "Riya Sehgal", "Rohan Bansal", "Sahil Garg",
    "Sakshi Wadhwa", "Sameer Khatri", "Sarthak Tandon", "Shlok Mathur", "Siddharth Goel",
    "Sneha Bajaj", "Tarun Bindra", "Utsav Chadha", "Varun Mistry", "Yash Raj"
]

config = {
    "2_CSE": "25UCSE3",
    "2_IT": "25UCSE4",
    "2_ADS": "25UADS41",
    "3_CSE": "24UCSE3",
    "3_IT": "24UITE4",
    "3_ADS": "24UADS41",
    "4_CSE": "23UCSE3",
    "4_IT": "23UITE4",
    "4_ADS": "23UADS41"
}

with pd.ExcelWriter('attendance.xlsx', engine='openpyxl') as writer:
    for sheet_name, prefix in config.items():
        data = []
        for i in range(1, 61):
            roll_number = f"{prefix}{i:02d}" if prefix.endswith("1") else f"{prefix}{i:03d}"
            # Exception for 1 ending ones, to fix user logic e.g., 25UADS4101
            if roll_number.startswith("25UADS41") or roll_number.startswith("24UADS41") or roll_number.startswith("23UADS41"):
                roll_number = f"{prefix[:6]}{100 + i}" # e.g. 25UADS4101 -> wait user requested exactly 25UADS4101.
                roll_number = prefix[:-2] + f"{100 + i:03d}" # 25UADS + 4101...
            
            # Proper logic based on user input:
            if "UADS" in prefix: 
                # 25UADS4101 -> 25UADS4 + 101, 102
                first_part = prefix[:6] # "25UADS"
                roll_number = f"{first_part}4{100+i:03d}" 
            else:
                # 25UCSE3001 -> 25UCSE3 + 001
                first_part = prefix[:-1] # "25UCSE"
                number_part = prefix[-1] # "3"
                roll_number = f"{first_part}{number_part}{i:03d}"

            # Create email like aarav.patel@example.com
            name = names[i-1]
            email = name.lower().replace(" ", ".") + "@example.com"
            
            data.append({
                "RollNo": roll_number,
                "Name": name,
                "Email": email,
                "Year": f"{sheet_name[0]}nd Year" if sheet_name.startswith('2') else (f"{sheet_name[0]}rd Year" if sheet_name.startswith('3') else f"{sheet_name[0]}th Year"),
                "Branch": sheet_name.split('_')[1]
            })
            
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name=sheet_name, index=False)

print("✅ attendance.xlsx generated successfully!")
