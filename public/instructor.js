/* Rejuvenate simulation — instructor facilitation tab. */
(function () {
  'use strict';

  var KEY_LS = 'rejuvenate.facilitator.key';
  var key = null;
  var snap = null;              // latest server snapshot
  var currentCode = null;       // selected session code
  var anonymize = false;
  var es = null;                // EventSource
  var chartViews = {};          // chartId -> 'chart' | 'table'
  var debriefIdx = 0;
  var debriefOpen = false;

  var SLOT_BY_D1 = { trial: 1, forums: 2, pizza: 3 };

  /* ---------------- DOM helpers ---------------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function $(sel) { return document.querySelector(sel); }
  function clear(node) { node.innerHTML = ''; return node; }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.add('hidden'); }, 3000);
  }

  function api(path, body, method) {
    return fetch(path, {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/json', 'x-facilitator-key': key },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
        return data;
      });
    });
  }

  function slotVar(n) { return 'var(--s' + n + ')'; }
  function fmtClock(ms) {
    var d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDur(ms) {
    var m = Math.round(ms / 60000);
    return m < 1 ? '<1 min' : m + ' min';
  }

  /* ---------------- data selectors ---------------- */
  function students() {
    if (!snap) return [];
    return snap.students
      .filter(function (s) { return s.code === currentCode; })
      .sort(function (a, b) { return a.createdAt - b.createdAt; });
  }
  function displayName(s, idx) { return anonymize ? 'Student ' + (idx + 1) : s.name; }

  function aggregates() {
    var list = students();
    var agg = {
      total: list.length,
      liveNow: 0, completed: 0, reachedEnding: 0,
      d1: { trial: 0, forums: 0, pizza: 0 },
      d2: { trial: {}, forums: {}, pizza: {} },
      endings: {}, durations: [],
      metricSums: {}, metricN: 0,
      initiativeScore: {}, initiativePicks: {},
      stepBuckets: { reading: 0, decision1: 0, decision2: 0, wrapping: 0, done: 0 }
    };
    SIM.METRICS.forEach(function (m) { agg.metricSums[m.id] = 0; });
    var now = snap.now || Date.now();

    list.forEach(function (s) {
      if (now - s.lastSeenAt < 90000 && s.step !== 'done') agg.liveNow++;
      var b = s.step === 'briefing' ? 'reading'
        : (s.step === 'decision1' || s.step === 'outcome1') ? 'decision1'
        : (s.step === 'decision2' || s.step === 'outcome2') ? 'decision2'
        : (s.step === 'ending' || s.step === 'reflection') ? 'wrapping' : 'done';
      agg.stepBuckets[b]++;

      if (s.decisions.d1) agg.d1[s.decisions.d1.choice]++;
      if (s.decisions.d1 && s.decisions.d2) {
        var d1 = s.decisions.d1.choice, d2 = s.decisions.d2.choice;
        agg.d2[d1][d2] = (agg.d2[d1][d2] || 0) + 1;
        agg.endings[d1 + ':' + d2] = (agg.endings[d1 + ':' + d2] || 0) + 1;
        agg.reachedEnding++;
        agg.metricN++;
        SIM.METRICS.forEach(function (m) { agg.metricSums[m.id] += s.metrics[m.id]; });
      }
      if (s.completedAt) {
        agg.completed++;
        agg.durations.push(s.completedAt - s.createdAt);
      }
      if (s.reflection) {
        s.reflection.ranking.forEach(function (id, i) {
          agg.initiativeScore[id] = (agg.initiativeScore[id] || 0) + (3 - i);
          agg.initiativePicks[id] = (agg.initiativePicks[id] || 0) + 1;
        });
      }
    });
    agg.durations.sort(function (a, b) { return a - b; });
    agg.medianDuration = agg.durations.length
      ? agg.durations[Math.floor(agg.durations.length / 2)] : null;
    return agg;
  }

  /* ---------------- tooltip ---------------- */
  var tip = null;
  function bindTip(node, text) {
    node.setAttribute('tabindex', '0');
    function show(ev) {
      tip = $('#tip');
      tip.textContent = text;
      tip.classList.remove('hidden');
      move(ev);
    }
    function move(ev) {
      if (!tip) return;
      var x = (ev.clientX || node.getBoundingClientRect().right) + 12;
      var y = (ev.clientY || node.getBoundingClientRect().top) + 12;
      var r = tip.getBoundingClientRect();
      if (x + r.width > innerWidth - 8) x = innerWidth - r.width - 8;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 10;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    }
    function hide() { if (tip) tip.classList.add('hidden'); }
    node.addEventListener('mouseenter', show);
    node.addEventListener('mousemove', move);
    node.addEventListener('mouseleave', hide);
    node.addEventListener('focus', show);
    node.addEventListener('blur', hide);
  }

  /* ---------------- chart builder ---------------- */
  /* rows: [{label, count, pct, color, icon, tip, sub}] — direct labels at bar
     tips (relief for sub-3:1 light-mode hues), table twin always available. */
  function hbarChart(container, opts) {
    var id = container.id;
    var mode = chartViews[id] || 'chart';
    clear(container);

    var head = el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { text: opts.title }),
        opts.sub ? el('div', { class: 'sub', text: opts.sub }) : null
      ]),
      el('button', {
        class: 'view-toggle', text: mode === 'chart' ? '⊞ Table' : '📊 Chart',
        'aria-label': 'Toggle table view',
        onclick: function () { chartViews[id] = mode === 'chart' ? 'table' : 'chart'; hbarChart(container, opts); }
      })
    ]);
    container.appendChild(head);

    if (!opts.rows.length || opts.rows.every(function (r) { return r.count === 0; })) {
      container.appendChild(el('div', { class: 'empty-note', text: opts.empty || 'No responses yet — waiting for the class.' }));
      return;
    }

    if (mode === 'table') {
      var tbl = el('table', { class: 'twin' }, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: opts.rowHeader || 'Option' }),
          el('th', { text: 'Count', style: 'text-align:right' }),
          el('th', { text: 'Share', style: 'text-align:right' })
        ])]),
        el('tbody', {}, opts.rows.map(function (r) {
          return el('tr', {}, [
            el('td', { text: (r.icon ? r.icon + ' ' : '') + r.label }),
            el('td', { class: 'num', text: String(r.count) }),
            el('td', { class: 'num', text: r.pct + '%' })
          ]);
        }))
      ]);
      container.appendChild(tbl);
      return;
    }

    var max = Math.max.apply(null, opts.rows.map(function (r) { return r.count; }).concat([1]));
    var chart = el('div', { class: 'hbar', role: 'img', 'aria-label': opts.title });
    opts.rows.forEach(function (r) {
      var row = el('div', { class: 'hbar-row' }, [
        el('div', { class: 'hbar-label' }, [
          el('span', { class: 'swatch', style: 'background:' + r.color, 'aria-hidden': 'true' }),
          el('span', { class: 'txt', text: (r.icon ? r.icon + ' ' : '') + r.label })
        ]),
        el('div', { class: 'hbar-track' }, [
          el('div', { class: 'hbar-fill', style: 'width:' + (r.count / max * 100) + '%; background:' + r.color }),
          el('span', { class: 'hbar-val', text: r.count + ' · ' + r.pct + '%' })
        ])
      ]);
      bindTip(row, r.tip || (r.label + ': ' + r.count + ' student' + (r.count === 1 ? '' : 's') + ' (' + r.pct + '%)'));
      chart.appendChild(row);
    });
    container.appendChild(chart);

    if (opts.legend) {
      container.appendChild(el('div', { class: 'legend' }, opts.legend.map(function (item) {
        return el('span', { class: 'item' }, [
          el('span', { class: 'swatch', style: 'background:' + item.color }),
          el('span', { text: item.label })
        ]);
      })));
    }
  }

  function pct(n, total) { return total ? Math.round(n / total * 100) : 0; }

  /* ---------------- dashboard sections ---------------- */
  function renderOverview() {
    var agg = aggregates();
    var wrap = clear($('#overview-stats'));
    var tiles = [
      { label: 'Joined', value: agg.total, sub: agg.liveNow + ' active in the last 90s' },
      { label: 'Reading the case', value: agg.stepBuckets.reading, sub: 'briefing chapters' },
      { label: 'In decisions', value: agg.stepBuckets.decision1 + agg.stepBuckets.decision2, sub: 'decision 1: ' + agg.stepBuckets.decision1 + ' · decision 2: ' + agg.stepBuckets.decision2 },
      { label: 'Completed', value: agg.completed, sub: agg.total ? pct(agg.completed, agg.total) + '% of joined' : '—' },
      { label: 'Median play time', value: agg.medianDuration ? fmtDur(agg.medianDuration) : '—', sub: 'join → reflection submitted' }
    ];
    tiles.forEach(function (t) {
      wrap.appendChild(el('div', { class: 'card stat' }, [
        el('div', { class: 'stat-label', text: t.label }),
        el('div', { class: 'stat-value', text: String(t.value) }),
        el('div', { class: 'stat-sub', text: t.sub })
      ]));
    });
  }

  function renderD1() {
    var agg = aggregates();
    var decided = agg.d1.trial + agg.d1.forums + agg.d1.pizza;
    hbarChart($('#chart-d1'), {
      title: 'Decision 1 — the first move',
      sub: decided + ' of ' + agg.total + ' locked in',
      rowHeader: 'Opening move',
      rows: SIM.DECISION1.options.map(function (o) {
        var n = agg.d1[o.id];
        return {
          label: o.letter + ' · ' + o.title, count: n, pct: pct(n, decided),
          color: slotVar(o.slot),
          tip: SIM.TEACHING.d1Notes[o.id].pathLabel + ': ' + n + ' student' + (n === 1 ? '' : 's')
        };
      }),
      legend: SIM.DECISION1.options.map(function (o) {
        return { label: o.title, color: slotVar(o.slot) };
      })
    });
  }

  function renderD2() {
    var agg = aggregates();
    var wrap = clear($('#d2-charts'));
    SIM.DECISION1.options.forEach(function (o) {
      var branch = SIM.BRANCHES[o.id];
      var card = el('div', { class: 'card chart-card', id: 'chart-d2-' + o.id });
      wrap.appendChild(card);
      var total = 0;
      branch.decision.options.forEach(function (b) { total += (agg.d2[o.id][b.id] || 0); });
      hbarChart(card, {
        title: 'Branch ' + o.letter + ' — ' + branch.decision.title,
        sub: total + ' students took this branch to its second decision',
        rowHeader: 'Follow-up',
        empty: 'No one has reached this branch’s second decision yet.',
        rows: branch.decision.options.map(function (b) {
          var n = agg.d2[o.id][b.id] || 0;
          return { label: b.letter + ' · ' + b.title, count: n, pct: pct(n, total), color: slotVar(o.slot) };
        })
      });
    });
  }

  function renderEndings() {
    var agg = aggregates();
    var ordered = Object.values(SIM.ENDINGS).sort(function (a, b) { return a.rank - b.rank; });
    hbarChart($('#chart-endings'), {
      title: 'Endings reached',
      sub: 'ordered best → worst · ' + agg.reachedEnding + ' students have an ending',
      rowHeader: 'Ending',
      rows: ordered.map(function (e) {
        var d1 = e.id.split(':')[0];
        var n = agg.endings[e.id] || 0;
        return {
          label: e.title, icon: e.icon, count: n, pct: pct(n, agg.reachedEnding),
          color: slotVar(SLOT_BY_D1[d1]),
          tip: e.title + ' (' + e.tone + '): ' + n + ' student' + (n === 1 ? '' : 's')
        };
      }),
      legend: SIM.DECISION1.options.map(function (o) {
        return { label: 'via ' + o.title, color: slotVar(o.slot) };
      })
    });
  }

  function renderMetricTiles() {
    var agg = aggregates();
    var card = clear($('#metric-tiles'));
    card.appendChild(el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { text: 'Class culture metrics' }),
        el('div', { class: 'sub', text: 'average final values among the ' + agg.metricN + ' students with an ending, vs the case’s starting point' })
      ])
    ]));
    if (!agg.metricN) {
      card.appendChild(el('div', { class: 'empty-note', text: 'Averages appear once students reach an ending.' }));
      return;
    }
    var grid = el('div', { class: 'final-metrics' });
    SIM.METRICS.forEach(function (m) {
      var avg = Math.round(agg.metricSums[m.id] / agg.metricN);
      var d = avg - m.start;
      grid.appendChild(el('div', { class: 'stat' }, [
        el('div', { class: 'stat-label', text: m.label }),
        el('div', { class: 'stat-value', text: String(avg) }),
        el('div', { class: 'delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'flat'), text: (d > 0 ? '▲ +' : d < 0 ? '▼ −' : '· ') + Math.abs(d) + ' vs start (' + m.start + ')' })
      ]));
    });
    card.appendChild(grid);
  }

  function renderInitiatives() {
    var agg = aggregates();
    var scored = SIM.REFLECTION.initiatives.map(function (init) {
      return { init: init, score: agg.initiativeScore[init.id] || 0, picks: agg.initiativePicks[init.id] || 0 };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
    var totalScore = scored.reduce(function (t, r) { return t + r.score; }, 0);

    hbarChart($('#chart-initiatives'), {
      title: 'Initiative leaderboard',
      sub: 'weighted: 1st pick = 3 pts, 2nd = 2, 3rd = 1 · from submitted reflections',
      rowHeader: 'Initiative',
      empty: 'Appears as students submit their top-3 recommendations.',
      rows: scored.map(function (r) {
        return {
          label: r.init.label, count: r.score, pct: pct(r.score, totalScore),
          color: slotVar(1),
          tip: r.init.label + ': ' + r.score + ' pts, picked by ' + r.picks + ' student' + (r.picks === 1 ? '' : 's')
        };
      })
    });
  }

  var STEP_LABEL = {
    briefing: 'Reading', decision1: 'Decision 1', outcome1: 'Outcome 1',
    decision2: 'Decision 2', outcome2: 'Outcome 2', ending: 'Ending',
    reflection: 'Reflection', done: 'Done'
  };

  function renderRoster() {
    var list = students();
    $('#roster-sub').textContent = list.length
      ? 'Click a row for the full path, rationale, and reflection.'
      : 'Students appear here as they join with code ' + currentCode + '.';
    var wrap = clear($('#roster-wrap'));
    if (!list.length) {
      wrap.appendChild(el('div', { class: 'empty-note', text: 'Share the join link to get started.' }));
      return;
    }
    var tbl = el('table', { class: 'roster-t' }, [
      el('thead', {}, [el('tr', {}, ['#', 'Name', 'Progress', 'Decision 1', 'Decision 2', 'Ending', 'Joined'].map(function (h) {
        return el('th', { text: h });
      }))]),
      el('tbody', {}, list.map(function (s, i) {
        var d1 = s.decisions.d1 && SIM.d1Option(s.decisions.d1.choice);
        var d2 = s.decisions.d2 && d1 && SIM.d2Option(d1.id, s.decisions.d2.choice);
        var e = (d1 && d2) ? SIM.endingFor(d1.id, d2.id) : null;
        return el('tr', { onclick: function () { openDrawer(s, i); } }, [
          el('td', { text: String(i + 1) }),
          el('td', { text: displayName(s, i) }),
          el('td', {}, [el('span', { class: 'step-chip' + (s.step === 'done' ? ' done' : ''), text: STEP_LABEL[s.step] || s.step })]),
          el('td', { text: d1 ? d1.letter + ' · ' + d1.title : '—' }),
          el('td', { text: d2 ? d2.letter + ' · ' + d2.title : '—' }),
          el('td', { text: e ? e.icon + ' ' + e.title : '—' }),
          el('td', { class: 'small', text: fmtClock(s.createdAt) })
        ]);
      }))
    ]);
    wrap.appendChild(tbl);
  }

  function renderVoices() {
    var list = students();
    var idxOf = {}; list.forEach(function (s, i) { idxOf[s.id] = i; });

    // Rationales grouped by decision-1 option, then branch decisions.
    var card = clear($('#voices-rationales'));
    card.appendChild(el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { text: 'Why they chose it — decision rationales' }),
        el('div', { class: 'sub', text: 'optional free-text captured at each lock-in · great for cold-calling' })
      ])
    ]));
    var col = el('div', { class: 'voices-col' });
    var any = false;
    SIM.DECISION1.options.forEach(function (o) {
      list.forEach(function (s) {
        var d = s.decisions.d1;
        if (d && d.choice === o.id && d.rationale) {
          any = true;
          col.appendChild(voiceCard(o.letter + ' · ' + o.title, s, idxOf[s.id], d.rationale, o.slot));
        }
      });
      list.forEach(function (s) {
        var d1 = s.decisions.d1, d2 = s.decisions.d2;
        if (d1 && d1.choice === o.id && d2 && d2.rationale) {
          any = true;
          var opt = SIM.d2Option(o.id, d2.choice);
          col.appendChild(voiceCard(o.letter + '→' + opt.letter + ' · ' + opt.title, s, idxOf[s.id], d2.rationale, o.slot));
        }
      });
    });
    if (!any) col.appendChild(el('div', { class: 'empty-note', text: 'Rationales appear as students lock in decisions.' }));
    card.appendChild(col);

    // Reflection justifications.
    var card2 = clear($('#voices-reflections'));
    card2.appendChild(el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { text: 'Recommendation memos' }),
        el('div', { class: 'sub', text: 'top-3 justifications addressed to the CEO & finance director' })
      ])
    ]));
    var col2 = el('div', { class: 'voices-col' });
    var any2 = false;
    list.forEach(function (s) {
      if (s.reflection && s.reflection.justification) {
        any2 = true;
        var picks = s.reflection.ranking.map(function (id, i) { return (i + 1) + '. ' + SIM.initiativeById(id).label; }).join(' · ');
        col2.appendChild(voiceCard(picks, s, idxOf[s.id], s.reflection.justification, null));
      }
    });
    if (!any2) col2.appendChild(el('div', { class: 'empty-note', text: 'Memos appear as students submit reflections.' }));
    card2.appendChild(col2);
  }

  function voiceCard(context, s, idx, text, slot) {
    return el('div', { class: 'card voice' }, [
      el('div', { class: 'v-meta' }, [
        slot ? el('span', { class: 'swatch', style: 'display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px;background:' + slotVar(slot) }) : null,
        el('span', { text: displayName(s, idx) + ' — ' + context })
      ]),
      el('div', { text: '“' + text + '”' })
    ]);
  }

  function renderRunOfShow() {
    var card = clear($('#run-of-show'));
    card.appendChild(el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { text: 'Run of show — suggested 55-minute session' }),
        el('div', { class: 'sub', text: 'timeboxed like the emergency-simulation session; use the Timer button for each phase' })
      ])
    ]));
    var tbl = el('table', { class: 'twin' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: 'Phase' }), el('th', { text: 'Time', style: 'text-align:right' }), el('th', { text: 'What to do' })
      ])]),
      el('tbody', {}, SIM.TEACHING.runOfShow.map(function (r) {
        return el('tr', {}, [
          el('td', { text: r.phase, style: 'white-space:nowrap; font-weight:600' }),
          el('td', { class: 'num', text: r.minutes + ' min' }),
          el('td', { text: r.detail })
        ]);
      }))
    ]);
    card.appendChild(tbl);
  }

  function renderAll() {
    if (!snap) return;
    renderSessionSelect();
    renderOverview();
    renderD1();
    renderEndings();
    renderD2();
    renderMetricTiles();
    renderInitiatives();
    renderRoster();
    renderVoices();
    renderRunOfShow();
    if (debriefOpen) renderDebriefSlide();
  }

  /* ---------------- sessions ---------------- */
  function renderSessionSelect() {
    var sel = $('#session-select');
    var codes = Object.keys(snap.sessions).sort(function (a, b) { return snap.sessions[a].createdAt - snap.sessions[b].createdAt; });
    if (!currentCode || !snap.sessions[currentCode]) currentCode = codes[0];
    clear(sel);
    codes.forEach(function (c) {
      var s = snap.sessions[c];
      var n = snap.students.filter(function (st) { return st.code === c; }).length;
      sel.appendChild(el('option', {
        value: c,
        text: c + ' — ' + s.name + ' (' + n + ')' + (s.archived ? ' · closed' : '')
      }));
    });
    sel.value = currentCode;
  }

  /* ---------------- drawer ---------------- */
  function openDrawer(s, idx) {
    var d = clear($('#drawer'));
    $('#drawer-scrim').classList.remove('hidden');
    d.classList.remove('hidden');

    function kv(k, v) { return el('div', { class: 'kv' }, [el('span', { class: 'k', text: k + ' — ' }), el('span', { text: v })]); }

    d.appendChild(el('button', { class: 'btn btn-ghost btn-sm close-x', text: '✕', 'aria-label': 'Close', onclick: closeDrawer }));
    d.appendChild(el('h3', { text: displayName(s, idx) }));
    d.appendChild(kv('Progress', STEP_LABEL[s.step] || s.step));
    d.appendChild(kv('Joined', fmtClock(s.createdAt) + (s.completedAt ? ' · finished in ' + fmtDur(s.completedAt - s.createdAt) : '')));

    var d1 = s.decisions.d1 && SIM.d1Option(s.decisions.d1.choice);
    if (d1) {
      d.appendChild(el('div', { class: 'card voice' }, [
        el('div', { class: 'v-meta', text: 'Decision 1 · ' + d1.letter + ' — ' + d1.title }),
        el('div', { text: s.decisions.d1.rationale ? '“' + s.decisions.d1.rationale + '”' : 'No rationale given.' })
      ]));
    }
    var d2 = s.decisions.d2 && d1 && SIM.d2Option(d1.id, s.decisions.d2.choice);
    if (d2) {
      d.appendChild(el('div', { class: 'card voice' }, [
        el('div', { class: 'v-meta', text: 'Decision 2 · ' + d2.letter + ' — ' + d2.title }),
        el('div', { text: s.decisions.d2.rationale ? '“' + s.decisions.d2.rationale + '”' : 'No rationale given.' })
      ]));
      var e = SIM.endingFor(d1.id, d2.id);
      d.appendChild(kv('Ending', e.icon + ' ' + e.title + ' (' + e.tone + ')'));
      d.appendChild(kv('Final metrics', SIM.METRICS.map(function (m) { return m.label + ' ' + s.metrics[m.id]; }).join(' · ')));
    }
    if (s.reflection) {
      d.appendChild(el('div', { class: 'card voice' }, [
        el('div', { class: 'v-meta', text: 'Top 3 — ' + s.reflection.ranking.map(function (id, i) { return (i + 1) + '. ' + SIM.initiativeById(id).label; }).join(' · ') }),
        el('div', { text: s.reflection.justification ? '“' + s.reflection.justification + '”' : 'No justification given.' })
      ]));
    }
    d.appendChild(el('button', {
      class: 'btn btn-ghost btn-sm btn-danger', text: 'Remove this student',
      onclick: function () {
        if (!confirm('Remove ' + s.name + ' and their responses? This cannot be undone.')) return;
        api('/api/admin/remove-student', { id: s.id }).then(function () { closeDrawer(); toast('Removed.'); refreshSnapshot(); })
          .catch(function (err) { toast(err.message); });
      }
    }));
  }
  function closeDrawer() {
    $('#drawer').classList.add('hidden');
    $('#drawer-scrim').classList.add('hidden');
  }

  /* ---------------- debrief mode ---------------- */
  function debriefSlides() {
    var agg = aggregates();
    var T = SIM.TEACHING;
    var slides = [];

    function noteCard(title, text) {
      return el('div', { class: 'card note-card' }, [
        el('div', { class: 'nc-title', text: title }),
        el('div', { text: text })
      ]);
    }
    function chartInto(opts) {
      var host = el('div', { class: 'card chart-card', id: 'db-' + Math.random().toString(36).slice(2, 8) });
      hbarChart(host, opts);
      return host;
    }

    // 1 · participation
    slides.push(function () {
      return [
        el('div', { class: 'kicker', text: 'Rejuvenate · class debrief' }),
        el('h2', { text: 'One case, six endings' }),
        el('div', { class: 'debrief-hero', text: agg.reachedEnding + ' / ' + agg.total }),
        el('p', { class: 'slide-lede', text: 'students reached an ending · ' + agg.completed + ' submitted the reflection memo' + (agg.medianDuration ? ' · median play time ' + fmtDur(agg.medianDuration) : '') }),
        el('p', { class: 'slide-lede', text: 'Everyone played Rajan Patel, HR Director. Same company, same survey, same pressure — different instincts.' })
      ];
    });

    // 2 · decision 1
    slides.push(function () {
      var decided = agg.d1.trial + agg.d1.forums + agg.d1.pizza;
      return [
        el('div', { class: 'kicker', text: 'Decision 1 · month 6' }),
        el('h2', { text: 'What should Rajan do first?' }),
        el('div', { class: 'two-col' }, [
          chartInto({
            title: 'The class split', sub: decided + ' decisions locked',
            rows: SIM.DECISION1.options.map(function (o) {
              var n = agg.d1[o.id];
              return { label: o.letter + ' · ' + o.title, count: n, pct: pct(n, decided), color: slotVar(o.slot) };
            })
          }),
          el('div', { style: 'display:grid; gap:10px' }, SIM.DECISION1.options.map(function (o) {
            return noteCard(o.letter + ' — ' + T.d1Notes[o.id].pathLabel, T.d1Notes[o.id].note);
          }))
        ]),
        el('div', { class: 'callout', text: 'Before revealing outcomes: ask one student per option to defend their opening move.' })
      ];
    });

    // 3-5 · branches
    SIM.DECISION1.options.forEach(function (o) {
      slides.push(function () {
        var branch = SIM.BRANCHES[o.id];
        var total = 0;
        branch.decision.options.forEach(function (b) { total += (agg.d2[o.id][b.id] || 0); });
        var rationales = [];
        students().forEach(function (s, i) {
          if (s.decisions.d1 && s.decisions.d1.choice === o.id && s.decisions.d2 && s.decisions.d2.rationale) {
            rationales.push({ s: s, i: i, text: s.decisions.d2.rationale });
          }
        });
        return [
          el('div', { class: 'kicker', text: 'Branch ' + o.letter + ' · ' + (agg.d1[o.id] || 0) + ' students · ' + T.d1Notes[o.id].pathLabel }),
          el('h2', { text: o.title }),
          el('p', { class: 'slide-lede', text: branch.interlude[0] }),
          el('div', { class: 'two-col' }, [
            chartInto({
              title: branch.decision.title, sub: total + ' second decisions',
              empty: 'No one reached this decision.',
              rows: branch.decision.options.map(function (b) {
                var n = agg.d2[o.id][b.id] || 0;
                return { label: b.letter + ' · ' + b.title, count: n, pct: pct(n, total), color: slotVar(o.slot) };
              })
            }),
            el('div', { style: 'display:grid; gap:10px' },
              branch.decision.options.map(function (b) {
                return noteCard('If ' + b.letter + ' — from the teaching notes', T.d2Notes[o.id + ':' + b.id]);
              }).concat(rationales.slice(0, 2).map(function (r) {
                return noteCard('In their words — ' + displayName(r.s, r.i), '“' + r.text + '”');
              })))
          ])
        ];
      });
    });

    // 6 · endings
    slides.push(function () {
      var ordered = Object.values(SIM.ENDINGS).sort(function (a, b) { return a.rank - b.rank; });
      return [
        el('div', { class: 'kicker', text: 'Where everyone landed' }),
        el('h2', { text: 'The endings map — best to worst' }),
        chartInto({
          title: 'Endings reached', sub: agg.reachedEnding + ' students',
          rows: ordered.map(function (e) {
            var n = agg.endings[e.id] || 0;
            return { label: e.title, icon: e.icon, count: n, pct: pct(n, agg.reachedEnding), color: slotVar(SLOT_BY_D1[e.id.split(':')[0]]) };
          }),
          legend: SIM.DECISION1.options.map(function (o) { return { label: 'via ' + o.title, color: slotVar(o.slot) }; })
        }),
        el('div', { class: 'callout', text: 'The pattern to draw out: both “listening” moves only pay off when voice leads to visible action — and the worst two endings both broke that link.' })
      ];
    });

    // 7 · metrics
    slides.push(function () {
      var grid = el('div', { class: 'final-metrics' });
      SIM.METRICS.forEach(function (m) {
        var avg = agg.metricN ? Math.round(agg.metricSums[m.id] / agg.metricN) : m.start;
        var d = avg - m.start;
        grid.appendChild(el('div', { class: 'card stat' }, [
          el('div', { class: 'stat-label', text: m.label }),
          el('div', { class: 'stat-value', text: String(avg) }),
          el('div', { class: 'delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'flat'), text: (d > 0 ? '▲ +' : d < 0 ? '▼ −' : '· ') + Math.abs(d) + ' vs start (' + m.start + ')' })
        ]));
      });
      return [
        el('div', { class: 'kicker', text: 'Class averages · students with endings' }),
        el('h2', { text: 'What happened to the culture, on average?' }),
        grid,
        el('div', { class: 'callout', text: 'Bridge to ROI: which of these four would the finance director accept as evidence? How would you quantify the others? (Discussion questions: ROI of wellness.)' })
      ];
    });

    // 8 · initiatives
    slides.push(function () {
      var scored = SIM.REFLECTION.initiatives.map(function (init) {
        return { init: init, score: agg.initiativeScore[init.id] || 0, picks: agg.initiativePicks[init.id] || 0 };
      }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; });
      var totalScore = scored.reduce(function (t, r) { return t + r.score; }, 0);
      return [
        el('div', { class: 'kicker', text: 'The class recommendation' }),
        el('h2', { text: 'Top initiatives, weighted by rank' }),
        chartInto({
          title: 'Initiative leaderboard', sub: '1st = 3 pts · 2nd = 2 · 3rd = 1',
          empty: 'No reflections submitted yet.',
          rows: scored.map(function (r) {
            return { label: r.init.label, count: r.score, pct: pct(r.score, totalScore), color: slotVar(1), tip: 'picked by ' + r.picks };
          })
        }),
        el('div', { class: 'callout', text: T.assignment })
      ];
    });

    // 9 · voices
    slides.push(function () {
      var memos = [];
      students().forEach(function (s, i) {
        if (s.reflection && s.reflection.justification) memos.push({ s: s, i: i, text: s.reflection.justification });
      });
      var cards = memos.slice(0, 6).map(function (m) {
        return el('div', { class: 'card note-card' }, [
          el('div', { class: 'nc-title', text: displayName(m.s, m.i) }),
          el('div', { text: '“' + m.text + '”' })
        ]);
      });
      return [
        el('div', { class: 'kicker', text: 'Student voices' }),
        el('h2', { text: 'Memos to the CEO' }),
        memos.length
          ? el('div', { class: 'two-col' }, [el('div', { style: 'display:grid;gap:10px' }, cards.slice(0, 3)), el('div', { style: 'display:grid;gap:10px' }, cards.slice(3, 6))])
          : el('p', { class: 'slide-lede', text: 'No memos submitted yet.' }),
        memos.length > 6 ? el('p', { class: 'small', text: '+ ' + (memos.length - 6) + ' more on the dashboard' }) : null
      ];
    });

    // 10 · theory lens
    slides.push(function () {
      var L = T.theoryLens;
      return [
        el('div', { class: 'kicker', text: 'Theory lens' }),
        el('h2', { text: L.title }),
        el('p', { class: 'slide-lede', text: L.intro }),
        el('div', { class: 'two-col' }, L.styles.map(function (s) {
          return el('div', { class: 'card note-card' }, [
            el('div', { class: 'nc-title', text: s.style + ' · ' + s.matches }),
            el('div', { text: s.text })
          ]);
        })),
        el('div', { class: 'card note-card' }, [
          el('div', { class: 'nc-title', text: L.functions.title }),
          el('div', {}, L.functions.items.map(function (f) {
            return el('p', { style: 'margin-bottom:6px' }, [el('strong', { text: f.name + ': ' }), el('span', { text: f.text })]);
          }))
        ]),
        el('div', { class: 'callout', text: L.punchline })
      ];
    });

    // 11 · discussion questions
    slides.push(function () {
      return [
        el('div', { class: 'kicker', text: 'Open discussion' }),
        el('h2', { text: 'Discussion questions' }),
        el('div', { class: 'two-col' }, T.discussionQuestions.map(function (g) {
          return el('div', { class: 'card note-card' }, [
            el('div', { class: 'nc-title', text: g.topic }),
            el('div', {}, g.questions.map(function (q) { return el('p', { style: 'margin-bottom:6px', text: '• ' + q }); }))
          ]);
        }))
      ];
    });

    // 12 · lecture points
    slides.push(function () {
      return [
        el('div', { class: 'kicker', text: 'Key lecture points' }),
        el('h2', { text: 'What this case is really about' }),
        el('div', { class: 'two-col' }, [
          el('div', { style: 'display:grid;gap:10px' }, T.lecturePoints.slice(0, 4).map(function (p) {
            return el('div', { class: 'card note-card' }, [el('div', { class: 'nc-title', text: p.title }), el('div', { text: p.text })]);
          })),
          el('div', { style: 'display:grid;gap:10px' }, T.lecturePoints.slice(4).map(function (p) {
            return el('div', { class: 'card note-card' }, [el('div', { class: 'nc-title', text: p.title }), el('div', { text: p.text })]);
          }))
        ])
      ];
    });

    return slides;
  }

  function renderDebriefSlide() {
    var slides = debriefSlides();
    if (debriefIdx >= slides.length) debriefIdx = slides.length - 1;
    var host = clear($('#debrief-slide'));
    slides[debriefIdx]().forEach(function (n) { if (n) host.appendChild(n); });
    $('#debrief-pos').textContent = 'Slide ' + (debriefIdx + 1) + ' / ' + slides.length + ' · arrow keys to navigate';
    $('#debrief-session').textContent = 'Session ' + currentCode;
    $('#debrief-prev').disabled = debriefIdx === 0;
    $('#debrief-next').disabled = debriefIdx === slides.length - 1;
  }

  function openDebrief() {
    debriefOpen = true;
    debriefIdx = 0;
    $('#debrief').classList.remove('hidden');
    renderDebriefSlide();
  }
  function closeDebrief() {
    debriefOpen = false;
    $('#debrief').classList.add('hidden');
  }

  /* ---------------- timer ---------------- */
  var timer = { total: 300, left: 300, running: false, iv: null };
  function timerText() {
    var m = Math.floor(timer.left / 60), s = timer.left % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function renderTimer() {
    $('#timer-display').textContent = timerText();
    $('#timer-display').style.color = timer.left === 0 ? 'var(--critical)' : '';
    $('#timer-start').textContent = timer.running ? 'Pause' : 'Start';
    var chip = $('#debrief-timer-chip');
    if (timer.running || timer.left !== timer.total) {
      chip.style.display = '';
      chip.textContent = '⏱ ' + timerText();
    } else chip.style.display = 'none';
  }
  function tickTimer() {
    if (timer.left > 0) timer.left--;
    if (timer.left === 0) { stopTimer(); toast('⏱ Time!'); }
    renderTimer();
  }
  function startTimer() {
    if (timer.running) { stopTimer(); renderTimer(); return; }
    timer.running = true;
    timer.iv = setInterval(tickTimer, 1000);
    renderTimer();
  }
  function stopTimer() { timer.running = false; clearInterval(timer.iv); }

  /* ---------------- SSE / polling ---------------- */
  function connect() {
    if (es) es.close();
    es = new EventSource('/api/admin/stream?key=' + encodeURIComponent(key));
    es.addEventListener('snapshot', function (ev) {
      snap = JSON.parse(ev.data);
      $('#live-dot').classList.add('on');
      renderAll();
    });
    es.onerror = function () { $('#live-dot').classList.remove('on'); };
  }
  function refreshSnapshot() {
    return api('/api/admin/snapshot', null, 'GET').then(function (data) { snap = data; renderAll(); });
  }

  /* ---------------- boot & controls ---------------- */
  function enter() {
    $('#gate').classList.add('hidden');
    $('#dash').classList.remove('hidden');
    $('#credit').textContent = SIM.META.copyright;
    connect();
  }

  function boot() {
    key = sessionStorage.getItem(KEY_LS);
    if (key) {
      refreshSnapshot().then(enter).catch(function () { sessionStorage.removeItem(KEY_LS); key = null; });
    }

    $('#gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      key = $('#gate-key').value;
      refreshSnapshot().then(function () {
        sessionStorage.setItem(KEY_LS, key);
        enter();
      }).catch(function (err) {
        $('#gate-error').textContent = err.message;
      });
    });

    $('#session-select').addEventListener('change', function () {
      currentCode = this.value;
      renderAll();
    });

    $('#btn-copy-link').addEventListener('click', function () {
      var link = location.origin + '/?code=' + currentCode;
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () {
        toast('Join link copied: ' + link);
      }).catch(function () { prompt('Copy this join link:', link); });
    });

    $('#btn-new-session').addEventListener('click', function () {
      var name = prompt('Name for the new class session (e.g. "MGMT 301 — Tuesday"):');
      if (name === null) return;
      api('/api/admin/sessions', { name: name || 'Class session' }).then(function (data) {
        currentCode = data.session.code;
        toast('Session ' + data.session.code + ' created.');
        refreshSnapshot();
      }).catch(function (err) { toast(err.message); });
    });

    $('#btn-anon').addEventListener('click', function () {
      anonymize = !anonymize;
      this.textContent = 'Anonymize: ' + (anonymize ? 'on' : 'off');
      renderAll();
    });

    $('#btn-clear').addEventListener('click', function () {
      var n = students().length;
      if (!confirm('Remove all ' + n + ' students in session ' + currentCode + '? Use this to reset after a test run. This cannot be undone.')) return;
      api('/api/admin/clear', { code: currentCode }).then(function (data) {
        toast('Removed ' + data.removed + ' students.');
        refreshSnapshot();
      }).catch(function (err) { toast(err.message); });
    });

    $('#btn-debrief').addEventListener('click', openDebrief);
    $('#debrief-exit').addEventListener('click', closeDebrief);
    $('#debrief-prev').addEventListener('click', function () { if (debriefIdx > 0) { debriefIdx--; renderDebriefSlide(); } });
    $('#debrief-next').addEventListener('click', function () { debriefIdx++; renderDebriefSlide(); });
    $('#debrief-theme').addEventListener('click', function () {
      var root = document.documentElement;
      var cur = root.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
      root.setAttribute('data-theme', next);
    });

    $('#btn-timer').addEventListener('click', function () { $('#timer-pane').classList.remove('hidden'); renderTimer(); });
    $('#timer-close').addEventListener('click', function () { $('#timer-pane').classList.add('hidden'); });
    $('#timer-start').addEventListener('click', startTimer);
    $('#timer-reset').addEventListener('click', function () { stopTimer(); timer.left = timer.total; renderTimer(); });
    document.querySelectorAll('#timer-pane [data-mins]').forEach(function (b) {
      b.addEventListener('click', function () {
        stopTimer();
        timer.total = timer.left = Number(b.dataset.mins) * 60;
        renderTimer();
      });
    });

    $('#drawer-scrim').addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (ev) {
      if (!$('#timer-pane').classList.contains('hidden') && ev.key === 'Escape') { $('#timer-pane').classList.add('hidden'); return; }
      if (!$('#drawer').classList.contains('hidden') && ev.key === 'Escape') { closeDrawer(); return; }
      if (!debriefOpen) return;
      if (ev.key === 'Escape') closeDebrief();
      if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); $('#debrief-next').click(); }
      if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); $('#debrief-prev').click(); }
    });
  }

  boot();
})();
