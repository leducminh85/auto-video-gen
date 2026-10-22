# Remotion choreography

Reference breakdown: [REMOTION_REFERENCE_DIRECTION.md](REMOTION_REFERENCE_DIRECTION.md).

The planner now builds a film-wide cast/location/story bible before segmenting narration by events. Each scene's cuts are designed together after its audio duration is known. The next scene receives the previous final shot's full design, the bible and the complete outline. Shot weights allocate the existing scene audio without gaps or overlaps. The bible and outline are saved in project metadata.

The renderer remains declarative; ChatGPT output is validated data, never executed source code. Existing version 1 projects and two-endpoint motion remain supported.

## Animation data

Motion fields accept a number, `{from,to,start,end}`, or `{keys:[{at,value,ease}]}`. Key times are normalized to the shot, strictly increasing, with 2–32 keys. Easing belongs to the segment starting at that key: `smooth`, `linear`, or `hold`. Holds provide anticipation, contact and pauses without introducing frame-dependent state.

Characters support independent local hand coordinates, head tilt, seated legs, stride phase and timed speech. Children attached to `leftHand` or `rightHand` use the same evaluated hand endpoint as the rig. Walking without an explicit stride derives its phase from horizontal displacement, so a stationary character does not keep walking. Supporting characters have readable faces. A prop's pickup still requires coordinated visibility of its world and attached representations.

Numeric SVG attributes can animate through `animate`; tags, attributes, paint and nested shapes remain allowlisted. Background `blur` can animate for a focus change. Authored `kitchen` and `mug` components reuse the reference project's artwork. Kitchen `leak:true` keeps the open cabinet; animated `flow:0` stops the water without making the cabinet disappear.

Camera `focusX` / `focusY` specify the world point placed at screen centre. The transform is `(world - focus) * scale + screenCentre + offset`. This avoids guessing the sign of a zoomed camera translation. Legacy `x/y/scale` still work with the screen centre as the default focus.

The studio edits hand coordinates, pose and speech endpoints, and existing intermediate keys including their timing and easing. Endpoint edits preserve intermediate keys.

## Visual verification assets

- `scripts/remotion-direction-study.cjs`: 16-second authored action study, including hand contact, a repaired pipe, reaction closeup and a held cup. It is a renderer study, not an example of automatic ChatGPT output.
- `scripts/rebuild-iq-story.cjs`: authored replacement storyboard for the user's existing 14-scene IQ 1000 project. Preserves the original narration/audio/timing and creates a separate project; subsequent runs update that generated copy. It is deliberately specific to this script and is not a generic story generator.
- `scripts/preview-direction.tsx`: fast static contact sheet for the authored IQ storyboard. Actual MP4 exports must also be inspected for motion and continuity.
- Real ChatGPT generation was exercised with a five-scene pipe-repair story. It produced nine cuts and a 21.18-second export. Visual review revealed framing and seated-pose issues, leading to the camera focus controls and rig corrections. This test does not establish that automatic output always matches the reference film's quality.

## Checks

```powershell
npm run lint
npm run build
node --test scripts/remotion.test.cjs scripts/remotion-motion.test.cjs
node scripts/remotion-ui.test.cjs
node -e "require('esbuild').buildSync({entryPoints:['scripts/remotion-motion-render.test.ts'],bundle:true,platform:'node',packages:'external',loader:{'.css':'empty'},outfile:'data/reference-study/motion-test.cjs',jsx:'automatic'})"
node --test data/reference-study/motion-test.cjs
```

The browser test checks endpoint/intermediate-key edits, persistence, revision, duplication, undo and mobile overflow. The render test checks holds, seeking determinism and hand attachment transforms. The authored export is 1080p/60 fps; its audio is reused from the original project. Dev runs on port 5173 with strict port selection.
