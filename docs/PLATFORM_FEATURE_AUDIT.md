# BeBrilliant Platform: Comprehensive Module & Feature Audit
**Document Version:** 2.0 Enterprise  
**Target Audience:** Product Management, Marketing, Sales, Enterprise Clients, Operations  
**Scope:** Complete Architectural, Functional, and Persona-by-Persona Feature Audit with Subscription Packaging & Marketing Alignment.

---

## 1. Executive Platform Summary

**BeBrilliant** is an enterprise-grade, multi-tenant academic operations and examination ecosystem engineered with:
- **Frontend / Application Core:** Next.js 15 App Router (React 19), Tailwind CSS v4, Lucide Icons, Recharts, Server Actions.
- **Backend & Database:** Node.js, PostgreSQL / Supabase with Row-Level Security (RLS) policies enforcing multi-tenant boundary isolation.
- **AI Core:** Google Gemini AI (`@google/generative-ai`) calibrated for strict syllabus-grounded question paper creation, Bloom's Taxonomy cognitive scoring, and auto-grading.
- **Financial & Treasury Engine:** Razorpay Payment Gateway, automated GST invoicing, split settlements, affiliate wallet ledgers, and KYC/TDS compliance.
- **Omnichannel Communication:** WhatsApp Cloud API automated messaging, Nodemailer SMTP, and mobile push notifications.
- **Mobile Ecosystem:** Dedicated native mobile applications built on Expo / React Native for **Students**, **Teachers**, and **Parents** (iOS & Android).

---

## 2. Platform Tenant Types & Persona Matrix

The platform architecture supports three distinct tenant classifications and two primary consumer personas:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BEBRILLIANT TENANT CLASSIFICATIONS                             │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│         SCHOOL TENANT         │       INSTITUTE TENANT        │    INDEPENDENT TEACHER TENANT    │
│  • K-12 Academics             │  • Coaching & Test Prep       │  • Private Tutors                │
│  • Multi-Branch Oversight     │  • Competitive Exams          │  • Solo Subject Specialists      │
│  • OMR + Offline + CBT        │  • WhatsApp Viral Growth      │  • AI Exam Generation            │
│  • White-Label App & Domain   │  • Admissions CRM Pipeline    │  • Zero-Admin Grade Automation   │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CONSUMER PORTALS                                           │
├───────────────────────────────────────────────────────────────┬──────────────────────────────────┤
│                        STUDENT PERSONA                        │          PARENT PERSONA          │
│  • Web CBT & Native Mobile App                                │  • Native Mobile App & Web View  │
│  • Timed Tests, Instant Solutions & Leaderboards              │  • Real-Time WhatsApp Scorecards │
│  • AI Practice Drills & Study Vault                           │  • Multi-Child Switcher          │
│  • Peer Referral Fee Credits                                  │  • 1-Click UPI/Card Fee Payments │
└───────────────────────────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 3. Master Module Directory & Technical Audit

### Module 1: Unified Examination & Assessment Engine
*Source Paths: `/src/app/dashboard/exams`, `/src/app/dashboard/faculty/answer-grading`, `/src/lib/exams`*

1. **Online Computer-Based Testing (CBT):**
   - NTA/JEE/NEET standardized exam interface with question status indicators (*Answered, Unanswered, Marked for Review, Visited*).
   - Countdown timer with section-wise time locks and automatic cloud save on every option selection.
   - Immediate automatic submission on timer expiry with zero data loss.
2. **Anti-Cheat & Proctoring Engine:**
   - Fullscreen enforcement with warning banners on focus exit.
   - Real-time tab-switch and blur detection with violation count thresholds.
   - Dynamic question-level and option-level randomized shuffling per student candidate.
   - Proctoring incident log recorded in student attempt telemetry.
3. **Optical Mark Recognition (OMR) Hub:**
   - Physical paper evaluation system supporting 30, 60, 100, and 180-question answer sheets.
   - Barcode and roll-number optical bubble parsing for high-throughput batch scanning.
   - Automatic grading against stored digital answer keys with instant result compilation.
