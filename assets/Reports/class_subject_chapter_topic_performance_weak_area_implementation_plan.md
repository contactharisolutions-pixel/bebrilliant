# BeBrilliant — Class, Subject, Chapter & Topic Wise Student Performance and Weak Area Reports
## Production-Grade Implementation Specification

**Document Type:** Master Implementation Plan  
**Product:** BeBrilliant School / Institute ERP & Examination Platform  
**Module:** Academic Performance Analytics & Weak Area Intelligence  
**Status:** Ready for Implementation  
**Primary Views:** Class → Subject → Chapter → Topic → Student  
**Reporting Scope:** Individual Student, Class, Section, Subject, Chapter, Topic  
**Architecture Principle:** Single source of truth through the central Performance Calculation Engine

---

# 1. Purpose

The purpose of this module is to provide a complete academic performance intelligence system that identifies:

- Class-wise student performance
- Subject-wise performance
- Chapter-wise performance
- Topic-wise performance
- Individual student strengths
- Individual student weak subjects
- Weak chapters
- Weak topics
- Class-level learning gaps
- Subject-level learning gaps
- Chapter-level learning gaps
- Topic-level learning gaps
- Performance trends over time
- Students requiring academic intervention
- High-performing students
- Improvement and deterioration areas

The system must allow an administrator, principal, academic coordinator, teacher, or authorized staff member to move from a high-level class report down to the exact topic where students are struggling.

Example drill-down:

```text
Class 10-A
    ↓
Subject: Mathematics
    ↓
Chapter: Quadratic Equations
    ↓
Topic: Factorisation Method
    ↓
Students performing below threshold
```

The system must not create a second marks/result calculation system. It must consume the official finalized/published data from BeBrilliant's existing examination, result, ranking, syllabus, question bank, and assessment engines.

---

# 2. Business Objective

The module should answer the following questions.

## Class Level

- How is the class performing overall?
- Which subjects are weak?
- Which subjects are strong?
- Which students need attention?
- Which chapters have learning gaps?
- Which topics have the highest failure/low-score rate?

## Subject Level

- How is Mathematics performing?
- Which classes are weak in Mathematics?
- Which chapters are weak?
- Which topics are weak?
- Which students need intervention?

## Chapter Level

- How are students performing in a specific chapter?
- Which topics inside the chapter are weak?
- Which students are below the expected level?
- Which question concepts caused difficulty?

## Topic Level

- Which students are weak in this topic?
- What is the class average?
- What is the mastery percentage?
- How many students are below threshold?
- Which assessments/questions tested this topic?

## Student Level

- Which subjects are weak?
- Which chapters are weak?
- Which topics are weak?
- What is improving?
- What is deteriorating?
- What should the student practice next?

---

# 3. Core Reporting Hierarchy

The complete academic performance hierarchy must be:

```text
Academic Year
    ↓
School / Institute
    ↓
Class
    ↓
Section
    ↓
Student
    ↓
Subject
    ↓
Chapter
    ↓
Topic
    ↓
Sub-topic / Learning Objective (Future Extension)
    ↓
Question / Assessment Item
```

The analytics engine must preserve these relationships.

---

# 4. Report Types

The module must provide the following reports.

## 4.1 Class-wise Performance Report

Shows overall performance of students within a class/section.

## 4.2 Subject-wise Performance Report

Shows performance by subject across classes, sections, and students.

## 4.3 Chapter-wise Performance Report

Shows performance by chapter within a selected subject.

## 4.4 Topic-wise Performance Report

Shows performance by topic within a selected chapter.

## 4.5 Student Subject Performance Report

Shows one student's performance across all subjects.

## 4.6 Student Chapter Performance Report

Shows one student's performance across chapters for a selected subject.

## 4.7 Student Topic Performance Report

Shows one student's performance across topics.

## 4.8 Weak Subject Report

Identifies subjects below configured performance/mastery thresholds.

## 4.9 Weak Chapter Report

Identifies chapters with low performance.

## 4.10 Weak Topic Report

Identifies topics with low mastery.

## 4.11 Class Learning Gap Report

Identifies common weak areas affecting a significant percentage of the class.

## 4.12 Student Intervention Report

Identifies students requiring academic intervention.

## 4.13 Performance Improvement Report

Identifies students/subjects/chapters/topics showing improvement.

## 4.14 Performance Deterioration Report

Identifies areas where performance has declined compared with the selected comparison period.

---

# 5. Global Filters

All reports should use a common filter framework.

Required filters:

- Academic Year
- School / Institute
- Class
- Section
- Student
- Subject
- Chapter
- Topic
- Exam / Assessment
- Exam Type
- Term
- Date Range
- Assessment Status
- Result Status

Optional filters:

