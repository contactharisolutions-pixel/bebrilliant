---
name: design-qa
description: Senior-level visual design audit protocol conducting a 15-point inspection through 5 expert lenses, enforcing subtraction over clutter and forbidding card-based patches.
---

# Master Design Quality Assurance (Design QA) Skill

## Purpose & Protocol
After implementing or refactoring any major page, interface, or visual section, you must execute this **Senior Visual Design Audit**.

The purpose is to ruthlessly eliminate generic AI aesthetics, visual clutter, repetitive cards, and broken responsive crops before any interface is shipped to users or deployed to production.

---

## The 5 Expert Audit Lenses

Every page must be inspected sequentially through 5 specialized design perspectives:

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ 1. Senior UI Designer           │   │ 2. Senior UX Designer           │
│ Precision, token consistency,   │   │ Information architecture, flow, │
│ contrast, and state completeness│   │ cognitive load, and feedback    │
├─────────────────────────────────┴───┴─────────────────────────────────┤
│ 3. Visual Designer                                                    │
│ Typographic scale, optical alignment, balance, and whitespace rhythm │
├─────────────────────────────────┬─────────────────────────────────────┤
│ 4. Executive Art Director       │ 5. Responsive Design Specialist     │
│ Atmosphere, emotional resonance,│ 4-device fluidity (mobile to wide), │
│ imagery meaning, and prestige   │ touch ergonomics, and custom crops  │
└─────────────────────────────────┴─────────────────────────────────────┘
```

---

## The 15 Mandatory Design QA Audit Checks

Evaluate the page against these **15 concrete criteria**:

### 1. Does it look AI-generated?
- Does the screen look like an amateur automated template (repetitive 3-card columns with icons in colored circles and centered generic copy)?
- *Requirement*: If it looks like a generic SaaS template, immediately strip the containers and rebuild with an asymmetric editorial composition.

### 2. Are there too many cards?
- Is every piece of text, metric, or paragraph trapped inside its own rounded border box?
- *Requirement*: Strip cards down to pure typography, dividing rules, or open whitespace unless an element represents a discrete, draggable, or individually selectable data record.

### 3. Are there too many containers?
- Are there unnecessary nested `div` borders, multiple layers of background gray boxes, or box-in-a-box syndrome?
- *Requirement*: Unify background planes. Let content breathe directly on the canvas.

### 4. Are sections repetitive?
- Do multiple consecutive sections follow the identical structure (e.g., Header $\rightarrow$ 3 cards $\rightarrow$ CTA)?
- *Requirement*: Vary vertical rhythm dynamically: pair an asymmetric 62/38 command section with a full-bleed visual showcase, followed by a dense technical telemetry grid.

### 5. Are background images meaningful?
- Does background imagery communicate an authentic operational story, or is it an arbitrary placeholder?
- *Requirement*: Background artwork must function as a structural, contextual environment reflecting institutional leadership, student focus, or optical precision.

### 6. Are images generic?
- Do the images feature plastic stock-photo models pointing at invisible screens or artificial cartoon illustrations?
- *Requirement*: Replace with authentic, cinematic, photorealistic imagery featuring genuine Indian institutional environments, natural daylight, and candid focus.

### 7. Is typography strong?
- Is the display headline commanding (`text-4xl` to `text-6xl font-extrabold tracking-tight`), or does it blend into body copy?
- Are headings, labels, and buttons in natural **sentence case**?
- *Requirement*: Establish clear, unshakeable typographic contrast across all 5 text scale levels.

### 8. Is visual hierarchy clear?
- Can a first-time viewer instantly identify the single primary takeaway and primary action within **500 milliseconds**?
- *Requirement*: Eliminate competing accents; ensure only one dominant visual anchor commands the viewport.

### 9. Is the brand identity clear?
- Does the interface exude the prestigious, academic, and authoritative identity of EduBrilliant / BeBrilliant?
- *Requirement*: Ground the palette in Oxford Navy (`#091E42`), crystalline slate (`#F8F9FB`), and crisp emerald/blue accents.

### 10. Is whitespace intentional?
- Does the layout feel cramped, or is whitespace used as an active compositional tool to guide the eye?
- *Requirement*: Maintain generous macro padding (`py-16` to `py-24` on desktop) and structured micro gaps (`gap-4` to `gap-8`).

### 11. Are buttons overused?
- Are there 5 different colored buttons competing for attention in a single screen?
- *Requirement*: Strictly enforce **one primary action button per quadrant**. Demote secondary actions to neutral borders or ghost text.

### 12. Are animations purposeful?
- Are elements bouncing, sliding from random directions, or causing visual distraction?
- *Requirement*: Restrict animations to subtle opacity fades and micro-scale tactile press feedback (`active:scale-[0.98] transition-all duration-150`).

### 13. Is mobile properly designed?
- Does mobile simply shrink the desktop layout, or was it architected for vertical thumb ergonomics?
- *Requirement*: Full-width touch targets ($\ge$ 44px), zero horizontal scrolling, and stack-reordering prioritizing story or primary action.

### 14. Are images cropped correctly?
- On tablet and mobile viewports, are human subjects decapitated or key technological details clipped?
- *Requirement*: Implement dedicated portrait crops or CSS focal repositioning (`object-position`) to preserve visual storytelling.

### 15. Are there unnecessary decorative elements?
- Are there meaningless floating gradients, cartoon blobs, random badge pills, or frosted glass blurs that serve no functional purpose?
- *Requirement*: Delete all decorative elements that do not convey institutional meaning or technical telemetry.

---

## Remediation Philosophy: Subtraction Over Clutter

When a design audit reveals a section is weak, cluttered, or awkward, follow this ironclad rule:

> ### 🛑 The Subtraction Rule
> **Prefer redesigning or removing elements rather than adding more UI.**
>
> **NEVER solve a design problem by adding more cards.**

### How to Fix Weak Sections:
1. **Weak Hierarchy**: Do NOT add a colored box around the text. Instead, increase headline scale, lighten the body copy color, and increase whitespace.
2. **Cluttered Layout**: Do NOT add tabs or accordion cards to hide the mess. Delete secondary fluff copy and highlight the single core metric.
3. **Low Contrast**: Do NOT slap a dark 50% black scrim over the entire image. Re-crop the image or position text over the natural negative space of the photograph.
4. **Boring Repetition**: Do NOT swap cards for different shaped cards. Re-architect the entire section as an asymmetric split, a full-bleed photo hero, or an interactive launchpad dock.
