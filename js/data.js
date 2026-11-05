/* wave.radio · js/arena/data.js · Wave Arena: constants, weapons, upgrades, skins and maps. */
const AR = {G:1900, VIEW_H:540, HW:12, HH:21, RUN:250, JET:2700, JETV:-430, FALL:900, FUEL_USE:46, RESPAWN:3, LIMIT:15, TIME:300, SEND:1 / 12};
const WEAPONS = {
  pistol:{n:'Pistol', dmg:20, rate:.28, mag:12, res:Infinity, rel:1, spd:1100, spr:.03, pel:1, rng:950, kick:20, col:'#555555'},
  smg:{n:'SMG', dmg:9, rate:.075, mag:32, res:96, rel:1.5, spd:1200, spr:.07, pel:1, rng:800, kick:12, col:'#3a5a8a'},
  shotgun:{n:'Shotgun', dmg:11, rate:.8, mag:6, res:24, rel:2, spd:1000, spr:.2, pel:7, rng:420, kick:90, col:'#8a4a2a'},
  sniper:{n:'Sniper', dmg:75, rate:1.1, mag:5, res:15, rel:2.4, spd:2300, spr:.004, pel:1, rng:2000, kick:120, col:'#2a2a2a'}
};
const UPG = {
  hp:{n:'Armor', d:'+10 max health per level', cost:[60, 120, 240, 480, 900]},
  fuel:{n:'Jet tank', d:'+15% jetpack fuel per level', cost:[60, 120, 240, 480, 900]},
  dmg:{n:'Firepower', d:'+6% damage per level', cost:[80, 160, 320, 640, 1200]},
  rel:{n:'Quick hands', d:'6% faster reloads per level', cost:[50, 100, 200, 400, 800]}
};
const SKINS = [
  {id:'lime', n:'Lime', c:'#c8f54b', a:'#14131a', hat:'cap', cost:0},
  {id:'crimson', n:'Crimson', c:'#e5484d', a:'#7a1d20', hat:'helmet', cost:150},
  {id:'ocean', n:'Ocean', c:'#3b82f6', a:'#173a73', hat:'beanie', cost:150},
  {id:'sun', n:'Sunrise', c:'#ffb224', a:'#8a5300', hat:'band', cost:250},
  {id:'forest', n:'Forest', c:'#4c8c4a', a:'#244a22', hat:'helmet', cost:250},
  {id:'night', n:'Night', c:'#2d3748', a:'#c8f54b', hat:'visor', cost:350},
  {id:'rose', n:'Rose', c:'#ff7ab6', a:'#8a1f55', hat:'horns', cost:450},
  {id:'gold', n:'Gold', c:'#e8c547', a:'#7a5c00', hat:'crown', cost:700}
];
/* rects are [x, y, w, h]. spawns are [x, top of the platform]. pickups are [x, top of the platform, type]. */
const MAPS = [
  {id:'canyon', n:'Canyon', w:2400, h:1200, sky:'#8fd3ff', far:'#b9e3ff', solid:'#3d3a4a', edge:'#6b6880',
   rects:[[-60,-60,60,1320],[2400,-60,60,1320],[0,-60,2400,60],[0,1120,2400,100],
     [150,900,360,26],[700,760,300,26],[1140,900,300,26],[1500,760,300,26],[1890,900,360,26],[960,560,480,26],[260,600,300,26],[1840,600,300,26],[1120,330,160,26],
     [560,980,70,140],[1770,980,70,140],[1100,1020,200,100]],
   spawns:[[330,900],[850,760],[1290,900],[1650,760],[2070,900],[1200,560],[410,600],[1990,600],[120,1120],[2280,1120],[1200,330]],
   pickups:[[1200,560,'sniper'],[410,600,'shotgun'],[1990,600,'smg'],[850,760,'hp'],[1650,760,'hp'],[1290,900,'ammo'],[330,900,'ammo'],[2070,900,'smg'],[1200,1120,'hp'],[600,1120,'shotgun']]},
  {id:'skyline', n:'Skyline', w:2000, h:1400, sky:'#ffd9a8', far:'#ffe9cc', solid:'#2f3b3a', edge:'#5d7370',
   rects:[[-60,-60,60,1520],[2000,-60,60,1520],[0,-60,2000,60],[0,1320,2000,100],
     [100,1150,320,26],[600,1020,260,26],[1020,1150,320,26],[1500,1020,300,26],[300,860,300,26],[800,780,380,26],[1380,860,300,26],[100,640,260,26],[560,560,260,26],[1040,540,320,26],[1560,600,300,26],[400,360,300,26],[900,300,200,26],[1400,380,300,26],
     [900,1220,60,100],[1300,1220,60,100]],
   spawns:[[260,1150],[730,1020],[1180,1150],[1650,1020],[450,860],[990,780],[1530,860],[230,640],[690,560],[1200,540],[1710,600],[550,360],[1000,300],[1550,380],[500,1320],[1700,1320]],
   pickups:[[1000,300,'sniper'],[550,360,'shotgun'],[1550,380,'smg'],[990,780,'hp'],[1200,540,'ammo'],[230,640,'hp'],[1710,600,'ammo'],[260,1150,'smg'],[1650,1020,'hp'],[1000,1320,'shotgun']]}
];