- Teacher
- Subject Group
- Difficulty Level
- Question Type
- Learning Objective
- Online / Offline Assessment
- Attempt Status

The filter engine must dynamically enable/disable dependent filters.

Example:

```text
Class 10
    ↓
Subject Mathematics
    ↓
Chapter Quadratic Equations
    ↓
Topic Factorisation
```

Only applicable chapters and topics should be displayed.

---

# 6. Report Navigation

Recommended navigation:

```text
Academic Analytics
│
├── Overview
├── Class Performance
├── Subject Performance
├── Chapter Performance
├── Topic Performance
├── Student Performance
├── Weak Areas
│   ├── Weak Subjects
│   ├── Weak Chapters
│   └── Weak Topics
├── Learning Gaps
├── Improvement
└── Intervention Required
```

---

# 7. Class-wise Student Performance

## 7.1 Purpose

Provide an overall academic performance view for a selected class and section.

Example:

```text
Class: 10
Section: A
Academic Year: 2026-27
```

## 7.2 Summary KPIs

Display:

- Total Students
- Students Appeared
- Overall Average %
- Highest %
- Lowest %
- Pass %
- Failed Students
- Students Requiring Attention
- Strong Students
- Average Improvement
- Weak Subject Count
- Weak Chapter Count
- Weak Topic Count

## 7.3 Student Performance Table

Columns:

| Column | Description |
|---|---|
| Rank | Official rank |
| Student | Student name |
| Roll Number | Roll number |
| Overall % | Overall performance |
| Subjects Appeared | Count |
| Average % | Average percentage |
| Pass/Fail | Official status |
| Weak Subjects | Count |
| Weak Chapters | Count |
| Weak Topics | Count |
| Trend | Improving / Stable / Declining |
| Action | View |

Rank must come from the official ranking engine.

## 7.4 Student Drill-down

Clicking a student opens:

```text
Student Performance
    ↓
Subject Performance
    ↓
Chapter Performance
    ↓
Topic Performance
```

---

# 8. Subject-wise Student Performance

## 8.1 Purpose

Analyze performance of students in a selected subject.

Example:

```text
Class 10-A
Subject: Mathematics
```

## 8.2 KPIs

- Total Students
- Students Appeared
- Subject Average %
- Highest %
- Lowest %
- Pass %
- Fail %
- Mastery %
- Weak Students
- Strong Students
- Number of Chapters
- Number of Topics
- Improvement %

## 8.3 Student Table

| Rank | Student | Marks | % | Status | Weak Chapters | Weak Topics | Trend |
|---|---|---:|---:|---|---:|---:|---|

## 8.4 Subject Distribution

Display:

- 90–100%
- 80–89%
- 70–79%
- 60–69%
- 50–59%
- Below 50%

The ranges should be configurable.

---

# 9. Chapter-wise Performance

## 9.1 Purpose

Identify which chapters are strong or weak within a subject.

Example:

```text
Class 10-A
Subject: Mathematics

Chapter Performance

Real Numbers              78%
Polynomials               81%
Pair of Linear Equations  69%
Quadratic Equations       54%
Arithmetic Progressions   73%
```

## 9.2 Chapter KPI

Each chapter should show:

- Chapter Name
- Students Evaluated
- Average %
- Mastery %
- Highest %
- Lowest %
- Pass/Threshold %
- Students Below Threshold
- Students Mastered
- Attempt Count
- Assessment Count
- Trend
- Risk Level

## 9.3 Chapter Table

| Chapter | Avg % | Mastery % | Below Threshold | Mastered | Students | Trend | Status |
|---|---:|---:|---:|---:|---:|---|---|

## 9.4 Chapter Status

Use configurable academic status:

- Strong
- Good
- Moderate
- Needs Improvement
- Critical

Do not hard-code these thresholds.

---

# 10. Topic-wise Performance

## 10.1 Purpose

Provide the deepest academic performance analysis.

Example:

```text
Subject: Mathematics
Chapter: Quadratic Equations

Topic                         Mastery
Factorisation                 42%
Quadratic Formula             71%
Nature of Roots               58%
Graphical Interpretation      46%
Word Problems                 39%
```

## 10.2 Topic KPIs

Each topic should show:

- Topic Name
- Average %
- Mastery %
- Students Evaluated
- Students Mastered
- Students Below Threshold
- Highest %
- Lowest %
- Question Count
- Assessment Count
- Trend
- Risk Level

## 10.3 Topic Table

| Topic | Avg % | Mastery % | Below Threshold | Mastered | Questions | Students | Trend |
|---|---:|---:|---:|---:|---:|---:|---|

---

# 11. Weak Subject Report

## 11.1 Purpose

Identify subjects where students are performing below the configured academic threshold.

