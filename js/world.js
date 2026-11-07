/* wave.radio · js/arena/world.js · Collision helpers for Wave Arena. */
const AR_EPS = .01;
const arOverlap = (x, y, w, h, r) => x < r[0] + r[2] - AR_EPS && x + w > r[0] + AR_EPS && y < r[1] + r[3] - AR_EPS && y + h > r[1] + AR_EPS;
function arSolid(rects, x, y){ for (const r of rects) if (x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]) return true; return false; }
function arRay(rects, x1, y1, x2, y2){
  const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 10);
  for (let i = 1; i < n; i++) if (arSolid(rects, x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n)) return true;
  return false;
}
function arMove(a, dt, rects){
  const w = AR.HW * 2, h = AR.HH * 2;
  a.x += a.vx * dt;
  for (const r of rects) if (arOverlap(a.x - AR.HW, a.y - AR.HH, w, h, r)){ if (a.vx > 0) a.x = r[0] - AR.HW; else if (a.vx < 0) a.x = r[0] + r[2] + AR.HW; a.vx = 0; a.wall = true; }
  a.y += a.vy * dt; a.on = false; a.ceil = null;
  for (const r of rects) if (arOverlap(a.x - AR.HW, a.y - AR.HH, w, h, r)){ if (a.vy > 0){ a.y = r[1] - AR.HH; a.on = true; } else if (a.vy < 0){ a.y = r[1] + r[3] + AR.HH; a.ceil = r; } a.vy = 0; }
}
