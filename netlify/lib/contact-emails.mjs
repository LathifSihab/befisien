// Email templates for contact form submissions, styled after the website (navy hero, blue accent,
// Plus Jakarta Sans). Table layout with inline styles so they render in Gmail and Outlook.
// Each builder returns {subject, html, text}; used by netlify/functions/submission-created.mjs.
const SITE = 'https://befisien.com';
const FONT = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";
const C = {accent: '#1F5BEA', navy: '#0B1840', text2: '#2E3F72', tint: '#DDE8FF', page: '#EEF3FF',
  sky: '#9FD4FF', mutedOnDark: '#B8C6EC', line: '#E3EAFB'};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const multiline = s => esc(s).replace(/\r?\n/g, '<br>');
const firstName = nama => String(nama || '').trim().split(/\s+/)[0] || 'Anda';

const formatDate = iso => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta'}).format(iso ? new Date(iso) : new Date()) + ' WIB';

// 08xx / +62 8xx / 628xx → 628xx for wa.me links; null when it doesn't look like a phone number
const waNumber = raw => {
  let n = String(raw || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  return n.length >= 9 ? n : null;
};

const button = (href, label, primary = true) =>
  `<a href="${esc(href)}" style="display:inline-block;padding:13px 24px;border-radius:999px;font-family:${FONT};` +
  `font-size:15px;font-weight:700;text-decoration:none;${primary
    ? `background:${C.accent};color:#ffffff;border:1.5px solid ${C.accent}`
    : `background:#ffffff;color:${C.accent};border:1.5px solid ${C.accent}`}">${label}</a>`;

const chip = (label, value) => value
  ? `<td style="padding:0 8px 8px 0"><span style="display:inline-block;padding:7px 14px;border-radius:999px;` +
    `background:${C.tint};color:${C.navy};font-family:${FONT};font-size:13px;font-weight:600">` +
    `<span style="color:${C.text2};font-weight:500">${label}:</span> ${esc(value)}</span></td>`
  : '';

const heading = text =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.08em;` +
  `text-transform:uppercase;color:${C.accent}">${text}</p>`;

const quote = text =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
  `<td style="padding:18px 20px;background:${C.page};border-left:4px solid ${C.accent};border-radius:0 12px 12px 0;` +
  `font-family:${FONT};font-size:15px;line-height:1.6;color:${C.navy}">${multiline(text)}</td></tr></table>`;

// label/value rows; values are already-safe HTML
const detailRows = rows =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` + rows.map(([label, value], i) =>
    `<tr><td width="34%" style="padding:11px 0;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT};` +
    `font-size:14px;color:${C.text2};vertical-align:top">${label}</td>` +
    `<td style="padding:11px 0;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT};font-size:14px;` +
    `font-weight:600;color:${C.navy};vertical-align:top">${value}</td></tr>`).join('') + `</table>`;

