/* ==========================================================================
   ABX Intelligence: interaction layer
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------
     Sticky nav + scroll progress
     ------------------------------------------------------------------ */
  var nav = $('.nav');
  var bar = $('.scroll-bar');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var toggle = $('.nav-toggle');
  var menu = $('.nav-mobile');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    };
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  var revealables = $$('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseFloat(el.getAttribute('data-delay') || '0');
        setTimeout(function () { el.classList.add('is-in'); }, delay * 1000);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* Auto-stagger children inside [data-stagger] */
  $$('[data-stagger]').forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 0.08;
    $$('[data-reveal]', group).forEach(function (el, i) {
      if (!el.hasAttribute('data-delay')) el.setAttribute('data-delay', (i * step).toFixed(2));
    });
  });

  /* ------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------ */
  $$('[data-count]').forEach(function (el) {
    el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
  });

  /* ------------------------------------------------------------------
     Process timeline progressive lighting
     ------------------------------------------------------------------ */
  var process = $('.process');
  if (process && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        process.classList.add('is-in');
        $$('.step', process).forEach(function (s) { s.classList.add('is-lit'); });
        pio.disconnect();
      });
    }, { threshold: 0.35 });
    pio.observe(process);
  }

  /* ------------------------------------------------------------------
     Accordion
     ------------------------------------------------------------------ */
  $$('.acc-item').forEach(function (item) {
    var btn = $('.acc-btn', item);
    var panel = $('.acc-panel', item);
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.height = open ? panel.scrollHeight + 'px' : '0px';
    });
    panel.addEventListener('transitionend', function () {
      if (item.classList.contains('is-open')) panel.style.height = 'auto';
    });
  });

  /* ------------------------------------------------------------------
     Scrollspy (homepage anchors)
     ------------------------------------------------------------------ */
  var spyLinks = $$('.nav-links a[href^="#"], .nav-links a[href*="index.html#"]');
  var spyTargets = spyLinks.map(function (a) {
    var hash = a.getAttribute('href').split('#')[1];
    return hash ? document.getElementById(hash) : null;
  });
  if (spyTargets.some(Boolean) && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (a, i) {
          a.classList.toggle('is-active', spyTargets[i] === en.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(function (t) { if (t) sio.observe(t); });
  }

  /* ------------------------------------------------------------------
     Contact form: validate, then submit via Web3Forms
     ------------------------------------------------------------------ */
  var form = $('#abx-form');
  if (form) {
    var status = $('#form-status');
    var submit = $('button[type="submit"]', form);

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = 'form-status is-on' + (kind ? ' is-' + kind : '');
    }

    function fieldError(el, msg) {
      var wrap = el.closest('.field');
      var note = $('.field-error', wrap);
      if (!note) {
        note = document.createElement('p');
        note.className = 'field-error';
        note.id = el.id + '-error';
        wrap.appendChild(note);
      }
      note.textContent = msg;
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', note.id);
    }

    function clearError(el) {
      var wrap = el.closest('.field');
      var note = $('.field-error', wrap);
      if (note) note.remove();
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    }

    function validate() {
      var problems = [];
      $$('[required]', form).forEach(function (el) {
        clearError(el);
        var val = (el.value || '').trim();
        if (el.type === 'checkbox') {
          if (!el.checked) {
            fieldError(el, 'Please confirm this before sending.');
            problems.push(el);
          }
          return;
        }
        if (!val) {
          fieldError(el, 'This field is required.');
          problems.push(el);
        } else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
          fieldError(el, 'Please enter a valid email address.');
          problems.push(el);
        }
      });
      return problems;
    }

    $$('[required]', form).forEach(function (el) {
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid')) clearError(el);
      });
      el.addEventListener('change', function () {
        if (el.getAttribute('aria-invalid')) clearError(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var problems = validate();
      if (problems.length) {
        setStatus('Please correct the highlighted fields before sending.', 'error');
        problems[0].focus();
        return;
      }

      var key = form.querySelector('input[name="access_key"]');
      if (!key || !key.value || key.value.indexOf('YOUR_') === 0) {
        setStatus('This form is not connected yet. Please email us directly instead.', 'error');
        return;
      }

      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Sending';
      setStatus('Sending your message.', '');

      var data = Object.fromEntries(new FormData(form).entries());

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            setStatus('Thank you. Your message has been received and we will respond shortly.', 'ok');
            form.reset();
          } else {
            setStatus('Something went wrong. Please email us directly instead.', 'error');
          }
        })
        .catch(function () {
          setStatus('Network error. Please email us directly instead.', 'error');
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = label;
        });
    });
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------------
     Rotating headline
     Cycles the accent line. Holds still for reduced motion, and pauses
     while the tab is hidden so it never animates to nobody.
     ------------------------------------------------------------------ */
  $$('[data-rotate]').forEach(function (host) {
    var words = $$('.rot-word', host);
    if (words.length < 2 || reduced) return;
    var at = 0;
    setInterval(function () {
      if (document.hidden) return;
      var cur = words[at];
      at = (at + 1) % words.length;
      var next = words[at];
      cur.classList.remove('is-in');
      cur.classList.add('is-out');
      next.classList.remove('is-out');
      next.classList.add('is-in');
      setTimeout(function () { cur.classList.remove('is-out'); }, 640);
    }, 2600);
  });

  /* ------------------------------------------------------------------
     Work strip
     One panel open, the other two held at an edge. It turns on its own;
     clicking a panel opens it and restarts the timer. No pause on hover:
     this fills most of the hero, so a cursor resting anywhere over it
     would stop the rotation for as long as it sat there.
     ------------------------------------------------------------------ */
  $$('[data-work]').forEach(function (work) {
    var panels = $$('.work-panel', work);
    if (panels.length < 2) return;

    var at = 0, hold = null;
    var HOLD = 5200;
    var mobile = window.matchMedia('(max-width:760px)');

    function open(n) {
      at = (n + panels.length) % panels.length;
      panels.forEach(function (p, i) { p.classList.toggle('is-open', i === at); });
      paintDots();
    }

    function tick() {
      clearTimeout(hold);
      hold = setTimeout(function () {
        if (!document.hidden) {
          if (mobile.matches) goTo(at + 1);
          else open(at + 1);
        }
        tick();
      }, HOLD);
    }

    panels.forEach(function (panel, i) {
      panel.addEventListener('click', function () { open(i); tick(); });
    });

    /* --- phones: a swipeable row, one card at a time -------------------
       The strip scrolls sideways and snaps. Whichever card sits in the
       middle is the open one, so its pointer replays and the dots follow.
       It moves on by itself on the same timer as desktop, but holds still
       while a finger is on it; letting go, or tapping a card, restarts the
       count, so it never jumps away from a card someone has just chosen. */
    var strip = $('.work-strip', work);
    var dots = $$('.work-dots i', work);

    function paintDots() {
      if (!dots) return;
      dots.forEach(function (d, i) { d.classList.toggle('on', i === at); });
    }

    /* scroll the strip, never the page. scrollIntoView would also nudge the
       page vertically when the hero is part-way off screen, which on a timer
       would move the page under someone reading further down. */
    /* The open card and the dots move first, then the strip follows.
       Leaving that to the scroll event let the two drift apart: when an
       event came late, the next tick aimed at the same card again and the
       row stuck on its second card. While the strip is being steered, the
       positions it passes on the way are ignored, so the dots do not flick
       back mid-slide; a timeout clears the steer if no event arrives. */
    var steer = -1, steerTimer = null;
    function goTo(n) {
      if (!strip) return;
      n = (n + panels.length) % panels.length;
      var p = panels[n];
      open(n);
      steer = n;
      clearTimeout(steerTimer);
      steerTimer = setTimeout(function () { steer = -1; }, 1200);
      strip.scrollTo({
        left: p.offsetLeft + p.offsetWidth / 2 - strip.clientWidth / 2,
        behavior: reduced ? 'auto' : 'smooth'
      });
    }

    function centred() {
      var mid = strip.scrollLeft + strip.clientWidth / 2, best = 0, gap = Infinity;
      panels.forEach(function (p, i) {
        var d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid);
        if (d < gap) { gap = d; best = i; }
      });
      return best;
    }

    if (strip) {
      strip.addEventListener('scroll', function () {
        if (!mobile.matches) return;
        var n = centred();
        if (steer > -1) {
          if (n === steer) steer = -1;
          return;
        }
        if (n !== at) open(n);
      }, { passive: true });

      panels.forEach(function (p, i) {
        p.addEventListener('click', function () { if (mobile.matches) goTo(i); });
      });

      /* a finger on the row holds it; letting go restarts the count */
      var hush = function () { clearTimeout(hold); steer = -1; };
      var resume = function () { if (!reduced) tick(); };
      strip.addEventListener('touchstart', hush, { passive: true });
      strip.addEventListener('touchend', resume, { passive: true });
      strip.addEventListener('touchcancel', resume, { passive: true });
    }
    paintDots();

    if (!reduced) tick();

    /* --- each mock replays itself while its own panel is open ---------- */
    if (reduced) return;

    panels.forEach(function (panel) {
      var mock = $('.pm', panel);
      if (!mock) return;
      var cursor = $('[data-cursor]', mock);
      var targets = $$('[data-hot]', mock);
      if (!cursor || !targets.length) return;

      var n = 0, timers = [];
      var wait = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

      function beat() {
        /* sit out while this panel is closed, so the pointer is never
           part-way through a walk when the panel opens */
        if (document.hidden || !panel.classList.contains('is-open')) {
          cursor.style.opacity = '0';
          n = 0;
          return wait(beat, 800);
        }

        var target = targets[n % targets.length];
        var box = target.getBoundingClientRect();
        var frame = mock.getBoundingClientRect();
        if (!box.width) { n++; return wait(beat, 400); }

        cursor.style.opacity = '1';
        cursor.style.transform = 'translate(' +
          (box.left - frame.left + box.width * 0.44) + 'px,' +
          (box.top - frame.top + box.height * 0.42) + 'px)';

        wait(function () {
          cursor.classList.add('is-click');
          target.classList.add('is-hot');
          wait(function () { cursor.classList.remove('is-click'); }, 150);
        }, 820);

        wait(function () {
          target.classList.remove('is-hot');
          n++;
          beat();
        }, 1950);
      }

      /* Started directly rather than from an observer. Three panels sharing
         one strip meant three observers on the same node, and only the first
         reliably fired -- so two of the three pointers never moved. The loop
         already sits out while its panel is closed, which is all the gating
         it needed. */
      wait(beat, 500);

      window.addEventListener('pagehide', function () { timers.forEach(clearTimeout); });
    });
  });

  /* ------------------------------------------------------------------
     Solutions page: tabs on phones
     Four long blocks become one at a time under a tab bar. Only active at
     phone widths, and only once this has run: without JavaScript, or on a
     wider screen, every block shows as normal.
     ------------------------------------------------------------------ */
  (function () {
    var bar = $('.sol-tabs');
    if (!bar) return;
    var tabs = $$('[data-tab]', bar);
    var ids = tabs.map(function (t) { return t.getAttribute('data-tab'); });
    var panes = ids.map(function (id) { return document.getElementById(id); });
    if (panes.some(function (p) { return !p; })) return;
    var phone = window.matchMedia('(max-width:760px)');

    function show(id) {
      tabs.forEach(function (t, i) {
        var on = ids[i] === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panes[i].classList.toggle('is-tab-hidden', !on);
      });
      var sel = tabs[ids.indexOf(id)];
      var br = bar.getBoundingClientRect(), sr = sel.getBoundingClientRect();
      if (sr.right > br.right - 24 || sr.left < br.left) {
        bar.scrollLeft += sr.left - br.left - 12;
      }
    }

    function mode() {
      var on = phone.matches;
      document.documentElement.classList.toggle('has-sol-tabs', on);
      panes.forEach(function (p, i) {
        if (on) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', tabs[i].id); }
        else { p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); }
      });
    }

    function topOf(i) {
      if (phone.matches && panes[i].getBoundingClientRect().top < 0) {
        panes[i].scrollIntoView({ block: 'start' });
      }
    }

    /* jump without the page-wide smooth scroll animating it */
    function jumpTo(i) {
      if (!phone.matches) return;
      var root = document.documentElement, was = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      panes[i].scrollIntoView({ block: 'start' });
      root.style.scrollBehavior = was;
    }

    /* a link such as /solutions#automation opens that tab. The browser has
       already scrolled to the hash while every block was showing; hiding the
       others moves the target, so the jump is made again here, and once more
       after load in case fonts shifted the layout. */
    function fromHash() {
      var i = ids.indexOf((location.hash || '').slice(1));
      if (i < 0) return -1;
      show(ids[i]);
      jumpTo(i);
      return i;
    }

    /* mode first: until the bar is displayed it has no size, and show()
       measures it to keep the selected tab in view */
    mode();
    var linked = fromHash();
    if (linked < 0) show(ids[0]);
    else window.addEventListener('load', function () { jumpTo(linked); });
    if (phone.addEventListener) phone.addEventListener('change', mode);
    else if (phone.addListener) phone.addListener(mode);
    window.addEventListener('hashchange', fromHash);

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(ids[i]); topOf(i); });
      t.addEventListener('keydown', function (e) {
        var n = -1, last = ids.length - 1;
        if (e.key === 'ArrowRight') n = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft') n = i === 0 ? last : i - 1;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = last;
        if (n < 0) return;
        e.preventDefault();
        show(ids[n]);
        tabs[n].focus();
      });
    });
  })();

})();
