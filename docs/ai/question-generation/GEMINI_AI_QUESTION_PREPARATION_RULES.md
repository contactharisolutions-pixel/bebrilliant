# Gemini AI Question Preparation Agent — MASTER RULES

## 1. Purpose

These rules govern the Gemini AI Question Preparation Agent used by the BeBrilliant Online Exam Platform.

The agent is responsible for generating, transforming, validating, classifying, and preparing examination questions while preserving academic correctness and preventing repetitive question experiences.

## 2. Non-Repetition / Fresh Question Rule — MANDATORY

### Golden Rule

**Every time a new question set is requested, the system must generate fresh questions OR materially change the appearance/structure of existing questions.**

The agent must never blindly return the same question wording, same option order, same numerical values, same scenario, or same presentation when a fresh question set is requested.

### Freshness Priority

1. Generate a genuinely new question from the same learning objective.
2. If reuse is necessary, create a materially different question variant.
3. If a question variant is generated, change one or more meaningful dimensions:
   - wording
   - scenario/context
   - numerical values
   - entities/names
   - data/table
   - diagram
   - option order
   - distractors
   - question framing
   - sequence of information
   - case-study context
4. Never treat cosmetic punctuation changes alone as a new question.

### Appearance Change

When the platform intentionally reuses an approved question, the displayed appearance must be changed where academically safe, such as:
- option order
- question presentation
- numerical values
- scenario
- data representation
- ordering of sub-parts

The correct answer must remain mathematically/academically correct after transformation.

## 3. Reuse Prohibition

Do not reuse an existing question merely because it is relevant.

Before selecting an existing question:
- check exact text similarity
- check normalized similarity
- check semantic similarity
- check structural similarity
- check answer-pattern similarity
- check numerical/template similarity

A question that is substantially the same should be rejected from a fresh-question request.

## 4. Question Fingerprinting

Every question should have a fingerprint/signature based on:
- normalized question text
- question type
- topic
- concept
- answer structure
- numerical/template structure where applicable

Maintain:
- question fingerprint
- source question ID
- variant group ID
- generation batch ID

This enables the system to prevent accidental repetition across exams.

## 5. Variant Groups

Questions derived from the same underlying concept may belong to a `variant_group_id`.

Rules:
- A fresh exam should avoid selecting multiple near-identical variants from the same group unless explicitly configured.
- A regenerated question should receive a new version/variant identifier.
- Variant generation must preserve the intended learning outcome.

## 6. Exam-Level Freshness

For every newly generated exam:
- do not automatically select the previous exam's questions
- compare against the student's recent question history when adaptive/repeat prevention is enabled
- prevent duplicate questions within the same paper
- prevent near-duplicate questions within the same paper
- vary question framing where possible

## 7. Student-Level Freshness

If the same student requests another practice test:
- avoid recently attempted questions
- avoid near-duplicate variants where configured
- generate alternative questions from the same weak topic
- preserve the requested difficulty and learning objective

The freshness window must be configurable by Owner.

## 8. Difficulty Preservation

A transformed question must remain at approximately the requested difficulty.

Do not make a question easier or harder unintentionally through:
- obvious distractors
- excessive wording
- altered numbers
- changed context
- changed answer options

## 9. Answer Integrity

After every transformation:
1. Recalculate/reason through the answer.
2. Validate all options.
3. Confirm exactly one correct answer for single-answer MCQs.
4. Confirm multiple correct answers only for configured multiple-select types.
5. Regenerate if the transformation invalidates the answer.

## 10. Numerical Variation

For numerical questions, fresh variants should preferably use new valid values.

Rules:
- values must satisfy all constraints
- answer must be recalculated
- units must remain correct
- rounding must be validated
- correct answer must appear among options when MCQ
- distractors should reflect realistic calculation errors

Do not simply change numbers if doing so creates an invalid or trivial problem.

## 11. MCQ Appearance Variation

For fresh appearances, vary safely:
- option order
- distractors
- scenario
- wording
- values

Never rely only on option shuffling when a materially new question is required.

## 12. Question-Type Variation

When the exam blueprint permits, vary formats across questions:
- MCQ
- assertion/reason
- case study
- numerical
- application
- competency based
- short answer
- data interpretation
- match the following

Do not violate the configured paper pattern.

## 13. Syllabus Preservation

Freshness must never break:
- board/curriculum alignment
- class/grade
- subject
- chapter
- topic
- sub-topic
- learning outcome

A new question should test the intended concept, not merely use different words.

## 14. Academic Accuracy

Every generated or transformed question must be checked for:
- factual correctness
- mathematical correctness
- scientific correctness
- grammatical correctness
- unambiguous wording
- age appropriateness
- curriculum relevance

If confidence is insufficient, flag the question for human review.

## 15. Human Approval

Recommended lifecycle:

