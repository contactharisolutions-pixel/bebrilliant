# Class Reports — Enterprise Implementation Plan

## Module: Class Reports

**Primary Users:** Principal, School Admin, Authorized Academic Staff  
**Purpose:** Provide a frequently used class-level academic performance report for a selected class, section, subject, and examination.

---

# 1. Objective

Build an enterprise-grade **Class Reports** module that allows Principal/Admin users to quickly analyze the performance of an entire class for a specific examination.

The report must provide:

- Class and section performance
- Subject-wise exam performance
- Students appeared
- Average percentage
- Highest score
- Lowest score
- Pass count
- Fail count
- Pass percentage
- Student ranking
- Student marks
- Student percentage
- Pass/Fail status
- PDF export
- Excel export
- Print

The module must use the existing:

- Student Master
- Enrollment
- Class & Section
- Subject Master
- Exam Master
- Exam Schedule
- Marks / Result Engine
- Grade & Passing Rules
- Ranking Engine
- Staff & Permission System

It must not create a duplicate marks/result system.

---

# 2. Navigation

Recommended navigation:

```text
Admin Panel
    ↓
Reports
    ↓
Class Reports
```

Page title:

**Class Reports**

Recommended subtitle:

**Class-wise examination performance and student result analysis**

---

# 3. Report Filter Section

The top of the page should contain a compact filter panel.

## Required Filters

```text
Class
[ 10 ▼ ]

Section
[ A ▼ ]

Subject
[ Science ▼ ]

Exam
[ Unit Test 2 ▼ ]
```

Recommended additional filter:

```text
Academic Year
[ 2026–27 ▼ ]
```

Academic Year should preferably be included even if the current UI defaults to the active academic year.

---

# 4. Filter Dependency

Filters must be dynamically dependent.

```text
Academic Year
      ↓
Class
      ↓
Section
      ↓
Subject
      ↓
Exam
```

Example:

```text
Academic Year: 2026–27
Class:         10
Section:       A
Subject:       Science
Exam:          Unit Test 2
```

---

# 5. Filter Behaviour

## Class

Display only classes available to the institution and allowed by the logged-in user's permissions.

When Class changes:

- Reset Section
- Reset Subject
- Reset Exam
- Reload dependent data

---

## Section

Display sections belonging to the selected class and academic year.

Example:

```text
Class 10

A
B
C
D
```

---

## Subject

Display subjects assigned to the selected class/section.

Example:

```text
Science
Mathematics
English
Social Science
Hindi
```

The report is specifically designed around one selected subject.

Future enhancement may support:

```text
Subject = All
```

for multi-subject class analysis.

---

## Exam

Display only examinations applicable to:

- Selected academic year
- Selected class
- Selected section
- Selected subject

Example:

```text
Unit Test 1
Unit Test 2
Mid Term
Unit Test 3
Final Exam
```

Do not display unrelated examinations.

---

# 6. Report Header

After valid filters are selected, display:

```text
CLASS 10-A — SCIENCE

Exam: Unit Test 2
Academic Year: 2026–27
```

Optional:

```text
Exam Date: 25 Jun 2026
Maximum Marks: 100
Passing Marks: 35
```

The report header should clearly communicate the exact dataset being analyzed.

---

# 7. Class Performance Summary

Display high-visibility summary cards.

## Required Metrics

### Students Appeared

```text
42
Students Appeared
```

Definition:

Number of students with a valid submitted/recorded result for the selected examination.

---

### Average

```text
68.4%
Average
```

Definition:

Average percentage of valid students who appeared.

---

### Highest

```text
94%
Highest
```

Definition:

Highest valid percentage achieved by a student.

---

### Lowest

```text
31%
Lowest
```

Definition:

Lowest valid percentage achieved by a student.

---

### Pass

```text
36
Pass
```

Definition:

Number of students meeting the configured passing criteria.

---

### Fail

```text
6
Fail
```

Definition:

Number of students below the configured passing criteria.

---

### Pass Percentage

```text
85.7%
Pass Percentage
```

Calculation:

```text
Pass Percentage =
(Pass Count ÷ Students Appeared) × 100
```

Example:

```text
36 ÷ 42 × 100
= 85.71%
```

Display according to institution rounding configuration.

---

# 8. Class Summary Validation

The system should validate:

```text
Students Appeared = Pass + Fail
```

