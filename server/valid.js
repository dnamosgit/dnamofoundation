// Small checks shared by everything that can be saved in the admin center.
// Each returns a tidy value or throws an Error whose message is shown to the admin.

// One line of text
export function text(v, max, what, required = true) {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (required && !s) throw new Error(`${what} cannot be empty.`);
  if (s.length > max) throw new Error(`${what} is too long (max ${max} characters).`);
  return s;
}

// Text that may run over several lines (line breaks are kept)
export function multiline(v, max, what, required = true) {
  const s = String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (required && !s) throw new Error(`${what} cannot be empty.`);
  if (s.length > max) throw new Error(`${what} is too long (max ${max} characters).`);
  return s;
}

// Paragraphs: an array of non-empty one-line strings
export function paragraphs(v, maxCount, maxLen, what) {
  const arr = list(v, maxCount, what).map((p) => text(p, maxLen, `A paragraph in ${what}`, false)).filter(Boolean);
  return arr;
}

// Links may point to a page on the site, a full web address, an email or a phone number.
export function href(v, what, required = true) {
  const s = String(v == null ? '' : v).trim();
  if (!s) {
    if (required) throw new Error(`${what} needs a link.`);
    return '';
  }
  if (s.length > 500) throw new Error(`${what}: that link is too long.`);
  const ok = /^https?:\/\/[^\s<>"']+$/i.test(s) || /^mailto:[^\s<>"']+$/i.test(s) || /^tel:[+\d\s().-]+$/i.test(s)
    || /^\/?[A-Za-z0-9][A-Za-z0-9._\/-]*(\?[^\s<>"'#]*)?(#[A-Za-z0-9_-]*)?$/.test(s) || /^#[A-Za-z0-9_-]*$/.test(s) || s === '/';
  if (!ok) throw new Error(`${what}: "${s}" is not a link we can use. Use a page like board.html or a full https:// address.`);
  return s;
}

export function link(v, what) {
  const o = obj(v);
  const label = text(o.label, 60, `${what} label`);
  return { label, href: href(o.href, `"${label}"`) };
}

export function list(v, max, what) {
  if (!Array.isArray(v)) throw new Error(`${what} is missing.`);
  if (v.length > max) throw new Error(`${what}: no more than ${max}.`);
  return v;
}

export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// A whole-dollar amount
export function dollars(v, what, max = 100000000) {
  const n = Number(String(v == null ? '' : v).replace(/[$,\s]/g, ''));
  if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${what} must be a whole dollar amount.`);
  return n;
}

// A background video: a YouTube or Vimeo link, a direct link to a video file,
// or a video file that is part of the site. Empty means "no video".
export function video(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (s.length > 500) throw new Error('That video link is too long.');
  if (/^https:\/\/[^\s<>"']+$/i.test(s) || /^[A-Za-z0-9][A-Za-z0-9._\/-]*\.(mp4|webm)$/i.test(s)) return s;
  throw new Error('Use a full video link starting with https:// (YouTube, Vimeo, or a link to an .mp4 file).');
}
