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
Produce a single square (1:1) poster portrait image. Upper body only (head to mid-chest). Subject faces the viewer directly, expression neutral. Solid background in #ECBA5E.

# VISUAL STYLE ANCHORS
The core stylistic rule: **all forms are defined by the edges where different color planes meet — no drawn outlines anywhere.**

Reference the geometric simplification of Ikko Tanaka's Nihon Buyo poster series and his bold use of flat color fields. Translate the subject into interlocking flat shapes the way a papercut artist would.

- Style: neo-minimalist flat graphic portrait
- Geometry: forms reduced to simplified curves and arcs, interlocking color planes
- Rendering: fully flat or with extremely soft gradients only — no cel shading, no linework, no texture overlay
- Overall mood: quiet, dignified, poised — as if the subject were a Korean ink painting reinterpreted as a Swiss modernist poster

# COLOR PALETTE (STRICT)
Use only the following harmonized palette. The palette must feel tonally unified with the background.

- Background: **#ECBA5E** (brand fixed, fills the entire canvas edge-to-edge)
- Skin tones: warm ivory to soft caramel, derived from hues near #F5DBB5, #E5BC8A, #C99263
- Hair: single flat deep tone — choose one from {#2B2420, #3E2F28, #4A3830} based on perceived hair color
- Clothing: one or two muted tones that harmonize with background — from {#6B4B2A, #8B5E3C, #4E3B28, #C68B4D}
- Accent/shadow planes: darker shade of the adjacent base color (use 10–15% darker)

Avoid saturated primary colors (pure red/blue/green). Everything should read as warm earthy autumnal tones.

# SUBJECT FIDELITY vs STYLIZATION BALANCE
Preserve the subject's recognizable features — gender presentation, hair shape and length, skin tone range, clothing silhouette, general face proportions. Translate these faithfully.

However, **do not attempt photographic likeness**. The goal is that a friend would say "that looks like them, stylized." Aggressively simplify individual features into geometric forms:

- Eyes: two simple curved shapes or arcs in the hair tone
- Nose: a single soft gradient edge suggesting the bridge — no nostrils, no tip detail
- Mouth: a simple closed arc or flat shape in a muted tone
- Eyebrows: thin simplified arcs matching hair tone
- Hair: a single flat silhouette mass — no individual strands, no highlights, no gradient
- Skin: smooth color field with at most one soft gradient zone for cheek/jaw shadow

Omit moles, freckles, blemishes, scars, and individual wrinkles entirely. Smooth and idealize the surface.

# COMPOSITION
- Frame: head top of frame to mid-chest bottom of frame
- Pose: perfectly front-facing, symmetrical, shoulders squared
- Expression: neutral, serene, closed mouth, eyes calm — regardless of original photo's expression
- Head position: centered horizontally, slightly above vertical center
- Background: solid #ECBA5E filling every pixel outside the subject

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
- All forms must be defined only by color edges, not by drawn lines
- The overall image should read as a poised, minimalist poster

# NEGATIVE CONSTRAINTS (to avoid)
- No text, typography, letters, numbers, watermarks, or signatures anywhere in the image
- No outlines, contour lines, sketch marks, or pen strokes
- No texture, grain, noise, halftone, or paper fiber effects
- No photo-realistic skin or 3D rendering
- No background objects, scenery, gradients, or patterns — the background is one flat color
- No exaggerated or dramatic expression — always serene neutral
- No full-body, no hands, no lower body

# OUTPUT
Generate only the final image. No text, no explanation, no caption.`;
