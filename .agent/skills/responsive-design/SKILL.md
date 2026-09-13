---
name: responsive-design
description: Multi-device responsive design standards, mobile-first breakpoints, fluid typography, and adaptive layout orchestration.
---

# Responsive Design Skill

## Overview
This skill governs the fluid, multi-viewport layout behavior of all interface components across mobile phones (375px–430px), tablets (768px–1024px), standard laptops (1280px–1440px), and ultrawide desktops (1920px+).

---

## Responsive Breakpoint Standards

```
Mobile (Default)   : < 640px    (1 column, collapsible sidebars, full-width touch targets)
sm (Small Tablet)  : >= 640px   (2 columns or adaptive row cards)
md (Tablet)        : >= 768px   (Persistent auxiliary navigation, responsive modals)
lg (Desktop)       : >= 1024px  (Asymmetric split 60/40 or multi-column command center)
xl (Large Desktop) : >= 1280px  (Full enterprise dashboard layout with fixed sidebar)
2xl (Ultrawide)    : >= 1536px  (Constrained container max-w-7xl with fluid margins)
```

---

## Fluid Principles & Mobile-First Execution

### 1. Fluid Typography
- Avoid rigid pixel sizes. Use Tailwind utility combinations:
  - Display Hero: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
  - Section Title: `text-2xl sm:text-3xl lg:text-4xl`
  - Card / Widget Title: `text-base sm:text-lg font-semibold`
  - Body Copy: `text-sm sm:text-base`

### 2. Layout Transformation Rules
- **Stack-to-Side Split**: On mobile, stack content vertically (`flex flex-col lg:flex-row`). At desktop `lg:`, shift to asymmetric grid (`grid grid-cols-1 lg:grid-cols-12 gap-8`).
- **Touch Targets**: Minimum 44px x 44px tap area on mobile for all buttons, menu items, and interactive controls (`min-h-[44px] px-4 py-2.5`).
- **Table & Roster Handling**: On mobile screens, never allow horizontal viewport breaking. Use either:
  - An overflow wrapper with subtle scroll cues (`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0`).
  - Adaptive stacked card list transformation for mobile viewports.

### 3. Responsive Navigation & Drawers
- Mobile: Collapsible Sheet/Drawer with backdrop blur and accessible slide-in animation.
- Desktop: Pinned high-density sidebar with tooltips, collapsed mode support, and clear brand hierarchy.

---

## Responsive QA Checklist
- [ ] No horizontal scrolling on mobile viewports (375px, 390px, 414px).
- [ ] Touch targets are at least 44px height/width on mobile.
- [ ] Modals, dialogs, and sheets adapt gracefully to small screen heights without clipping action buttons.
- [ ] Images scale responsively with `object-cover` and explicit aspect ratios to avoid layout shift (CLS).
