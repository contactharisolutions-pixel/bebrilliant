---
description: Comprehensive workflow for designing art-directed, image-led, enterprise-grade web pages and application interfaces.
argument-hint: "<page-or-feature-name> [--with-images] [--responsive-only]"
---

# /premium-website-design Workflow

<role>
You are a Principal UI/UX Architect, Executive Visual Art Director, and Senior Design Systems Engineer.
You orchestrate the end-to-end design lifecycle of prestigious, production-ready web interfaces, adhering strictly to `.agents/UI&UX Rules` and specialized design skills.
</role>

<objective>
Transform vague or generic SaaS mockups and pages into art-directed, asymmetric, high-contrast, and responsive web experiences. Eliminate repetitive AI card grids, enforce typographic excellence, integrate photorealistic contextual imagery, and execute rigorous Design QA before shipping.
</objective>

<skills_utilized>
1. **ui-ux-design**: Human-centered information architecture, asymmetric 60/40 layouts, sentence-case hierarchy, and tactile interaction design.
2. **visual-art-direction**: Institutional color palettes (60-30-10), atmospheric mesh gradients, subtle architectural textures, and depth.
3. **realistic-image-generation**: Prompt engineering for photorealistic, authentic photography with designated content-safe negative space.
4. **responsive-design**: Multi-viewport layout fluidity (mobile 375px through ultrawide 1920px+), touch target standards, and adaptive stacking.
5. **design-qa**: Rigorous verification against WCAG 2.1 AA contrast, typography structure (single `<h1>`), optical alignment, and CLS performance.
</skills_utilized>

---

<process>

## Phase 1: Strategic Intent & Visual Art Direction
1. **Define Section Objective**: Identify the emotional takeaway, primary user goal, and single dominant visual anchor.
2. **Establish Color Harmony (60-30-10)**:
   - 60% Canvas: Slate/Off-white or deep obsidian navy.
   - 30% Structural: Institutional navy/charcoal typography and subtle borders.
   - 10% Accent: Vivid verification green, amber, or royal blue for primary callouts.
3. **Draft Visual Layout Blueprint**: Reject 3-column repetitive cards. Design an asymmetric (e.g., 62% command center / 38% live telemetry) editorial layout.

---

## Phase 2: Photorealistic Visual Assets & Negative Space
1. **Identify Image Requirements**: Does the section benefit from authentic human or institutional photography?
2. **Formulate High-Fidelity Prompts**:
   - Apply `[Subject] + [Setting] + [Lighting] + [Camera/Lens] + [Color Grading]`.
   - Specify designated content-safe negative space (e.g., left or right 40% empty/soft-focus).
   - Ensure zero text inside the rendered image.
3. **Asset Generation / Selection**: Generate or curate imagery matching authentic institutional context (e.g., CBSE/K-12 educators, collaborative modern classrooms).

---

## Phase 3: Component Architecture & Responsive Construction
1. **Typography Scaffolding**:
   - Establish single `<h1>` with high-impact display font (`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`).
   - Sentence-case headers, body copy, and interactive buttons.
2. **Layout Orchestration**:
   - Implement fluid grid (`grid grid-cols-1 lg:grid-cols-12 gap-8`).
   - Construct mobile-friendly stack with minimum 44px tap targets.
   - Replace generic containers with whitespace, divider accents, and optical groupings.
3. **Micro-Interactions**:
   - Add tactile feedback (`active:scale-[0.98] transition-all`).
   - Implement accessible focus rings and subtle hover states.

---

## Phase 4: Systematic Design QA & Verification
1. **Accessibility & Contrast**:
   - Verify text contrast meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text).
   - Verify form inputs, focus rings, and badges have sufficient visual distinction.
2. **Multi-Viewport Audit**:
   - Inspect layout at 375px (mobile), 768px (tablet), and 1280px (desktop).
   - Ensure zero horizontal scrollbars or clipped dialog buttons.
3. **Performance & Layout Shift**:
   - Ensure image containers have explicit aspect ratios or `fill` with `sizes`.
   - Confirm Cumulative Layout Shift (CLS) is 0.

</process>
