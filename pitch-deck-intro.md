# EduSched - Smart Timetable Management for Colleges

---

## 1. Introduction

### Company
**EduSched** - Simplifying Academic Scheduling

### Tagline
*Automate timetables. Eliminate conflicts. Save hours every week.*

### Mission
To empower small colleges with professional-grade timetable management without the enterprise price tag—making academic scheduling effortless, accurate, and accessible for every department.

---

## 2. The Problem

### The Pain Points We Solve

**Manual Scheduling Chaos**
- Department coordinators spend 15-20 hours manually creating timetables each semester
- One person typing out schedules, checking conflicts on paper or Excel

**Relentless Conflicts**
- Teacher assigned to two classes at the same time
- Room double-booked for labs
- Last-minute changes cascade into chaos
- No visibility across departments

**Data Fragmentation**
- Timetables scattered across WhatsApp groups, notice boards, and personal files
- No central source of truth
- Students and teachers can't access updated schedules easily

**No Automation**
- Every semester = start from scratch
- Duplicate effort year after year
- No reusable templates or smart defaults

### Real Impact on Small Colleges
- **50+ hours wasted** per semester on manual timetable creation
- **30% of schedules** contain conflicts requiring rework
- **No IT support** — faculty handle scheduling themselves
- **Expensive alternatives** — enterprise software starts at ₹5-10 lakhs/year

---

## 3. The Solution

### EduSched - All-in-One Timetable Platform

**For Administrators:**
- Visual timetable builder with drag-drop interface
- Automatic conflict detection (teacher, room, lab)
- One-click auto-scheduler that generates optimized timetables
- Master data management (teachers, subjects, rooms, branches)
- Academic year lifecycle with clone-and-modify workflow
- PDF export for printing and distribution

**For Teachers:**
- Personal portal showing assigned subjects and schedule
- Never miss a class with clear visibility

**For Students & Public:**
- Public timetable viewer (branch + semester based)
- Accessible without login
- Mobile-friendly access

### Why EduSched is Unique

| Feature | Traditional Methods | EduSched |
|---------|---------------------|----------|
| Conflict Detection | Manual (error-prone) | Automatic real-time |
| Scheduling Time | 15-20 hours | 1-2 hours |
| Auto-Scheduler | None | One-click generation |
| Public Access | Printouts on board | Instant online access |
| Year-over-Year | Start from zero | Clone and modify |
| Cost | Free but painful | Affordable one-time |

---

## 4. Market Opportunity

### Total Addressable Market (TAM)

**India Context:**
- **~25,000** colleges (UGC recognized)
- **~8,000** are small private/self-financed colleges (1-5 departments)
- Average IT budget: ₹50,000 - ₹2,00,000 annually

### Serviceable Available Market (SAM)
- Target: Tier 2/Tier 3 cities
- **2,000+ colleges** in initial target geography
- Willingness to pay: ₹50,000 - ₹1,50,000 for a one-time license

### Target Customer Profile
- Small private engineering/science/commerce colleges
- 500-3000 students
- 1-5 departments (CS, IT, Mechanical, Electronics, etc.)
- No dedicated IT staff
- Principal/Head of Department handles administration

### Market Timing
- Government pushing digital education
- Colleges need affordable local solutions
- No dominant player in small college segment

---

## 5. Product & Technology

### Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser   │────▶│  Next.js App    │────▶│  PostgreSQL  │
│  (Frontend) │◀────│  (Port :3000)   │◀────│   Database   │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Express API    │
                    │  (Port :3001)   │
                    └─────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 16 (React) - modern, fast, SEO-friendly
- **Backend:** Express.js 5 - robust REST API
- **Database:** PostgreSQL - reliable, ACID compliant
- **Auth:** JWT-based session management
- **PDF Export:** Server-side Puppeteer

### Key Screens (Visual Highlights)

**1. Admin Dashboard**
- Overview of all branches, semesters, assignments
- Quick access to all management modules

**2. Master Data Management**
- Add/edit teachers with subject expertise
- Manage rooms (classrooms, labs) with capacity
- Define subjects per semester and branch

**3. Timetable Builder**
- Visual grid view of weekly schedule
- Drag-drop interface for manual placement
- Color-coded conflict warnings
- One-click auto-generate button

**4. Conflict Detection**
- Real-time checks before saving
- Shows teacher conflicts, room conflicts, lab conflicts
- Clear error messages with resolution hints

**5. Teacher Portal**
- Clean view of personal teaching schedule
- Subject-wise breakdown

**6. Public Timetable**
- Select branch → Select semester → View schedule
- No login required
- Mobile-responsive

---

## 6. Business Model

### Revenue Streams

**Primary: One-Time License Fee**
- Base Package: ₹75,000 (up to 5 departments)
- Department Add-on: ₹10,000 per additional department
- Includes: Setup, training, 1-year support

**Secondary: Annual Maintenance**
- Year 2 onwards: ₹15,000/year
- Includes: Bug fixes, security updates, basic feature enhancements

**Add-ons (Future):**
- SMS alerts to teachers (₹5,000/year)
- Parent/student mobile app (₹25,000)
- Custom integrations (custom pricing)

### Unit Economics
- Development cost: ~₹3-5 lakhs (invested)
- Sales cycle: 2-4 weeks (personal outreach)
- Customer acquisition cost: ~₹5,000-10,000
- Lifetime value: ₹75,000 - ₹1,50,000 (first 3 years)
- Break-even: 5-8 customers

### Revenue Projection (3 Years)
| Year | Customers | Revenue |
|------|-----------|---------|
| 1    | 10        | ₹7.5L   |
| 2    | 25        | ₹18.75L |
| 3    | 50        | ₹37.5L  |

---

