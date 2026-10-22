# Stickman Video Style Guide — 500 IQ

Document version: 1.1 · Updated: 2026-10-21 · Style ID: `STICKMAN_500IQ_V1`

## 1. Purpose and references

Use this guide to create additional scenes in the same series. Settings, actions, and dialogue may change while character identity, visual language, animation, and effects remain consistent.

This guide is based on reference-video stills in `out/reference-contact.jpg`, the current render `out/review40/leo.png`, and the project's components and animation code. It defines continuity with the current SVG production, not a pixel-perfect reproduction of the reference.

- Original reference: `sample/sample-video.mp4`.
- Current production: `out/500-iq-40s.mp4`.
- Character rig: `src/components/Character.tsx`.
- Shared colors, lighting, props, and effects: `src/components/Art.tsx`.
- Kitchen and seated poses: `src/components/Kitchen.tsx`.
- Animation helpers: `src/lib/motion.ts`.
- Current timeline: `src/Root.tsx` — 40 seconds, 2,400 frames.

`SCENE_SPEC_20S.md` is an older 20-second specification. Do not use its timings to overwrite the current timeline. Recommended timings below are starting points for new scenes, not measurements from the reference video.

## 2. Core visual style

Narrative and explanatory animation using silhouette stick figures, clean 2D vector illustration, and subtle depth. Characters have solid round black heads, long slender limbs, and expressive cream-colored facial shapes. Leo's royal-blue hoodie stands out against muted environments. Backgrounds identify the location through clean geometry, simple perspective, restrained gradients, soft shadows, and thin rim lighting.

The tone is intelligent, composed, and lightly humorous. Small actions and reactions communicate ideas. Editing moves from establishing views to details and facial reactions. Information graphics appear when narration introduces them. Effects clarify causes, outcomes, and points of attention.

**Reusable short description:**

> Clean 2D vector silhouette-stickman animation: round black heads, cream facial features, Leo in a royal-blue hoodie, long slender limbs, muted geometric environments, soft lighting with a warm rim, cinematic composition, restrained movement, readable information graphics, and localized glow.

## 3. Elements to lock across scenes

| Element | Fixed rule | May vary |
| --- | --- | --- |
| Leo | Round black head, cream face, blue hoodie, slender black limbs | Pose, expression, gaze, props |
| Artwork | Clean vectors, rounded line caps, simple shapes | Location, objects, perspective |
| Color | Blue identifies Leo; muted backgrounds; clear facial contrast | Warm or cool environment |
| Lighting | Gentle gradients, soft shadows, selective rim light | Direction justified by the setting |
| Camera | Readable composition and purposeful movement | Wide, medium, close-up, macro, overhead |
| Effects | Limited layers, consistent colors, narrative purpose | Appropriate effect type |
| Format | 1920 × 1080, 60 fps, 56 px top/bottom letterbox | Scene duration |

Phones, kitchens, the number 500, and IQ charts belong to particular stories. New scenes do not require them to retain the style.

## 4. Detailed character design

### 4.1. Leo — protagonist

- Solid near-black circular head, `#080810`; no realistic skin, nose, ears, or hair.
- Cream eyes and mouth, `#FFF1D6`, readable at reduced viewing sizes.
- Optional thin warm rim arc, `#FBC484`, on the illuminated side; no complete glowing halo.
- Short neck, tapered torso, long limbs. Hands are rounded black shapes; close-ups may show simplified fingers for an action.
- Royal-blue hoodie, long sleeves, hood behind the neck, two cream drawstrings, front pocket, minimal hem and fold details.
- Black legs and feet built from thick rounded strokes, without muscular or anatomical detail.
- Calm, confident, intelligent personality: slightly narrowed eyes, a subtle asymmetric smile, relaxed posture.

### 4.2. Existing rig proportions

Values are SVG units at `scale=1`, not fixed screen dimensions.

| Part | Reference |
| --- | --- |
| Head | Radius 60; diameter 120 |
| Top of head to feet | Approximately 510 units, or 4.25 head diameters |
| Neck | Stroke approximately 18 |
| Legs / feet | Strokes approximately 20 / 22 |
| Leo's sleeves | Outer stroke 33; inner blue stroke 27 |
| Mouth line | Approximately 4.5 |
| Head rim light | Approximately 3 |

