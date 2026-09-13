---
description: Comprehensive workflow for designing art-directed, image-led, enterprise-grade web pages and application interfaces.
---

PREMIUM WEBSITE DESIGN WORKFLOW

PHASE 1 — DISCOVERY

Understand:

- brand
- business
- target audience
- page purpose
- conversion objective
- content
- required functionality

PHASE 2 — UX

Define:

- information architecture
- navigation
- user journey
- content hierarchy
- CTA hierarchy

PHASE 3 — VISUAL DIRECTION

Define:

- visual language
- typography
- color
- imagery
- section rhythm
- visual concepts

PHASE 4 — IMAGE ART DIRECTION & ASSET MANAGEMENT

For image-led sections:

- define image concept
- define focal point
- define negative space
- define content-safe area
- generate artwork using server-side OpenAI utility (`/api/generate-image` or `src/lib/ai/openai.ts`)
- review artwork against design QA standards

Asset Management Rules:
- Treat generated images as permanent project assets
- Save approved imagery into `public/assets/images/{brand|hero|backgrounds|sections|products|mobile|generated}/`
- Maintain descriptive filenames: `[section]_[subject]_[descriptor]_[aspect-ratio].[ext]`
- Use optimized web formats (`.webp`, progressive `.jpg`)
- Do NOT regenerate approved artwork unnecessarily
- Do NOT replace an approved image without explicit user instruction


PHASE 5 — UI DESIGN

Create:

- navigation
- buttons
- forms
- components
- interactions
- states

Avoid unnecessary cards and containers.

PHASE 6 — IMPLEMENTATION

Implement using the project's existing:

- React/Next.js architecture
- Tailwind/CSS
- components
- routing
- data layer

Do not unnecessarily rewrite existing architecture.

PHASE 7 — VISUAL QA

Inspect the actual rendered website.

Compare:

- hierarchy
- spacing
- typography
- imagery
- composition
- responsive behavior

PHASE 8 — REFINEMENT

Fix the highest-impact visual problems first.

Do not add unnecessary UI.

PHASE 9 — RESPONSIVE QA

Verify:

- desktop
- tablet
- mobile

PHASE 10 — FINAL DESIGN REVIEW

The final result must feel:

- premium
- distinctive
- intentional
- brand-specific
- modern
- visually rich
- production-grade

It must not look like a generic AI website.