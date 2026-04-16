# EduSched Demo Script - YouTube Video

---

## VIDEO STRUCTURE

| Segment | Duration | Content |
|---------|----------|---------|
| Intro | 0:00 - 0:30 | Hook + What we'll cover |
| Problem | 0:30 - 1:30 | The pain points |
| Solution Overview | 1:30 - 2:00 | EduSched intro |
| Demo Part 1 | 2:00 - 6:00 | Admin workflow |
| Demo Part 2 | 6:00 - 8:00 | Teacher portal |
| Demo Part 3 | 8:00 - 9:00 | Public timetable |
| Demo Part 4 | 9:00 - 10:30 | Auto-scheduler + conflict detection |
| Pricing & Call to Action | 10:30 - 11:30 | Pricing, contact |

---

## FULL SCRIPT

### [INTRO - 0:00 to 0:30]

**[VISUAL: Fast montage of busy office, stressed person with papers, chaotic whiteboard]**

**VOICEOVER:**
"Ever spent 20 hours creating a timetable? Dealt with teacher conflicts? Room double-bookings? Students asking 'Sir, what's our schedule today?' every single day?"

**[VISUAL: Smooth transition to EduSched logo]**

**VOICEOVER:**
"Well, what if I told you... you could create a perfect timetable in under 2 hours? No conflicts. No stress. Ever meet EduSched."

**[VISUAL: Your face or logo with subtitle]**

**VOICEOVER:**
"Hey everyone! In this video, I'm going to show you exactly how EduSched works - a complete timetable management system for colleges. Stick around, because by the end of this video, you'll see exactly why small colleges are switching from Excel to EduSched."

---

### [THE PROBLEM - 0:30 to 1:30]

**[VISUAL: Split screen - Excel sheet vs messy handwritten notes]**

**VOICEOVER:**
"Let's be honest. Most small colleges manage timetables the old way."

**VOICEOVER:**
"Here's what I see happening in college after college..."

**[VISUAL: Icons appearing one by one]**

**1. MANUAL = TIME-CONSUMING**
"One department coordinator spends 15 to 20 hours every semester manually creating the timetable. Typing, checking, re-checking..."

**2. CONFLICTS = NIGHTMARE**
"Teacher gets assigned to two classes at the same time. Room gets double-booked for labs. And then comes the chaos of fixing it."

**3. NO VISIBILITY**
"Students don't know their schedule. Teachers don't know where they're teaching. Everything is scattered - WhatsApp groups, notice boards, random PDFs."

**4. START FROM SCRATCH EVERY YEAR**
"Every new semester: delete the old timetable, start from zero. No reusable data. No templates. Just repeat the pain."

**[VISUAL: Person stressed, then calm]**

**VOICEOVER:**
"Now imagine... all of this solved. In one simple system. That's EduSched."

---

### [SOLUTION OVERVIEW - 1:30 to 2:00]

**[VISUAL: EduSched dashboard overview]**

**VOICEOVER:**
"EduSched is a complete timetable management platform built specifically for small colleges - 1 to 5 departments, 500 to 3000 students."

**VOICEOVER:**
"It has three main parts:"

**[VISUAL: Three icons appearing]**

"1. **Admin Panel** - Where coordinators build and manage the timetable
2. **Teacher Portal** - Where teachers see their personal schedule
3. **Public Viewer** - Where students and visitors access the timetable online - no login needed"

**VOICEOVER:**
"And it's built with modern tech - Next.js, Express, PostgreSQL - so it's fast, reliable, and secure."

---

### [DEMO PART 1: ADMIN WORKFLOW - 2:00 to 6:00]

**[VISUAL: Login screen]**

**VOICEOVER:**
"Let's start with the admin workflow. This is where the magic happens."

**[VISUAL: Enter credentials]**

**VOICEOVER:**
"I'll login as admin... and here's the dashboard."

**[VISUAL: Dashboard]**

"Here's an overview of everything - all branches, all semesters, all assignments at a glance. From here, I can access every feature."

---

#### **MASTER DATA MANAGEMENT**