Scale the whole rig to preserve proportions. Do not stretch the head or torso independently to fill a shot. Seated poses reduce overall height through bent joints while retaining corresponding head size and limb thickness.

### 4.3. Expressions

| State | Eyes | Mouth and posture |
| --- | --- | --- |
| Calm | Gently open | Short mouth line, relaxed shoulders |
| Confident | Slightly narrowed and angled | Subtle one-sided smile |
| Pleased | Two curved arcs | Wider smile, slight head tilt |
| Annoyed | Narrow, lowered corners | Flat or slightly downturned mouth |
| Surprised | Wide ovals | O-shaped mouth, brief reaction |
| Speaking | Preserve underlying emotion | Simple rhythmic opening and closing |

Existing emotion values: `calm`, `confident`, `pleased`, `annoyed`, `surprised`, `talking`. The separate `talking` flag controls mouth movement. Speech animation is stylized, not phoneme-level lip sync.

Blinks are brief and occasional. The current rig repeats a 203-frame cycle, blinking within frames 176–190. Offset phases across characters to avoid synchronized blinking. Gaze points toward the interaction target.

### 4.4. Supporting characters

- Crowds use dark gray-purple silhouettes, `#302B3C`, with less detail than Leo.
- Add clear eyes and mouths when a reaction matters.
- Preserve the companion's round light-colored glasses and cream scarf in later appearances.
- Distinguish new characters through one or two features: glasses, scarf, geometric hair, or a secondary clothing color. Retain round heads and slender limbs.
- Avoid giving supporting characters Leo's prominent blue hoodie without a story reason.

## 5. Color and materials

Values follow the current code, not exact color measurements from the original video.

| Role | Color |
| --- | --- |
| Leo's head and hands | `#080810` |
| Face and drawstrings | `#FFF1D6` |
| Main hoodie | `#2563EB` |
| Hoodie gradient | `#60A5FA` → `#2563EB` → `#163EA6` |
| Warm rim light | `#FBC484` |
| Success, signal, LED | `#22C55E` |
| Error, lost signal | `#EF4444` |
| Gold accent | `#FFD700` |
| Prominent title | `#FFF3A3` → `#FFBB39` → `#F97316` |
| Dark graphic background | `#22203D` → `#0B0F19` |
| Wood | `#8C6650` → `#6D4C41` |
| Metal | `#94A3B8` → `#4A5568` → `#2D3748` |
| Parking garage | `#1F2937`, blue-gray accents |

Domestic environments use beige, cream, wood brown, and desaturated sage. Technical environments use blue-black, cool gray, metal, and occasional green highlights. Explanatory graphics use navy/purple-black, cream text, and gold emphasis.

Suggest materials with a few grain lines, highlighted edges, and gradients. Avoid photographic textures, strong mirror reflections, and plastic-looking 3D surfaces. Desaturate or shift blue backgrounds so Leo's hoodie stays distinct.

## 6. Environments, composition, and lighting

### Environments

Build walls, floors, doors, columns, furniture, and objects from clear geometry. Use foreground, character, and background layers for depth. Reduce detail behind faces and text. Keep perspective consistent across floors, furniture, and props.

A few features should establish the location: a sink and cabinets for a kitchen, shelves for a library, instruments for a laboratory. Avoid unnecessary decoration.

### Lighting

- One understandable primary light direction: window, ceiling fixture, or screen.
- Soft contact shadows beneath feet, chairs, and props to avoid floating.
- Thin rim lighting separates black heads from backgrounds without changing their apparent shape.
- Backgrounds may soften in close-ups; eyes and mouths stay sharp.
- Restrained edge vignette; current maximum edge opacity is 0.35.
- Existing warm-light definition reaches approximately 0.12 opacity. Preserve the recognizable blue hoodie.

### Camera and framing

- 16:9, 1920 × 1080, 60 fps.
- Black bars are 56 px tall; picture region is y=56…1024.
- Suggested important-text region: x=96…1824, y=110…970; verify actual text dimensions.
- Wide shots establish location; medium shots explain actions; close-ups reveal emotion; macro shots explain mechanisms or readings.
- Suggested gentle push-in: scale 1.00 → 1.05–1.12. Larger zooms need a narrative reason.
- Preserve gaze and travel direction across cuts; re-establish geography before reversing direction.
- Avoid constant shake and 3D orbits around flat characters.

## 7. Animation and editing style

