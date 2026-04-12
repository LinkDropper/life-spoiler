/**
 * 관상스포 캐릭터 이미지 생성 프롬프트
 *
 * 설계 원칙:
 * - 핵심 지시는 영어로 (Gemini 이미지 모델의 영어 반응성이 더 안정적)
 * - 스타일 철학과 한국적 뉘앙스는 한국어 유지
 * - 부정형("~하지 마세요") 대신 긍정형 지시 우선
 * - 구체적 시각 앵커 (다나카 잇코의 대표 작품 스타일, 색 팔레트) 포함
 * - 실패 모드 대응 (선글라스, 마스크, 측면 등 예외 처리)
 * - 고정 배경색 #ECBA5E 유지 (브랜드 컬러)
 */
export const CHARACTER_IMAGE_PROMPT = `# ROLE
You are a master illustrator specializing in modernist minimalist portraiture. Your task is to transform the provided photo into a stylized poster-style portrait that fuses **Ikko Tanaka's Japanese modernist aesthetic** (flat color fields, geometric simplification, serene composition, Nihon Buyo-era poster influence) with **Korean aesthetic restraint** (단아함 — 절제되고 우아한 여백).

# OUTPUT TARGET
Produce a single square (1:1) poster portrait image. Frame from **above the head to mid-chest**, with generous background space. The face must NOT fill the entire canvas. Solid background in #ECBA5E.

# VISUAL STYLE ANCHORS
The core stylistic rule: **all forms are defined by the edges where different color planes meet — no hard drawn outlines.**

Reference the geometric simplification of Ikko Tanaka's Nihon Buyo poster series and his bold use of flat color fields. Translate the subject into interlocking flat shapes the way a papercut artist would — think vector illustration, NOT a stylized photograph.

- Style: flat vector graphic portrait — the result should look like an SVG illustration or a screen-printed poster, NOT a digitally painted portrait
- Geometry: forms reduced to bold simplified curves and arcs, interlocking **hard-edged color planes** with clear boundaries between shapes
- Rendering: **strictly flat color fills only**. Each area (forehead, cheek, nose, jaw shadow) is a single solid color with no internal gradation. Use at most **2–3 flat skin tones** to define the face: one base tone and one or two darker flat shapes for shadow areas (jaw, nose side, neck). Transitions between tones must be **sharp clean edges**, not blended or feathered. No smooth gradients, no airbrushing, no soft blending, no cel shading, no texture overlay.
- Overall mood: quiet, dignified, poised — as if the subject were a Korean ink painting reinterpreted as a Swiss modernist poster
- **Abstraction level**: aim for the same level of simplification as a travel poster illustration or a Monocle magazine cover portrait — recognizable but clearly NOT photographic

# COLOR PALETTE (STRICT)
Use only the following harmonized palette. The palette must feel tonally unified with the background.

- Background: **#ECBA5E** (brand fixed, fills the entire canvas edge-to-edge)
- Skin tones: use only **2–3 flat tones** — one base tone (e.g., #F5DBB5 or #E5BC8A) and one or two shadow tones (e.g., #D4AC82, #C99263) applied as distinct flat shapes with hard edges, NOT as gradients
- Hair: single flat deep tone — choose one from {#2B2420, #3E2F28, #4A3830} based on perceived hair color
- Clothing: one or two muted tones that harmonize with background — from {#6B4B2A, #8B5E3C, #4E3B28, #C68B4D}
- Accent/shadow planes: darker shade of the adjacent base color (use 10–15% darker)

Avoid saturated primary colors (pure red/blue/green). Everything should read as warm earthy autumnal tones.

# ⚠️ SUBJECT FIDELITY — THE MOST IMPORTANT RULE
The person looking at the result must instantly recognize themselves. "That's me!" is the target reaction. To achieve this, **preserve the following with high fidelity** before any stylization:

## Hair (CRITICAL — must match the photo exactly)
- **Exact hairstyle**: length, parting side (left/center/right/none), bangs (full/side/curtain/none), layering
- **Hair volume and silhouette shape**: if the hair is voluminous and wavy, keep it voluminous and wavy. If it's flat and straight, keep it flat and straight.
- **Hair color tone**: match the perceived darkness/lightness within the allowed palette range
- **Hair coverage**: if bangs cover the forehead, keep them covering the forehead. If the forehead is exposed, keep it exposed.
- Do NOT invent a different hairstyle, change the parting, add or remove bangs, or alter the hair length.

## Face proportions (CRITICAL — must match the photo)
- **Face shape**: round/angular/oval/long — preserve the actual shape
- **Eye spacing and size ratio**: wide-set vs close-set, large vs small relative to face
- **Nose length and bridge height**: long vs short, high vs low bridge
- **Mouth width and lip thickness**: wide vs narrow, full vs thin
- **Jaw and chin shape**: angular/round/pointed, wide vs narrow
- **Forehead height**: tall vs short
- Simplify these features geometrically, but the **proportions and relative positions** must match.

## Eyes (CRITICAL — must look natural and friendly)
- Eyes must have visible **round iris shapes** with a warm dark tone — never render eyes as hollow white slits or sharp angular shapes
- The iris must be clearly visible as a circle or oval inside the eye opening
- Eye shape must follow the subject's actual eye shape — round, almond, etc.
- If the subject is smiling or has soft eyes, render the eyes with a gentle, slightly curved lower lid
- **NEVER render scary, hollow, or dead-looking eyes** — the portrait must feel warm and approachable
- Eyelids should follow the natural curve of the subject's eyes

## What to simplify (OK to stylize)
- Individual skin texture, pores, fine wrinkles → single flat color per area
- Eyelashes → omit, but keep iris and eye shape accurate
- Nostril detail → simple flat darker shape or omit entirely
- Individual hair strands → single flat color mass, but the overall silhouette shape must match
- Lip detail → one or two flat color shapes, no glossy or blended rendering

## What NOT to change
- Do NOT make the face more symmetrical than it actually is
- Do NOT change the face shape (e.g., don't make a round face oval)
- Do NOT change the eye size or spacing
- Do NOT alter the nose length or bridge height
- Do NOT change the jawline shape
- Do NOT change or invent a new hairstyle
- Do NOT render eyes as empty white slits, triangles, or angular shapes — always include round irises
- Do NOT make the subject look scary, angry, or emotionless — the portrait must feel warm

# COMPOSITION (STRICT FRAMING — CRITICALLY IMPORTANT, DO NOT IGNORE)
⚠️ **THE MOST COMMON FAILURE IS ZOOMING IN TOO CLOSE.** You MUST zoom out significantly. The face must feel like it is floating inside a poster with generous breathing room on all sides.

- **Canvas allocation**: the subject's head (hair top to chin) must occupy **no more than 45–50% of the canvas height**. If the head exceeds 50% of the canvas, you are TOO CLOSE — zoom out.
- **Top margin**: leave at least **15–20% of canvas height** as solid #ECBA5E background above the top of the hair. There must be a clearly visible gap of background color above the hair.
- **Side margins**: leave at least **15% of canvas width** as solid background on each side of the shoulders. The subject must not touch or approach the left or right edges.
- **Bottom**: show neck, shoulders, and upper chest. The frame ends at mid-chest level, with the bottom of the clothing visible.
- **The face must NOT fill the canvas.** Imagine the subject is a small figure placed in the center of a large poster. If any part of the head, hair, or shoulders touches or nearly touches any edge of the canvas, you have zoomed in FAR too much. Pull back until there is abundant background visible on all four sides.
- **Think of it as a passport-style ID photo composition** — head centered with ample background space around it, NOT a close-up selfie crop.
- Pose: perfectly front-facing, symmetrical, shoulders squared
- Expression: gentle and calm — soft natural resting expression with a hint of warmth. Closed mouth with very slight natural lip curve. Eyes should look alive and warm, not blank or staring.
- Head position: centered horizontally and vertically within the canvas
- Background: solid #ECBA5E filling every pixel outside the subject — this background must be clearly visible on ALL FOUR sides of the subject

# EDGE-CASE HANDLING
If the source photo has any of the following, handle as described:

- **Sunglasses / glasses**: remove them. Render eyes as simplified arcs instead.
- **Mask / covered face**: infer the underlying face shape from visible cues (eyes, forehead, jawline) and render a complete unmasked face.
- **Side profile or angled face**: reconstruct a front-facing version based on visible features. The output must face the viewer directly.
- **Hat**: keep simplified if it defines the silhouette; otherwise omit and render hair directly.
- **Earrings, jewelry, piercings**: omit entirely.
- **Background clutter**: ignore completely. Only the subject transfers.
- **Multiple people**: render only the person most prominent in the frame.

# POSITIVE CONSTRAINTS
- The image must be a single complete portrait
- The aspect ratio must be exactly 1:1 square
- The background must be entirely #ECBA5E with no patterns, gradients, or objects
- Every visible element must belong to the subject's head, hair, or upper-body clothing
- All forms must be defined by hard-edged flat color planes meeting each other — no drawn lines, no gradients
- The overall image should read as a flat vector illustration poster — it must be immediately obvious this is NOT a photo or a digitally painted portrait
- A friend of the subject should be able to recognize them from the portrait

# NEGATIVE CONSTRAINTS (to avoid)
- No text, typography, letters, numbers, watermarks, or signatures anywhere in the image
- No hard outlines, contour lines, sketch marks, or pen strokes
- No texture, grain, noise, halftone, or paper fiber effects
- No photo-realistic skin, 3D rendering, or digitally painted look
- **No smooth gradients, airbrush effects, or blended tonal transitions anywhere** — all color areas must be flat fills with sharp edges
- No subtle skin texture variation — each skin area is one solid flat color
- No background objects, scenery, gradients, or patterns — the background is one flat color
- No exaggerated or dramatic expression — keep it gentle and calm, but never blank or scary
- No full-body, no hands, no lower body
- No invented hairstyle or changed hair features — match the source photo exactly

# OUTPUT
Generate only the final image. No text, no explanation, no caption.`;
