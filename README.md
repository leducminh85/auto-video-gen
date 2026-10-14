# 500 IQ — 40-second SVG film

React 18 + TypeScript + Remotion 4.0.535. 1920 × 1080, 60 fps, exactly 2,400 frames. All visible artwork is authored inline SVG, with no embedded frames from the reference video. The reference uses letterboxing; the composition has 56px black bars top and bottom.

## Preview and render

```powershell
npm install
npm run preview
npm run typecheck
npm run render
```

Preview uses port 3001. `npx remotion preview --port=3001` is equivalent. Composition: `IQ500`.

Final output: `out/500-iq-40s.mp4`. The previous 20-second render remains at `out/500-iq.mp4`.

The audio is the first 40 seconds of user-supplied `sample/audio.m4a`, trimmed and encoded to `public/audio/voiceover-40s.m4a`. Playback begins at frame 0 with no offset or speed change. The source files in `sample` remain unchanged.

## Timeline

| Time | Frames (inclusive) | Component | Content |
| --- | --- | --- | --- |
| 0–4.5s | 0–269 | Scene1_Desk | Battery, 31 days, gloves, desk |
| 4.5–7.5s | 270–449 | Scene2_ChipMacro | Chip installation, antenna, LED |
| 7.5–9.5s | 450–569 | Scene3_Elevator | Closed elevator and signal comparison |
| 9.5–14.5s | 570–869 | Scene4_Parking | B3 walk, video call close-up, crowd reaction |
| 14.5–19s | 870–1139 | Scene5_Title | Tea, 60.0°C, title reveal |
| 19–33s | 1140–1979 | Scene6_IQScale | Population curve, 100, 140, 160, travel to 500 |
| 33–40s | 1980–2399 | Scene7_KitchenDialogue | Sink leak, companion/Leo close-ups, TODAY note |

`src/components/Character.tsx` contains the silhouette character rig, cream facial features, blue sleeved hoodie, glasses/scarf, blink, gaze and emotion controls. `Kitchen.tsx` shares the kitchen, seated pose and mug between scenes. Mouth movements are stylized speech animation, not phoneme-level lip sync.

All movement is deterministic from the frame: spring/Bézier/cubic easing for transitions, sinusoidal cycles for gait, blinking and steam. No timers or random state. The IQ graphic is a narrative illustration, not a psychometric measurement of an actual IQ of 500.

Rendered inspection stills are in `out/review40`. The source-video contact sheets in `out/reference*` are inspection aids only and are never imported into the composition.