Example:

```text
Student: Rahul Sharma

Weak Subjects

Science       48%
Mathematics   52%
English       76%
Social Science 81%
```

## 11.2 Required Fields

- Student
- Subject
- Average %
- Mastery %
- Pass Status
- Weak Chapter Count
- Weak Topic Count
- Last Assessment %
- Previous Period %
- Change
- Intervention Status

---

# 12. Weak Chapter Report

Example:

```text
Student: Rahul Sharma
Subject: Mathematics

Weak Chapters

Quadratic Equations      43%
Statistics               48%
Coordinate Geometry      51%
```

Fields:

- Student
- Subject
- Chapter
- Average %
- Mastery %
- Attempted Assessments
- Below Threshold
- Trend
- Priority
- Recommended Action

---

# 13. Weak Topic Report

Example:

```text
Student: Rahul Sharma
Subject: Mathematics
Chapter: Quadratic Equations

Weak Topics

Factorisation Method       39%
Word Problems              41%
Graph Interpretation       45%
```

The report should provide the most actionable academic information.

---

# 14. Class Learning Gap Report

This is an important institutional report.

The system must identify areas where a significant portion of the class is weak.

Example:

```text
Class 10-A
Mathematics

Learning Gaps

1. Quadratic Equations
   Class Mastery: 54%

2. Factorisation Method
   Class Mastery: 42%

3. Word Problems
   Class Mastery: 39%
```

## 14.1 Required Metrics

- Number of students evaluated
- Number below threshold
- Number mastered
- Average score
- Mastery %
- Weak student %
- Question difficulty
- Assessment coverage
- Trend

---

# 15. Mastery Calculation

Mastery must be configurable.

Recommended default:

```text
Mastery Threshold = 60%
```

However, the value must be configurable by:

- School
- Academic Year
- Class
- Subject
- Assessment Type
- Curriculum
- Topic

The system must never hard-code 60%.

## Formula

```text
Mastery % =
Students Meeting Mastery Threshold
÷
Students Evaluated
× 100
```

---

# 16. Performance Calculation

For each student/topic:

```text
Topic Percentage =
Topic Obtained Marks
÷
Topic Maximum Marks
× 100
```

For multiple assessments, use the official configured aggregation method.

Possible aggregation modes:

- Weighted Average
- Simple Average
- Best Attempt
- Latest Attempt
- Highest Score
- Term Weighted
- Exam Pattern Weighted

The calculation must be controlled by the central Performance Calculation Engine.

---

# 17. Different Maximum Marks

The system must normalize performance to percentage.

Example:

```text
Assessment 1:
18 / 25 = 72%

Assessment 2:
42 / 50 = 84%

Assessment 3:
68 / 100 = 68%
```

Do not average raw marks when maximum marks differ unless the official aggregation rule explicitly requires it.

---

# 18. Missing Data Rules

Missing data must not automatically become zero.

Supported states:

- Appeared
- Absent
- Pending
- Not Evaluated
- Exempted
- Not Applicable
- Result Withheld
- Assessment Cancelled
- Not Conducted

These states must remain distinguishable in reports.

---

# 19. Weak Area Identification Engine

Create a centralized:

```text
Weak Area Intelligence Engine
```

Inputs:

- Student performance
- Class performance
- Subject performance
- Chapter performance
- Topic performance
- Mastery threshold
- Passing threshold
- Assessment history
- Trend
- Attempt count
- Question-level performance

Outputs:

```text
Weak Subject
Weak Chapter
Weak Topic
Learning Gap
Intervention Required
```

---

# 20. Weakness Classification

The engine should support configurable rules.

Example:

```text
Critical:
Performance < 40%

Needs Improvement:
40%–59%

Developing:
60%–74%

Strong:
75%+
```

These are example defaults only. Schools must be able to configure their own thresholds.

---

# 21. Risk Score

Create a configurable academic risk score.

Example inputs:

- Current performance
- Mastery %
- Performance trend
- Number of weak topics
- Number of failed assessments
- Recent deterioration
- Assessment participation
- Topic coverage

Example conceptual score:

```text
Risk Score =
Performance Risk
+
Trend Risk
+
Weak Area Risk
+
Assessment Risk
```

The actual weights must be configurable.

The system must explain why a student/topic has been flagged.

Example:

```text
High Attention

Reasons:
• Topic mastery below 40%
• Performance declined 14 percentage points
• 3 of last 4 assessments below threshold
```

Do not show unexplained AI-generated labels.

---

# 22. Strong Area Identification

The same engine should identify strengths.

Examples:

```text
Strong Subject
Strong Chapter
Strong Topic
Consistent Improvement
High Mastery
```

This prevents the report from becoming only a weakness report.

