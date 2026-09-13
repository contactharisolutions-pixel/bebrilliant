---
name: ui-ux-design
description: Master senior-level UI/UX design system defining editorial compositions, asymmetric visual hierarchy, accessible interaction patterns, and purposeful component architecture without generic AI templates.
---

# Master UI/UX Design System Skill

## Purpose & Architectural Philosophy
This skill defines the definitive, production-grade UI/UX design standard for the entire project. It enforces human-centered visual hierarchy, art-directed editorial compositions, intentional typography, and tactile interaction design.

**The Golden Rule**: 
> **Never optimize for "more UI" or "more cards". Optimize for better visual composition with less unnecessary UI.**

Software interfaces should feel intentionally designed by a senior product designer and executive art director—authoritative, prestigious, and aesthetically captivating.

---

## 1. Core Composition Principles (Anti-Card & Anti-Container Default)

### A. The Default is NOT a Container
- **Containers, cards, and grids are NEVER the default layout starting point.**
- Begin every section by asking:
  1. What is the single primary story or action of this section?
  2. What should the human eye perceive in the first 200 milliseconds?
  3. Can this content be structured using pure typographic scale, optical proximity, and whitespace without putting it in a box?
- **Box Stripping Test**: If removing a border, card wrapper, or background box leaves the content legible and structurally clear, **remove the box**.

### B. Compositional Paradigms (Prefer Over Generic Grids)
1. **Editorial Asymmetry (Golden Ratio / 62:38 or 65:35)**:
   - Pair an authoritative, high-context operational command panel (62%) with a real-time subsystem telemetry dock or interactive visual anchor (38%).
2. **Full-Width Immersive Canvas**:
   - Break out of narrow, boxed 1100px containers. Use full-bleed backgrounds with subtle ambient mesh gradients, atmospheric lighting, and architectural edge-to-edge bleed.
3. **Split-Screen Editorial Staging**:
   - Contrast an impactful typographic statement and key decision triggers on one side against an art-directed contextual visual or live system output on the other.
4. **Varied Vertical Rhythm**:
   - Alternate dense, high-utility operational zones with spacious, editorial breathing zones. Never present 3 identical row formats in sequence.

---

## 2. Professional Information Architecture (IA) & User Journeys

### A. User Journey Blueprint
Every page, dashboard, and flow must anchor to a distinct 3-step cognitive pathway:
1. **Orientation (Where am I & What is the current status?)**: Immediate situational awareness via an Executive Command Bar, live status indicators, or institutional badges.
2. **Evaluation (What needs my attention?)**: Prioritized capacity meters, actionable alerts, or key metrics grouped by operational importance.
3. **Action (What can I do next?)**: High-contrast, tactile primary actions (single dominant button per view) accompanied by soft secondary choices.

### B. High-Fidelity Navigation Standards
- **Desktop Navigation**:
  - Pinned, high-density lateral rail or floating glassmorphic bar (`backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80`).
  - Active links must display a distinct physical pill or indicator, not merely a minor text color shift.
  - Sub-navigation must leverage contextual tabs or segmented pills with smooth animated transitions.
- **Mobile Navigation**:
  - Accessible, slide-out drawer or bottom touch dock with thumb-zone ergonomics.

---

## 3. Typographic Hierarchy & Expressive Scale

Typography carries 70% of visual design weight. Eliminate generic font stacks and arbitrary font weight choices.

### A. Strict Typographic Scale
- **Display Hero (H1)**: `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]`.
- **Section Heading (H2)**: `text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white`.
- **Subsection / Widget Title (H3)**: `text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100`.
- **Eyebrow / Overline**: `text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400`.
- **Editorial Sub-copy**: `text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl`.
- **Microcopy / Meta**: `text-xs text-slate-500 dark:text-slate-400 font-medium`.

### B. Sentence Case Strictness
- **Never use ALL CAPS** for buttons, tabs, menu items, or general titles.
- Use natural, respectful sentence case:
  - *Correct*: `Create CBT exam`, `Download student roster`, `View assessment analytics`
  - *Incorrect*: `CREATE CBT EXAM`, `DOWNLOAD STUDENT ROSTER`

---

## 4. Purposeful Components: Buttons, Cards, & Containers

Components are only deployed when their functional semantic purpose demands them.

