/* Tosti Plaza - animaciones (solo JS propio, sin librerías).
   Marca con data-anim los elementos del diseño activo (escritorio >= 768 px o
   móvil < 768 px) y los revela con IntersectionObserver, una sola vez. */
(function () {
  'use strict';
  var root = document.documentElement;

  function cleanup() {
    try {
      root.classList.remove('anim');
      var els = document.querySelectorAll('[data-anim]');
      for (var i = 0; i < els.length; i++) {
        els[i].removeAttribute('data-anim');
        els[i].removeAttribute('data-anim-s');
        els[i].removeAttribute('data-anim-hero');
        els[i].removeAttribute('data-anim-instant');
        els[i].classList.remove('is-in');
        els[i].style.removeProperty('--anim-delay');
      }
    } catch (e) { /* nada */ }
  }

  try {
    // Modo captura: estado final, sin marcar nada
    if (/[?&]captura=1(&|$)/.test(location.search)) {
      root.classList.add('captura');
      return;
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var desktop = window.matchMedia('(min-width: 768px)').matches;
    var scope = document.getElementById(desktop ? 'desktop-root' : 'mobile-root');
    if (!scope) return;

    root.classList.add('anim');

    var heroEls = [];
    var observed = [];

    function q(sel) { return scope.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(scope.querySelectorAll(sel)); }
    function kids(el) { return el ? Array.prototype.slice.call(el.children) : []; }

    // Nunca elementos ocultos ni fijos (ni dentro de un ancestro fijo)
    function blocked(el) {
      if (el.closest('[style*="display:none"],[style*="display: none"]')) return true;
      for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
        if (window.getComputedStyle(n).position === 'fixed') return true;
      }
      return false;
    }

    function mark(el, type, opts) {
      if (!el || el.hasAttribute('data-anim') || blocked(el)) return null;
      opts = opts || {};
      el.setAttribute('data-anim', type || 'up');
      if (opts.hero) {
        el.setAttribute('data-anim-hero', '');
        el.style.setProperty('--anim-delay', (opts.delay || 0) + 'ms');
        heroEls.push(el);
      } else {
        if (opts.stagger) el.setAttribute('data-anim-s', '');
        observed.push(el);
      }
      return el;
    }

    // Bloques de una sección: lo suelto sube; los hijos de una cuadrícula se escalonan
    function sectionBlocks(container) {
      kids(container).forEach(function (c) {
        if (c.classList.contains('grid')) {
          kids(c).forEach(function (g) { mark(g, 'up', { stagger: true }); });
        } else {
          mark(c, 'up');
        }
      });
    }

    var d = 0;
    function hero(el, type, delay) {
      mark(el, type || 'up', { hero: true, delay: delay === undefined ? d : delay });
      d += 100;
    }

    if (desktop) {
      var grid = q('#inicio > .grid');
      if (grid) {
        var left = grid.children[0];
        var right = grid.children[1];
        var pill = left.children[0];
        var headline = left.children[1];
        hero(pill);
        // estrellas de la calificación, una por una y rápido
        kids(pill.children[0]).forEach(function (s, i) { mark(s, 'star', { hero: true, delay: 250 + i * 70 }); });
        hero(headline.children[0]);
        hero(headline.children[1], 'title');
        hero(left.children[2]);
        hero(left.children[3]);
        hero(left.children[4]);
        hero(right, 'up', d + 100);
      }
      var ticker = q('main > div > div');
      mark(ticker);
      sectionBlocks(q('#menu-completo'));
      sectionBlocks(q('#especiales > div'));
      mark(q('#a-domicilio > div'));
      sectionBlocks(q('#resenas > div'));
      kids(q('#ubicacion > div')).forEach(function (c) { mark(c, 'up', { stagger: true }); });
      var secs = qa('main > div > section');
      if (secs[6]) sectionBlocks(secs[6].firstElementChild);
      if (secs[7]) kids(secs[7]).forEach(function (c) { mark(c); });
    } else {
      var content = q('main > div');
      var hs = content && content.querySelector(':scope > section');
      if (hs) {
        var title = hs.children[3];
        hero(hs.children[2]);
        // estrella de la calificación
        mark(hs.children[2].children[0].children[0], 'star', { hero: true, delay: 200 });
        hero(title.children[0], 'title');
        hero(title.children[1]);
        hero(hs.children[5]);
        hero(hs.children[4]);
      }
      if (content) mark(kids(content)[1]);
      qa('#m-menu-secciones > section').forEach(sectionBlocks);
      mark(q('footer'));
    }

    // Hero: al cargar (dos frames para que el estado inicial ya esté pintado)
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        heroEls.forEach(function (el) { el.classList.add('is-in'); });
      });
    });

    // Resto: al hacer scroll, una sola vez
    if (!('IntersectionObserver' in window)) {
      observed.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var ready = entries.filter(function (e) { return e.isIntersecting || e.boundingClientRect.bottom < 0; });
      ready.sort(function (a, b) {
        return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
      });
      var n = 0;
      ready.forEach(function (e) {
        var el = e.target;
        if (!e.isIntersecting) {
          // ya quedó por encima del viewport: se revela al instante
          el.setAttribute('data-anim-instant', '');
        } else if (el.hasAttribute('data-anim-s')) {
          el.style.setProperty('--anim-delay', Math.min(n, 5) * 80 + 'ms');
          n++;
        }
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px' });
    observed.forEach(function (el) { io.observe(el); });
  } catch (err) {
    cleanup();
  }
})();