---

# 23. Performance Trend

Trend comparison should support:

- Previous exam
- Previous term
- Previous month
- Previous academic period
- Custom date range

Example:

```text
Current: 68%
Previous: 59%

Improvement:
+9 percentage points
```

Always show the comparison period.

Do not describe a change as improvement/deterioration without identifying the comparison baseline.

---

# 24. Chapter Trend

Example:

```text
Quadratic Equations

Term 1: 48%
Term 2: 56%
Term 3: 68%
```

Display:

- Current %
- Previous %
- Change
- Direction
- Number of assessments

---

# 25. Topic Trend

Example:

```text
Factorisation

Assessment 1: 42%
Assessment 2: 51%
Assessment 3: 63%
```

Provide:

- Score trend
- Mastery trend
- Attempt trend
- Question accuracy trend

---

# 26. Question-Level Integration

Topic analytics must be linked to the Question Bank.

Each question should have:

- Subject
- Chapter
- Topic
- Difficulty
- Question Type
- Marks
- Learning Objective
- Syllabus Mapping

Example:

```text
Question
   ↓
Topic
   ↓
Chapter
   ↓
Subject
   ↓
Syllabus
```

This allows the system to answer:

```text
Which questions are students getting wrong?
Which topics do those questions belong to?
Which chapters are affected?
```

---

# 27. Question Accuracy Analytics

For each question:

```text
Question Accuracy =
Correct Responses
÷
Valid Attempts
× 100
```

The system should identify:

- Very Low Accuracy
- Low Accuracy
- Moderate Accuracy
- High Accuracy

Difficulty and accuracy must not be treated as the same thing.

---

# 28. Difficulty-Aware Analytics

The report should optionally break performance by:

- Easy
- Medium
- Hard

Example:

```text
Quadratic Equations

Easy     82%
Medium   64%
Hard     38%
```

This helps distinguish:

```text
Concept Weakness
vs
Advanced Application Difficulty
```

---

# 29. Student Intervention Report

The system should generate an intervention queue.

Columns:

| Student | Class | Subject | Chapter | Topic | Score | Mastery | Risk | Reason | Action |
|---|---|---|---|---|---:|---:|---|---|---|

Recommended actions:

- Assign Practice
- Assign Revision
- Assign Chapter Test
- Assign Topic Test
- Teacher Review
- Parent Communication
- Remedial Class
- One-to-One Support

Actions must be configurable.

---

# 30. Remedial Learning Integration

Weak areas should integrate with the learning system.

Example:

```text
Weak Topic Detected
       ↓
Recommended Practice
       ↓
Question Bank Filter
       ↓
Topic-specific Questions
       ↓
Practice Assessment
       ↓
Reassessment
       ↓
Mastery Updated
```

The recommendation engine should be able to use:

- Subject
- Chapter
- Topic
- Difficulty
- Question Type
- Student level
- Previous mistakes

---

# 31. AI Integration

AI may be used to generate explanations and recommendations, but AI must not replace official score calculations.

Allowed AI features:

- Explain weak topic
- Generate revision suggestions
- Generate practice questions
- Generate remedial worksheet
- Suggest learning resources
- Summarize class learning gaps
- Generate teacher intervention suggestions
- Generate parent-friendly academic summary

Official calculations must remain deterministic.

---

# 32. Principal / Academic Coordinator Dashboard

Dashboard should show:

```text
Academic Performance Overview

Overall Average
Pass %
Mastery %
Students At Risk
Weak Subjects
Weak Chapters
Weak Topics
Improving Students
Declining Students
```

Then:

```text
Class Comparison
Subject Comparison
Chapter Learning Gaps
Topic Learning Gaps
Intervention Queue
```

---

# 33. Teacher Dashboard

Teacher should see only authorized academic data.

Example:

```text
My Classes
    ↓
Class 10-A
    ↓
Mathematics
    ↓
Weak Chapters
    ↓
Weak Topics
    ↓
Students
```

Teacher actions:

- View student performance
- Identify weak topics
- Assign practice
- Create remedial assessment
- Add teacher remarks
- Track improvement

---

# 34. Student Dashboard

Student view should be simpler.

Show:

```text
My Performance

Overall Performance
Subject Performance
Strong Subjects
Subjects to Improve

Chapter Performance
Topic Performance

My Strengths
My Weak Areas
Recommended Practice
Improvement Trend
```

Avoid exposing internal risk scoring terminology if it is not appropriate for students.

---

# 35. Parent Dashboard

Parent view should focus on actionable information.

Show:

- Overall performance
- Subject performance
- Weak subjects
- Weak chapters
- Weak topics
- Improvement
- Recommended practice
- Teacher remarks

Avoid unnecessarily exposing comparative rankings unless school policy permits it.

