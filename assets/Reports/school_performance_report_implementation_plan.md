# BeBrilliant — School Performance Report
## Production-Grade Principal & Management Academic Performance Implementation

**Document Type:** Master Implementation Specification  
**Product:** BeBrilliant School / Institute ERP  
**Module:** School Performance Report  
**Primary Users:** Owner, Super Admin, Principal, Management, Authorized Academic Leadership  
**Purpose:** Provide one school-level academic command report covering student strength, teacher strength, examination activity, school performance, pass rate, improvement, support needs, and class comparison.

---

# 1. Purpose

The **School Performance Report** is the highest-level academic performance report in BeBrilliant.

It is designed for:

- Principal
- School Management
- Owner
- Super Admin
- Academic Leadership

The principal should be able to open **one report** and immediately understand the overall academic position of the school.

The report must answer:

- How many students are currently enrolled?
- How many teachers are active?
- How many exams have been conducted?
- How many were online?
- How many were OMR?
- How many were subjective/offline papers?
- What is the average school score?
- What is the overall pass rate?
- How many students are improving?
- How many students need academic support?
- How are classes performing against each other?
- Which classes are strong?
- Which classes need attention?
- How is school performance changing over time?

---

# 2. Primary School Performance View

The principal should see:

```text
SCHOOL PERFORMANCE
────────────────────────────────

Students                    850
Teachers                     32
Exams Conducted             184
Online Exams                 92
OMR Exams                    61
Subjective Papers            31

Average School Score       71.4%
Overall Pass Rate          86.2%

Students Improving           72%
Students Needing Support    14%
```

Then:

```text
CLASS COMPARISON

Class 6       76%
Class 7       72%
Class 8       69%
Class 9       71%
Class 10      74%
Class 11      65%
Class 12      70%
```

The actual values must always come from official BeBrilliant data and selected filters.

---

# 3. Report Philosophy

The School Performance Report must be:

- Factual
- Traceable
- Configurable
- Filter-driven
- Based on official results
- Multi-tenant secure
- Responsive
- Principal-friendly
- Management-friendly
- Drill-down capable

It should provide a **school-level summary**, while allowing the principal to drill down into:

```text
School
 ↓
Class
 ↓
Section
 ↓
Subject
 ↓
Chapter
 ↓
Topic
 ↓
Student
```

---

# 4. Global Filters

The report must provide a common filter bar.

## Required

- Academic Year
- Campus / Branch
- Date Range
- Term
- Exam Type
- Result Status

## Optional

- Class
- Section
- Subject
- Department
- Assessment Type
- Online / OMR / Subjective
- Teacher

Default:

```text
Academic Year = Current Academic Year
Result Status = Published
Campus = All
```

The report must clearly display the active filters.

---

# 5. School Overview KPI Section

The first section should contain the most important school-level KPIs.

Recommended:

```text
Students
Teachers
Classes
Sections

Exams Conducted
Online Exams
OMR Exams
Subjective Papers

Average School Score
Overall Pass Rate

Students Improving
Students Needing Support
```

Optional additional KPIs:

- Subjects
- Chapters Covered
- Topics Covered
- Total Assessment Attempts
- Students Appeared
- Students Absent
- Results Completed
- Results Pending

---

# 6. Student Count

## Definition

The student count should represent students active/enrolled for the selected academic year and school/campus.

Example:

```text
Students: 850
```

Rules:

- Use Student Master.
- Respect academic year.
- Respect campus/branch filter.
- Exclude withdrawn students according to configured enrollment rules.
- Preserve historical enrollment where required.
- Do not count duplicate student records.

Optional supporting metrics:

```text
Total Enrolled
Active Students
Withdrawn
Transferred
Graduated
```

---

# 7. Teacher Count

Example:

```text
Teachers: 32
```

Definition:

Number of active teachers associated with the selected school/campus and academic year.

Source:

```text
Teacher Master
+
Teacher Assignment
```

Rules:

- Do not count duplicate assignments as multiple teachers.
- Respect teacher employment/status rules.
- Preserve historical academic-year relationships.

---

# 8. Exams Conducted

Example:

```text
Exams Conducted: 184
```

This must count official exams that reached the configured conducted/completed status.

Do not count:

- Draft exams
- Cancelled exams
- Test templates
- Unpublished exam configurations

The exact status definition must be centralized in the Exam Engine.

