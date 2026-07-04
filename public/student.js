/* Rejuvenate simulation — student experience. */
(function () {
  'use strict';

  var LS_KEY = 'rejuvenate.student.v1';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var me = null;        // {id, secret}
  var state = null;     // server studentView
  var prevMetrics = null;
  var chapterIdx = 0;

  /* ---------------- tiny DOM helpers ---------------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k]; // trusted content.js strings only
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function frag(children) { var f = document.createDocumentFragment(); children.forEach(function (c) { if (c) f.appendChild(c); }); return f; }
  function $(sel) { return document.querySelector(sel); }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.add('hidden'); }, 3200);
  }

  function api(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
        return data;
      });
    });
  }

  function authed(extra) {
    var body = { id: me.id, secret: me.secret };
    for (var k in (extra || {})) body[k] = extra[k];
    return body;
  }

  /* ---------------- metric strip ---------------- */
  function renderMetrics(animateDeltas) {
    var strip = $('#metric-strip');
    strip.innerHTML = '';
    SIM.METRICS.forEach(function (m) {
      var val = state.metrics[m.id];
      var prev = prevMetrics ? prevMetrics[m.id] : val;
      var d = val - prev;
      var cell = el('div', { class: 'metric-cell', title: m.blurb }, [
        el('div', { class: 'm-head' }, [
          el('span', { class: 'm-label', text: m.label }),
          el('span', { class: 'm-val', text: String(val) })
        ]),
        el('div', { class: 'meter', role: 'img', 'aria-label': m.label + ': ' + val + ' out of 100' }, [
          el('div', { class: 'meter-fill', style: 'width:' + (animateDeltas && !REDUCED ? prev : val) + '%' })
        ])
      ]);
      if (animateDeltas && d !== 0) {
        cell.appendChild(el('span', {
          class: 'float-delta delta ' + (d > 0 ? 'up' : 'down'),
          text: (d > 0 ? '+' : '−') + Math.abs(d)
        }));
      }
      strip.appendChild(cell);
      if (animateDeltas && !REDUCED) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { cell.querySelector('.meter-fill').style.width = val + '%'; });
        });
      }
    });
    prevMetrics = {};
    SIM.METRICS.forEach(function (m) { prevMetrics[m.id] = state.metrics[m.id]; });
  }

  /* ---------------- shared stage bits ---------------- */
  function stageRoot() { var r = $('#stage-root'); r.innerHTML = ''; window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); return r; }

  function timeDivider(label) { return el('div', { class: 'time-divider', text: label }); }

  function stageHead(kicker, title) {
    return el('div', { class: 'stage-head' }, [
      kicker ? el('div', { class: 'kicker', text: kicker }) : null,
      el('h2', { text: title })
    ]);
  }

  function msgBubble(v, revealDelay) {
    var initials = v.from.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var m = el('div', { class: 'msg' + (revealDelay != null ? ' reveal' : '') }, [
      el('div', { class: 'avatar', text: initials, 'aria-hidden': 'true' }),
      el('div', { class: 'bubble' }, [
        el('div', { class: 'who' }, [
          el('span', { text: v.from + ' ' }),
          el('span', { class: 'role', text: '· ' + v.role })
        ]),
        el('p', { text: v.text })
      ])
    ]);
    if (revealDelay != null && !REDUCED) m.style.animationDelay = revealDelay + 'ms';
    return m;
  }

  function goStep(step) {
    return api('/api/step', authed({ step: step })).then(function (data) {
      state = data.student;
      render();
    }).catch(function (err) { toast(err.message); });
  }

  /* ---------------- briefing ---------------- */
  function renderBriefing() {
    var root = stageRoot();
    var ch = SIM.BRIEFING[chapterIdx];
    var body = el('div', { class: 'stage-body' });

    (ch.paragraphs || []).forEach(function (p) { body.appendChild(el('p', { class: 'case-p', text: p })); });

    if (ch.products) {
      body.appendChild(el('div', { class: 'product-grid' }, ch.products.map(function (p) {
        return el('div', { class: 'card product-card' }, [
          el('h4', { text: p.name }),
          el('p', { text: p.desc }),
          el('div', { class: 'pos', text: p.position })
        ]);
      })));
    }

    if (ch.voices) {
      var feed = el('div', { class: 'feed' });
      ch.voices.forEach(function (v, i) { feed.appendChild(msgBubble(v, i * 600)); });
      body.appendChild(feed);
    }

    if (ch.stats) {
      var grid = el('div', { class: 'stat-grid' });
      ch.stats.forEach(function (s) {
        var valEl = el('div', { class: 'stat-value', text: '0' + s.suffix });
        grid.appendChild(el('div', { class: 'card stat' }, [valEl, el('div', { class: 'stat-label', text: s.label })]));
        countUp(valEl, s.value, s.suffix);
      });
      body.appendChild(grid);
    }

    if (ch.quotes) {
      body.appendChild(el('div', { class: 'prose' }, ch.quotes.map(function (q) {
        return el('div', { class: 'card quote-card' }, [
          el('span', { text: '“' + q.text + '”' }),
          el('div', { class: 'src', text: '— ' + q.from + ', internal survey' })
        ]);
      })));
    }

    if (ch.closer) body.appendChild(el('div', { class: 'callout', text: ch.closer }));

    var isLast = chapterIdx === SIM.BRIEFING.length - 1;
    var nav = el('div', { class: 'stage-nav' }, [
      chapterIdx > 0
        ? el('button', { class: 'btn btn-ghost', text: '← Back', onclick: function () { chapterIdx--; renderBriefing(); } })
        : el('span'),
      el('div', { class: 'progress-dots', 'aria-label': 'Chapter ' + (chapterIdx + 1) + ' of ' + SIM.BRIEFING.length },
        SIM.BRIEFING.map(function (_, i) { return el('span', { class: 'dot' + (i <= chapterIdx ? ' on' : '') }); })),
      el('button', {
        class: 'btn',
        text: isLast ? 'Make your first decision →' : 'Continue →',
        onclick: function () {
          if (isLast) goStep('decision1');
          else { chapterIdx++; renderBriefing(); }
        }
      })
    ]);

    root.appendChild(frag([stageHead(ch.kicker, ch.title), body, nav]));
  }

  function countUp(node, target, suffix) {
    if (REDUCED) { node.textContent = target + suffix; return; }
    var start = null, dur = 900;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- decisions ---------------- */
  function slotColor(slot) { return 'var(--s' + slot + ')'; }

  function renderDecision(decision, point, branchSlot) {
    var root = stageRoot();
    var selected = null;

    var list = el('div', { class: 'opt-list', role: 'radiogroup', 'aria-label': decision.title });
    var confirmWrap = el('div');

    decision.options.forEach(function (opt) {
      var slot = opt.slot || branchSlot;
      var card = el('button', {
        class: 'opt', type: 'button', role: 'radio', 'aria-checked': 'false',
        style: '--opt-color:' + slotColor(slot),
        onclick: function () { select(opt, card); }
      }, [
        el('div', { class: 'opt-top' }, [
          el('span', { class: 'letter', text: opt.letter }),
          el('h4', { text: opt.title }),
          el('span', { class: 'chip opt-tag', text: opt.tag })
        ]),
        el('p', { text: opt.text })
      ]);
      list.appendChild(card);
    });

    function select(opt, card) {
      selected = opt;
      list.querySelectorAll('.opt').forEach(function (c) { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      confirmWrap.innerHTML = '';
      var ta = el('textarea', { maxlength: '1200', placeholder: decision.rationalePrompt });
      var btn = el('button', { class: 'btn', text: 'Lock in option ' + opt.letter, onclick: lockIn });
      function lockIn() {
        btn.disabled = true;
        api('/api/decision', authed({ point: point, choice: opt.id, rationale: ta.value })).then(function (data) {
          state = data.student;
          render();
        }).catch(function (err) { btn.disabled = false; toast(err.message); });
      }
      confirmWrap.appendChild(el('div', { class: 'card confirm-panel reveal' }, [
        el('div', { class: 'picked' }, [
          el('strong', { text: 'Your move: ' }),
          el('span', { text: opt.title + '. ' }),
          el('span', { class: 'muted', text: 'This can’t be changed once locked in.' })
        ]),
        ta, btn
      ]));
      confirmWrap.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' });
    }

    root.appendChild(frag([
      timeDivider(decision.timeLabel),
      stageHead(null, decision.title),
      el('p', { class: 'case-p', text: decision.intro }),
      el('div', { style: 'height:8px' }),
      list,
      confirmWrap
    ]));
  }

  /* ---------------- outcomes ---------------- */
  function renderOutcome1() {
    var root = stageRoot();
    var branch = SIM.BRANCHES[state.decisions.d1.choice];
    var feed = el('div', { class: 'feed' });

    branch.interlude.forEach(function (p) { feed.appendChild(el('p', { class: 'case-p', text: p })); });
    branch.reactions.forEach(function (v, i) { feed.appendChild(msgBubble(v, 400 + i * 700)); });

    var btn = el('button', { class: 'btn', text: 'Face your next decision →', onclick: function () { goStep('decision2'); } });
    var nav = el('div', { class: 'stage-nav reveal' }, [el('span'), btn]);
    if (!REDUCED) nav.style.animationDelay = (400 + branch.reactions.length * 700) + 'ms';

    root.appendChild(frag([
      timeDivider(branch.timeLabel),
      stageHead('What happened next', branch.outcomeTitle),
      feed, nav
    ]));
  }

  function renderOutcome2() {
    var root = stageRoot();
    var d1 = state.decisions.d1.choice, d2 = state.decisions.d2.choice;
    var reactions = SIM.OUTCOME2_REACTIONS[d1 + ':' + d2] || [];
    var opt = SIM.d2Option(d1, d2);
    var feed = el('div', { class: 'feed' }, [
      el('p', { class: 'case-p', text: 'You lock in the call: ' + opt.title.toLowerCase() + '. Word travels fast. Over the following weeks, the consequences take shape.' }
      )].concat(reactions.map(function (v, i) { return msgBubble(v, 400 + i * 700); })));

    var nav = el('div', { class: 'stage-nav reveal' }, [
      el('span'),
      el('button', { class: 'btn', text: 'See where this leads →', onclick: function () { goStep('ending'); } })
    ]);
    if (!REDUCED) nav.style.animationDelay = (400 + reactions.length * 700) + 'ms';

    root.appendChild(frag([
      timeDivider('The weeks that follow'),
      stageHead('Consequences', 'The company reacts'),
      feed, nav
    ]));
  }

  /* ---------------- ending ---------------- */
  var TONE_WORD = { great: 'Transformative', good: 'Strong', mixed: 'Partial win', poor: 'Setback', bad: 'Crisis' };

  function renderEnding() {
    var root = stageRoot();
    var e = state.ending;
    var d1opt = SIM.d1Option(state.decisions.d1.choice);
    var d2opt = SIM.d2Option(state.decisions.d1.choice, state.decisions.d2.choice);

    var banner = el('div', { class: 'card ending-banner' }, [
      el('div', { class: 'icon', text: e.icon, 'aria-hidden': 'true' }),
      el('h2', { text: e.title }),
      el('div', { class: 'tone-chip', text: TONE_WORD[e.tone] + ' outcome' })
    ]);

    var recap = el('div', { class: 'path-recap' }, [
      el('span', { text: 'Your path:' }),
      el('span', { class: 'chip' }, [el('span', { class: 'swatch', style: 'background:' + slotColor(d1opt.slot) }), el('span', { text: d1opt.title })]),
      el('span', { text: '→' }),
      el('span', { class: 'chip' }, [el('span', { class: 'swatch', style: 'background:' + slotColor(d1opt.slot) }), el('span', { text: d2opt.title })])
    ]);

    var finals = el('div', { class: 'final-metrics' }, SIM.METRICS.map(function (m) {
      var v = state.metrics[m.id], d = v - m.start;
      return el('div', { class: 'card stat' }, [
        el('div', { class: 'stat-label', text: m.label }),
        el('div', { class: 'stat-value', text: String(v) }),
        el('div', { class: 'delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'flat'), text: (d > 0 ? '▲ +' : d < 0 ? '▼ −' : '· ') + Math.abs(d) + ' vs start' })
      ]);
    }));

    root.appendChild(frag([
      timeDivider('One year later'),
      banner,
      el('div', { style: 'height:14px' }),
      el('div', { class: 'stage-body' }, [
        recap,
        el('div', { class: 'prose' }, e.summary.map(function (p) { return el('p', { class: 'case-p', text: p }); })),
        el('ul', { class: 'ending-bullets' }, e.bullets.map(function (b) { return el('li', { text: b }); })),
        el('div', { class: 'callout' }, [el('strong', { text: 'The takeaway: ' }), el('span', { text: e.lesson })]),
        el('div', { class: 'kicker', text: 'Where the culture landed' }),
        finals
      ]),
      el('div', { class: 'stage-nav' }, [
        el('span', { class: 'small', text: 'This is one of six endings. The class debrief compares them.' }),
        el('button', { class: 'btn', text: 'One last task →', onclick: function () { goStep('reflection'); } })
      ])
    ]));
  }

  /* ---------------- reflection ---------------- */
  function renderReflection() {
    var root = stageRoot();
    var R = SIM.REFLECTION;
    var ranking = [];

    var slots = el('div', { class: 'rank-slots' });
    var grid = el('div', { class: 'init-grid', role: 'group', 'aria-label': 'Pick your top three initiatives' });
    var ta = el('textarea', { maxlength: '1200', placeholder: 'e.g. “Flexible hours first, because the survey shows hours are the root problem, and retention savings outweigh…”' });
    var submit = el('button', { class: 'btn', text: 'Submit & finish', disabled: 'true', onclick: doSubmit });

    function refresh() {
      slots.innerHTML = '';
      for (var i = 0; i < 3; i++) {
        var item = ranking[i] ? SIM.initiativeById(ranking[i]).label : '—';
        slots.appendChild(el('span', { class: 'chip', text: (i + 1) + '. ' + item }));
      }
      grid.querySelectorAll('.init').forEach(function (c) {
        var idx = ranking.indexOf(c.dataset.id);
        c.classList.toggle('ranked', idx >= 0);
        var badge = c.querySelector('.rank-badge');
        if (idx >= 0) { badge.textContent = String(idx + 1); badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
        c.setAttribute('aria-pressed', idx >= 0 ? 'true' : 'false');
      });
      if (ranking.length === 3) submit.removeAttribute('disabled');
      else submit.setAttribute('disabled', 'true');
    }

    R.initiatives.forEach(function (init) {
      var card = el('button', {
        class: 'init', type: 'button', 'data-id': init.id, 'aria-pressed': 'false',
        onclick: function () {
          var idx = ranking.indexOf(init.id);
          if (idx >= 0) ranking.splice(idx, 1);
          else if (ranking.length < 3) ranking.push(init.id);
          else { toast('You already have three — tap one to swap it out.'); return; }
          refresh();
        }
      }, [
        el('span', { class: 'rank-badge hidden' }),
        el('h5', { text: init.label }),
        el('p', { text: init.desc })
      ]);
      grid.appendChild(card);
    });

    function doSubmit() {
      submit.disabled = true;
      api('/api/reflection', authed({ ranking: ranking, justification: ta.value })).then(function (data) {
        state = data.student;
        render();
      }).catch(function (err) { submit.disabled = false; toast(err.message); });
    }

    root.appendChild(frag([
      timeDivider(R.timeLabel),
      stageHead('Step out of the story', R.title),
      el('div', { class: 'stage-body' }, [
        el('p', { class: 'case-p', text: R.intro }),
        slots, grid,
        el('div', {}, [el('label', { text: R.justificationPrompt }), ta]),
        el('div', { class: 'stage-nav' }, [el('span'), submit])
      ])
    ]));
    refresh();
  }

  /* ---------------- done ---------------- */
  function renderDone() {
    var root = stageRoot();
    var e = state.ending;
    var picks = (state.reflection && state.reflection.ranking || []).map(function (id, i) {
      return el('span', { class: 'chip', text: (i + 1) + '. ' + SIM.initiativeById(id).label });
    });
    root.appendChild(el('div', { class: 'card done-hero' }, [
      el('div', { class: 'big', text: '✅', 'aria-hidden': 'true' }),
      el('h2', { text: 'You’re done, ' + state.name.split(' ')[0] + '.' }),
      el('p', { class: 'case-p', text: 'Your ending: ' + e.icon + ' “' + e.title + '” — one of six ways this story can go. Your choices, rationale, and recommendations are with your instructor for the class debrief.' }),
      el('div', { class: 'rank-slots', style: 'justify-content:center' }, picks),
      el('p', { class: 'small', text: 'Keep this tab open — you’ll want your path in front of you during the discussion.' })
    ]));
  }

  /* ---------------- router ---------------- */
  function render() {
    renderMetrics(true);
    $('#who-chip').textContent = state.name + ' · ' + state.code;
    switch (state.step) {
      case 'briefing': return renderBriefing();
      case 'decision1': return renderDecision(SIM.DECISION1, 'd1', null);
      case 'outcome1': return renderOutcome1();
      case 'decision2': {
        var d1 = state.decisions.d1.choice;
        return renderDecision(SIM.BRANCHES[d1].decision, 'd2', SIM.d1Option(d1).slot);
      }
      case 'outcome2': return renderOutcome2();
      case 'ending': return renderEnding();
      case 'reflection': return renderReflection();
      case 'done': return renderDone();
    }
  }

  function enterSim() {
    $('#screen-join').classList.add('hidden');
    $('#screen-sim').classList.remove('hidden');
    prevMetrics = null;
    renderMetrics(false);
    render();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    $('#credit-join').textContent = SIM.META.copyright;
    $('#credit-sim').textContent = SIM.META.copyright;

    var params = new URLSearchParams(location.search);
    if (params.get('code')) $('#join-code').value = params.get('code').toUpperCase();

    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { /* ignore */ }

    if (saved && saved.id && saved.secret) {
      me = saved;
      api('/api/state', authed()).then(function (data) {
        state = data.student;
        enterSim();
      }).catch(function () {
        localStorage.removeItem(LS_KEY);
        me = null;
      });
    }

    $('#join-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = $('#join-btn');
      btn.disabled = true;
      $('#join-error').textContent = '';
      api('/api/join', {
        name: $('#join-name').value,
        code: $('#join-code').value
      }).then(function (data) {
        me = { id: data.id, secret: data.secret };
        try { localStorage.setItem(LS_KEY, JSON.stringify(me)); } catch (e) { /* ignore */ }
        state = data.student;
        enterSim();
      }).catch(function (err) {
        btn.disabled = false;
        $('#join-error').textContent = err.message;
      });
    });
  }

  boot();
})();