**[VISUAL: Master Data section]**

**VOICEOVER:**
"First, I need to set up master data. This is where I add all the building blocks."

**[VISUAL: Teachers tab]**

**VOICEOVER:**
"Teachers. I can add each teacher, their name, and importantly - which subjects they can teach. This helps the system know who can be assigned where."

**[VISUAL: Add teacher example]**

"For example, let's add 'Mr. Sharma' who can teach Data Structures and Algorithms."

**[VISUAL: Rooms tab]**

**VOICEOVER:**
"Next - Rooms. I add classrooms and labs with their capacity. Notice the 'isLab' flag - this is important because labs need special handling."

**[VISUAL: Add room example]**

"Like 'Lab 1' - capacity 30, marked as lab."

**[VISUAL: Subjects tab]**

**VOICEOVER:**
"Subjects. Each subject belongs to a specific semester and branch. I can also specify if it needs a lab."

"Example: 'Data Structures' - 4 credits, needs lab, for CSE 3rd semester."

**[VISUAL: Branches tab]**

**VOICEOVER:**
"Branches - like CSE, IT, Mechanical. And their semesters. This defines the structure of the college."

---

#### **ASSIGNMENTS**

**[VISUAL: Assignments section]**

**VOICEOVER:**
"Now that master data is ready... I create assignments."

**VOICEOVER:**
"An assignment connects a teacher to a subject for a specific semester. It's basically saying 'Mr. Sharma will teach Data Structures to CSE Semester 3'."

**[VISUAL: Create assignment]**

"See how I select teacher, subject, semester. The system knows the subject details automatically."

---

#### **TIMETABLE BUILDER**

**[VISUAL: Timetable Builder]**

**VOICEOVER:**
"And now... the main event. The Timetable Builder."

**[VISUAL: Empty grid]**

**VOICEOVER:**
"Here's a weekly grid - Monday to Saturday, periods 1 to 8. Right now it's empty. Let me fill it up."

**[VISUAL: Manual entry]**

**VOICEOVER:**
"I can click any cell and assign a subject. Let's assign Data Structures to Monday, Period 1."

**VOICEOVER:**
"Notice the color coding - different colors for different subjects. Easy to visualize."

**[VISUAL: Conflict scenario - triggering conflict]**

**VOICEOVER:**
"Now here's the magic - let me try to create a conflict. I'll assign Mr. Sharma to two different classes at the same time on Tuesday."

**[VISUAL: Conflict warning appears]**

**VOICEOVER:**
"Look at that! The system immediately shows a conflict - Teacher Conflict! It's telling me Mr. Sharma is already assigned to another class at this time."

**VOICEOVER:**
"And if I try to use the same room for two classes..."

**[VISUAL: Room conflict]**

**VOICEOVER:**
"...same thing. Room conflict detected."

**VOICEOVER:**
"This is why I love this feature. The system doesn't let you save a timetable with conflicts. It catches them in real-time."

---

### [DEMO PART 2: TEACHER PORTAL - 6:00 to 8:00]

**[VISUAL: Logout and login as teacher]**

**VOICEOVER:**
"Now let's switch perspective. Imagine you're a teacher logging in."

**[VISUAL: Teacher login]**

**VOICEOVER:**
"Same login page, but now as a teacher."

**[VISUAL: Teacher Portal dashboard]**

**VOICEOVER:**
"Welcome to the Teacher Portal. Simple, clean, focused."

**[VISUAL: My Subjects]**

**VOICEOVER:**
"First tab - My Subjects. This shows every subject I'm assigned to teach, across all semesters."

"Mr. Sharma teaches Data Structures to CSE-3, and Database to IT-5. Clear."

**[VISUAL: My Timetable]**

**VOICEOVER:**
"My Timetable - my personal schedule for the entire week."

"Each slot shows: what subject, which room, which semester. No confusion about where I need to be."

**VOICEOVER:**
"And this is what teachers love - no more last-minute 'Sir, where is your class?' questions. They just open their portal and see."

---

### [DEMO PART 3: PUBLIC TIMETABLE - 8:00 to 9:00]