---

# 9. Online Exams

Example:

```text
Online Exams: 92
```

Source:

```text
Online Exam Engine
```

Count only valid conducted/completed online examinations according to official exam status.

---

# 10. OMR Exams

Example:

```text
OMR Exams: 61
```

Source:

```text
OMR Engine
```

Count official OMR examinations according to configured conducted/completed status.

Possible supporting metrics:

- OMR Sheets Generated
- OMR Sheets Scanned
- OMR Sheets Evaluated
- Results Completed

---

# 11. Subjective Papers

Example:

```text
Subjective Papers: 31
```

This represents examinations/papers classified under the school's subjective/offline assessment type.

Source:

```text
Exam Engine
+
Paper Generator
+
Assessment Type
```

The exact assessment classification must be configurable.

Do not infer subjective status merely because an exam is offline.

---

# 12. Exam Type Reconciliation

The dashboard should ensure that examination categories do not unintentionally double-count.

For example:

```text
Online Exams
OMR Exams
Subjective Papers
```

should be mapped to the school's configured assessment taxonomy.

If categories are mutually exclusive:

```text
Total Exams
=
Online
+
OMR
+
Subjective / Other
```

If an assessment can have multiple delivery components, the system must use the configured counting model and document it.

---

# 13. Average School Score

Example:

```text
Average School Score: 71.4%
```

This must be calculated through the central **Performance Calculation Engine**.

The system must not average raw marks when examinations have different maximum marks.

Normalize scores to percentages according to official calculation rules.

Possible aggregation:

- Student-weighted
- Assessment-weighted
- Subject-weighted
- Term-weighted

The school's configured academic aggregation rule must determine the final value.

---

# 14. Average School Score — Recommended Definition

Default recommended definition:

```text
Average School Score
=
Average of eligible student performance percentages
for the selected published assessment/result population
```

However, if BeBrilliant already has an official school performance aggregation rule, that rule must remain the source of truth.

The exact methodology should be visible in report information/help text.

Example:

```text
Average School Score
Based on published student results for selected period.
```

---

# 15. Overall Pass Rate

Example:

```text
Overall Pass Rate: 86.2%
```

Formula:

```text
Pass Rate =
Students Meeting Official Pass Criteria
÷
Students Evaluated
× 100
```

The pass criteria must come from the existing Result Engine.

Never hard-code:

```text
35%
```

or any other passing threshold.

---

# 16. Pass Rate Scope

The report must clearly define the population.

Example:

```text
Overall Pass Rate: 86.2%

Based on:
850 enrolled students
742 evaluated students
```

This prevents confusion between:

- Enrollment
- Assessment participation
- Evaluated students
- Passing students

---

# 17. Student Improvement

Example:

```text
Students Improving: 72%
```

This should identify the percentage of eligible students whose performance has improved compared with a configured comparison period.

Example:

```text
Current Period: Term 2
Comparison: Term 1

Students Improving:
612 / 850 = 72%
```

The report must always show the comparison period.

---

# 18. Improvement Definition

Default recommended rule:

A student is considered **improving** when:

```text
Current performance
>
comparison-period performance
```

by at least a configurable minimum change.

Example configuration:

```text
Minimum improvement:
+3 percentage points
```

The threshold must be configurable.

Do not classify insignificant changes as meaningful improvement unless the school chooses to do so.

---

# 19. Students Needing Support

Example:

```text
Students Needing Support: 14%
```

This metric should be generated by the central **Weak Area / Student Support Intelligence Engine**.

Possible criteria:

- Below configured academic threshold
- Repeated poor assessment performance
- Multiple weak subjects
- Multiple weak chapters/topics
- Declining performance
- Persistent failure
- Significant learning gaps

The exact support rule must be configurable.

---

# 20. Support Classification

Recommended statuses:

```text
No Immediate Support
Monitoring
Needs Support
Priority Support
```

These labels are descriptive and should be based on configured rules.

Example:

```text
Needs Support:
14%

Students:
119 / 850
```

Always display both percentage and count where possible.

---

# 21. Class Comparison

The second major section:

```text
CLASS COMPARISON

Class 6       76%
Class 7       72%
Class 8       69%
Class 9       71%
Class 10      74%
Class 11      65%
Class 12      70%
```

This allows the principal to understand performance distribution across classes.

---

# 22. Class Comparison Table

