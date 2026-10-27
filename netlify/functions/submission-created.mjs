// Netlify event function: runs after every verified Netlify Forms submission (spam is filtered out first).
// For the contact form it sends two emails through Resend: a notification to the Befisien team, and a
// thank-you confirmation to the visitor. Templates live in netlify/lib/contact-emails.mjs.
// Needs the RESEND_API_KEY environment variable (Netlify → Site configuration → Environment variables);
// the sender domain must be verified in Resend. CONTACT_TO overrides the team recipients (comma-separated),
// CONTACT_FROM the sender address.
import {teamEmail, thankYouEmail} from '../lib/contact-emails.mjs';

const FROM = process.env.CONTACT_FROM || 'Befisien Technologies <info@befisien.com>';
const TEAM_INBOX = 'info@befisien.com';
const TO = (process.env.CONTACT_TO || 'lathif.sihab95@gmail.com,info@befisien.com,befisien.official@gmail.com')
  .split(',').map(s => s.trim()).filter(Boolean);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const send = async (label, email) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({from: FROM, ...email}),
  });
  if (!res.ok) console.error(`Resend ${label} ${res.status}: ${await res.text()}`);
};

export default async req => {
  const {payload} = await req.json();
  if (payload.form_name !== 'kontak') return new Response(null, {status: 204});
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set; skipping the Resend emails');
    return new Response(null, {status: 204});
  }

  const data = payload.data || {};
  const visitor = typeof data.email === 'string' && EMAIL_RE.test(data.email.trim()) ? data.email.trim() : null;

  // a failed send is only logged: the submission itself is already stored in Netlify Forms
  await Promise.all([
    send('team', {to: TO, ...(visitor && {reply_to: visitor}), ...teamEmail(data, payload.created_at)}),
    visitor && send('thank-you', {to: [visitor], reply_to: TEAM_INBOX, ...thankYouEmail(data)}),
  ]);
  return new Response(null, {status: 204});
};