4. **Offline Paper Generation & Printing Engine:**
   - One-click generation of print-ready exam papers with school/institute logo, title, and watermarks.
   - Automated formatting of instructions, section headers, marks allocations, and separate answer key sheets.
   - Clean PDF rendering optimized for standard A4 duplex printing.
5. **Digital Answer Sheet Grading:**
   - Faculty grading workspace for subjective exams and handwritten uploads.
   - Annotation, inline score allocation per question, and qualitative teacher feedback remarks.

---

### Module 2: Gemini AI & Question Generator Suite
*Source Paths: `/src/app/dashboard/ai`, `/src/app/api/owner/syllabus/generate`, `/src/lib/ai`*

1. **AI Question Generator:**
   - Creates Multiple Choice (MCQs), Multi-Select, Assertion-Reason, True/False, and Short/Long Answer questions.
   - Calibration by difficulty tier (*Easy, Moderate, Hard, Olympian/Challenger*).
2. **Strict Syllabus Lock:**
   - Grounding mechanism that prevents the LLM from generating questions outside the specified topic node.
3. **Bloom's Taxonomy Cognitive Calibration:**
   - Generates questions classified by cognitive level: *Remembering, Understanding, Applying, Analyzing, Evaluating*.
4. **Adaptive Custom Drills:**
   - Student-facing test generator that analyzes past mistake logs to assemble personalized 15–30 minute remediation drills.
5. **AI Usage & Token Governance:**
   - Quota tracking per tenant (`tokens_used`, `questions_generated`) with enterprise safety limits.

---

### Module 3: Enterprise Curriculum & Master Syllabus Hub
*Source Paths: `/src/app/dashboard/syllabus`, `/src/app/owner/syllabus`, `/src/lib/ai/curriculum-templates.ts`*

1. **5-Tier Academic Hierarchy:**
   - Hierarchical data model: `Board` $\rightarrow$ `Class` $\rightarrow$ `Subject` $\rightarrow$ `Chapter` $\rightarrow$ `Topic`.
2. **Curriculum Coverage:**
   - **National Boards:** CBSE (Classes 1–12 NCERT aligned), ICSE / ISC (CISCE curriculum).
   - **International & Alternative:** IB (International Baccalaureate), NIOS (National Institute of Open Schooling).
   - **State Boards:** Gujarat Secondary & Higher Secondary Board (GSEB), Maharashtra State Board, Karnataka State Board.
   - **Entrance & Competitive Examinations:**
     - *Engineering & Medical:* JEE Main, JEE Advanced, NEET-UG, BITSAT, GUJCET.
     - *Central Universities & Law:* CUET-UG, CLAT, AILET.
     - *Management & Post-Grad:* CAT, XAT, GATE.
     - *Civil Services & Government:* UPSC Civil Services (Prelims), SSC CGL, NDA, CDS, RRB NTPC, Banking (IBPS/SBI PO).
3. **Curriculum Export Engine:**
   - Dynamic export of syllabus structures into Microsoft Word (`.docx`) and `.csv` formats for offline faculty planning.
4. **Syllabus Commercial Marketplace:**
   - Built-in licensing engine allowing owners/institutes to monetize pre-built premium syllabus banks.

---

### Module 4: Multi-Branch Academic Lifecycle & Operations
*Source Paths: `/src/app/dashboard/academy`, `/src/app/dashboard/tenant`, `/src/app/dashboard/teachers`, `/src/app/dashboard/staff`*

1. **Academic Structure Management:**
   - Setup of Academic Years (e.g., 2025–2026), Semesters, Terms, and Exam Sessions.
   - Grade/Class creation, division/section mappings, and maximum student caps per room.
2. **Staff & Faculty Administration:**
   - Directory of teachers with subject specialization tags and workload indicators.
   - Non-teaching staff directories: Cashiers, System Operators, Exam Coordinators, and Academic Auditors.
3. **Multi-Branch Central Operations (Enterprise):**
   - High-level tenant switching enabling multi-school trusts and coaching chains to review branch-level KPIs centrally.

---

### Module 5: Admissions Pipeline & Student CRM
*Source Paths: `/src/app/dashboard/crm`, `/src/app/api/dashboard/crm`*