Recommended:

| Class | Students | Average % | Pass % | Mastery % | Improving | Support | Exams |
|---|---:|---:|---:|---:|---:|---:|---:|
| 6 | 120 | 76% | 91% | 79% | 76% | 9% | 24 |
| 7 | 118 | 72% | 88% | 73% | 71% | 12% | 25 |
| 8 | 115 | 69% | 84% | 69% | 68% | 15% | 26 |

The displayed values are examples only.

---

# 23. Class Performance Calculation

Class performance must use the existing:

```text
Performance Calculation Engine
```

Do not create a second class-average calculation.

The existing Class Reports module should be reused.

Drill-down:

```text
School Performance
      ↓
Class 10
      ↓
Class Report
```

---

# 24. Class Comparison Visualization

Recommended visual:

```text
Class 6   ███████████████ 76%
Class 7   ██████████████  72%
Class 8   █████████████   69%
Class 9   ██████████████  71%
Class 10  ███████████████ 74%
Class 11  █████████████   65%
Class 12  ██████████████  70%
```

Alternative:

- Horizontal bar chart
- Compact table
- Trend line

The exact score should always be visible.

---

# 25. Class Trend

Allow the principal to compare class performance over time.

Example:

```text
Class 10

Term 1    68%
Term 2    72%
Term 3    74%
```

Metrics:

- Current average
- Previous average
- Change in percentage points
- Pass rate
- Mastery
- Student improvement
- Students needing support

---

# 26. Subject Performance at School Level

The principal should be able to continue from school → subject.

Example:

```text
SUBJECT PERFORMANCE

Mathematics        73%
Science            69%
English            76%
Social Science     71%
Hindi              74%
```

Recommended fields:

- Subject
- Students
- Average
- Pass %
- Mastery %
- Improving %
- Support %
- Exams
- Weak Chapters
- Weak Topics

---

# 27. Weak Subject Report

The School Performance Report should include a school-wide weak subject section.

Example:

```text
SUBJECTS NEEDING ATTENTION

Science            69%
Mathematics        70%
Social Science     71%
```

The report should connect to the existing Subject Reports module.

Drill-down:

```text
School
 ↓
Subject
 ↓
Class
 ↓
Chapter
 ↓
Topic
```

---

# 28. Chapter Learning Gaps

The principal should optionally see the largest school-wide chapter gaps.

Example:

```text
TOP LEARNING GAPS

Quadratic Equations       54%
Chemical Reactions        58%
Grammar                    61%
```

Metrics:

- Average
- Mastery
- Students below threshold
- Classes affected
- Subjects affected

Use the existing Chapter Performance / Weak Area engine.

---

# 29. Topic Learning Gaps

Optional management view:

```text
TOPIC LEARNING GAPS

Factorisation              42%
Word Problems              46%
Chemical Equations         49%
Reading Comprehension      53%
```

The system should identify topics affecting a meaningful number of students.

---

# 30. Student Support Overview

Recommended:

```text
STUDENT SUPPORT

Total Students             850

No Immediate Support       731
Monitoring                  52
Needs Support              119
Priority Support             34
```

These values are examples.

The actual categories must use school-configured support rules.

---

# 31. Students Improving Overview

Recommended:

```text
STUDENT IMPROVEMENT

Improving                  612
Stable                     119
Declining                  119
```

The classification rules must be configurable.

The report should not hide the underlying counts.

---

# 32. School Performance Trend

Provide an overall school trend.

Example:

```text
School Average

Term 1    67.8%
Term 2    69.9%
Term 3    71.4%
```

Display:

- Current score
- Previous score
- Change
- Pass rate trend
- Mastery trend
- Improvement trend
- Support trend

---

# 33. School Pass Rate Trend

Example:

```text
Term 1    81.4%
Term 2    84.7%
Term 3    86.2%
```

This should use official result data.

---

# 34. Exam Activity Overview

The principal should see:

```text
EXAM ACTIVITY

Exams Conducted       184
Online Exams           92
OMR Exams              61
Subjective Papers      31
```

Optional:

```text
Completed              184
Results Completed      178
Pending Results          6
```

This connects School Performance with the existing Teacher Reports and Exam Reports.

---

# 35. Exam Activity Trend

Example:

```text
April       18
May         22
June        19
July        25
August      31
September   29
```

Allow:

- Monthly
- Term
- Academic year

---

# 36. Result Completion Overview

The principal should know whether exam activity has translated into completed results.

Metrics:

```text
Results Expected
Results Completed
Results Pending
Completion %
```

Example:

```text
Results Expected:     184
Results Completed:    178
Completion:           96.7%
Pending:                 6
```

Source:

```text
Official Result Engine
```

---

# 37. School Academic Coverage

Optional section:

```text
SYLLABUS COVERAGE

Classes: 7
Subjects: 42

Chapters Planned: 184
Chapters Covered: 161
Coverage: 87.5%

Topics Planned: 620
Topics Covered: 548
Coverage: 88.4%
```

This must use the Syllabus Engine.

Do not infer syllabus completion only from examination activity.

---

# 38. Teacher Overview

The report may include:

```text
TEACHER OVERVIEW

Teachers: 32
Active: 30
Subjects Covered: 42
Classes Handled: 28
```

A drill-down should open the existing Teacher Reports module.

---

# 39. Teacher Activity Context

Optional management section:

```text
TEACHER ACTIVITY

Exams Created          184
Papers Generated       151
Results Completed      178
Online Exams            92
OMR Exams               61
```

Teacher-specific details remain in Teacher Reports.

The School Report should provide only aggregated school-level context.

---

# 40. School Report Drill-down

The entire report should be drill-down capable.

```text
School Performance
       ↓
Class Comparison
       ↓
Class Report
       ↓
Subject Report
       ↓
Chapter Report
       ↓
Topic Report
       ↓
Student Performance
       ↓
Question Analysis
```

Filters must remain preserved.

Example:

```text
Academic Year: 2026-27
Class: 10
Subject: Mathematics
```

should remain active when navigating to Chapter and Topic reports.

---

# 41. School → Teacher Drill-down

Management may also navigate:

```text
School Performance
      ↓
Teacher Overview
      ↓
Teacher Report
      ↓
Classes Handled
      ↓
Subject Performance
```

Use the existing Teacher Reports module.

---

# 42. School Report Layout

Recommended page structure:

```text
---------------------------------------------------------
SCHOOL PERFORMANCE
Academic Year | Campus | Term | Date Range
---------------------------------------------------------

Students       Teachers       Exams Conducted
850            32             184

Online Exams   OMR Exams      Subjective Papers
92             61             31

Average Score  Pass Rate
71.4%          86.2%

Improving      Needs Support
72%            14%
---------------------------------------------------------

CLASS COMPARISON

Class 6     76%
Class 7     72%
Class 8     69%
Class 9     71%
Class 10    74%
Class 11    65%
Class 12    70%
---------------------------------------------------------

SCHOOL PERFORMANCE TREND
---------------------------------------------------------

SUBJECT PERFORMANCE
---------------------------------------------------------

STUDENT SUPPORT
---------------------------------------------------------

LEARNING GAPS
---------------------------------------------------------

EXAM ACTIVITY
---------------------------------------------------------

SYLLABUS COVERAGE
---------------------------------------------------------
```

---

# 43. Principal Dashboard Quick View

The principal should be able to understand the report without opening multiple pages.

Top-level view:

```text
School Health

Students              850
Teachers                32
Average Score         71.4%
Pass Rate             86.2%

Improving             72%
Needs Support         14%
```

Then:

```text
Academic Operations

Exams                 184
Online                 92
OMR                    61
Subjective             31
```

Then:

```text
Academic Comparison

Class Performance
Subject Performance
Learning Gaps
Student Support
```

---

# 44. School Performance Summary Card

Provide a concise summary:

```text
School Performance Summary

Average Score: 71.4%
Pass Rate: 86.2%

Compared with previous period:
Average: +2.1 pp
Pass Rate: +1.5 pp

Students Improving: 72%
Students Needing Support: 14%
```

The comparison must always identify the baseline period.

---

# 45. Performance Change

Use percentage points for score/rate comparisons.

Example:

```text
Previous Average: 69.3%
Current Average: 71.4%

Change: +2.1 percentage points
```

Do not confuse:

```text
+2.1 percentage points
```

with:

```text
+2.1% relative growth
```

---

# 46. Support Trend

Example:

```text
Previous Support: 18%
Current Support: 14%

Change: -4 percentage points
```

The system should display the underlying count.

---

# 47. School Performance by Assessment Type

