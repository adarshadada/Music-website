/* wave.radio · js/arena/netcode.js · Multiplayer transport and message handling.
   Uses your own game server when ARENA_SERVER_URL is set in js/config.js, otherwise Supabase Realtime.
   Each player simulates their own character; shots, hits and kills are sent as small events. */
const Net = {
  id:Math.random().toString(36).slice(2, 9), peers:[], ws:null, ch:null,
  available(){ return !!(ARENA_SERVER_URL || (typeof sb !== 'undefined' && sb)); },
  join(room, name, h){
    this.leave();
    if (ARENA_SERVER_URL){
      const ws = this.ws = new WebSocket(ARENA_SERVER_URL.replace(/\/+$/, '') + '/?room=' + encodeURIComponent(room) + '&id=' + this.id + '&name=' + encodeURIComponent(name));
      h.status('Connecting to the game server. It can take up to a minute to wake up...');
      ws.onopen = () => h.status('Connected.');
      ws.onclose = () => { if (this.ws === ws) h.status('Disconnected from the server.'); };
      ws.onerror = () => h.status('Could not reach the game server.');
      ws.onmessage = ev => {
        let m; try { m = JSON.parse(ev.data); } catch(e){ return; }
        if (m.t === 'peers'){ this.peers = m.list; h.peers(); } else if (m.t === 'full') h.status('That room is full.'); else if (m.t === 'm') h.msg(m.e, m.p, m.f);
      };
    } else {
      const ch = this.ch = sb.channel('arena:' + room, {config:{presence:{key:this.id}, broadcast:{self:false}}});
      ch.on('presence', {event:'sync'}, () => { this.peers = Object.entries(ch.presenceState()).map(([k, v]) => ({id:k, name:v[0].name, t:v[0].t})).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1)).slice(0, 6); h.peers(); });
      ch.on('broadcast', {event:'m'}, ({payload:x}) => h.msg(x.e, x.p, x.f));
      ch.subscribe(async s => { if (s === 'SUBSCRIBED'){ h.status('Connected.'); await ch.track({name, t:Date.now()}); } });
    }
  },
  send(e, p){
    if (this.ws){ if (this.ws.readyState === 1) this.ws.send(JSON.stringify({t:'m', e, p})); }
    else if (this.ch) this.ch.send({type:'broadcast', event:'m', payload:{e, p, f:this.id}});
  },
  leave(){
    if (this.ws){ const w = this.ws; this.ws = null; try { w.close(); } catch(e){} }
    if (this.ch){ try { sb.removeChannel(this.ch); } catch(e){} this.ch = null; }
    this.peers = [];
  }
};
const arR1 = x => Math.round(x);
const arNetPacket = a => ({x:arR1(a.x), y:arR1(a.y), vx:arR1(a.vx), vy:arR1(a.vy), a:+a.aim.toFixed(2), al:a.alive ? 1 : 0, hp:arR1(a.hp), mh:a.maxHp, j:a.jet ? 1 : 0, w:a.wk, n:a.name, sk:a.skin});
function arNetMsg(g, me, e, p, from){
  if (!g || !p || from === me.id) return;
  let a = g.byId[from];
  if (e === 'st'){
    if (!a) a = arAdd(g, {id:from, name:p.n || 'Player', remote:true, skin:p.sk});
    a.name = String(p.n || a.name).slice(0, 24); a.skin = p.sk || a.skin; a.tx = +p.x || 0; a.ty = +p.y || 0; a.vx = +p.vx || 0; a.vy = +p.vy || 0; a.ta = +p.a || 0;
    a.hp = +p.hp || 0; a.maxHp = +p.mh || 100; a.jet = !!p.j; a.wk = WEAPONS[p.w] ? p.w : 'pistol';
    const alive = !!p.al;
    if (!a.seen || (alive && !a.alive)){ a.x = a.tx; a.y = a.ty; a.aim = a.ta; a.seen = true; if (alive) g.parts.push({x:a.x, y:a.y, life:.5, max:.5, r:50, c:'#ffffff', ty:'r'}); }
    a.alive = alive;
  } else if (e === 'sh' && a && WEAPONS[p.w]){ arSpawnBullets(g, from, +p.x, +p.y, +p.a, p.w, 0, false); g.parts.push({x:+p.x, y:+p.y, vx:0, vy:0, life:.06, max:.06, r:7, c:'#ffe27a', ty:'f'}); }
  else if (e === 'gr' && a){ g.gren.push({x:+p.x, y:+p.y, vx:+p.vx, vy:+p.vy, t:+p.t || 2, o:from, mine:false}); }
  else if (e === 'hit' && p.to === me.id){ arDamage(g, me, Math.min(120, +p.d || 0), from, p.w); }
  else if (e === 'kill'){
    const v = g.byId[p.v], k = g.byId[p.k]; if (!v || v === me) return;
    v.alive = false; v.deaths++; arBlood(g, v.x, v.y, 22, '#c1121f');
    if (k && k !== v) k.kills++;
    g.feed.unshift({t:g.t, k:k && k !== v ? k.name : '', v:v.name, w:p.w});
    if (k && k !== v && k.kills >= g.cfg.limit) g.over = true;
  } else if (e === 'pk' && g.pk[p.i]) g.pk[p.i].cd = 20;
}