1. **4-Stage Kanban Funnel:**
   - Visual stages: *New Prospects* $\rightarrow$ *Active Inquiries* $\rightarrow$ *Fee Confirmation* $\rightarrow$ *Enrolled Students*.
2. **Bulk CSV Ingestion:**
   - Fast batch import of leads from external marketing campaigns, webinars, or school walk-ins.
3. **Lead Scoring & Conversion:**
   - Lead engagement scoring based on inquiry source, interaction recency, and contact validity.
   - 1-click promotion converting a verified lead directly into an active student account.

---

### Module 6: WhatsApp Growth Engine & Affiliate Network
*Source Paths: `/src/app/dashboard/affiliates`, `/src/app/dashboard/automation`, `/src/lib/crm`*

1. **WhatsApp Share Link Generator:**
   - Dynamic short-link and QR generator for exam series and courses with embedded referral tracking codes.
2. **Teacher Affiliate Hub (Institutes):**
   - Onboarding portal for visiting or partner teachers with Aadhaar, PAN, and Bank Account KYC collection.
   - Commission accrual on every referred student exam purchase.
3. **Student Peer-to-Peer Credit Engine:**
   - Students earn promotional wallet credits on successful peer signups to offset future exam fees.
4. **Financial Compliance Gate:**
   - Automated TDS calculations (e.g., 10%) and platform processing fee deductions before withdrawal approvals.

---

### Module 7: Study Material & Digital Asset Vault
*Source Paths: `/src/app/dashboard/material`, `/src/app/dashboard/student/materials`*

1. **Institutional Asset Vault:**
   - Secure repository for lecture notes, reference PDFs, practice workbooks, and homework assignments.
2. **Targeted Distribution:**
   - Access control by Class, Section, or Subject.
3. **Multi-Format Delivery:**
   - Integrated PDF reader, embedded video streaming players, and direct document download capabilities.

---

### Module 8: Live Interactive Classroom Hub
*Source Paths: `/src/app/dashboard/live`, `/src/app/api/dashboard/live`*

1. **Live Lecture Scheduling:**
   - Scheduling of live digital classes with automatic sync to student and teacher dashboards.
   - Compatibility with Zoom, Google Meet, Microsoft Teams, and WebRTC streaming links.
2. **Attendance & Archive:**
   - Automatic logging of student join timestamps and recording URL repository for revision.

---

### Module 9: 360° Analytics, Leaderboards & Progress Cards
*Source Paths: `/src/app/dashboard/faculty/analytics/results-360`, `/src/app/dashboard/student/analytics`*

1. **Institutional & Cohort Analytics:**
   - Macro view of student grade distributions, class averages, and pass/fail percentiles.
2. **All India Rank (AIR) & Class Rank Engine:**
   - Automated percentile calculations, batch rankings, and top-performer leaderboards.
3. **Subject-Wise Weakness Heatmaps:**
   - Concept-level error tracking flagging topics requiring classroom revision.
4. **Automated Digital Report Cards:**
   - Automated PDF report card generation complete with institutional seals and teacher remarks.

---

### Module 10: White-Labeling & Institutional Branding
*Source Paths: `/src/app/dashboard/settings`, `/src/app/white-label`*

1. **Custom Domain / Subdomain:**
   - Support for custom URLs (e.g., `exams.dpsdelhi.edu.in` or `portal.allenclone.in`).
2. **Theme & Visual Customization:**
   - Custom institutional colors, crests, logos, and portal favicons.
3. **Dedicated Mobile Applications:**
   - Custom APK/AAB build generation published under the institution's Google Play and Apple App Store developer accounts.

---

### Module 11: Fee Collection, Treasury & Multi-Ledger Wallet
*Source Paths: `/src/app/dashboard/wallet`, `/src/app/owner/finance`, `/src/lib/payments`*

1. **Razorpay Payment Gateway Integration:**
   - Online payments via UPI, Credit/Debit Cards, Net Banking, and Wallets.
2. **Automated GST Invoicing:**
   - Instant digital tax invoices and payment confirmation receipts issued upon checkout.
3. **Multi-Party Treasury Ledgers:**
   - Owner revenue collections, tenant payout allocations, and affiliate reward balances.

---