---

# 36. Drill-down Architecture

Every report must support contextual drill-down.

Example:

```text
Class Performance
       ↓
Subject Performance
       ↓
Chapter Performance
       ↓
Topic Performance
       ↓
Student List
       ↓
Student Performance
       ↓
Question Analysis
```

Filters must be preserved during navigation.

Example:

```text
Class = 10-A
Subject = Mathematics
Chapter = Quadratic Equations
```

When opening Topic Report, those filters remain active.

---

# 37. Central Performance Calculation Engine

Create or extend:

```text
Performance Calculation Engine
```

Responsibilities:

- Marks normalization
- Percentage calculation
- Result aggregation
- Passing calculation
- Ranking integration
- Subject aggregation
- Chapter aggregation
- Topic aggregation
- Trend calculation
- Mastery calculation
- Weak area calculation
- Strength calculation

All report modules must consume this service.

Do not duplicate formulas in frontend components.

---

# 38. Data Architecture

Recommended logical entities:

```text
academic_years
classes
sections
students
subjects
chapters
topics
syllabus_mappings
assessments
assessment_questions
questions
question_syllabus_mappings
student_assessment_attempts
student_question_responses
student_marks
published_results
performance_snapshots
performance_metrics
mastery_metrics
weak_area_metrics
intervention_records
teacher_remarks
```

Use existing project tables where available instead of creating duplicates.

---

# 39. Performance Snapshot

For high-performance reporting, consider maintaining calculated snapshots.

Example:

```text
performance_snapshots

tenant_id
academic_year_id
class_id
section_id
student_id
subject_id
chapter_id
topic_id
assessment_id
score
percentage
mastery_status
performance_status
calculated_at
source_result_version
```

Snapshots must be regenerated when official result data changes.

---

# 40. Result Versioning

Performance reports must be linked to the official result version.

Example:

```text
Result Version 12
    ↓
Performance Snapshot Version 12
```

If a result is re-evaluated:

```text
Result Updated
    ↓
Performance Recalculation
    ↓
Affected Snapshots Invalidated
    ↓
New Metrics Generated
```

This prevents stale analytics.

---

# 41. Published Result Rule

Official analytics must use finalized/published results only.

Draft results may be displayed only in explicitly authorized preview reports.

Rules:

```text
Draft
    → excluded from official analytics

Finalized
    → eligible

Published
    → official analytics
```

---

# 42. Multi-Tenant Security

Every query must enforce:

```text
tenant_id
school_id
academic_year_id
```

and applicable:

```text
role permissions
class permissions
section permissions
subject permissions
```

Server-side authorization is mandatory.

Never rely only on frontend hiding.

---

# 43. Role Permissions

Suggested permissions:

```text
analytics.view
analytics.class.view
analytics.subject.view
analytics.chapter.view
analytics.topic.view
analytics.student.view
analytics.weak_area.view
analytics.intervention.view
analytics.export
analytics.print
analytics.configure_thresholds
```

Example:

### Owner / Super Admin

Full access.

### Principal

School-wide academic analytics.

### Academic Coordinator

Academic analytics and intervention management.

### Teacher

Assigned classes/subjects only.

### Student

Own performance only.

### Parent

Authorized child performance only.

---

# 44. API Architecture

Recommended APIs:

```http
GET /api/analytics/class-performance
GET /api/analytics/subject-performance
GET /api/analytics/chapter-performance
GET /api/analytics/topic-performance
GET /api/analytics/student-performance

GET /api/analytics/weak-subjects
GET /api/analytics/weak-chapters
GET /api/analytics/weak-topics
GET /api/analytics/learning-gaps
GET /api/analytics/interventions

GET /api/analytics/trends
GET /api/analytics/question-accuracy

POST /api/analytics/recalculate
POST /api/analytics/intervention
```

Use existing API conventions if already established in BeBrilliant.

---

# 45. API Response Example

```json
{
  "class": "10-A",
  "subject": "Mathematics",
  "chapter": "Quadratic Equations",
  "topic": "Factorisation",
  "studentsEvaluated": 42,
  "averagePercentage": 48.6,
  "masteryPercentage": 38.1,
  "studentsBelowThreshold": 26,
  "studentsMastered": 16,
  "trend": {
    "previousPercentage": 55.4,
    "changePercentagePoints": -6.8
  }
}
```

---

# 46. Frontend UI Architecture

Use:

- Tailwind CSS
- shadcn/ui
- Responsive data tables
- Tabs
- Filter bar
- Search
- Charts
- Progress bars
- Drill-down drawers/pages
- Tooltips
- Empty states
- Loading skeletons
- Export controls

Do not create heavy card-within-card interfaces.

Prefer:

