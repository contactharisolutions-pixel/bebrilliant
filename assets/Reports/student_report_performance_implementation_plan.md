# Student Report — Performance
## Enterprise Implementation Plan

**Module:** Student Performance Report  
**Primary User:** Admin  
**Related Users:** Principal, Authorized Staff, Teachers  
**Purpose:** Provide a complete, accurate and reusable academic performance report for an individual student.

---

# 1. Objective

Build an enterprise-grade **Student Performance Report** that allows authorized users to select a student and analyze academic performance across an academic year or custom date range.

The report must combine:

- Examination performance
- Subject-wise performance
- Overall average
- Highest score
- Lowest score
- Exams attempted
- Class rank
- Performance trend
- Exam history
- Optional class comparison
- Optional teacher remarks

The report must use existing academic data and must not maintain duplicate marks/result data.

---

# 2. Existing Data Sources

The module should consume data from the existing:

- Student Master
- Student Enrollment
- Academic Year
- Class Master
- Section Master
- Subject Master
- Exam Master
- Exam Schedule
- Marks / Result Engine
- Grade Configuration
- Ranking Configuration
- Staff & Permission System

The Performance Report must remain a **reporting and calculation layer**, not a second result-management system.

---

# 3. Navigation

Recommended navigation:

```text
Admin Panel
    ↓
Reports
    ↓
Student Reports
    ↓
Performance Report
```

Page title:

**Student Performance Report**

---

# 4. Filter Section

## 4.1 Class

```text
Class
[ 10 ▼ ]
```

Rules:

- Display only classes available to the institution.
- Respect user's class-level permissions.
- Academic Year should be considered when loading classes.

## 4.2 Section

```text
Section
[ A ▼ ]
```

Rules:

- Section list depends on selected Class.
- Display only sections available for the selected class and academic year.
- Reset Section when Class changes.

## 4.3 Student

```text
Student
[ Rahul Patel ▼ ]
```

Rules:

- Student list depends on Academic Year + Class + Section.
- Show active/enrolled students by default.
- Student search should support Name, Admission Number, Student ID and Roll Number.

## 4.4 Subject

```text
Subject
[ All ▼ ]
```

Options:

- All Subjects
- Mathematics
- Science
- English
- Social Science
- Hindi
- Other assigned subjects

Rules:

- Subjects must be based on the selected student's academic enrollment.
- If `All` is selected, display the complete report.
- If a specific subject is selected, display only that subject's performance.

## 4.5 Date Range

```text
Date Range
[ Academic Year ▼ ]
```

Options:

- Academic Year
- Term
- Semester
- Custom Date Range
- Custom Exam Range

For Custom Date Range:

```text
From [ 01 Jun 2026 ]
To   [ 30 Sep 2026 ]
```

---

# 5. Filter Dependency

```text
Academic Year
      ↓
Class
      ↓
Section
      ↓
Student
      ↓
Subject
      ↓
Date Range
```

Example:

```text
Academic Year: 2026–27
Class:         10
Section:       A
Student:       Rahul Patel
Subject:       All
Date Range:    Academic Year
```

---

# 6. Student Header

Display:

```text
RAHUL PATEL

Class 10 - Section A
Roll No. 18
Academic Year 2026–27
```

Optional:

- Student Photo
- Admission Number
- Student ID
- Parent Name
- Academic Year

---

# 7. Performance Summary

Display summary cards:

### Overall Average
`74.5%`

### Exams Attempted
`12`

### Highest Score
`91%`

### Lowest Score
`52%`

### Class Rank
`8`

Recommended additional metric:

### Performance Trend
Example: `↑ 6.2%`

---

# 8. Performance Calculation Rules

The system must normalize marks into percentages when examinations have different maximum marks.

Example:

```text
34 / 40  = 85%
29 / 40  = 72.5%
68 / 100 = 68%
```

Do not calculate performance using raw marks when maximum marks differ.

---

# 9. Overall Average

Support configurable calculation modes.

## Simple Average

```text
Overall Average =
Sum of Valid Exam Percentages
÷
Number of Valid Exams
```

## Weighted Average

Support examination weightage configured by the institution.

Example:

```text
Unit Tests     20%
Mid Term       30%
Final Exam     50%
```

The calculation engine must use official institution/exam configuration when weighted evaluation is enabled.

---

# 10. Subject-wise Performance

Display:

| Subject | Average | Highest | Lowest |
|---|---:|---:|---:|
| Maths | 78% | 94% | 55% |
| Science | 72% | 91% | 49% |
| English | 81% | 95% | 63% |

For each subject calculate:

- Average
- Highest
- Lowest

Future-ready metrics:

- Exams Attempted
- Improvement %
- Subject Rank
- Class Average
- Difference from Class Average

---

# 11. Subject Drill-down

Clicking a subject should open detailed performance.

```text
Maths

Average           78%
Highest           94%
Lowest            55%
Exams Attempted    5

Exam History

Unit Test 1       85%
Unit Test 2       72%
Mid Term          68%
Unit Test 3       82%
Final Exam        94%
```

---

# 12. Exam History

Display:

| Exam | Marks | Percentage | Date |
|---|---:|---:|---|
| Unit Test 1 | 34/40 | 85% | 10 Jun |
| Unit Test 2 | 29/40 | 72.5% | 25 Jun |
| Mid Term | 68/100 | 68% | 15 Jul |
| Unit Test 3 | — | 82% | 20 Aug |

Support sorting by:

- Date
- Exam
- Percentage
- Subject

Each record should include:

- Exam Name
- Exam Type
- Subject
- Marks Obtained
- Maximum Marks
- Percentage
- Grade
- Exam Date
- Result Status

---

# 13. Performance Trend

Provide a **Performance Over Time** chart using:

```text
Exam Date → Percentage
```

The chart must respect:

- Selected Subject
- Selected Date Range
- Published results only

It should support descriptive trend states:

- Improving
- Declining
- Stable
- Fluctuating

---

# 14. Class Comparison

Recommended optional section:

| Metric | Student | Class Average |
|---|---:|---:|
| Overall Average | 74.5% | 71.2% |
| Maths | 78% | 73% |
| Science | 72% | 69% |
| English | 81% | 76% |

Use the same:

- Academic Year
- Class
- Section
- Subject
- Date Range
- Published-result rules

---

# 15. Class Rank

Display:

```text
Class Rank
8
```

Rank must use the same official ranking configuration as the Result / Examination Engine.

Possible ranking policies:

- Overall percentage
- Weighted examination score
- Total marks
- Final examination score
- Subject-specific ranking

Do not create an independent ranking algorithm if an official ranking engine already exists.

---

# 16. Missing and Absent Marks

Distinguish:

- Attempted
- Absent
- Not Conducted
- Not Published
- Exempted

Missing marks must not automatically become zero.

Example:

```text
Unit Test 4
Status: Absent
Percentage: —
```

---

# 17. Published Result Rule

Only **published/finalized results** should be included in official calculations.

Draft or unpublished marks must not affect:

- Overall Average
- Highest Score
- Lowest Score
- Class Rank
- Subject Performance
- Class Comparison

Display data status where appropriate:

```text
Results Updated:
02 Oct 2026, 08:15 AM
```

---

# 18. Subject Filter Behaviour

## Subject = All

Display:

- Overall Summary
- Subject-wise Performance
- Complete Exam History
- Overall Trend
- Optional Class Comparison

## Subject = Mathematics

Display:

- Mathematics Summary
- Mathematics Exam History
- Mathematics Trend
- Mathematics Class Comparison

Do not include unrelated subjects in a filtered report.

---

# 19. Date Range Behaviour

### Academic Year
Include all published examinations within the selected academic year.

### Term
Include examinations belonging to the selected term.

### Semester
Include examinations belonging to the selected semester.

### Custom Date Range
Include examinations whose official exam date falls within the selected date range.

---

# 20. Permissions

Integrate with the existing Staff & Permission system.

### Owner / Super Admin
Full access.

### School Admin
Access according to institution permissions.

### Principal
Access to permitted institution students.

### Teacher
Recommended access:

- Assigned classes
- Assigned sections
- Assigned subjects

### Other Staff
No access unless explicitly granted.

Authorization must be enforced server-side.

---

# 21. Multi-Tenant Security

