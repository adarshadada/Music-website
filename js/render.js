/* wave.radio · js/arena/render.js · Canvas drawing for Wave Arena (flat colours only). */
const arSkin = id => SKINS.find(s => s.id === id) || SKINS[0];
function arHat(c, sk, f){
  c.fillStyle = sk.a;
  switch (sk.hat){
    case 'cap': c.fillRect(-8, -25, 16, 6); c.fillRect(f > 0 ? 0 : -12, -20, 12, 3); break;
    case 'helmet': c.beginPath(); c.arc(0, -16, 9.5, Math.PI, 0); c.fill(); c.fillRect(-9.5, -17, 19, 3); break;
    case 'beanie': c.beginPath(); c.arc(0, -17, 8.5, Math.PI, 0); c.fill(); c.fillRect(-9, -19, 18, 4); c.beginPath(); c.arc(0, -27, 3, 0, 6.283); c.fill(); break;
    case 'band': c.fillRect(-8.5, -20, 17, 4); c.fillRect(f > 0 ? -14 : 8, -19, 6, 3); break;
    case 'visor': c.fillRect(-9, -22, 18, 9); c.fillStyle = '#14131a'; c.fillRect(-7, -19, 14, 3); break;
    case 'horns': c.beginPath(); c.moveTo(-8, -20); c.lineTo(-12, -32); c.lineTo(-3, -22); c.fill(); c.beginPath(); c.moveTo(8, -20); c.lineTo(12, -32); c.lineTo(3, -22); c.fill(); break;
    case 'crown': c.beginPath(); c.moveTo(-8, -21); c.lineTo(-8, -31); c.lineTo(-4, -26); c.lineTo(0, -32); c.lineTo(4, -26); c.lineTo(8, -31); c.lineTo(8, -21); c.fill(); break;
  }
}
function arSoldier(c, x, y, o){
  const sk = arSkin(o.skin), f = o.face || 1, w = WEAPONS[o.wk] || WEAPONS.pistol, dark = '#14131a';
  c.save(); c.translate(x, y);
  c.fillStyle = sk.a; c.fillRect(-f * 12 - 4, -8, 8, 16);
  if (o.jet){
    c.fillStyle = '#ff8a00'; c.beginPath(); c.moveTo(-f * 12 - 3, 8); c.lineTo(-f * 12 + 3, 8); c.lineTo(-f * 12, 18 + Math.random() * 10); c.fill();
    c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(-f * 12 - 1.5, 8); c.lineTo(-f * 12 + 1.5, 8); c.lineTo(-f * 12, 14 + Math.random() * 5); c.fill();
  }
  const sw = o.air ? 0 : Math.sin((o.ph || 0) * .06) * 5; c.fillStyle = dark; c.fillRect(-7 + sw, 10, 6, 11); c.fillRect(1 - sw, 10, 6, 11);
  c.fillStyle = o.hurt > 0 ? '#ffffff' : sk.c; c.fillRect(-8, -9, 16, 20);
  c.fillStyle = '#f0d3b0'; c.beginPath(); c.arc(0, -15, 8, 0, 6.283); c.fill();
  arHat(c, sk, f);
  c.fillStyle = dark; c.fillRect(f > 0 ? 2 : -5, -17, 3, 3);
  c.save(); c.translate(0, -3); c.rotate(o.aim || 0); if (f < 0) c.scale(1, -1);
  c.fillStyle = w.col; c.fillRect(2, -3, 22, 6); c.fillStyle = dark; c.fillRect(2, 1, 6, 6);
  c.restore(); c.restore();
}
function arDraw(c, g, cam, vw, vh, sc){
  const m = g.map, W = c.canvas.width, H = c.canvas.height, me = g.me;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = m.sky; c.fillRect(0, 0, W, H);
  c.setTransform(sc, 0, 0, sc, 0, 0); c.fillStyle = m.far;
  const off = -((cam.x * .35) % 600);
  for (let i = -1; i < vw / 600 + 2; i++){ const bx = off + i * 600; c.beginPath(); c.moveTo(bx, vh); c.lineTo(bx + 150, vh - 230); c.lineTo(bx + 300, vh - 120); c.lineTo(bx + 450, vh - 270); c.lineTo(bx + 600, vh); c.fill(); }
  const sh = g.shake > 0 ? g.shake * 14 : 0;
  c.setTransform(sc, 0, 0, sc, -cam.x * sc + (Math.random() - .5) * sh, -cam.y * sc + (Math.random() - .5) * sh);
  for (const r of g.rects){
    if (r[0] > cam.x + vw || r[0] + r[2] < cam.x || r[1] > cam.y + vh || r[1] + r[3] < cam.y) continue;
    c.fillStyle = m.solid; c.fillRect(r[0], r[1], r[2], r[3]); c.fillStyle = m.edge; c.fillRect(r[0], r[1], r[2], Math.min(6, r[3]));
  }
  c.textAlign = 'center';
  for (const p of g.pk){
    if (p.cd > 0) continue; const x = p.x, y = p.y + Math.sin(g.t * 3 + p.i) * 3;
    if (p.type === 'hp'){ c.fillStyle = '#ffffff'; c.fillRect(x - 11, y - 11, 22, 22); c.fillStyle = '#e5484d'; c.fillRect(x - 3, y - 8, 6, 16); c.fillRect(x - 8, y - 3, 16, 6); }
    else if (p.type === 'ammo'){ c.fillStyle = '#ffd166'; c.fillRect(x - 11, y - 11, 22, 22); c.fillStyle = '#14131a'; c.fillRect(x - 6, y - 6, 4, 12); c.fillRect(x + 2, y - 6, 4, 12); }
    else { const w = WEAPONS[p.type]; c.fillStyle = '#14131a'; c.fillRect(x - 13, y - 9, 26, 18); c.fillStyle = w.col === '#2a2a2a' ? '#8a8a8a' : w.col; c.fillRect(x - 10, y - 3, 20, 6); c.fillStyle = '#ffffff'; c.font = '600 10px DM Sans, sans-serif'; c.fillText(w.n, x, y - 14); }
  }
  for (const q of g.gren){ c.fillStyle = '#14131a'; c.beginPath(); c.arc(q.x, q.y, 5, 0, 6.283); c.fill(); c.strokeStyle = q.t < .6 && Math.floor(q.t * 12) % 2 ? '#ff3b5c' : '#888888'; c.lineWidth = 2; c.stroke(); }
  c.strokeStyle = '#ffe27a'; c.lineWidth = 2.5; c.beginPath();
  for (const b of g.bullets){ c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * .018, b.y - b.vy * .018); }
  c.stroke();
  for (const a of g.actors){
    if (!a.alive || (a.remote && !a.seen)) continue;
    const blink = a.inv > 0 && Math.floor(g.t * 14) % 2; if (blink) c.globalAlpha = .45;
    arSoldier(c, a.x, a.y, {skin:a.skin, face:a.face, aim:a.aim, wk:a.wk, jet:a.jet, ph:a.step, air:Math.abs(a.vy) > 60, hurt:a.hurt});
    c.globalAlpha = 1;
    if (a !== me){
      c.fillStyle = '#ffffff'; c.font = '600 11px DM Sans, sans-serif'; c.fillText(a.name, a.x, a.y - 38);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(a.x - 16, a.y - 35, 32, 4); c.fillStyle = '#46c46b'; c.fillRect(a.x - 16, a.y - 35, 32 * Math.max(0, Math.min(1, a.hp / a.maxHp)), 4);
    }
  }
  if (me && me.alive){
    const ca = Math.cos(me.aim), sa = Math.sin(me.aim);
    c.setLineDash([5, 7]); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(me.x + ca * 34, me.y - 4 + sa * 34); c.lineTo(me.x + ca * 130, me.y - 4 + sa * 130); c.stroke(); c.setLineDash([]);
  }
  for (const p of g.parts){
    const k = Math.max(0, p.life / p.max); c.globalAlpha = k;
    if (p.ty === 'r'){ c.strokeStyle = p.c; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, p.r * (1 - k) + 4, 0, 6.283); c.stroke(); }
    else { c.fillStyle = p.c; if (p.ty === 'f'){ c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill(); } else c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
  }
  c.globalAlpha = 1;
}
function arHud(c, W, H, g, me){
  const s = H / 540; c.setTransform(1, 0, 0, 1, 0, 0); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const bar = (x, y, w, h, v, col) => { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h); };
  const x0 = 14 * s;
  bar(x0, 14 * s, 170 * s, 12 * s, me.hp / me.maxHp, me.hp < me.maxHp * .3 ? '#e5484d' : '#46c46b');
  bar(x0, 30 * s, 170 * s, 8 * s, me.fuel / me.maxFuel, '#4ca3ff');
  const w = WEAPONS[me.slot[me.cur]], am = me.am[me.cur];
  c.fillStyle = '#ffffff'; c.font = `700 ${14 * s}px DM Sans, sans-serif`;
  c.fillText(`${w.n}  ${am ? am.mag : 0} / ${am && am.res === Infinity ? 'inf' : (am ? am.res : 0)}   Grenades ${me.gr}`, x0, 58 * s);
  if (me.rel > 0) c.fillText('Reloading...', x0, 76 * s);
  c.textAlign = 'center'; c.font = `800 ${20 * s}px DM Sans, sans-serif`;
  const left = Math.max(0, g.cfg.time - g.t); c.fillText(Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0'), W / 2, 28 * s);
  c.font = `600 ${13 * s}px DM Sans, sans-serif`; c.fillText(`Your kills ${me.kills} of ${g.cfg.limit}`, W / 2, 46 * s);
  c.textAlign = 'right'; c.font = `600 ${13 * s}px DM Sans, sans-serif`;
  g.feed.slice(0, 4).forEach((f, i) => { const wn = WEAPONS[f.w] ? WEAPONS[f.w].n : 'Grenade'; c.fillStyle = 'rgba(0,0,0,.55)'; const t = f.k ? `${f.k}  [${wn}]  ${f.v}` : `${f.v} fell`; c.fillRect(W - 24 * s - c.measureText(t).width, (62 + i * 20) * s, c.measureText(t).width + 12 * s, 18 * s); c.fillStyle = '#ffffff'; c.fillText(t, W - 18 * s, (76 + i * 20) * s); });
  if (me.hurt > 0){ c.fillStyle = 'rgba(229,72,77,.22)'; c.fillRect(0, 0, W, H); }
  if (!me.alive){
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff'; c.textAlign = 'center';
    c.font = `800 ${34 * s}px Bricolage Grotesque, DM Sans, sans-serif`; c.fillText('You were eliminated', W / 2, H / 2 - 10 * s);
    c.font = `600 ${16 * s}px DM Sans, sans-serif`; c.fillText('Respawning in ' + Math.ceil(Math.max(0, me.rt)), W / 2, H / 2 + 22 * s);
  }
}