```text
Page Header
Filter Bar
KPI Strip
Visualization
Data Table
Drill-down
```

---

# 47. Recommended Visualizations

Use visualizations where they improve understanding.

## Class

- Performance distribution
- Subject comparison
- Student ranking distribution
- Improvement trend

## Subject

- Class comparison
- Student distribution
- Trend

## Chapter

- Chapter comparison
- Mastery distribution
- Weak chapter ranking

## Topic

- Topic mastery bars
- Accuracy distribution
- Trend
- Difficulty analysis

Avoid charts where a simple table is more precise.

---

# 48. Color Semantics

Use consistent academic status semantics.

Example:

```text
Strong           → positive semantic
Good             → positive/neutral
Needs Improvement → warning semantic
Critical         → attention semantic
```

Do not rely on color alone.

Always provide:

- Text label
- Icon where appropriate
- Accessible contrast
- Tooltip/context

---

# 49. Responsive Design

Must support:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop:

```text
Filters
KPIs
Charts
Full Table
```

Mobile:

```text
Filters
KPIs
Compact charts
Scrollable table
Student cards
Drill-down pages
```

Tables must not break the layout.

---

# 50. Export

Every major report should support:

- PDF
- Excel
- CSV
- Print

Exports must contain:

- Report title
- School name
- Academic year
- Filters
- Generated date/time
- Data period
- Official result status
- Report data

Exported data must exactly match the active filters.

---

# 51. Report Audit Trail

Record:

- User
- Role
- Report type
- Filters
- Date/time
- Export type
- Data version

For recalculation:

- Triggered by
- Reason
- Result version
- Records affected
- Completion status
- Error details

---

# 52. Performance Optimization

Large schools may have:

```text
10,000+ students
100+ subjects/courses
1,000+ chapters
10,000+ topics
Millions of question responses
```

The analytics system should therefore use:

- Indexed queries
- Aggregation tables
- Materialized views where appropriate
- Cached summaries
- Background recalculation
- Pagination
- Lazy loading
- Server-side filtering
- Server-side sorting
- Query batching
- Incremental recalculation

Never load the complete student/question dataset into the browser.

---

# 53. Recalculation Strategy

When a result is published:

```text
Result Published
      ↓
Performance Calculation Job
      ↓
Subject Metrics
      ↓
Chapter Metrics
      ↓
Topic Metrics
      ↓
Mastery Metrics
      ↓
Weak Area Detection
      ↓
Intervention Queue
      ↓
Dashboards Updated
```

When only one question is corrected:

```text
Question Result Corrected
      ↓
Identify affected students
      ↓
Identify affected topic
      ↓
Identify affected chapter
      ↓
Identify affected subject
      ↓
Recalculate only affected aggregates
```

Avoid full-school recalculation when unnecessary.

---

# 54. Background Job Architecture

Recommended jobs:

```text
calculate_student_performance
calculate_subject_performance
calculate_chapter_performance
calculate_topic_performance
calculate_mastery
detect_weak_areas
calculate_trends
refresh_dashboard_metrics
generate_report_export
```

Use the existing background job/queue architecture where available.

---

# 55. Notification Integration

Optional notifications:

### Teacher

```text
12 students are below mastery in Quadratic Equations.
```

### Academic Coordinator

```text
Mathematics Class 10-A has 3 critical learning gaps.
```

### Parent

```text
Your child needs additional practice in Mathematics — Quadratic Equations.
```

### Student

```text
You have improved by 12 percentage points in Mathematics.
```

Notifications must respect school configuration and privacy rules.

---

# 56. Intervention Workflow

```text
Weak Area Detected
      ↓
Validate Threshold
      ↓
Create Intervention Recommendation
      ↓
Teacher Review
      ↓
Assign Practice / Remedial Activity
      ↓
Student Completes Activity
      ↓
Reassessment
      ↓
Performance Recalculated
      ↓
Weak Area Status Updated
```

Statuses:

```text
Detected
Reviewed
Assigned
In Progress
Improved
Resolved
Monitoring
```

---

# 57. Weak Area Resolution

A weak area should not disappear merely because one assessment is good.

Use configurable resolution criteria.

Example:

```text
Topic is considered improved when:

Latest mastery >= configured threshold
AND
minimum required assessments completed
AND
performance remains above threshold
```

The school should configure these rules.

---

# 58. Academic Analytics Lifecycle

```text
Syllabus Created
       ↓
Subject
       ↓
Chapter
       ↓
Topic
       ↓
Questions Mapped
       ↓
Assessment Created
       ↓
Students Attempt
       ↓
Responses Evaluated
       ↓
Result Finalized
       ↓
Result Published
       ↓
Performance Engine
       ↓
Subject Metrics
       ↓
Chapter Metrics
       ↓
Topic Metrics
       ↓
Mastery Analysis
       ↓
Weak Area Detection
       ↓
Intervention
       ↓
Practice
       ↓
Reassessment
       ↓
Performance Improvement
```

