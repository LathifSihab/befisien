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

// mobile menu
const nav = document.getElementById('nav');
const toggle = nav.querySelector('.nav-toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
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
  playBtn.setAttribute('aria-label', userPaused ? 'Putar slide otomatis' : 'Jeda slide otomatis');
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
  if (form.getAttribute('action').includes('[FORM_ID]')) {
    setStatus('Form belum terhubung: ganti [FORM_ID] di index.html dengan ID form Formspree.', 'error');
    return;
  }
  submitBtn.disabled = true;
  submitBtn.setAttribute('aria-busy', 'true');
  setStatus('Mengirim pesan…');
  try {
    const res = await fetch(form.action, {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}});
    if (!res.ok) throw new Error(res.status);
    form.reset();
    setStatus('Terima kasih! Pesan Anda sudah terkirim. Tim kami akan segera menghubungi Anda.', 'success');
  } catch {
    setStatus('Maaf, pesan gagal terkirim. Silakan coba lagi, atau hubungi kami lewat WhatsApp.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
  }
});

// prefill the contact form from the hero finder and the solution CTAs
const prefill = (kebutuhan, ukuran) => {
  if (kebutuhan) form.elements.kebutuhan.value = kebutuhan;
  if (ukuran) form.elements.ukuran.value = ukuran;
};
document.querySelector('.finder').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget.elements;
  prefill(f.kebutuhan.value, f.ukuran.value);
  document.getElementById('kontak').scrollIntoView();
  form.elements.nama.focus({preventScroll: true});
});
document.querySelectorAll('[data-kebutuhan]').forEach(a =>
  a.addEventListener('click', () => prefill(a.dataset.kebutuhan)));

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