Movement needs a start, an emphasis, and a pause for comprehension. Camera, hands, text, and multiple effects should not all compete for attention.

**Suggested rhythm for 5–8 seconds:**

1. First 15–20%: establish setting and objective.
2. Middle 45–55%: perform one main action.
3. Next 20–25%: show outcome or expression.
4. Remaining time: hold for reading and connect to the next scene.

Adjust to narration instead of stretching a scene to satisfy percentages. Usually introduce only one prominent new idea per shot.

### Animation language

- Use smooth easing for pans, zooms, and major movement.
- Existing `smoothCamera`: Bézier `(0.25, 0.1, 0.25, 1)`; `easeOut`: cubic.
- Text/icons/callouts may spring in: damping 12, mass 0.5, stiffness 140.
- Keep overshoot small and settling quick; avoid rubbery characters.
- Alternate legs, add restrained body bob, and coordinate arms with props. Match stride cadence to distance to prevent sliding.
- Held objects stay attached to the correct hand. Prevent intersections with cups, phones, and tables.
- Brief anticipation may precede action: look at the target, lift a hand, then act.
- Idle motion needs only breathing, blinking, and slight head tilts, not constant body swaying.

### Transitions

Favor action-matched cuts, inserts, and shot/reverse-shot for dialogue. Fade into darkness for abstract ideas or titles; suggested duration 0.25–0.55 seconds. Avoid excessive glitches, page turns, white flashes, and elaborate transition stacks.

## 8. Effects specification

Durations are suggested defaults at 60 fps. Every effect has a clear origin and ending.

| Effect | Appearance | Timing and limits |
| --- | --- | --- |
| Device glow | Sharp core, soft green/gold halo | Activate over 8–18 frames, hold steadily, keep local |
| Success signal | Sequential green bars/icons | Offset bars by 5 frames, as in `Signal` |
| Error | Red icon, short label, one emphasis pulse | 12–24 frames then hold; avoid repeated harsh flashing |
| Contact spark | Short lines and a bright contact point | 3–8 frames, small, no explosion |
| Steam | About 6 soft cream curves, offset phases | Slow rising loop and fade; keep faces clear |
| Callout | Rounded/circular frame with connector | Pop in over 12–24 frames, hold for reading |
| Scan | Thin low-opacity circles/lines | 1–2 cycles only when detection is relevant |
| Chart drawing | Thin line revealed left to right | 45–105 frames, labels follow narration |
| Number emphasis | Small scale change and gold glow | 12–24 frames then steady hold |
| Speed lines | Sparse thin low-opacity horizontal strokes | During rapid/long travel; stop with camera |
| Depth of field | Gentle background blur | Separate subjects; keep important text sharp |

### Existing parameters

- `glow`: Gaussian blur 9, merged with the original for a sharp core.
- `soft`: Gaussian blur 5, suitable for steam.
- `depth`: Gaussian blur 3 for backgrounds.
- `shadow`: y offset 18, blur 18, opacity 0.35.
- Steam: sinusoidal horizontal drift about 10 units, rise about 110, maximum opacity 0.45, scale 0.5 → 1.3.

Values use SVG coordinates. Inspect output after scaling groups so blur/glow do not become excessive. Expand filter regions to avoid clipped halos.

## 9. Typography and information graphics

- Arial, with Helvetica and sans-serif fallbacks.
- Bold titles and primary numbers; short labels and few lines.
- Cream/off-white standard text, gold-orange for climactic information.
- Uppercase titles may use moderate tracking. Avoid wide tracking for entire Vietnamese paragraphs when localizing.
- Reference sizes: secondary title 64 px; large numbers/titles 128–148 px. Start new important labels around 28–40 px and inspect at small viewing size.
- Emphasize one primary reading at a time. Avoid dense decorative HUDs.
- Charts use thin cream/gold lines, simple axes, sequential labels. Contextualize hypothetical illustrations rather than presenting them as measured data.
- Add exact typography in post-production when needed instead of relying on text generated inside video images.

## 10. Audio and narration

These are recommendations for new scenes, not an analysis of the reference soundtrack.

- Narration/dialogue determines action and information timing.
- Use concise event-based clicks, beeps, light whooshes, contacts, and drips.
- Music stays below speech, preserving consonants; avoid a climax in every shot.
- Do not change narrator voice or speaking rate between adjacent scenes without a reason.
- Current audio: `public/audio/voiceover-40s.m4a`, starting at frame 0, limited to 2,400 frames. Additional narrated scenes need corresponding audio; the old track does not automatically extend.

