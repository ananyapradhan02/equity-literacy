/* equity literacy v0.1: hash routes, lesson progress, recall reveal, two calculators.
   everything stays in this browser (localStorage). */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* theme */
  $('theme').addEventListener('click', function () {
    var root = document.documentElement;
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* routing */
  var TITLES = {
    'home': 'equity literacy',
    'lesson-1': 'options basics · equity literacy',
    'lesson-2': 'vesting, cliffs and triggers · equity literacy',
    'lesson-3': '409a versus preferred · equity literacy',
    'cliff': 'cliff date calculator · equity literacy',
    'dilution': 'dilution calculator · equity literacy'
  };
  function route() {
    var name = (location.hash || '#/').replace(/^#\/?/, '') || 'home';
    if (!TITLES[name]) name = 'notfound';
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) views[i].hidden = views[i].getAttribute('data-view') !== name;
    document.title = TITLES[name] || 'not here · equity literacy';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* lesson progress */
  var read = load('el-read', {});
  function renderProgress() {
    var n = 0;
    ['1', '2', '3'].forEach(function (k) {
      if (read[k]) n++;
      var card = document.querySelector('[data-lesson-card="' + k + '"] .read-stamp');
      if (card) card.hidden = !read[k];
      var btn = document.querySelector('[data-lesson="' + k + '"] .mark-read');
      if (btn) {
        btn.setAttribute('aria-pressed', read[k] ? 'true' : 'false');
        btn.textContent = read[k] ? 'read' : 'mark as read';
      }
    });
    $('progress-count').textContent = n + '/3';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.lesson'), function (el) {
    var k = el.getAttribute('data-lesson');
    el.querySelector('.mark-read').addEventListener('click', function () {
      read[k] = !read[k];
      save('el-read', read);
      renderProgress();
    });
  });

  /* recall reveal */
  Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (btn) {
    btn.addEventListener('click', function () {
      var why = btn.nextElementSibling;
      var open = why.hidden;
      why.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'hide the reasoning' : 'show the reasoning';
    });
  });

  /* copy helper: clipboard api where allowed, textarea fallback on file:// */
  function copyText(text, statusEl) {
    function done() { statusEl.textContent = 'copied'; setTimeout(function () { statusEl.textContent = ''; }, 2000); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else statusEl.textContent = 'copy did not work here, select the text by hand';
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  /* dates, kept as plain y/m/d to avoid timezone drift */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parseISO(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function addMonths(dt, k) {
    var total = dt.m - 1 + k;
    var y = dt.y + Math.floor(total / 12), m = (total % 12) + 1;
    var dim = new Date(y, m, 0).getDate();
    return { y: y, m: m, d: Math.min(dt.d, dim) };
  }
  function fmtDate(dt) { return pad(dt.d) + '.' + pad(dt.m) + '.' + String(dt.y).slice(-2); }
  function key(dt) { return dt.y * 10000 + dt.m * 100 + dt.d; }
  function todayDt() { var t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; }

  /* cliff calculator */
  function vestingEvents(total, months, cliff, freq) {
    var marks = [];
    if (cliff >= months) marks.push(months);
    else {
      var m = freq;
      if (cliff > 0) { marks.push(cliff); m = cliff + freq; }
      for (; m < months; m += freq) marks.push(m);
      marks.push(months);
    }
    var prev = 0;
    return marks.map(function (mo, i) {
      var cum = i === marks.length - 1 ? total : Math.floor(total * mo / months);
      var ev = { month: mo, vests: cum - prev, cum: cum };
      prev = cum;
      return ev;
    });
  }

  var cliffForm = $('cliff-form');
  var cliffSaved = load('el-cliff', null);
  if (cliffSaved) Object.keys(cliffSaved).forEach(function (k) { if (cliffForm.elements[k]) cliffForm.elements[k].value = cliffSaved[k]; });
  var cliffText = '';

  function renderCliff() {
    var f = cliffForm.elements;
    save('el-cliff', { grant: f.grant.value, shares: f.shares.value, months: f.months.value, cliff: f.cliff.value, freq: f.freq.value });
    var g = parseISO(f.grant.value);
    var total = Math.floor(+f.shares.value), months = Math.floor(+f.months.value);
    var cliff = Math.max(0, Math.floor(+f.cliff.value || 0)), freq = +f.freq.value || 1;
    var today = todayDt();
    $('c-today').textContent = 'today ' + fmtDate(today);
    var ok = !!g && total > 0 && months > 0;
    $('c-empty').hidden = ok;
    var tbody = $('c-table');
    clear(tbody);
    if (!ok) {
      ['c-out-date', 'c-out-cliff', 'c-out-today', 'c-out-end'].forEach(function (id) { $(id).textContent = '–'; });
      $('c-count').textContent = '';
      cliffText = '';
      return;
    }
    var evs = vestingEvents(total, months, cliff, freq);
    var vestedToday = 0, lastPast = -1;
    evs.forEach(function (ev, i) {
      ev.date = addMonths(g, ev.month);
      if (key(ev.date) <= key(today)) { vestedToday = ev.cum; lastPast = i; }
    });
    var hasCliff = cliff > 0;
    $('c-out-date').textContent = hasCliff ? fmtDate(evs[0].date) : 'no cliff';
    $('c-out-cliff').textContent = (hasCliff ? evs[0].vests : 0).toLocaleString('en-US');
    $('c-out-today').textContent = vestedToday.toLocaleString('en-US') + ' (' + (vestedToday / total * 100).toFixed(1) + '%)';
    $('c-out-end').textContent = fmtDate(evs[evs.length - 1].date);
    $('c-count').textContent = String(evs.length);
    var rows = [];
    evs.forEach(function (ev, i) {
      var tr = document.createElement('tr');
      if (i < lastPast) tr.className = 'past';
      if (i === lastPast) tr.className = 'now';
      var cells = [String(i + 1), fmtDate(ev.date), ev.vests.toLocaleString('en-US'), ev.cum.toLocaleString('en-US'), (ev.cum / total * 100).toFixed(1)];
      cells.forEach(function (c, j) {
        var td = document.createElement('td');
        td.className = 'data' + (j >= 2 ? ' right' : '');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      rows.push(fmtDate(ev.date) + '  +' + ev.vests + '  = ' + ev.cum);
    });
    cliffText = [
      'vesting schedule (equity literacy)',
      'grant ' + fmtDate(g) + ', ' + total + ' shares, ' + months + ' months, ' + cliff + '-month cliff, ' + (freq === 3 ? 'quarterly' : 'monthly'),
      'cliff date: ' + $('c-out-date').textContent,
      'shares at cliff: ' + $('c-out-cliff').textContent,
      'vested as of ' + fmtDate(today) + ': ' + $('c-out-today').textContent,
      'fully vested: ' + $('c-out-end').textContent,
      '',
      rows.join('\n')
    ].join('\n');
  }
  cliffForm.addEventListener('input', renderCliff);
  cliffForm.addEventListener('change', renderCliff);
  $('c-copy').addEventListener('click', function () { if (cliffText) copyText(cliffText, $('c-copied')); });

  /* dilution calculator.
     pool top-up p is a share of post-money, created before the round:
     price = (pre - p * post) / fd; pool = p * post / price; new = raise / price. */
  function dilution(own, fd, pre, raise, poolPct) {
    var p = poolPct / 100, post = pre + raise;
    var price = (pre - p * post) / fd;
    if (!(price > 0)) return null;
    var poolShares = p * post / price, newShares = raise / price;
    var postShares = fd + poolShares + newShares;
    return {
      before: own / fd, after: own / postShares, price: price, value: own * price,
      headline: pre / fd, poolShares: poolShares, newShares: newShares, postShares: postShares, postVal: post
    };
  }

  var dilForm = $('dil-form');
  var dilSaved = load('el-dilution', null);
  if (dilSaved) Object.keys(dilSaved).forEach(function (k) { if (dilForm.elements[k]) dilForm.elements[k].value = dilSaved[k]; });
  var dilText = '';

  function renderDilution() {
    var f = dilForm.elements;
    save('el-dilution', { cur: f.cur.value, own: f.own.value, fd: f.fd.value, pre: f.pre.value, raise: f.raise.value, pool: f.pool.value });
    var inr = f.cur.value === 'INR';
    var loc = inr ? 'en-IN' : 'en-US', sym = inr ? '₹' : '$';
    function money(v, dp) { return sym + v.toLocaleString(loc, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
    function num(v) { return Math.round(v).toLocaleString(loc); }
    function pct(v) { return (v * 100).toFixed(2) + '%'; }
    var own = +f.own.value || 0, fd = +f.fd.value, pre = +f.pre.value, raise = +f.raise.value || 0, pool = +f.pool.value || 0;
    var valid = fd > 0 && pre > 0;
    var r = valid ? dilution(own, fd, pre, raise, pool) : null;
    $('d-empty').hidden = !!r || !valid;
    var ids = ['d-out-before', 'd-out-after', 'd-out-price', 'd-out-value', 'd-t-headline', 'd-t-pool', 'd-t-new', 'd-t-post', 'd-t-postval'];
    if (!r) { ids.forEach(function (id) { $(id).textContent = '–'; }); dilText = ''; return; }
    $('d-out-before').textContent = pct(r.before);
    $('d-out-after').textContent = pct(r.after);
    $('d-out-price').textContent = money(r.price, 2);
    $('d-out-value').textContent = money(r.value, 0);
    $('d-t-headline').textContent = money(r.headline, 2);
    $('d-t-pool').textContent = num(r.poolShares);
    $('d-t-new').textContent = num(r.newShares);
    $('d-t-post').textContent = num(r.postShares);
    $('d-t-postval').textContent = money(r.postVal, 0);
    dilText = [
      'dilution in one round (equity literacy)',
      'you own ' + num(own) + ' of ' + num(fd) + ' fully diluted shares',
      'round: ' + money(pre, 0) + ' pre-money, ' + money(raise, 0) + ' raised, pool top-up ' + pool + '% of post-money',
      'ownership before: ' + pct(r.before),
      'ownership after: ' + pct(r.after),
      'new price per share: ' + money(r.price, 2) + ' (headline ' + money(r.headline, 2) + ')',
      'value of your stake at the new price: ' + money(r.value, 0)
    ].join('\n');
  }
  dilForm.addEventListener('input', renderDilution);
  dilForm.addEventListener('change', renderDilution);
  $('d-copy').addEventListener('click', function () { if (dilText) copyText(dilText, $('d-copied')); });

  renderProgress();
  renderCliff();
  renderDilution();
  route();
})();
