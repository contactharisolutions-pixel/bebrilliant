---
name: visual-art-direction
description: Visual art direction guidelines for high-impact aesthetics, intentional color grading, spatial depth, and editorial atmosphere.
---

# Visual Art Direction Skill

## Overview
This skill defines the overarching visual language, atmosphere, lighting, palette harmonies, and brand storytelling of the application. It elevates standard software interfaces into prestigious, authoritative, and emotionally resonant experiences.

---

## Brand Atmosphere & Tone

### 1. Palette Architecture & Semantic Tokens
- **Dominant Core (60%)**: Premium institutional canvas:
  - Light Mode: Warm off-white or crystalline slate (`#FAFAFC`, `#F8F9FB`) with soft architectural borders (`#E5E7EB`).
  - Executive / Dark Mode: Deep navy obsidian (`#071426`, `#0B192C`, `#0A192F`) providing depth without harsh stark black.
- **Structural Identity (30%)**: Authoritative institutional blue (`#004B93`, `#1D4ED8`) and rich navy slate (`#1E293B`).
- **Accent Energy (10%)**: Crisp emerald verification (`#059669`), warm amber advisory (`#D97706`), or vibrant royal indigo (`#4F46E5`). Never overuse the accent color.

### 2. Lighting, Depth & Surfaces
- **Atmospheric Gradients**: Subtle multi-stop linear and radial meshes (e.g., from deep navy `#091E42` into cobalt `#1D4ED8`).
- **Layered Spatial Depth**: Use low-opacity subtle shadows (`shadow-sm`, `shadow-xl ring-1 ring-black/5`) rather than dark heavy drop-shadows.
- **Glassmorphism & Frosted Paneling**: Use backdrop blur (`backdrop-blur-md bg-white/80` or `bg-slate-900/80 border border-white/10`) for sticky headers, floating control bars, and modal overlays.
- **Architectural Vector Textures**: Fine-line geometric SVG grid patterns (opacity 5–8%) to evoke institutional engineering and stability.

### 3. Editorial Layout & Asymmetry
- **Hero Staging**: Hero sections must balance bold typographic statements with high-fidelity, art-directed visual assets or live UI telemetry.
- **Visual Rhythm**: Alternate full-bleed sections with constrained containers. Contrast dense information hubs with open, uncluttered breathing zones.
- **Hero Image Integration**: Images should blend seamlessly into background gradients using linear alpha masks (`mask-image: linear-gradient(to right, black, transparent)`).

---

## Art Direction Checklist
- [ ] Does this section evoke prestige, trust, and institutional credibility?
- [ ] Is the primary focal point immediately obvious within 500ms?
- [ ] Are visual textures refined rather than distracting?
- [ ] Does the color palette respect the 60-30-10 ratio?
- [ ] Are badges, indicators, and micro-labels crisp and mathematically aligned?
