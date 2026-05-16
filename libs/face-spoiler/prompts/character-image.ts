/**
 * 관상스포 캐릭터 이미지 생성 프롬프트
 *
 * 설계 원칙:
 * - 긍정 규칙(positive instructions)으로 일관 — "무엇을 하라"만 명시
 * - 구체적 시각 앵커: 다나카 잇코 모더니즘 + 한국 현대 디지털 평면 일러스트
 * - 색 팔레트는 HEX 코드로 고정 — 모델이 따뜻한 톤 안에서만 선택
 * - 인물 유사성(닮음)을 최우선 — "그게 나야!" 반응이 목표
 * - 고정 배경색 #ECBA5E (브랜드 컬러)
 */
export const CHARACTER_IMAGE_PROMPT = `# ROLE
You are a master illustrator producing a poster-grade portrait in the **modern Korean flat-illustration aesthetic** — a refined fusion of Ikko Tanaka's Japanese modernist poster design (geometric simplification, interlocking flat color planes, serene composition, Nihon Buyo-era poster influence) and contemporary Korean editorial illustration (the gentle, restrained, warmly-toned style seen on magazine covers and curated Instagram illustration accounts). The result should feel like the cover of a quiet, elegant lifestyle magazine — intimate, dignified, and instantly recognizable as the specific person in the source photo.

# CORE PRINCIPLE
Every form is defined by **the edges where adjacent flat color planes meet**. Construct the portrait the way a papercut artist assembles interlocking shapes, or the way a screen-printer lays down successive flat color layers. The whole image must read as a **vector illustration poster**, not as a painted portrait and not as a photograph.

# OUTPUT TARGET
Produce a single square (1:1) poster portrait of one person, framed from above the head to mid-chest, centered on a solid **#ECBA5E** background that fills every pixel of the canvas.

# COMPOSITION — place the subject as a small figure inside a generous poster
- Head height (top of hair to bottom of chin) occupies approximately **42–48% of the canvas height**.
- Leave **15–20% of the canvas height** as clear solid background above the hair.
- Leave **at least 15% of the canvas width** as clear solid background on each side of the shoulders.
- Frame ends at mid-chest, showing the neck, both shoulders, and a portion of the upper clothing.
- Pose: front-facing, perfectly symmetrical, shoulders squared and relaxed.
- Head is centered horizontally and vertically inside the canvas.
- Imagine the brief as a **passport-style portrait redrawn as an editorial illustration** — subject centered, breathing room on all four sides.

# EXPRESSION — quiet, alive, warm
- Mouth is gently closed with a barely perceptible upward curve at the corners — a calm, contented resting expression.
- Eyes look softly toward the viewer; they read as alive and present.
- Overall mood: serene, poised, approachable — the kind of expression a person wears when listening to a good friend speak.

# STYLE — modern Korean flat illustration, poster-grade
- Render the subject as a **flat vector illustration**, the way a Monocle magazine cover, a Korean editorial column header, or a Swiss modernist poster would depict them.
- Build every region of the face and body from **clean, hard-edged flat color planes** that meet each other in sharp clean boundaries.
- Sculpt the face using **two to three flat skin tones**: one warm base midtone for the lit side, plus one (or at most two) darker tones placed as distinct shapes on the shadow side of the face — typical placements are the cheek-side, jaw underside, the side of the nose, and the neck under the chin. The shapes of those darker planes are what give the face its volume.
- Hair is rendered as **one solid dark silhouette mass** whose outer outline matches the source photo's hairstyle exactly. One subtle inner parting line, a small fringe shadow at the hairline, or a single quiet inner highlight is welcome when it helps preserve the actual hair structure.
- Clothing is rendered with **one main color plane** plus a **single soft shadow plane** on the shadow side of the chest. Add a simple neckline shape (collar, V-neck, scoop, etc.) consistent with the source photo.
- The overall tonal world is **warm, earthy, autumnal** — every color harmonizes with the #ECBA5E background.
- The image must immediately read as a **flat editorial illustration**, the kind a viewer would tag as "이런 사람" / Monocle / Korean magazine illustration — clearly stylized, never photographic, never 3D-rendered, never a digital painting.

# COLOR PALETTE — strict harmonized set
Choose colors only from the following palette so the portrait stays tonally unified with the background.

- **Background**: #ECBA5E (brand fixed — fills the entire canvas edge-to-edge with no patterns, gradients, or objects).
- **Skin base** (pick one): #F5DBB5, #ECC79A, or #E5BC8A.
- **Skin shadow** (pick one or two, slightly darker than the chosen base): #D4AC82, #C99263, or #B8895A.
- **Hair** (pick one to match the subject's perceived hair darkness): #2B2420, #3E2F28, or #4A3830.
- **Clothing main** (pick one that harmonizes with the skin and background): #F4E4C9, #D9C2A0, #C68B4D, #8B5E3C, #6B4B2A, #4E3B28, or #A53A2E.
- **Clothing shadow**: a 10–15% darker shade of the chosen clothing main color.
- **Lips**: a muted warm rose or coral that sits softly within the skin range (e.g., #C97A6A, #B86A5C, or #A85A4E).
- **Optional cheek warmth**: one soft flat shape slightly more saturated than the skin base — used sparingly when it reads as natural.

# SUBJECT FIDELITY — the most important goal
A friend of the subject must be able to say **"that's clearly [name]"** at a glance. To earn that reaction, preserve the source photo's likeness across the following dimensions.

## Hair — match the source photo exactly
- Keep the **exact hairstyle**: total length, parting direction (left / center / right / none), bangs style (full fringe / side-swept / curtain / none), layering, and overall silhouette.
- Keep the **volume and texture cues**: voluminous and wavy stays voluminous and wavy; flat and straight stays flat and straight; tied-back stays tied-back.
- Keep the **forehead coverage**: if bangs cover the forehead, keep them covering. If the forehead is exposed, keep it exposed.
- Keep the **outer silhouette shape** of the hair against the background true to the source.

## Face geometry — match the source photo exactly
- Preserve the **face shape**: round, oval, square, heart, or long.
- Preserve the **eye spacing and eye size** relative to the face width — wide-set vs close-set, large vs small.
- Preserve the **nose length and bridge height** — long vs short, high vs low.
- Preserve the **mouth width and lip fullness** — wide vs narrow, full vs thin.
- Preserve the **jaw and chin shape** — angular, rounded, pointed, wide, or narrow.
- Preserve the **forehead height** and the location of the hairline.
- Simplify these features geometrically, but keep proportions and relative positions faithful.

## Eyes — render with warmth and life
- Each eye contains a **clearly visible round dark iris** placed inside the eye opening — render it as a solid dark oval or circle so the viewer immediately reads "an eye looking at me."
- Shape the eye opening to follow the subject's **actual eye shape** (round, almond, long, wide-set, close-set, monolid, double-lid).
- Render the upper eyelid as a gentle curve; the lower eyelid as a soft, barely-visible curved line that follows the natural eye contour.
- Eyes look toward the viewer — alive, calm, and friendly.

## Nose
- Place one narrow **soft-edged shadow plane** on the shadow side of the nose to suggest the bridge.
- Indicate the nostrils with one or two tiny darker shapes — keep them minimal and natural.

## Mouth
- Render the lips as two simple flat shapes (upper lip and lower lip) in a muted warm rose / coral that harmonizes with the chosen skin tones.
- Allow a very subtle lift at the mouth corners so the expression reads as quiet and content.

# WHAT TO SIMPLIFY (geometric reduction is welcome here)
- Skin texture, pores, and fine lines → consolidate into clean flat color planes.
- Individual hair strands → consolidate into the single flat silhouette mass.
- Eyelashes → omit; preserve only the iris and the eyelid shape.
- Nostril detail → minimal flat shape.
- Lip detail → flat color shapes only.

# HANDLING SOURCE-PHOTO VARIATIONS
- **Sunglasses or transparent eyewear**: render the eyes that sit beneath, inferred from facial structure and surrounding bone geometry; keep eyewear only when it is clearly a defining personal feature.
- **Mask or partially covered face**: reconstruct the complete unmasked face from visible cues (eyes, forehead, jawline, hair).
- **Side or angled view**: reconstruct a front-facing version of the subject based on the visible features. The output always faces the viewer directly.
- **Hat**: keep it only when it defines the silhouette; otherwise render the natural hair in its place.
- **Earrings, necklaces, piercings, and other jewelry**: omit.
- **Background scenery, props, or other people**: ignore — only the single most prominent subject transfers to the output, and the background is filled with solid #ECBA5E.

# QUALITY MARKERS OF A SUCCESSFUL OUTPUT
- A friend of the subject recognizes them instantly from the portrait.
- The image reads unmistakably as a **flat vector poster illustration** at the level of a Monocle cover or a Korean editorial illustration column.
- All color transitions are **sharp clean edges between flat color planes**.
- The face feels **warm, calm, and approachable** — alive, never blank.
- The composition feels **spacious**: the head sits inside a generous frame of #ECBA5E background, with breathing room on all four sides.
- The background is one uniform #ECBA5E filling every pixel outside the subject.
- The aspect ratio is exactly **1:1 square**.

# OUTPUT
Generate only the final image. Return no text, caption, or explanation.`;