when all appeared students have a final pass/fail status.

If some results are incomplete, do not force this relationship.

Example:

```text
Appeared: 42
Pass: 34
Fail: 5
Result Pending: 3
```

The UI should clearly indicate incomplete result data.

---

# 9. Student Performance Table

Display:

## Student Performance

| Rank | Student | Marks | % | Status |
|---:|---|---:|---:|---|
| 1 | Rahul | 94 | 94% | Pass |
| 2 | Riya | 91 | 91% | Pass |
| 3 | Amit | 88 | 88% | Pass |
| ... | ... | ... | ... | ... |

---

# 10. Table Columns

Required columns:

### Rank

Position according to the official ranking rule.

### Student

Display:

- Student Name
- Optional Student ID
- Optional Roll Number

### Marks

Display:

```text
94 / 100
```

or, if the UI is intentionally compact:

```text
94
```

Maximum marks should be visible in the report header.

### Percentage

Example:

```text
94%
```

### Status

Possible values:

- Pass
- Fail
- Absent
- Result Pending
- Exempted
- Not Applicable

---

# 11. Student Sorting

Default sorting:

```text
Rank ↑
```

Highest performing student first.

Support sorting by:

- Rank
- Student Name
- Marks
- Percentage
- Status

Do not change official rank merely because the user changes table sorting.

---

# 12. Ranking Rules

Ranking must use the platform's official Result / Ranking Engine.

The Class Report must not implement an independent ranking algorithm.

Possible ranking rules may include:

- Highest percentage
- Highest total marks
- Weighted examination score
- Institution-defined ranking policy

The same ranking logic should be used by:

- Class Report
- Student Report
- Result Module
- Student Dashboard
- Parent Dashboard

---

# 13. Tie Handling

The system must support configurable tie rules.

Example:

```text
1 — Rahul — 94%
2 — Riya  — 91%
2 — Amit  — 91%
4 — Neha  — 88%
```

Possible ranking methods:

- Competition ranking: 1, 2, 2, 4
- Dense ranking: 1, 2, 2, 3

The institution's configured ranking method must be used consistently.

---

# 14. Pass / Fail Rules

Pass/Fail must use the official examination configuration.

Possible rules:

### Percentage Based

```text
Passing Percentage = 35%
```

### Marks Based

```text
Maximum Marks = 100
Passing Marks = 35
```

### Subject-Specific

Different subjects may have different passing rules.

### Component-Based

Future-ready support for:

- Theory
- Practical
- Internal Assessment

Do not hard-code `35%` or another passing value into the Class Report.

---

# 15. Absent Students

Absent students must not automatically be treated as failed unless the institution's official result rules explicitly define absence as fail.

Example:

```text
Student: Karan
Marks: —
Percentage: —
Status: Absent
```

The report should separately count:

```text
Students Appeared
Absent
Pass
Fail
Result Pending
```

If the official Result Engine defines an absent student as Fail, the report should use that official status.

---

# 16. Result Pending

If marks are not finalized:

```text
Status: Result Pending
```

Pending results must not incorrectly affect official:

- Average
- Highest
- Lowest
- Pass count
- Fail count
- Pass percentage
- Ranking

Only finalized/published results should be included in official performance calculations.

---

# 17. Class Average Calculation

The default class average should be:

```text
Class Average =
Sum of Valid Student Percentages
÷
Number of Students with Valid Results
```

Example:

```text
Student 1 = 94%
Student 2 = 91%
Student 3 = 88%
...
```

Use normalized percentages when maximum marks differ.

Do not calculate the class average from raw marks if students have different maximum marks.

---

# 18. Highest and Lowest

## Highest

Highest valid percentage among finalized student results.

## Lowest

Lowest valid percentage among finalized student results.

Do not include:

- Absent
- Result Pending
- Exempted

unless the official reporting rules specifically require them.

---

# 19. Students Appeared Definition

Recommended definition:

```text
Students Appeared =
Number of enrolled students
with a valid finalized result
for the selected class + section + subject + exam
```

The exact definition should align with the institution's Result Engine.

If attendance and result participation are separately tracked, provide future support for:

- Enrolled
- Appeared
- Absent
- Result Pending

---

# 20. Student Detail Interaction

Clicking a student row should open the student's detailed performance view.

Example:

```text
Rahul Patel

Class: 10-A
Subject: Science
Exam: Unit Test 2

Marks: 94 / 100
Percentage: 94%
Rank: 1
Status: Pass
```

