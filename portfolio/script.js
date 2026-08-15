// Portfolio interactions: nav, mobile menu, scroll reveals, progress bars, form.

(function () {
  'use strict';

  // ---------- Navbar shadow on scroll ----------
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  var toggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('.reveal');
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  // ---------- Skill progress bars ----------
  var fillEls = document.querySelectorAll('.progress-fill');
  var progressObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var level = el.getAttribute('data-level') || 0;
          el.style.width = level + '%';
          progressObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  fillEls.forEach(function (el) { progressObserver.observe(el); });

  // ---------- Video playback speed (default 1.2x) ----------
  document.querySelectorAll('video').forEach(function (video) {
    video.defaultPlaybackRate = 1.2;
    video.playbackRate = 1.2;
    video.addEventListener('loadedmetadata', function () {
      video.defaultPlaybackRate = 1.2;
      video.playbackRate = 1.2;
    });
  });

  // ---------- Clickable project cards ----------
  document.querySelectorAll('.project-card').forEach(function (card) {
    var demoLink = card.querySelector('.project-links a[href$=".html"]');
    if (!demoLink) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (event) {
      if (event.target.closest('a')) return;
      window.location.href = demoLink.getAttribute('href');
    });
  });

  // ---------- Footer year ----------
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------- Contact form (opens the visitor's email app) ----------
  // For a real backend, replace the body of this handler with your own
  // form submission (e.g. Formspree, Netlify Forms, or an API call).
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var subject = encodeURIComponent(data.get('subject') || 'Project inquiry');
      var body = encodeURIComponent(
        'Name: ' + (data.get('name') || '') + '\n' +
        'Email: ' + (data.get('email') || '') + '\n\n' +
        (data.get('message') || '')
      );
      // EDIT ME: replace with your email address.
      window.location.href = 'mailto:you@example.com?subject=' + subject + '&body=' + body;
    });
  }
})();