Every performance query must validate:

```text
Tenant / Institution
+
Academic Year
+
User Permission
+
Class
+
Section
+
Student
```

Never depend only on frontend filtering.

A user from one institution must never retrieve another institution's student performance.

---

# 22. Export Options

Provide:

- PDF
- Excel
- Print

Optional:

- Secure Share
- Email Report

Exports must respect exactly the same:

- Filters
- Permissions
- Publication rules
- Academic year
- Subject
- Date range

---

# 23. PDF Report Layout

Recommended structure:

```text
School Logo
School Name

STUDENT PERFORMANCE REPORT

Student Information
────────────────────
Name
Class
Section
Roll Number
Academic Year

Performance Summary
───────────────────
Overall Average
Exams Attempted
Highest Score
Lowest Score
Class Rank

Subject-wise Performance
────────────────────────

Performance Trend
──────────────────

Exam History
────────────

Teacher Remarks
───────────────

Generated Date / Time
```

---

# 24. Teacher Remarks

Authorized users may add remarks.

Store:

- Student
- Teacher
- Subject
- Academic Year
- Remark
- Created Date
- Updated Date

Previous remarks should remain available through history/audit records.

---

# 25. Audit Trail

Track:

- Report viewed
- Report exported
- PDF generated
- Excel generated
- Teacher remark added
- Marks modified
- Result published
- Result unpublished
- Date/time
- User
- Relevant audit metadata supported by the existing system

---

# 26. Backend Architecture

Recommended service flow:

```text
Student Service
      ↓
Enrollment Service
      ↓
Exam Service
      ↓
Marks / Result Service
      ↓
Performance Calculation Service
      ↓
Ranking Service
      ↓
Student Performance Report API
      ↓
Performance UI
```

The Performance Calculation Service should be reusable by:

- Admin Dashboard
- Teacher Dashboard
- Student Dashboard
- Parent Dashboard
- Student Performance Report
- School Analytics
- Result Analytics

---

# 27. Recommended API Structure

```text
GET /api/reports/students/performance
GET /api/reports/students/performance/summary
GET /api/reports/students/performance/subjects
GET /api/reports/students/performance/exams
GET /api/reports/students/performance/trend
GET /api/reports/students/performance/class-comparison
GET /api/reports/students/performance/export/pdf
GET /api/reports/students/performance/export/excel
```

All endpoints must validate:

- Institution
- Academic Year
- User Permission
- Class
- Section
- Student
- Subject
- Date Range

---

# 28. Central Performance Calculation Engine

Create one reusable calculation service for:

```text
Overall Average
Exams Attempted
Highest Score
Lowest Score
Subject Average
Subject Highest
Subject Lowest
Class Rank
Class Average
Performance Trend
```

Do not duplicate calculations across different dashboards.

This ensures consistent results across:

- Admin
- Teacher
- Student
- Parent
- PDF
- Excel

---

# 29. Suggested Data Model

Reuse existing tables wherever possible.

Potential entities:

```text
students
student_enrollments
academic_years
classes
sections
subjects
exams
exam_subjects
exam_results
exam_marks
grades
ranking_rules
teacher_remarks
report_audit_logs
```

Do not create duplicate student or marks masters.

---

# 30. UI Layout

Recommended page structure:

```text
┌─────────────────────────────────────────────────────────┐
│ Student Performance Report                              │
│                                                         │
│ Class     Section     Student       Subject    Period  │
│ [10 ▼]    [A ▼]      [Rahul ▼]     [All ▼]    [Year] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RAHUL PATEL                                             │
│ Class 10 • Section A • Roll No. 18                     │
│ Academic Year 2026–27                                  │
└─────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 74.5%      │ │ 12         │ │ 91%        │
│ Average    │ │ Exams      │ │ Highest    │
└────────────┘ └────────────┘ └────────────┘

┌────────────┐ ┌────────────┐
│ 52%        │ │ 8          │
│ Lowest     │ │ Rank       │
└────────────┘ └────────────┘

Subject-wise Performance
────────────────────────────────────────────
Subject        Average      Highest      Lowest
Maths            78%          94%          55%
Science          72%          91%          49%
English          81%          95%          63%

Performance Trend
────────────────────────────────────────────
[Chart]

Exam History
────────────────────────────────────────────
Exam          Marks       %       Date
Unit Test 1   34/40       85%     10 Jun
Unit Test 2   29/40       72.5%   25 Jun
Mid Term      68/100      68%     15 Jul
Unit Test 3   —           82%     20 Aug
```