**[VISUAL: Public timetable URL]**

**VOICEOVER:**
"Finally - the public viewer. This is for students and visitors. No login required."

**[VISUAL: Public timetable page]**

**VOICEOVER:**
"Simple interface. Select your branch... select your semester..."

**[VISUAL: Select CSE, Semester 3]**

**VOICEOVER:**
"...and here's the complete timetable."

**VOICEOVER:**
"Students can access this from their phone. On Wi-Fi, on mobile data - anywhere. No app needed, no login needed."

**[VISUAL: Mobile view]**

**VOICEOVER:**
"And look - it's fully responsive. Works perfectly on mobile. Because let's be real - students will check on their phones."

---

### [DEMO PART 4: AUTO-SCHEDULER - 9:00 to 10:30]

**[VISUAL: Back to admin, Timetable Builder]**

**VOICEOVER:**
"Now let me show you the feature that saves the most time - the Auto-Scheduler."

**[VISUAL: Show assignment count]**

**VOICEOVER:**
"I've created 20+ assignments - teachers, subjects, all the connections. Doing this manually would take hours."

**VOICEOVER:**
"But with auto-scheduler - one click."

**[VISUAL: Click auto-generate button]**

**VOICEOVER:**
"I click 'Auto Generate'..."

**[VISUAL: Loading indicator]**

**VOICEOVER:**
"...the system runs its algorithm..."

**[VISUAL: Completed timetable]**

**VOICEOVER:**
"...and boom! Complete timetable generated."

**VOICEOVER:**
"See how every slot is filled? The algorithm placed all assignments while avoiding conflicts. It balanced the load across the week."

**[VISUAL: Conflict check result]**

**VOICEOVER:**
"And it shows a report - 0 conflicts. Perfect. The system validates that every teacher, every room is available."

**[VISUAL: Manual adjustments]**

**VOICEOVER:**
"After auto-generate, I can fine-tune manually if needed. Maybe swap a period here or there. But the heavy lifting is done."

---

#### **PDF EXPORT**

**[VISUAL: Export button]**

**VOICEOVER:**
"Finally - export. One click to generate a PDF."

**[VISUAL: PDF preview]**

**VOICEOVER:**
"Clean, printable timetable - ready to post on the notice board or send to WhatsApp groups."

---

### [PRICING & CALL TO ACTION - 10:30 to 11:30]

**[VISUAL: Pricing slide]**

**VOICEOVER:**
"So what does EduSched cost?"

**VOICEOVER:**
"One-time license: just ₹75,000 for up to 5 departments. That's less than what most colleges spend on a single year of expensive ERP software."

**VOICEOVER:**
"And then just ₹15,000 per year for maintenance - includes updates and support."

**VOICEOVER:**
"No hidden costs. No per-user fees. One price, everything included."

---

**[VISUAL: Contact info]**

**VOICEOVER:**
"If you're a small college looking to automate your timetable - reach out. I'm Yuvraj, the founder, and I'll personally help you get started."

**VOICEOVER:**
"Demo takes 30 minutes. Setup takes 2 days. And then... no more timetable headaches, ever."

**[VISUAL: Outro]**

**VOICEOVER:**
"If this video helped - hit like, subscribe, and share with anyone who manages college timetables. Thanks for watching!"

---

## PRODUCTION NOTES

### Equipment Needed
- Screen recording software (OBS or Camtasia)
- Good microphone for voiceover
- optionally: camera for face cam intro

### Recording Tips
1. Record screen at 1080p minimum
2. Speak slowly and clearly
3. Pause 2-3 seconds after important points
4. Use callouts/arrows to highlight features
5. Add background music (copyright-free)

### Editing Timeline
- Intro + Problem: 1:30
- Demo segments: 8:00
- Pricing + CTA: 1:00
- Total: ~10-11 minutes

### Thumbnail Ideas
- "College Timetable in 2 Hours (Not 20)"
- "Stop Creating Timetables Manually"
- "EduSched - Timetable Made Easy"
- Show stressed face → happy face transition