const layout = ({preheader, eyebrow, title, subtitle, body, footnote}) => `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  a{color:${C.accent}}
  @media (max-width:620px){.px{padding-left:24px!important;padding-right:24px!important}.title{font-size:24px!important}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page}">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.page}" style="background:${C.page}">
<tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden">
    <tr><td class="px" style="padding:22px 40px">
      <a href="${SITE}" style="text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle"><img src="${SITE}/assets/img/logo-192.png" width="46" height="46" alt="" style="display:block;border:0"></td>
        <td style="vertical-align:middle;padding-left:4px;font-family:${FONT};color:${C.navy};line-height:1">
          <div style="font-size:19px;font-weight:800;letter-spacing:.02em">BEFISIEN</div>
          <div style="font-size:9.5px;font-weight:800;letter-spacing:.1em;margin-top:3px">TECHNOLOGIES</div>
        </td>
      </tr></table></a>
    </td></tr>
    <tr><td class="px" bgcolor="${C.navy}" style="padding:36px 40px;background:${C.navy};background-image:linear-gradient(135deg,${C.navy} 0%,#132A6B 100%)">
      <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${C.sky}">${eyebrow}</p>
      <h1 class="title" style="margin:0;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-.02em;color:#ffffff">${title}</h1>
      ${subtitle ? `<p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.mutedOnDark}">${subtitle}</p>` : ''}
    </td></tr>
    <tr><td class="px" style="padding:36px 40px 40px;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.text2}">
      ${body}
    </td></tr>
    <tr><td class="px" bgcolor="${C.navy}" style="padding:26px 40px;background:${C.navy};font-family:${FONT};font-size:13px;line-height:1.6;color:${C.mutedOnDark}">
      <p style="margin:0 0 6px;font-weight:700;color:#ffffff">Befisien Technologies</p>
      <p style="margin:0 0 12px">Konsultan IT &amp; transformasi digital: AI agent, otomasi workflow, integrasi sistem, dashboard, dan CMS.</p>
      <p style="margin:0">
        <a href="${SITE}" style="color:${C.sky};text-decoration:none">befisien.com</a> &nbsp;·&nbsp;
        <a href="mailto:info@befisien.com" style="color:${C.sky};text-decoration:none">info@befisien.com</a> &nbsp;·&nbsp;
        <a href="https://www.instagram.com/befisien_id/" style="color:${C.sky};text-decoration:none">Instagram</a> &nbsp;·&nbsp;
        <a href="https://www.linkedin.com/in/befisien-ai-b99a183b2/" style="color:${C.sky};text-decoration:none">LinkedIn</a>
      </p>
    </td></tr>
  </table>
  ${footnote ? `<p style="max-width:520px;margin:18px auto 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.text2}">${footnote}</p>` : ''}
</td></tr>
</table>
</body>
</html>`;

// notification to the Befisien team; replies go straight to the visitor (reply_to is set by the caller)
export const teamEmail = (data, createdAt) => {
  const wa = waNumber(data.whatsapp);
  const who = data.perusahaan ? `${data.nama} · ${data.perusahaan}` : data.nama;
  const fields = [
    ['Nama', data.nama], ['Perusahaan', data.perusahaan], ['Email', data.email],
    ['WhatsApp', data.whatsapp], ['Kebutuhan', data.kebutuhan], ['Ukuran tim', data.ukuran],
  ];
  const link = {
    Email: data.email && `mailto:${data.email}`,
    WhatsApp: wa && `https://wa.me/${wa}`,
  };
  const rows = fields.map(([label, value]) => [label, !value ? '-'
    : link[label] ? `<a href="${esc(link[label])}" style="color:${C.accent}">${esc(value)}</a>` : esc(value)]);
  const actions = [
    data.email && button(`mailto:${data.email}?subject=${encodeURIComponent('Konsultasi Befisien')}`, 'Balas via Email'),
    wa && button(`https://wa.me/${wa}`, 'Chat WhatsApp', false),
  ].filter(Boolean).join('&nbsp;&nbsp;');

  return {
    subject: `Permintaan konsultasi baru: ${who || 'tanpa nama'}`,
    html: layout({
      preheader: `${data.kebutuhan || 'Konsultasi'} · ${String(data.pesan || '').slice(0, 90)}`,
      eyebrow: 'Permintaan konsultasi baru',
      title: esc(who || 'Tanpa nama'),
      subtitle: `Masuk lewat formulir kontak befisien.com pada ${esc(formatDate(createdAt))}.`,
      body: `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>${chip('Kebutuhan', data.kebutuhan)}${chip('Tim', data.ukuran)}</tr></table>
        ${heading('Pesan')}
        ${quote(data.pesan || '-')}
        <div style="height:28px"></div>
        ${heading('Detail kontak')}
        ${detailRows(rows)}
        ${actions ? `<div style="margin-top:28px">${actions}</div>` : ''}`,
      footnote: 'Klik Balas untuk langsung membalas ke pengirim. Salinan pesan ini juga tersimpan di Netlify → Forms → kontak.',
    }),
    text: [
      `Permintaan konsultasi baru dari befisien.com (${formatDate(createdAt)})`, '',
      ...fields.map(([label, value]) => `${label}: ${value || '-'}`),
      '', 'Pesan:', data.pesan || '-',
    ].join('\n'),
  };
};

