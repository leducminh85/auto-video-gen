# Wevic studio redesign

Scope: dashboard, creator, editor, image dialogs and generation progress. Preserve routes, logo, Vietnamese control names, saved projects, provider calls, audio/video timing and editing operations.

Audit: the dashboard has no filtering; creator forms mix dense inline typography with small labels; editor headers and dialogs use inconsistent spacing. Existing assets, three editor panels, direct timeline manipulation, keyboard access and modal focus traps are retained.

Direction: a dark video workspace, amber actions, quiet neutral surfaces, locally served Be Vietnam Pro. Variance 4, motion 2, density 6. This is a working product, not a marketing layout. UI UX Pro Max search matched minimalist professional tools, but its hero/features pattern and pink/blue palette did not fit the project. Retain the repository's dark/amber direction. Taste Skill excludes dense dashboards and multi-step product UI; use UI UX Pro Max for those surfaces.

Tokens: base #101112, surface #181a1c, elevated #222528, input #121416, text #f2f2ee, secondary #b3b6b9, muted #a1a5a9, accent #efba58. Functional error red and success green only communicate status. Inputs/buttons radius 6px; panels 10px; modal 14px. Minimum touch target 44px. Borders, focus outlines and text labels communicate interaction, with no reliance on color alone.

Dashboard: compact brand bar, project heading, search and sort, 16:9 real thumbnails. Creator: page introduction, wide script column, stacked audio/density/style controls, persistent action footer. Editor: compact project header, preview and scene list above timeline. Image dialogs: large preview and prompt controls with persistent footer. No changes to generation or persistence logic.

Validation: existing browser regressions for creation, drafts, provider controls, editing, export, deletion, audio upload, timeline drag/resize/undo; screenshots at desktop and phone; overflow/focus/reduced-motion checks. No automatic commits.
