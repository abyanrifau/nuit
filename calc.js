/* =====================================================================
   Nuit Works — calc.js
   Live cost estimator for calculate.html. Pure arithmetic on the form
   controls; nothing is submitted and nothing leaves the page.

   Every figure below is a low–high range, so the running total is a range
   too. Rush delivery is the exception: it is a percentage of everything
   else, so it is applied last, to both ends.
   ===================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('calc-form');
  if (!form) return;

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  // Starting price per type of site. Design complexity has no control here: it is
  // priced from the brief, which is why the page gives an estimate, not a quote.
  const PACKAGES = {
    informational: { name: 'Informational site',         price: 5000 },
    booking:       { name: 'Booking & reservation site', price: 8500 },
    retail:        { name: 'Retail & e-commerce site',   price: 10000 }
  };

  // `each` marks the two add-ons that can be bought more than once; their
  // stepper multiplies the range. `pct` marks the multiplier row.
  const ADDONS = {
    page:   { name: 'Extra page',                 low: 500,  high: 1000, each: true },
    lang:   { name: 'Multi-language',             low: 1000, high: 2000, each: true },
    social: { name: 'Social media feed',          low: 300,  high: 500 },
    seo:    { name: 'Basic SEO setup',            low: 500,  high: 1000 },
    rush:   { name: 'Rush delivery',              pct: [0.20, 0.30] }
  };

  const SUBS = {
    none:    { name: 'None',         price: 0 },
    hosting: { name: 'Hosting Plan', price: 750 },
    plus:    { name: 'Plus Plan',    price: 1000 }
  };

  const nf = new Intl.NumberFormat('en-US');
  const mvr = (n) => 'MVR ' + nf.format(Math.round(n));
  const range = (lo, hi) => (Math.round(lo) === Math.round(hi))
    ? mvr(lo)
    : mvr(lo) + ' – ' + nf.format(Math.round(hi));

  const totalEl = $('[data-total]');
  const monthEl = $('[data-month]');
  const linesEl = $('[data-lines]');
  const quoteEl = $('[data-quote]');

  // Quantities live here rather than in the DOM so a toggled-off add-on
  // remembers its count if the visitor turns it back on.
  const counts = { page: 1, lang: 1 };

  const boxFor = (id) => $('[data-opt="' + id + '"]');

  function syncSteppers() {
    Object.keys(counts).forEach((id) => {
      const wrap = $('[data-stepper="' + id + '"]');
      if (!wrap) return;
      const on = boxFor(id) && boxFor(id).checked;
      wrap.classList.toggle('is-off', !on);
      $$('button', wrap).forEach((b) => { b.disabled = !on; });
      const out = $('[data-count="' + id + '"]', wrap);
      if (out) out.textContent = String(counts[id]);
    });
  }

  function compute() {
    const pkgKey = (form.querySelector('input[name="pkg"]:checked') || {}).value || 'informational';
    const pkg = PACKAGES[pkgKey];
    const subKey = (form.querySelector('input[name="sub"]:checked') || {}).value || 'none';
    const sub = SUBS[subKey];

    let lo = pkg.price, hi = pkg.price;
    const lines = [{ label: pkg.name + ' (starting from)', value: mvr(pkg.price) }];

    Object.keys(ADDONS).forEach((id) => {
      const box = boxFor(id);
      if (!box || !box.checked || ADDONS[id].pct) return;
      const a = ADDONS[id];
      const qty = a.each ? counts[id] : 1;
      const l = a.low * qty, h = a.high * qty;
      lo += l; hi += h;
      lines.push({
        label: a.name + (a.each && qty > 1 ? ' × ' + qty : ''),
        value: '+' + (l === h ? nf.format(l) : nf.format(l) + '–' + nf.format(h))
      });
    });

    // Applied last: a percentage of everything above it.
    const rush = boxFor('rush');
    if (rush && rush.checked) {
      const p = ADDONS.rush.pct;
      const addLo = lo * p[0], addHi = hi * p[1];
      lines.push({
        label: 'Rush delivery (+20–30%)',
        value: '+' + nf.format(Math.round(addLo)) + '–' + nf.format(Math.round(addHi))
      });
      lo += addLo; hi += addHi;
    }

    return { lo: lo, hi: hi, lines: lines, sub: sub, subKey: subKey, pkg: pkg };
  }

  function render() {
    const r = compute();

    totalEl.textContent = range(r.lo, r.hi);

    if (r.subKey === 'none') {
      monthEl.hidden = true;
      monthEl.textContent = '';
    } else {
      monthEl.hidden = false;
      monthEl.textContent = '+ ' + mvr(r.sub.price) + '/month ongoing';
    }

    linesEl.innerHTML = '';
    r.lines.forEach((ln) => {
      const li = document.createElement('li');
      const a = document.createElement('span');
      a.textContent = ln.label;
      const b = document.createElement('b');
      b.textContent = ln.value;
      li.appendChild(a); li.appendChild(b);
      linesEl.appendChild(li);
    });
    if (r.subKey !== 'none') {
      const li = document.createElement('li');
      li.className = 'is-sub';
      const a = document.createElement('span');
      a.textContent = r.sub.name;
      const b = document.createElement('b');
      b.textContent = mvr(r.sub.price) + '/mo';
      li.appendChild(a); li.appendChild(b);
      linesEl.appendChild(li);
    }

    // The site has no form to post to, so the quote travels as a pre-written email.
    // Gmail's web compose screen rather than mailto: a mailto link does nothing on a
    // computer with no mail app set up, and the button would look broken.
    const body = []
      .concat(["Hi Nuit Works,", '', "I'd like a quote based on my estimate from your calculator:", ''])
      .concat(r.lines.map((l) => '- ' + l.label + ': ' + l.value))
      .concat(r.subKey !== 'none' ? ['- ' + r.sub.name + ': ' + mvr(r.sub.price) + '/month ongoing'] : [])
      .concat(['', 'Estimated one-time cost: ' + range(r.lo, r.hi), '', 'Business name: ', 'What we do: ', '', 'Thanks,'])
      .join('\n');
    const titleCase = (s) => s.replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
    quoteEl.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent('hello@nuit.works')
      + '&su=' + encodeURIComponent('Quote Request — ' + titleCase(r.pkg.name) + ' (' + range(r.lo, r.hi) + ')')
      + '&body=' + encodeURIComponent(body);

    syncSteppers();
  }

  form.addEventListener('change', render);

  form.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-btn');
    if (!btn) return;
    e.preventDefault();
    const wrap = btn.closest('[data-stepper]');
    const id = wrap.getAttribute('data-stepper');
    const next = counts[id] + (+btn.getAttribute('data-step'));
    counts[id] = Math.max(1, Math.min(20, next));
    render();
  });

  // Selected cards get a class so the styling does not depend on :has().
  const markPicked = () => {
    $$('.pick').forEach((el) => {
      const input = $('input', el);
      el.classList.toggle('is-picked', !!input && input.checked);
    });
    $$('.opt').forEach((el) => {
      const input = $('input[type="checkbox"]', el);
      el.classList.toggle('is-on', !!input && input.checked);
    });
  };
  form.addEventListener('change', markPicked);

  // On mobile the summary is docked to the bottom edge. Retire it once the footer
  // reaches the upper part of the viewport, so it never sits on top of the footer.
  // Watching the footer rather than the controls: the calculator section is taller
  // than the screen, so it still counts as intersecting at the very bottom of the page.
  const summary = $('.calc-summary');
  const footer = $('.footer');
  if (summary && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      summary.classList.toggle('is-away', e.isIntersecting);
    }, { rootMargin: '0px 0px -40% 0px' }).observe(footer);
  }

  markPicked();
  render();
})();
