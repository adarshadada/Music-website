/* wave.radio · js/arena/arena.js · Wave Arena: menus, game loop and match flow (solo and multiplayer). */
const Arena = (() => {
  const root = $('arena'), cv = $('arCv'), c2 = cv.getContext('2d'), menu = $('arMenu'), pauseBtn = $('arPause');
  let g = null, me = null, cam = {x:0, y:0}, raf = 0, last = 0, acc = 0, scale = 1, dpr = 1, mode = 'menu', paused = false, ui = false, sendT = 0, mid = '', tab = 'up', got = 0, ac = null;
  const solo = {map:'canyon', bots:3, diff:'normal'}, lobby = {map:'canyon', code:'', status:''};
  const name = () => user ? who(user) : 'Guest';
  const isHost = () => !!(Net.peers[0] && Net.peers[0].id === Net.id);
  const BOTS = ['Rook', 'Vex', 'Ash', 'Nova', 'Blitz', 'Echo'];
  const mpCode = () => Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random() * 24 | 0]).join('');

  function sfx(k){
    if (!ARP.d.sfx) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const s = {shot:[520, .05, 'square', .04], hurt:[160, .12, 'sawtooth', .06], boom:[70, .35, 'sawtooth', .1], pick:[880, .1, 'triangle', .05]}[k]; if (!s) return;
      const t = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain(); o.type = s[2]; o.frequency.setValueAtTime(s[0], t);
      if (k === 'boom' || k === 'shot') o.frequency.exponentialRampToValueAtTime(Math.max(30, s[0] * .4), t + s[1]);
      gn.gain.setValueAtTime(s[3], t); gn.gain.exponentialRampToValueAtTime(.0001, t + s[1]); o.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + s[1] + .02);
    } catch(e){}
  }
  function resize(){ dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); scale = Math.max(cv.height / AR.VIEW_H, cv.width / 1400); }
  function native(on){
    const C = window.Capacitor; if (!C || !C.Plugins) return;
    try { if (on) C.Plugins.ScreenOrientation.lock({orientation:'landscape'}); else C.Plugins.ScreenOrientation.unlock(); } catch(e){}
    try { if (on) C.Plugins.StatusBar.hide(); else C.Plugins.StatusBar.show(); } catch(e){}
  }
  async function open(){
    root.hidden = false; document.body.classList.add('arOpen'); resize(); arInputBind();
    try { if (root.requestFullscreen) await root.requestFullscreen(); } catch(e){}
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch(e){}
    native(true); showMain();
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){
    stopMatch(); root.hidden = true; document.body.classList.remove('arOpen'); if (raf){ cancelAnimationFrame(raf); raf = 0; }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e){}
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(e){}
    native(false); renderGames();
  }
  function stopMatch(){ Net.leave(); g = null; me = null; pauseBtn.hidden = true; paused = false; ui = false; arInputReset(); }

  /* ---- screens ---- */
  const prev = (cvs, id) => { const c = cvs.getContext('2d'); c.clearRect(0, 0, cvs.width, cvs.height); c.save(); c.translate(cvs.width / 2, cvs.height / 2 + 10); c.scale(cvs.width / 55, cvs.width / 55); arSoldier(c, 0, 0, {skin:id, face:1, aim:-.2, wk:'smg', ph:0}); c.restore(); };
  function showMain(){
    stopMatch(); mode = 'menu'; menu.hidden = false;
    menu.innerHTML = `<div class="arp"><div class="arhead"><h2>Wave Arena</h2><span class="arcoin">Coins ${ARP.d.coins}</span></div>
      <div class="arcols"><div class="arcol"><button class="arbig" data-a="solo">Play solo</button><button class="arbig" data-a="multi">Multiplayer</button><button class="arbig" data-a="shop">Upgrades and skins</button><button data-a="exit">Back to the app</button></div>
      <div class="arcol arcen"><canvas id="arPrev" width="150" height="170"></canvas><b>${esc(name())}</b><small>${ARP.d.kills} kills, ${ARP.d.wins} wins</small></div></div></div>`;
    prev($('arPrev'), ARP.d.skin);
  }
  function showSolo(){
    mode = 'solo';
    menu.innerHTML = `<div class="arp"><h2>Play solo</h2><p>Map</p><div class="arrow">${MAPS.map(m => `<button data-a="smap" data-v="${m.id}" class="${solo.map === m.id ? 'on' : ''}">${m.n}</button>`).join('')}</div>
      <p>Bots: ${solo.bots}</p><div class="arrow"><button data-a="bots" data-v="-1">Fewer</button><button data-a="bots" data-v="1">More</button></div>
      <p>Difficulty</p><div class="arrow">${['easy', 'normal', 'hard'].map(d => `<button data-a="diff" data-v="${d}" class="${solo.diff === d ? 'on' : ''}">${d}</button>`).join('')}</div>
      <div class="arrow"><button class="arbig" data-a="start">Start</button><button data-a="main">Back</button></div></div>`;
  }
  function showMulti(){
    mode = 'multi';
    menu.innerHTML = `<div class="arp"><h2>Multiplayer</h2>${Net.available()
      ? `<p>Up to 6 players. Create a room and share the code, or join a friend's room.</p><div class="arrow"><button class="arbig" data-a="create">Create room</button></div><p>Join with a code</p><div class="arrow"><input id="arCode" maxlength="4" placeholder="ABCD" autocomplete="off"><button data-a="join">Join</button></div>`
      : '<p>Multiplayer needs the online database or a game server. Solo still works.</p>'}<div class="arrow"><button data-a="main">Back</button></div></div>`;
  }
  function showLobby(){
    mode = 'lobby'; menu.hidden = false; const ps = Net.peers, host = isHost();
    menu.innerHTML = `<div class="arp"><h2>Room ${esc(lobby.code)}</h2><p>${esc(lobby.status)}</p><div class="arpl">${ps.map((p, i) => `<span>${esc(p.name)}${i === 0 ? ' (host)' : ''}</span>`).join('')}</div>
      ${host ? `<p>Map</p><div class="arrow">${MAPS.map(m => `<button data-a="lmap" data-v="${m.id}" class="${lobby.map === m.id ? 'on' : ''}">${m.n}</button>`).join('')}</div><div class="arrow"><button class="arbig" data-a="hstart">Start match</button></div>` : '<p>Waiting for the host to start...</p>'}
      <div class="arrow"><button data-a="leave">Leave room</button></div></div>`;
  }
  function showShop(){
    mode = 'shop'; const d = ARP.d;
    const ups = Object.keys(UPG).map(k => { const u = UPG[k], lv = d.up[k], cost = ARP.cost(k), max = u.cost.length;
      return `<div class="arit"><div><b>${u.n}</b><small>${u.d}</small><i class="pips">${Array.from({length:max}, (_, n) => `<s class="${n < lv ? 'on' : ''}"></s>`).join('')}</i></div>${cost === null ? '<span>Max</span>' : `<button data-a="buyup" data-v="${k}" ${d.coins < cost ? 'disabled' : ''}>${cost} coins</button>`}</div>`; }).join('');
    const skins = SKINS.map(s => { const own = d.own.includes(s.id);
      return `<div class="arsk"><canvas width="70" height="80" data-skin="${s.id}"></canvas><b>${s.n}</b>${own ? (d.skin === s.id ? '<span>Equipped</span>' : `<button data-a="equip" data-v="${s.id}">Equip</button>`) : `<button data-a="buyskin" data-v="${s.id}" ${d.coins < s.cost ? 'disabled' : ''}>${s.cost} coins</button>`}</div>`; }).join('');
    menu.innerHTML = `<div class="arp"><div class="arhead"><h2>Upgrades and skins</h2><span class="arcoin">Coins ${d.coins}</span></div>
      <div class="arrow"><button data-a="tab" data-v="up" class="${tab === 'up' ? 'on' : ''}">Upgrades</button><button data-a="tab" data-v="sk" class="${tab === 'sk' ? 'on' : ''}">Skins</button></div>
      ${tab === 'up' ? `<div class="arlist">${ups}</div>` : `<div class="arskins">${skins}</div>`}<div class="arrow"><button data-a="main">Back</button></div></div>`;
    menu.querySelectorAll('canvas[data-skin]').forEach(x => prev(x, x.dataset.skin));
  }
  function showPause(){
    if (mode !== 'play') return; ui = true; paused = !!(g && g.cfg.solo); menu.hidden = false;
    menu.innerHTML = `<div class="arp"><h2>Paused</h2><div class="arcol"><button class="arbig" data-a="resume">Resume</button><button data-a="sfx">Sound: ${ARP.d.sfx ? 'on' : 'off'}</button><button data-a="leave">Leave match</button></div></div>`;
  }

  /* ---- matches ---- */
  function begin(){
    mode = 'play'; paused = false; ui = false; menu.hidden = true; pauseBtn.hidden = false; arInputReset(); acc = 0; sendT = 0;
    g.me = me; g.sfx = sfx; cam.x = me.x - 500; cam.y = me.y - 300;
  }
  function startSolo(){
    g = arNew({map:solo.map, limit:AR.LIMIT, time:AR.TIME, diff:solo.diff, solo:true});
    me = arAdd(g, {id:'me', name:name(), skin:ARP.d.skin, up:ARP.d.up});
    const bu = solo.diff === 'hard' ? {hp:3, fuel:2, dmg:2} : solo.diff === 'normal' ? {hp:1, dmg:1} : {};
    for (let i = 0; i < solo.bots; i++) arAdd(g, {id:'b' + i, name:BOTS[i], bot:true, skin:SKINS[(i + 1) % SKINS.length].id, up:bu});
    begin();
  }
  function netHooks(){
    g.hooks.shot = (a, x, y, ang, w) => { if (a === me) Net.send('sh', {x:arR1(x), y:arR1(y), a:+ang.toFixed(3), w}); };
    g.hooks.gren = q => { if (q.o === me.id) Net.send('gr', {x:arR1(q.x), y:arR1(q.y), vx:arR1(q.vx), vy:arR1(q.vy), t:q.t}); };
    g.hooks.hit = (t, d, by, w) => Net.send('hit', {to:t.id, d:arR1(d), w});
    g.hooks.die = (a, by, w) => { if (a === me) Net.send('kill', {v:me.id, k:by, w}); };
    g.hooks.pick = i => Net.send('pk', {i});
  }
  function beginNet(p){
    mid = p.mid; g = arNew({map:p.map, limit:p.limit, time:p.time, solo:false, mid:p.mid});
    me = arAdd(g, {id:Net.id, name:name(), skin:ARP.d.skin, up:ARP.d.up});
    for (const q of Net.peers) if (q.id !== Net.id) arAdd(g, {id:q.id, name:q.name, remote:true});
    netHooks(); begin();
  }
  function joinRoom(code){
    lobby.code = code; lobby.status = 'Connecting...'; mode = 'lobby';
    Net.join(code, name(), {
      status:s => { lobby.status = s; if (mode === 'lobby') showLobby(); },
      peers:() => { if (mode === 'lobby') showLobby(); else if (mode === 'play' && g && !g.cfg.solo && isHost()) Net.send('start', {mid, map:g.cfg.map, limit:g.cfg.limit, time:Math.max(15, Math.round(g.cfg.time - g.t))}); },
      msg:(e, p, from) => {
        if (e === 'start'){ if ((mode === 'lobby' || mode === 'over') && p && p.mid !== mid) beginNet(p); return; }
        if (g && me && (mode === 'play' || mode === 'over')) arNetMsg(g, me, e, p, from);
      }
    });
    showLobby();
  }
  function endMatch(){
    if (mode === 'over') return; mode = 'over'; pauseBtn.hidden = true;
    const rank = g.actors.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths), win = rank[0] === me && me.kills > 0;
    got = me.kills * 10 + (win ? 50 : 0) + 5; ARP.d.kills += me.kills; ARP.d.deaths += me.deaths; ARP.d.games++; if (win) ARP.d.wins++; ARP.add(got);
    menu.hidden = false;
    menu.innerHTML = `<div class="arp"><h2>${win ? 'Victory' : 'Match over'}</h2><table class="artab"><tr><th></th><th>Player</th><th>Kills</th><th>Deaths</th></tr>${rank.map((a, i) => `<tr class="${a === me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(a.name)}</td><td>${a.kills}</td><td>${a.deaths}</td></tr>`).join('')}</table>
      <p>You earned ${got} coins.</p><div class="arrow"><button class="arbig" data-a="again">${g.cfg.solo ? 'Play again' : 'Back to lobby'}</button><button data-a="menu">Menu</button></div></div>`;
  }

  /* ---- loop ---- */
  function tick(dt){
    if (!g || mode !== 'play' || paused) return;
    acc += dt; let n = 0;
    while (acc >= 1 / 60 && n++ < 5){
      acc -= 1 / 60;
      me.in = me.alive && !ui ? arInputRead(me, cam, scale, dpr) : {mx:0, jet:false, ax:Math.cos(me.aim), ay:Math.sin(me.aim), fire:false, gren:false, reload:false, swap:false};
      arStep(g, 1 / 60);
      if (!g.cfg.solo){ sendT += 1 / 60; if (sendT >= AR.SEND){ sendT = 0; Net.send('st', arNetPacket(me)); } }
      if (g.over){ endMatch(); break; }
    }
    if (acc > .2) acc = 0;
  }
  function draw(){
    if (!g || !me){ c2.setTransform(1, 0, 0, 1, 0, 0); c2.fillStyle = '#16161c'; c2.fillRect(0, 0, cv.width, cv.height); return; }
    const vw = cv.width / scale, vh = cv.height / scale, m = g.map;
    cam.x += (me.x - vw / 2 - cam.x) * .12; cam.y += (me.y - vh / 2 - cam.y) * .12;
    cam.x = m.w <= vw ? (m.w - vw) / 2 : Math.max(0, Math.min(m.w - vw, cam.x)); cam.y = m.h <= vh ? (m.h - vh) / 2 : Math.max(0, Math.min(m.h - vh, cam.y));
    arDraw(c2, g, cam, vw, vh, scale); arHud(c2, cv.width, cv.height, g, me);
  }
  function frame(ts){ raf = requestAnimationFrame(frame); const dt = Math.min(.05, (ts - last) / 1000); last = ts; tick(dt); draw(); }

  function act(a, d = {}){
    switch (a){
      case 'exit': close(); break;
      case 'main': case 'menu': showMain(); break;
      case 'solo': showSolo(); break;
      case 'smap': solo.map = d.v; showSolo(); break;
      case 'bots': solo.bots = Math.max(1, Math.min(5, solo.bots + (+d.v))); showSolo(); break;
      case 'diff': solo.diff = d.v; showSolo(); break;
      case 'start': startSolo(); break;
      case 'multi': showMulti(); break;
      case 'create': joinRoom(mpCode()); break;
      case 'join': { const c = (($('arCode') || {}).value || '').trim().toUpperCase(); if (c.length === 4) joinRoom(c); break; }
      case 'lmap': lobby.map = d.v; showLobby(); break;
      case 'hstart': { const p = {mid:Math.random().toString(36).slice(2, 8), map:lobby.map, limit:AR.LIMIT, time:AR.TIME}; Net.send('start', p); beginNet(p); break; }
      case 'shop': tab = 'up'; showShop(); break;
      case 'tab': tab = d.v; showShop(); break;
      case 'buyup': if (!ARP.buyUp(d.v)) toast('Not enough coins.'); showShop(); break;
      case 'buyskin': if (!ARP.buySkin(d.v)) toast('Not enough coins.'); showShop(); break;
      case 'equip': ARP.equip(d.v); showShop(); break;
      case 'resume': menu.hidden = true; paused = false; ui = false; break;
      case 'sfx': ARP.d.sfx = !ARP.d.sfx; ARP.save(); showPause(); break;
      case 'leave': showMain(); break;
      case 'again': if (g && g.cfg.solo) startSolo(); else showLobby(); break;
    }
  }
  menu.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.dataset.a, b.dataset); });
  pauseBtn.addEventListener('click', showPause);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.hidden && mode === 'play') showPause(); });
  window.addEventListener('resize', () => { if (!root.hidden) resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && g && g.cfg.solo && !ui) showPause(); });
  return {open, close, act, tick, draw};
})();