## 11. Style deviations to avoid

- White outlined heads, human skin tones, realistic facial anatomy.
- Chibi proportions, muscular bodies, or inconsistent proportions between shots.
- Unrequested changes to Leo's hoodie color, drawstrings, or outfit.
- Glossy 3D, detailed anime, shaky pencil lines, oil painting, pixel art.
- Full-frame neon, blown-out bloom, large flares, dense particles, obscuring smoke.
- Oversaturated/detailed backgrounds and tiny labels.
- Continuous camera movement adding no information.
- Foot sliding, unexplained prop-hand switching, incorrect gaze, changing light direction within a shot.
- Cuts before viewers finish reading or long holds without purpose.

## 12. Using this guide for future scenes

### In the same project

1. Ask the tool to read this guide before designing.
2. Supply story, duration, dialogue, and continuity from the preceding scene.
3. Reuse the existing rig, palette, effects, and motion helpers.
4. For new environments/characters, inspect a wide frame and close-up before full rendering.
5. Check opening, middle, ending, effect peaks, and connections to existing scenes.

### In another conversation or tool

Attach this guide with 2–4 images: Leo close-up, full body, environment, representative effect. Choose suitable images from `out/review40/`. If the original reference takes priority, use `out/reference/` and explicitly state that preference.

Text does not guarantee exact generative reproduction. References and rig reuse improve consistency. Keep character references and seeds when supported, recording settings; a seed is not an absolute guarantee.

Do not rely solely on “same style as last time.” Resupply the guide and images because a new session may lack history or access to old paths.

### Copyable request

```text
Read STYLE_GUIDE_NGUOI_QUE.md and apply STICKMAN_500IQ_V1.
Create a scene in the same series, preserving Leo and the visual system.

Content: [What happens?]
Setting/time: [Location, day/night]
Characters: [Leo and whom?]
Duration: [N seconds], 1920x1080, 60 fps, 56 px top/bottom letterbox.
Narration/dialogue: [Exact wording, or none]
Main action: [One clear action]
Opening → closing emotion:
Props:
Readable text: [Exact wording]
Effects: [Type, origin, timing]
Previous-scene continuity: [Position, gaze, props, unfinished action]
Ending state for the next scene:
Priority references: [Paths or attachments]
Output: [Remotion code / video / storyboard / keyframes]

Reuse project components. Retain head/limb proportions, blue hoodie,
cream face, soft lighting, muted colors, restrained motion, local glow.
Resolve unspecified details using this guide and state assumptions.
```

### Example: six-second library scene

```text
Apply STYLE_GUIDE_NGUOI_QUE.md, STICKMAN_500IQ_V1.
Create 6 seconds (360 frames) with Leo in a library in the afternoon.
Keep his blue hoodie, round black head, cream eyes/mouth.
Muted brown and sage shelves; warm window light from the right.

0–1.2s: Medium shot beside a table, Leo looking at an open book.
1.2–3.6s: Right hand turns a page and stops at a diagram; left hand
holds the book edge. Camera pushes in gently.
3.6–5s: Diagram close-up. A thin gold line draws along it;
a small endpoint glow communicates finding the solution.
5–6s: Close-up of Leo's confident smile, gaze down at the book.

No dialogue/text. Page-turn sound and soft beep at endpoint glow.
End with right hand on the page. 1920x1080, 60 fps, series letterbox/palette.
```

## 13. Remotion implementation

- Add scenes in `src/scenes/`; use `Stage` for shared gradients, filters, vignette.
- Reuse `Stickman`, `Face`, `Phone`, `Signal`, `Steam`. Set `phone={false}` without a phone; the current default includes one.
- Reuse `Kitchen`, `SeatedLeo`, and related rigs rather than redrawing for a new shot.
- Use `useCurrentFrame()` and `useVideoConfig()`. Derive animation from frames, without timers or unseeded randomness.
- Use `smoothCamera`, `easeOut`, `popIn` from `src/lib/motion.ts`.
- Use scene-local frames; pass explicit offsets for movement/blinks continuing across cuts.
- Update composition `durationInFrames` when extending `TIMELINE`. N seconds = `round(N × 60)` frames.
- Review audio and `trimAfter` beyond 40 seconds.
- `IQ500` adds letterbox globally; do not duplicate it inside scenes. Standalone previews need equivalent framing.
- Run `npm run typecheck`, render key stills, then video. Watch motion to assess pacing, sliding, and continuity; stills cannot verify these.