Optional links:

```text
View Student Performance
View Exam History
View Student Profile
```

The detailed Student Performance Report should reuse the existing Student Report module.

---

# 21. Class Performance Visualization

Recommended optional visual section:

## Score Distribution

Show the distribution of students by percentage range.

Example:

```text
90–100%    ███████
80–89%     ██████████
70–79%     ████████
60–69%     ██████
50–59%     ████
Below 50%  ███
```

This helps Principal/Admin understand class distribution without opening individual student records.

---

# 22. Pass / Fail Visualization

Recommended visual summary:

```text
Pass
36 Students
85.7%

Fail
6 Students
14.3%
```

If absent or pending records exist, display them separately.

---

# 23. Optional Class Analytics

The architecture should support future metrics:

- Median Percentage
- Standard Deviation
- Score Distribution
- Grade Distribution
- Subject Average
- Class Improvement
- Previous Exam Comparison
- Previous Year Comparison
- Top 5 Students
- Students Below Threshold
- Students Requiring Attention

These should be implemented as optional widgets rather than making the initial report unnecessarily complex.

---

# 24. Previous Exam Comparison

Future-ready functionality:

```text
Unit Test 1 Average     64.2%
Unit Test 2 Average     68.4%

Change                   +4.2%
```

This allows Principal/Admin to track class-level progress over multiple examinations.

The comparison must use comparable:

- Class
- Section
- Subject
- Exam type / configured comparison group

---

# 25. Previous Year Comparison

Future support:

```text
Class 10-A
Science

2025–26 Average: 65.1%
2026–27 Average: 68.4%
Change:          +3.3%
```

Only show this when equivalent historical data exists.

---

# 26. Export PDF

Admin/Principal should be able to select:

```text
Export PDF
```

The PDF must contain:

```text
School Logo
School Name

CLASS 10-A — SCIENCE

Academic Year
Exam
Exam Date
Maximum Marks
Passing Criteria

Class Summary

Students Appeared
Average
Highest
Lowest
Pass
Fail
Pass Percentage

Student Performance Table

Rank
Student
Marks
%
Status

Generated Date / Time
```

Optional:

- Score Distribution
- Pass/Fail chart
- Principal remarks

---

# 27. Export Excel

Admin/Principal should be able to select:

```text
Export Excel
```

Recommended workbook:

## Sheet 1 — Class Summary

- Institution
- Academic Year
- Class
- Section
- Subject
- Exam
- Exam Date
- Maximum Marks
- Passing Marks
- Students Appeared
- Average
- Highest
- Lowest
- Pass
- Fail
- Pass Percentage

## Sheet 2 — Student Performance

| Rank | Student | Admission No. | Roll No. | Marks | % | Status |
|---:|---|---|---|---:|---:|---|

## Sheet 3 — Analytics

Optional:

- Score distribution
- Grade distribution
- Pass/fail distribution

Exports must respect user permissions.

---

# 28. Print

Provide:

```text
Print
```

The print view should:

- Hide navigation
- Hide filters that are not needed
- Use printer-friendly spacing
- Display school branding
- Display report title
- Display summary
- Display student table
- Include page numbers
- Include generated date/time

---

# 29. Permissions

Integrate with the existing Staff & Permission system.

## Owner / Super Admin

Full access.

## School Admin

Access according to institution permissions.

## Principal

Recommended full access to assigned institution.

## Academic Coordinator

Access according to assigned academic scope.

## Teacher

Recommended access only to:

- Assigned class
- Assigned section
- Assigned subject

## Other Staff

No access unless explicitly granted.

All authorization must be enforced server-side.

---

# 30. Multi-Tenant Security

Every query must validate:

```text
Tenant / Institution
+
Academic Year
+
User Role / Permission
+
Class
+
Section
+
Subject
+
Exam
```

A user must never be able to access another institution's class report by manipulating query parameters.

---

# 31. Audit Trail

Track:

- Report viewed
- Report filtered
- PDF exported
- Excel exported
- Report printed
- Student detail opened
- Result changes
- Result publication
- Result correction

Recommended audit fields:

```text
User
Role
Institution
Action
Report Type
Filters Used
Date/Time
IP / Device Metadata
```

Use the existing platform audit architecture wherever available.

---

# 32. API Architecture

