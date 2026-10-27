// GET /: sends visitors outside Indonesia to the English page (/en/), based on Netlify's IP geolocation.
// A language picked in the switcher (the `lang` cookie, set in assets/js/main.js) always wins, and
// crawlers are never redirected, so search engines index both versions through hreflang.
// Only the root is handled: an Indonesian visitor who opens /en/ directly keeps the English page.
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|headless/i;

const toEnglish = req => {
  const url = new URL(req.url);
  url.pathname = '/en/';
  // the answer depends on the visitor's location and cookie, so the redirect must not be cached
  return new Response(null, {status: 302, headers: {Location: url.href, 'Cache-Control': 'private, no-store'}});
};

export default async (req, context) => {
  if (req.method !== 'GET' || BOT.test(req.headers.get('user-agent') || '')) return;

  const lang = context.cookies.get('lang');
  if (lang === 'en') return toEnglish(req);
  if (lang === 'id') return;

  // unknown location (e.g. local dev) keeps the default Indonesian page
  const country = context.geo?.country?.code;
  if (country && country !== 'ID') return toEnglish(req);
};

export const config = {path: '/'};