### Module 12: Content Management & Institutional Announcements
*Source Paths: `/src/app/dashboard/messages`, `/src/app/owner/cms`*

1. **Notice Board & Announcements:**
   - Institutional circulars and urgent notices broadcast to student and parent apps.
2. **Automated Notification Workflows:**
   - Automated SMS and WhatsApp triggers on exam scheduling, fee due dates, and score releases.

---

## 4. Persona-by-Persona Feature Breakdown

### 4.1. School Tenant
*Designed for Principals, Academic Directors, Deans, Examination Heads, and School Boards.*

- **Hybrid Examination Delivery:**
  - Online Computer-Based Tests for senior classes (Classes 9–12).
  - OMR Optical Bubble sheet evaluation for periodic objective tests.
  - Offline printable paper generation for traditional pen-and-paper term exams.
- **Curriculum & Board Compliance:**
  - Pre-mapped question banks for CBSE, ICSE, and State Boards.
  - Class 1 to 12 NCERT curriculum alignment.
- **Institutional Governance:**
  - Multi-Branch Central Dashboard for school chains.
  - Academic year lifecycle (Terms, Semesters, Grading periods).
  - Class and Section management with teacher assignment.
  - Non-teaching staff role administration.
- **Parental Engagement:**
  - Automated WhatsApp alerts on student test submission and report card releases.
  - Parent portal integration for progress tracking and fee payments.
- **Institutional White-Labeling:**
  - Custom domain routing (`exams.schoolname.edu.in`).
  - School branding on student dashboards, test papers, and PDF scorecards.
  - Branded school mobile application.

---

### 4.2. Institute Tenant
*Designed for Coaching Centers, Test-Prep Chains, Training Academies, and Competitive Exam Institutes.*

- **Competitive Exam Engine:**
  - NTA-pattern interface for JEE Main, JEE Advanced, and NEET-UG.
  - Configurable negative marking rules (e.g., +4 / -1, decimal penalties).
  - All India Rank (AIR) and batch percentile benchmarking.
- **WhatsApp Viral Growth & Affiliate System:**
  - Tracked referral link generator for exam packages.
  - Partner teacher affiliate network with KYC collection and TDS deductions.
  - Student-to-student fee discount referral engine.
- **Admissions & Student Acquisition CRM:**
  - Visual 4-stage pipeline for tracking walk-ins and web inquiries.
  - CSV lead import from digital marketing ad campaigns.
  - Conversion metrics from inquiry to enrolled student.
- **Integrated Fee Collection:**
  - Razorpay checkout for test series and tuition packages.
  - Automated GST receipts and instant settlement tracking.
- **AI-Powered Mock Test Generation:**
  - Gemini AI question generator for assembling weekly mock tests in under 60 seconds.
  - Strict syllabus lock to ensure exam relevance.

---

### 4.3. Independent Teacher Tenant
*Designed for Solo Educators, Private Tutors, Freelance Faculty, and Subject Specialists.*

- **Low-Overhead Test Creation:**
  - Gemini AI question generation from selected topics.
  - Pre-configured question banks across Mathematics, Physics, Chemistry, Biology, and Humanities.
- **Automated Grading:**
  - Instant digital evaluation for objective tests.
  - Automated scorecard generation and delivery.
- **Student Cohort Management:**
  - Manage up to 500–1,500 students organized by batches.
  - Longitudinal performance tracking to showcase student improvement to parents.
- **Study Vault & Assignment Distribution:**
  - Distribution of class notes, PDF worksheets, and homework in a single student-facing portal.
- **No-Code Operation:**
  - Full browser-based workflow requiring zero server setup or technical maintenance.

---

### 4.4. Student Persona
*Access via Web Browser or Native Android/iOS Mobile Application.*

- **Standardized CBT Exam Experience:**
  - Question status palette (*Answered, Unanswered, Review, Visited*).
  - Clear countdown timers, section tabs, and full-screen proctoring mode.
- **Instant Result Analytics & Review:**
  - Detailed score breakdown immediately following exam submission.
  - Step-by-step explanations and hints for every question.
  - Error pattern analysis highlighting careless mistakes versus concept gaps.