---

# 59. Integration With Existing BeBrilliant Modules

This module must integrate deeply with:

```text
Syllabus Engine
AI Syllabus Mapping
Question Bank
AI Question Generation Engine
Paper Pattern Engine
Online Exam Engine
OMR Engine
Offline Paper Generator
Result Engine
Ranking Engine
Student Management
Class & Section Management
Teacher Management
Learning Management
Assignment Engine
Notification Engine
Report Engine
```

No duplicate master data should be created.

---

# 60. Source-of-Truth Rules

## Student

Student Master.

## Class

Class Master.

## Section

Section Master.

## Subject

Subject Master.

## Chapter

Syllabus Engine.

## Topic

Syllabus Engine.

## Question

Question Bank.

## Assessment

Exam / Assessment Engine.

## Marks

Official Result Engine.

## Rank

Official Ranking Engine.

## Pass/Fail

Official configured result rules.

## Performance

Central Performance Calculation Engine.

---

# 61. Data Integrity Rules

1. Never calculate from unpublished results for official reports.
2. Never treat absent as zero.
3. Never treat missing marks as zero.
4. Never duplicate student master data.
5. Never duplicate subject master data.
6. Never duplicate chapter/topic master data.
7. Never hard-code passing thresholds.
8. Never hard-code mastery thresholds.
9. Never hard-code grade thresholds.
10. Always use normalized percentages where maximum marks differ.
11. Always preserve assessment status.
12. Always maintain tenant isolation.
13. Always apply server-side permissions.
14. Always retain result version.
15. Always maintain auditability.

---

# 62. Search and Filtering

All report tables should support:

- Student search
- Roll number search
- Subject search
- Chapter search
- Topic search
- Status filtering
- Score filtering
- Mastery filtering
- Trend filtering

Example:

```text
Show students:

Class = 10-A
Subject = Mathematics
Chapter = Quadratic Equations
Mastery < 50%
```

---

# 63. Advanced Filters

Future-ready filters:

```text
Performance < X
Mastery < X
Improvement > X
Decline > X
Attempts < X
Question Accuracy < X
Difficulty = Hard
Topic = Selected
```

---

# 64. Report Scheduling

Future extension:

Allow authorized users to schedule:

- Weekly class performance
- Monthly subject report
- Monthly weak area report
- Term performance report
- Student intervention report

Delivery:

- Email
- In-app notification
- WhatsApp where configured
- Downloadable PDF

---

# 65. AI Academic Summary

AI may summarize already-calculated metrics.

Example:

```text
Class 10-A Mathematics shows an overall average of 68%.
The strongest chapter is Polynomials at 81%.
The weakest chapter is Quadratic Equations at 54%.
The weakest topic is Word Problems at 39%.
26 of 42 students are below the configured mastery threshold.
```

AI must use actual calculated metrics and must not invent values.

---

# 66. AI Recommendation Rules

Recommendations must be grounded in actual data.

Example:

```text
If:
Topic mastery < threshold

Then:
Recommend topic-specific practice.
```

```text
If:
Chapter average < threshold
AND
multiple topics are weak

Then:
Recommend chapter-level remedial activity.
```

```text
If:
Student performance declines across multiple assessments

Then:
Flag for teacher review.
```

---

# 67. Privacy

Student performance data is sensitive educational information.

Rules:

- Students see only their own data.
- Parents see only authorized children.
- Teachers see only permitted students/classes.
- Staff access follows role permissions.
- Exports require permission.
- Audit logs must record sensitive report access.
- Public users must never access student performance data.

---

# 68. QA Test Matrix

Test:

### Class

- Multiple sections
- Empty class
- Students with no results
- Mixed assessment states

### Subject

- Multiple subjects
- Different maximum marks
- Subject not applicable

### Chapter

- Multiple chapters
- Chapter with no questions
- Chapter with partial mapping

### Topic

- Multiple topics
- Topic with insufficient attempts
- Topic with no published result

### Student

- New student
- Transferred student
- Withdrawn student
- Multiple academic years

### Result

- Re-evaluation
- Corrected marks
- Published result
- Unpublished result
- Cancelled assessment

### Security

- Cross-tenant access
- Unauthorized class
- Unauthorized subject
- Unauthorized export

---

# 69. Acceptance Criteria

The module is complete when:

