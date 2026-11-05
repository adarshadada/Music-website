/* wave.radio · js/arena/input.js · Touch sticks, buttons, keyboard and mouse for Wave Arena. */
const arIn = {gren:false, reload:false, swap:false, keys:{}, mouse:{x:0, y:0, down:false, on:false}, L:null, R:null, bound:false};
function arInputReset(){ arIn.keys = {}; arIn.L = arIn.R = null; arIn.mouse.down = false; arIn.gren = arIn.reload = arIn.swap = false; document.querySelectorAll('#arena .stk').forEach(s => { s.style.display = 'none'; }); }
function arInputBind(){
  if (arIn.bound) return; arIn.bound = true;
  const R = 60;
  const stick = (z, name) => {
    const base = z.querySelector('.stk'), knob = z.querySelector('.knob');
    z.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return; try { z.setPointerCapture(e.pointerId); } catch(err){}
      arIn[name] = {id:e.pointerId, ox:e.clientX, oy:e.clientY, x:0, y:0};
      base.style.display = 'block'; base.style.left = (e.clientX - z.getBoundingClientRect().left - R) + 'px'; base.style.top = (e.clientY - R) + 'px'; knob.style.transform = 'translate(0,0)'; e.preventDefault();
    });
    z.addEventListener('pointermove', e => {
      const s = arIn[name]; if (!s || s.id !== e.pointerId) return;
      let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const m = Math.hypot(dx, dy); if (m > R){ dx = dx / m * R; dy = dy / m * R; }
      s.x = dx / R; s.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
    });
    const end = e => { const s = arIn[name]; if (s && s.id === e.pointerId){ arIn[name] = null; base.style.display = 'none'; } };
    z.addEventListener('pointerup', end); z.addEventListener('pointercancel', end);
  };
  stick($('arZL'), 'L'); stick($('arZR'), 'R');
  const a = $('arena');
  a.addEventListener('pointermove', e => { if (e.pointerType === 'mouse'){ arIn.mouse.x = e.clientX; arIn.mouse.y = e.clientY; arIn.mouse.on = true; } });
  a.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && !e.target.closest('button,input,#arMenu')){ arIn.mouse.x = e.clientX; arIn.mouse.y = e.clientY; arIn.mouse.on = true; arIn.mouse.down = true; } });
  window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') arIn.mouse.down = false; });
  a.addEventListener('contextmenu', e => e.preventDefault());
  const tap = (id, key) => $(id).addEventListener('pointerdown', e => { arIn[key] = true; e.preventDefault(); });
  tap('arGren', 'gren'); tap('arRel', 'reload'); tap('arSwap', 'swap');
  window.addEventListener('keydown', e => {
    if ($('arena').hidden || e.target.closest('input,textarea')) return;
    const k = e.key.toLowerCase(); arIn.keys[k] = true;
    if (!e.repeat){ if (k === 'g') arIn.gren = true; if (k === 'r') arIn.reload = true; if (k === 'q') arIn.swap = true; }
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { arIn.keys[e.key.toLowerCase()] = false; });
}
function arInputRead(me, cam, scale, dpr){
  const k = arIn.keys, o = {mx:0, jet:false, ax:0, ay:0, fire:false, gren:arIn.gren, reload:arIn.reload, swap:arIn.swap};
  let mx = 0; if (k.a || k.arrowleft) mx -= 1; if (k.d || k.arrowright) mx += 1;
  let jet = !!(k.w || k.arrowup || k[' ']);
  if (arIn.L){ if (Math.abs(arIn.L.x) > .2) mx = arIn.L.x; if (arIn.L.y < -.45) jet = true; }
  o.mx = mx; o.jet = jet;
  const R = arIn.R;
  if (R && Math.hypot(R.x, R.y) > .15){ o.ax = R.x; o.ay = R.y; if (Math.hypot(R.x, R.y) > .45) o.fire = true; }
  else if (arIn.mouse.on){
    const dx = arIn.mouse.x - (me.x - cam.x) * scale / dpr, dy = arIn.mouse.y - (me.y - cam.y) * scale / dpr, m = Math.hypot(dx, dy);
    if (m > 1){ o.ax = dx / m; o.ay = dy / m; } else { o.ax = Math.cos(me.aim); o.ay = Math.sin(me.aim); }
    if (arIn.mouse.down) o.fire = true;
  } else { o.ax = Math.cos(me.aim); o.ay = Math.sin(me.aim); }
  arIn.gren = arIn.reload = arIn.swap = false;
  return o;
}
