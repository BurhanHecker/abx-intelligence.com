/* ==========================================================================
   ABX Intelligence — interaction layer
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
     Cursor spotlight
     ------------------------------------------------------------------ */
  var spot = $('.spotlight');
  if (spot && fine && !reduced) {
    var sx = window.innerWidth / 2, sy = window.innerHeight / 3, tx = sx, ty = sy;
    document.body.classList.add('has-pointer');
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      sx += (tx - sx) * 0.09;
      sy += (ty - sy) * 0.09;
      spot.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
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
     Card spotlight follow
     ------------------------------------------------------------------ */
  if (fine && !reduced) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------
     3D tilt on product mockups
     ------------------------------------------------------------------ */
  if (fine && !reduced) {
    $$('.mock--tilt').forEach(function (el) {
      var parent = el.parentElement;
      parent.addEventListener('pointermove', function (e) {
        var r = parent.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          'perspective(1400px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' +
          (-py * 6).toFixed(2) + 'deg) translateZ(12px)';
      });
      parent.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------ */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1500, t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = $$('[data-count]');
  if (counters.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          runCounter(en.target);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ------------------------------------------------------------------
     Process timeline progressive lighting
     ------------------------------------------------------------------ */
  var process = $('.process');
  if (process && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        process.classList.add('is-in');
        $$('.step', process).forEach(function (s, i) {
          setTimeout(function () { s.classList.add('is-lit'); }, 220 + i * 260);
        });
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
     Contact form (Web3Forms)
     ------------------------------------------------------------------ */
  var form = $('#abx-form');
  if (form) {
    var status = $('#form-status');
    var submit = $('button[type="submit"]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var key = form.querySelector('input[name="access_key"]');
      if (!key || !key.value || key.value.indexOf('YOUR_') === 0) {
        status.textContent = 'This form is not connected yet. Add your Web3Forms access key in contact.html, or email us directly.';
        status.classList.add('is-on');
        return;
      }
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.classList.remove('is-on');

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          status.classList.add('is-on');
          if (data.success) {
            status.textContent = 'Thank you — your message has been received. We will respond shortly.';
            form.reset();
          } else {
            status.textContent = 'Something went wrong. Please email us directly instead.';
          }
        })
        .catch(function () {
          status.classList.add('is-on');
          status.textContent = 'Network error. Please email us directly instead.';
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

  /* ==================================================================
     Network canvas — interconnected system nodes
     ================================================================== */
  function NetworkCanvas(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [], w = 0, h = 0, raf = null, visible = true;
    var density = opts.density || 12000;
    var maxNodes = opts.max || 62;
    var linkDist = opts.link || 138;
    var pointer = { x: -9999, y: -9999, on: false };

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var count = Math.min(maxNodes, Math.max(18, Math.round((w * h) / density)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.19,
          vy: (Math.random() - 0.5) * 0.19,
          r: Math.random() * 1.5 + 0.9,
          hot: Math.random() < 0.16,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(t) {
      raf = requestAnimationFrame(draw);
      if (!visible || w === 0) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -30) n.x = w + 30; if (n.x > w + 30) n.x = -30;
        if (n.y < -30) n.y = h + 30; if (n.y > h + 30) n.y = -30;

        if (pointer.on) {
          var pdx = n.x - pointer.x, pdy = n.y - pointer.y;
          var pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < 130 && pd > 0.1) {
            var push = (1 - pd / 130) * 0.55;
            n.x += (pdx / pd) * push;
            n.y += (pdy / pd) * push;
          }
        }
      }

      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > linkDist) continue;
          var alpha = (1 - d / linkDist) * 0.4;
          var hot = nodes[a].hot || nodes[b].hot;
          ctx.strokeStyle = hot
            ? 'rgba(255,59,33,' + (alpha * 0.85).toFixed(3) + ')'
            : 'rgba(142,145,143,' + (alpha * 0.6).toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }

      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        var pulse = 0.65 + Math.sin(t / 900 + p.ph) * 0.35;
        if (p.hot) {
          ctx.fillStyle = 'rgba(255,59,33,' + (0.55 + pulse * 0.4).toFixed(3) + ')';
          ctx.shadowColor = 'rgba(255,59,33,.85)';
          ctx.shadowBlur = 11;
        } else {
          ctx.fillStyle = 'rgba(200,203,201,' + (0.22 + pulse * 0.2).toFixed(3) + ')';
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    if (fine && !reduced) {
      canvas.parentElement.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.on = true;
      }, { passive: true });
      canvas.parentElement.addEventListener('pointerleave', function () { pointer.on = false; });
    }

    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }

    resize();
    if (!reduced) raf = requestAnimationFrame(draw);
    else { visible = true; draw(0); cancelAnimationFrame(raf); }
  }

  $$('canvas[data-network]').forEach(function (c) {
    NetworkCanvas(c, {
      density: parseInt(c.getAttribute('data-density') || '12000', 10),
      max: parseInt(c.getAttribute('data-max') || '62', 10),
      link: parseInt(c.getAttribute('data-link') || '138', 10)
    });
  });
})();