`AI_GENERATED → AI_VALIDATED → PENDING_REVIEW → APPROVED → PUBLISHED`

AI must not silently overwrite an approved/published question.

## 16. Regeneration Commands

Support:
- Generate New Question
- Generate Fresh Set
- Create Variant
- Change Scenario
- Change Numbers
- Change Options
- Change Question Type
- Make Easier
- Make Difficult
- Create HOTS Version
- Regenerate Explanation

`Generate New Question` must create a new question rather than return the original.

## 17. Duplicate Detection Thresholds

Use configurable thresholds for:
- exact duplicate
- lexical similarity
- semantic similarity
- structural similarity

Recommended behavior:
- exact duplicate → reject
- highly similar → regenerate or flag
- moderate similarity → allow only if the learning objective requires it and the question is materially different
- low similarity → allow

Thresholds must be configurable by Owner.

## 18. Question Bank Metadata

Store at minimum:

```text
question_id
tenant_id
subject_id
class_id
chapter_id
topic_id
learning_outcome
question_type
difficulty
bloom_level
question_text
options
correct_answer
explanation
source_type
fingerprint
variant_group_id
generation_batch_id
version
status
created_by
created_at
```

## 19. Auditability

Record:
- original question ID when creating a variant
- AI model
- generation request
- prompt/version
- transformation type
- validation result
- reviewer
- approval timestamp

## 20. Tenant Isolation

Freshness checks must respect tenant permissions while allowing Owner-level global controls.

A tenant must not access another tenant's private question bank.

## 21. Anti-Fraud / Exam Integrity

Where applicable:
- rotate question order
- rotate option order
- use fresh numerical values
- use question variants
- randomize question selection
- avoid predictable answer sequences

Do not compromise the exam blueprint.

## 22. Final Freshness Gate

Before publishing a fresh question set, run:

`Generate → Normalize → Fingerprint → Duplicate Check → Semantic Check → Variant Check → Answer Validation → Difficulty Check → Syllabus Check → Final Freshness Gate`

If the freshness gate fails:
**do not publish the question; regenerate it.**

## 23. Absolute Rule

> **A request for a new question means a new academic question or a materially different, validated variant. The agent must never simply repeat an old question as if it were new.**


## 24. Easy, Simple and Clean English — MANDATORY

All English questions intended for Indian school-level students must use **easy, simple, clear, and natural English**.

### Language Principles

- Use short and direct sentences.
- Use familiar school-level words.
- Ask one clear thing at a time.
- Prefer common English over advanced vocabulary.
- Avoid unnecessary academic jargon.
- Avoid complicated sentence structures.
- Avoid long introductory passages unless required by the question type.
- Use standard Indian school examination terminology.
- Keep instructions short and clear.
- Use correct grammar and punctuation.

### Example

Avoid:

> Which of the following statements most accurately elucidates the fundamental principle underlying the process of photosynthesis?

Prefer:

> Which statement correctly explains how plants make their food?

### Vocabulary Rule

If a difficult word is academically necessary, use it only when:
- it is part of the prescribed syllabus, or
- it is essential to test the intended concept.

Otherwise, replace it with simpler wording.

### Class-Level Rule

The English level must match the student's class/grade.

- Primary classes → very simple vocabulary and short sentences.
- Middle school → simple vocabulary with moderate sentence length.
- Secondary school → clear school-level English; subject terminology may be used where required.
- Higher secondary → standard academic English, but still avoid unnecessary complexity.

### Translation-Friendly English

Questions should also be easy to translate into Indian languages without changing their meaning.

Avoid idioms, slang, cultural expressions, wordplay, and unnecessarily complex phrasing.

### Clarity Test

Before finalizing a question, ask:

1. Can a student understand what is being asked on the first reading?
2. Is there only one clear interpretation?
3. Are the important words familiar for the student's class?
4. Is the sentence unnecessarily long?
5. Can any word be replaced with a simpler word without losing academic meaning?

If the answer to any of these indicates a problem, rewrite the question.

## 25. Student-Friendly Question Presentation

Question text should be visually and linguistically easy to read.

Prefer:

> What is 25 × 4?

Over:

> Calculate the product obtained when twenty-five is multiplied by four.

Prefer:

> Why do plants need sunlight?

Over:

> Explain the significance of solar energy in the physiological process of plants.

The question must remain academically meaningful while being easy for the intended student to understand.

## 26. No Unnecessary Complexity

Do not make a question difficult merely because its English is difficult.

Difficulty should come from:
- the concept
- reasoning
- application
- calculation
- analysis

—not from unnecessarily complicated language.

## 27. Final Language Gate

Before publishing, run:

`Generate → Class-Level Language Check → Simplicity Check → Clarity Check → Grammar Check → Academic Accuracy Check`

If the question is academically correct but linguistically too complex for the selected class, rewrite it before publication.
