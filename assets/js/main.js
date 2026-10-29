// UI text set from script, in the page language (<html lang>: id on /, en on /en/)
const UI = document.documentElement.lang.startsWith('en') ? {
  menuOpen: 'Open menu', menuClose: 'Close menu',
  slidesPlay: 'Play slideshow', slidesPause: 'Pause slideshow',
  sending: 'Sending your message…',
  sent: 'Thank you! Your message has been sent. Our team will be in touch with you shortly.',
  failed: 'Sorry, your message could not be sent. Please try again, or contact us on WhatsApp.',
} : {
  menuOpen: 'Buka menu', menuClose: 'Tutup menu',
  slidesPlay: 'Putar slide otomatis', slidesPause: 'Jeda slide otomatis',
  sending: 'Mengirim pesan…',
  sent: 'Terima kasih! Pesan Anda sudah terkirim. Tim kami akan segera menghubungi Anda.',
  failed: 'Maaf, pesan gagal terkirim. Silakan coba lagi, atau hubungi kami lewat WhatsApp.',
};

// preloader: keep it up at least ~0.9s after navigation start, at most 4s, then fade it out
const preloader = document.querySelector('.preloader');
if (preloader) {
  const hidePreloader = () => {
    if (preloader.classList.contains('is-done')) return;
    preloader.classList.add('is-done');
    document.documentElement.classList.remove('is-loading');
    setTimeout(() => preloader.remove(), 800);
  };
  const onLoad = () => setTimeout(hidePreloader, Math.max(0, 900 - performance.now()));
  if (document.readyState === 'complete') onLoad(); else addEventListener('load', onLoad);
  setTimeout(hidePreloader, 4000);
}

// hero 3D scene: tilt + parallax toward the pointer (mouse/trackpad only)
const heroSection = document.querySelector('.hero');
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  let heroFrame = 0;
  heroSection.addEventListener('pointermove', e => {
    cancelAnimationFrame(heroFrame);
    heroFrame = requestAnimationFrame(() => {
      const r = heroVisual.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
      const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
      heroVisual.style.setProperty('--rx', `${-py * 8}deg`);
      heroVisual.style.setProperty('--ry', `${px * 12}deg`);
      heroVisual.style.setProperty('--px', px);
      heroVisual.style.setProperty('--py', py);
    });
  });
  heroSection.addEventListener('pointerleave', () => {
    cancelAnimationFrame(heroFrame);
    ['--rx', '--ry', '--px', '--py'].forEach(p => heroVisual.style.removeProperty(p));
  });
}

// remember an explicit language pick, so the geo redirect on / (netlify/edge-functions/lang-redirect.mjs) follows it
document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
  document.cookie = `lang=${a.hreflang}; path=/; max-age=31536000; samesite=lax`;
}));

