/*
 * Rejuvenate simulation server — zero npm dependencies (Node 18+).
 *
 *   node server.js
 *
 * Env:
 *   PORT             — listen port (default 3000)
 *   FACILITATOR_KEY  — passcode for the instructor tab (default "rejuvenate")
 *   DATA_DIR         — where the JSON store lives (default ./data)
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const SIM = require('./content.js');

const PORT = Number(process.env.PORT) || 3000;
const FACILITATOR_KEY = process.env.FACILITATOR_KEY || 'rejuvenate';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MAX_BODY = 100 * 1024;
const NAME_MAX = 40;
const TEXT_MAX = 1200;

// The always-available session students land in when they don't type a code.
const DEFAULT_SESSION = (process.env.DEFAULT_SESSION || 'DEMO').toUpperCase();

/* ------------------------------------------------------------------ *
 * Store — in-memory, persisted to a JSON file with atomic writes      *
 * ------------------------------------------------------------------ */
let store = { sessions: {}, students: {} };

function loadStore() {
  try {
    store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    if (!store.sessions) store.sessions = {};
    if (!store.students) store.students = {};
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not read store, starting fresh:', err.message);
    store = { sessions: {}, students: {} };
  }
  // Guarantee the default session exists so a student can always just enter a name.
  if (!store.sessions[DEFAULT_SESSION]) {
    store.sessions[DEFAULT_SESSION] = { code: DEFAULT_SESSION, name: 'Demo session', createdAt: Date.now(), archived: false };
  }
}

let saveTimer = null;
function saveStore() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = STORE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(store));
      fs.renameSync(tmp, STORE_FILE);
    } catch (err) {
      console.error('Failed to persist store:', err.message);
    }
  }, 200);
}

/* ------------------------------------------------------------------ *
 * SSE broadcast to instructor dashboards                              *
 * ------------------------------------------------------------------ */
const sseClients = new Set();
let broadcastTimer = null;

function snapshot() {
  return {
    sessions: store.sessions,
    students: Object.values(store.students).map(publicStudent),
    contentVersion: SIM.META.version,
    now: Date.now()
  };
}

function broadcast() {
  if (broadcastTimer || sseClients.size === 0) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const payload = 'event: snapshot\ndata: ' + JSON.stringify(snapshot()) + '\n\n';
    for (const res of sseClients) {
      try { res.write(payload); } catch { sseClients.delete(res); }
    }
  }, 300);
}

setInterval(() => {
  for (const res of sseClients) {
    try { res.write(': ping\n\n'); } catch { sseClients.delete(res); }
  }
}, 25000).unref();

function changed() { saveStore(); broadcast(); }

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */
function publicStudent(s) {
  // Everything the instructor dashboard needs; the student's secret stays private.
  const { secret, ...rest } = s;
  return { ...rest, metrics: SIM.computeMetrics(s.decisions).values };
}

