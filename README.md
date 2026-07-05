# Rejuvenate — Leadership Simulation

The **Rejuvenate Inc.** teaching case ("Pioneering Employee Wellness in a Digital Age") reimagined as an individual, playable simulation — plus a live **facilitation tab** for running the class debrief.

Students step into the role of **Rajan Patel**, the new HR Director at a wellness-tech company whose own people are burning out. Each student reads the case in staged chapters, makes two consequential decisions (with an optional written rationale at each lock-in), watches the company react through in-world messages, lands on one of **six endings**, and closes by ranking their **top-3 wellness initiatives** in a short memo to the CEO — the same assignment used in class.

The instructor sees everything live: who's joined, where they are, how the class split at each decision, which endings they reached, the initiative leaderboard, every rationale and memo — and a projector-ready **Debrief mode** that walks through the results side-by-side with the teaching notes, discussion questions, and a leadership-theory lens (directive vs. participative, three functions of team leadership).

*Case © Jessica Siegel Christian (2025), assisted by ChatGPT. Simulation adaptation for classroom use.*

## Quick start

Requires Node 18+. No dependencies to install.

```bash
node server.js
```

- **Students:** `http://localhost:3000/` — just enter a name (the code box is pre-filled with **`DEMO`**, an always-available session, so no code is needed to try it)
- **Instructor:** `http://localhost:3000/instructor` — facilitator key defaults to **`rejuvenate`**

```bash
# production-ish
PORT=8080 FACILITATOR_KEY=your-secret node server.js
```

## Running a class

1. Open `/instructor`, enter the facilitator key, and click **New session** — you get a short class code (e.g. `KWX42`).
2. Click **Copy join link** and put it on the projector (it pre-fills the code for students).
3. Students play individually (~15–25 min). Watch the roster and decision charts fill in live.
4. Click **▶ Debrief mode** and walk the slides with arrow keys: participation → Decision 1 split (with your path notes) → each branch → endings map → class culture metrics → initiative leaderboard → student memos → theory lens → discussion questions → lecture points.
5. The **Timer** button gives a fullscreen countdown (5/10/15/25-min presets) for timeboxing phases; a suggested 55-minute **run of show** is at the bottom of the dashboard.

Other controls: **Anonymize** swaps names for "Student N" before projecting; **Reset session data** clears a session after a test run; clicking any roster row opens that student's full path, rationales, and memo.

## How it's built

Zero-dependency Node server (`server.js`) + vanilla-JS front-ends. All case text, decisions, metric effects, endings, and teaching notes live in **`content.js`** — edit that one file to tune the simulation; both the student app and facilitation tab pick it up.

```
server.js              # HTTP + JSON API + SSE live updates + JSON-file persistence
content.js             # THE content model: case, decision tree, scoring, teaching notes
public/
  index.html, student.js     # student simulation
  instructor.html, instructor.js  # facilitation tab + debrief mode + timer
  styles.css                 # shared design system (light/dark)
data/store.json        # created at runtime; all responses persist here
```

### The decision tree

| Opening move (D1) | Follow-up (D2) | Ending |
|---|---|---|
| B · Open listening forums | Cross-functional team | 🌱 The Culture Transformer *(best)* |
| B · Open listening forums | Senior management decides | 📉 Heard, Then Overruled |
| A · Pilot reduced hours | Analyze, then phase rollout | 📈 The Evidence Builder |
| A · Pilot reduced hours | Company-wide this week | ⚠ Too Much, Too Fast |
| C · Boost morale (pizza) | Add Feedback Fridays | 🔄 The Course Correction |
| C · Boost morale (pizza) | Double down on perks | 🍕 The Pizza Paradox *(worst)* |

Four culture metrics (employee wellbeing, trust in leadership, leadership alignment, sustainable output) start at case-anchored values and move with each decision; the server recomputes them authoritatively from `content.js`.

## Deploying for a class

**Render (easiest):** the repo includes a `render.yaml` blueprint. In the [Render dashboard](https://dashboard.render.com) click **New + → Blueprint**, pick this repo, enter a `FACILITATOR_KEY` when prompted, and deploy. Free-tier notes: the instance spins down after ~15 idle minutes (first visitor waits ~30–60 s — open the site a few minutes before class), and without a persistent disk a spin-down clears responses, so run play + debrief in one sitting. To keep responses across days, see the comments in `render.yaml` (starter plan + disk).

Any other Node host also works (Railway, Fly.io, a university VM):

- Set `FACILITATOR_KEY` (and optionally `PORT`).
- Responses persist to `data/store.json` — give the service a persistent disk (or accept that a redeploy mid-class loses responses; a single class session survives fine in memory either way, since the file is rewritten on every change).
- One instance is plenty: SSE + a JSON file comfortably handles classroom-scale traffic (hundreds of students).

## API sketch (for the curious)

Students: `POST /api/join`, `/api/state`, `/api/step`, `/api/decision`, `/api/reflection` (id + per-student secret).
Instructor (needs `x-facilitator-key`): `GET /api/admin/snapshot`, `GET /api/admin/stream` (SSE), `POST /api/admin/sessions`, `/api/admin/session-archive`, `/api/admin/clear`, `/api/admin/remove-student`.