Optional:

```text
Assessment Type Performance

Online       73%
OMR          70%
Subjective   69%
```

This should be used for descriptive analysis.

Do not assume assessment type itself caused performance differences.

---

# 48. School Performance by Term

Example:

| Term | Students | Average | Pass % | Mastery % |
|---|---:|---:|---:|---:|
| Term 1 | 840 | 67.8% | 81% | 68% |
| Term 2 | 850 | 69.9% | 84% | 71% |
| Term 3 | 850 | 71.4% | 86% | 74% |

Use official published result data.

---

# 49. Student Distribution

The principal may see:

```text
PERFORMANCE DISTRIBUTION

90–100%       84 students
80–89%       171 students
70–79%       218 students
60–69%       194 students
50–59%       102 students
Below 50%     81 students
```

Score ranges should be configurable.

---

# 50. School-Level Weak Area Intelligence

Integrate with the existing Weak Area Intelligence Engine.

The report can identify:

```text
Weak Subjects
Weak Chapters
Weak Topics
```

Rules must remain centralized.

Example:

```text
School
 ↓
All Students
 ↓
Performance Engine
 ↓
Mastery Engine
 ↓
Weak Area Intelligence
```

---

# 51. Student Support Intelligence

Student support classification should use:

- Current performance
- Historical performance
- Trend
- Weak subject count
- Weak chapter count
- Weak topic count
- Assessment participation
- Repeated low performance

The final classification must be explainable.

Example:

```text
119 Students Need Support

Common reasons:
• Low Mathematics performance
• Repeated weak Science chapters
• Declining assessment trend
• Low topic mastery
```

---

# 52. AI Summary

Optional AI-generated management summary.

Example:

```text
School Academic Summary

The school average is 71.4% for the selected period,
with an overall pass rate of 86.2%.

72% of eligible students show improvement compared
with the selected comparison period.

14% of students meet the configured support criteria.

Class-level performance ranges from 65% to 76%.
Further drill-down is available for classes, subjects,
chapters, topics, and students.
```

AI must only summarize actual calculated metrics.

AI must not invent numbers or conclusions.

---

# 53. AI Management Insights

Optional suggestions:

```text
Potential Focus Areas

• Review Class 11 performance.
• Review subjects with low mastery.
• Review school-wide topic learning gaps.
• Monitor students meeting support criteria.
```

These should be presented as data-based observations, not unexplained recommendations.

---

# 54. Data Sources

School Performance Report should integrate with:

```text
School / Institute Master
Student Master
Teacher Master
Class & Section Master
Subject Master
Syllabus Engine
Exam Engine
Online Exam Engine
OMR Engine
Offline Paper Generator
Paper Pattern Engine
Result Engine
Ranking Engine
Performance Calculation Engine
Weak Area Intelligence Engine
Teacher Reports
Student Reports
Class Reports
Subject Reports
Chapter Reports
Topic Reports
Activity / Audit Engine
```

No duplicate source-of-truth systems should be created.

---

# 55. Source-of-Truth Architecture

## Students

Student Master.

## Teachers

Teacher Master.

## Classes

Class Master.

## Subjects

Subject Master.

## Exams

Exam Engine.

## Online Exams

Online Exam Engine.

## OMR

OMR Engine.

## Subjective Papers

Configured Assessment / Paper Engine.

## Results

Official Result Engine.

## Performance

Central Performance Calculation Engine.

## Class Performance

Existing Class Reports / Performance Engine.

## Subject Performance

Existing Subject Reports / Performance Engine.

## Chapter Performance

Chapter Analytics Engine.

## Topic Performance

Topic Analytics Engine.

## Weak Areas

Weak Area Intelligence Engine.

## Syllabus Coverage

Syllabus Engine.

---

# 56. Data Architecture

Use existing entities wherever possible.

Logical sources:

```text
schools
campuses
academic_years
students
student_enrollments
teachers
teacher_assignments
classes
sections
subjects
syllabus
chapters
topics
exams
exam_attempts
exam_types
online_exams
omr_exams
papers
results
published_results
performance_metrics
weak_area_metrics
interventions
activity_events
```

Do not duplicate existing master tables.

---

# 57. School Performance Snapshot

For high-performance dashboards, use aggregated snapshots where necessary.

Recommended logical structure:

