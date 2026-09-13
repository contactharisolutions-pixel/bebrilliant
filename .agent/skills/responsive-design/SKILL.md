---
name: responsive-design
description: Multi-device responsive architecture treating mobile, tablet, laptop, and desktop as distinct design problems with a mandatory 10-point viewport evaluation protocol.
---

# Master Responsive Design Skill

## Core Architectural Principle
**Responsive design is NOT "scaling down the desktop layout."**

Responsive design is treated as a **distinct design problem** for each hardware context. Mobile screens operate on vertical thumb zones and rapid glanceability, tablets navigate through handheld touch interaction, laptops balance dense utility with trackpad precision, and ultrawide desktops require expansive architectural composition.

---

## 1. The 4 Distinct Viewport Archetypes

```
┌───────────────────────────────┬───────────────────────────────┐
│ Mobile (375px – 430px)        │ Tablet (768px – 1023px)       │
│ Handheld single-column thumb  │ Dual-orientation hybrid touch │
│ zone; dedicated vertical crop │ adaptive 2-column flow        │
├───────────────────────────────┼───────────────────────────────┤
│ Laptop (1024px – 1279px)      │ Desktop / Ultrawide (1280px+) │
│ Compact high-density command  │ Expansive asymmetric editorial│
│ center; trackpad ergonomics   │ 62/38 split; full visual bleed│
└───────────────────────────────┴───────────────────────────────┘
```

| Viewport | Primary Target Resolution | Ergonomic & Layout Objective |
| :--- | :--- | :--- |
| **Mobile** | `375px – 430px` (iPhone, Pixel) | Vertical thumb ergonomics, minimum 44px tap targets, rapid hierarchy, zero horizontal scroll, re-staged vertical focal crop. |
| **Tablet** | `768px – 1023px` (iPad Mini, Air, Pro) | Hybrid touch/pointer navigation, adaptive 2-column or 60/40 layouts, persistent bottom or drawer navigation. |
| **Laptop** | `1024px – 1279px` (13"–14" MacBooks) | Compact high-density operational command, collapsible secondary panels, optical typographic proportioning. |
| **Desktop / Ultrawide** | `1280px – 1920px+` (Studio Displays) | Asymmetric 62:38 or 65:35 golden ratio layouts, immersive edge-to-edge atmospheric staging, spacious reading constraints (`max-w-7xl`). |

---

## 2. Mandatory 10-Point Viewport Evaluation Protocol

For every major visual section, systematically audit and document these **10 Viewport Factors**:

```
 1. Image Crop        ──>  2. Focal Point         ──>  3. Typography
 4. Content Order     ──>  5. CTA Placement       ──>  6. Spacing
 7. Navigation        ──>  8. Section Height      ──>  9. Readability
10. Touch Targets
```

### 1. Image Crop
- Never shrink a 16:9 desktop background into a tiny, compressed mobile sliver.
- Use CSS `object-position: center 25%` or the semantic `<picture>` element to swap to a dedicated vertical portrait crop (`aspect-[4/5]` or `aspect-[9/16]`) on mobile.

