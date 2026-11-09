/* ==========================================================================
   ABX Intelligence: site script
   Header border, phone menu, FAQ accordion, contact form, footer year.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Header: a hairline appears once the page has scrolled. */
  var nav = $('.nav');
  if (nav) {
    var ticking = false;
    var onScroll = function () {
      nav.classList.toggle('is-stuck', (window.scrollY || document.documentElement.scrollTop) > 8);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  /* Motion only while it is on screen. Event videos (data-inview) load and
     play when scrolled into view and pause when they leave; the drawings
     stop drifting off screen. Anyone who asks for less motion gets the
     still frame and still drawings. */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var videos = $$('video[data-inview]');
  var drawings = $$('svg.iso');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (el.tagName === 'VIDEO') {
          if (en.isIntersecting && !reduced) {
            var p = el.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            el.pause();
          }
        } else {
          el.classList.toggle('is-paused', !en.isIntersecting);
        }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
    drawings.forEach(function (d) { io.observe(d); });
  }

  /* Phone menu */
  var toggle = $('.nav-toggle');
  var menu = $('.nav-mobile');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    };
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 960) setMenu(false); });
  }

  /* FAQ accordion */
  $$('.acc-item').forEach(function (item, i) {
    var btn = $('.acc-btn', item);
    var panel = $('.acc-panel', item);
    if (!btn || !panel) return;
    if (!panel.id) panel.id = 'acc-panel-' + i;
    btn.setAttribute('aria-controls', panel.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // From a fixed height to the target, so the change can animate either way.
      panel.style.height = panel.scrollHeight + 'px';
      if (!open) {
        void panel.offsetHeight;
        panel.style.height = '0px';
      }
    });
    panel.addEventListener('transitionend', function () {
      if (item.classList.contains('is-open')) panel.style.height = 'auto';
    });
  });

  /* Contact form: validate, then submit via Web3Forms */
  var form = $('#abx-form');
  if (form) {
    var status = $('#form-status');
    var submit = $('button[type="submit"]', form);

    var setStatus = function (msg, kind) {
      status.textContent = msg;
      status.className = 'form-status is-on' + (kind ? ' is-' + kind : '');
    };
    var fieldError = function (el, msg) {
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
    };
    var clearError = function (el) {
      var wrap = el.closest('.field');
      var note = $('.field-error', wrap);
      if (note) note.remove();
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    };
    var validate = function () {
      var problems = [];
      $$('[required]', form).forEach(function (el) {
        clearError(el);
        var val = (el.value || '').trim();
        if (el.type === 'checkbox') {
          if (!el.checked) { fieldError(el, 'Please confirm this before sending.'); problems.push(el); }
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
    };

    $$('[required]', form).forEach(function (el) {
      var clear = function () { if (el.getAttribute('aria-invalid')) clearError(el); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
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

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            setStatus('Thank you. We have your message and will reply soon.', 'ok');
            form.reset();
          } else {
            setStatus('Something went wrong. Please email us directly instead.', 'error');
          }
        })
        .catch(function () { setStatus('Network error. Please email us directly instead.', 'error'); })
        .finally(function () { submit.disabled = false; submit.textContent = label; });
    });
  }

  /* Footer year */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
