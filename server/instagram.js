// The latest Instagram posts for a photo gallery.
//
// Two ways to connect an Instagram account:
//  1. Instagram's own API. An access token for the account is stored as the
//     secret INSTAGRAM_TOKEN. Tokens last 60 days, so the server renews it
//     every week and keeps the renewed one in the settings table.
//  2. A Behold feed (behold.so). The feed address is typed in the admin; no
//     token is needed here.
//
// Posts are kept for half an hour, so Instagram is asked at most twice an hour
// however many people visit. If Instagram cannot be reached, the last posts
// that were fetched keep showing.
import { now } from './auth.js';

const KEEP = 1800;              // seconds a fetched list is used before asking again
const RENEW_AFTER = 7 * 86400;  // renew the access token once it is a week old
const MAX_POSTS = 24;
export const BEHOLD_FEED = /^https:\/\/feeds\.behold\.so\/[A-Za-z0-9_-]{6,80}$/;

const get = (env, siteId, key) => env.DB.prepare('SELECT value, updated_at FROM settings WHERE site_id = ? AND key = ?').bind(siteId, key).first();
const put = (env, siteId, key, value) => env.DB.prepare(
  `INSERT INTO settings (site_id, key, value, updated_at) VALUES (?, ?, ?, ?)
   ON CONFLICT (site_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(siteId, key, value, now()).run();
const parse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
const https = (u) => (typeof u === 'string' && /^https:\/\/[^\s<>"']+$/.test(u) ? u : '');
const caption = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 140);

async function fingerprint(s) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return [...bytes.slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// The token to use right now: the secret, or the renewed copy of it. Returns '' when not connected.
async function accessToken(env, siteId) {
  const secret = String(env.INSTAGRAM_TOKEN || '').trim();
  if (!secret) return '';
  const mark = await fingerprint(secret);
  const row = await get(env, siteId, 'instagram:token');
  const kept = row && parse(row.value);
  // A different secret means a new token was set by hand: start again from it.
  if (!kept || kept.mark !== mark || !kept.token) {
    await put(env, siteId, 'instagram:token', JSON.stringify({ mark, token: secret }));
    return secret;
  }
  if (now() - row.updated_at < RENEW_AFTER) return kept.token;
  try {
    const res = await fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(kept.token));
    const data = await res.json();
    if (res.ok && data.access_token) {
      await put(env, siteId, 'instagram:token', JSON.stringify({ mark, token: data.access_token }));
      return data.access_token;
    }
  } catch (e) { /* keep the one we have */ }
  return kept.token;
}

async function fromApi(env, siteId) {
  const token = await accessToken(env, siteId);
  if (!token) return null;
  const res = await fetch('https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=' + MAX_POSTS
    + '&access_token=' + encodeURIComponent(token));
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.data)) throw new Error((data.error && data.error.message) || 'Instagram did not answer (' + res.status + ').');
  return data.data.map((m) => ({
    // A video shows its cover picture
    img: https(m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) || https(m.thumbnail_url),
    href: https(m.permalink), alt: caption(m.caption),
  })).filter((m) => m.img && m.href);
}

async function fromBehold(feed) {
  if (!BEHOLD_FEED.test(feed)) throw new Error('That is not a Behold feed address.');
  const res = await fetch(feed, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => null);
  const posts = Array.isArray(data) ? data : data && data.posts;
  if (!res.ok || !Array.isArray(posts)) throw new Error('The Behold feed did not answer (' + res.status + ').');
  return posts.slice(0, MAX_POSTS).map((m) => {
    const sizes = m.sizes || {};
    const sized = (sizes.medium || sizes.large || sizes.small || {}).mediaUrl;
    return {
      img: https(sized) || https(m.mediaType === 'VIDEO' ? m.thumbnailUrl : m.mediaUrl) || https(m.thumbnailUrl),
      href: https(m.permalink), alt: caption(m.prunedCaption || m.caption),
    };
  }).filter((m) => m.img && m.href);
}

// Fetch now, whatever is stored. Returns { connected, posts, error }.
export async function refreshInstagram(env, siteId, feed) {
  const key = 'instagram:' + (feed ? 'feed' : 'api');
  const row = await get(env, siteId, key);
  const old = (row && parse(row.value)) || {};
  const last = old.feed === (feed || '') && Array.isArray(old.posts) ? old.posts : [];
  try {
    const posts = feed ? await fromBehold(feed) : await fromApi(env, siteId);
    if (posts === null) return { connected: false, posts: [], error: '' };
    await put(env, siteId, key, JSON.stringify({ feed: feed || '', posts }));
    return { connected: true, posts, error: '' };
  } catch (e) {
    // Remember the failure for a while too, so a broken connection is not retried on every visit
    await put(env, siteId, key, JSON.stringify({ feed: feed || '', posts: last }));
    return { connected: true, posts: last, error: e.message };
  }
}

// For a page: up to count posts, from the stored list when it is fresh enough.
export async function instagramPosts(env, siteId, count, feed) {
  const row = await get(env, siteId, 'instagram:' + (feed ? 'feed' : 'api'));
  const kept = row && parse(row.value);
  if (kept && kept.feed === (feed || '') && Array.isArray(kept.posts) && now() - row.updated_at < KEEP) return kept.posts.slice(0, count);
  return (await refreshInstagram(env, siteId, feed)).posts.slice(0, count);
}