```text
school_performance_snapshots

tenant_id
school_id
academic_year_id
campus_id
period_id
students_count
teachers_count
exams_conducted
online_exams
omr_exams
subjective_papers
average_score
pass_rate
students_improving
students_needing_support
calculated_at
source_result_version
```

The snapshot must be derived from official source data.

---

# 58. Result Versioning

Every school performance snapshot should reference the result version.

Example:

```text
Result Version 24
        ↓
School Performance Snapshot 24
```

When results change:

```text
Result Correction
      ↓
Affected Metrics Identified
      ↓
Performance Recalculation
      ↓
School Snapshot Refreshed
```

This prevents stale management reports.

---

# 59. Published Result Rule

Official School Performance must use:

```text
Finalized / Published Results
```

Draft results must not affect official school KPIs.

If preview mode is provided:

```text
Preview
```

must be clearly labeled.

---

# 60. Missing Data Rules

The report must distinguish:

- No data
- Not conducted
- Not applicable
- Pending
- Absent
- Exempted
- Result withheld

Do not convert missing results to zero.

Example:

```text
Average Score: N/A
```

is preferable to:

```text
Average Score: 0%
```

when there is no valid data.

---

# 61. Security

The School Performance Report contains sensitive student and institutional information.

Permissions:

```text
school_reports.view
school_reports.performance.view
school_reports.class.view
school_reports.subject.view
school_reports.learning_gap.view
school_reports.student_support.view
school_reports.export
school_reports.configure
```

## Access

### Owner / Super Admin

Full access.

### Principal

Full school-level access.

### Academic Coordinator

Authorized academic analytics.

### Teacher

Only permitted class/subject analytics.

### Student

Own performance only.

### Parent

Authorized child data only.

---

# 62. Multi-Tenant Security

Every query must enforce:

```text
tenant_id
school_id
academic_year_id
campus_id
```

where applicable.

Server-side authorization is mandatory.

Never rely only on frontend visibility controls.

---

# 63. API Architecture

Recommended:

```http
GET /api/reports/school-performance
GET /api/reports/school-performance/summary
GET /api/reports/school-performance/classes
GET /api/reports/school-performance/subjects
GET /api/reports/school-performance/trends
GET /api/reports/school-performance/exam-activity
GET /api/reports/school-performance/student-support
GET /api/reports/school-performance/learning-gaps
GET /api/reports/school-performance/syllabus-coverage
GET /api/reports/school-performance/performance-distribution
```

Use existing BeBrilliant API conventions.

---

# 64. Example API Response

```json
{
  "school": {
    "students": 850,
    "teachers": 32
  },
  "exams": {
    "conducted": 184,
    "online": 92,
    "omr": 61,
    "subjective": 31
  },
  "performance": {
    "averageScore": 71.4,
    "passRate": 86.2
  },
  "studentProgress": {
    "improvingPercentage": 72,
    "supportPercentage": 14
  },
  "classPerformance": [
    {
      "class": "6",
      "average": 76
    },
    {
      "class": "7",
      "average": 72
    },
    {
      "class": "8",
      "average": 69
    }
  ]
}
```

---

# 65. UI/UX Requirements

Use the existing BeBrilliant design system:

- Modern enterprise UI
- White/light theme
- Full-width layout
- Tailwind CSS
- shadcn/ui
- Responsive tables
- Clear typography
- Compact KPI sections
- Accessible charts
- Minimal box-heavy design
- Strong visual hierarchy

The principal should understand the report within seconds.

---

# 66. Recommended Visual Hierarchy

Top:

```text
SCHOOL PERFORMANCE
```

Second:

```text
Students | Teachers | Exams
```

Third:

```text
Average Score | Pass Rate
```

Fourth:

```text
Improving | Needs Support
```

Then:

```text
Class Comparison
```

Then:

```text
Subject Performance
```

Then:

```text
Trends
Learning Gaps
Student Support
Exam Activity
```

---

# 67. Responsive Design

## Desktop

Show:

- Full KPI layout
- Class comparison chart
- Subject table
- Trend charts
- Learning gaps
- Support analytics

## Tablet

Use:

- Two-column KPI grid
- Horizontal tables
- Stacked charts

## Mobile

Use:

- Compact KPI cards
- Horizontal scrolling tables
- Accordion sections
- Compact charts
- Drill-down pages

The report must never require desktop-only interaction.

---

# 68. Export

