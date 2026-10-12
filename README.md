<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2ae53aff-fb2b-4d78-ae11-ddd11f558d61

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Open Google AI Studio from the app's provider settings and sign in in the Playwright browser window.
3. Run the app:
   `npm run dev`

## AI scene and image planning

Video generation uses `scripts/aiProductionPlanner.cjs`. Gemini plans scene boundaries from the complete narration, then chooses image boundaries, visual ideas and image prompts using each scene's measured audio duration. Each request includes the full narration, scene outline, shared continuity instructions, selected style and all previously accepted image plans.

Planning and review use Google AI Studio's web interface through Playwright, sharing the existing browser profile and tab pool with image generation. No API key is required for planning. The default model is `gemini-3.8-flash`; set `AI_STUDIO_PLANNING_MODEL` to select another model available in your Studio account. The selected model is verified before submitting. Each request starts a new chat with the full context and JSON schema, waits for the completed response, then validates JSON locally. `AI_STUDIO_PLANNING_TIMEOUT_MS` defaults to 180000. An internal Studio error retries once in a fresh chat. Repeated internal errors, quota errors or timeouts switch to `gemini-3.5-flash-lite` in Studio, with visible progress messages. Set `AI_STUDIO_PLANNING_FALLBACK_MODEL` to another available model or an empty value to disable this fallback. A successful model is reused for the remaining requests. Login, model selection and invalid-response errors do not trigger model switching; planning never switches to an API or local plan.

AI selects scene and image starts using explicitly numbered source words. The server derives each end from the next start (or the end of the script) and reconstructs the original narration, so no ending can be dropped by an off-by-one index. Invalid, repeated or reordered starts are rejected. AI separately reviews every candidate for fidelity, coherence, repetition and whether it can be illustrated, quoting evidence from that item's narration. Rejected candidates receive the findings and get up to three planning attempts. Image density targets (6, 4 or 2.5 seconds) are advisory: longer or shorter still images do not trigger planning repairs. Production first asks AI for a compact boundary-only plan and aligns it to speech before writing image prompts. Each image stays on screen until the next audio boundary, with the final image covering the rest of the scene; the narration is never trimmed to satisfy a pacing target. AI then writes ideas for those validated ranges; local checks require the exact same boundaries, and an independent AI review checks the finished plan. Imported audio supplies per-word timestamps and latest allowable end indices to the planner; timing errors report all invalid ranges together for AI repair. Word-count estimates are used only for previews without audio alignment.

For imported audio, local speech recognition supplies the authoritative narration and word timestamps. The user's script is optional topic context, passed separately as `referenceScript` to planning and review; claims or sentences absent from the recording must not be added. Scene text, captions, image plans and alignment follow the audio transcript. The original recording stays unchanged. The creator lets AI choose boundaries; explicit API cut points group transcript words by their audio timestamps. Metadata retains the transcript, its model and the reference script for inspection. TTS continues to use the supplied script as narration. Input over 200,000 characters is rejected explicitly, never truncated. Generation stores the selected models, review findings and repair history in `metadata.ai_planning` and each scene's `planning_quality`.

Image generation verifies the selected Studio model, reads only the new response image, and retries transient service errors or timeouts once before trying the next configured image model. The model picker is scoped to its dialog so a background Images control cannot intercept selection. If any image still fails, generation reports the affected scene and image and preserves the previous project; it does not publish SVG placeholders as successful AI images.

The review checks plans and prompts, not the pixels returned by image providers. A separate AI review can still miss semantic mistakes. It adds Studio requests: at least two for the storyboard and three per scene, with more requests for repairs. New assets use a run-specific name so a failed plan leaves the previous project's assets available.

Run deterministic validation and the pipeline fixture with:

```sh
node --test scripts/aiPlanningClient.test.cjs scripts/aiProductionPlanner.test.cjs scripts/projectEditor.test.cjs scripts/audioAlignment.test.cjs
```

To inspect actual AI output without generating images or replacing the current video (uses the signed-in Playwright profile; close the app's Studio browser before running this standalone process):

```sh
node scripts/previewAIPlan.cjs public/scenes.json /tmp/ai-plan-review.json
```

This preview estimates per-scene timing. Production checks the actual speech timestamps. A completed preview report has `complete: true`; interrupted runs may contain only the scenes reviewed so far.

## Project pages

- `/`: project dashboard with thumbnails, creation and confirmed deletion.
- `/project/new`: the video creation form. Successful generation opens the new project.
- `/project/:id`: video editor, with project-scoped saves and MP4 export.

Project JSON and exports live in `public/projects/<id>/`. The existing video is migrated once on first use. Deleting a project removes its JSON and MP4; shared source images and audio are retained. These generated project files are ignored by Git. `/api/projects` lists projects; `/api/projects/:id` reads, saves or deletes one, and `/api/projects/:id/render` exports it.

Run `node --test scripts/projectStore.test.cjs scripts/projectEditor.test.cjs` for storage and render isolation, and `node scripts/project-pages.test.cjs` against the dev server on port 3000 for dashboard navigation and deletion checks. The browser test creates and deletes its own test project.
