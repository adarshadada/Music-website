/* wave.radio · js/core.js · Helpers, logo fallbacks, shared state. */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ls = {get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let sb = null;
try { if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){}

/* ---- logo fallbacks: used whenever there is no profile picture, banner or station logo ---- */
const LOGO = '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#c8f54b"/><path d="M12 34c5-12 10-12 15 0s10 12 15 0 6-8 10-4" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/></svg>';
const BAN = '<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice"><rect width="400" height="120" fill="#c8f54b"/><path d="M148 66c16-34 32-34 48 0s32 34 48 0 20-22 32-12" fill="none" stroke="#111" stroke-width="12" stroke-linecap="round"/></svg>';
const pic = (u, k) => u ? `<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=window.FB['${k}']">` : (k === 'b' ? BAN : LOGO);
window.FB = {a:LOGO, b:BAN};
$('mk').innerHTML = LOGO;
const onc = h => { const n = parseInt(h.slice(1), 16), l = (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)); return l > 150 ? '#14131a' : '#fff'; };
function accent(c){ c = /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#c8f54b'; document.documentElement.style.setProperty('--accent', c); document.documentElement.style.setProperty('--on', onc(c)); }
let tt; function toast(m){ const s = $('ts'); s.textContent = m; s.style.display = m ? 'inline-block' : 'none'; clearTimeout(tt); if (m) tt = setTimeout(() => s.style.display = 'none', 4000); }

if (sb) ls.set('wr_user', null); // drop any leftover demo-mode profile (its id "demo" isn't a valid uuid)
let user = sb ? null : ls.get('wr_user', null), my = null, tab = 'real';
const au = new Audio(); au.preload = 'none';
const isLive = s => s.is_live && Date.now() - new Date(s.live_at || 0) < 180000;
const who = u => (u && (u.display_name || u.username)) || 'guest';
