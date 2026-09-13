---
name: realistic-image-generation
description: Framework and prompt engineering standards for generating photorealistic, contextual, and high-fidelity visual assets using generative image models.
---

# Realistic Image Generation Skill

## Overview
This skill outlines the generation, curation, and prompt architecture for generating photorealistic, editorial-grade photography and visual assets. It avoids synthetic AI artifacts, awkward hands, plastic lighting, and generic stock photo aesthetics.

---

## Prompt Engineering Architecture

### 1. Structure of an Art-Directed Image Prompt
When invoking image generation tools (e.g., DALL-E 3, Imagen, Midjourney), adhere strictly to this formula:

```
[Subject & Action] + [Setting & Context] + [Lighting & Atmosphere] + [Camera, Lens & Focal Depth] + [Color Grading & Mood]
```

### 2. Dimension & Framing Standards
- **Hero Landscape**: Aspect Ratio `16:9` or `3:2` (e.g., `1792x1024`). Always designate content-safe negative space on one side (left or right 40%) for text overlays.
- **Editorial Portrait / Story Card**: Aspect Ratio `4:3` or `1:1` (e.g., `1024x1024`).
- **Feature Showcase**: Asymmetrical split crops with natural depth of field (`f/1.8`, soft bokeh background).

### 3. Concrete Style Descriptors
- **Lighting**: "Warm morning directional sunlight through floor-to-ceiling glass windows", "soft ambient rim lighting", "clean natural daylight".
- **Camera Optics**: "Shot on Sony A7R V, 50mm f/1.4 GM lens", "cinematic 35mm film still", "shallow depth of field with creamy bokeh".
- **Texture & Realism**: "Subtle authentic skin texture, realistic micro-expressions, architectural concrete and warm wood grain, no plastic smoothing".
- **Color Palette**: "Kodak Portra 400 color tones, muted architectural earth tones, natural skin tones, high dynamic range without cartoonish oversaturation".

---

## Domain Example: Indian Institutional Education (K-12 & Competitive Prep)

```
A photorealistic editorial photograph of an Indian female high-school principal and an academic coordinator reviewing student assessment progress on a modern tablet in a brightly lit, state-of-the-art school conference room. In the soft-focus background, clean CBSE classroom architectural details with natural sunlight. Shot on Canon EOS R5 with 85mm f/1.8 lens, natural daylight, genuine collaborative expressions, warm cinematic color grading, crisp details. Content-safe space on the left.
```

---

## Quality Guardrails
- **No Uncanny Faces or Plastic Skin**: Reject images with over-airbrushed, hyper-smooth plastic textures.
- **No Text in Image Renderings**: Text in images frequently produces misspelled or warped glyphs. Always overlay live HTML typography over the image.
- **Negative Space Requirement**: When generating hero backgrounds, explicitly prompt for empty or uncluttered zones so text remains 100% legible without needing excessive dark scrims.
