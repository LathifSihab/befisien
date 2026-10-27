// Netlify event function: runs after every verified Netlify Forms submission (spam is filtered out first)
// and emails the contact form through Resend, as a backup to the Netlify email notifications.
// Needs the RESEND_API_KEY environment variable (Netlify → Site configuration → Environment variables);
// the sender domain in CONTACT_FROM must be verified in Resend. CONTACT_TO overrides the recipients (comma-separated).
const FROM = process.env.CONTACT_FROM || 'Website Befisien <noreply@befisien.com>';
const TO = (process.env.CONTACT_TO || 'lathif.sihab95@gmail.com,info@befisien.com,befisien.official@gmail.com')
  .split(',').map(s => s.trim()).filter(Boolean);

const FIELDS = [
  ['nama', 'Nama'],
  ['perusahaan', 'Perusahaan'],
  ['email', 'Email'],
  ['whatsapp', 'WhatsApp'],
  ['kebutuhan', 'Kebutuhan'],
  ['ukuran', 'Ukuran tim'],
  ['pesan', 'Pesan'],
];

export default async req => {
  const {payload} = await req.json();
  if (payload.form_name !== 'kontak') return new Response(null, {status: 204});
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set; skipping the Resend email');
    return new Response(null, {status: 204});
  }

  const data = payload.data || {};
  const text = FIELDS.map(([key, label]) => `${label}: ${data[key] || '-'}`).join('\n') +
    `\n\nDikirim: ${payload.created_at}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: FROM,
      to: TO,
      subject: `Pesan baru dari website Befisien: ${data.nama || 'tanpa nama'}`,
      text,
      ...(data.email && {reply_to: data.email}),
    }),
  });
  // a failed send is only logged: the submission itself is already stored in Netlify Forms
  if (!res.ok) console.error(`Resend ${res.status}: ${await res.text()}`);
  return new Response(null, {status: 204});
};