---

# 31. Responsive Design

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop:
- Multi-column summary cards
- Full data tables

Tablet:
- Responsive grid
- Horizontally scrollable tables

Mobile:
- Stacked cards
- Collapsible sections
- Horizontal table scrolling
- Compact student header
- Touch-friendly filters

---

# 32. Implementation Phases

## Phase 1 — Data Validation

Verify:

- Student Master
- Enrollment
- Academic Year
- Class
- Section
- Subject
- Exam Master
- Exam Schedule
- Marks
- Results
- Grade configuration
- Ranking configuration

## Phase 2 — Performance Calculation Engine

Implement:

- Percentage normalization
- Simple average
- Weighted average
- Highest
- Lowest
- Subject aggregation
- Exam count
- Rank calculation
- Trend calculation
- Missing/absent handling

## Phase 3 — Report APIs

Implement:

- Filter API
- Summary API
- Subject Performance API
- Exam History API
- Trend API
- Class Comparison API
- PDF Export API
- Excel Export API

## Phase 4 — Admin UI

Build:

1. Filter section
2. Student header
3. Summary cards
4. Subject performance table
5. Performance trend
6. Exam history
7. Class comparison
8. Teacher remarks
9. Export controls

## Phase 5 — Permission Integration

Connect with the existing Staff & Permission System and validate all permissions server-side.

## Phase 6 — Export

Implement:

- PDF
- Excel
- Print

Ensure exported reports exactly match the selected filters.

## Phase 7 — QA

Test:

- Multiple academic years
- Multiple classes
- Multiple sections
- Multiple subjects
- Different maximum marks
- Absent students
- Missing marks
- Unpublished results
- Weighted examinations
- Ranking rules
- Custom date ranges
- Teacher permissions
- Multi-tenant isolation
- Large datasets

---

# 33. Acceptance Criteria

The module is complete when:

- Admin can select Class.
- Admin can select Section.
- Admin can select Student.
- Admin can select Subject.
- Admin can select Date Range.
- Student information loads correctly.
- Overall Average is accurate.
- Exams Attempted is accurate.
- Highest Score is accurate.
- Lowest Score is accurate.
- Class Rank follows the official ranking engine.
- Subject-wise Average is accurate.
- Subject-wise Highest is accurate.
- Subject-wise Lowest is accurate.
- Exam History is accurate.
- Different maximum marks are normalized correctly.
- Absent students are not treated as zero.
- Unpublished results do not affect official calculations.
- Date filtering works correctly.
- Subject filtering works correctly.
- Performance trend uses the selected dataset.
- Class comparison uses the same filter context.
- Authorized users can access the report.
- Unauthorized users cannot access restricted students.
- PDF export matches the on-screen report.
- Excel export matches the on-screen report.
- All calculations use one centralized performance engine.
- Data is traceable to official examination/result records.
- Multi-tenant isolation is enforced.

---

# 34. Future Expansion

The architecture should support:

- Student Performance Dashboard
- Parent Performance Report
- Teacher Class Performance Report
- Class Performance Report
- Subject Performance Report
- Chapter-wise Performance
- Topic-wise Performance
- Learning Outcome Analysis
- Improvement Tracking
- Academic Risk Indicators
- AI Performance Insights
- Personalized Learning Recommendations
- Comparative Class Analytics

---

# 35. Final Implementation Principle

The Student Performance Report must be implemented as a **reusable academic analytics layer**, not as a standalone screen.

The same centralized performance data and calculation engine should power:

```text
Student Performance Report
        ↓
Teacher Dashboard
        ↓
Parent Dashboard
        ↓
Student Dashboard
        ↓
School Analytics
        ↓
Result Analytics
        ↓
Future AI Performance Insights
```

This ensures that the same student, exam, marks, percentage, ranking and performance calculations remain consistent throughout the entire platform.