Recommended endpoints:

```text
GET /api/reports/classes/performance

GET /api/reports/classes/performance/summary

GET /api/reports/classes/performance/students

GET /api/reports/classes/performance/distribution

GET /api/reports/classes/performance/comparison

GET /api/reports/classes/performance/export/pdf

GET /api/reports/classes/performance/export/excel
```

All endpoints must validate:

- Institution
- Academic Year
- Permission
- Class
- Section
- Subject
- Exam

---

# 33. Recommended Response Structure

Example:

```json
{
  "class": "10",
  "section": "A",
  "subject": "Science",
  "exam": "Unit Test 2",
  "academicYear": "2026-27",
  "maximumMarks": 100,
  "passingMarks": 35,
  "summary": {
    "studentsAppeared": 42,
    "averagePercentage": 68.4,
    "highestPercentage": 94,
    "lowestPercentage": 31,
    "passCount": 36,
    "failCount": 6,
    "passPercentage": 85.7
  },
  "students": []
}
```

The actual API contract should follow the project's existing backend conventions.

---

# 34. Data Architecture

Reuse existing entities wherever possible.

Potential data sources:

```text
institutions
academic_years
classes
sections
students
student_enrollments
subjects
exams
exam_subjects
exam_results
exam_marks
grades
ranking_rules
passing_rules
report_audit_logs
```

Do not create duplicate:

- Student master
- Class master
- Subject master
- Exam master
- Marks master
- Result master

---

# 35. Performance Requirements

Because Principal/Admin will use this report frequently, it should be optimized for fast loading.

Recommended:

- Server-side filtering
- Indexed foreign keys
- Indexed academic year/class/section/subject/exam combinations
- Pagination for large classes
- Cached finalized exam summaries where appropriate
- Avoid repeated calculation queries
- Lazy-load advanced analytics
- Generate large exports asynchronously when required

Target:

```text
Normal report load:
< 2 seconds
```

for typical school datasets under normal server conditions.

For very large datasets, use optimized queries and asynchronous export generation.

---

# 36. UI/UX Requirements

The report should be optimized for frequent administrative use.

## Recommended Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Class Reports                                               │
│ Class-wise examination performance                          │
│                                                             │
│ Class    Section    Subject       Exam       Academic Year │
│ [10 ▼]   [A ▼]      [Science ▼]   [UT-2 ▼]  [2026–27 ▼] │
│                                                             │
│                         [Export PDF] [Excel] [Print]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS 10-A — SCIENCE                                       │
│ Unit Test 2 • Maximum Marks: 100 • Passing Marks: 35      │
└─────────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 42         │ │ 68.4%      │ │ 94%        │
│ Appeared   │ │ Average    │ │ Highest    │
└────────────┘ └────────────┘ └────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 31%        │ │ 36         │ │ 85.7%      │
│ Lowest     │ │ Pass       │ │ Pass %     │
└────────────┘ └────────────┘ └────────────┘

Student Performance
─────────────────────────────────────────────────────────────
Rank   Student       Marks       %       Status
1      Rahul         94          94%     Pass
2      Riya          91          91%     Pass
3      Amit          88          88%     Pass
...    ...           ...         ...     ...
```

---

# 37. Responsive Design

The report must support:

- Desktop
- Laptop
- Tablet
- Mobile

## Desktop

Use:

- Full-width report
- Summary cards
- Full student table
- Analytics widgets

## Tablet

Use:

- Responsive summary grid
- Horizontally scrollable table
- Sticky table header

## Mobile

Use:

- Stacked summary cards
- Compact filters
- Horizontal table scrolling
- Student row/card interaction
- Bottom or top export actions

---

# 38. Sticky Controls

Because the report is frequently used, consider making the filter and action bar sticky while scrolling.

Sticky area:

```text
Class | Section | Subject | Exam | Academic Year
                         PDF | Excel | Print
```

This allows Principal/Admin to change context without returning to the top.

---

# 39. Empty State

If no result exists:

```text
No Result Data Available

There are no published results for the selected
Class, Section, Subject and Exam.

Please verify the selected filters or publish the exam results.
```

Actions:

```text
Change Filters
```

---

# 40. Incomplete Data State

If some student results are pending:

```text
Result data is incomplete.

3 students have pending results.
Class statistics currently include only finalized results.
```

This is important so Principal/Admin does not interpret incomplete statistics as final.

---

# 41. No Student Result State

If students are enrolled but no results have been published:

```text
42 Students Enrolled
0 Results Published

