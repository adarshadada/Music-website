/* wave.radio · js/games.js · The Games tab. Wave Arena is a fullscreen landscape shooter (see js/arena/). */
const GAMES = [
  {id:'arena', n:'Wave Arena', d:'A jetpack shooter for landscape. Play bots or friends, earn coins, buy upgrades and skins.', i:'arena', c:'#4fe3c6', mp:true, run:() => Arena.open()}
];
const gameCard = g => `<button class="gcard" data-game="${g.id}" style="background:${g.c};color:${onc(g.c)}"><span class="gi"><img src="assets/icons/games/${g.i}.svg" alt="" width="40" height="40"></span><b>${g.n}</b><em class="gk">Solo and multiplayer</em><small>${g.d}</small><i>${typeof ARP !== 'undefined' ? 'Coins: ' + ARP.d.coins : ''}</i></button>`;
function renderGames(){ $('gg').innerHTML = GAMES.map(gameCard).join(''); if ($('hGames')) $('hGames').innerHTML = GAMES.map(gameCard).join(''); }
function openGame(id){ const g = GAMES.find(x => x.id === id); if (g) g.run(); }