// confirmation to the visitor
export const thankYouEmail = data => {
  const name = firstName(data.nama);
  const steps = [
    ['Kami pelajari kebutuhan Anda', 'Tim kami membaca pesan Anda dan menyiapkan pertanyaan yang relevan dengan proses bisnis Anda.'],
    ['Kami hubungi Anda', `Kami akan menghubungi Anda lewat email${data.whatsapp ? ' atau WhatsApp' : ''} untuk menjadwalkan sesi konsultasi di waktu yang Anda pilih.`],
    ['Sesi konsultasi gratis', 'Bersama-sama kita petakan proses yang paling menyita waktu dan peluang efisiensinya, tanpa kewajiban apa pun.'],
  ];
  const stepRows = steps.map(([title, desc], i) => `
    <tr>
      <td width="44" style="padding:0 0 18px;vertical-align:top">
        <div style="width:32px;height:32px;line-height:32px;border-radius:50%;background:${C.accent};color:#ffffff;text-align:center;font-family:${FONT};font-size:14px;font-weight:800">${i + 1}</div>
      </td>
      <td style="padding:4px 0 18px;vertical-align:top;font-family:${FONT}">
        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:${C.navy}">${title}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${C.text2}">${desc}</p>
      </td>
    </tr>`).join('');
  const summary = [['Kebutuhan', data.kebutuhan], ['Ukuran tim', data.ukuran], ['Perusahaan', data.perusahaan]]
    .filter(([, value]) => value);

  return {
    subject: `Terima kasih, ${name}. Permintaan konsultasi Anda sudah kami terima`,
    html: layout({
      preheader: 'Tim Befisien sedang mempelajari kebutuhan Anda dan akan segera menghubungi Anda untuk konsultasi gratis.',
      eyebrow: 'Konsultasi gratis',
      title: `Terima kasih, ${esc(name)}!`,
      subtitle: 'Permintaan konsultasi Anda sudah kami terima dengan baik.',
      body: `
        <p style="margin:0 0 16px">Halo ${esc(name)},</p>
        <p style="margin:0 0 16px">Terima kasih telah menghubungi <strong style="color:${C.navy}">Befisien Technologies</strong>. Menceritakan proses yang ingin dibuat lebih efisien adalah langkah pertama yang paling penting, dan Anda sudah melakukannya.</p>
        <p style="margin:0 0 30px">Berikut yang akan terjadi selanjutnya:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>
        <div style="height:12px"></div>
        ${heading('Ringkasan permintaan Anda')}
        ${summary.length ? `<div style="margin-bottom:16px">${detailRows(summary.map(([label, value]) => [label, esc(value)]))}</div>` : ''}
        ${quote(data.pesan || '-')}
        <p style="margin:28px 0 0">Ada informasi tambahan, seperti sistem yang sedang Anda gunakan atau contoh dokumennya? Cukup balas email ini. Semakin banyak yang kami ketahui, semakin tepat rekomendasi kami.</p>
        <p style="margin:16px 0 24px">Sambil menunggu, lihat bagaimana AI dan otomasi membantu proses seperti milik Anda:</p>
        ${button(`${SITE}/#penerapan`, 'Lihat Contoh Penerapan &rarr;')}
        <p style="margin:32px 0 0">Salam efisien,<br><strong style="color:${C.navy}">Tim Befisien Technologies</strong></p>`,
      footnote: 'Anda menerima email ini karena mengisi formulir konsultasi di befisien.com. Jika Anda merasa tidak mengisinya, abaikan saja email ini.',
    }),
    text: [
      `Halo ${name},`, '',
      'Terima kasih telah menghubungi Befisien Technologies. Permintaan konsultasi Anda sudah kami terima dengan baik.', '',
      'Yang akan terjadi selanjutnya:',
      ...steps.map(([title, desc], i) => `${i + 1}. ${title}: ${desc}`), '',
      'Ringkasan permintaan Anda:',
      ...summary.map(([label, value]) => `${label}: ${value}`),
      `Pesan: ${data.pesan || '-'}`, '',
      'Ada informasi tambahan? Cukup balas email ini.',
      `Lihat contoh penerapan: ${SITE}/#penerapan`, '',
      'Salam efisien,', 'Tim Befisien Technologies', SITE,
    ].join('\n'),
  };
};
