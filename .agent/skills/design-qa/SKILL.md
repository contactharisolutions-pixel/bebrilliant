---
name: design-qa
description: Quality assurance inspection protocol for accessibility (WCAG 2.1 AA), typography fidelity, contrast, performance, and interaction polish.
---

# Design Quality Assurance (Design QA) Skill

## Overview
This skill provides a systematic audit framework to verify that every screen meets high visual polish, semantic accessibility, contrast standards, and responsive integrity prior to delivery or production deployment.

---

## The 5 Pillars of Design QA

### 1. Typography & Hierarchy Audit
- [ ] Is there only **one `<h1>`** on the page?
- [ ] Do headings follow strict descending semantic order (`h1` -> `h2` -> `h3`)?
- [ ] Are font weights restrained (e.g., normal 400, medium 500, bold 700)? Avoid arbitrary weight chaos.
- [ ] Is line height comfortable (`leading-relaxed` for paragraphs, `leading-tight` for large headings)?
- [ ] Are all action labels in sentence case?

### 2. Contrast & Color Compliance (WCAG 2.1 AA)
- [ ] Normal text (< 18pt or < 14pt bold) has at least a **4.5:1 contrast ratio** against its background.
- [ ] Large text (>= 18pt or >= 14pt bold) has at least a **3.0:1 contrast ratio**.
- [ ] UI components and graphical objects (borders, input rings, icons) have at least a **3.0:1 contrast ratio**.
- [ ] Color is never the sole indicator of state (e.g., error inputs have both a border highlight and an explanatory text label or icon).

### 3. State & Interaction Polish
- [ ] Every interactive control has visible and distinct:
  - **Default** state
  - **Hover** state (subtle brightness change, elevation or background shift)
  - **Focus-visible** state (high-contrast outline or ring for keyboard users)
  - **Active / Pressed** state (micro scale down `active:scale-[0.98]`)
  - **Disabled** state (`opacity-50 cursor-not-allowed`)
  - **Loading** state (spinners or skeletal placeholders without layout jumping)

### 4. Spacing & Layout Consistency
- [ ] All spacing conforms to an 8pt / 4pt grid system (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `gap-12`).
- [ ] Component internal padding balances with surrounding margins.
- [ ] Elements in horizontal rows align on their optical centers (`items-center`).
- [ ] Badges and chips maintain consistent horizontal and vertical optical balance (`px-2.5 py-1 text-xs`).

### 5. Performance & Asset Hygiene
- [ ] Hero images have explicit `width`, `height`, and modern formats (`.webp`, `.avif`).
- [ ] LCP (Largest Contentful Paint) priority is given to hero visual elements (`priority={true}`).
- [ ] No layout shift (CLS = 0) occurs during dynamic data loading or font swaps.
- [ ] Smooth transitions are limited to `transform`, `opacity`, and `background-color` (avoiding expensive layout repaints).
