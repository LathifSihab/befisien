// AI chat widget: floating button + panel, talks to the /api/chat Netlify function
(() => {
  const STORE = 'befisien-chat';
  const MAX_SEND = 21; // must stay odd so the trimmed history still starts with a user message
  const GREETING = 'Halo! Saya Asisten Befisien. Ada yang bisa saya bantu seputar AI agent, otomasi, atau integrasi sistem untuk bisnis Anda?';
  const SUGGESTIONS = ['Apa itu AI agent?', 'Bagaimana cara kerja Befisien?', 'Berapa biaya sebuah proyek?'];
  const ERRORS = {
    429: 'Pesan Anda terlalu cepat. Tunggu sebentar, lalu coba lagi.',
    busy: 'Asisten sedang sibuk. Coba lagi sebentar, atau hubungi kami lewat formulir di #kontak.',
    default: 'Maaf, asisten sedang tidak bisa menjawab. Silakan hubungi kami lewat formulir di #kontak atau email info@befisien.com.',
  };

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE)) || []; } catch {}
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history)); } catch {} };

  const el = (tag, cls, attrs = {}) => Object.assign(document.createElement(tag), cls ? {className: cls} : {}, attrs);
  const icon = d => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const launcher = el('button', 'chat-launcher', {type: 'button'});
  launcher.setAttribute('aria-label', 'Buka chat asisten Befisien');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'chat-panel');
  launcher.innerHTML = icon('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>') + icon('<path d="M6 6l12 12M18 6 6 18"/>');

  const panel = el('section', 'chat-panel', {id: 'chat-panel', hidden: true});
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat dengan Asisten Befisien');
  panel.innerHTML = `
    <header class="chat-head">
      <img src="assets/img/logo-icon.svg" alt="" width="32" height="32">
      <div><b>Asisten Befisien</b><small><span class="dot"></span>AI agent · online 24/7</small></div>
      <button type="button" class="chat-close" aria-label="Tutup chat">${icon('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
    </header>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-suggest"></div>
    <form class="chat-form">
      <label for="chat-input" class="sr-only">Tulis pesan</label>
      <textarea id="chat-input" rows="1" maxlength="2000" placeholder="Tulis pertanyaan Anda…" required></textarea>
      <button type="submit" aria-label="Kirim">${icon('<path d="M5 12h14M13 6l6 6-6 6"/>')}</button>
    </form>
    <p class="chat-note">Jawaban dibuat oleh AI dan bisa keliru. Jangan bagikan data sensitif.</p>`;
  document.body.append(launcher, panel);

  const log = panel.querySelector('.chat-log');
  const suggest = panel.querySelector('.chat-suggest');
  const form = panel.querySelector('.chat-form');
  const input = form.elements[0];
  const sendBtn = form.querySelector('button');

  // plain text in, with URLs, emails and #kontak turned into links (built as DOM nodes, never innerHTML)
  const render = (node, text) => {
    node.textContent = '';
    text.split(/(https?:\/\/[^\s]+[^\s.,)]|[\w.+-]+@[\w-]+\.[\w.]+\w|#kontak\b)/g).forEach((part, i) => {
      if (i % 2 === 0) return part && node.append(part);
      const href = part.includes('@') && !part.startsWith('http') ? 'mailto:' + part : part;
      const a = el('a', '', {href, textContent: part});
      if (href.startsWith('http') && !href.startsWith(location.origin) && !href.startsWith('https://befisien.com')) Object.assign(a, {target: '_blank', rel: 'noopener'});
      if (href === '#kontak' || href.endsWith('/#kontak')) a.addEventListener('click', () => toggle(false));
      node.append(a);
    });
  };
  const bubble = (role, text = '') => {
    const b = el('div', 'chat-msg is-' + role);
    render(b, text);
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  };

  const showSuggestions = () => {
    suggest.hidden = history.length > 0;
    if (suggest.childElementCount) return;
    SUGGESTIONS.forEach(s => suggest.append(Object.assign(el('button', '', {type: 'button', textContent: s}), {onclick: () => send(s)})));
  };

  bubble('bot', GREETING);
  history.forEach(m => bubble(m.role === 'user' ? 'user' : 'bot', m.content));
  showSuggestions();

  const toggle = open => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', open);
    launcher.setAttribute('aria-label', open ? 'Tutup chat' : 'Buka chat asisten Befisien');
    launcher.classList.toggle('is-open', open);
    if (open) { log.scrollTop = log.scrollHeight; input.focus(); } else launcher.focus({preventScroll: true});
  };
  launcher.addEventListener('click', () => toggle(panel.hidden));
  panel.querySelector('.chat-close').addEventListener('click', () => toggle(false));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

  // textarea grows with its content; Enter sends, Shift+Enter makes a new line
  const fit = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
  input.addEventListener('input', fit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  let busy = false;
  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = ''; fit();
    history.push({role: 'user', content: text});
    bubble('user', text);
    showSuggestions();
    const reply = bubble('bot is-typing');
    reply.innerHTML = '<span></span><span></span><span></span>';
    reply.setAttribute('aria-label', 'Asisten sedang mengetik');

    let answer = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({messages: history.slice(-MAX_SEND)}),
      });
      if (!res.ok) throw new Error(res.status === 429 ? 429 : res.status === 503 ? 'busy' : 'default');
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      reply.removeAttribute('aria-label');
      for (let r; !(r = await reader.read()).done;) {
        answer += r.value;
        reply.classList.remove('is-typing');
        render(reply, answer);
        log.scrollTop = log.scrollHeight;
      }
      answer = answer.trim();
      if (!answer) throw new Error('default');
      history.push({role: 'assistant', content: answer});
    } catch (err) {
      history.pop(); // drop the unanswered question so the conversation stays valid
      reply.classList.remove('is-typing');
      reply.classList.add('is-error');
      reply.removeAttribute('aria-label');
      render(reply, (answer ? answer + '\n\n' : '') + (ERRORS[err.message] || ERRORS.default));
    } finally {
      save();
      busy = false;
      sendBtn.disabled = false;
      if (!panel.hidden) input.focus();
    }
  }
})();
