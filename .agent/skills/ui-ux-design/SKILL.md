---
name: ui-ux-design
description: Enterprise UI/UX design intelligence and architecture for intentional, art-directed web interfaces without generic AI templates.
---

# UI/UX Design Skill

## Overview
This skill guides the design, structure, and component strategy of high-converting, enterprise-grade web interfaces. It enforces human-centered visual hierarchy, asymmetric composition, intentional typography, and content-first layout generation.

---

## Core Tenets

### 1. Composition Before Containers
- **Never start with containers or card grids**: First determine the section objective, primary visual anchor, and eye flow.
- **Asymmetric Balance**: Favor 60/40, 65/35, or editorial split-screen ratios over symmetrical, repetitive 3-column or 4-column card matrices.
- **Visual Restraint**: Remove redundant boxes, nested cards, and heavy borders. Group content through proximity, rhythm, and typographic scale rather than explicit bordered boxes.

### 2. Typographic Hierarchy
- **Single Expressive Display Font**: Use modern, geometric, or editorial typography for headers (e.g., Plus Jakarta Sans, Outfit, Inter).
- **Strict Size Ratios**:
  - Hero H1: `text-4xl sm:text-5xl lg:text-6xl` with `tracking-tight font-extrabold`
  - Section Headings: `text-2xl sm:text-3xl font-bold tracking-tight`
  - Subheadings / Eyebrows: `text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground`
  - Body Copy: `text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl`
- **Sentence Case Only**: Buttons, navigation labels, and headers should use natural sentence case ("Create new exam", "Schedule demo"). Avoid ALL CAPS outside of compact badge labels.

### 3. Whitespace & Rhythm
- Section padding: Minimum `py-16 sm:py-24 lg:py-32`.
- Content padding: Maintain clear breathing room between headline, copy, and action trigger (`gap-6` to `gap-8`).
- Keep maximum line width constrained for long-form reading: `max-w-prose` or `max-w-2xl` (65–75 characters per line).

### 4. Interactive State Architecture
- **Primary Actions**: Solid, high-contrast, tactile depth (`active:scale-[0.98] transition-all duration-150`).
- **Secondary Actions**: Ghost or soft-tinted surfaces (`border border-slate-200 hover:bg-slate-50`).
- **Feedback & Feedback Loops**: Every clickable element must exhibit distinct hover, active, focus-visible, and loading states.
- **Micro-Animations**: Subtle entrance triggers (`fade-in`, gentle slide-up) without distracting jank.

---

## Anti-Patterns to Strictly Avoid
1. **Generic AI Grid Cliché**: Stacking 3 or 4 identical boxes with an icon inside a circle, a short title, and 2 lines of lorem ipsum.
2. **Monotonous Card Repetition**: Surrounding every paragraph with a rounded border and drop shadow.
3. **Empty Zero States**: Rendering cold empty tables or blank canvases without contextual guidance, demo seeds, or clear next-step calls to action.
4. **Contrast Failures**: Gray text on gray backgrounds, or light blue on white violating WCAG AAA contrast guidelines.