- **Adaptive AI Practice Drills:**
  - On-demand customized test generation focused on personal weak topics.
- **Digital Asset Vault:**
  - In-app access to teacher notes, homework assignments, and lecture recordings.
- **Gamified Progress & Leaderboards:**
  - Class and batch rankings, accuracy percentages, and peer percentiles.
- **Peer Referral Wallet:**
  - Unique referral links to invite friends and earn fee deduction credits.

---

### 4.5. Parent Persona
*Access via Dedicated Native Mobile App and Automated WhatsApp Notifications.*

- **Automated WhatsApp Score Notifications:**
  - Real-time score summaries delivered directly to WhatsApp when an exam is completed.
- **Multi-Child Dashboard Switcher:**
  - Single mobile login to monitor multiple children across different classes or branches.
- **Academic Progress Monitoring:**
  - 30-day attendance calendar and score trendlines across subjects.
  - Teacher notes and disciplinary remarks.
- **1-Click Online Fee Payments:**
  - Review pending fee dues, view breakdowns, pay via UPI/Card, and download tax receipts.
- **School Notice Board:**
  - Access to institutional circulars, holiday notices, and exam timetables.

---

## 5. Subscription Packaging & Pricing Matrix

### Plan Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BEBRILLIANT SUBSCRIPTION TIERS                                  │
├───────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┤
│   INDEPENDENT TEACHER │   INSTITUTE (COACHING) │    SCHOOL (K-12 CHAIN) │   STUDENT DIRECT PASS  │
│   ₹999 - ₹1,999 / mo  │   ₹3,999 - ₹7,999 / mo │  ₹9,999 - Custom / mo  │    ₹199 - ₹299 / mo    │
├───────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┤
│ • 1-3 Teacher Logins  │ • 5-15 Teacher Logins  │ • Unlimited Teachers   │ • Self-Practice Passes │
│ • 500-1,500 Students  │ • 2,000-5,000 Students │ • 3,000+ Students      │ • NCERT + JEE/NEET PYQ │
│ • AI Question Gen     │ • WhatsApp Referral    │ • White-Label Domain   │ • Performance Rank     │
│ • CBT & Auto-Grading  │ • Admissions CRM       │ • OMR + Paper Engine   │ • AI Concept Drills    │
│ • Growth Analytics    │ • Online Fee Treasury  │ • Custom Mobile App    │ • Solutions Review     │
└───────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┘
```

---

### 5.1. School Tenant Packages (Institutional White-Label)

| Feature / Limit | White-Label Starter | Enterprise Multi-Branch |
| :--- | :--- | :--- |
| **Target Audience** | Single-campus K-12 School | Multi-Branch School Trust / Chain |
| **Monthly Pricing** | **₹9,999 / month** | **Custom Enterprise Quote** |
| **Annual Billing** | **₹8,499 / month** *(Billed ₹1,01,988/yr)* | Custom Contract |
| **Active Student Capacity** | Up to 3,000 Students | Unlimited Students |
| **Teacher Accounts** | Unlimited | Unlimited |
| **Branch Licenses** | 1 Campus | Unlimited Branches (Centralized) |
| **Exam Capabilities** | CBT Online + OMR Scanning + Offline Paper Engine | CBT + OMR + Offline Paper Engine |
| **Curriculum Syllabi** | Complete CBSE, ICSE, and State Boards | Complete K-12 + Foundation + Competitive |
| **Parent Alerts** | WhatsApp Score Notifications | WhatsApp Alerts + Custom SMS Gateway |
| **White-Label Branding** | Custom Subdomain (`exams.school.edu.in`) | Dedicated Domain + Branded Mobile App |
| **ERP / SIS Integration** | Standard CSV Import / Export | Dedicated REST API & Database Sync |
| **Support Level** | Standard Support (24h response) | Dedicated Account Manager & On-Premises SLA |

---

### 5.2. Institute Tenant Packages (Coaching & Test-Prep)

| Feature / Limit | Coaching Growth | Institute Enterprise |
| :--- | :--- | :--- |
| **Target Audience** | Emerging Coaching (1–2 Centers) | Established Academy / Test-Prep Chain |
| **Monthly Pricing** | **₹3,999 / month** | **₹7,999 / month** |
| **Annual Billing** | **₹3,299 / month** *(Billed ₹39,588/yr)* | **₹6,499 / month** *(Billed ₹77,988/yr)* |
| **Active Student Capacity** | Up to 2,000 Students | Up to 5,000 Students |
| **Teacher Logins** | Up to 5 Teachers | Up to 15 Teachers |
| **Competitive Exam Engine** | JEE, NEET, CUET (NTA interface) | All National & State Level Exams |
| **WhatsApp Viral Growth** | Student Referral Credit Engine | Student Credits + Partner Teacher KYC/Affiliates |
| **Admissions CRM** | 4-Stage Kanban (Manual & CSV) | Kanban Pipeline + Lead Scoring Automation |
| **Fee Collection** | Razorpay Gateway (Instant Settlement) | Razorpay + Multi-Ledger Split Settlements |
| **Gemini AI Question Gen** | 5,000 AI Question Tokens / mo | 25,000 AI Question Tokens / mo |
| **OMR Scanner Hub** | Not Included | Included (High-speed Batch Scanner) |
| **Support Level** | Standard Support | Priority WhatsApp & Phone Support |

---

### 5.3. Independent Teacher Packages (Private Tutors)

| Feature / Limit | Solo Educator | Educator Pro |
| :--- | :--- | :--- |
| **Target Audience** | Individual Tutor / Subject Specialist | High-Volume Coaching Educator |
| **Monthly Pricing** | **₹999 / month** | **₹1,999 / month** |
| **Annual Billing** | **₹799 / month** *(Billed ₹9,588/yr)* | **₹1,599 / month** *(Billed ₹19,188/yr)* |
| **Active Student Capacity** | Up to 500 Students | Up to 1,500 Students |
| **Teacher Accounts** | 1 Teacher | Up to 3 Teachers |
| **Test Creation Engine** | Online Test Builder + Auto-Grading | Online Tests + Anti-Cheat Proctoring |
| **Gemini AI Generator** | 2,000 AI Tokens / month | 10,000 AI Tokens / month |
| **Study Vault Storage** | 5 GB Cloud Storage | 25 GB Cloud Storage |
| **Parent Updates** | Student-Shared Scorecards | Automated WhatsApp Score Updates |
| **Watermark Customization**| Standard Template | Custom Watermarked PDF Question Papers |

---

### 5.4. Student Direct & Parent Access

| User Category | Package Name | Pricing | Included Modules |
| :--- | :--- | :--- | :--- |
| **Student (Direct)** | **Student Practice Pass** | **₹299 / month** <br>*(₹199/mo billed annually)* | • Unlimited Mock Tests across CBSE, NEET & JEE<br>• Step-by-step solutions & error breakdown<br>• Adaptive AI weakness drills<br>• All India Rank benchmarking<br>• Access to Student Mobile App |
| **Student (Institutional)**| **School / Institute Enrolled**| Included in Tenant Fee | • Full access to school/institute exams and notes |
| **Parent** | **Parent Companion Portal** | **Free** *(Included with Student)* | • Multi-child monitoring in dedicated Mobile App<br>• Real-time WhatsApp test score alerts<br>• Online fee payment clearance via UPI/Card<br>• Attendance & exam calendar tracking |

---

### 5.5. Consumption-Based Add-On Packs

| Add-On Service | Pricing Unit | Use Case |
| :--- | :--- | :--- |
| **Gemini AI Question Credits** | ₹499 per 50,000 tokens | Additional test paper generation capacity |
| **WhatsApp Transactional Pack** | ₹350 per 1,000 messages (₹0.35/msg) | Score releases, fee reminders, and attendance |
| **Pre-Printed OMR Sheets** | ₹1.50 per sheet (Min. 1,000 pack) | Standardized optical barcode answer sheets |
| **Branded Play Store Publishing** | ₹15,000 one-time setup fee | Publishing white-label Android App to Google Play |

---

## 6. Marketing & Go-To-Market (GTM) Strategy

### 6.1. Core Unique Selling Propositions (USPs)

1. **True Hybrid Examination Engine:**
   - Most competitors offer either pure CBT portals or standalone desktop OMR utilities. BeBrilliant unifies **Online CBT, Physical OMR Bubble Scanning, and Offline Printable Papers** in a single cloud database.
2. **Organic Growth via WhatsApp Affiliate Engine:**
   - Eliminates customer acquisition cost (CAC) for coaching institutes by turning enrolled students and visiting teachers into a commission-incentivized sales network.
3. **Curriculum-Grounded Gemini AI:**
   - Unlike generic AI tools that hallucinate out-of-syllabus questions, BeBrilliant's **Strict Syllabus Lock** guarantees that every generated question conforms to the chosen board, grade, and chapter.
4. **Dedicated Multi-Role Mobile Applications:**
   - High-retention native mobile experiences for Students and Parents, ensuring real-time visibility into academic performance and immediate fee settlement.

---

### 6.2. Marketing Pitch Angles by Audience

#### For School Directors & Principals
- **Core Problem:** Faculty spend hundreds of administrative hours printing exams and manually grading papers; parents feel uninformed about day-to-day progress.
- **Headline Hook:** *"Modernize your school’s examination department in 24 hours — from OMR bubble scanning to automated WhatsApp parent scorecards."*
- **Call to Action:** *"Book an Institutional White-Label Walkthrough."*

#### For Coaching Institute Owners
- **Core Problem:** High student acquisition costs and operational leakage in manual fee collection and reconciliation.
- **Headline Hook:** *"Turn your coaching institute into a scalable business: automate fee collection via Razorpay and drive admissions with our WhatsApp referral engine."*
- **Call to Action:** *"Start Your Institute Growth Trial."*

#### For Independent Teachers & Private Tutors
- **Core Problem:** Spending late evenings assembling question papers from multiple reference guides and manually grading answer sheets.
- **Headline Hook:** *"Build professional exam papers in 60 seconds with Gemini AI. Automate your grading and deliver branded report cards to parents."*
- **Call to Action:** *"Start Your Free 14-Day Tutor Trial."*

#### For Students & Competitive Aspirants
- **Core Problem:** Uncertainty around All India Rank (AIR) and repetitive mistakes in conceptual weak spots.
- **Headline Hook:** *"Know your competitive rank before the actual exam. Practice with NTA-pattern mock tests and get step-by-step solutions for every question."*
- **Call to Action:** *"Download the Student App & Start Free Practice."*

#### For Parents
- **Core Problem:** Lack of timely visibility into academic struggles and tedious offline fee payment queues.
- **Headline Hook:** *"Stay connected with your child's academic journey. Instant test scorecards on WhatsApp and 1-click fee payments from your phone."*
- **Call to Action:** *"Get the Parent Companion App."*

---

## 7. Audit Sign-off & Verification Matrix

| Module | Codebase Status | Web Interface | Mobile Support | Production Readiness |
| :--- | :--- | :--- | :--- | :--- |
| **CBT Online Exam** | Operational | `/dashboard/exams/online` | Student Mobile App | Ready |
| **OMR Scanner Hub** | Operational | `/dashboard/exams/omr` | Camera Web/Mobile | Ready |
| **Offline Paper Engine** | Operational | `/dashboard/exams/offline` | Desktop Print View | Ready |
| **Gemini AI Question Gen**| Operational | `/dashboard/ai` | Responsive Web | Ready |
| **Curriculum Syllabus** | Operational | `/dashboard/syllabus` | Student & Parent Web | Ready |
| **WhatsApp Affiliates** | Operational | `/dashboard/affiliates` | Responsive Web | Ready |
| **Admissions CRM** | Operational | `/dashboard/crm` | Responsive Web | Ready |
| **Study Material Vault** | Operational | `/dashboard/material` | Student Mobile App | Ready |
| **Live Classroom Hub** | Operational | `/dashboard/live` | Student Mobile App | Ready |
| **Parent Companion** | Operational | `/api/parent/*` | Parent Mobile App | Ready |
| **Razorpay Fee Treasury**| Operational | `/dashboard/wallet` | Student/Parent App | Ready |
| **White-Label Engine** | Operational | `/dashboard/settings` | APK/AAB Builds | Ready |