The report will be available after examination results are published.
```

---

# 42. Implementation Phases

## Phase 1 — Data Validation

Verify existing:

- Academic Year
- Class
- Section
- Student Enrollment
- Subject
- Exam
- Exam Subject Mapping
- Marks
- Result Status
- Grade Rules
- Passing Rules
- Ranking Rules
- Permission System

---

## Phase 2 — Class Performance Calculation Engine

Implement:

- Students appeared
- Average
- Highest
- Lowest
- Pass count
- Fail count
- Pass percentage
- Rank
- Status
- Result pending count
- Absent count

All calculations must use the official Result Engine rules.

---

## Phase 3 — Class Report APIs

Implement:

- Filter API
- Summary API
- Student performance API
- Distribution API
- Comparison API
- PDF export API
- Excel export API

---

## Phase 4 — Admin UI

Build:

1. Filter panel
2. Report header
3. Summary cards
4. Student performance table
5. Optional score distribution
6. Optional pass/fail visualization
7. Export controls
8. Empty/incomplete states

---

## Phase 5 — Permission Integration

Connect with:

**Staff & Permission System**

Validate access server-side.

---

## Phase 6 — Export

Implement:

- PDF
- Excel
- Print

Ensure exports exactly match the selected filters and official published-result dataset.

---

## Phase 7 — Performance Optimization

Implement:

- Database indexes
- Query optimization
- Server-side pagination
- Summary caching where appropriate
- Efficient aggregate queries
- Async export for large datasets

---

## Phase 8 — QA

Test:

- Multiple academic years
- Multiple classes
- Multiple sections
- Multiple subjects
- Multiple exams
- Different maximum marks
- Different passing marks
- Grade-based pass rules
- Absent students
- Pending results
- Published/unpublished results
- Tied ranks
- Large classes
- Teacher permissions
- Principal permissions
- Multi-tenant isolation
- PDF export
- Excel export
- Print

---

# 43. Acceptance Criteria

The Class Reports module is complete when:

- Admin can select Academic Year.
- Admin can select Class.
- Admin can select Section.
- Admin can select Subject.
- Admin can select Exam.
- Report header displays the correct class, section, subject and exam.
- Students Appeared is accurate.
- Class Average is accurate.
- Highest score is accurate.
- Lowest score is accurate.
- Pass count is accurate.
- Fail count is accurate.
- Pass Percentage is accurate.
- Student ranking follows the official ranking engine.
- Student marks are accurate.
- Student percentage is accurate.
- Pass/Fail status follows official passing rules.
- Absent students are handled correctly.
- Pending results are excluded from official statistics where required.
- Unpublished results do not affect official report calculations.
- Student table supports sorting.
- Student details can be opened.
- PDF export works.
- Excel export works.
- Print layout works.
- Permissions are enforced.
- Multi-tenant isolation is enforced.
- Audit events are recorded.
- Large class reports remain performant.

---

# 44. Future Enhancements

The architecture should support:

- Class Performance Dashboard
- Subject Comparison
- Exam-to-Exam Comparison
- Previous Academic Year Comparison
- Score Distribution
- Grade Distribution
- Median Score
- Standard Deviation
- Top Performers
- Students Below Threshold
- Improvement Tracking
- Class Performance Trend
- Teacher-wise Class Analysis
- Chapter-wise Class Performance
- Topic-wise Class Performance
- Learning Outcome Analysis
- AI-generated Class Insights
- AI-generated Academic Intervention Suggestions

---

# 45. Final Architecture Principle

The **Class Reports** module must be a reusable reporting layer built on the official Examination and Result Engine.

```text
Class / Section / Subject / Exam
              ↓
       Official Result Data
              ↓
     Performance Calculation
              ↓
        Ranking Engine
              ↓
       Class Report API
              ↓
     ┌────────┼────────┐
     ↓        ↓        ↓
    Web      PDF     Excel
     ↓
Principal / Admin / Authorized Staff
```

The same calculation logic must be reused across:

```text
Class Reports
Student Performance Reports
Teacher Reports
Student Dashboard
Parent Dashboard
School Analytics
Result Analytics
Future AI Analytics
```

This prevents inconsistent averages, ranks, pass percentages, and student statuses across different parts of the platform.