### 2. Focal Point
- Verify that the primary visual anchor (e.g., the principal's face, the optical OMR sheet) remains visible and optically balanced after responsive reflow.
- Never let auto-cropping decapitate human subjects or hide key technological focal points.

### 3. Typography Proportions
- Hero Display typography must dynamically adapt across breakpoints:
  - Mobile: `text-3xl font-extrabold tracking-tight leading-tight`
  - Tablet: `text-4xl sm:text-5xl font-extrabold tracking-tight`
  - Desktop: `text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]`
- Prevent awkward single-word wrapping ("widows") using text balance (`text-wrap: balance`).

### 4. Content Order (Visual & DOM Flow)
- On desktop, an asymmetric 60/40 split places typography on the left and imagery on the right.
- On mobile, intentionally decide:
  - **Option A (Story First)**: Primary headline $\rightarrow$ Sub-copy $\rightarrow$ Primary CTA $\rightarrow$ Full-bleed visual graphic.
  - **Option B (Visual Hook First)**: High-impact visual focal point $\rightarrow$ Headline $\rightarrow$ Action trigger.
- Enforce clean order with Flexbox/Grid ordering (`order-first lg:order-last`).

### 5. CTA Placement & Thumb-Zone Reachability
- On mobile, critical primary actions must sit within the lower 60% of the screen (the natural thumb reach zone).
- Consider sticky bottom action docks for high-stakes flows (e.g., "Submit Examination", "Schedule Live Demo").

### 6. Spacing & Margin Rhythm
- Desktop `py-24 sm:py-32` must scale down to `py-12 sm:py-16` on mobile to prevent excessive empty scrolling.
- Horizontal page gutters: `px-4 sm:px-6 lg:px-8`.

### 7. Navigation Architecture
- **Desktop**: Pinned lateral rail (240px–280px) or floating top glassmorphic command dock.
- **Laptop**: Pinned compact rail with icon tooltips or auto-collapsible sub-drawers.
- **Tablet & Mobile**: Sliding sheet drawer with backdrop blur, keyboard trap management, and smooth touch gestures.

### 8. Section Height & Viewport Budgeting
- Avoid rigid `h-screen` or `100vh` on mobile viewports due to dynamic mobile browser address bars.
- Use `min-h-[100dvh]` or `min-h-[calc(100dvh-4rem)]` (dynamic viewport units) to prevent unwanted vertical clipping.

### 9. Readability & Contrast Shielding
- Ensure text placed over imagery maintains minimum WCAG 2.1 AA contrast across all screen sizes.
- On mobile, if a background image crowds the text, stack the image below the text or introduce an architectural gradient shield (`bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent`).

### 10. Touch Targets & Interaction Areas
- Every interactive element on mobile must meet the minimum 44px x 44px touch target boundary (`min-h-[44px] min-w-[44px]`).
- Increase tap spacing between links in lists to prevent accidental adjacent clicks.

---

## 3. Dedicated Mobile Artwork Strategy (When & How to Diverge)

When a single image cannot satisfy both wide desktop composition and handheld verticality, deploy **Dedicated Mobile Artwork**:

```html
<!-- Semantic Responsive Image Swapping Pattern -->
<picture>
  <!-- Mobile Viewport: Dedicated vertical portrait asset with centered subject -->
  <source media="(max-width: 639px)" srcset="/images/hero-principal-mobile.webp" />
  <!-- Tablet Viewport: Balanced 4:3 architectural composition -->
  <source media="(max-width: 1023px)" srcset="/images/hero-principal-tablet.webp" />
  <!-- Desktop Viewport: 16:9 widescreen composition with left negative space -->
  <img
    src="/images/hero-principal-desktop.webp"
    alt="Indian school leadership reviewing academic diagnostic assessments"
    className="w-full h-full object-cover object-center"
    loading="eager"
    fetchPriority="high"
  />
</picture>
```

---

## 4. Complex Data & Table Reflow Patterns

Dense operational dashboards (student rosters, exam results, grade sheets) must transform gracefully on smaller screens:

1. **Adaptive Card Transformation**:
   - On screens `< 768px`, transform 8-column data tables into structured vertical cards showing student avatar, name, grade, score badge, and quick action trigger.
2. **Smooth Horizontal Pinning**:
   - If tabular row comparison is mandatory, wrap table in an isolated overflow container (`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0`) with a sticky leftmost identifier column (`sticky left-0 bg-white dark:bg-slate-900 z-10`).
3. **KPI / Quota Meter Stacking**:
   - Desktop: Horizontal 4-meter asymmetric capacity gauge.
   - Mobile: 2x2 grid or vertical progress stack with clear numeric denominators (`1 / 1,000`).

---

## 5. Responsive Verification Checklist

- [ ] Tested at **375px** (iPhone SE/Mini) — zero horizontal scroll, legible headers.
- [ ] Tested at **390px / 414px** (Standard iPhone/Android) — comfortable thumb reach.
- [ ] Tested at **768px / 820px** (iPad portrait) — 2-column balance.
- [ ] Tested at **1024px** (iPad landscape / 13" laptop) — sidebar density and font scale.
- [ ] Tested at **1440px** (Standard desktop) — asymmetric 60/40 alignment.
- [ ] Tested at **1920px** (Ultrawide) — container constrained (`max-w-7xl`), no distorted image stretching.
- [ ] All interactive touch targets are at least **44px x 44px**.
- [ ] Dynamic viewport height units (`100dvh`) used instead of static `100vh`.
