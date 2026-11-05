/* wave.radio · js/arena/sim.js · Wave Arena simulation: players, weapons, bullets, grenades, pickups and scoring. */
const arStats = up => ({hp:100 + 10 * (up.hp || 0), fuel:100 * (1 + .15 * (up.fuel || 0)), dmg:1 + .06 * (up.dmg || 0), rel:1 - .06 * (up.rel || 0)});
const arMap = id => MAPS.find(m => m.id === id) || MAPS[0];
function arNew(cfg){
  const map = arMap(cfg.map);
  return {cfg, map, rects:map.rects, spawns:map.spawns.map(s => [s[0], s[1] - AR.HH - 1]), t:0, over:false, actors:[], byId:{}, bullets:[], gren:[], parts:[], feed:[], hooks:{}, sfx:null, me:null, shake:0,
    pk:map.pickups.map((p, i) => ({i, x:p[0], y:p[1] - 14, type:p[2], cd:0}))};
}
function arAdd(g, o){
  const st = arStats(o.up || {});
  const a = {id:o.id, name:o.name || 'Player', bot:!!o.bot, remote:!!o.remote, skin:o.skin || 'lime', x:0, y:0, vx:0, vy:0, face:1, aim:0, on:false, wall:false, alive:false, rt:0, inv:0, hurt:0, jet:false, fd:0, step:0,
    hp:st.hp, maxHp:st.hp, fuel:st.fuel, maxFuel:st.fuel, dmgMul:st.dmg, relMul:st.rel, slot:['pistol', null], am:[null, null], cur:0, rel:0, fireCd:0, gr:2, gc:0, kills:0, deaths:0,
    in:{mx:0, jet:false, ax:1, ay:0, fire:false, gren:false, reload:false, swap:false}, ai:null, tx:0, ty:0, ta:0, wk:'pistol', seen:false};
  g.actors.push(a); g.byId[a.id] = a; if (!a.remote) arRespawn(g, a); return a;
}
function arRespawn(g, a){
  let best = g.spawns[0], bs = -1;
  for (const s of g.spawns){ let m = 1e6; for (const o of g.actors) if (o !== a && o.alive) m = Math.min(m, Math.hypot(o.x - s[0], o.y - s[1])); m += Math.random() * 250; if (m > bs){ bs = m; best = s; } }
  a.x = best[0]; a.y = best[1]; a.vx = a.vy = 0; a.hp = a.maxHp; a.fuel = a.maxFuel; a.alive = true; a.inv = 1.6; a.slot = ['pistol', null]; a.am = [{mag:WEAPONS.pistol.mag, res:Infinity}, null];
  a.cur = 0; a.rel = 0; a.gr = 2; a.fireCd = .3; a.wk = 'pistol';
  g.parts.push({x:a.x, y:a.y, life:.5, max:.5, r:50, c:'#ffffff', ty:'r'});
}
function arBlood(g, x, y, n, c){ for (let i = 0; i < n; i++){ const an = Math.random() * 6.283, sp = 60 + Math.random() * 220; g.parts.push({x, y, vx:Math.cos(an) * sp, vy:Math.sin(an) * sp - 80, life:.45, max:.45, r:2.5, c, ty:'p'}); } }
function arSpawnBullets(g, owner, x, y, ang, wk, dmg, mine){
  const w = WEAPONS[wk];
  for (let i = 0; i < w.pel; i++){ const an = ang + (Math.random() - .5) * 2 * w.spr; g.bullets.push({x, y, vx:Math.cos(an) * w.spd, vy:Math.sin(an) * w.spd, dmg, o:owner, life:w.rng / w.spd, w:wk, mine}); }
}
function arReload(a){ const w = WEAPONS[a.slot[a.cur]], am = a.am[a.cur]; if (a.rel > 0 || am.mag >= w.mag || am.res <= 0) return; a.rel = w.rel * a.relMul; }
function arFinishReload(a){ const w = WEAPONS[a.slot[a.cur]], am = a.am[a.cur], take = Math.min(w.mag - am.mag, am.res); am.mag += take; am.res -= take; }
function arSwap(a){ if (!a.slot[1]) return; a.cur ^= 1; a.rel = 0; a.fireCd = .2; }
function arFire(g, a){
  const k = a.slot[a.cur], w = WEAPONS[k], am = a.am[a.cur];
  if (a.rel > 0 || a.fireCd > 0) return;
  if (am.mag <= 0){ arReload(a); return; }
  am.mag--; a.fireCd = w.rate;
  const mx = a.x + Math.cos(a.aim) * 20, my = a.y - 4 + Math.sin(a.aim) * 20;
  arSpawnBullets(g, a.id, mx, my, a.aim, k, w.dmg * a.dmgMul, true);
  a.vx -= Math.cos(a.aim) * w.kick; a.vy -= Math.sin(a.aim) * w.kick * .4;
  g.parts.push({x:mx, y:my, vx:0, vy:0, life:.06, max:.06, r:7, c:'#ffe27a', ty:'f'});
  if (g.hooks.shot) g.hooks.shot(a, mx, my, a.aim, k);
  if (g.sfx && a === g.me) g.sfx('shot');
}
function arThrow(g, a){
  if (a.gr <= 0 || a.gc > 0) return;
  a.gr--; a.gc = .6;
  const q = {x:a.x, y:a.y - 6, vx:Math.cos(a.aim) * 560 + a.vx * .4, vy:Math.sin(a.aim) * 560 - 120 + a.vy * .2, t:2, o:a.id, mine:true};
  g.gren.push(q); if (g.hooks.gren) g.hooks.gren(q);
}
function arDamage(g, a, d, by, wk){
  if (!a.alive || a.inv > 0 || d <= 0) return;
  a.hp -= d; a.hurt = .12; arBlood(g, a.x, a.y, 5, '#c1121f');
  if (g.sfx && a === g.me) g.sfx('hurt');
  if (a.hp <= 0){ a.hp = 0; arDie(g, a, by, wk); }
}
function arDie(g, a, by, wk){
  a.alive = false; a.rt = AR.RESPAWN; a.deaths++; a.hp = 0;
  const k = g.byId[by]; if (k && k !== a) k.kills++;
  g.feed.unshift({t:g.t, k:k && k !== a ? k.name : '', v:a.name, w:wk});
  arBlood(g, a.x, a.y, 22, '#c1121f');
  if (g.hooks.die) g.hooks.die(a, by, wk);
  if (k && k !== a && k.kills >= g.cfg.limit) g.over = true;
}
function arHitActor(g, a, dmg, by, wk){
  arBlood(g, a.x, a.y, 3, '#c1121f');
  if (a.remote){ if (g.hooks.hit) g.hooks.hit(a, dmg, by, wk); } else arDamage(g, a, dmg, by, wk);
}
function arPickup(g, a, p){
  if (p.type === 'hp'){ if (a.hp >= a.maxHp) return false; a.hp = Math.min(a.maxHp, a.hp + 45); }
  else if (p.type === 'ammo'){
    const am = a.am[1]; if (!am && a.gr >= 3) return false;
    if (am){ const w = WEAPONS[a.slot[1]]; am.res = Math.min(w.res * 1.5, am.res + w.mag); }
    a.gr = Math.min(3, a.gr + 1);
  } else { const w = WEAPONS[p.type]; a.slot[1] = p.type; a.am[1] = {mag:w.mag, res:w.res}; a.cur = 1; a.rel = 0; }
  if (g.sfx && a === g.me) g.sfx('pick');
  return true;
}
function arExplode(g, q){
  const R = 150; g.shake = Math.max(g.shake, .25);
  for (let i = 0; i < 18; i++){ const an = Math.random() * 6.283, sp = 120 + Math.random() * 380; g.parts.push({x:q.x, y:q.y, vx:Math.cos(an) * sp, vy:Math.sin(an) * sp, life:.5, max:.5, r:3, c:i % 2 ? '#ff8a00' : '#ffe27a', ty:'p'}); }
  g.parts.push({x:q.x, y:q.y, life:.35, max:.35, r:R, c:'#ffb224', ty:'r'});
  if (g.sfx) g.sfx('boom');
  for (const a of g.actors){
    if (!a.alive) continue;
    const d = Math.hypot(a.x - q.x, a.y - q.y); if (d > R) continue;
    if (!a.remote){ const k = 1 - d / R; a.vx += (a.x - q.x) / (d || 1) * 500 * k; a.vy += (a.y - q.y) / (d || 1) * 500 * k - 100 * k; }
    if (!q.mine) continue;
    const dmg = Math.max(12, 90 * (1 - d / R)) * (a.id === q.o ? .6 : 1);
    if (a.remote){ if (g.hooks.hit) g.hooks.hit(a, dmg, q.o, 'gren'); } else arDamage(g, a, dmg, q.o, 'gren');
  }
}
function arBullets(g, dt){
  for (let i = g.bullets.length - 1; i >= 0; i--){
    const b = g.bullets[i], nx = b.x + b.vx * dt, ny = b.y + b.vy * dt, n = Math.max(1, Math.ceil(Math.hypot(nx - b.x, ny - b.y) / 10)); let dead = false;
    for (let s = 1; s <= n && !dead; s++){
      const px = b.x + (nx - b.x) * s / n, py = b.y + (ny - b.y) * s / n;
      if (arSolid(g.rects, px, py)){ dead = true; g.parts.push({x:px, y:py, vx:0, vy:0, life:.12, max:.12, r:5, c:'#ffe27a', ty:'f'}); break; }
      if (!b.mine) continue;
      for (const a of g.actors){
        if (a.id === b.o || !a.alive || (!a.remote && a.inv > 0)) continue;
        if (Math.abs(px - a.x) < AR.HW + 3 && Math.abs(py - a.y) < AR.HH + 3){ arHitActor(g, a, b.dmg, b.o, b.w); dead = true; break; }
      }
    }
    b.x = nx; b.y = ny; b.life -= dt;
    if (dead || b.life <= 0 || nx < -100 || ny < -100 || nx > 4000 || ny > 3000) g.bullets.splice(i, 1);
  }
}
function arGrenades(g, dt){
  for (let i = g.gren.length - 1; i >= 0; i--){
    const q = g.gren[i]; q.t -= dt; q.vy += AR.G * dt * .9;
    const nx = q.x + q.vx * dt; if (arSolid(g.rects, nx, q.y)) q.vx *= -.5; else q.x = nx;
    const ny = q.y + q.vy * dt;
    if (arSolid(g.rects, q.x, ny)){ if (q.vy > 0 && q.vy < 140) q.vy = 0; else q.vy *= -.45; q.vx *= .8; } else q.y = ny;
    if (q.t <= 0){ g.gren.splice(i, 1); arExplode(g, q); }
  }
}
function arControl(g, a, dt){
  const i = a.in;
  if (i.ax || i.ay) a.aim = Math.atan2(i.ay, i.ax);
  a.face = Math.cos(a.aim) >= 0 ? 1 : -1;
  a.vx += (i.mx * AR.RUN - a.vx) * Math.min(1, (a.on ? 14 : 5) * dt);
  a.vy += AR.G * dt; a.jet = false;
  if (i.jet && a.fuel > 0){ a.vy -= AR.JET * dt; if (a.vy < AR.JETV) a.vy = AR.JETV; a.fuel = Math.max(0, a.fuel - AR.FUEL_USE * dt); a.jet = true; a.fd = .4; }
  else { a.fd -= dt; if (a.fd <= 0) a.fuel = Math.min(a.maxFuel, a.fuel + (a.on ? 55 : 14) * dt); }
  if (a.vy > AR.FALL) a.vy = AR.FALL;
  a.wall = false; arMove(a, dt, g.rects);
  a.step += Math.abs(a.vx) * dt; a.fireCd -= dt; a.gc -= dt; a.wk = a.slot[a.cur];
  if (a.rel > 0){ a.rel -= dt; if (a.rel <= 0) arFinishReload(a); }
  if (i.reload){ arReload(a); i.reload = false; }
  if (i.swap){ arSwap(a); i.swap = false; }
  if (i.gren){ arThrow(g, a); i.gren = false; }
  if (i.fire) arFire(g, a);
}
function arStep(g, dt){
  if (g.over) return;
  g.t += dt; if (g.shake > 0) g.shake -= dt;
  for (const a of g.actors){
    if (a.remote){
      if (a.seen){
        const k = Math.min(1, dt * 14); a.x += (a.tx - a.x) * k; a.y += (a.ty - a.y) * k;
        let da = a.ta - a.aim; da = Math.atan2(Math.sin(da), Math.cos(da)); a.aim += da * Math.min(1, dt * 20); a.face = Math.cos(a.aim) >= 0 ? 1 : -1; a.step += Math.abs(a.vx) * dt;
      }
      if (a.hurt > 0) a.hurt -= dt; continue;
    }
    if (a.hurt > 0) a.hurt -= dt; if (a.inv > 0) a.inv -= dt;
    if (!a.alive){ a.rt -= dt; if (a.rt <= 0) arRespawn(g, a); continue; }
    if (a.bot) arBot(g, a, dt);
    arControl(g, a, dt);
  }
  for (const p of g.pk){
    if (p.cd > 0){ p.cd -= dt; continue; }
    for (const a of g.actors){ if (a.remote || !a.alive) continue; if (Math.abs(a.x - p.x) < 24 && Math.abs(a.y - p.y) < 30 && arPickup(g, a, p)){ p.cd = 20; if (g.hooks.pick) g.hooks.pick(p.i); break; } }
  }
  arBullets(g, dt); arGrenades(g, dt);
  for (let i = g.parts.length - 1; i >= 0; i--){ const p = g.parts[i]; p.life -= dt; if (p.ty === 'p'){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; } if (p.life <= 0) g.parts.splice(i, 1); }
  if (g.feed.length > 5 || (g.feed.length && g.t - g.feed[g.feed.length - 1].t > 6)) g.feed = g.feed.filter(f => g.t - f.t < 6).slice(0, 5);
  if (g.t >= g.cfg.time) g.over = true;
}