### A. Purposeful Buttons (Hierarchical Tactility)
- **Primary Button (The Dominant Action)**:
  - Only **one** primary button per viewport quadrant.
  - Rich institutional depth, high-contrast text, tactile press micro-interaction (`active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow hover:-translate-y-0.5`).
- **Secondary Button**:
  - Clean neutral surface, subtle border (`border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800`).
- **Ghost / Tertiary Button**:
  - Borderless, optical alignment with surrounding text (`hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300`).
- **Destructive Action**:
  - Muted red tint until hovered/confirmed to avoid visual alarmism (`text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30`).

### B. Purposeful Cards (When and When NOT to use)
- **Use a Card ONLY when**:
  - The item represents a distinct, draggable, selectable, or discrete data record (e.g., a specific student record, a distinct exam session, an individual invoice).
- **Do NOT use a Card for**:
  - Stat displays (use pure numbers with subtle dividing rules or asymmetric meters).
  - Feature lists (use editorial copy with integrated typographic numerals or icons).
  - General text paragraphs.

### C. Purposeful Containers
- Use containers to establish mathematical page boundaries (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`), never to visually box in every single paragraph.
- Let section backgrounds breathe using subtle alternations between pure white, slate tints, and deep midnight tones.

---

## 5. Spacing System & Mathematical Rhythm

Adopt a strict 8pt / 4pt spatial grid:
- **Micro Spacing (Internal component padding)**: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px).
- **Macro Spacing (Section and layout gaps)**:
  - Component gaps: `gap-6` (24px) or `gap-8` (32px).
  - Section vertical rhythm: `py-12 sm:py-16 lg:py-24` (giving content true breathing room).
- **Optical Alignment**:
  - Ensure icon and label centers are optically locked (`inline-flex items-center gap-2`).

---

## 6. Complete State Architecture

Every single dynamic interface must account for 6 lifecycle states:

```
[ Default ] ──> [ Hover / Focus ] ──> [ Active / Loading ] ──> [ Success / Error / Empty ]
```

1. **Hover & Focus States**:
   - Visible, high-contrast keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
   - Smooth, non-jarring color transitions (`transition-colors duration-150`).
2. **Active / Pressed State**:
   - Subtle tactile scale down (`active:scale-[0.98]`).
3. **Loading State**:
   - Maintain spatial stability. Never cause layout shifts (CLS).
   - Use skeleton pulse screens that match the exact typography and component geometry of the loaded content.
4. **Empty State (Never Leave a Cold Void)**:
   - Provide visual illustration, an encouraging explanation, and a **1-click seed or onboarding starter action** (e.g., "Seed 12 Demo Students & Run Diagnostic Mock").
5. **Error State**:
   - Human-friendly diagnosis with direct recovery path (e.g., "Retry request", "Re-authenticate", or graceful fallback data).

---

## 7. Responsive Fluidity & Device Orchestration

- **Mobile (< 640px)**:
  - Single-column flow with minimum 44px x 44px tap targets.
  - Convert dense horizontal tables into stacked adaptive cards or smooth horizontal scroll wrappers with visible edge fades.
- **Tablet (640px – 1023px)**:
  - 2-column adaptive flow, sticky action docks.
- **Desktop (1024px+)**:
  - Asymmetric editorial grids, multi-pane command centers, rich data density without cognitive overload.

---

## 8. Anti-Patterns Checklist (Check Before Any UI Code is Written)

| Cliché AI Anti-Pattern | Required Senior Design Alternative |
| :--- | :--- |
| ❌ 3 or 4 identical boxes with an icon in a colored circle | ✅ Asymmetric editorial layout with a primary focal point and varied visual hierarchy |
| ❌ Wrapping every statistic in a rounded card with drop shadow | ✅ Clean typographic metrics with progress meters or baseline comparison rules |
| ❌ Generic stock SaaS illustrations (waving cartoon characters) | ✅ Authentic photorealistic imagery, real UI screenshots, or architectural geometric diagrams |
| ❌ Centering every heading, paragraph, and button | ✅ Intentional left-aligned editorial typography with purposeful whitespace |
| ❌ Cold empty zero-data state | ✅ Guided activation hub with a 1-click starter demo data trigger |
| ❌ ALL CAPS buttons (`SUBMIT`, `SAVE CHANGES`) | ✅ Sentence case labels with active verbs (`Submit assessment`, `Save changes`) |