function studentView(s) {
  const computed = SIM.computeMetrics(s.decisions);
  return {
    id: s.id, name: s.name, code: s.code, step: s.step,
    decisions: s.decisions, reflection: s.reflection,
    firstInstinct: s.firstInstinct || {}, redoCounts: s.redoCounts || { d1: 0, d2: 0 }, restarts: s.restarts || 0,
    createdAt: s.createdAt, completedAt: s.completedAt,
    metrics: computed.values, stages: computed.stages,
    ending: (s.decisions.d1 && s.decisions.d2)
      ? SIM.endingFor(s.decisions.d1.choice, s.decisions.d2.choice)
      : null
  };
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function isFacilitator(req, url) {
  const supplied = req.headers['x-facilitator-key'] || url.searchParams.get('key') || '';
  const a = Buffer.from(String(supplied));
  const b = Buffer.from(FACILITATOR_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getStudent(body) {
  const s = store.students[String(body.id || '')];
  if (!s) return null;
  const a = Buffer.from(String(body.secret || ''));
  const b = Buffer.from(s.secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return s;
}

// Session codes avoid ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function makeCode(len) {
  let out = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/* ------------------------------------------------------------------ *
 * API routes                                                          *
 * ------------------------------------------------------------------ */
async function handleApi(req, res, url) {
  const route = req.method + ' ' + url.pathname;

  if (route === 'GET /api/health') return json(res, 200, { ok: true, version: SIM.META.version });

  /* ---------------- student endpoints ---------------- */

  if (route === 'POST /api/join') {
    const body = await readBody(req);
    // Blank code → the default demo session, so students can join with just a name.
    const code = cleanText(body.code, 12).toUpperCase() || DEFAULT_SESSION;
    const name = cleanText(body.name, NAME_MAX);
    if (!name) return json(res, 400, { error: 'Please enter your name.' });
    const session = store.sessions[code];
    if (!session) return json(res, 404, { error: 'No class session with that code. Check the code your instructor shared.' });
    if (session.archived) return json(res, 403, { error: 'That session has been closed by your instructor.' });

    const student = {
      id: crypto.randomBytes(6).toString('hex'),
      secret: crypto.randomBytes(16).toString('hex'),
      name, code,
      step: 'briefing',
      decisions: {},
      reflection: null,
      firstInstinct: {},        // first choice at each point, preserved across redos
      redoCounts: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 },
      restarts: 0,              // full "fresh slate" restarts
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      completedAt: null
    };
    store.students[student.id] = student;
    changed();
    return json(res, 200, { id: student.id, secret: student.secret, student: studentView(student) });
  }

  if (route === 'POST /api/state') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student — rejoin with your name and class code.' });
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  if (route === 'POST /api/step') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student.' });
    const step = String(body.step || '');
    // Steps only ever move forward; decisions are recorded via /api/decision.
    if (SIM.stepIndex(step) < 0) return json(res, 400, { error: 'Unknown step.' });
    if (SIM.stepIndex(step) > SIM.stepIndex(s.step)) {
      const decisionPoints = ['d1', 'd2'].concat(SIM.UNIVERSAL_ORDER);
      const missing = decisionPoints.some(function (p, i) {
        return SIM.stepIndex(step) > SIM.stepIndex('decision' + (i + 1)) && !s.decisions[p];
      });
      if (missing) return json(res, 409, { error: 'Make your decision first.' });
      if (step === 'done') return json(res, 409, { error: 'Submit your reflection to finish.' });
      s.step = step;
    }
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  if (route === 'POST /api/decision') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student.' });
    const point = String(body.point || '');
    const choice = String(body.choice || '');
    const rationale = cleanText(body.rationale, TEXT_MAX);

    if (!s.firstInstinct) s.firstInstinct = {};
    if (point === 'd1') {
      if (s.decisions.d1) return json(res, 409, { error: 'Decision 1 is already locked in.' });
      if (!SIM.d1Option(choice)) return json(res, 400, { error: 'Unknown option.' });
      if (!s.firstInstinct.d1) s.firstInstinct.d1 = choice;
      s.decisions.d1 = { choice, rationale, at: Date.now() };
      s.step = 'outcome1';
    } else if (point === 'd2') {
      if (!s.decisions.d1) return json(res, 409, { error: 'Decision 1 comes first.' });
      if (s.decisions.d2) return json(res, 409, { error: 'Decision 2 is already locked in.' });
      if (!SIM.d2Option(s.decisions.d1.choice, choice)) return json(res, 400, { error: 'Unknown option.' });
      if (!s.firstInstinct.d2) s.firstInstinct.d2 = choice;
      s.decisions.d2 = { choice, rationale, at: Date.now() };
      s.step = 'outcome2';
    } else if (SIM.UNIVERSAL_ORDER.indexOf(point) >= 0) {
      // Universal decisions d3 → d4 → d5, each gated on the previous.
      const order = ['d1', 'd2'].concat(SIM.UNIVERSAL_ORDER);
      const idx = order.indexOf(point);
      const prev = order[idx - 1];
      if (!s.decisions[prev]) return json(res, 409, { error: 'An earlier decision comes first.' });
      if (s.decisions[point]) return json(res, 409, { error: 'That decision is already locked in.' });
      if (!SIM.udOption(point, choice)) return json(res, 400, { error: 'Unknown option.' });
      if (!s.firstInstinct[point]) s.firstInstinct[point] = choice;
      s.decisions[point] = { choice, rationale, at: Date.now() };
      s.step = 'outcome' + (idx + 1);
    } else {
      return json(res, 400, { error: 'Unknown decision point.' });
    }
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  // Reopen the decision the student is currently reviewing so they can try again.
  // Only allowed "in the moment" — while on that decision's outcome screen.
  if (route === 'POST /api/redo-decision') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student.' });
    if (!s.firstInstinct) s.firstInstinct = {};
    if (!s.redoCounts) s.redoCounts = { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 };
    const point = String(body.point || '');

    const POINTS = ['d1', 'd2'].concat(SIM.UNIVERSAL_ORDER);
    const idx = POINTS.indexOf(point);
    if (idx < 0) return json(res, 400, { error: 'Unknown decision point.' });
    // Only "in the moment" — while on this decision's outcome screen.
    if (s.step !== 'outcome' + (idx + 1)) return json(res, 409, { error: 'You can only rethink this decision right after making it.' });

    s.redoCounts[point] = (s.redoCounts[point] || 0) + 1;
    // Discard this decision and everything downstream; keep this point's first instinct,
    // reset the tracking on the downstream decisions that no longer apply.
    for (let i = idx; i < POINTS.length; i++) {
      const p = POINTS[i];
      delete s.decisions[p];
      if (i > idx) { s.firstInstinct[p] = null; s.redoCounts[p] = 0; }
    }
    s.step = 'decision' + (idx + 1);
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  // Fresh slate — wipe this student's run back to the briefing, keeping who they are.
  if (route === 'POST /api/restart') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student.' });
    s.decisions = {};
    s.reflection = null;
    s.firstInstinct = {};
    s.redoCounts = { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 };
    s.restarts = (s.restarts || 0) + 1;
    s.completedAt = null;
    s.step = 'briefing';
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  if (route === 'POST /api/reflection') {
    const body = await readBody(req);
    const s = getStudent(body);
    if (!s) return json(res, 401, { error: 'Unknown student.' });
    if (!s.decisions.d1 || !s.decisions.d2) return json(res, 409, { error: 'Finish the simulation first.' });
    if (s.reflection) return json(res, 409, { error: 'Reflection already submitted.' });

    const ranking = Array.isArray(body.ranking) ? body.ranking.map(String).slice(0, 3) : [];
    const valid = ranking.length === 3
      && new Set(ranking).size === 3
      && ranking.every((id) => SIM.initiativeById(id));
    if (!valid) return json(res, 400, { error: 'Pick exactly three different initiatives.' });

    s.reflection = { ranking, justification: cleanText(body.justification, TEXT_MAX), at: Date.now() };
    s.step = 'done';
    s.completedAt = Date.now();
    s.lastSeenAt = Date.now();
    changed();
    return json(res, 200, { student: studentView(s) });
  }

  /* ---------------- instructor endpoints ---------------- */

  if (url.pathname.startsWith('/api/admin/')) {
    if (!isFacilitator(req, url)) return json(res, 401, { error: 'Wrong facilitator key.' });

    if (route === 'GET /api/admin/snapshot') return json(res, 200, snapshot());

    if (route === 'GET /api/admin/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
      res.write('event: snapshot\ndata: ' + JSON.stringify(snapshot()) + '\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return; // keep open
    }

    if (route === 'POST /api/admin/sessions') {
      const body = await readBody(req);
      const name = cleanText(body.name, 60) || 'Class session';
      let code = cleanText(body.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) { do { code = makeCode(5); } while (store.sessions[code]); }
      if (store.sessions[code]) return json(res, 409, { error: 'That code already exists.' });
      store.sessions[code] = { code, name, createdAt: Date.now(), archived: false };
      changed();
      return json(res, 200, { session: store.sessions[code] });
    }

    if (route === 'POST /api/admin/session-archive') {
      const body = await readBody(req);
      const session = store.sessions[String(body.code || '').toUpperCase()];
      if (!session) return json(res, 404, { error: 'No such session.' });
      session.archived = !!body.archived;
      changed();
      return json(res, 200, { session });
    }

    if (route === 'POST /api/admin/clear') {
      const body = await readBody(req);
      const code = String(body.code || '').toUpperCase();
      if (!store.sessions[code]) return json(res, 404, { error: 'No such session.' });
      let removed = 0;
      for (const id of Object.keys(store.students)) {
        if (store.students[id].code === code) { delete store.students[id]; removed++; }
      }
      changed();
      return json(res, 200, { removed });
    }

    if (route === 'POST /api/admin/remove-student') {
      const body = await readBody(req);
      const id = String(body.id || '');
      if (!store.students[id]) return json(res, 404, { error: 'No such student.' });
      delete store.students[id];
      changed();
      return json(res, 200, { ok: true });
    }
  }

  return json(res, 404, { error: 'Not found.' });
}

/* ------------------------------------------------------------------ *
 * Static files                                                        *
 * ------------------------------------------------------------------ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
    }
    if (url.pathname === '/instructor' || url.pathname === '/facilitate') {
      return serveFile(res, path.join(PUBLIC_DIR, 'instructor.html'));
    }
    if (url.pathname === '/content.js') {
      return serveFile(res, path.join(__dirname, 'content.js'));
    }

    // Anything else must resolve inside public/ (no traversal).
    const safe = path.normalize(url.pathname).replace(/^([/\\]|\.\.)+/, '');
    const filePath = path.join(PUBLIC_DIR, safe);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403); return res.end('Forbidden');
    }
    return serveFile(res, filePath);
  } catch (err) {
    console.error(req.method, url.pathname, '→', err.message);
    if (!res.headersSent) json(res, 400, { error: err.message });
  }
});

loadStore();
server.listen(PORT, () => {
  console.log('Rejuvenate simulation running');
  console.log('  Students:    http://localhost:' + PORT + '/');
  console.log('  Instructor:  http://localhost:' + PORT + '/instructor');
  console.log('  Facilitator key: ' + FACILITATOR_KEY + (process.env.FACILITATOR_KEY ? '' : '  (default — set FACILITATOR_KEY to change)'));
  console.log('  Default class code: ' + DEFAULT_SESSION + '  (students can also just leave the code blank)');
});
