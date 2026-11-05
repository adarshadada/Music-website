/* wave.radio · js/arena/progress.js · Coins, upgrades and skins. Saved on the device and, when signed in, in Supabase (arena_progress). */
const ARP = {
  d:{coins:0, up:{hp:0, fuel:0, dmg:0, rel:0}, skin:'lime', own:['lime'], kills:0, deaths:0, wins:0, games:0, sfx:true},
  uid:null,
  load(){ try { const s = JSON.parse(localStorage.getItem('wr_arena') || 'null'); if (s) this.merge(s); } catch(e){} },
  merge(s){ this.d = Object.assign(this.d, s, {up:Object.assign({hp:0, fuel:0, dmg:0, rel:0}, s.up || {}), own:Array.from(new Set(['lime'].concat(s.own || [])))}); },
  save(){ try { localStorage.setItem('wr_arena', JSON.stringify(this.d)); } catch(e){} clearTimeout(this.t); this.t = setTimeout(() => this.push(), 1500); },
  async push(){ if (typeof sb === 'undefined' || !sb || !user || user.id === 'demo') return; try { await sb.from('arena_progress').upsert({user_id:user.id, data:this.d, updated_at:new Date().toISOString()}); } catch(e){} },
  async pull(){
    if (typeof sb === 'undefined' || !sb || !user || user.id === 'demo' || this.uid === user.id) return; this.uid = user.id;
    try { const r = await sb.from('arena_progress').select('data').maybeSingle(); if (r.data && r.data.data){ if ((r.data.data.games || 0) >= this.d.games) this.merge(r.data.data); else this.push(); try { localStorage.setItem('wr_arena', JSON.stringify(this.d)); } catch(e){} } else this.push(); } catch(e){}
  },
  cost(k){ const l = this.d.up[k]; return l >= UPG[k].cost.length ? null : UPG[k].cost[l]; },
  buyUp(k){ const c = this.cost(k); if (c === null || this.d.coins < c) return false; this.d.coins -= c; this.d.up[k]++; this.save(); return true; },
  buySkin(id){ const s = SKINS.find(x => x.id === id); if (!s || this.d.own.includes(id) || this.d.coins < s.cost) return false; this.d.coins -= s.cost; this.d.own.push(id); this.d.skin = id; this.save(); return true; },
  equip(id){ if (this.d.own.includes(id)){ this.d.skin = id; this.save(); } },
  add(n){ this.d.coins += n; this.save(); }
};
ARP.load();
function arenaSync(){ ARP.pull(); }