Support:

- PDF
- Excel
- CSV
- Print

Export must contain:

```text
School Name
Campus
Academic Year
Report Period
Filters
Students
Teachers
Exam Activity
Average Score
Pass Rate
Improvement
Support
Class Comparison
Subject Summary
Learning Gaps
```

Exports must match active filters and published data.

---

# 69. Principal Print Layout

For printing, produce a management-friendly format:

```text
BE BRILLIANT
SCHOOL PERFORMANCE REPORT

School:
Academic Year:
Period:

Executive Summary
Academic Operations
Class Comparison
Subject Performance
Student Support
Learning Gaps
Trend

Generated:
```

Avoid unnecessary UI controls in print.

---

# 70. Audit Trail

Record:

- Report viewed
- Report exported
- Report printed
- Filter changes where required
- Drill-down access

Example:

```text
User: Principal
Report: School Performance
Academic Year: 2026-27
Period: Term 2
Action: Viewed
Timestamp: ...
```

---

# 71. Performance Optimization

For large schools:

- Indexed queries
- Aggregated metrics
- Materialized views where appropriate
- Background calculations
- Cached dashboard KPIs
- Incremental recalculation
- Server-side filtering
- Server-side pagination
- Lazy loading
- Precomputed class/subject metrics

Do not calculate the entire school's student/question dataset on every page request.

---

# 72. Recalculation Lifecycle

```text
Result Published
       ↓
Performance Engine
       ↓
Student Metrics
       ↓
Class Metrics
       ↓
Subject Metrics
       ↓
Chapter Metrics
       ↓
Topic Metrics
       ↓
School Metrics
       ↓
Improvement Engine
       ↓
Support Engine
       ↓
School Dashboard Refreshed
```

---

# 73. Incremental Recalculation

If one student's result changes:

```text
Student Result Changed
       ↓
Student Performance Recalculated
       ↓
Class Metrics Recalculated
       ↓
Subject Metrics Recalculated
       ↓
School Metrics Recalculated
```

Only affected aggregates should be recalculated where possible.

Do not perform unnecessary full-school recalculation.

---

# 74. School Report and Existing Reports

The School Performance Report must be the management-level aggregation layer over existing reports.

```text
School Report
     │
     ├── Class Reports
     │
     ├── Subject Reports
     │
     ├── Chapter Reports
     │
     ├── Topic Reports
     │
     ├── Student Reports
     │
     └── Teacher Reports
```

Do not duplicate their calculation logic.

---

# 75. Complete Drill-down Model

The principal should be able to start from:

```text
Average School Score = 71.4%
```

and drill into:

```text
School
 ↓
Class 11 = 65%
 ↓
Science = 61%
 ↓
Chemical Reactions = 54%
 ↓
Chemical Equations = 49%
 ↓
Students Below Mastery
 ↓
Individual Student Reports
```

This is one of the most important requirements of the module.

---

# 76. Management Insight Structure

The report should present data in the following order:

## School Health

- Students
- Teachers
- Average
- Pass Rate

## Academic Operations

- Exams
- Online
- OMR
- Subjective

## Student Progress

- Improving
- Stable
- Declining
- Support

## Class Comparison

- Class averages
- Pass rates
- Mastery

## Subject Performance

- Subject averages
- Weak subjects

## Learning Gaps

- Weak chapters
- Weak topics

## Operational Follow-up

- Pending results
- Pending evaluation
- Coverage gaps

---

# 77. No Overall School Score Unless Configured

Do not create an arbitrary:

```text
School Performance Score = 82/100
```

unless BeBrilliant has a formally configured school evaluation framework.

The default report should use transparent metrics:

```text
Average Score
Pass Rate
Mastery
Improvement
Support
Exam Activity
```

This keeps the report interpretable.

---

# 78. QA Test Matrix

## Student Count

- Active students
- Withdrawn students
- Transferred students
- Duplicate prevention
- Multiple campuses

## Teacher Count

- Active teachers
- Inactive teachers
- Multiple assignments
- Historical academic year

## Exams

- Draft
- Published
- Conducted
- Cancelled
- Online
- OMR
- Subjective

## Results

- Draft
- Finalized
- Published
- Corrected
- Re-evaluated

## Performance

- Different maximum marks
- Missing results
- Absent
- Exempted
- Not applicable

## Improvement