- Class performance is available.
- Subject performance is available.
- Chapter performance is available.
- Topic performance is available.
- Student drill-down works.
- Weak subjects are detected.
- Weak chapters are detected.
- Weak topics are detected.
- Class learning gaps are identified.
- Mastery is configurable.
- Passing rules use official configuration.
- Missing/absent states are preserved.
- Published-result rules are enforced.
- Ranking uses the official ranking engine.
- Performance calculations use one central engine.
- Drill-down filters are preserved.
- Exports match active filters.
- Role permissions are enforced.
- Multi-tenant isolation is verified.
- Recalculation works after result changes.
- Mobile/tablet/desktop layouts work.
- Audit logs are available.
- No duplicate master data is introduced.

---

# 70. Recommended Implementation Phases

## Phase 1 — Foundation

- Verify existing syllabus hierarchy
- Verify result engine
- Verify question mapping
- Verify assessment mapping
- Define performance data contracts
- Create analytics service architecture

## Phase 2 — Core Performance

Implement:

- Student performance
- Subject performance
- Chapter performance
- Topic performance

## Phase 3 — Weak Area Intelligence

Implement:

- Weak subject detection
- Weak chapter detection
- Weak topic detection
- Mastery engine
- Risk/attention rules
- Learning gap report

## Phase 4 — Dashboards

Implement:

- Principal dashboard
- Coordinator dashboard
- Teacher dashboard
- Student dashboard
- Parent dashboard

## Phase 5 — Intervention

Implement:

- Intervention queue
- Practice assignment
- Remedial workflow
- Reassessment
- Resolution tracking

## Phase 6 — Advanced Analytics

Implement:

- Question accuracy
- Difficulty analysis
- Trend analysis
- Learning gap analytics
- AI academic summaries
- AI recommendations

## Phase 7 — Export & Automation

Implement:

- PDF
- Excel
- CSV
- Print
- Scheduled reports
- Notifications

## Phase 8 — Optimization

Implement:

- Aggregated snapshots
- Background jobs
- Incremental recalculation
- Caching
- Performance monitoring

---

# 71. Recommended UI Screen Structure

## Screen 1 — Academic Analytics Overview

```text
Academic Analytics

[Academic Year] [Class] [Section] [Subject] [Date Range]

Overall Average
Pass %
Mastery %
Students Requiring Attention

Subject Performance
Class Performance
Weak Areas
Learning Gaps
Trend
```

## Screen 2 — Class Performance

```text
Class Performance

Filters

KPIs

Student Performance Table

[View Student]
```

## Screen 3 — Subject Performance

```text
Subject Performance

Subject Summary

Student Distribution

Chapter Performance

[View Chapter]
```

## Screen 4 — Chapter Performance

```text
Chapter Performance

Chapter Summary

Topic Performance

Student Performance

[View Topic]
```

## Screen 5 — Topic Performance

```text
Topic Performance

Topic Summary

Student Mastery

Question Accuracy

Difficulty Analysis

Student List
```

## Screen 6 — Weak Areas

```text
Weak Areas

Weak Subjects
Weak Chapters
Weak Topics

[Assign Intervention]
```

---

# 72. Final Architecture

The final system should operate as:

```text
                    BEBRILLIANT
                         │
                ┌────────┴────────┐
                │                 │
          Syllabus Engine      Exam Engine
                │                 │
        Subject/Chapter/Topic   Assessment
                │                 │
                └────────┬────────┘
                         │
                  Result Engine
                         │
                Published Results
                         │
                         ▼
          PERFORMANCE CALCULATION ENGINE
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
    Student           Subject           Class
       │                 │                 │
       └────────────┬────┴────┬───────────┘
                    │         │
                 Chapter     Topic
                    │         │
                    └────┬────┘
                         │
                         ▼
             WEAK AREA INTELLIGENCE
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Weak Subject   Weak Chapter   Weak Topic
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                INTERVENTION ENGINE
                         │
                Practice / Remedial
                         │
                         ▼
                    Reassessment
                         │
                         ▼
                Performance Updated
```

---

# 73. Critical Implementation Principle

**Do not build this as separate report modules with separate calculations.**

Build one centralized academic analytics architecture:

```text
Official Result
      ↓
Performance Calculation Engine
      ↓
Normalized Performance Data
      ↓
Subject → Chapter → Topic Aggregation
      ↓
Mastery & Weak Area Intelligence
      ↓
Role-specific Reports
      ↓
Intervention
      ↓
Reassessment
```

This architecture ensures that the same student performance value is used consistently across:

- Student Report
- Class Report
- Subject Report
- Chapter Report
- Topic Report
- Weak Subject Report
- Weak Chapter Report
- Weak Topic Report
- Principal Dashboard
- Teacher Dashboard
- Parent Dashboard
- Student Dashboard
- AI Recommendations

The **Performance Calculation Engine is the single source of truth** for academic analytics.