## 14. Scene review checklist

- [ ] Leo remains recognizable: black head, cream face, blue hoodie, slender limbs.
- [ ] Proportions and strokes match previous scenes.
- [ ] Location is recognizable without overpowering the subject.
- [ ] Faces/props read at small viewing sizes.
- [ ] Light, shadows, and gaze are coherent.
- [ ] Each shot has a primary focus.
- [ ] Hands contact props correctly without intersections or unexplained switching.
- [ ] Effects align with events and preserve faces/text.
- [ ] Text is correct, held long enough, and clear of letterbox.
- [ ] Motion settles smoothly without excessive bounce/shake.
- [ ] Ending connects in position, direction, and prop state.
- [ ] Resolution, fps, duration, and audio are correct.

## 15. Continuity record

Save alongside each scene description:

```text
Scene ID:
Style: STICKMAN_500IQ_V1
Duration/frame range:
Characters/clothing:
Final position/gaze:
Left hand action/object:
Right hand action/object:
Final expression:
Prop states:
Light source/direction:
Final shot/camera motion:
Audio continuing into next scene:
Final-frame image/path:
Explicitly requested style exceptions:
```

Keep the style ID when adding content without changing the visual system. For intentional character/overall style changes, create a new version and document differences to prevent accidental mixing.

## 16. Complex effects: coordination principles

**Reference scope:** The local `sample/sample-video.mp4` is 40.5 seconds long. A contact sheet sampled every two seconds did not show the rain or flying-bullet sequence mentioned by the user. Sections 16–20 are proposed extensions compatible with the current style, not confirmed reproductions of those effects. When the correct clip or timestamps are available, compare shape, density, speed, camera behavior, and slow-motion timing. Values below are animation starting points, not physical measurements or parameters extracted from the reference.

Complex effects retain clean vector shapes, muted colors, and restrained highlights. Complexity comes from coordinated depth, occlusion, movement, environmental response, audio, and camera timing.

Default layer order:

1. Distant environment and lighting.
2. Distant effects behind characters.
3. Props and characters, including surface-attached effects.
4. Near effects that may pass in front of characters.
5. Readable text and callouts.
6. Vignette and letterbox.

Separate **world coordinates** from **screen coordinates**. Outdoor rain, projectiles, and impact points belong to the world and respond to camera movement. Labels may remain screen-fixed. Do not attach rain to the camera or let impact points drift away from their surfaces.

## 17. Falling rain, wet ground, and splashes

### 17.1. Overall appearance

Rain consists of thin elongated strokes angled with the wind, using low-opacity blue-gray or cool white. Do not draw every drop as a large teardrop. Individually readable droplets belong in macro or slow-motion shots. Cool dark backgrounds and selective reflective edges suggest wet weather without whitening the frame.

Leo's hoodie remains visibly blue. Lower overall illumination and add a few wet highlights on shoulders and hood if appropriate, without turning the clothing black or adding photographic fabric/skin textures.

### 17.2. Three depth layers

Suggested values at 1920 × 1080. Speeds are pixels per second of simulation time:

| Layer | Visible stroke count | Length / thickness | Opacity | Falling speed |
| --- | --- | --- | --- | --- |
| Far | 100–180 | 8–18 px / 0.7–1 px | 0.08–0.18 | 350–550 px/s |
| Middle | 60–100 | 18–36 px / 1–1.6 px | 0.16–0.32 | 650–950 px/s |
| Near | 15–35 | 35–70 px / 1.5–2.5 px | 0.20–0.40 | 1,100–1,600 px/s |

These densities suggest moderate rain. Reduce both count and opacity when expressions need priority. Near strokes may use 0.5–1.5 px blur; middle strokes remain crisp. Do not apply neon-green `glow` to rain.

- Default direction: 8–18° from vertical, with consistent wind across layers.
- Vary position, speed, and length slightly using a fixed seed.
- Avoid rows; offset respawn phases to prevent synchronized waves.
- Spawn outside the frame and cover the camera movement range.
- Preserve occlusion around Leo. Mask outdoor rain within window openings; do not let it pass through walls, roofs, or window frames.

