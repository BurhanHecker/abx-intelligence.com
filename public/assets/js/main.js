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

})();
