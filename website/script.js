(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    if (!loader) return;
    setTimeout(function () { loader.classList.add('gone'); }, reduceMotion ? 100 : 600);
  });

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ---------- Header + scroll progress ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 12);
    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
      progress.style.width = pct + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Custom cursor ---------- */
  if (isFinePointer) {
    var cursor = document.getElementById('cursor');
    var dot = document.getElementById('cursorDot');
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;
    var dotX = mouseX, dotY = mouseY;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', function () {
      if (cursor) cursor.style.opacity = '0';
      if (dot) dot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      if (cursor) cursor.style.opacity = '';
      if (dot) dot.style.opacity = '';
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;
      if (cursor) cursor.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%, -50%)';
      if (dot) dot.style.transform = 'translate(' + dotX + 'px,' + dotY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);

    // Hover states
    document.querySelectorAll('[data-cursor="hover"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { if (cursor) cursor.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { if (cursor) cursor.classList.remove('hover'); });
    });
  }

  /* ---------- Reveal-on-scroll with stagger ---------- */
  var revealTargets = document.querySelectorAll(
    '.vmv-card, .value-card, .obj-card, .event-card, .afcom-card, ' +
    '.tier-card, .member-card, .team-card, .reg-points li, .contact-list li, ' +
    '.section-head, .obj-block-head, .values-head, .benefits'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  // Add stagger index within each grid parent
  function applyStagger(selector) {
    document.querySelectorAll(selector).forEach(function (parent) {
      parent.querySelectorAll(':scope > .reveal').forEach(function (child, i) {
        child.setAttribute('data-stagger', (i % 6) + 1);
      });
    });
  }
  ['.vmv-grid','.values-grid','.obj-grid','.events-grid','.afcom-grid',
   '.tier-grid','.member-grid','.team-grid','.reg-points','.contact-list']
    .forEach(applyStagger);

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Hero parallax dots (mouse + scroll) ---------- */
  if (!reduceMotion) {
    var dots = document.querySelectorAll('.hero-bg .dot');
    var hero = document.querySelector('.hero');

    if (hero && isFinePointer) {
      hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        var cx = (e.clientX - rect.left) / rect.width - 0.5;
        var cy = (e.clientY - rect.top) / rect.height - 0.5;
        dots.forEach(function (d) {
          var p = parseFloat(d.getAttribute('data-parallax') || '0.3');
          d.style.transform = 'translate(' + (cx * 60 * p) + 'px,' + (cy * 60 * p) + 'px)';
        });
      });
      hero.addEventListener('mouseleave', function () {
        dots.forEach(function (d) { d.style.transform = ''; });
      });
    }

    // Subtle scroll parallax for the logo stage
    var stage = document.querySelector('.logo-stage');
    window.addEventListener('scroll', function () {
      if (!stage) return;
      var y = window.scrollY;
      if (y < window.innerHeight) {
        stage.style.transform = 'translateY(' + (y * 0.08) + 'px)';
      }
    }, { passive: true });
  }

  /* ---------- Magnetic buttons ---------- */
  if (isFinePointer && !reduceMotion) {
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.25) + 'px,' + (y * 0.35) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Forms (client-only stub) ---------- */
  function handleForm(formId, statusId, successMsg) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';

      if (!form.checkValidity()) {
        status.textContent = 'Please complete the required fields.';
        status.classList.add('err');
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"] span');
      var prev = btn ? btn.textContent : '';
      var btnEl = form.querySelector('button[type="submit"]');
      if (btnEl) btnEl.disabled = true;
      if (btn) btn.textContent = 'Sending…';

      setTimeout(function () {
        status.textContent = successMsg;
        status.classList.add('ok');
        form.reset();
        if (btnEl) btnEl.disabled = false;
        if (btn) btn.textContent = prev;
      }, 700);
    });
  }

  handleForm('regForm', 'formStatus',
    'Thanks! Your registration has been received — we will be in touch shortly.');
  handleForm('contactForm', 'contactStatus',
    'Thanks for reaching out! We will reply as soon as possible.');

  /* ---------- Modal ---------- */
  (function modals() {
    var lastFocus = null;

    function openModal(id) {
      var m = document.getElementById(id);
      if (!m) return;
      lastFocus = document.activeElement;
      m.hidden = false;
      requestAnimationFrame(function () { m.classList.add('open'); });
      document.body.classList.add('modal-locked');
      var focusable = m.querySelector('input, textarea, select, button:not(.modal-close)');
      if (focusable) focusable.focus({ preventScroll: true });
    }

    function closeModal(m) {
      if (!m) return;
      m.classList.remove('open');
      document.body.classList.remove('modal-locked');
      setTimeout(function () {
        m.hidden = true;
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
      }, 350);
    }

    document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal(trigger.getAttribute('data-open-modal'));
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        var m = el.closest('.modal');
        closeModal(m);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = document.querySelector('.modal.open');
      if (open) closeModal(open);
    });
  })();

  /* ---------- Hero H1 word-by-word reveal ---------- */
  (function splitHeroH1() {
    var h1 = document.querySelector('.hero h1');
    if (!h1 || reduceMotion) {
      if (h1) h1.classList.add('split-ready', 'revealed');
      return;
    }
    h1.classList.add('split-ready');

    var wordIdx = 0;
    function walk(node) {
      if (node.nodeType === 3) { // TEXT_NODE
        var text = node.textContent;
        if (!text || !text.trim()) return;
        var parent = node.parentNode;
        var parts = text.split(/(\s+)/);
        parts.forEach(function (part) {
          if (/^\s+$/.test(part)) {
            parent.insertBefore(document.createTextNode(part), node);
          } else if (part.length > 0) {
            var word = document.createElement('span');
            word.className = 'word';
            var inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = part;
            inner.style.transitionDelay = (wordIdx * 0.075) + 's';
            word.appendChild(inner);
            parent.insertBefore(word, node);
            wordIdx++;
          }
        });
        parent.removeChild(node);
      } else if (node.nodeType === 1) {
        var children = Array.from(node.childNodes);
        children.forEach(walk);
      }
    }
    walk(h1);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        h1.classList.add('revealed');
      });
    });
  })();

  /* ---------- Number counter animation ---------- */
  function animateCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseInt(el.getAttribute('data-count'), 10);
    var from = parseInt(el.getAttribute('data-from') || '0', 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target; return; }
    var duration = 1500;
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased).toString();
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toString();
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { counterIo.observe(c); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Side rail: active section + dark-mode awareness ---------- */
  var sideRail = document.getElementById('sideRail');
  if (sideRail && 'IntersectionObserver' in window) {
    var railLinks = sideRail.querySelectorAll('a[data-section]');
    var sections = Array.from(railLinks)
      .map(function (a) { return document.getElementById(a.getAttribute('data-section')); })
      .filter(Boolean);

    var railIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          railLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
          });
          // Dark mode detection
          var isDark = entry.target.classList.contains('section-dark');
          sideRail.classList.toggle('on-dark', isDark);
        }
      });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { railIo.observe(s); });

    // Hide rail when hero is in view
    var heroEl = document.getElementById('home');
    if (heroEl) {
      var heroIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          sideRail.classList.toggle('hide', entry.isIntersecting && entry.intersectionRatio > 0.4);
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            sideRail.classList.add('on-dark');
          }
        });
      }, { threshold: [0, 0.4, 0.8] });
      heroIo.observe(heroEl);
    }
  }

  /* ---------- 3D tilt on premium cards ---------- */
  if (isFinePointer && !reduceMotion) {
    function attachTilt(selector, maxDeg, lift) {
      document.querySelectorAll(selector).forEach(function (card) {
        card.classList.add('tilt-card');
        var rect;
        card.addEventListener('mouseenter', function () {
          rect = card.getBoundingClientRect();
          card.classList.add('tilting');
        });
        card.addEventListener('mousemove', function (e) {
          if (!rect) rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            'perspective(1200px) translateY(' + lift + 'px) ' +
            'rotateY(' + (x * maxDeg) + 'deg) rotateX(' + (-y * maxDeg) + 'deg)';
        });
        card.addEventListener('mouseleave', function () {
          card.classList.remove('tilting');
          card.style.transform = '';
          rect = null;
        });
      });
    }
    attachTilt('.event-card', 5, -8);
    attachTilt('.member-card', 4, -8);
    attachTilt('.tier-card', 4, -8);
  }

  /* ---------- Smooth scroll with header offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerOffset = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset + 1;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
})();