### 17.3. Surface contact and wetness

Create splashes at only some visible contacts, rather than bursting every drop.

- Ground splash: 2–5 short outward strokes, lasting 6–12 frames at normal speed.
- Puddle ripple: thin ellipse expanding from approximately 4 to 20–35 px over 18–36 frames while fading. Flatten it according to floor perspective.
- Roofs, shoulders, table edges: small splashes originate on the surface; runoff follows edges before falling.
- Wet reflections: interrupted, low-opacity vertical color shapes, not perfect mirrors.
- Footstep ripples trigger exactly when and where the foot contacts the ground, not on an independent timer.

### 17.4. Motion and time

For particle i, a simple lifetime model is `p_i(t) = p0_i + v_i × (t - birth_i)`. Time is in seconds; do not multiply pixels-per-second values directly by frame numbers. Respawn expired particles outside the frame or in the emission region, without visible mid-frame teleportation.

Slow simulation time so rain, splashes, and ripples slow together. Shorten motion streaks with displayed velocity; unchanged long streaks can still look fast.

Audio suggestion: steady rain ambience plus selected roof taps or drips. During slow motion, lower ambience and emphasize a few drops rather than sounding every particle.

### 17.5. Errors to avoid

Snow-like round floating particles; identical speeds; airborne ground splashes; rain passing through roofs; puddles facing the screen instead of lying on the ground; obscured faces; loop jumps during camera movement.

## 18. Flying bullets, motion trails, and bullet time

### 18.1. Projectile design

Use a small stylized metal shape: streamlined body, gently rounded or pointed nose, one highlighted edge, one shaded face. Colors may be steel gray or muted brass such as `#A78552`, with cream highlights and dark-brown shadows. Do not turn it into a fireball or laser unless required by the story.

At normal speed, a short streak mainly communicates direction. Reveal the body clearly in slow-motion close-ups. Suggested close-up length: 24–60 px, a storytelling enlargement rather than physical scale. Record magnification changes between shots.

For a projectile already in flight, do not depict the whole cartridge case attached like a rocket. A casing, if shown, is a separate prop.

### 18.2. Three animation modes

| Mode | Treatment | Suggested timing |
| --- | --- | --- |
| Fast flight | Small body, trailing streak, clear direction | Cross picture region in 3–8 frames |
| Slow motion | Clear body, subtle highlight, shorter trail, slow environment | Extend event across 60–180 frames |
| Tracking camera | Projectile near a stable screen position, background moves backward | 30–90 frames, adjusted to narration |

These timings are stylized. Do not interpret screen speed as real projectile velocity.

In bullet time, slow the world while allowing gentle camera movement for inspection. For the current 2D rig, prefer lateral tracking, subtle parallax, and small scale changes. Avoid 360° orbit moves that deform flat characters.

### 18.3. Trajectory and trail

- Use a straight path or an intentionally subtle curve for short shots.
- Define start, destination, and frames at key positions before effects.
- Rotate the body along the path tangent using successive positions or the curve derivative.
- Keep the trail **behind** travel direction, following past positions; do not extend it equally ahead and behind.
- Use 2–4 fading historical copies or a tapered gradient path. Avoid distinct repeated bullets implying multiple shots.
- Sample history at `p(t-Δt)`, never future positions. Clip samples before projectile birth.
- A dashed trajectory is an explanatory overlay, distinct from the physical trail and timed to narration.
- Ordinary projectiles have no engine: do not automatically add flame tails, long smoke plumes, or shockwave rings.

Prefer directional motion blur over uniform Gaussian blur. Keep the nose crisp in slow motion as a visual focus.

### 18.4. Consistent slow motion

Separate **video time**, `t_video = frame / fps`, from **simulation time**, `t_sim`. With speed multiplier `s(t)`, compute:

```text
t_sim(t) = integral of s(u) from 0 to t
```

Do not use `t_sim = t_video × s(t_video)` when the multiplier changes: positions can jump or reverse. Use continuous piecewise time mapping or deterministic accumulation from frame 0.

Example: world speed 1.0 → 0.08 → 1.0, transitioning over approximately 8–16 frames. Use the same `t_sim` for projectile, rain, dust, and splashes belonging to the slowed world. Camera and text may use separate video time. Do not slow narration without instruction.