## 7. Traction & Roadmap

### Current Status
- ✅ MVP complete and functional
- ✅ Fully working backend with conflict detection
- ✅ Admin, teacher, and public views ready
- ✅ Auto-scheduler algorithm implemented
- ✅ Local deployment tested
- ⏳ No paying customers yet
- ⏳ Beta testing with 1-2 colleges

### Roadmap

**Phase 1: Foundation (Months 1-3)**
- Launch MVP to first 5 colleges (free/beta)
- Gather feedback, fix bugs
- Build case studies and testimonials

**Phase 2: Growth (Months 4-9)**
- Start paid deployments
- Expand to 20 colleges
- Build referral network

**Phase 3: Scale (Months 10-18)**
- 50+ colleges
- Add WhatsApp notifications
- Explore neighboring states

**Phase 4: Expand (Year 2-3)**
- Student/parent mobile app
- Attendance integration
- Exam schedule module

---

## 8. Marketing Plan

### Customer Acquisition Strategy

**Direct Outreach (Primary)**
- Visit colleges in Tier 2/3 cities
- Target: Principals, HODs, Admin staff
- Demo on-laptop, show value in 30 minutes
- Leverage personal network and alumni connections

**Digital Presence**
- Simple website with features and contact
- LinkedIn presence
- WhatsApp business for inquiries

**Referrals**
- Incentivize existing customers to refer
- Partner with education consultants

**College Events**
- Attend education fairs
- Partner with equipment vendors (furniture, lab suppliers)

### Sales Funnel
1. **Awareness:** College visits, LinkedIn
2. **Interest:** Free demo, feature walkthrough
3. **Evaluation:** Trial at one department
4. **Decision:** Proposal with pricing
5. **Purchase:** Contract + deployment
6. **Retention:** Annual maintenance relationship

### Customer Success
- Setup within 2 days
- Training for admin staff (1-hour session)
- WhatsApp support for quick queries
- Quarterly check-ins

---

## 9. Competitive Analysis

### Competitors

| Competitor | Target | Price | Strength | Weakness |
|------------|--------|-------|----------|----------|
| Enterprise ERPs | Large universities | ₹10L+/year | Full suite | Expensive, complex |
| Custom developers | - | ₹3-10L | Customizable | No ongoing support, slow |
| Excel/WhatsApp | - | Free | Familiar | No automation, errors |
| Open source | Tech-savvy | Free | No cost | Hard to deploy, no support |

### Why EduSched Wins for Small Colleges

1. **Purpose-built** for small college needs
2. **Affordable** one-time pricing (vs. expensive ERPs)
3. **Easy** to deploy and maintain (vs. open source)
4. **Reliable** ongoing support (vs. custom developers)
5. **Fast** to implement (days, not months)
6. **Complete** — handles everything in one platform

### Our Moat
- Local market understanding
- Direct customer relationships
- Continuous feature improvements based on feedback
- Word-of-mouth in college networks

---

## 10. Team

### Founder Profile
**Yuvraj Singh** - Solo Founder & Developer

- Full-stack developer (Next.js, Express, PostgreSQL)
- Built complete product from scratch
- Understanding of college administration needs
- Passionate about solving education problems

### Why I Can Win
1. **Built the product** — deep technical understanding
2. **Low overhead** — no large team costs
3. **Fast iteration** — can ship features in days
4. **Personal touch** — direct communication with customers
5. **Committed** — building this as long-term career

### Looking For
- Advisor with education industry experience
- Sales partner/consultant for regional outreach

---

## 11. Financials

### 3-Year Projections

| Item | Year 1 | Year 2 | Year 3 |
|------|--------|--------|--------|
| **Revenue** | | | |
| License Sales (10/25/50) | ₹7.5L | ₹18.75L | ₹37.5L |
| AMC Revenue | ₹0.5L | ₹2.5L | ₹7.5L |
| **Total Revenue** | ₹8L | ₹21.25L | ₹45L |
| **Expenses** | | | |
| Development | ₹1L | ₹1.5L | ₹2L |
| Marketing | ₹2L | ₹4L | ₹6L |
| Support/Operations | ₹1L | ₹2L | ₹4L |
| **Total Expenses** | ₹4L | ₹7.5L | ₹12L |
| **Net Profit** | ₹4L | ₹13.75L | ₹33L |

### Use of Funds (Current Ask: ₹5 Lakhs)

| Category | Amount | Purpose |
|----------|--------|---------|
| Marketing | ₹2L | College visits, ads, website |
| Operations | ₹1L | Laptop, tools, internet |
| Buffer | ₹2L | 6-month runway |
| **Total** | ₹5L | Break-even at 5 customers |

---

## 12. The Ask

### Funding Requirement: ₹5,00,000 (₹5 Lakhs)

### How Funds Will Be Used

**1. Marketing & Sales (₹2,00,000)**
- Travel to colleges for demos: ₹80,000
- Website and promotional materials: ₹40,000
- LinkedIn ads and digital marketing: ₹40,000
- Business cards and presentation materials: ₹40,000

**2. Operations (₹1,00,000)**
- Better development machine
- Cloud hosting for demo environment
- Communication and tools

**3. Running Costs Buffer (₹2,00,000)**
- 6 months of personal expenses
- Contingency for unexpected opportunities

### Milestones with This Investment
- 10 paying customers by end of Year 1
- Revenue: ₹8-10 lakhs
- Break-even achieved

### Future Fundraising
- After 20 customers, raise ₹25-50 lakhs for scaling
- Build sales team, expand to more regions

---

## Contact

**Yuvraj Singh**
- 📧 [Email]
- 📱 [Phone]
- 🔗 [LinkedIn]

*Let's make college scheduling effortless together.*

---