# EduSched - Smart Timetable Management for Colleges

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