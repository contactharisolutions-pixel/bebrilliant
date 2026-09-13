---
name: realistic-image-generation
description: Framework and prompt engineering standards for generating photorealistic, contextual, and high-fidelity visual assets using the server-side OpenAI Images integration.
---

# Master Realistic Image Generation Skill

## Purpose & Architectural Philosophy
This skill governs the prompt engineering, art-directed composition, and execution of photorealistic, cinematic, and brand-aligned visual assets using the server-side OpenAI image generation integration ([src/lib/ai/openai.ts](file:///d:/MyProjects/BeBrilliant/src/lib/ai/openai.ts)).

Generated imagery serves as the primary environmental foundation for website sections. It must feel authentic, human, and authoritative—elevating the institutional prestige of the platform.

---

## 1. Server-Side OpenAI Integration Standard

When custom artwork is required, invoke the server-side service directly via `generateAIImage` in [src/lib/ai/openai.ts](file:///d:/MyProjects/BeBrilliant/src/lib/ai/openai.ts):

```typescript
import { generateAIImage } from '@/lib/ai/openai'

const artwork = await generateAIImage({
    model: 'dall-e-3',
    prompt: validatedArtDirectedPrompt,
    size: '1792x1024', // Landscape hero & wide sections
    quality: 'hd',     // Maximum photorealistic texture fidelity
    style: 'natural'   // Prevents oversaturated, cartoonish AI rendering
})
```

**Security Rule**: Never invoke image generation APIs from client components or expose `OPENAI_API_KEY` to browser bundles. All generation executes in server runtime.

---

## 2. Mandatory Pre-Generation Blueprint (The 11 Parameters)

Before generating any image or writing a prompt, you must explicitly define these **11 Compositional Parameters**:

```
 1. Intended Section       ──>  2. Subject              ──>  3. Environment
 4. Camera Perspective     ──>  5. Lighting             ──>  6. Focal Point
 7. Composition            ──>  8. Negative Space       ──>  9. Content-Safe Area
10. Desktop Crop (16:9)    ──> 11. Mobile Crop (Vertical re-stack)
```

| Parameter | Definition & Art Direction Standard |
| :--- | :--- |
| **1. Intended Section** | Exact page placement (e.g., Executive Hero, OMR Optical Scanner Showcase, AI Curriculum Hub, Institutional Footer). |
| **2. Subject** | Specific authentic human subjects or technical artifacts (e.g., An Indian principal and department head, an optical OMR sheet under laser alignment). |
| **3. Environment** | Tangible, architectural setting (e.g., Sunlit CBSE conference hall, modern institutional faculty lab with timber and glass architecture). |
| **4. Camera Perspective** | Exact lens focal length and angle (e.g., Eye-level medium wide shot, 50mm f/1.4 lens, shallow depth of field with creamy bokeh). |
| **5. Lighting** | Directional, motivated source (e.g., Natural 45-degree morning sunlight filtering through floor-to-ceiling glass windows). |
| **6. Focal Point** | Exact visual anchor (e.g., The thoughtful, focused expression of the educator interacting with student diagnostic telemetry). |
| **7. Composition** | Geometric staging (e.g., Asymmetric golden ratio, rule of thirds, subject anchored to the right 40% with natural leading lines). |
| **8. Negative Space** | Intentional low-frequency visual field (e.g., Smooth diffuse architectural wall or soft daylight falloff with minimal visual noise). |
| **9. Content-Safe Area** | Exact quadrant reserved for live HTML typography and primary action triggers (e.g., Left 55% of the frame). |
| **10. Desktop Crop** | `1792x1024` or `16:9` landscape aspect ratio with clean horizontal bleed. |
| **11. Mobile Crop** | Vertical `1:1` or `9:16` focal crop ensuring the human subject remains centered without clipping the primary action. |

---

## 3. Strict Negative Constraints (What Generated Artwork Must NEVER Contain)

Generative models frequently attempt to render simulated interfaces. Background artwork must **never** contain interface artifacts:

### 🚫 Strictly Forbidden Artifacts
1. **NO Website UI or Mockups**: Never allow the image model to draw fake browser frames, mock dashboard windows, or laptop device mockups.
2. **NO Buttons, CTAs, or Cards**: No rounded button pills, floating cards, or simulated interactive elements inside the image.
3. **NO Navigation or Headings**: No menu bars, breadcrumbs, search inputs, or navigation links.
4. **NO Watermarks or Signatures**: Reject any image with corner signatures, stock agency watermarks, or copyright glyphs.
5. **NO Unnecessary Text or Letters**: Generative models warp letters into gibberish. All typography must be rendered cleanly via HTML/CSS over the image.
6. **NO Plastic or Waxy Skin Smoothing**: Prompt against beauty-filter airbrushing. Mandate authentic skin micro-textures, pores, and natural light reflection.
7. **NO Generic Stock Clichés**: No groups of smiling businesspeople pointing at an empty glass board, no floating holographic gears, and no neon glowing brains.

---

## 4. Prompt Engineering Formula for Photorealism

Construct prompt strings using this concrete formula:

```
[Photorealistic Medium & Lens] + [Authentic Subject & Action] + [Architectural Context & Setting] + [Motivated Natural Lighting] + [Color Grading & Film Stock] + [Strict Negative Space & Composition Rules]
```

### Production Examples for EduBrilliant / BeBrilliant

#### Example A: Executive Institutional Hero
```
Editorial photography shot on Sony A7R V with 50mm f/1.4 G-Master lens. An authentic, distinguished Indian female school principal in professional attire and an academic director in collaborative discussion in a sunlit, state-of-the-art school conference room. Warm morning directional sunlight casting soft architectural shadows across a natural wood conference table. In the soft-focus background, clean CBSE classroom architectural glass walls with subtle greenery outside. Kodak Portra 400 color tones, natural authentic skin textures, genuine expressions, high dynamic range. Asymmetric composition: subjects positioned exclusively on the right 40% of the frame. The left 60% consists of an uncluttered, soft-focus neutral architectural wall with gentle diffuse daylight, completely free of any text, buttons, UI, or distractions.
```

#### Example B: Subsystem Optical OMR Scanner Technology
```
High-end cinematic macro product photography of an authentic physical CBSE optical assessment answer sheet being evaluated under high-speed optical scanning illumination. Shot on Hasselblad H6D-100c with 120mm macro lens at f/2.8. Crisp tangible paper texture with printed circular bubbles, subtle red and green optical alignment calibration crosshairs illuminated by a focused warm tungsten ray. Shallow depth of field with the background fading into dark slate architectural tones. Industrial precision, zero distortion, no digital UI, no buttons, no computer screens, no fake graphs, no text overlays.
```

#### Example C: Student Diagnostic Focus
```
Authentic cinematic documentary photography of a focused Class 11 Indian high school student writing an assessment in a modern, naturally lit institutional library. Shot on Canon EOS R5, 85mm f/1.8 lens. Natural daylight from a tall library window highlighting the student's concentrated expression and the paper exam booklet. Background features rows of quiet academic bookshelves softly blurred in creamy bokeh. Cinematic 35mm film grain, muted collegiate navy and warm amber tones, genuine realism, zero stock-photo cheese, no floating holograms, no fake icons.
```

---

## 5. Anti-Repetition & Variety Standard

- **Never reuse the same image concept across sections.**
- Alternate visual modalities systematically:
  - **Section 1 (Hero)**: High-context human leadership & collaborative institutional environment.
  - **Section 2 (Platform Infrastructure)**: Tangible physical artifacts (OMR paper, optical sensors, high-speed camera lenses).
  - **Section 3 (Academic Pedagogy)**: Intimate student concentration & classroom engagement.
  - **Section 4 (Institutional Scale)**: Broad architectural school campus & state-of-the-art academic auditoriums.