// mobile menu
const nav = document.getElementById('nav');
const toggle = nav.querySelector('.nav-toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? UI.menuClose : UI.menuOpen);
});
const navLinks = [...nav.querySelectorAll('.nav-links a')];
// highlight the menu item of the section being viewed (and the one just clicked)
const setActiveNav = id => navLinks.forEach(a => {
  const on = a.hash === '#' + id;
  a.classList.toggle('is-active', on);
  if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
});
let navLock = 0; // while a clicked link smooth-scrolls, keep its highlight instead of flickering through sections
navLinks.forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  setActiveNav(a.hash.slice(1));
  navLock = Date.now() + 1200;
}));
const pageSections = [...document.querySelectorAll('main > section')];
let spyFrame = 0;
const spySections = () => {
  spyFrame = 0;
  if (Date.now() < navLock) return;
  const line = innerHeight * .4;
  const current = pageSections.find(s => { const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
  setActiveNav(current ? current.id : '');
};
addEventListener('scroll', () => { if (!spyFrame) spyFrame = requestAnimationFrame(spySections); }, {passive: true});
addEventListener('scrollend', () => { navLock = 0; spySections(); });
spySections();
document.getElementById('year').textContent = new Date().getFullYear();

// solutions carousel
const sol = document.querySelector('.solutions');
const panels = [...sol.querySelectorAll('.sol-panel')];
const pics = [...sol.querySelectorAll('.sol-media img')];
const bars = [...sol.querySelectorAll('.sol-bar')];
const count = sol.querySelector('.sol-count b');
const content = sol.querySelector('.sol-content');
const playBtn = sol.querySelector('.sol-toggle');
let current = 0, userPaused = false, focused = false, visible = false;

const show = i => {
  current = (i + panels.length) % panels.length;
  panels.forEach((p, j) => { p.classList.toggle('is-active', j === current); p.inert = j !== current; });
  pics.forEach((p, j) => p.classList.toggle('is-active', j === current));
  bars.forEach((b, j) => {
    b.classList.remove('is-active');
    b.classList.toggle('done', j < current);
    b.setAttribute('aria-current', j === current);
  });
  void bars[current].offsetWidth; // restart the progress animation
  bars[current].classList.add('is-active');
  count.textContent = String(current + 1).padStart(2, '0');
};
const sync = () => {
  sol.classList.toggle('is-paused', userPaused || focused || !visible);
  sol.classList.toggle('is-user-paused', userPaused);
  content.setAttribute('aria-live', userPaused ? 'polite' : 'off');
  playBtn.setAttribute('aria-label', userPaused ? UI.slidesPlay : UI.slidesPause);
};

bars.forEach((b, i) => {
  b.addEventListener('click', () => show(i));
  b.querySelector('i').addEventListener('animationend', () => show(current + 1));
});
sol.querySelector('.sol-prev').addEventListener('click', () => show(current - 1));
sol.querySelector('.sol-next').addEventListener('click', () => show(current + 1));
playBtn.addEventListener('click', () => { userPaused = !userPaused; sync(); });

const body = sol.querySelector('.sol-body');
sol.addEventListener('focusin', e => { focused = e.target.matches(':focus-visible'); sync(); });
sol.addEventListener('focusout', e => { if (!sol.contains(e.relatedTarget)) { focused = false; sync(); } });
new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, {threshold: .4}).observe(sol);

sol.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') show(current + 1);
  if (e.key === 'ArrowLeft') show(current - 1);
});
let touchX = null;
body.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive: true});
body.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
}, {passive: true});

// 3D tilt toward the pointer (mouse/trackpad only)
const media = sol.querySelector('.sol-media');
if (matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  let frame = 0;
  media.addEventListener('pointermove', e => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = media.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      media.style.setProperty('--rx', `${-py * 12}deg`);
      media.style.setProperty('--ry', `${px * 16}deg`);
      media.style.setProperty('--px', px);
      media.style.setProperty('--py', py);
    });
  });
  media.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    ['--rx', '--ry', '--px', '--py'].forEach(p => media.style.removeProperty(p));
  });
}

show(0);
sync();

