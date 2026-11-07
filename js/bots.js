/* wave.radio · js/arena/bots.js · Bot brains for solo matches. */
function arBot(g, a, dt){
  const ai = a.ai || (a.ai = {t:0, tgt:null, dir:1, goal:null, err:0, et:0});
  const d = {easy:{e:.2, r:.5}, normal:{e:.09, r:.3}, hard:{e:.03, r:.15}}[g.cfg.diff] || {e:.09, r:.3};
  ai.t -= dt; ai.et -= dt;
  if (ai.t <= 0){
    ai.t = d.r + Math.random() * .3; ai.dir = Math.random() < .5 ? -1 : 1; ai.goal = null;
    let best = null, bd = 1e9;
    for (const o of g.actors) if (o !== a && o.alive){ const dd = Math.hypot(o.x - a.x, o.y - a.y); if (dd < bd){ bd = dd; best = o; } }
    ai.tgt = best;
    const want = a.hp < a.maxHp * .45 ? 'hp' : (a.slot[1] ? null : 'w');
    if (want && !(ai.ng > 0)){ let gd = 1e9; for (const p of g.pk) if (p.cd <= 0 && (want === 'hp' ? p.type === 'hp' : (p.type !== 'hp' && p.type !== 'ammo'))){ const dd = Math.hypot(p.x - a.x, p.y - a.y); if (dd < gd){ gd = dd; ai.goal = p; } } }
  }
  if (ai.goal){ if (ai.goal.cd > 0) ai.goal = null; else { ai.gt = (ai.gt === undefined ? 7 : ai.gt) - dt; if (ai.gt <= 0){ ai.goal = null; ai.ng = 9; ai.gt = undefined; } } } else ai.gt = undefined;
  ai.ng -= dt;
  if (ai.et <= 0){ ai.et = .35; ai.err = (Math.random() - .5) * 2 * d.e; }
  const i = a.in, t = ai.tgt && ai.tgt.alive ? ai.tgt : null, k = a.slot[a.cur], w = WEAPONS[k];
  i.fire = false; i.jet = false; i.mx = 0;
  let gy = a.y;
  if (ai.goal){ const dx = ai.goal.x - a.x; i.mx = Math.abs(dx) > 14 ? Math.sign(dx) : 0; gy = ai.goal.y; }
  else if (t){
    const pref = k === 'shotgun' ? 180 : k === 'sniper' ? 650 : k === 'smg' ? 340 : 420, dx = t.x - a.x, ad = Math.abs(dx);
    i.mx = ad > pref * 1.25 ? Math.sign(dx) : ad < pref * .6 ? -Math.sign(dx) : ai.dir * .6; gy = t.y;
  }
  if (a.ceil && !ai.esc){ const r = a.ceil, left = a.x - r[0], right = r[0] + r[2] - a.x, dir = left < right ? -1 : 1; ai.esc = {dir, t:(Math.min(left, right) + 30) / AR.RUN}; }
  if (ai.esc){ ai.esc.t -= dt; i.mx = ai.esc.dir; if (ai.esc.t <= 0) ai.esc = null; }
  if (((gy - a.y < -50) || a.wall) && a.fuel > 12) i.jet = true;
  if (t){
    const dist = Math.hypot(t.x - a.x, t.y - a.y), tt = dist / w.spd;
    const ang = Math.atan2(t.y + (t.vy || 0) * tt * .4 - 3 - a.y, t.x + (t.vx || 0) * tt * .6 - a.x) + ai.err;
    i.ax = Math.cos(ang); i.ay = Math.sin(ang);
    const clear = !arRay(g.rects, a.x, a.y, t.x, t.y);
    if (dist < w.rng * .95 && clear) i.fire = true;
    if (clear && dist > 160 && dist < 420 && a.gr > 0 && a.gc <= 0 && Math.random() < dt * .3) i.gren = true;
  } else { i.ax = i.mx || a.face; i.ay = 0; }
  const am = a.am[a.cur];
  if (am.mag <= 0 && a.rel <= 0){ if (am.res > 0) i.reload = true; else if (a.cur === 1) i.swap = true; }
}
