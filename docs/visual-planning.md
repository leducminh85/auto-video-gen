# Content-driven visual planning

The planner uses the supplied title, full-script context, scene narration and beat narration. There are no subject-specific action recipes, prop dictionaries or illustration renderers. `dentalFallback.cjs` has been removed.

The AI planner receives recent visual plans across scene boundaries. It chooses subjects, actions, objects and settings from the content. Prompts share whiteboard stick figures, black outlines, white background and amber highlights. Near-duplicate descriptions are rejected using word overlap; this does not guarantee that generated images will be visually distinct.

If AI planning is unavailable, offline planning preserves the exact narration and selects a presentation based on general relationships: comparison, process, cause and effect, change, detail or explanation. It varies framing using recent history. It does not invent objects or pretend to understand every topic through keyword matching. The image provider interprets the resulting source-grounded prompt.

If all image providers fail, every subject receives the same neutral SVG narration fallback. It preserves source text rather than substituting an unrelated stock illustration. This fallback is not an AI-generated illustration and is not intended to provide the same visual quality.

Generic titles such as “Kịch bản video” are excluded from topic context. Script context is retained rather than mapped to a fixed list of industries. Context sent to the planner is limited to 12,000 characters.

## Verification

```sh
node --test scripts/visualBeatPlanner.test.cjs
npm run lint
npm run build
node scripts/previewVisualPlans.cjs public/scenes.json /tmp/studio-visual-plan-preview
```

Tests cover multiple subjects, including geology, satellites, education, baking, wildlife and dentistry. They verify source preservation, shared style, cross-scene history and the absence of predefined props. Provider responses are mocked; live image quality has not been verified.

The preview command writes plans and fallback SVGs without network requests. Existing images and project data remain unchanged. Generate a new video to use the updated planning flow; regenerating an old individual image still uses its saved prompt unless edited.