If Leo reacts at a different speed for storytelling, explicitly record that stylization. Do not accidentally slow the projectile while rain, clothing, and other objects stay fast.

### 18.5. Impact and environmental response

For object impacts:

1. Projectile reaches the contact point.
2. Small flash or a few impact strokes appear for 2–4 frames.
3. Material-appropriate dust, fragments, or sparks spread and fade over 12–30 frames.
4. Preserve resulting object state if the story requires it; do not immediately reset it.

Metal may produce small sparks, walls dust, water splashes. Avoid identical explosions for every material. Hide the projectile after contact unless penetration or bouncing was specified.

For fast travel, check the segment from `p(frame-1)` to `p(frame)` against the surface. Testing only discrete positions can miss contact. This animation check prevents unintended pass-through.

Use shake only for an impact worth emphasizing: suggested 2–5 px over 6–10 frames, decaying quickly. Keep text and letterbox stable. A source flash appears briefly at the source, never following the projectile.

### 18.6. Sound

Time audio to events: source sound if present, pass-by near camera, contact at impact. Stereo position may follow travel direction. Do not repeat whooshes every frame or use a large explosion for every trajectory.

## 19. Example combining rain and a flying projectile

This is a proposed extension, not a reconstruction of confirmed reference footage.

```text
Apply STYLE_GUIDE_NGUOI_QUE.md, STICKMAN_500IQ_V1.
Create 6 seconds, 1920x1080, 60 fps, 56 px top/bottom letterbox.
Leo wears his blue hoodie in a simulated training yard in the rain.
Muted blue-gray environment, subtle warm rim, metal target on the right.
A projectile crosses open space in front of Leo and hits the target,
without contacting a person.

0–1.2s: Medium shot establishes Leo, three rain layers, and puddles.
1.2–1.5s: Projectile enters from the left; world time slows.
1.5–3.7s: Close-up tracks horizontally in slow motion. Rain slows
with the projectile; clear body, short trail, no flame.
3.7–4.5s: Widen to include target; world speed rises smoothly.
4.5–5s: Target contact, small spark burst, brief camera shake.
5–6s: Hold outcome; normal rain resumes; Leo looks toward the target.

Preserve trajectory/target continuity, clothing color, head proportions,
face design, and limb thickness. No dialogue/text.
Use rain ambience, short pass-by, and contact sound.
```

### Reusable effect request form

```text
Primary effect: [Rain / projectile / combined]
Intensity: [Light / moderate / heavy]
Far, middle, near layers:
Source and destination region:
Wind/travel direction:
Occluding surfaces:
Contact surface and response:
Start / peak / end frames:
Slow-motion interval and multiplier:
Objects sharing simulation time:
Fixed or tracking camera:
Features that must remain clear: [Face / prop / text]
Sounds at event markers:
Seed and chosen parameters:
Reference clip and timestamps, if available:
```

## 20. Implementing and reviewing complex effects

- Suggested components: `RainField`, `RainSplash`, `WaterRipple`, `Bullet`, `BulletTrail`, `ImpactBurst`. These are proposed names; this document does not implement them.
- Effects accept seed, simulation time, birth time, lifetime, and visual settings. Do not generate fresh `Math.random()` values every render.
- Calculate particles at any frame, including parallel renders and timeline seeking, without requiring execution of the previous frame.
- Generate fixed particle data; derive positions/opacity from time. Reuse paths/symbols rather than hundreds of separate filters.
- Blur depth groups where suitable; check render cost before raising density. Reduce effects near faces before brightening characters.
- For continuous rain, preserve seed/time offset or deliberately re-establish the field for a new angle. Do not reset all lifetimes during a continuous shot.
- Inspect frames before/during/after speed transitions, contact, particle expiration, and cuts.

Additional checklist:

- [ ] Rain has depth, consistent wind, correct occlusion.
- [ ] Splashes/ripples originate on their surfaces.
- [ ] Projectile orientation follows its path; trail stays behind.
- [ ] Simulation time changes continuously without teleportation/reversal.
- [ ] Rain/environmental effects slow together during bullet time.
- [ ] Contact is neither skipped between frames nor shown before arrival.
- [ ] Blur/glow preserve projectile shape, faces, and text.
- [ ] Tracking preserves direction and spatial relationships.
- [ ] Audio matches events; visuals remain understandable when muted.
- [ ] Review full motion, not only stills.