- No previous period
- Equal score
- Small improvement
- Significant improvement
- Decline

## Support

- Below threshold
- Multiple weak subjects
- Multiple weak topics
- Improving student
- Persistent weakness

## Security

- Cross-tenant access
- Cross-school access
- Unauthorized export
- Unauthorized student details

---

# 79. Acceptance Criteria

The School Performance Report is complete when:

- Principal can open one school-level report.
- Student count is accurate.
- Teacher count is accurate.
- Exams Conducted is accurate.
- Online Exams is accurate.
- OMR Exams is accurate.
- Subjective Papers is accurate.
- Average School Score is calculated by the official Performance Engine.
- Overall Pass Rate uses official pass rules.
- Students Improving uses configured comparison rules.
- Students Needing Support uses the official support/weak-area engine.
- Class comparison is available.
- Subject comparison is available.
- School performance trend is available.
- Student performance distribution is available.
- Learning gaps are available.
- Student support overview is available.
- Syllabus coverage can be integrated.
- Results use published/finalized data.
- Drill-down works from School → Class → Subject → Chapter → Topic → Student.
- Existing report engines are reused.
- Teacher Reports can be accessed from school-level teacher context.
- Multi-tenant security is enforced.
- Role permissions are enforced.
- Export matches active filters.
- Audit trail is maintained.
- Mobile/tablet/desktop layouts work.
- No duplicate calculation engines are introduced.

---

# 80. Implementation Phases

## Phase 1 — School Summary

Implement:

- Global filters
- Student count
- Teacher count
- Exam count
- Online exam count
- OMR count
- Subjective paper count
- Average score
- Pass rate

## Phase 2 — Student Progress

Implement:

- Improving students
- Stable students
- Declining students
- Students needing support
- Support classification

## Phase 3 — Class Comparison

Implement:

- Class average
- Pass rate
- Mastery
- Student count
- Exams
- Drill-down to Class Reports

## Phase 4 — Subject & Learning Gaps

Implement:

- Subject performance
- Weak subjects
- Weak chapters
- Weak topics
- Drill-down

## Phase 5 — Trends

Implement:

- School average trend
- Pass rate trend
- Improvement trend
- Support trend
- Class trends

## Phase 6 — Management Dashboard

Implement:

- Executive summary
- Academic operations
- Student support
- Learning gaps
- Syllabus coverage
- Pending work

## Phase 7 — Export & Audit

Implement:

- PDF
- Excel
- CSV
- Print
- Audit logging

## Phase 8 — Optimization

Implement:

- Performance snapshots
- Background jobs
- Incremental recalculation
- Caching
- Monitoring

---

# 81. Final School Performance Architecture

```text
                         BEBRILLIANT
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
 Student Master         Teacher Master          Exam Engine
       │                      │                      │
       │                Teacher Reports        Online / OMR
       │                                             │
       └──────────────────────┬──────────────────────┘
                              │
                       RESULT ENGINE
                              │
                       Published Results
                              │
                              ▼
                PERFORMANCE CALCULATION ENGINE
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
    Student                 Class                 Subject
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                     Chapter / Topic
                              │
                              ▼
                 WEAK AREA INTELLIGENCE
                              │
                     Student Support
                              │
                              ▼
                   SCHOOL AGGREGATION
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
  School Average         Pass Rate            Improvement
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                 SCHOOL PERFORMANCE REPORT
                              │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
   Principal             Management          Academic Team
```

---

# 82. Final Design Principle

The **School Performance Report must be the single management-level academic command view** of BeBrilliant.

It should summarize:

```text
SCHOOL
 ↓
STUDENTS
 ↓
TEACHERS
 ↓
EXAMS
 ↓
RESULTS
 ↓
PERFORMANCE
 ↓
CLASS COMPARISON
 ↓
SUBJECT PERFORMANCE
 ↓
LEARNING GAPS
 ↓
STUDENT SUPPORT
```

The principal should not need to open multiple reports to understand the school's overall academic position.

At the same time, every school-level metric must remain drill-down capable and traceable to its official source.

**One school report → complete academic visibility → direct drill-down into the exact class, subject, chapter, topic, or student requiring attention.**

The School Performance Report must therefore operate as the **management aggregation layer**, while the existing Student, Class, Subject, Chapter, Topic, Teacher, Result, Syllabus, and Performance engines remain the authoritative source systems.
