// mobile menu
const nav = document.getElementById('nav');
const toggle = nav.querySelector('.nav-toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
});
nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
}));
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
