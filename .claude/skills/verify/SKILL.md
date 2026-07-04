---
name: verify
description: Build/launch/drive recipe for verifying the Rejuvenate simulation end-to-end (server API + student UI + instructor dashboard).
---

# Verifying the Rejuvenate simulation

Zero-dependency Node app — nothing to build or install.

## Launch (isolated)

```bash
PORT=4310 FACILITATOR_KEY=rejuvenate DATA_DIR=$(mktemp -d) node server.js &
curl -s http://localhost:4310/api/health   # {"ok":true,...}
```

Use a throwaway `DATA_DIR` so test students never pollute `data/store.json`.

## Drive the API surface

Full student lifecycle via curl: `POST /api/join` (code `OPEN`) → `/api/decision` (`point:"d1"`, choice `trial|forums|pizza`) → `/api/decision` (`point:"d2"`, branch-specific choice) → `/api/step` (`ending`, `reflection`) → `/api/reflection` (3 unique initiative ids). Auth = `{id, secret}` from join.

Worthwhile probes (all should return 4xx with specific messages): wrong class code, empty name, d2-before-d1, re-deciding a locked decision, a d2 choice from the wrong branch, duplicate initiative ids, wrong facilitator key, wrong student secret. Also check the admin snapshot (`GET /api/admin/snapshot`, header `x-facilitator-key`) never contains `"secret"`.

## Drive the browser surface

Playwright with the preinstalled browser: `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })` (install `playwright-core` in a scratch dir, not the repo).

- **Student:** `/?code=OPEN` → join → 4 briefing chapters (`.stage-nav .btn:not(.btn-ghost)` advances) → click an `.opt` card → fill rationale → lock in → wait ~2.5s for staged reaction reveals → continue through decision 2 → ending → click 3 `.init` cards → submit → `.done-hero`. Reload should restore the done screen (localStorage resume).
- **Instructor:** `/instructor` → key `rejuvenate` → dashboard populates via SSE (wait ~1s). Probe SSE by joining a student via fetch and watching `.roster-t tbody tr` count increase without reload. Debrief mode: `#btn-debrief`, arrow keys, 12 slides, Esc. Timer: `#btn-timer`, preset, start, confirm countdown ticks.
- Seed a realistic class first (a dozen students across all six endings) via the API so charts have data.
- Screenshot light + dark (`colorScheme: 'dark'`) and a 390px mobile viewport.

## Gotchas

- Reaction feeds animate in over ~2.5s — screenshot too early and bubbles are missing.
- The join code input uppercases server-side; `?code=xyz` prefills it.
- One expected console 401 if you probe the wrong facilitator key.