// portfolio strip: a horizontal scroll-snap track (native swipe and arrow keys);
// the arrows step one card, the progress bar and counter follow the scroll position
const pfTrack = document.querySelector('.pf-track');
const pfCards = [...pfTrack.children];
const pfPrev = document.querySelector('.pf-prev');
const pfNext = document.querySelector('.pf-next');
const pfBar = document.querySelector('.pf-progress span');
const pfCount = document.querySelector('.pf-count b');
const pfStep = () => pfCards[1].offsetLeft - pfCards[0].offsetLeft;
const pfUpdate = () => {
  const max = pfTrack.scrollWidth - pfTrack.clientWidth;
  const p = max > 0 ? pfTrack.scrollLeft / max : 0;
  const shown = Math.min(1, pfTrack.clientWidth / pfTrack.scrollWidth);
  pfBar.style.width = shown * 100 + '%';
  pfBar.style.transform = `translateX(${p * (1 / shown - 1) * 100}%)`;
  pfCount.textContent = String(Math.round(p * (pfCards.length - 1)) + 1).padStart(2, '0');
  pfPrev.disabled = pfTrack.scrollLeft < 2;
  pfNext.disabled = pfTrack.scrollLeft > max - 2;
};
// scroll-behavior comes from the CSS, so reduced motion jumps instead of gliding
pfPrev.addEventListener('click', () => pfTrack.scrollBy({left: -pfStep()}));
pfNext.addEventListener('click', () => pfTrack.scrollBy({left: pfStep()}));
pfTrack.addEventListener('scroll', pfUpdate, {passive: true});
// a resize changes the slide width: snap back onto the slide that was showing
let pfShown = 0;
pfTrack.addEventListener('scrollend', () => { pfShown = Math.round(pfTrack.scrollLeft / pfStep()); });
addEventListener('resize', () => {
  pfTrack.scrollTo({left: pfShown * pfStep(), behavior: 'instant'});
  pfUpdate();
});
pfUpdate();

// contact form
const form = document.getElementById('contact-form');
const formStatus = form.querySelector('.cform-status');
const submitBtn = form.querySelector('button[type="submit"]');
const setStatus = (msg, type) => {
  formStatus.textContent = msg;
  formStatus.className = 'cform-status' + (type ? ' is-' + type : '');
};
form.addEventListener('submit', async e => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.setAttribute('aria-busy', 'true');
  setStatus(UI.sending);
  try {
    // Netlify Forms expects a url-encoded POST to any static path, including the form-name field
    const res = await fetch('/', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(new FormData(form)).toString(),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    setStatus(UI.sent, 'success');
  } catch {
    setStatus(UI.failed, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
  }
});

// prefill the contact form from the solution CTAs
document.querySelectorAll('[data-kebutuhan]').forEach(a =>
  a.addEventListener('click', () => { form.elements.kebutuhan.value = a.dataset.kebutuhan; }));

// process timeline: reveal the steps one by one the first time it scrolls into view
const timeline = document.querySelector('.timeline');
timeline.classList.add('anim');
new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { timeline.classList.add('in-view'); obs.disconnect(); }
}, {threshold: .2, rootMargin: '0px 0px -15% 0px'}).observe(timeline);

// FAQ accordion: animate opening/closing and keep only one answer open
const faqItems = [...document.querySelectorAll('.faq-list details')];
const faqMotion = matchMedia('(prefers-reduced-motion: reduce)');
faqItems.forEach(d => d.removeAttribute('name')); // JS handles exclusivity so the closing item can animate too
const setFaq = (d, open) => {
  const body = d.querySelector('.faq-a');
  d.anim?.cancel();
  if (faqMotion.matches) { d.classList.remove('is-closing'); d.open = open; return; }
  if (open) {
    d.classList.remove('is-closing');
    d.open = true;
    d.anim = body.animate(
      [{height: '0px', opacity: 0, transform: 'translateY(-6px)'}, {height: body.scrollHeight + 'px', opacity: 1, transform: 'none'}],
      {duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)'});
  } else {
    d.classList.add('is-closing');
    d.anim = body.animate(
      [{height: body.offsetHeight + 'px', opacity: 1}, {height: '0px', opacity: 0}],
      {duration: 280, easing: 'cubic-bezier(.4,0,.2,1)'});
    d.anim.onfinish = () => { d.open = false; d.classList.remove('is-closing'); };
  }
};
faqItems.forEach(d => d.querySelector('summary').addEventListener('click', e => {
  e.preventDefault();
  const opening = !d.open || d.classList.contains('is-closing');
  if (opening) faqItems.forEach(o => { if (o !== d && o.open && !o.classList.contains('is-closing')) setFaq(o, false); });
  setFaq(d, opening);
}));
