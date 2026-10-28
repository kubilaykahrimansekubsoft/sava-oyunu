
(async () => {
'use strict';
// let the studio splash play smoothly first; the heavy start-up work begins once it has faded
if (window.__splashDone) await window.__splashDone;
const $ = id => document.getElementById(id);
// ---- loading screen: the start-up work is split into steps so the bar can move between them
const LOADER = (() => {
  const o = $('loadO'), fill = $('ldFill'), step = $('ldStep'), pct = $('ldPct'), tip = $('ldTip');
  let shown = 0, tipI = 0;
  // tips speak the language of the device: keyboard keys on a computer, on-screen buttons on a phone or tablet
  const TOUCH_TIPS = (() => { let t = false; try { t = matchMedia('(pointer: coarse)').matches && matchMedia('(hover: none)').matches; const v = localStorage.getItem('cephe-touch'); if (v !== null) t = v === '1'; } catch(e){} return t; })();
  const TIPS = TOUCH_TIPS ? ['Koşarken KAY düğmesine basarak kayıp kaçabilirsin.', 'BOMBA ile el bombası at, SAĞLIK ile ilk yardım çantasıyla can doldur.', 'ATEŞ düğmesini basılı tutup sürükleyerek ateş ederken nişan alabilirsin.', 'Uzun seri atınca silah tırmanır; ATEŞ düğmesine kısa kısa bas.', 'Mermin azaldıysa mühimmat kutusu ya da düşen kese ara.', 'Cephe haritasında bölgeleri tutan takım puan kazanır.', 'Oda kodunu arkadaşına gönder, aynı odada savaşın.', 'Sol üstteki duraklat düğmesi oda, silah ve ayar menüsünü açar.',
    'Dürbünlü silahlarda NİŞAN düğmesine dokunarak nişan al.', 'Gece haritasında fener düğmesiyle fenerini aç.', 'Sağ üstteki silah kartında ‹ › oklarına dokunarak silah değiştir.', 'KOŞ düğmesine dokunursan çubuğu ileri itmen yeterli, sürekli koşarsın.', 'Ayarlar › Kontroller’den nişan yardımını ve otomatik ateşi açıp kapatabilirsin.', 'Düğmelerin yerini ve boyunu Ayarlar › Tuş düzeni’nden değiştirebilirsin.']
  : ['Koşarken C tuşuyla kayarak kaçabilirsin.', 'G ile el bombası at, H ile ilk yardım çantasıyla can doldur.', 'Uzun seri atınca silah tırmanır; kısa seriler daha isabetlidir.', 'Mermin azaldıysa mühimmat kutusu ya da düşen kese ara.', 'Cephe haritasında bölgeleri tutan takım puan kazanır.', 'Oda kodunu arkadaşına gönder, aynı odada savaşın.', 'B tuşu oyun sırasında oda, silah ve bot menüsünü açar.',
    'Dürbünlü silahlarda sağ tık ya da Z ile nişan al.', 'Gece haritasında F ile fenerini aç.', '1, 2 ve 3 tuşlarıyla silahların arasında geçiş yap.', 'Takım değiştirmek için T tuşuna bas.'];
  const tipT = setInterval(() => { if (tip){ tipI = (tipI + 1) % TIPS.length; tip.textContent = 'İpucu: ' + TIPS[tipI]; } }, 2600);
  if (tip) tip.textContent = 'İpucu: ' + TIPS[0];
  // the real start-up is fast on good machines; the bar is paced so the screen (and the soldier crossing it) has time to read
  const QUICK = document.documentElement.classList.contains('quickload');
  try { sessionStorage.removeItem('cephe-quick'); } catch(e){}
  const MIN_MS = QUICK ? 0 : 7200, RUN_AT = 40;
  let target = 0, finishing = false, last = performance.now(), gone = false;
  const t0 = performance.now();
  const paint = () => {
    if (fill) fill.style.transform = `scaleX(${shown / 100})`;
    if (o){ o.style.setProperty('--p', shown.toFixed(2)); o.setAttribute('aria-valuenow', Math.round(shown)); o.classList.toggle('run', shown >= RUN_AT);
      o.querySelectorAll('.ldWps li').forEach((li, i) => li.classList.toggle('on', shown >= i * 25 - .01)); }
    if (pct) pct.textContent = Math.round(shown) + '%';
  };
  const finish = () => { if (gone || !o) return; gone = true; clearInterval(tipT); o.classList.add('out'); setTimeout(() => o.remove(), 800); };
  const tick = now => {
    if (gone) return;
    const dt = Math.min(.25, (now - last) / 1000); last = now;
    const cap = Math.min(100, (now - t0) / MIN_MS * 100), goal = Math.min(target, cap);
    if (shown < goal) shown = Math.min(goal, shown + dt * Math.max(9, (goal - shown) * 2.5));
    paint();
    if (finishing && shown >= 99.95) finish(); else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    set(p, txt){ target = Math.max(target, Math.min(100, p)); if (txt && step) step.textContent = txt; },
    fail(msg){ if (step) step.textContent = msg; if (o) o.classList.add('err'); clearInterval(tipT); },
    done(){
      target = 100; finishing = true;
      if (document.hidden){ shown = 100; paint(); finish(); }                // no animation frames in a background tab
      setTimeout(() => { shown = 100; paint(); finish(); }, MIN_MS + 4000);   // safety net
    },
  };
})();
// let the browser paint the bar between steps (falls back to a timer when the tab is in the background)
const loadStep = (p, txt) => new Promise(r => { LOADER.set(p, txt); let ok = false; const go = () => { if (!ok){ ok = true; r(); } }; requestAnimationFrame(() => setTimeout(go, 0)); setTimeout(go, 60); });
await loadStep(2, 'Başlatılıyor');
const MOBILE = (() => { try { return matchMedia('(pointer: coarse)').matches && matchMedia('(hover: none)').matches; } catch(e){ return false; } })();
let touchOn = MOBILE;
try { const t = localStorage.getItem('cephe-touch'); if (t !== null) touchOn = t === '1'; } catch(e){}
const TQ = n => MOBILE ? n / 2 : n;
const stage = $('stage');
if (!window.THREE){ $('menu').querySelector('p').textContent = '3D motoru yüklenemedi. Sayfayı yenileyip tekrar dene.'; LOADER.fail('3D motoru yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.'); return; }
const V = THREE.Vector3;

// ================= Settings =================
const TEAM_HUE = [212, 6], TEAM_NAME = ['Mavi Tim', 'Kızıl Tim'], TEAM_CLS = ['b', 'r'];
const WEAPONS = [
  {name:'Tabanca',         short:'TBN', dmg:24,  hs:2,   rate:260,  mag:12, reload:1100, spread:.012, pellets:1, auto:false, kick:.018, move:1.05, adsFov:62, sfx:[2400,.12,.35], casing:1},
  {name:'Ağır Tabanca',    short:'KRT', dmg:48,  hs:2,   rate:480,  mag:7,  reload:1500, spread:.016, pellets:1, auto:false, kick:.05,  move:1,    adsFov:60, sfx:[1500,.22,.55], casing:1.3},
  {name:'Hafif Makineli',  short:'HMK', dmg:11,  hs:1.6, rate:70,   mag:32, reload:1600, spread:.03,  pellets:1, auto:true,  kick:.008, move:1.1,  adsFov:58, sfx:[2700,.07,.22], casing:.9,  bot:{burst:[4,7], gap:.8,  min:3,  max:10}},
  {name:'Piyade Tüfeği',   short:'PYD', dmg:15,  hs:1.8, rate:100,  mag:30, reload:1900, spread:.022, pellets:1, auto:true,  kick:.010, move:1,    adsFov:52, sfx:[1900,.09,.28], casing:1,   bot:{burst:[3,5], gap:1,   min:6,  max:16}},
  {name:'Muharebe Tüfeği', short:'MHR', dmg:38,  hs:2,   rate:300,  mag:15, reload:2200, spread:.006, pellets:1, auto:false, kick:.03,  move:.95,  adsFov:38, sfx:[1500,.18,.45], casing:1.2, optic:true, bot:{burst:[1,2], gap:1.1, min:10, max:24}},
  {name:'Pompalı',         short:'PMP', dmg:11,  hs:1.5, rate:850,  mag:6,  reload:2300, spread:.075, pellets:9, auto:false, kick:.055, move:1,    adsFov:62, sfx:[1100,.32,.6],  shell:true, falloff:true, bot:{burst:[1,1], gap:1.1, min:2, max:7}},
  {name:'Ağır Makineli',   short:'AĞM', dmg:17,  hs:1.6, rate:115,  mag:80, reload:3600, spread:.035, pellets:1, auto:true,  kick:.013, move:.82,  adsFov:55, sfx:[1600,.11,.33], casing:1.1, bot:{burst:[5,9], gap:1.1, min:8,  max:18}},
  {name:'Keskin Nişancı',  short:'KNS', dmg:90,  hs:2,   rate:1300, mag:5,  reload:2600, spread:0,    pellets:1, auto:false, kick:.07,  move:.9,   adsFov:20, sfx:[850,.5,.75],   casing:1.4, scope:true, bot:{burst:[1,1], gap:1.6, min:14, max:34}},
  {name:'Roketatar',       short:'RKT', dmg:130, hs:1,   rate:900,  mag:1,  reload:2800, spread:.004, pellets:1, auto:false, kick:.09,  move:.85,  adsFov:55, sfx:[600,.6,.55],   explosive:4.5, rocketSpeed:55},
];
const NW = WEAPONS.length;
// ---- handling: how each gun kicks and how accurate it is (angles in radians)
//  rv  climb per shot      rh  sideways drift of the recoil pattern      rr  random sideways jitter
//  rec share of the climb that settles back once the trigger is released
//  bloom / bmax / bdec  spread added per shot, its cap and how fast it fades per second
//  hip / ads  multipliers on the base spread      move  extra spread at full running speed
//  res  spare rounds carried on top of the loaded magazine
const HANDLING = [
  {rv:.020, rh:.004, rr:.007, rec:.8,  bloom:.008,  bmax:.030, bdec:.10, hip:1.25, ads:.45, move:.022, res:36},
  {rv:.052, rh:.008, rr:.013, rec:.7,  bloom:.020,  bmax:.050, bdec:.09, hip:1.25, ads:.40, move:.028, res:21},
  {rv:.009, rh:.006, rr:.007, rec:.55, bloom:.004,  bmax:.035, bdec:.13, hip:1.10, ads:.50, move:.012, res:96},
  {rv:.012, rh:.007, rr:.006, rec:.5,  bloom:.0045, bmax:.040, bdec:.10, hip:1.35, ads:.30, move:.030, res:90},
  {rv:.030, rh:.006, rr:.010, rec:.65, bloom:.012,  bmax:.045, bdec:.10, hip:4.50, ads:.60, move:.035, res:45},
  {rv:.060, rh:.010, rr:.015, rec:.7,  bloom:0,     bmax:0,    bdec:.10, hip:1.15, ads:.75, move:.015, res:18},
  {rv:.014, rh:.010, rr:.009, rec:.45, bloom:.005,  bmax:.055, bdec:.07, hip:1.30, ads:.45, move:.045, res:160},
  {rv:.080, rh:.010, rr:.020, rec:.6,  bloom:0,     bmax:0,    bdec:.10, hip:1,    ads:1,   move:.060, res:15},
  {rv:.090, rh:.010, rr:.020, rec:.4,  bloom:0,     bmax:0,    bdec:.10, hip:1.50, ads:.60, move:.020, res:2},
];
const BOT_WEAPONS = [2,3,3,4,5,6,7];
const BOT_DIFF = [
  {spread:.075, react:750, gap:1300, dmgMul:.5},
  {spread:.045, react:450, gap:900,  dmgMul:.62},
  {spread:.025, react:250, gap:600,  dmgMul:.75},
];
const EYE = 1.6, RADIUS = .4, GRAV = 15, JUMP = 5.8, MAX_BOTS = 8;
const PEER_PREFIX = 'cephehatti-v2-';

// ================= Map =================
let A = 26;                      // half-size of the current arena: 26 for the classic maps, larger for the front-line map
const A0 = 26, BOXES = [];       // A0: the size every decoration was laid out for (it is remapped when A changes)
const box = (x,z,w,d,h,c) => BOXES.push({x,z,w,d,h,c});
const sym4 = (x,z,w,d,h,c) => { box(x,z,w,d,h,c); box(-x,z,w,d,h,c); box(x,-z,w,d,h,c); box(-x,-z,w,d,h,c); };
const sym2 = (x,z,w,d,h,c) => { box(x,z,w,d,h,c); box(-x,-z,w,d,h,c); };   // point-mirrored: both teams get the same layout
box(0,-A,A*2+1,1,4,'wall'); box(0,A,A*2+1,1,4,'wall'); box(-A,0,1,A*2+1,4,'wall'); box(A,0,1,A*2+1,4,'wall');
const WALLS_N = BOXES.length;
// a house with walls on four sides, a doorway towards the centre and a smaller gap at the back (so nobody gets cornered)
const house = (x, z, w, d, door) => {
  const t = .35, h = 2.9, gap = 2.1, back = 1.5;
  const sides = {zneg:[x, z - d/2, w, true], zpos:[x, z + d/2, w, true], xneg:[x - w/2, z, d, false], xpos:[x + w/2, z, d, false]};
  const opp = {zneg:'zpos', zpos:'zneg', xneg:'xpos', xpos:'xneg'};
  for (const [k, [cx, cz, len, alongX]] of Object.entries(sides)){
    const g = k === door ? gap : k === opp[door] ? back : 0, off = k === opp[door] ? len * .22 : 0;
    if (!g){ box(cx, cz, alongX ? len + t : t, alongX ? t : len + t, h, 'wall'); continue; }
    const a = (len - g) / 2 + off, b2 = (len - g) / 2 - off;            // two pieces either side of the opening
    if (a > .2){ const c = -len/2 + a/2; box(alongX ? cx + c : cx, alongX ? cz : cz + c, alongX ? a : t, alongX ? t : a, h, 'wall'); }
    if (b2 > .2){ const c = len/2 - b2/2; box(alongX ? cx + c : cx, alongX ? cz : cz + c, alongX ? b2 : t, alongX ? t : b2, h, 'wall'); }
  }
};
const flipDoor = {zneg:'zpos', zpos:'zneg', xneg:'xpos', xpos:'xneg'};
const house2 = (x, z, w, d, door) => { house(x, z, w, d, door); house(-x, -z, w, d, flipDoor[door]); };
const MAPS = [
  {name:'Üs', desc:'Merkezde beton blok, siper duvarları ve sandıklar', build(){
    box(0,0,5,5,2.6,'concrete');
    sym4(6,6,1.2,1.2,4,'pillar');
    sym4(10,10,1.4,1.4,1,'crate'); sym4(11.5,10.2,1.4,1.4,1,'crate'); sym4(10.3,11.6,1.4,1.4,1,'crate');
    sym4(16,5,.8,7,2.2,'cover'); sym4(5,16,7,.8,2.2,'cover');
    sym4(20,20,1.4,1.4,1,'crate'); sym4(18.5,13,3,3,2.4,'concrete');
    sym4(13,21,4,1,1,'sandbag'); sym4(21,13.5,1,4,1,'sandbag');
    box(13,0,1.4,1.4,1,'crate'); box(-13,0,1.4,1.4,1,'crate'); box(0,13,1.4,1.4,1,'crate'); box(0,-13,1.4,1.4,1,'crate');
    box(9,0,1,3,1.6,'sandbag'); box(-9,0,1,3,1.6,'sandbag'); box(0,9,3,1,1.6,'sandbag'); box(0,-9,3,1,1.6,'sandbag');
  }},
  {name:'Liman', desc:'Konteyner koridorları ve vinç ayakları', build(){
    box(0,0,2.6,5,2.6,'cover');
    sym4(7,3,6.4,2.6,2.6,'cover'); sym4(14,9.5,2.6,6.4,2.6,'cover'); sym4(5.5,11,6.4,2.6,2.6,'cover'); sym4(20.5,3.5,2.6,5.4,2.6,'cover');
    sym4(10.5,7,1.4,1.4,1,'crate'); sym4(1.6,6.2,1.4,1.4,1,'crate'); sym4(18,15,1.4,1.4,1,'crate'); sym4(19.4,15.2,1.4,1.4,1,'crate');
    sym4(10,16,4,1,1,'sandbag'); sym4(21.5,19,1.2,1.2,4,'pillar');
    box(0,13.5,4,1,1,'sandbag'); box(0,-13.5,4,1,1,'sandbag');
  }},
  {name:'Köy', desc:'Kapısı ortaya bakan evler, kuyu ve alçak duvarlar', build(){
    house2(-13,10,7,5.6,'zneg'); house2(12.5,11,6,6,'xneg'); house2(-2,9.5,5,4.4,'zneg');
    box(0,0,1.8,1.8,1.1,'concrete'); sym4(6,2.5,3.5,.5,1.1,'concrete');
    sym4(8,6,1.4,1.4,1,'crate'); sym2(18,4,1.4,1.4,1,'crate'); sym2(-18,5,1.4,1.4,1,'crate');
    sym2(20,15,1,4,1,'sandbag'); sym2(-20,15.5,1,4,1,'sandbag'); sym4(17,20,1,1,3.5,'pillar');
  }},
  {name:'Harabe', desc:'Yıkık sütunlar, kırık duvarlar ve kum torbası yuvaları', build(){
    box(0,0,6,1.2,1.4,'concrete'); box(0,0,1.2,6,1.4,'concrete');
    sym4(4.5,4.5,1.2,1.2,4.5,'pillar'); sym4(9,4.5,1.2,1.2,3.2,'pillar'); sym4(4.5,9,1.2,1.2,3.6,'pillar');
    sym4(13,3,.8,5,1.3,'concrete'); sym4(7.5,13,5,.8,1.6,'wall'); sym4(17,10,3,3,2.6,'concrete');
    sym4(11,8.5,1.4,1.4,1,'crate'); sym4(20,15,4,1,1,'sandbag'); sym4(21,5,1,3,1,'sandbag');
    box(0,16,3,1,1.2,'sandbag'); box(0,-16,3,1,1.2,'sandbag'); sym4(15.5,17.5,1.2,1.2,4,'pillar');
  }},
  // medium-size map for the zone-control mode: three fronts, trenches between the bases, a farmhouse at A and C
  {name:'Cephe', size:40, mode:'dom', desc:'Orta boy cephe hattı · 3 bölgeyi ele geçir ve tut',
   zones:[[-22, 15, 6.5], [0, 0, 7], [22, -15, 6.5]],
   spawns:[[-16,36],[-8,36.5],[0,36],[8,36.5],[16,36],[-26,35],[26,35],[-5,33],[5,33]],
   ammo:[[-34,1],[34,-1],[0,19],[0,-19],[-14,-8],[14,8]],
   build(){
    // B - the centre: a bunker under camo net, sandbag arcs and two pillars
    box(0,0,5,3.6,2.6,'concrete');
    sym2(7.2,1.2,1,4.4,1.1,'sandbag'); sym2(-1.5,6.6,5,1,1.1,'sandbag'); sym2(-5.5,5.5,1.2,1.2,3.6,'pillar'); sym2(-6.6,-1.8,1.4,1.4,1,'crate');
    // trench lines between the bases and the centre
    sym2(-7,12.5,8,1,1.2,'sandbag'); sym2(10,11.5,6,1,1.2,'sandbag'); sym2(20,6,1,5,1.2,'sandbag');
    // A (blue side, west) and C (red side, east): a farmhouse with a walled yard
    house2(-25.5,18.5,7,6,'xpos');
    sym2(-17,21,.5,5,1.4,'concrete'); sym2(-21,9.5,6,.5,1.4,'concrete'); sym2(-18.5,13.5,1.4,1.4,1,'crate'); sym2(-28,11.5,1,3,1.1,'sandbag');
    // ruins along the middle lanes
    sym2(-13,-1,.8,5,2.2,'wall'); sym2(-11,3.2,1.2,1.2,4,'pillar'); sym2(14,3.5,3,3,2.4,'concrete'); sym2(16.5,-3,1.4,1.4,1,'crate'); sym2(17.9,-3.2,1.4,1.4,1,'crate');
    sym2(-22,-6,4,4,2.6,'concrete'); sym2(-9,-17,1,4,1.1,'sandbag'); sym2(8,20,1.2,1.2,3.8,'pillar');
    // containers on the far flanks
    sym2(-33,-7,2.6,6.4,2.6,'cover'); sym2(-30,5,6.4,2.6,2.6,'cover'); sym2(-33.5,24,2.6,6.4,2.6,'cover'); sym2(33,15,2.6,6.4,2.6,'cover'); sym2(26,27,6.4,2.6,2.6,'cover');
    // cover in front of each base
    sym2(-11,29.5,6,.6,1.4,'concrete'); sym2(12,29,5,.6,1.4,'concrete'); sym2(-30,31,1.2,1.2,4,'pillar'); sym2(20,33,1.4,1.4,1,'crate');
    // extra cover in the open ground between the bases and the fronts
    sym2(10,24,4,1,1.2,'sandbag'); sym2(-16,27,1.4,1.4,1,'crate'); sym2(26,6,3,.6,1.6,'wall'); sym2(-31,15,1,4,1.2,'sandbag');
    sym2(-6,30,4,1,1.2,'sandbag'); sym2(-24,-20,1.2,1.2,3.8,'pillar'); sym2(-17,-26,6,.6,1.4,'concrete'); sym2(-28,-30,2.6,6.4,2.6,'cover');
  }},
];
let mapId = 0;
try { const m = +localStorage.getItem('cephe-map'); if (m >= 0 && m < MAPS.length) mapId = m; } catch(e){}
const SPAWN0 = [[-20,22.5],[0,22.5],[20,22.5],[-12,19],[12,19],[-22.5,9],[22.5,9],[-7,22.5],[7,22.5]];
const SPAWNS = [[], []];
const WAYPTS = [];
const boxAt = (x, z, m) => BOXES.some(b => Math.abs(x-b.x) < b.w/2+m && Math.abs(z-b.z) < b.d/2+m);
let MODE = 'tdm', MAP_AMMO = [];
const ZONES = [];
// lay out a map: arena size, perimeter, obstacles, bot waypoints, free spawn points, ammo spots, zones and the nav grid
function layoutMap(id){
  const M = MAPS[id]; A = M.size || A0;
  BOXES.length = 0;
  box(0,-A,A*2+1,1,4,'wall'); box(0,A,A*2+1,1,4,'wall'); box(-A,0,1,A*2+1,4,'wall'); box(A,0,1,A*2+1,4,'wall');
  M.build();
  WAYPTS.length = 0;
  const L = A - 4;
  for (let x=-L; x<=L; x+=3) for (let z=-L; z<=L; z+=3) if (!boxAt(x, z, .9)) WAYPTS.push([x,z]);
  const base = M.spawns || SPAWN0;
  let sp = base.filter(([x,z]) => !boxAt(x, z, 1.1)); if (sp.length < 4) sp = base;
  SPAWNS[0].length = SPAWNS[1].length = 0; sp.forEach(([x,z]) => { SPAWNS[0].push([x,z]); SPAWNS[1].push([-x,-z]); });
  MODE = M.mode || 'tdm';
  ZONES.length = 0;
  (M.zones || []).forEach(([x, z, r], i) => ZONES.push({x, z, r, label:'ABC'[i], owner:-1, prog:0, cnt:[0, 0], contested:false}));
  // ammo crates: the map's own spots, or the free waypoints nearest to four default spots
  const snap = ([tx, tz]) => WAYPTS.reduce((b, p) => Math.hypot(p[0]-tx, p[1]-tz) < Math.hypot(b[0]-tx, b[1]-tz) ? p : b, WAYPTS[0] || [tx, tz]);
  MAP_AMMO = (M.ammo || [[-17,0],[17,0],[0,-11],[0,11]].map(snap)).filter(([x, z]) => !boxAt(x, z, .6));
  buildNav();
}
// ---- navigation grid for the bots: 0.5 m cells, obstacles grown by the body radius; A* plus string pulling
const NAV = {n:0, s:.5, g:null};
function buildNav(){
  const s = NAV.s, n = Math.ceil(A * 2 / s); NAV.n = n; NAV.g = new Uint8Array(n * n);
  for (const b of BOXES){
    const m = RADIUS + .12;
    const x0 = Math.max(0, Math.floor((b.x - b.w/2 - m + A) / s)), x1 = Math.min(n - 1, Math.floor((b.x + b.w/2 + m + A) / s));
    const z0 = Math.max(0, Math.floor((b.z - b.d/2 - m + A) / s)), z1 = Math.min(n - 1, Math.floor((b.z + b.d/2 + m + A) / s));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) NAV.g[z * n + x] = 1;
  }
}
const navIdx = (x, z) => { const n = NAV.n; const i = Math.max(0, Math.min(n - 1, Math.floor((x + A) / NAV.s))), j = Math.max(0, Math.min(n - 1, Math.floor((z + A) / NAV.s))); return j * n + i; };
const navFree = (x, z) => NAV.g && !NAV.g[navIdx(x, z)];
function navLine(ax, az, bx, bz){
  const d = Math.hypot(bx - ax, bz - az), st = Math.max(1, Math.ceil(d / (NAV.s * .5)));
  for (let k = 1; k < st; k++){ const t = k / st; if (!navFree(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
  return true;
}
function navNearestFree(i){
  const n = NAV.n, g = NAV.g; if (!g[i]) return i;
  const cx = i % n, cz = (i / n) | 0;
  for (let r = 1; r < 12; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++){
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= n || z >= n) continue;
    if (!g[z * n + x]) return z * n + x;
  }
  return i;
}
// returns a list of [x, z] corners from (sx, sz) to (tx, tz), or null if there is no way through
function navPath(sx, sz, tx, tz){
  if (!NAV.g) return null;
  if (navLine(sx, sz, tx, tz)) return [[tx, tz]];
  const n = NAV.n, g = NAV.g, s = NAV.s, start = navNearestFree(navIdx(sx, sz)), goal = navNearestFree(navIdx(tx, tz));
  const gS = new Float32Array(n * n).fill(1e9), from = new Int32Array(n * n).fill(-1), closed = new Uint8Array(n * n);
  const heap = [], hx = goal % n, hz = (goal / n) | 0;
  const h = i => { const dx = Math.abs(i % n - hx), dz = Math.abs(((i / n) | 0) - hz); return Math.max(dx, dz) + .414 * Math.min(dx, dz); };
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k){ const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let k = 0; for (;;){ const l = k*2+1, r = l+1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  gS[start] = 0; push(h(start), start);
  let found = false, guard = 0;
  while (heap.length && guard++ < 40000){
    const [, i] = pop(); if (closed[i]) continue; closed[i] = 1;
    if (i === goal){ found = true; break; }
    const x = i % n, z = (i / n) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++){
      if (!dx && !dz) continue;
      const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= n || nz >= n) continue;
      const j = nz * n + nx; if (g[j] || closed[j]) continue;
      if (dx && dz && (g[z * n + nx] || g[nz * n + x])) continue;      // no corner cutting
      const c = gS[i] + (dx && dz ? 1.414 : 1);
      if (c < gS[j]){ gS[j] = c; from[j] = i; push(c + h(j), j); }
    }
  }
  if (!found) return null;
  const cells = []; for (let i = goal; i !== -1; i = from[i]) cells.push(i); cells.reverse();
  const pts = cells.map(i => [(i % n + .5) * s - A, (((i / n) | 0) + .5) * s - A]); pts[pts.length - 1] = [tx, tz];
  // string pulling: keep only the corners the bot really has to walk round
  const out = []; let ax = sx, az = sz, k = 0;
  while (k < pts.length - 1){
    let far = k; for (let t = pts.length - 1; t > k; t--) if (navLine(ax, az, pts[t][0], pts[t][1])){ far = t; break; }
    if (far === k) far = k + 1;
    out.push(pts[far]); ax = pts[far][0]; az = pts[far][1]; k = far;
  }
  if (!out.length) out.push([tx, tz]);
  return out;
}
layoutMap(mapId);
const MAT_COL = {wall:0x7d7259, concrete:0x9a948a, pillar:0x6e6a5e, crate:0x8a6a3c, cover:0x6b7552, sandbag:0xa8986c};

await loadStep(5, 'Grafik motoru açılıyor');
// ================= Three setup =================
const renderer = new THREE.WebGLRenderer({antialias:!MOBILE, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement);
const cv = renderer.domElement;
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
const HSL = (h,s,l) => new THREE.Color(`hsl(${h},${s}%,${l}%)`).convertSRGBToLinear();
const scene = new THREE.Scene();
const HAZE = C(0xd9d3c0);
scene.background = HAZE.clone();
scene.fog = new THREE.Fog(HAZE.clone(), 45, 330);
const camera = new THREE.PerspectiveCamera(75, 1, .05, 600);
camera.rotation.order = 'YXZ';
camera.layers.enable(1);
scene.add(camera);

// --- lights ---
const SUN_DIR = new V(.55, .62, .35).normalize();
const hemiLight = new THREE.HemisphereLight(C(0xc7dcff), C(0x6b5838), .5); scene.add(hemiLight);
const sun = new THREE.DirectionalLight(C(0xffe2b8), 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(45);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-34,right:34,top:34,bottom:-34,near:1,far:110});
sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
scene.add(sun); scene.add(sun.target);
const fillLight = new THREE.DirectionalLight(C(0xa9c4ff), .35); fillLight.position.set(-SUN_DIR.x*40, 18, -SUN_DIR.z*40);

// --- canvas texture helpers ---
function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function toTex(c, rep){
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (rep) t.repeat.set(rep, rep); return t;
}
const rnd = (a, b) => a + Math.random()*(b-a);
function speckle(g, w, h, n, cols, smin, smax){
  for (let i=0;i<n;i++){ g.fillStyle = cols[Math.floor(Math.random()*cols.length)]; const s = rnd(smin, smax); g.fillRect(Math.random()*w, Math.random()*h, s, s); }
}
function blotches(g, w, h, n, col, rmin, rmax){
  for (let i=0;i<n;i++){
    const x = Math.random()*w, y = Math.random()*h, r = rnd(rmin, rmax);
    const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x-r, y-r, r*2, r*2);
  }
}
await loadStep(9, 'Dokular üretiliyor');
// ================= PBR texture generator =================
// Builds tileable albedo + normal + packed roughness/metalness maps from procedural height fields.
const PBR = (() => {
  function rng(seed){ let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  // tileable fractal value noise, returned as Float32Array in [0,1]
  function fbm(w, h, period, seed, oct, pers){
    const out = new Float32Array(w*h); let amp = 1, tot = 0; const r = rng(seed);
    for (let o=0;o<oct;o++){
      const px = period << o, py = Math.max(1, Math.round(px * h / w)), lat = new Float32Array(px*py);
      for (let i=0;i<lat.length;i++) lat[i] = r();
      for (let y=0;y<h;y++){
        const fy = y / h * py, iy = Math.floor(fy); let ty = fy - iy; ty = ty*ty*(3 - 2*ty);
        const y0 = (iy % py) * px, y1 = ((iy + 1) % py) * px;
        for (let x=0;x<w;x++){
          const fx = x / w * px, ix = Math.floor(fx); let tx = fx - ix; tx = tx*tx*(3 - 2*tx);
          const x0 = ix % px, x1 = (ix + 1) % px;
          const a = lat[y0+x0] + (lat[y0+x1] - lat[y0+x0]) * tx, b = lat[y1+x0] + (lat[y1+x1] - lat[y1+x0]) * tx;
          out[y*w+x] += (a + (b - a) * ty) * amp;
        }
      }
      tot += amp; amp *= pers;
    }
    for (let i=0;i<out.length;i++) out[i] /= tot;
    return out;
  }
  function mask(w, h, draw){ // draw with canvas API, read back alpha*luminance as float mask
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    draw(g, w, h); const d = g.getImageData(0, 0, w, h).data, m = new Float32Array(w*h);
    for (let i=0;i<m.length;i++) m[i] = d[i*4+3] / 255 * (d[i*4] / 255);
    return m;
  }
  function blur(src, w, h, r){
    const tmp = new Float32Array(w*h), out = new Float32Array(w*h), n = r*2 + 1;
    for (let y=0;y<h;y++){ let s = 0; for (let k=-r;k<=r;k++) s += src[y*w + ((k + w) % w)];
      for (let x=0;x<w;x++){ tmp[y*w+x] = s / n; s += src[y*w + (x + r + 1) % w] - src[y*w + (x - r + w) % w]; } }
    for (let x=0;x<w;x++){ let s = 0; for (let k=-r;k<=r;k++) s += tmp[((k + h) % h)*w + x];
      for (let y=0;y<h;y++){ out[y*w+x] = s / n; s += tmp[((y + r + 1) % h)*w + x] - tmp[((y - r + h) % h)*w + x]; } }
    return out;
  }
  function toCanvas(w, h, fill){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const img = g.createImageData(w, h); fill(img.data); g.putImageData(img, 0, 0); return c;
  }
  function normalCanvas(H, w, h, strength){
    return toCanvas(w, h, d => {
      for (let y=0;y<h;y++){ const ym = ((y - 1 + h) % h)*w, yp = ((y + 1) % h)*w, yr = y*w;
        for (let x=0;x<w;x++){
          const xm = (x - 1 + w) % w, xp = (x + 1) % w;
          let nx = -(H[yr+xp] - H[yr+xm]) * strength, ny = (H[yp+x] - H[ym+x]) * strength, nz = 1;
          const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
          const i = (yr + x) * 4; d[i] = (nx*.5+.5)*255; d[i+1] = (ny*.5+.5)*255; d[i+2] = (nz*.5+.5)*255; d[i+3] = 255;
        } }
    });
  }
  // finish: albedo (Float32 RGB 0..1), height, rough, metal -> canvases
  function finish(w, h, A, H, R, M, nStrength, cavity){
    const Hb = cavity ? blur(H, w, h, 3) : null;
    const albedo = toCanvas(w, h, d => {
      for (let i=0;i<w*h;i++){
        let k = 1; if (Hb) k = Math.max(.55, Math.min(1.08, 1 + (H[i] - Hb[i]) * cavity));
        d[i*4] = Math.min(255, A[i*3]*k*255); d[i*4+1] = Math.min(255, A[i*3+1]*k*255); d[i*4+2] = Math.min(255, A[i*3+2]*k*255); d[i*4+3] = 255;
      }
    });
    const orm = toCanvas(w, h, d => { for (let i=0;i<w*h;i++){ d[i*4] = 255; d[i*4+1] = Math.max(0, Math.min(1, R[i]))*255; d[i*4+2] = M ? Math.max(0, Math.min(1, M[i]))*255 : 0; d[i*4+3] = 255; } });
    return {albedo, normal:normalCanvas(H, w, h, nStrength), orm};
  }
  const hex = c => [(c >> 16 & 255)/255, (c >> 8 & 255)/255, (c & 255)/255];
  const mix3 = (a, b, t) => [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];

  function concrete(S, tint){
    const w = S, h = S, n1 = fbm(w, h, 4, 11, 5, .55), n2 = fbm(w, h, 2, 23, 3, .5), grain = fbm(w, h, 64, 37, 2, .5), r = rng(5);
    const marks = mask(w, h, (g) => {
      g.fillStyle = '#fff';
      for (let i=0;i<S*S/900;i++){ const x = r()*w, y = r()*h, rr = r()*S/512*1.6 + .4; g.globalAlpha = .6 + r()*.4; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = S/512*1.2;
      for (let k=0;k<4;k++){ g.beginPath(); let x = r()*w, y = r()*h; g.moveTo(x, y); for (let j=0;j<14;j++){ x += (r()-.5)*S/12; y += r()*S/22; g.lineTo(x, y); } g.stroke(); }
    });
    const seams = mask(w, h, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, S/256*2.5); g.fillRect(0, 0, S/256*2.5, h);
      for (const [x, y] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]]){ g.beginPath(); g.arc(x*w, y*h, S/90, 0, 7); g.fill(); } });
    const base = hex(tint || 0x9b968c), dark = mix3(base, [.32,.3,.27], .55), light = mix3(base, [.95,.93,.88], .25);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){
      const y = Math.floor(i / w) / h;
      let c = mix3(dark, light, Math.min(1, Math.max(0, n1[i]*1.4 - .2)));
      c = mix3(c, [.36,.33,.28], Math.max(0, n2[i] - .55) * 1.2);
      c = mix3(c, [.3,.27,.22], Math.max(0, y - .82) * 1.6 * (.6 + n1[i]*.6));
      const g2 = (grain[i] - .5) * .08; c = [c[0] + g2, c[1] + g2, c[2] + g2];
      const hole = marks[i], seam = seams[i];
      A.set(mix3(c, [.22,.21,.19], Math.max(hole, seam)*.8), i*3);
      H[i] = n1[i]*.6 + grain[i]*.4 - hole*.9 - seam*1.2;
      R[i] = .86 + (grain[i] - .5)*.12 - Math.max(0, n2[i] - .6)*.2;
    }
    return finish(w, h, A, H, R, null, S/256*2.2, 1.1);
  }
  function wall(S){
    const w = S, h = S, n1 = fbm(w, h, 4, 41, 5, .55), grain = fbm(w, h, 64, 43, 2, .5), drip = fbm(w, h, 32, 47, 3, .5), r = rng(9);
    const lines = mask(w, h, (g) => {
      g.fillStyle = '#fff'; for (const x of [0, w/2]) g.fillRect(x - S/512*3, 0, S/512*6, h);
      g.fillRect(0, h*.09, w, S/512*3);
      for (let i=0;i<S*S/1400;i++){ g.globalAlpha = .5 + r()*.5; g.beginPath(); g.arc(r()*w, r()*h, r()*S/512*1.5 + .4, 0, 7); g.fill(); }
    });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    const base = [.56,.53,.47];
    for (let i=0;i<w*h;i++){
      const x = i % w, yv = Math.floor(i / w) / h;
      let c = mix3([.36,.34,.3], [.72,.69,.62], Math.min(1, Math.max(0, n1[i]*1.5 - .25)));
      c = mix3(c, base, .35);
      const rustStreak = Math.max(0, drip[(i % w) + Math.floor(Math.floor(i/w) * .08) * w] - .62) * 2.2 * Math.max(0, 1 - yv*1.4);
      c = mix3(c, [.42,.24,.12], Math.min(.7, rustStreak));
      c = mix3(c, [.24,.2,.15], Math.max(0, yv - .7) * 1.8 * (.5 + n1[i]*.7));
      let rough = .84 + (grain[i] - .5)*.1, height = n1[i]*.5 + grain[i]*.5;
      if (yv < .07){ const stripe = Math.floor((x + Math.floor(i / w)) / (S/16)) % 2; const paint = stripe ? [.78,.6,.12] : [.08,.08,.08];
        const chip = n1[i] > .62 ? 1 : 0; c = chip ? mix3(c, [.5,.47,.4], .8) : mix3(paint, c, .15); rough = chip ? rough : .55; height += chip ? -.15 : .05; }
      const g2 = (grain[i] - .5) * .07; c = [c[0] + g2, c[1] + g2, c[2] + g2];
      A.set(mix3(c, [.2,.19,.17], lines[i]*.85), i*3);
      H[i] = height - lines[i]*1.3; R[i] = rough;
    }
    return finish(w, h, A, H, R, null, S/256*2.4, 1.0);
  }
  function crate(S){
    const w = S, h = S, grain = fbm(w, h * 1, 4, 51, 5, .55), fine = fbm(w, h, 48, 53, 2, .5), r = rng(13);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const plank = S / 8, frame = S * .085;
    const stencil = mask(w, h, (g) => { g.fillStyle = '#fff'; g.font = `bold ${S*.1}px Arial`; g.textAlign = 'center'; g.fillText('MÜHİMMAT', w/2, h*.3); g.font = `bold ${S*.05}px Arial`; g.fillText('7.62 × 39 · 1440', w/2, h*.38); });
    const nails = mask(w, h, (g) => { g.fillStyle = '#fff'; for (const [x, y] of [[.04,.04],[.96,.04],[.04,.96],[.96,.96],[.5,.04],[.5,.96],[.04,.5],[.96,.5]]){ g.beginPath(); g.arc(x*w, y*h, S/170, 0, 7); g.fill(); } });
    const tones = Array.from({length:8}, () => .85 + r()*.3);
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w), pi = Math.floor(y / plank);
      const gx = grain[(y % h)*w + Math.floor(x*.25) % w];
      const grainLine = Math.sin((y + gx*90) * .55 + fine[i]*4) * .5 + .5;
      let tone = tones[pi]; let c = mix3([.34,.22,.11], [.62,.45,.26], (grainLine*.35 + gx*.65) * tone);
      let hgt = grainLine*.25 + fine[i]*.2;
      const gap = (y % plank) < S/256*1.5 ? 1 : 0;
      const inFrame = x < frame || x > w - frame || y < frame || y > h - frame;
      const dx = x - y, diag = Math.abs(dx) < frame*.72 && !inFrame;
      if (inFrame || diag){ c = mix3(c, [.3,.2,.1], .45); hgt += .35; }
      c = mix3(c, [.12,.1,.08], stencil[i]*.82);
      let rough = .78 + fine[i]*.12, metal = 0;
      if (nails[i] > .3){ c = [.45,.45,.47]; rough = .35; metal = 1; hgt += .5; }
      A.set(mix3(c, [.08,.05,.03], gap*.8), i*3); H[i] = hgt - gap*1.2; R[i] = rough; M[i] = metal;
    }
    return finish(w, h, A, H, R, M, S/256*2.6, .9);
  }
  function corrugated(S){
    const w = S, h = S, n1 = fbm(w, h, 4, 61, 5, .55), chips = fbm(w, h, 16, 67, 4, .5), streak = fbm(w, h, 64, 71, 2, .5);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const rib = S / 16;
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      const ph = (x % rib) / rib, rh = Math.sin(ph * Math.PI * 2) * .5 + .5;
      let c = mix3([.27,.31,.2], [.4,.45,.3], n1[i]*.7 + rh*.3);
      let rough = .55 + n1[i]*.15, metal = .15;
      const chip = chips[i] > .64 + rh*.04;
      if (chip){ const rust = streak[i] > .45; c = rust ? [.4,.22,.1] : [.55,.55,.55]; rough = rust ? .85 : .38; metal = rust ? .2 : .9; }
      const rs = Math.max(0, streak[(x) + Math.floor(y*.05)*w] - .6) * 2 * (1 - y/h);
      c = mix3(c, [.38,.2,.09], Math.min(.6, rs));
      A.set(c, i*3); H[i] = rh*1.5 + (chip ? -.08 : 0) + n1[i]*.1; R[i] = rough; M[i] = metal;
    }
    return finish(w, h, A, H, R, M, S/256*1.1, .6);
  }
  function burlap(S){
    const w = S, h = S, n = fbm(w, h, 8, 81, 4, .5), A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    const t = S / 64;
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      const wx = Math.sin(x / t * Math.PI) , wy = Math.sin(y / t * Math.PI);
      const over = ((Math.floor(x / t) + Math.floor(y / t)) % 2) ? wx*wx : wy*wy;
      const c = mix3([.42,.36,.24], [.7,.62,.44], over*.55 + n[i]*.45);
      A.set(c, i*3); H[i] = over*.8 + n[i]*.2; R[i] = .95;
    }
    return finish(w, h, A, H, R, null, S/256*2.6, .8);
  }
  function dirtDetail(S){
    const w = S, h = S, n = fbm(w, h, 8, 91, 4, .5), r = rng(17);
    const peb = mask(w, h, (g) => {
      for (let i=0;i<S*S/260;i++){ const x = r()*w, y = r()*h, rr = (r()*r())*S/40 + 1; const gr = g.createRadialGradient(x - rr*.3, y - rr*.3, 0, x, y, rr);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.7, 'rgba(180,180,180,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
        g.beginPath(); g.ellipse(x, y, rr, rr*(.6 + r()*.4), r()*3, 0, 7); g.fill(); }
    });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){ const v = .82 + n[i]*.25 + peb[i]*.12; A.set([v, v, v], i*3); H[i] = n[i]*.5 + peb[i]*1.1; R[i] = .9 - peb[i]*.25; }
    return finish(w, h, A, H, R, null, S/256*3, 0);
  }
  function dirtAlbedo(S){
    const w = S, h = S, low = fbm(256, 256, 3, 101, 5, .55), mid = fbm(512, 512, 6, 103, 4, .5);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const lowC = toCanvas(256, 256, d => { for (let i=0;i<256*256;i++){ const v = low[i];
      const col = mix3(mix3([.36,.29,.19], [.55,.47,.33], v), [.33,.38,.2], Math.max(0, .45 - v)*1.2);
      d[i*4] = col[0]*255; d[i*4+1] = col[1]*255; d[i*4+2] = col[2]*255; d[i*4+3] = 255; } });
    g.imageSmoothingQuality = 'high'; g.drawImage(lowC, 0, 0, w, h);
    const midC = toCanvas(512, 512, d => { for (let i=0;i<512*512;i++){ const v = mid[i]; d[i*4] = d[i*4+1] = d[i*4+2] = v*255; d[i*4+3] = 70; } });
    g.globalCompositeOperation = 'overlay'; for (let y=0;y<w;y+=512) for (let x=0;x<w;x+=512) g.drawImage(midC, x, y); g.globalCompositeOperation = 'source-over';
    const r = rng(29);
    for (let t=0;t<4;t++){ // tyre tracks
      let x = r()*w, y = 0, a = (r()-.5)*.6;
      for (const off of [-S/38, S/38]){ g.beginPath(); let xx = x + off, yy = y, aa = a; g.moveTo(xx, yy);
        for (let k=0;k<44;k++){ aa += (r()-.5)*.12; xx += Math.sin(aa)*S/38; yy += Math.cos(aa)*S/38; g.lineTo(xx, yy); }
        g.strokeStyle = 'rgba(40,32,22,.35)'; g.lineWidth = S/90; g.stroke(); g.setLineDash([S/300, S/250]); g.strokeStyle = 'rgba(25,20,14,.35)'; g.lineWidth = S/110; g.stroke(); g.setLineDash([]); }
    }
    for (let i=0;i<S*6;i++){ g.fillStyle = r() < .5 ? 'rgba(30,24,16,.35)' : 'rgba(200,185,150,.3)'; const s = r()*S/700 + .6; g.fillRect(r()*w, r()*h, s, s); }
    for (let i=0;i<10;i++){ const x = r()*w, y = r()*h, rr = S/40 + r()*S/30; const gr = g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(35,28,20,.45)'); gr.addColorStop(1,'rgba(35,28,20,0)'); g.fillStyle = gr; g.fillRect(x-rr,y-rr,rr*2,rr*2); }
    return c;
  }
  // ---- weapon & gear surfaces
  function gunSurface(S, base, opt){
    opt = opt || {};
    const w = S, h = S, n = fbm(w, h, 8, opt.seed || 111, 4, .5), wear = fbm(w, h, 12, (opt.seed || 111) + 5, 5, .55), r = rng(opt.seed || 3);
    const scratches = mask(w, h, (g) => { g.strokeStyle = '#fff'; for (let i=0;i<(opt.scratches ?? 60);i++){ g.globalAlpha = .3 + r()*.6; g.lineWidth = .6 + r()*.8; g.beginPath(); const x = r()*w, y = r()*h, a = r()*6, l = r()*S/6; g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke(); } });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const b = hex(base), edge = hex(opt.wearColor ?? 0x8a8a88);
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      let stip = 0;
      if (opt.stipple){ const cx = (x % 6) - 3, cy = (y % 6) - 3; stip = Math.max(0, 1 - Math.hypot(cx + (n[i]-.5)*2, cy) / 2.6); }
      if (opt.knurl){ const a = ((x + y) % 8) / 8, bb = ((x - y + 4096) % 8) / 8; stip = Math.min(Math.abs(a - .5), Math.abs(bb - .5)) * 2; }
      const worn = wear[i] > (opt.wearAt ?? .7) ? Math.min(1, (wear[i] - (opt.wearAt ?? .7)) * 8) : 0;
      let c = mix3(b, b.map(v => v*1.25 + .02), n[i]*.6);
      c = mix3(c, edge, Math.max(worn*.7, scratches[i]*.5) * (opt.wearAmt ?? .5));
      if (opt.grain){ const gl = Math.sin(y * .35 + n[i]*12 + Math.sin(x*.02)*3) * .5 + .5; c = mix3(c, b.map(v => v*.6), gl*.45); }
      A.set(c, i*3);
      H[i] = n[i]*.25 + stip*1.2 - scratches[i]*.4 + (opt.grain ? Math.sin(y * .35 + n[i]*12) * .15 : 0);
      R[i] = (opt.rough ?? .5) + (n[i] - .5)*.15 - worn*.15 + scratches[i]*.1 + stip*.05;
      M[i] = (opt.metal ?? 0) * (1 - (opt.paintedMetal ? (1 - worn) * .7 : 0));
    }
    return finish(w, h, A, H, R, M, S/256*(opt.nStrength ?? 1.4), 0);
  }
  function fabric(S){
    const w = S, h = S, n = fbm(w, h, 8, 131, 3, .5), H = new Float32Array(w*h), A = new Float32Array(w*h*3), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){ const x = i % w, y = Math.floor(i / w);
      const tw = (Math.sin((x + y) * Math.PI / 2.5) * .5 + .5) * .7 + (Math.sin(y * Math.PI / 1.5) * .5 + .5) * .3;
      A.set([1, 1, 1], i*3); H[i] = tw*.6 + n[i]*.4; R[i] = .92 + (n[i] - .5)*.08; }
    return finish(w, h, A, H, R, null, S/256*1.8, 0);
  }
  return {fbm, concrete, wall, crate, corrugated, burlap, dirtDetail, dirtAlbedo, gunSurface, fabric};
})();

const TEX = {};
TEX.concrete = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#9b968c'; g.fillRect(0,0,256,256);
  blotches(g,256,256,30,'rgba(70,64,55,.18)',20,60); blotches(g,256,256,20,'rgba(255,250,235,.12)',15,50);
  speckle(g,256,256,2500,['rgba(40,38,34,.25)','rgba(230,225,210,.25)'],1,2.5);
  g.strokeStyle = 'rgba(40,36,30,.45)'; g.lineWidth = 2; g.strokeRect(1,1,254,254);
  for (let i=0;i<3;i++){ g.strokeStyle = 'rgba(40,36,30,.25)'; g.lineWidth = 1; g.beginPath(); let x = rnd(0,256), y = rnd(0,256); g.moveTo(x,y); for (let k=0;k<6;k++){ x += rnd(-20,20); y += rnd(5,22); g.lineTo(x,y); } g.stroke(); }
  const grd = g.createLinearGradient(0,200,0,256); grd.addColorStop(0,'rgba(60,50,35,0)'); grd.addColorStop(1,'rgba(60,50,35,.35)'); g.fillStyle = grd; g.fillRect(0,200,256,56);
  return toTex(c); })();
TEX.wall = (() => { const c = makeCanvas(512,256), g = c.getContext('2d');
  g.fillStyle = '#8e8878'; g.fillRect(0,0,512,256);
  blotches(g,512,256,40,'rgba(60,55,45,.2)',20,70); speckle(g,512,256,4000,['rgba(30,28,24,.25)','rgba(235,230,215,.2)'],1,2.5);
  for (let x=0;x<=512;x+=128){ g.fillStyle = 'rgba(30,28,22,.55)'; g.fillRect(x-2,0,4,256); g.fillStyle = 'rgba(255,255,240,.12)'; g.fillRect(x+2,0,2,256); }
  for (let x=0;x<512;x+=64){ g.fillStyle = 'rgba(80,60,30,.25)'; g.fillRect(x+rnd(0,40), 0, rnd(2,5), rnd(60,180)); }
  const grd = g.createLinearGradient(0,150,0,256); grd.addColorStop(0,'rgba(70,55,30,0)'); grd.addColorStop(1,'rgba(70,55,30,.45)'); g.fillStyle = grd; g.fillRect(0,150,512,106);
  for (let x=0;x<512;x+=32){ g.fillStyle = (x/32)%2 ? '#d7b030' : '#222'; g.fillRect(x, 0, 32, 14); }
  return toTex(c); })();
TEX.crate = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#8a6a3c'; g.fillRect(0,0,256,256);
  for (let y=0;y<256;y+=32){ g.fillStyle = `hsl(32,${rnd(32,42)}%,${rnd(30,38)}%)`; g.fillRect(0,y,256,31); g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0,y+30,256,2);
    for (let k=0;k<14;k++){ g.strokeStyle = 'rgba(40,24,10,.25)'; g.lineWidth = 1; g.beginPath(); const yy = y + rnd(3,28); g.moveTo(0,yy); g.bezierCurveTo(80,yy+rnd(-3,3),170,yy+rnd(-3,3),256,yy+rnd(-2,2)); g.stroke(); } }
  g.fillStyle = '#5c4220'; g.fillRect(0,0,256,22); g.fillRect(0,234,256,22); g.fillRect(0,0,22,256); g.fillRect(234,0,22,256);
  g.save(); g.translate(128,128); g.rotate(Math.PI/4); g.fillRect(-170,-11,340,22); g.restore();
  g.fillStyle = '#2b2b2b'; [[11,11],[245,11],[11,245],[245,245]].forEach(([x,y]) => { g.beginPath(); g.arc(x,y,3,0,7); g.fill(); });
  g.fillStyle = 'rgba(20,20,10,.55)'; g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.fillText('MÜHİMMAT', 128, 70);
  return toTex(c); })();
TEX.metal = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#5c6646'; g.fillRect(0,0,256,256);
  for (let x=0;x<256;x+=16){ const gr = g.createLinearGradient(x,0,x+16,0); gr.addColorStop(0,'rgba(0,0,0,.28)'); gr.addColorStop(.5,'rgba(255,255,230,.14)'); gr.addColorStop(1,'rgba(0,0,0,.28)'); g.fillStyle = gr; g.fillRect(x,0,16,256); }
  for (let i=0;i<14;i++){ const x = rnd(0,256), w = rnd(2,6), h = rnd(30,140), gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(120,60,20,.55)'); gr.addColorStop(1,'rgba(120,60,20,0)'); g.fillStyle = gr; g.fillRect(x,0,w,h); }
  blotches(g,256,256,10,'rgba(110,70,30,.22)',10,40);
  return toTex(c); })();
TEX.bag = (() => { const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = '#b3a173'; g.fillRect(0,0,128,128);
  for (let i=0;i<128;i+=3){ g.fillStyle = 'rgba(80,65,35,.18)'; g.fillRect(i,0,1,128); g.fillRect(0,i,128,1); }
  speckle(g,128,128,600,['rgba(60,50,30,.3)','rgba(240,230,200,.25)'],1,2);
  return toTex(c); })();
TEX.dirt = (() => { const c = makeCanvas(1024), g = c.getContext('2d');
  g.fillStyle = '#7d6c4c'; g.fillRect(0,0,1024,1024);
  blotches(g,1024,1024,140,'rgba(90,75,50,.35)',30,110); blotches(g,1024,1024,90,'rgba(150,135,100,.25)',30,90);
  blotches(g,1024,1024,40,'rgba(70,85,40,.3)',20,70);
  speckle(g,1024,1024,22000,['rgba(40,32,20,.35)','rgba(190,175,140,.3)','rgba(110,95,70,.4)'],1,3.5);
  for (let t=0;t<4;t++){
    let x = rnd(0,1024), y = 0, ang = rnd(-.3,.3);
    g.strokeStyle = 'rgba(50,40,26,.32)'; g.lineWidth = 9;
    for (const off of [-26, 26]){ g.beginPath(); let xx = x + off, yy = y, a = ang; g.moveTo(xx,yy); for (let k=0;k<40;k++){ a += rnd(-.08,.08); xx += Math.sin(a)*28; yy += Math.cos(a)*28; g.lineTo(xx,yy); } g.stroke(); }
  }
  blotches(g,1024,1024,10,'rgba(40,35,28,.45)',15,40);
  return toTex(c); })();
TEX.dirt.wrapS = TEX.dirt.wrapT = THREE.ClampToEdgeWrapping;
TEX.dirtDetail = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0,0,256,256);
  speckle(g,256,256,5000,['#5a5a5a','#a8a8a8','#6e6e6e','#959595'],1,3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60,60); return t; })();
TEX.grass = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#5f6b37'; g.fillRect(0,0,256,256);
  blotches(g,256,256,30,'rgba(120,110,60,.35)',15,50); blotches(g,256,256,25,'rgba(40,55,25,.35)',15,45);
  for (let i=0;i<5000;i++){ g.strokeStyle = Math.random()<.5 ? 'rgba(40,55,20,.5)' : 'rgba(150,150,80,.4)'; g.lineWidth = 1; const x = Math.random()*256, y = Math.random()*256; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rnd(-2,2), y-rnd(2,6)); g.stroke(); }
  return toTex(c, 70); })();
TEX.soft = (() => { const c = makeCanvas(64), g = c.getContext('2d'); const gr = g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.4,'rgba(255,255,255,.5)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c); })();
TEX.flash = (() => { const c = makeCanvas(128), g = c.getContext('2d'); g.translate(64,64);
  const gr = g.createRadialGradient(0,0,0,0,0,64); gr.addColorStop(0,'rgba(255,255,230,1)'); gr.addColorStop(.25,'rgba(255,210,110,.9)'); gr.addColorStop(1,'rgba(255,120,20,0)');
  g.fillStyle = gr; for (let i=0;i<7;i++){ g.rotate(Math.PI*2/7); g.beginPath(); g.moveTo(-9,0); g.lineTo(0, -62 * rnd(.6,1)); g.lineTo(9,0); g.fill(); }
  g.beginPath(); g.arc(0,0,26,0,7); g.fill();
  return new THREE.CanvasTexture(c); })();
TEX.hole = (() => { const c = makeCanvas(64), g = c.getContext('2d'); const gr = g.createRadialGradient(32,32,0,32,32,30);
  gr.addColorStop(0,'rgba(10,8,6,1)'); gr.addColorStop(.35,'rgba(25,20,15,.9)'); gr.addColorStop(.6,'rgba(60,50,40,.4)'); gr.addColorStop(1,'rgba(60,50,40,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();

// higher quality effect sprites: noisy smoke/fire puffs and directional muzzle petals
function puffTexture(seed, core){
  const S = 128, c = makeCanvas(S), g = c.getContext('2d');
  for (let i=0;i<18;i++){ const x = S/2 + rnd(-24,24), y = S/2 + rnd(-24,24), rr = rnd(14,34); const gr = g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,S,S); }
  const n = PBR.fbm(S, S, 4, seed, 4, .55), img = g.getImageData(0,0,S,S), d = img.data;
  for (let i=0;i<S*S;i++){
    const x = i % S - S/2, y = Math.floor(i / S) - S/2, r = Math.hypot(x, y) / (S/2), fall = Math.max(0, 1 - r);
    d[i*4+3] = Math.min(255, d[i*4+3] * (.3 + n[i]*1.4) * fall * 1.5 + (core ? Math.max(0, 1 - r*2.2) * 200 : 0));
    const sh = core ? 255 : 185 + n[i]*70; d[i*4] = d[i*4+1] = d[i*4+2] = sh;
  }
  g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
}
TEX.smoke = puffTexture(777, false);
TEX.fire = puffTexture(901, true);
TEX.flashSide = (() => {
  const c = makeCanvas(128, 64), g = c.getContext('2d');
  for (let i=0;i<5;i++){
    const len = rnd(70,124), wid = rnd(6,13), gr = g.createLinearGradient(0,0,len,0);
    gr.addColorStop(0,'rgba(255,250,225,1)'); gr.addColorStop(.35,'rgba(255,200,110,.85)'); gr.addColorStop(1,'rgba(255,120,30,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 32 - wid); g.quadraticCurveTo(len*.4, 32 - wid*.4 + rnd(-4,4), len, 32 + rnd(-6,6)); g.quadraticCurveTo(len*.4, 32 + wid*.4 + rnd(-4,4), 0, 32 + wid); g.fill();
  }
  return new THREE.CanvasTexture(c);
})();

// --- world-scaled UVs for boxes so textures don't stretch ---
function boxWorldUV(w, h, d, scale){
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for (let f=0; f<6; f++) for (let i=0;i<4;i++){ const k = f*4+i; uv.setXY(k, uv.getX(k)*dims[f][0]/scale, uv.getY(k)*dims[f][1]/scale); }
  return geo;
}
// faceted look for Lambert materials: split vertices so each face gets its own normal (r128 Lambert has no flatShading)
const facet = geo => { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; };
const stdMat = (o) => new THREE.MeshStandardMaterial(Object.assign({roughness:.9, metalness:0}, o));
// vertex-shader wind sway for grass and tree crowns
const WIND = {value:0};
function addWind(mat, amp, quad){
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      '#include <begin_vertex>',
      'float wh = max(position.y, 0.0);',
      '#ifdef USE_INSTANCING',
      'vec2 wp = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);',
      '#else',
      'vec2 wp = vec2(0.0);',
      '#endif',
      'float ws = sin(uWind * 1.7 + wp.x * .35 + wp.y * .27) * .6 + sin(uWind * 3.3 + wp.x * .9 + wp.y * .4) * .25;',
      'float wk = ' + (quad ? 'wh * wh' : 'wh') + ' * ' + amp.toFixed(4) + ';',
      'transformed.x += ws * wk; transformed.z += ws * wk * .5;'].join('\n'));
  };
  return mat;
}

// ---- PBR textures & materials (albedo + normal + roughness/metalness)
function pbrTex(set, opts){
  opts = opts || {};
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); if (opts.repeat) t.repeat.set(opts.repeat, opts.repeat); return t; };
  return {map:mk(set.albedo, true), normalMap:mk(set.normal, false), orm:mk(set.orm, false)};
}
const pbrMat = (P, o) => stdMat(Object.assign({map:P.map, normalMap:P.normalMap, roughnessMap:P.orm, metalnessMap:P.orm, roughness:1, metalness:0}, o));
const PBRT = {
  concrete: pbrTex(PBR.concrete(TQ(1024))),
  wall: pbrTex(PBR.wall(TQ(1024))),
  crate: pbrTex(PBR.crate(TQ(512))),
  metal: pbrTex(PBR.corrugated(TQ(512))),
  bag: pbrTex(PBR.burlap(TQ(512))),
  dirt: pbrTex(PBR.dirtDetail(TQ(512)), {repeat:40}),
};
const DIRT_MACRO = (() => { const t = new THREE.CanvasTexture(PBR.dirtAlbedo(TQ(2048))); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; })();
const FABRIC = pbrTex(PBR.fabric(256));
const GUNT = {
  cerakote: pbrTex(PBR.gunSurface(TQ(512), 0x1f2023, {metal:1, paintedMetal:true, rough:.5, seed:5, wearAt:.86, wearAmt:.28, scratches:22, wearColor:0x5c5e62})),
  steel: pbrTex(PBR.gunSurface(TQ(512), 0x2a2c30, {metal:1, rough:.34, wearAt:.84, wearAmt:.35, seed:6, scratches:45, wearColor:0x707276})),
  polymer: pbrTex(PBR.gunSurface(TQ(256), 0x262722, {stipple:true, rough:.74, wearAmt:.25, scratches:15, seed:7})),
  tan: pbrTex(PBR.gunSurface(TQ(256), 0x8a7754, {stipple:true, rough:.72, wearAmt:.25, scratches:15, seed:8, wearColor:0x5a4a32})),
  wood: pbrTex(PBR.gunSurface(TQ(512), 0x5a3418, {grain:true, rough:.5, wearAmt:.3, wearColor:0x8a5a30, seed:9})),
  olive: pbrTex(PBR.gunSurface(TQ(512), 0x4b5236, {metal:1, paintedMetal:true, rough:.6, seed:11, wearAt:.85, wearAmt:.3, scratches:25, wearColor:0x5e5e58})),
  silver: pbrTex(PBR.gunSurface(TQ(512), 0xa8aaae, {metal:1, rough:.22, wearAmt:.2, seed:12, wearColor:0xd0d0d0})),
};

let SKY_TEX = null, SUN_SPR = null, SUN_CORE = null, SKY_MESH = null, SKY_K = 1;
// the low preset pulls the far plane in; shrink the sky dome and sun with it so they are never clipped
function placeSky(){
  if (SKY_MESH) SKY_MESH.scale.setScalar(SKY_K);
  if (SUN_SPR){ SUN_SPR.position.copy(SUN_DIR).multiplyScalar(450*SKY_K); SUN_SPR.scale.set(90*SKY_K, 90*SKY_K, 1); }
  if (SUN_CORE){ SUN_CORE.position.copy(SUN_DIR).multiplyScalar(450*SKY_K); SUN_CORE.scale.set(26*SKY_K, 26*SKY_K, 1); }
}
// --- sky dome, sun, mountains ---
const MOUNTAINS = [];
(() => {
  const c = makeCanvas(4, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0,0,0,512);
  gr.addColorStop(0,'#2f6db8'); gr.addColorStop(.32,'#6aa0d8'); gr.addColorStop(.47,'#c9d6dc'); gr.addColorStop(.5,'#e2dac4'); gr.addColorStop(1,'#d9d3c0');
  g.fillStyle = gr; g.fillRect(0,0,4,512);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; SKY_TEX = t;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.MeshBasicMaterial({map:t, side:THREE.BackSide, fog:false, depthWrite:false}));
  sky.renderOrder = -10; scene.add(sky); SKY_MESH = sky;
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft, color:C(0xfff2c8), fog:false, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  sunS.position.copy(SUN_DIR).multiplyScalar(450); sunS.scale.set(90,90,1); scene.add(sunS); SUN_SPR = sunS;
  const core = sunS.clone(); core.material = sunS.material.clone(); core.scale.set(26,26,1); core.material.color = C(0xffffff); scene.add(core); SUN_CORE = core;
  const mMat = new THREE.MeshLambertMaterial({color:C(0x7d8a8c)});
  const mMat2 = new THREE.MeshLambertMaterial({color:C(0x8f9688)});
  for (let i=0;i<46;i++){
    const a = i/46*Math.PI*2 + rnd(-.05,.05), r = rnd(190, 260), h = rnd(25, 70);
    const m = new THREE.Mesh(facet(new THREE.ConeGeometry(rnd(35,70), h, Math.floor(rnd(5,8)))), Math.random()<.5 ? mMat : mMat2);
    m.position.set(Math.cos(a)*r, h/2 - 4, Math.sin(a)*r); m.rotation.y = rnd(0,3); scene.add(m); MOUNTAINS.push(m);
  }
})();

// --- ground ---
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 30, 30), stdMat({map:TEX.grass, roughness:1}));
ground.rotation.x = -Math.PI/2; ground.position.y = -.02; ground.receiveShadow = true; scene.add(ground);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(A0*2, A0*2), pbrMat(PBRT.dirt, {normalScale:new THREE.Vector2(1.2, 1.2)}));
floor.material.onBeforeCompile = sh => {
  sh.uniforms.macroMap = {value:DIRT_MACRO};
  sh.fragmentShader = 'uniform sampler2D macroMap;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
    '#ifdef USE_MAP',
    '  vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );',
    '  vec4 macroC = mapTexelToLinear( texture2D( macroMap, vUv / 40.0 ) );',
    '  diffuseColor *= texelColor * macroC * 1.45;',
    '#endif'].join('\n'));
};
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
const TEAM_STRIPES = [];
[[0,21,TEAM_HUE[0]],[0,-21,TEAM_HUE[1]]].forEach(([x,z,h]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40,6), new THREE.MeshBasicMaterial({color:HSL(h,60,45), transparent:true, opacity:.14, depthWrite:false}));
  m.rotation.x = -Math.PI/2; m.position.set(x,.012,z); scene.add(m); TEAM_STRIPES.push(m);
});

await loadStep(28, 'Harita kuruluyor');
// --- arena boxes (collision meshes are also the visible ones, except sandbags) ---
const worldMeshes = [floor], solidMeshes = [];
const MATS = {
  wall:     pbrMat(PBRT.wall),
  concrete: pbrMat(PBRT.concrete),
  pillar:   pbrMat(PBRT.concrete, {color:C(0xc4beb4)}),
  crate:    pbrMat(PBRT.crate, {metalness:1}),
  cover:    pbrMat(PBRT.metal, {metalness:1}),
  sandbag:  pbrMat(PBRT.bag),
};
const UVSCALE = {wall:4, concrete:2.5, pillar:2, crate:1.4, cover:2, sandbag:1};
const bagBoxes = []; let SANDBAGS = null;
const BEVEL = {wall:.1, concrete:.08, pillar:.06, crate:.035, cover:.025};
function arenaGeo(b){
  const scale = b.c === 'crate' ? Math.max(b.w, b.h) : UVSCALE[b.c];
  if (!THREE.RoundedBoxGeometry || !BEVEL[b.c]) return boxWorldUV(b.w, b.h, b.d, scale);
  try {
    const geo = new THREE.RoundedBoxGeometry(b.w, b.h, b.d, 2, BEVEL[b.c]);
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i=0;i<p.count;i++){
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ax >= ay && ax >= az){ u = -p.getZ(i) * Math.sign(n.getX(i)) + b.d/2; v = p.getY(i) + b.h/2; }
      else if (ay >= az){ u = p.getX(i) + b.w/2; v = p.getZ(i) + b.d/2; }
      else { u = p.getX(i) * Math.sign(n.getZ(i)) + b.w/2; v = p.getY(i) + b.h/2; }
      uv.setXY(i, u / scale, v / (b.c === 'wall' ? b.h : scale));
    }
    uv.needsUpdate = true; return geo;
  } catch(e){ return boxWorldUV(b.w, b.h, b.d, scale); }
}
// everything whose place depends on the arena size lives in PERIM and is re-laid-out (and re-merged) when A changes
const PERIM = new THREE.Group(); PERIM.name = 'perimeter'; scene.add(PERIM);
function perimAdd(o, place, stretch){ o.userData.bx = o.position.x; o.userData.bz = o.position.z; o.userData.place = place; if (stretch) o.userData.stretch = 1; PERIM.add(o); return o; }
const _staticMark = scene.children.length;   // everything added from here to the dust is static scenery (merged later)
const CAP_MAT = pbrMat(PBRT.concrete, {color:C(0xa49e94)}), FRAME_MAT = stdMat({color:C(0x3e452c), roughness:.6, metalness:.4});
const PERIM_MESHES = [];
for (const b of BOXES.slice(0, WALLS_N)){
  const m = new THREE.Mesh(arenaGeo(b), MATS[b.c]);
  m.position.set(b.x, b.h/2, b.z); m.castShadow = m.receiveShadow = true;
  PERIM.add(m); worldMeshes.push(m); solidMeshes.push(m); PERIM_MESHES.push(m);
}
// ---- the map interior lives in its own group so the host can switch maps at any time
const ARENA = new THREE.Group(); ARENA.name = 'arena';
let ARENA_SOLIDS = [];
function addArenaBox(b){
  const m = new THREE.Mesh(arenaGeo(b), MATS[b.c]);
  m.position.set(b.x, b.h/2, b.z); m.castShadow = m.receiveShadow = true;
  if (b.c === 'sandbag') m.visible = false;                 // drawn as instanced bags, kept for collisions and hits
  ARENA.add(m); ARENA_SOLIDS.push(m);
  if (b.c === 'pillar' || b.c === 'concrete'){
    const cap = new THREE.Mesh(new THREE.BoxGeometry(b.w+.16, .14, b.d+.16), CAP_MAT);
    cap.position.set(b.x, b.h + .07, b.z); cap.castShadow = true; ARENA.add(cap);
  }
  if (b.c === 'cover'){
    for (const s of [-1,1]){
      const long = b.w > b.d;
      const post = new THREE.Mesh(new THREE.BoxGeometry(long ? .12 : b.w+.06, b.h+.04, long ? b.d+.06 : .12), FRAME_MAT);
      post.position.set(b.x + (long ? s*(b.w/2-.06) : 0), b.h/2, b.z + (long ? 0 : s*(b.d/2-.06))); post.castShadow = true; ARENA.add(post);
    }
  }
}
function buildSandbags(bagBoxes){
  const mats = [];
  for (const b of bagBoxes){
    const long = b.w >= b.d, len = long ? b.w : b.d, thick = long ? b.d : b.w;
    const rows = Math.max(1, Math.round(b.h / .2)), per = Math.max(1, Math.round(len / .55)), cols = Math.max(1, Math.round(thick / .45));
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) for (let i=0;i<per + (r%2 ? 0 : 0);i++){
      const off = (r % 2) ? .275 : 0;
      let t = -len/2 + .275 + i*(len/per) + off; if (t > len/2 - .2) continue;
      const u = -thick/2 + thick/cols*(c+.5);
      const m = new THREE.Matrix4().compose(
        new V(b.x + (long ? t : u), .1 + r*(b.h/rows) + rnd(-.01,.01), b.z + (long ? u : t)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(-.05,.05), (long ? 0 : Math.PI/2) + rnd(-.12,.12), rnd(-.05,.05))),
        new V(1, 1, 1));
      mats.push(m);
    }
  }
  if (!mats.length) return;
  const geo = MOBILE ? new THREE.SphereGeometry(.5, 6, 4) : new THREE.SphereGeometry(.5, 10, 6); geo.scale(.58, .22*1.05, .44);
  const inst = new THREE.InstancedMesh(geo, MATS.sandbag, mats.length); SANDBAGS = inst;
  mats.forEach((m,i) => inst.setMatrixAt(i, m)); inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = quality >= 1; inst.receiveShadow = true; ARENA.add(inst);
}

const TREES = {spots:null, inst:null}, FENCE = {posts:null, wire:null};
// --- decoration outside / around the arena (no gameplay effect) ---
(() => {
  // trees
  const trunkGeo = new THREE.CylinderGeometry(.18,.28,2.4,6); trunkGeo.translate(0,1.2,0);
  const leafGeo = facet(new THREE.ConeGeometry(1.6,4.2,7)); leafGeo.translate(0,4.2,0);
  const leaf2 = facet(new THREE.ConeGeometry(1.2,3.2,7)); leaf2.translate(0,5.8,0);
  const spots = [];
  for (let i=0;i<220;i++){ const a = Math.random()*Math.PI*2, r = rnd(31, 110); spots.push([Math.cos(a)*r, Math.sin(a)*r, rnd(.75,1.5)]); }
  const tr = new THREE.InstancedMesh(trunkGeo, stdMat({color:C(0x4a3826)}), spots.length);
  const lf = new THREE.InstancedMesh(leafGeo, addWind(new THREE.MeshLambertMaterial({color:C(0x3e5a2c)}), .018, false), spots.length);
  const lf2 = new THREE.InstancedMesh(leaf2, addWind(new THREE.MeshLambertMaterial({color:C(0x4b6a33)}), .018, false), spots.length);
  spots.forEach(sp => { sp.push(rnd(0,6), rnd(.9,1.25)); });
  TREES.spots = spots; TREES.inst = [tr, lf, lf2];
  [tr,lf,lf2].forEach(o => { o.castShadow = false; scene.add(o); });
  // rocks
  const rockMat = new THREE.MeshLambertMaterial({color:C(0x7e7a70)});
  for (let i=0;i<40;i++){ const a = Math.random()*Math.PI*2, r = rnd(28, 70), s = rnd(.4, 1.8);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat); m.position.set(Math.cos(a)*r, s*.3, Math.sin(a)*r); m.rotation.set(rnd(0,3),rnd(0,3),0); perimAdd(m, 'out'); }
  // watchtowers
  const wood2 = pbrMat(GUNT.wood, {color:C(0xd8c0a0)}), roof = pbrMat(PBRT.metal, {metalness:1});
  for (const [x,z] of [[30,30],[-30,-30],[30,-30],[-30,30]]){
    const g = new THREE.Group();
    for (const [dx,dz] of [[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(.25,7,.25), wood2); l.position.set(dx,3.5,dz); g.add(l); }
    const p = new THREE.Mesh(new THREE.BoxGeometry(3.4,.25,3.4), wood2); p.position.y = 7; g.add(p);
    for (const s of [-1,1]){ const r1 = new THREE.Mesh(new THREE.BoxGeometry(3.4,.9,.12), wood2); r1.position.set(0,7.55,s*1.65); g.add(r1); const r2 = r1.clone(); r2.rotation.y = Math.PI/2; r2.position.set(s*1.65,7.55,0); g.add(r2); }
    const rf = new THREE.Mesh(new THREE.ConeGeometry(2.9,1.4,4), roof); rf.position.y = 9.6; rf.rotation.y = Math.PI/4; g.add(rf);
    for (const [dx,dz] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(.12,1.8,.12), wood2); l.position.set(dx,8.8,dz); g.add(l); }
    g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(x,0,z); perimAdd(g, 'out');
  }
  // fence posts and wire on top of perimeter walls
  const postMat = stdMat({color:C(0x3a3a36), roughness:.5, metalness:.6});
  FENCE.posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.04,1.2,5), postMat, 4 * 64); FENCE.posts.count = 0; PERIM.add(FENCE.posts);
  FENCE.wire = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:C(0x2c2c2c)})); PERIM.add(FENCE.wire);
  // barrels along the walls
  const barrelMat = [0x3f5a2c, 0x7a2d1e, 0x2d4a6a].map(c => stdMat({color:C(c), roughness:1, metalness:1, roughnessMap:GUNT.olive.orm, metalnessMap:GUNT.olive.orm, normalMap:GUNT.olive.normalMap}));
  const bGeo = new THREE.CylinderGeometry(.3,.3,.9,14);
  for (const [x,z] of [[-25.2,-6],[-25.2,-5.3],[25.2,6],[25.2,5.3],[-7,25.2],[7,-25.2],[6.4,-25.2],[-25.2,17],[25.2,-17]]){
    const m = new THREE.Mesh(bGeo, barrelMat[Math.floor(Math.random()*3)]); m.position.set(x,.45,z); m.receiveShadow = true; perimAdd(m, 'edge');
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.3,.025,6,16), postMat); rim.rotation.x = Math.PI/2; rim.position.set(x,.78,z); perimAdd(rim, 'edge');
  }
  // camo net over the central bunker
  const netC = makeCanvas(256), ng = netC.getContext('2d');
  for (let i=0;i<500;i++){ ng.fillStyle = ['#3d4a26','#5b5a32','#2f3a1e','#6b6440'][i%4]; ng.beginPath(); ng.ellipse(Math.random()*256, Math.random()*256, rnd(6,16), rnd(4,10), rnd(0,3), 0, 7); ng.fill(); }
  const netT = toTex(netC); netT.repeat.set(2,2);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(7.5,7.5,8,8), stdMat({map:netT, alphaTest:.5, side:THREE.DoubleSide, transparent:false}));
  const pos = net.geometry.attributes.position;
  for (let i=0;i<pos.count;i++){ const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.max(0, (Math.hypot(x,y) - 2.5)) * .55 + Math.sin(x*2)*.08); }
  net.geometry.computeVertexNormals(); net.rotation.x = -Math.PI/2; net.position.set(0, 3.0, 0); net.castShadow = true; scene.add(net);
})();

const STATIC_ROOTS = scene.children.slice(_staticMark).concat(MOUNTAINS);
// --- floating dust ---
const dust = (() => {
  const n = 400, geo = new THREE.BufferGeometry(), arr = new Float32Array(n*3);
  for (let i=0;i<n;i++){ arr[i*3] = rnd(-A,A); arr[i*3+1] = rnd(.2,6); arr[i*3+2] = rnd(-A,A); }
  geo.setAttribute('position', new THREE.BufferAttribute(arr,3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:C(0xfff4d6), size:.05, transparent:true, opacity:.55, depthWrite:false}));
  scene.add(p); return p;
})();
function updateDust(dt){
  const a = dust.geometry.attributes.position;
  for (let i=0;i<a.count;i++){
    let x = a.getX(i) + Math.sin(now/3000 + i)*dt*.15 + dt*.12, y = a.getY(i) + Math.cos(now/2500 + i*1.7)*dt*.05;
    if (x > A) x = -A; a.setXY(i, x, y);
  }
  a.needsUpdate = true;
}

await loadStep(36, 'Harita birleştiriliyor');
// ================= Draw-call batching =================
// Static meshes that share a material are merged into one mesh per area. The originals stay in the
// scene hidden, so bullet raycasts and collisions keep using them exactly as before.
function mergeGroupMeshes(meshes, parent, cellOf){
  const U = THREE.BufferGeometryUtils; if (!U || !U.mergeBufferGeometries) return 0;
  parent.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert(), groups = new Map(), tmp = new THREE.Matrix4();
  for (const o of meshes){
    const mat = o.userData.pbrMat || o.material;
    const k = mat.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.name + '|' + o.renderOrder + '|' + (cellOf ? cellOf(o) : '');
    if (!groups.has(k)) groups.set(k, {mat, list:[]}); groups.get(k).list.push(o);
  }
  let saved = 0;
  for (const {mat, list} of groups.values()){
    if (list.length < 2) continue;
    const geos = [];
    for (const o of list){
      const src = o.geometry, g = src.index ? src.toNonIndexed() : src.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.morphAttributes = {}; g.clearGroups();
      g.applyMatrix4(tmp.multiplyMatrices(inv, o.matrixWorld)); geos.push(g);
    }
    const merged = U.mergeBufferGeometries(geos, false); geos.forEach(g => g.dispose());
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat); m.name = list[0].name; m.renderOrder = list[0].renderOrder;
    m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.userData.batched = true;
    parent.add(m); list.forEach(o => { o.userData.batchedInto = m; }); saved += list.length - 1;
  }
  return saved;
}
function batchableMesh(o){
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.children.length) return false;
  const mat = o.userData.pbrMat || o.material;
  if (!mat || Array.isArray(mat) || mat.vertexColors || mat.transparent && mat.depthWrite !== false) return false;
  if (o.matrixWorld.determinant() <= 0) return false;
  for (let q = o; q; q = q.parent) if (!q.visible) return false;
  return true;
}
function batchStaticScenery(){
  scene.updateMatrixWorld(true);
  const list = [];
  for (const r of STATIC_ROOTS) r.traverse(o => { if (o !== floor && batchableMesh(o)) list.push(o); });
  const saved = mergeGroupMeshes(list, scene, o => { const p = o.getWorldPosition(new V()); return Math.hypot(p.x, p.z) > 120 ? 'far' : Math.floor(p.x / 50) + ',' + Math.floor(p.z / 50); });
  list.forEach(o => { if (o.userData.batchedInto) o.visible = false; });
  return saved;
}

await loadStep(40, 'Silahlar hazırlanıyor');
// ================= Viewmodels =================
const gunMetal = pbrMat(GUNT.cerakote, {metalness:1});
const gunDark = pbrMat(GUNT.steel, {metalness:1});
const wood = pbrMat(GUNT.wood);
const polymer = pbrMat(GUNT.polymer);
const gloveMat = stdMat({color:C(0x1b1c1f), roughness:.78, normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.8, .8)});
const sleeveMat = stdMat({color:HSL(TEAM_HUE[0],30,30), roughness:.95, normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.7, .7)});
function vpart(g,w,h,d,x,y,z,mat){ const r = Math.min(.006, Math.min(w,h,d)*.22); const geo = THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w,h,d,2,r) : new THREE.BoxGeometry(w,h,d); const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); g.add(m); return m; }
function vcyl(g,r,len,x,y,z,mat,seg=20){ const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg), mat); m.rotation.x = Math.PI/2; m.position.set(x,y,z); g.add(m); return m; }
function limb(g, a, b, r, mat){
  const dir = new V().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r*.85, r, len, 10), mat);
  m.position.copy(a).addScaledVector(dir, .5); m.quaternion.setFromUnitVectors(new V(0,1,0), dir.normalize()); g.add(m); return m;
}
// ---- first-person hands: the right hand wraps the pistol grip, the left one supports the gun
// (under the handguard, on a vertical grip, or around the right hand on pistols); forearms run out of frame
const _hb = new THREE.Matrix4();
function blob(g, p, r, ax, ay, az, sx, sy, sz, mat){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 12, 9), mat || gloveMat);
  m.position.copy(p); m.quaternion.setFromRotationMatrix(_hb.makeBasis(ax, ay, az)); m.scale.set(sx, sy, sz); g.add(m); return m;
}
function finger(g, a, b, r){ r *= 1.12; limb(g, a, b, r, gloveMat); const t = new THREE.Mesh(new THREE.SphereGeometry(r * .9, 8, 6), gloveMat); t.position.copy(b); g.add(t); }
// sleeve and glove-cuff shapes are built once and shared by both arms of every gun
let _sleeveGeo = null, _cuffGeo = null;
function SLEEVE_GEO(){
  if (_sleeveGeo) return _sleeveGeo;
  const pts = [], L = .62, n = 34;
  pts.push(new THREE.Vector2(.0, -.004), new THREE.Vector2(.05, -.004), new THREE.Vector2(.057, .004));
  for (let i = 1; i <= n; i++){
    const t = i / n, y = .006 + t * L;
    const bunch = t < .28 ? Math.pow(Math.sin(t / .28 * Math.PI * 3.5), 2) * .006 * (1 - t / .28 * .5) : 0;
    const folds = Math.sin(t * 23 + 1.3) * .0022 * Math.min(1, t * 4) + Math.sin(t * 9.7) * .0015;
    pts.push(new THREE.Vector2(.058 + t * .012 + bunch + folds, y));
  }
  const g = new THREE.LatheGeometry(pts, 18);
  // a little asymmetric sag so it does not look turned on a lathe
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const k = 1 + Math.sin(a * 3 + y * 11) * .045 * Math.min(1, y * 6); p.setXYZ(i, x * k, y, z * k * .94); }
  g.computeVertexNormals();
  return (_sleeveGeo = g);
}
function CUFF_GEO(){
  if (_cuffGeo) return _cuffGeo;
  return (_cuffGeo = new THREE.LatheGeometry([[.0, -.006], [.036, -.006], [.039, -.002], [.039, .014], [.036, .018], [.0, .018]].map(([r, y]) => new THREE.Vector2(r, y)), 16));
}
const WRIST_MAT = stdMat({color:C(0x1f6fe6), roughness:.6});
function forearm(g, wrist, dir, watch){
  dir = dir.clone().normalize();
  const hem = wrist.clone().addScaledVector(dir, .035), elbow = wrist.clone().addScaledVector(dir, .62);
  limb(g, wrist.clone().addScaledVector(dir, -.012), hem.clone().addScaledVector(dir, .01), .034, gloveMat);   // gloved wrist
  // sleeve: a lathe with fabric folds (bunched near the cuff), widening towards the elbow
  { const m = new THREE.Mesh(SLEEVE_GEO(), sleeveMat); m.position.copy(hem); m.quaternion.setFromUnitVectors(new V(0, 1, 0), dir); g.add(m);
    const cuff = new THREE.Mesh(CUFF_GEO(), WRIST_MAT); cuff.position.copy(wrist).addScaledVector(dir, .012); cuff.quaternion.copy(m.quaternion); g.add(cuff); }
  if (watch){ const w = new THREE.Mesh(new THREE.BoxGeometry(.03, .014, .032), gunDark); w.position.copy(wrist).addScaledVector(dir, .02); w.position.y += .03; w.quaternion.setFromUnitVectors(new V(0, 0, -1), dir.clone().negate()); g.add(w); }
}
// hand wrapped round a (possibly raked) vertical grip; side = 1 for the right hand, -1 for the left
// finger centres sit one finger radius off the grip's surface (dim: grip width / depth / frame half-width above it)
function gripHand(g, c, tilt, side, armDir, watch, trigP, dim){
  dim = dim || {w:.036, d:.056};
  const u = new V(0, Math.cos(tilt), Math.sin(tilt)).normalize();          // up the grip
  const f = new V(0, 0, -1).addScaledVector(u, u.z).normalize();           // towards the front of the grip
  const r = new V(side, 0, 0), hw = dim.w / 2 + .0125, hd = dim.d / 2 + .0105, fw = Math.max(hw, (dim.fw || 0) + .012);
  const P = (x, y, z) => c.clone().addScaledVector(r, x).addScaledVector(u, y).addScaledVector(f, z);
  blob(g, P(hw + .012, -.004, -.006), .042, new V(1, 0, 0), u, f.clone().negate(), .5, 1.15, .95);               // palm on the side of the grip
  if (trigP){
    // trigger finger: along the frame, then curled through the guard onto the trigger face; pulled back when firing
    const tf = new THREE.Group(); tf.name = 'trigFinger'; g.add(tf); g.userData.trigFinger = tf;
    const kn = P(hw + .004, .03, hd * .5);
    const mid = new V(side * Math.max(.021, (dim.fw || 0) * .2 + .016), trigP.y + .006, trigP.z + .006), tip = new V(side * .004, trigP.y - .007, trigP.z - .009);
    limb(tf, kn, mid, .0118, gloveMat); const j = new THREE.Mesh(new THREE.SphereGeometry(.0112, 8, 6), gloveMat); j.position.copy(mid); tf.add(j);
    finger(tf, mid, tip, .0098);
  }
  for (let k = trigP ? 1 : 0; k < 4; k++){
    const y = .03 - k * .021, rr = .0105 - k * .0008;
    const a1 = P(hw + .002, y, hd * .45), a2 = P(hw * .45, y - .002, hd + .002), a3 = P(-hw * .55, y - .004, hd + .001), a4 = P(-hw - .001, y - .006, hd * .35);
    finger(g, a1, a2, rr); finger(g, a2, a3, rr * .97); finger(g, a3, a4, rr * .92);                               // knuckle, middle and tip joints
  }
  { const t1 = P(hw + .008, .032, -.016), t2 = P(fw + .003, .05, .004), t3 = P(fw + .001, .058, hd * .55); finger(g, t1, t2, .0118); finger(g, t2, t3, .0106); }  // thumb along the side, pointing forward
  forearm(g, P(hw + .015, -.05, -.028), armDir, watch);
}
// support hand cupping a handguard from below: fingers up the far side, thumb on the near side
function underHand(g, p, hw, armDir){
  blob(g, new V(p.x - .004, p.y - .019, p.z), .042, new V(1, 0, 0), new V(0, 1, 0), new V(0, 0, 1), 1.05, .5, 1.25);
  for (let k = 0; k < 4; k++){ const z = p.z - .032 + k * .02; finger(g, new V(p.x - hw * .5, p.y - .014, z), new V(p.x - hw - .007, p.y + .03, z - .004), .0105); }
  finger(g, new V(p.x + hw * .5, p.y - .012, p.z + .028), new V(p.x + hw + .007, p.y + .026, p.z - .012), .0115);
  forearm(g, new V(p.x - .012, p.y - .036, p.z + .05), armDir, true);
}
// support hand in a C-clamp on the handguard: palm on the near side, thumb over the top, fingers wrapped underneath
function clampHand(g, p, hw, hh, armDir){
  blob(g, new V(p.x - hw - .024, p.y - .006, p.z + .004), .042, new V(1, 0, 0), new V(0, 1, 0), new V(0, 0, 1), .5, 1.05, 1.3);
  { const t1 = new V(p.x - hw - .014, p.y + hh * .25, p.z + .034), t2 = new V(p.x - hw - .012, p.y + hh * .55, p.z + .0), t3 = new V(p.x - hw - .01, p.y + hh * .72, p.z - .03);
    finger(g, t1, t2, .0118); finger(g, t2, t3, .0106); }                                                         // thumb forward along the upper side
  for (let k = 0; k < 4; k++){
    const z = p.z - .036 + k * .021, rr = .0105 - k * .0006;
    const a1 = new V(p.x - hw - .011, p.y - hh * .3, z), a2 = new V(p.x - hw - .007, p.y - hh - .008, z - .002), a3 = new V(p.x + hw * .25, p.y - hh - .012, z - .004);
    finger(g, a1, a2, rr); finger(g, a2, a3, rr * .94);                                                              // wrapped round the lower corner, not through it
  }
  forearm(g, new V(p.x - hw - .03, p.y - .032, p.z + .055), armDir, true);
}
// pistol: the left hand closes over the right one from the other side
function cupHand(g, c, tilt, armDir, dim){
  dim = dim || {w:.045, d:.062};
  const u = new V(0, Math.cos(tilt), Math.sin(tilt)).normalize(), f = new V(0, 0, -1).addScaledVector(u, u.z).normalize(), hw = dim.w / 2 + .0125, hd = dim.d / 2 + .0105;
  const P = (x, y, z) => c.clone().add(new V(x, 0, 0)).addScaledVector(u, y).addScaledVector(f, z);
  blob(g, P(-hw - .02, -.01, .0), .042, new V(1, 0, 0), u, f.clone().negate(), .5, 1.1, .95);
  // fingers wrap the front of the grip over the shooting hand and curl back round its far side
  for (let k = 0; k < 3; k++){
    const y = .012 - k * .021, r = .0108 - k * .0006;
    const k1 = P(-hw - .012, y, hd * .5), k2 = P(-hw * .35, y - .003, hd + .021), k3 = P(hw * .55, y - .006, hd + .02);
    finger(g, k1, k2, r); finger(g, k2, k3, r * .92);
  }
  // thumb folded against the side of the frame, bent at the joint instead of pointing straight out
  { const fw = Math.max(hw, (dim.fw || 0) + .012), t1 = P(-hw - .016, .03, -.006), t2 = P(-fw - .006, .045, .012), t3 = P(-fw - .003, .052, .03); finger(g, t1, t2, .0118); finger(g, t2, t3, .0105); }
  forearm(g, P(-hw - .02, -.055, -.026), armDir, true);
}
const R_ARM = new V(.3, -.55, .62), L_ARM = new V(-.38, -.55, .58);
function arms(g, spec){
  const n0 = g.children.length, t0 = spec.tilt ?? -.3;
  // hand anchor: pistols are gripped high, the web of the hand up under the slide
  const hc = spec.handUp ? spec.grip.clone().add(new V(0, Math.cos(t0), Math.sin(t0)).multiplyScalar(spec.handUp)) : spec.grip;
  gripHand(g, hc, t0, 1, R_ARM, false, spec.trigP, spec.gdim);
  const n1 = g.children.length;
  if (spec.cup) cupHand(g, hc, t0, L_ARM, spec.gdim);
  else if (spec.vgrip) gripHand(g, spec.vgrip, spec.vtilt ?? 0, -1, L_ARM, true, null, spec.vdim);
  else if (spec.clamp) clampHand(g, spec.clamp, spec.hw, spec.hh, L_ARM);
  else underHand(g, spec.under, spec.hw, L_ARM);
  // the support hand lives in its own group so the reload can take it off the gun
  const lh = new THREE.Group(); g.children.slice(n1).forEach(o => { g.remove(o); lh.add(o); }); g.add(lh); g.userData.lhand = lh;
  for (let k = n0; k < g.children.length; k++) g.children[k].name = 'vmArm';
  return (spec.cup ? hc : spec.vgrip || spec.clamp || spec.under).clone();
}
// ================= Realistic gun models =================
// Each gun is built from side profiles extruded across the gun with rounded (multi-segment) bevels, lathed barrels,
// muzzle devices and optics, plus small machined parts (pins, levers, serrations, rails, screws). Coordinates: x across,
// y up, z forward is negative. Grip / handguard / sight positions match the hand rig and the aim-down-sight heights;
// each spec also carries the real grip size (gdim / vdim) so the fingers wrap the surface instead of cutting into it.
function GUNS_BUILD(M, lod){
  const RS = lod ? 24 : 9, CS = lod ? 10 : 3;
  const has = (g, o) => { g.add(o); return o; };
  const RB = (w, h, d, r) => (THREE.RoundedBoxGeometry && lod && r > 0) ? new THREE.RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) * .45)) : new THREE.BoxGeometry(w, h, d);
  function bx(g, w, h, d, x, y, z, mat, r = .002, rx = 0){ const m = has(g, new THREE.Mesh(RB(w, h, d, r), mat)); m.position.set(x, y, z); m.rotation.x = rx; return m; }
  // side profile [z, y] (with ['q', cz, cy, z, y] / ['c', ...] curves) extruded across x
  function prof(g, pts, w, mat, o = {}){
    const sh = new THREE.Shape(); let first = true;
    for (const p of pts){
      if (p[0] === 'q') sh.quadraticCurveTo(-p[1], p[2], -p[3], p[4]);
      else if (p[0] === 'c') sh.bezierCurveTo(-p[1], p[2], -p[3], p[4], -p[5], p[6]);
      else if (first){ sh.moveTo(-p[0], p[1]); first = false; } else sh.lineTo(-p[0], p[1]);
    }
    if (o.holes) for (const hp of o.holes){ const h = new THREE.Path(); let f2 = true; for (const p of hp){ if (p[0] === 'q') h.quadraticCurveTo(-p[1], p[2], -p[3], p[4]); else if (f2){ h.moveTo(-p[0], p[1]); f2 = false; } else h.lineTo(-p[0], p[1]); } sh.holes.push(h); }
    const bev = lod ? (o.bev ?? Math.min(.0045, w * .18)) : 0;
    const depth = Math.max(.0005, w - bev * 2);
    const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled:bev > 0, bevelThickness:bev, bevelSize:bev, bevelOffset:-bev, bevelSegments:o.bseg || 3, curveSegments:CS, steps:1});
    geo.translate(0, 0, -depth / 2); geo.rotateY(Math.PI / 2);
    { const uv = geo.attributes.uv, k = o.uv ?? 7; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k); }   // extrude UVs are in metres
    const m = has(g, new THREE.Mesh(geo, mat)); m.position.x = o.x || 0; return m;
  }
  // cylinder along z (rf: radius at the front end)
  function tube(g, rf, rb, z0, z1, y, mat, o = {}){
    const len = Math.abs(z1 - z0), geo = new THREE.CylinderGeometry(rf, rb, len, o.seg || RS, 1, !!o.open);
    geo.rotateX(-Math.PI / 2);
    const m = has(g, new THREE.Mesh(geo, mat)); m.position.set(o.x || 0, y, (z0 + z1) / 2); return m;
  }
  // lathe around the bore: pts [[r, z], …]
  function lathe(g, pts, y, mat, o = {}){
    const geo = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(Math.max(r, .0001), -z)), o.seg || RS);
    geo.rotateX(-Math.PI / 2);
    const m = has(g, new THREE.Mesh(geo, mat)); m.position.set(o.x || 0, y, 0); return m;
  }
  // upright lathe (vertical grips): pts [[r, y], …] around a vertical axis at (x, z)
  function vlathe(g, pts, x, z, mat){ const m = has(g, new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, .0001), y)), RS), mat)); m.position.set(x, 0, z); return m; }
  // pistol grip round an anchor, raked by `tilt`; finger grooves at the front, palm swell at the back
  let lastGrip = null;
  function grip(g, c, tilt, len, dep, w, mat, o = {}){
    const uz = Math.sin(tilt), uy = Math.cos(tilt), fz = -Math.cos(tilt), fy = Math.sin(tilt);
    const P = (a, b) => [c.z + fz * a + uz * b, c.y + fy * a + uy * b];
    const top = len * (o.top ?? .72), bot = -len * .5, pts = [];
    const n = lod ? 16 : 5;
    pts.push(P(-dep * .5 + .005, bot + .002));
    for (let i = 1; i < n; i++){ const t = i / n, b = bot + (top - bot) * t; pts.push(P(-dep * .5 - .004 * Math.sin(t * Math.PI) - (o.tail ?? 0) * Math.max(0, (t - .8) / .2), b)); }   // palm swell
    pts.push(P(-dep * .5 + (o.tail ?? .0), top));
    pts.push(P(dep * .5, top));
    for (let i = 0; i <= n; i++){
      const t = i / n, b = top * .82 + (bot + .008 - top * .82) * t;
      const groove = o.smooth ? 0 : Math.pow(Math.abs(Math.sin(t * Math.PI * 3)), 1.5) * .0045;
      pts.push(P(dep * .5 + .003 - groove, b));
    }
    pts.push(P(dep * .5 - .006, bot)); pts.push(P(0, bot - .004));
    lastGrip = {w, d:dep};
    return prof(g, pts, w, mat, {bev:Math.min(.008, w * .24), bseg:4});
  }
  function rail(g, y, z0, z1, w, mat){
    bx(g, w, .006, z1 - z0, 0, y + .003, (z0 + z1) / 2, mat, .001);
    if (!lod) return;
    for (let z = z0 + .005; z < z1 - .003; z += .01) bx(g, w + .004, .005, .0052, 0, y + .0085, z, mat, .0008);
  }
  function slots(g, x, y, z0, z1, n, h, l, mat){ for (let i = 0; i < n; i++){ const z = z0 + (z1 - z0) * (i + .5) / n; for (const s of [-1, 1]) bx(g, .002, h, l, s * x, y, z, mat, .0008); } }
  function serr(g, n, x, y, z0, step, h, mat){ if (!lod) return; for (let i = 0; i < n; i++) for (const s of [-1, 1]) bx(g, .0022, h, .0028, s * x, y, z0 + i * step, mat, .0006); }
  function pinX(g, x, y, z, r, mat){ const m = has(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r, .003, 12), mat)); m.rotation.z = Math.PI / 2; m.position.set(x, y, z); return m; }
  function screw(g, x, y, z, r, mat){ if (!lod) return; pinX(g, x, y, z, r, mat); bx(g, .0035, r * .35, r * 1.5, x + Math.sign(x) * .0005, y, z, M.port, .0002); }
  // trigger blade (own mesh: it is animated) and a squared, moulded trigger guard
  let lastTrig = null;
  function trig(g, y, z, mat, guardMat, gr = .026){
    const blade = new THREE.Shape(); const s = gr / .026;
    blade.moveTo(.004, .008); blade.lineTo(-.002, .008); blade.quadraticCurveTo(-.007 * s, -.006 * s, -.001, -.022 * s); blade.lineTo(.003, -.021 * s); blade.quadraticCurveTo(-.001, -.007 * s, .004, .008);
    const bg = new THREE.ExtrudeGeometry(blade, {depth:.005, bevelEnabled:!!lod, bevelThickness:.0008, bevelSize:.0008, bevelSegments:1, curveSegments:lod ? 6 : 2});
    bg.translate(0, 0, -.0025); bg.rotateY(Math.PI / 2);
    const t = has(g, new THREE.Mesh(bg, mat)); t.position.set(0, y + .004, z); t.rotation.x = .35; lastTrig = t;
    const zb = z - .004 + gr + .003, zf = z - .004 - gr - .004, yt = y + .014, yb = y + .006 - gr - .004;
    prof(g, [[zb, yt], [zb, yb + .01], ['q', zb, yb, zb - .01, yb], [zf + .014, yb], ['q', zf, yb, zf, yb + .016], [zf - .002, yt]], .011, guardMat || mat,
      {bev:.0025, bseg:2, holes:[[[zb - .005, yt - .004], [zb - .005, yb + .011], ['q', zb - .005, yb + .005, zb - .012, yb + .005], [zf + .014, yb + .005], ['q', zf + .006, yb + .005, zf + .006, yb + .014], [zf + .005, yt - .004]]]});
  }
  // back = the eyepiece end, facing the shooter (+z); otherwise the objective, facing forward
  function lens(g, r, y, z, mat, back, x = 0){ const m = has(g, new THREE.Mesh(new THREE.CircleGeometry(r, RS), mat)); m.position.set(x, y, z); if (!back) m.rotation.y = Math.PI; return m; }
  // scope ring around the tube at z (two halves and a pair of cap screws)
  function ring(g, z, y, r, mat, base){
    lathe(g, [[r + .0005, z + .009], [r + .004, z + .008], [r + .0045, z], [r + .004, z - .008], [r + .0005, z - .009]], y, mat);
    if (base) bx(g, .026, y - r - base, .018, 0, (y - r + base) / 2, z, mat, .002);
    if (lod) for (const s of [-1, 1]) screw(g, s * (r + .0045), y + .001, z, .0028, mat);
  }
  const out = [];
  const push = (g, mz, spec, extra) => { if (lastGrip && !spec.gdim) spec.gdim = lastGrip; out.push(Object.assign({g, mz, spec, trig:lastTrig}, extra || {})); lastTrig = null; lastGrip = null; };
  let g;

  // ---------- 0 pistol: polymer striker pistol, steel slide with rounded top and serrations, accessory rail, tritium sights
  g = new THREE.Group(); let sl = has(g, new THREE.Group());                                                        // the slide cycles on every shot
  prof(sl, [[.125,.052],[.125,.091],[.119,.1],[-.156,.1],[-.168,.095],[-.173,.085],[-.173,.06],[-.166,.052]], .05, M.metal, {bev:.0075, bseg:4});  // slide
  serr(sl, 7, .0255, .076, .068, .0075, .03, M.port);                                                                // rear cocking serrations
  serr(sl, 5, .0255, .076, -.152, .0075, .026, M.port);                                                              // front serrations
  bx(sl, .021, .003, .05, .009, .1005, -.008, M.port, .0008);                                                        // ejection port
  bx(sl, .0022, .006, .022, .0258, .086, -.032, M.dark, .0006);                                                       // extractor
  bx(sl, .007, .01, .009, 0, .105, -.148, M.dark, .0015);                                                            // front sight blade
  for (const s of [-1, 1]) bx(sl, .011, .011, .012, s * .0115, .1045, .108, M.dark, .0015);                          // rear sight ears
  bx(sl, .035, .005, .014, 0, .1012, .108, M.dark, .001);
  lens(sl, .0058, .074, -.1735, M.port, false);                                                                      // muzzle
  bx(g, .019, .003, .044, .0075, .0985, -.008, M.dark2, .0006);                                                      // barrel hood showing in the port
  tube(g, .0072, .0072, -.165, -.174, .032, M.dark);                                                                 // recoil spring guide
  prof(g, [[.128,.053],[-.168,.053],[-.171,.034],[-.165,.023],[.004,.022],[.05,.012],[.128,.0]], .046, M.poly, {bev:.006, bseg:3});   // frame and dust cover
  if (lod) for (let i = 0; i < 3; i++) bx(g, .042, .004, .007, 0, .0215, -.152 + i * .02, M.port, .0005);            // rail cross-slots
  slots(g, .0232, .032, -.15, -.09, 3, .006, .012, M.port);
  bx(g, .003, .006, .034, .0242, .049, -.006, M.dark, .001);                                                         // slide stop lever
  bx(g, .003, .004, .012, .0242, .043, -.044, M.dark, .001);                                                         // takedown lever
  grip(g, new THREE.Vector3(0, -.062, .082), -.25, .118, .062, .045, M.poly, {tail:-.01});
  prof(g, [[.112,.006],[.14,-.001],[.145,-.01],[.128,-.014],[.108,-.008]], .04, M.poly, {bev:.006});                 // beavertail
  const pMag = has(g, new THREE.Group());
  bx(pMag, .036, .108, .044, 0, -.064, .084, M.dark, .002, -.25);                                                   // magazine body (inside the grip)
  bx(pMag, .049, .013, .07, 0, -.124, .097, M.dark, .004, -.25);                                                    // magazine base pad
  trig(g, -.004, .032, M.dark, M.poly, .021);
  push(g, -.2, {grip:new THREE.Vector3(0,-.062,.082), tilt:-.25, cup:true, handUp:.026, gdim:{w:.045, d:.062, fw:.023}}, {slide:sl, mag:pMag, sights:[[0,.108,-.1435],[.0085,.106,.1145],[-.0085,.106,.1145]]});

  // ---------- 1 heavy pistol: big stainless slide, fluted barrel section, ribbed sight rail, exposed hammer
  g = new THREE.Group(); sl = has(g, new THREE.Group());
  prof(sl, [[.15,.044],[.15,.09],[.142,.097],[-.232,.097],[-.244,.089],[-.246,.06],[-.244,.046],[-.11,.04],[-.11,.044]], .058, M.silver, {bev:.007, bseg:4});
  bx(sl, .026, .007, .37, 0, .1, -.045, M.dark, .002);                                                               // sight rib
  if (lod) for (let i = 0; i < 16; i++) bx(sl, .027, .002, .0025, 0, .1036, -.215 + i * .02, M.port, .0004);         // rib grooves
  serr(sl, 8, .0295, .07, .09, .0075, .034, M.dark);
  for (const s of [-1, 1]) bx(sl, .002, .011, .2, s * .0294, .066, -.13, M.dark, .0008);                             // barrel flutes
  lens(sl, .0105, .07, -.2465, M.port, false);
  for (const s of [-1, 1]) bx(sl, .005, .012, .022, s * .031, .084, .132, M.dark, .002);                             // ambidextrous safety
  prof(g, [[.135,.045],[-.105,.045],[-.108,.03],[-.1,.022],[.0,.016],[.07,.0],[.135,.0]], .052, M.dark, {bev:.006});
  grip(g, new THREE.Vector3(0, -.066, .092), -.22, .128, .068, .052, M.poly, {tail:-.012});
  const hMag = has(g, new THREE.Group());
  bx(hMag, .04, .118, .05, 0, -.07, .094, M.dark, .002, -.22);
  bx(hMag, .055, .013, .076, 0, -.134, .108, M.dark, .004, -.22);
  prof(g, [[.15,.038],[.162,.046],[.171,.066],[.166,.073],[.157,.058],[.146,.05]], .012, M.dark, {bev:.002});         // hammer spur
  trig(g, -.006, .036, M.dark, M.dark, .022);
  pinX(g, .0265, .02, .07, .005, M.dark); pinX(g, -.0265, .02, .07, .005, M.dark); screw(g, .027, -.01, .1, .004, M.dark); screw(g, -.027, -.01, .1, .004, M.dark);
  bx(sl, .009, .014, .01, 0, .108, -.195, M.dark, .001); for (const s of [-1, 1]) bx(sl, .012, .012, .012, s * .012, .105, .128, M.dark, .0015);
  push(g, -.25, {grip:new THREE.Vector3(0,-.066,.092), tilt:-.22, cup:true, handUp:.028, gdim:{w:.052, d:.068, fw:.03}}, {slide:sl, mag:hMag, sights:[[0,.1,-.1895],[.0095,.099,.1345],[-.0095,.099,.1345]]});

  // ---------- 2 SMG: round-top receiver, tropical handguard, three-lug muzzle, curved ribbed magazine, ribbed foregrip, micro dot
  g = new THREE.Group();
  prof(g, [[.13,-.02],[.13,.026],[-.19,.026],[-.19,-.02]], .052, M.metal, {bev:.005});
  tube(g, .026, .026, .13, -.19, .024, M.metal);                                                                    // round top of the receiver
  lathe(g, [[.0,.142],[.02,.142],[.026,.136],[.026,.13]], .024, M.metal);                                           // rear end cap
  tube(g, .014, .014, -.12, -.31, .052, M.metal);                                                                    // cocking tube
  lathe(g, [[.016,-.296],[.019,-.3],[.019,-.312],[.0,-.316]], .052, M.dark);                                        // front sight hood
  prof(g, [[-.12,.034],[-.29,.034],['q',-.305,.034,-.305,.018],[-.305,-.026],['q',-.305,-.044,-.288,-.044],[-.12,-.044]], .062, M.poly, {bev:.012, bseg:4});   // handguard
  slots(g, .032, -.004, -.14, -.28, 5, .022, .012, M.port);
  tube(g, .0105, .0105, -.305, -.33, .0, M.dark);
  lathe(g, [[.0,-.326],[.012,-.326],[.014,-.329],[.014,-.34],[.0155,-.342],[.0155,-.346],[.011,-.348],[.0,-.348]], .0, M.dark);   // three-lug muzzle
  if (lod) for (let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2 + .5; bx(g, .005, .005, .01, Math.cos(a) * .0145, Math.sin(a) * .0145, -.334, M.dark, .001); }
  const smgMag = has(g, new THREE.Group());
  prof(smgMag, [[-.088,-.02],[-.142,-.02],['q',-.15,-.14,-.188,-.236],[-.152,-.248],['q',-.1,-.14,-.088,-.02]], .042, M.dark, {bev:.004});
  bx(smgMag, .046, .012, .046, 0, -.244, -.171, M.dark, .003, -.62);                                                // floor plate
  prof(g, [[.1,-.02],[-.02,-.02],[-.03,-.048],[.09,-.052]], .044, M.poly, {bev:.005});                              // trigger housing
  grip(g, new THREE.Vector3(0, -.09, .08), -.3, .13, .058, .04, M.poly);
  trig(g, -.07, .035, M.dark, M.poly);
  { const sel = bx(g, .004, .007, .026, -.024, -.03, .055, M.dark, .0015); sel.rotation.x = .4; pinX(g, -.0235, -.03, .056, .006, M.dark); }  // selector
  bx(g, .016, .01, .014, 0, -.025, -.086, M.dark, .002);                                                            // mag release paddle
  for (const s of [-1, 1]) tube(g, .006, .006, .13, .37, .0, M.dark, {x:s * .028});
  prof(g, [[.36,.044],[.392,.05],['q',.402,-.005,.392,-.058],[.36,-.052]], .075, M.poly, {bev:.01});                    // butt plate
  bx(g, .066, .095, .008, 0, -.004, .399, M.rubber, .003);
  // ribbed vertical foregrip
  vlathe(g, [[.0,-.163],[.02,-.163],[.023,-.156],[.023,-.148],[.019,-.14],[.021,-.13],[.02,-.12],[.021,-.108],[.02,-.096],[.021,-.084],[.019,-.074],[.016,-.064],[.016,-.044],[.022,-.042],[.0,-.04]], 0, -.2, M.poly);
  rail(g, .05, -.15, .06, .028, M.dark);
  bx(g, .03, .012, .045, 0, .062, -.05, M.dark, .002);                                                              // optic mount
  tube(g, .021, .021, -.02, -.08, .1, M.metal, {open:!!lod});
  lathe(g, [[.021,-.017],[.024,-.02],[.024,-.03],[.022,-.032]], .1, M.dark); lathe(g, [[.022,-.07],[.024,-.072],[.024,-.082],[.021,-.084]], .1, M.dark);
  bx(g, .014, .03, .02, 0, .08, -.05, M.metal, .002);
  bx(g, .005, .008, .012, -.033, .055, -.24, M.dark, .001);                                                          // cocking handle
  if (lod) for (const z of [.11, -.17]) { const lp = has(g, new THREE.Mesh(new THREE.TorusGeometry(.007, .0016, 6, 14), M.dark)); lp.position.set(-.03, .03, z); lp.rotation.y = Math.PI / 2; }   // sling loops
  push(g, -.348, {grip:new THREE.Vector3(0,-.09,.08), vgrip:new THREE.Vector3(0,-.07,-.2), vtilt:0, vdim:{w:.044, d:.044}}, {mag:smgMag, dot:[0,.1,-.079], glass:[.019,.1,-.081,-.021]});

  // ---------- 3 assault rifle: flat-top upper, flared magwell, octagonal free-float handguard, ribbed magazine, SOPMOD stock, red dot on a riser
  g = new THREE.Group();
  prof(g, [[.17,.0],[.17,.05],[.16,.056],[-.215,.056],[-.215,.0]], .058, M.metal, {bev:.0055});                      // upper
  prof(g, [[.17,.0],[.17,-.03],[.15,-.052],[.0,-.052],[-.02,-.04],[-.15,-.04],[-.15,.0]], .054, M.metal, {bev:.005});   // lower
  prof(g, [[-.026,-.025],[-.03,-.086],[-.04,-.092],[-.142,-.092],[-.15,-.086],[-.152,-.025]], .059, M.metal, {bev:.006});  // flared magwell
  rail(g, .056, -.21, .16, .03, M.dark);
  bx(g, .022, .003, .07, .029, .028, -.035, M.port, .001);                                                            // ejection port
  const bcg = has(g, new THREE.Group()); bx(bcg, .003, .018, .06, .0285, .028, -.035, M.dark2, .001);              // bolt carrier behind the port
  lathe(g, [[.0,.005],[.009,.005],[.009,-.012],[.0,-.012]], .03, M.dark, {x:.032});                                  // forward assist
  bx(g, .05, .012, .02, 0, .045, .17, M.dark, .003); bx(g, .012, .008, .016, -.026, .045, .168, M.dark, .002);        // charging handle + latch
  const rMag = has(g, new THREE.Group());
  prof(rMag, [[-.045,-.072],[-.136,-.072],['q',-.148,-.17,-.19,-.262],[-.122,-.275],['q',-.085,-.17,-.045,-.072]], .05, M.dark, {bev:.005});
  if (lod) for (let i = 0; i < 5; i++){ const t = .12 + i * .16; for (const s of [-1, 1]) bx(rMag, .002, .006, .07, s * .0252, -.09 - t * .17, -.096 - t * .048, M.dark2, .0008, -.15 - t * .28); }   // grip ribs
  bx(rMag, .056, .013, .076, 0, -.27, -.16, M.dark, .004, -.42);
  prof(g, [[-.21,.045],[-.53,.045],[-.535,.035],[-.535,-.035],[-.525,-.045],[-.21,-.045]], .08, M.metal, {bev:.014, bseg:4}); // handguard
  slots(g, .041, -.008, -.25, -.5, 5, .012, .028, M.port);
  if (lod) for (let i = 0; i < 4; i++) bx(g, .02, .004, .028, 0, -.0455, -.26 - i * .065, M.port, .001);               // underside M-LOK slots
  rail(g, .045, -.52, -.215, .028, M.dark);
  lathe(g, [[.0115,-.53],[.0115,-.62],[.0105,-.63],[.0105,-.74]], .01, M.dark);                                    // stepped barrel
  lathe(g, [[.0,-.735],[.0165,-.735],[.0175,-.74],[.0175,-.8],[.014,-.802],[.0,-.802]], .01, M.dark);                // flash hider
  for (let i = 0; i < 4; i++){ const a = i / 4 * Math.PI * 2 + Math.PI / 4; bx(g, .003, .003, .04, Math.cos(a) * .0175, .01 + Math.sin(a) * .0175, -.778, M.port, .0005); }
  lens(g, .006, .01, -.8025, M.port, false);
  if (lod){ const qd = has(g, new THREE.Mesh(new THREE.TorusGeometry(.009, .002, 6, 16), M.dark)); qd.position.set(-.042, -.02, -.5); qd.rotation.y = Math.PI / 2; }
  grip(g, new THREE.Vector3(0, -.09, .1), -.3, .13, .056, .036, M.poly, {tail:-.006});
  trig(g, -.075, .055, M.dark);
  tube(g, .017, .017, .17, .42, .022, M.dark);                                                                      // buffer tube
  lathe(g, [[.018,.168],[.022,.17],[.022,.185],[.018,.188]], .022, M.dark);                                         // castle nut
  prof(g, [[.25,.046],[.29,.06],[.44,.064],[.462,.055],[.462,-.058],[.452,-.068],[.41,-.064],[.34,-.034],[.29,-.01],[.25,-.004]], .05, M.poly, {bev:.009, bseg:4});  // stock
  bx(g, .056, .126, .018, 0, -.002, .47, M.rubber, .005);
  // red dot on a riser: the dot sits on the aiming line
  prof(g, [[.0,.062],[.0,.11],[-.012,.127],[-.068,.127],[-.08,.11],[-.08,.062]], .03, M.dark, {bev:.004});           // riser up to the sight body
  tube(g, .026, .026, .004, -.098, .15, M.metal2, {open:!!lod});
  lathe(g, [[.026,.004],[.0295,.0],[.0295,-.016],[.027,-.019]], .15, M.dark); lathe(g, [[.027,-.083],[.0295,-.086],[.0295,-.1],[.026,-.103]], .15, M.dark);
  { const tu = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .014, 12), M.dark)); tu.position.set(0, .181, -.05);
    const tu2 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .014, 12), M.dark)); tu2.rotation.z = Math.PI / 2; tu2.position.set(.031, .15, -.05); }
  pinX(g, .03, -.03, .05, .004, M.dark); pinX(g, -.03, -.03, .05, .004, M.dark); pinX(g, .03, -.03, -.1, .004, M.dark);
  if (lod){
    bx(g, .01, .022, .022, .033, .038, .012, M.metal, .003);                                                         // brass deflector
    tube(g, .0022, .0022, -.072, .002, .014, M.dark, {x:.031, seg:6});                                                // dust-cover hinge rod
    pinX(g, .03, -.036, -.03, .0065, M.dark);                                                                         // magazine release
    bx(g, .006, .028, .014, .029, -.036, -.03, M.metal, .002);                                                        //   and its fence
    bx(g, .004, .03, .012, -.03, -.018, -.022, M.dark, .0015);                                                        // bolt catch
    { const sel = bx(g, .004, .008, .028, -.031, -.012, .088, M.dark, .002); sel.rotation.x = -.5; pinX(g, -.03, -.012, .085, .006, M.dark); } // selector
    bx(g, .026, .014, .034, 0, .069, .128, M.dark, .002); bx(g, .02, .006, .02, 0, .079, .124, M.dark, .001);        // folded rear sight
    bx(g, .022, .013, .03, 0, .058, -.5, M.dark, .002);                                                               // folded front sight
    bx(g, .014, .01, .03, 0, -.004, .31, M.dark, .002);                                                               // stock adjustment lever
    for (let i = 0; i < 6; i++) bx(g, .014, .003, .006, 0, .041, .2 + i * .035, M.dark, .0008);                      // buffer tube position notches
  }
  push(g, -.8, {grip:new THREE.Vector3(0,-.09,.1), clamp:new THREE.Vector3(0,0,-.27), hw:.04, hh:.045, gdim:{w:.036, d:.056, fw:.027}}, {bcg, mag:rMag, dot:[0,.15,-.094], glass:[.024,.15,-.096,.002]});

  // ---------- 4 marksman rifle: tan receiver, side rails, reciprocating charging handle, magnified optic in rings, muzzle brake, folding stock
  g = new THREE.Group();
  prof(g, [[.2,.0],[.2,.045],[.19,.052],[-.24,.052],[-.24,.0]], .062, M.tan, {bev:.006});
  prof(g, [[.2,.0],[.2,-.03],[.17,-.055],[-.07,-.055],[-.075,-.07],[-.175,-.07],[-.18,-.04],[-.185,.0]], .058, M.tan, {bev:.006});
  rail(g, .052, -.24, .19, .03, M.dark);
  bx(g, .022, .003, .075, .031, .025, -.04, M.port, .001);
  const bcg4 = has(g, new THREE.Group()); bx(bcg4, .003, .018, .065, .0305, .025, -.04, M.dark2, .001);
  const ch4 = has(g, new THREE.Group()); bx(ch4, .016, .012, .014, -.036, .03, -.14, M.dark, .002); bx(ch4, .004, .008, .05, -.03, .03, -.12, M.dark, .001); // reciprocating side charging handle
  const dMag = has(g, new THREE.Group());
  prof(dMag, [[-.075,-.068],[-.172,-.068],[-.178,-.188],[-.076,-.19]], .052, M.dark, {bev:.004});
  bx(dMag, .058, .011, .108, 0, -.195, -.127, M.dark, .003);
  if (lod) for (let i = 0; i < 4; i++) for (const s of [-1, 1]) bx(dMag, .002, .1, .004, s * .027, -.13, -.09 - i * .022, M.port, .0006);
  prof(g, [[-.24,.0425],[-.57,.0425],[-.575,.03],[-.575,-.032],[-.565,-.0425],[-.24,-.0425]], .075, M.tan, {bev:.012, bseg:4});
  slots(g, .038, -.006, -.27, -.55, 6, .012, .026, M.port);
  if (lod) for (const s of [-1, 1]) { bx(g, .006, .012, .1, s * .039, .012, -.5, M.dark, .001); for (let z = -.545; z < -.455; z += .01) bx(g, .008, .014, .0045, s * .0392, .012, z, M.dark, .0005); }   // short side rails
  lathe(g, [[.0145,-.575],[.0145,-.66],[.0132,-.67],[.0132,-.88]], .01, M.dark);
  lathe(g, [[.0,-.875],[.02,-.875],[.021,-.88],[.021,-.958],[.017,-.962],[.0,-.962]], .01, M.dark);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) bx(g, .003, .012, .012, s * .021, .01, -.9 - i * .02, M.port, .001);
  lens(g, .0075, .01, -.9625, M.port, false);
  grip(g, new THREE.Vector3(0, -.09, .12), -.3, .13, .056, .037, M.poly, {tail:-.006});
  trig(g, -.075, .075, M.dark);
  bx(g, .05, .05, .03, 0, .02, .215, M.dark, .004);                                                                  // stock hinge
  prof(g, [[.2,.05],[.46,.06],[.485,.05],[.485,-.08],[.47,-.09],[.39,-.085],[.31,-.04],[.2,-.03]], .052, M.tan, {bev:.008, bseg:4, holes:[[[.27,.0],[.38,.012],[.38,-.03],[.33,-.04],[.27,-.02]]]});
  bx(g, .056, .15, .018, 0, -.016, .492, M.rubber, .005);
  bx(g, .044, .018, .14, 0, .07, .37, M.poly, .007);                                                                 // cheek riser
  // magnified optic in rings
  for (const z of [.0, -.13]) ring(g, z, .1, .0285, M.dark, .056);
  lathe(g, [[.026,.1],[.031,.096],[.033,.07],[.028,.055],[.028,-.17],[.034,-.19],[.038,-.235],[.034,-.24]], .1, M.dark2);
  if (lod) for (let i = 0; i < 8; i++) bx(g, .0024, .004, .012, .0315 * Math.cos(i / 8 * Math.PI * 2), .1 + .0315 * Math.sin(i / 8 * Math.PI * 2), .082, M.dark, .0006);   // magnification ring grip
  tube(g, .0105, .0105, -.06, -.06, .13, M.dark);
  { const t1 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .022, 16), M.dark)); t1.position.set(0, .137, -.06);
    const t2 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .022, 16), M.dark)); t2.rotation.z = Math.PI / 2; t2.position.set(.037, .1, -.06); }
  lens(g, .031, .1, -.236, M.lens, false); lens(g, .025, .1, .098, M.lensDark, true);
  push(g, -.96, {grip:new THREE.Vector3(0,-.09,.12), clamp:new THREE.Vector3(0,0,-.35), hw:.0375, hh:.0425, gdim:{w:.037, d:.056, fw:.031}}, {mag:dMag, bcg:bcg4, chandle:ch4});

  // ---------- 5 pump shotgun: rounded steel receiver, vent rib with bead, ringed pump around the magazine tube, side saddle, wooden stock
  g = new THREE.Group();
  prof(g, [[.2,-.048],[.2,.04],[.188,.05],[-.096,.05],[-.105,.04],[-.105,-.048]], .056, M.metal, {bev:.009, bseg:4});
  bx(g, .002, .028, .075, .029, .012, .05, M.port, .001);                                                          // ejection port
  bx(g, .03, .004, .07, 0, -.0495, .06, M.port, .001);                                                              // loading port underneath
  tube(g, .021, .021, -.1, -.655, .022, M.metal);
  lathe(g, [[.0,-.65],[.023,-.65],[.023,-.662],[.019,-.664],[.0,-.664]], .022, M.dark);
  lens(g, .012, .022, -.6645, M.port, false);
  tube(g, .019, .019, -.1, -.585, -.024, M.metal);
  lathe(g, [[.0,-.58],[.021,-.58],[.022,-.6],[.016,-.606],[.0,-.606]], -.024, M.dark);
  bx(g, .016, .005, .55, 0, .048, -.37, M.dark, .001);
  if (lod) for (let i = 0; i < 9; i++) bx(g, .006, .005, .008, 0, .043, -.13 - i * .06, M.dark, .0008);
  bx(g, .014, .016, .02, 0, .036, -.64, M.metal, .002);
  bx(g, .02, .02, .016, 0, .0, -.585, M.metal, .002);                                                               // barrel band onto the magazine tube
  { const bead = has(g, new THREE.Mesh(new THREE.SphereGeometry(.0055, 12, 9), M.gold)); bead.position.set(0, .058, -.645);
    const mid = has(g, new THREE.Mesh(new THREE.SphereGeometry(.0035, 10, 8), M.silver)); mid.position.set(0, .055, -.28); }
  const pump = has(g, new THREE.Group());                                                                         // the forend slides on the magazine tube
  { const pts = [[.024,-.205],[.033,-.212],[.037,-.222]]; const n = lod ? 9 : 3;
    for (let i = 0; i < n; i++){ const z0 = -.232 - i * (.18 / n); pts.push([.037, z0], [.0335, z0 - .006], [.037, z0 - .012]); }
    pts.push([.037, -.418], [.033, -.428], [.024, -.434]);
    lathe(pump, pts, -.03, M.wood); }
  for (const s of [-1, 1]) bx(pump, .003, .006, .16, s * .03, -.002, -.14, M.dark, .001);                       // action bars into the receiver
  grip(g, new THREE.Vector3(0, -.09, .15), -.3, .13, .06, .042, M.wood, {smooth:true, tail:-.004});
  prof(g, [[.195,.012],[.26,.0],[.36,-.006],[.52,-.018],[.528,-.028],[.528,-.15],[.5,-.156],[.33,-.088],[.25,-.066],[.2,-.058]], .046, M.wood, {bev:.012, bseg:4});
  bx(g, .052, .132, .022, 0, -.088, .538, M.rubber, .007); bx(g, .049, .128, .004, 0, -.087, .526, M.woodDark, .001);   // recoil pad + spacer
  trig(g, -.07, .1, M.dark, M.metal);
  if (lod) pinX(g, .0, -.044, .085, .0045, M.dark).rotation.set(0, 0, Math.PI / 2);                               // cross-bolt safety
  for (let i = 0; i < 4; i++){ tube(g, .012, .012, .085 + i * .028 - .024, .085 + i * .028 + .024, .0, M.shell, {x:.045, seg:12});
    tube(g, .0125, .0125, .085 + i * .028 + .02, .085 + i * .028 + .026, .0, M.brass, {x:.045, seg:12}); }
  bx(g, .006, .036, .12, .036, .0, .127, M.dark, .002);                                                           // side saddle plate
  pinX(g, .029, -.0, .09, .004, M.dark); pinX(g, .029, -.0, .0, .004, M.dark);
  push(g, -.66, {grip:new THREE.Vector3(0,-.09,.15), clamp:new THREE.Vector3(0,-.03,-.3), hw:.0375, hh:.037, gdim:{w:.042, d:.06, fw:.028}}, {pump});

  // ---------- 6 light machine gun: riveted receiver, feed cover with latch, belt box and linked rounds, heat shield, gas tube, folded bipod
  g = new THREE.Group();
  prof(g, [[.22,-.06],[.22,.05],[.2,.068],[-.26,.068],[-.26,-.06]], .088, M.metal, {bev:.008, bseg:3});
  prof(g, [[.16,.068],[.16,.092],[.14,.1],[-.2,.1],[-.21,.085],[-.21,.068]], .08, M.dark, {bev:.006});                         // feed cover
  if (lod){ for (let i = 0; i < 4; i++) bx(g, .082, .003, .006, 0, .1, -.16 + i * .07, M.dark2, .001);                    // cover ribs
    bx(g, .03, .012, .02, 0, .095, .163, M.dark, .003);                                                                // cover latch
    for (const s of [-1, 1]) for (const z of [.18, .1, -.08, -.22]) for (const y of [-.045, .055]) pinX(g, s * .045, y, z, .0035, M.dark2); }   // rivets
  rail(g, .1, -.17, .12, .03, M.dark);
  bx(g, .002, .022, .09, .045, .02, -.03, M.port, .001);
  bx(g, .012, .012, .03, .05, .015, -.16, M.dark, .002);                                                             // charging handle
  prof(g, [[-.26,.035],[-.48,.035],[-.49,.02],[-.49,-.035],[-.48,-.045],[-.26,-.045]], .074, M.poly, {bev:.012, bseg:4});    // heat shield / handguard
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) bx(g, .002, .01, .03, s * .0375, .0, -.29 - i * .04, M.port, .001);
  lathe(g, [[.018,-.49],[.018,-.6],[.0165,-.61],[.0165,-.92]], .0, M.dark);
  if (lod) for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; bx(g, .003, .003, .1, Math.cos(a) * .0172, Math.sin(a) * .0172, -.66, M.port, .0005); }   // barrel flutes
  tube(g, .01, .01, -.49, -.72, -.033, M.dark);
  lathe(g, [[.012,-.71],[.016,-.715],[.016,-.735],[.012,-.74]], -.033, M.dark);                                    // gas regulator
  lathe(g, [[.0,-.915],[.022,-.915],[.023,-.92],[.023,-.975],[.018,-.98],[.0,-.98]], .0, M.dark);
  for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; bx(g, .003, .003, .045, Math.cos(a) * .023, Math.sin(a) * .023, -.95, M.port, .0005); }
  lens(g, .008, 0, -.9805, M.port, false);
  // carry handle on the barrel
  prof(g, [[-.36,.018],[-.36,.075],[-.38,.09],[-.5,.09],[-.52,.075],[-.52,.018],[-.505,.018],[-.505,.07],[-.495,.077],[-.385,.077],[-.375,.07],[-.375,.018]], .016, M.dark, {bev:.003});
  // front sight post and rear aperture
  prof(g, [[-.64,.016],[-.65,.016],[-.648,.15],[-.643,.166],[-.638,.15]], .006, M.dark, {bev:.001});
  bx(g, .016, .016, .02, 0, .015, -.645, M.dark, .002);
  bx(g, .006, .05, .008, 0, .125, .115, M.dark, .001);                                                             // rear aperture on a post
  { const ap = has(g, new THREE.Mesh(new THREE.TorusGeometry(.011, .0028, 8, 22), M.dark)); ap.position.set(0, .165, .115); }
  // belt box and a short run of linked rounds into the receiver
  const lMag = has(g, new THREE.Group());
  prof(lMag, [[-.02,-.06],[-.155,-.06],[-.16,-.075],[-.16,-.19],[-.15,-.2],[-.025,-.2],[-.015,-.19],[-.015,-.07]], .13, M.olive, {bev:.014, bseg:3, x:-.025});
  bx(lMag, .136, .016, .14, -.025, -.068, -.088, M.oliveDark, .004);
  if (lod){ bx(lMag, .14, .03, .006, -.025, -.13, -.158, M.oliveDark, .002); bx(lMag, .14, .03, .006, -.025, -.13, -.018, M.oliveDark, .002);   // box ribs
    bx(lMag, .02, .022, .012, -.095, -.1, -.088, M.dark, .002); }                                                  // latch
  if (lod) for (let i = 0; i < 5; i++){ const c = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0055, .05, 10), M.brass)); c.rotation.x = Math.PI / 2; c.position.set(-.052 - i * .004, -.045 + i * .006, -.07 - i * .014); c.rotation.z = Math.PI / 2;
    bx(g, .016, .004, .008, -.052 - i * .004, -.039 + i * .006, -.07 - i * .014, M.dark, .001); }                   // links
  grip(g, new THREE.Vector3(0, -.1, .14), -.3, .13, .058, .04, M.poly, {tail:-.006});
  trig(g, -.085, .09, M.dark);
  prof(g, [[.22,.04],[.5,.03],[.52,.02],[.52,-.1],[.5,-.11],[.4,-.1],[.3,-.05],[.22,-.045]], .06, M.poly, {bev:.009, bseg:4, holes:[[[.28,.012],[.46,.006],[.46,-.07],[.4,-.07],[.3,-.03],[.28,-.02]]]});
  bx(g, .062, .14, .018, 0, -.035, .527, M.rubber, .005);
  for (const s of [-1, 1]){ tube(g, .006, .006, -.58, -.88, -.05, M.dark, {x:s * .02, seg:8}); lathe(g, [[.008,-.875],[.009,-.885],[.004,-.9]], -.05, M.rubber, {x:s * .02, seg:8}); }   // folded bipod legs and feet
  bx(g, .05, .014, .03, 0, -.045, -.58, M.dark, .003);
  pinX(g, .045, -.04, .1, .005, M.dark); pinX(g, -.045, -.04, .1, .005, M.dark);
  push(g, -.98, {grip:new THREE.Vector3(0,-.1,.14), clamp:new THREE.Vector3(0,0,-.36), hw:.036, hh:.036, gdim:{w:.04, d:.058, fw:.044}}, {mag:lMag});

  // ---------- 7 bolt-action sniper: olive stock with adjustable cheek piece, fluted heavy barrel, brake, folded bipod, big scope in rings
  g = new THREE.Group();
  prof(g, [[-.43,.004],[-.43,-.04],[-.4,-.068],[-.06,-.078],[.03,-.07],[.06,-.05],[.2,-.045],[.32,-.075],[.48,-.135],[.5,-.135],[.5,.042],[.46,.056],[.27,.05],[.2,.022],[.14,.022],[.13,.004]], .066, M.olive, {bev:.014, bseg:4});
  bx(g, .05, .022, .2, 0, .068, .36, M.dark, .006);                                                               // adjustable cheek piece
  for (const z of [.3, .42]) tube(g, .004, .004, z - .001, z + .001, .055, M.silver).rotation.set(Math.PI / 2, 0, 0); // its posts
  tube(g, .023, .023, .135, -.13, .022, M.metal);
  lathe(g, [[.017,-.13],[.017,-.6],[.0155,-.62],[.014,-.84]], .022, M.dark);
  if (lod) for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; bx(g, .0035, .0035, .38, Math.cos(a) * .0166, .022 + Math.sin(a) * .0166, -.38, M.port, .0006); }   // barrel flutes
  lathe(g, [[.0,-.835],[.021,-.835],[.022,-.84],[.022,-.895],[.018,-.9],[.0,-.9]], .022, M.dark);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) bx(g, .003, .014, .012, s * .022, .022, -.852 - i * .016, M.port, .001);
  lens(g, .007, .022, -.9005, M.port, false);
  for (const s of [-1, 1]){ tube(g, .006, .005, -.22, -.42, -.075, M.dark, {x:s * .016, seg:8}); lathe(g, [[.007,-.415],[.008,-.425],[.0,-.435]], -.075, M.rubber, {x:s * .016, seg:8}); }   // folded bipod
  bx(g, .044, .016, .03, 0, -.072, -.205, M.dark, .004);
  // detachable box magazine: tan polymer body standing out below the stock, steel base plate
  const sMag = has(g, new THREE.Group());
  prof(sMag, [[-.032,-.05],[-.108,-.05],[-.108,-.146],[-.1,-.152],[-.04,-.152],[-.032,-.146]], .044, M.tan, {bev:.005});
  bx(sMag, .05, .01, .084, 0, -.155, -.07, M.dark, .002);                                                          // base plate
  for (const s of [-1, 1]) bx(sMag, .002, .07, .008, s * .0225, -.1, -.095, M.dark, .0006);                       // side ribs
  bx(g, .052, .012, .09, 0, -.078, -.07, M.dark, .002);                                                             // magazine well collar
  grip(g, new THREE.Vector3(0, -.09, .12), -.3, .13, .056, .04, M.olive, {smooth:true, tail:-.006});
  trig(g, -.07, .075, M.dark, M.dark);
  bx(g, .06, .15, .022, 0, -.045, .512, M.rubber, .007);
  for (const z of [.02, -.12]) ring(g, z, .1, .0295, M.dark, .056);
  lathe(g, [[.028,.14],[.035,.136],[.04,.11],[.03,.08],[.029,-.18],[.036,-.21],[.044,-.27],[.044,-.3],[.04,-.302]], .1, M.dark2);
  lathe(g, [[.0405,-.3],[.0425,-.302],[.0425,-.35],[.0405,-.352]], .1, M.dark);                                   // sunshade
  if (lod) for (let i = 0; i < 10; i++) bx(g, .0024, .004, .014, .0355 * Math.cos(i / 10 * Math.PI * 2), .1 + .0355 * Math.sin(i / 10 * Math.PI * 2), .118, M.dark, .0006);   // power ring grip
  { const t1 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .032, 18), M.dark)); t1.position.set(0, .144, -.06);
    const t2 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .032, 18), M.dark)); t2.rotation.z = Math.PI / 2; t2.position.set(.044, .1, -.06);
    const t3 = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .03, 16), M.dark)); t3.rotation.z = Math.PI / 2; t3.position.set(-.042, .1, -.06);
    if (lod) for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; bx(g, .0025, .028, .0025, Math.cos(a) * .0165, .144, -.06 + Math.sin(a) * .0165, M.dark2, .0005); } }   // turret knurling
  lens(g, .041, .1, -.352, M.lens, false); lens(g, .033, .1, .138, M.lensDark, true);
  // bolt: turns up on the bore axis, draws back out of the receiver and drives home again after each shot
  const bolt = has(g, new THREE.Group()); bolt.position.set(0, .022, 0);
  { const b = has(bolt, new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .06, 10), M.metal)); b.rotation.z = Math.PI / 2; b.position.set(.055, 0, .06);
    const k = has(bolt, new THREE.Mesh(new THREE.SphereGeometry(.013, 14, 10), M.dark)); k.position.set(.086, -.01, .06);
    const body = has(bolt, new THREE.Mesh(new THREE.CylinderGeometry(.0158, .0158, .12, RS), M.silver)); body.rotation.x = Math.PI / 2; body.position.set(0, 0, .075);
    lathe(bolt, [[.0,.134],[.019,.134],[.02,.142],[.017,.158],[.0,.16]], 0, M.dark); }                            // bolt shroud
  push(g, -.9, {grip:new THREE.Vector3(0,-.09,.12), clamp:new THREE.Vector3(0,-.03,-.26), hw:.04, hh:.05, gdim:{w:.04, d:.056, fw:.033}}, {mag:sMag, bolt});

  // ---------- 8 rocket launcher: tube with wooden heat guards, flared venturi, finned warhead, optical sight, two grips
  g = new THREE.Group();
  tube(g, .035, .035, .46, -.5, .03, M.olive, {x:.02});
  lathe(g, [[.035,.44],[.04,.48],[.058,.56],[.062,.585],[.056,.59]], .03, M.olive, {x:.02});
  lathe(g, [[.054,.588],[.054,.6],[.03,.6]], .03, M.dark, {x:.02});                                                  // venturi lip
  lathe(g, [[.036,-.495],[.041,-.5],[.041,-.52],[.036,-.525]], .03, M.dark, {x:.02});
  lathe(g, [[.036,-.012],[.044,-.02],[.047,-.035],[.047,-.295],[.044,-.31],[.036,-.318]], .03, M.wood, {x:.02});      // wooden heat guard
  for (const z of [-.03, -.3]) lathe(g, [[.043,z + .008],[.046,z + .004],[.046,z - .004],[.043,z - .008]], .03, M.dark, {x:.02});
  if (lod) for (const z of [-.11, -.22]) lathe(g, [[.0465,z + .003],[.0475,z],[.0465,z - .003]], .03, M.woodDark, {x:.02});
  const head = has(g, new THREE.Group());
  lathe(head, [[.0,-.945],[.004,-.945],[.006,-.925],[.05,-.775],[.052,-.765],[.052,-.7],[.04,-.66],[.024,-.64],[.022,-.52]], .03, M.warhead, {x:.02});
  lathe(head, [[.0525,-.76],[.0535,-.755],[.0535,-.705],[.0525,-.7]], .03, M.olive, {x:.02});                       // warhead band
  if (lod) for (let i = 0; i < 4; i++){ const a = i / 4 * Math.PI * 2 + Math.PI / 4; const f = bx(head, .003, .022, .05, .02 + Math.cos(a) * .03, .03 + Math.sin(a) * .03, -.56, M.warhead, .001); f.rotation.z = a - Math.PI / 2; }   // fins
  grip(g, new THREE.Vector3(.02, -.08, .05), -.25, .12, .056, .04, M.wood, {smooth:true});
  trig(g, -.04, .02, M.dark, M.dark);
  bx(g, .03, .03, .07, .02, -.01, .03, M.dark, .003);
  vlathe(g, [[.0,-.142],[.021,-.142],[.023,-.134],[.021,-.12],[.023,-.106],[.021,-.092],[.023,-.078],[.019,-.064],[.018,-.04],[.024,-.036],[.0,-.032]], .02, -.3, M.wood);
  bx(g, .03, .03, .05, .02, -.02, -.3, M.dark, .003);
  // optical sight on the left and folding iron sights on top
  bx(g, .02, .03, .04, -.045, .05, -.15, M.dark, .003);
  prof(g, [[-.08,.07],[-.08,.15],[-.1,.16],[-.2,.16],[-.22,.14],[-.22,.07]], .03, M.dark, {x:-.07, bev:.008});
  tube(g, .016, .02, -.08, -.03, .12, M.dark, {x:-.07});
  lathe(g, [[.02,-.03],[.024,-.022],[.024,-.004],[.019,.0]], .12, M.rubber, {x:-.07});                                // eye cup
  for (const z of [-.12, -.17]) { const k = has(g, new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .012, 14), M.dark)); k.rotation.z = Math.PI / 2; k.position.set(-.09, .13, z); }
  lens(g, .015, .12, -.03, M.lensDark, true, -.07); lens(g, .016, .12, -.221, M.lens, false, -.07);
  prof(g, [[-.38,.064],[-.385,.064],[-.384,.122],[-.381,.132],[-.378,.122]], .006, M.dark, {x:.02, bev:.001});
  for (const sx of [-1, 1]) bx(g, .007, .064, .008, .02 + sx * .011, .096, .026, M.dark, .001);                 // open rear notch
  if (lod) for (const z of [.3, -.4]) { const lp = has(g, new THREE.Mesh(new THREE.TorusGeometry(.009, .002, 6, 14), M.dark)); lp.position.set(.02, -.008, z); }   // sling swivels
  push(g, -.72, {grip:new THREE.Vector3(.02,-.08,.05), tilt:-.25, vgrip:new THREE.Vector3(.02,-.08,-.3), vtilt:0, gdim:{w:.04, d:.056, fw:.035}, vdim:{w:.046, d:.046}}, {head});
  return out;
}
let VM_GLASS = null;
const viewRoot = new THREE.Group(); viewRoot.position.set(.24,-.2,-.55); camera.add(viewRoot);
const views = [], muzzles = [];
let rocketHead = null;
(() => {
  const tan = pbrMat(GUNT.tan);
  const olive = pbrMat(GUNT.olive, {metalness:1});
  const oliveDark = pbrMat(GUNT.olive, {metalness:1, color:C(0xa0a090)});
  const silver = pbrMat(GUNT.silver, {metalness:1});
  const lensM = new THREE.MeshStandardMaterial({color:C(0x335577), roughness:.1, metalness:.9, emissive:C(0x112233)});
  // coated optic glass: reads as a solid sight while the gun is held, clears when aiming through it
  const glass = VM_GLASS = new THREE.MeshBasicMaterial({color:0x3d6a8e, transparent:true, opacity:.5, depthWrite:false});
  const redDot = new THREE.MeshBasicMaterial({color:0xff3322});
  const add = (g, mz, spec) => { g.userData.support = arms(g, spec); views.push(g); muzzles.push(mz); };
  const lensAt = (g, r, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r,16), mat || lensM); m.position.set(x,y,z); g.add(m); return m; };
  let g;
  // realistic models (see GUNS_BUILD): extruded side profiles, lathed barrels and optics, machined details
  const tritium = new THREE.MeshBasicMaterial({color:new THREE.Color(.5, 2.4, .7)});
  const tdot = (g, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.0028, 8, 6), tritium); m.position.set(x, y, z); g.add(m); };
  const metal2 = gunMetal.clone(); metal2.side = THREE.DoubleSide;
  const GM = {metal:gunMetal, metal2, dark:gunDark, dark2:pbrMat(GUNT.steel, {metalness:1, color:C(0x9a9a9a)}), poly:pbrMat(GUNT.polymer, {color:C(0x8c8c88)}), tan:pbrMat(GUNT.tan, {color:C(0xd8d0bc)}), olive, oliveDark, silver, wood,
    woodDark:stdMat({color:C(0x2e1c10), roughness:.85}), rubber:stdMat({color:C(0x141414), roughness:.95}), port:stdMat({color:C(0x070707), roughness:.9}),
    gold:stdMat({color:C(0xd9b25a), roughness:.25, metalness:1}), brass:stdMat({color:C(0xc89b3c), roughness:.3, metalness:1}),
    shell:stdMat({color:C(0x9c2a1e), roughness:.5, metalness:.2}), warhead:pbrMat(GUNT.olive, {metalness:1, color:C(0xb8b8a0)}),
    lens:lensM, lensDark:stdMat({color:C(0x0b1216), roughness:.12, metalness:.8})};
  for (const G of GUNS_BUILD(GM, 1)){
    const g = G.g;
    if (G.mag) g.userData.mag = G.mag;
    if (G.head) rocketHead = G.head;
    if (G.dot){ const d = new THREE.Mesh(new THREE.CircleGeometry(.0028, 12), redDot); d.position.set(G.dot[0], G.dot[1], G.dot[2]); g.add(d); }
    if (G.glass){
      const gl = new THREE.Mesh(new THREE.CircleGeometry(G.glass[0], 24), glass); gl.position.set(0, G.glass[1], G.glass[2]); g.add(gl);
      if (G.glass[3] != null){ const gr = new THREE.Mesh(new THREE.CircleGeometry(G.glass[0] * 1.02, 24), glass); gr.position.set(0, G.glass[1], G.glass[3]); g.add(gr); }   // rear lens
    }
    if (G.sights) G.sights.forEach(p => tdot(G.slide || g, p[0], p[1], p[2]));
    if (G.slide) g.userData.slide = G.slide;
    for (const k of ['bolt', 'pump', 'bcg', 'chandle']) if (G[k]){ g.userData[k] = G[k]; G[k].userData.base = G[k].position.clone(); }
    if (G.trig){ g.userData.trig = G.trig; G.trig.userData.base = G.trig.position.clone(); G.spec.trigP = G.trig.position.clone(); }
    add(g, G.mz, G.spec);
  }
  views.forEach((v, i) => {
    const ud = v.userData; if (!ud.mag) return;
    // re-pivot the magazine on its own centre so it can tumble when it is dropped
    v.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(ud.mag), c = box.getCenter(new V()), par = ud.mag.parent, piv = new THREE.Group();
    par.remove(ud.mag); ud.mag.position.sub(c); piv.add(ud.mag); piv.position.copy(c); par.add(piv); ud.mag = piv;
    piv.userData.base = c.clone();
    const tilt = WEAPONS[i] && i < 2 ? (i ? -.22 : -.25) : 0;
    ud.magDir = new V(0, -Math.cos(tilt), -Math.sin(tilt));                     // straight out of the magazine well
    const grab = new V(c.x, box.min.y + (i < 2 ? .022 : .04), c.z);
    ud.magReach = grab.sub(ud.support);                                         // support hand -> magazine
    ud.pouch = ud.magReach.clone().add(new V(-.08, -.34, .16));                // off-screen, down at the belt pouches
  });
  views.forEach((v,i) => { v.visible = i===3; v.traverse(o => { if (o.isMesh) o.castShadow = false; }); viewRoot.add(v); });
  views.forEach(v => {
    v.visible = true; v.updateMatrixWorld(true);
    const parts = v.children.filter(o => batchableMesh(o) && o !== v.userData.mag && o !== v.userData.trig && o !== rocketHead && !o.material.transparent);
    mergeGroupMeshes(parts, v, null);
    parts.forEach(o => { if (o.userData.batchedInto) v.remove(o); });
    for (const sub of [v.userData.lhand, v.userData.trigFinger]){
      if (!sub) continue;
      const sp = sub.children.filter(o => batchableMesh(o) && !o.material.transparent);
      mergeGroupMeshes(sp, sub, null); sp.forEach(o => { if (o.userData.batchedInto) sub.remove(o); });
    }
    const lh = v.userData.lhand, S = v.userData.support;
    if (lh && S){ lh.children.forEach(o => o.position.sub(S)); lh.position.copy(S); v.userData.lhBase = S.clone(); }
  });
  views.forEach((v,i) => { v.visible = i === 3; });
  { // loose shell for the shotgun reload: red hull, brass head, along the bore axis
    const g = new THREE.Group(), hull = new THREE.Mesh(new THREE.CylinderGeometry(.0118, .0118, .055, 16), GM.shell), head = new THREE.Mesh(new THREE.CylinderGeometry(.0125, .0125, .014, 16), GM.brass);
    hull.rotation.x = head.rotation.x = Math.PI / 2; head.position.z = .034; g.add(hull, head); g.visible = false;
    views[5].add(g); views[5].userData.rShell = g;
  }
})();
let sleeveTeam = -1;
function updateSleeves(team){ if (team !== sleeveTeam){ sleeveTeam = team; const M = soldierMats(team, false); sleeveMat.map = null; sleeveMat.color.copy(M.uni.color); WRIST_MAT.color.copy(M.accent.color); sleeveMat.needsUpdate = true;
  // the low-quality preset draws simplified copies of these materials: recolour those too, or the arms keep the first team's colour
  if (typeof _liteCache !== 'undefined'){ const ls = _liteCache.get(sleeveMat), lw = _liteCache.get(WRIST_MAT); if (ls) ls.color.copy(sleeveMat.color); if (lw) lw.color.copy(WRIST_MAT.color); } } }
const muzzle = new THREE.Object3D(); viewRoot.add(muzzle);
const flash = new THREE.PointLight(0xffb85c, 0, 11, 2); viewRoot.add(flash);
const flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash, color:0xffffff, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, fog:false}));
flashSprite.scale.set(.32,.32,.32); viewRoot.add(flashSprite);
const flashPetals = new THREE.Group(); flashPetals.rotation.order = 'YXZ';
{ const geo = new THREE.PlaneGeometry(.36, .18); geo.translate(.18, 0, 0);
  const mk = () => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map:TEX.flashSide, color:new THREE.Color(2.4, 1.8, 1.1), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false}));
  const a = mk(), b = mk(); b.rotation.x = Math.PI/2; flashPetals.add(a, b); }
flashPetals.visible = false; viewRoot.add(flashPetals);

await loadStep(47, 'Askerler donatılıyor');
// ================= Soldiers =================
// Detailed procedural soldiers: team-colour combat shirts, black plate carriers, balaclavas and goggles, helmets with headsets,
// articulated legs with a walk cycle, aim pitch, hit flinch and a falling death.
const GEO = new Map();
function capsuleGeo(r1, r2, len, rs){
  rs = rs || 16;
  const key = `c${r1.toFixed(3)}|${r2.toFixed(3)}|${len.toFixed(2)}|${rs}`;
  if (GEO.has(key)) return GEO.get(key);
  const pts = [], n = 5;
  for (let i=0;i<=n;i++){ const a = -Math.PI/2 + i/n*Math.PI/2; pts.push(new THREE.Vector2(i === 0 ? 0 : Math.cos(a)*r2, -len + Math.sin(a)*r2)); }
  for (let i=0;i<=n;i++){ const a = i/n*Math.PI/2; pts.push(new THREE.Vector2(i === n ? 0 : Math.cos(a)*r1, Math.sin(a)*r1)); }
  const g = new THREE.LatheGeometry(pts, rs); GEO.set(key, g); return g;
}
function latheGeo(key, prof, rs){
  if (GEO.has(key)) return GEO.get(key);
  const g = new THREE.LatheGeometry(prof.map(([x,y]) => new THREE.Vector2(x,y)), rs || 16); GEO.set(key, g); return g;
}
function cachedGeo(key, make){ if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); }
const BOX = (w,h,d) => cachedGeo(`b${w}|${h}|${d}`, () => THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, d, 1, Math.min(.011, Math.min(w, h, d) * .3)) : new THREE.BoxGeometry(w,h,d));
const SPH = (r, ws, hs) => cachedGeo(`s${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws||14, hs||10));
const CYL = (r1, r2, h, s, open) => cachedGeo(`y${r1}|${r2}|${h}|${s}|${open?1:0}`, () => new THREE.CylinderGeometry(r1, r2, h, s||12, 1, !!open));

// Collects parts in a group's local space and merges them per material (few draw calls).
class Parts {
  constructor(){ this.byMat = new Map(); }
  add(geo, mat, pos, rot, scl){
    const m = new THREE.Matrix4().compose(pos || new V(), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0,0,0]))), scl || new V(1,1,1));
    this.addM(geo, mat, m);
  }
  addM(geo, mat, m){
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m);
    const k = mat.userData && mat.userData.boxUV;
    if (k && g.attributes.uv && g.attributes.normal){
      // project UVs along each face's dominant axis: the pattern keeps one size on every limb
      const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      for (let t = 0; t < P.count; t += 3){
        let nx = 0, ny = 0, nz = 0; for (let j = 0; j < 3; j++){ nx += Math.abs(N.getX(t+j)); ny += Math.abs(N.getY(t+j)); nz += Math.abs(N.getZ(t+j)); }
        for (let j = 0; j < 3 && t + j < P.count; j++){
          const x = P.getX(t+j), y = P.getY(t+j), z = P.getZ(t+j);
          if (nx >= ny && nx >= nz) U.setXY(t+j, z*k + .31, y*k); else if (ny >= nz) U.setXY(t+j, x*k + .57, z*k); else U.setXY(t+j, x*k, y*k + .13);
        }
      }
      U.needsUpdate = true;
    }
    if (!this.byMat.has(mat)) this.byMat.set(mat, []); this.byMat.get(mat).push(g);
  }
  limb(a, b, key, prof, mat, sx){
    const dir = new V().subVectors(b, a), len = Math.round(dir.length() * 100) / 100;
    const geo = cachedGeo(`L${key}|${len}`, () => new THREE.LatheGeometry(prof.map(([t, r]) => new THREE.Vector2(Math.max(r, .0001), -t * len)).reverse(), 14));
    const q = new THREE.Quaternion().setFromUnitVectors(new V(0,-1,0), dir.normalize());
    this.addM(geo, mat, new THREE.Matrix4().compose(a, q, new V(1, 1, sx || 1)));
  }
  seg(a, b, r1, r2, mat){
    const dir = new V().subVectors(b, a), len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new V(0,-1,0), dir.normalize());
    this.addM(capsuleGeo(r1, r2, Math.round(len*100)/100), mat, new THREE.Matrix4().compose(a, q, new V(1,1,1)));
  }
  build(group, owned, isHead){
    const U = THREE.BufferGeometryUtils;
    // plain-colour parts (skin, boots, straps, eyes…) share one vertex-coloured material: one draw call instead of many
    const pools = {solid:[], glow:[]};
    for (const [mat, list] of [...this.byMat]){
      const tag = mat.userData.solid ? 'solid' : mat.userData.glow ? 'glow' : null;
      if (!tag || !U) continue;
      const c = mat.userData.glow ? mat.userData.glow : mat.color;
      for (const g of list){ const n = g.attributes.position.count, col = new Float32Array(n*3); for (let i=0;i<n;i++){ col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); pools[tag].push(g); }
      this.byMat.delete(mat);
    }
    for (const [tag, list] of Object.entries(pools)){
      if (!list.length) continue;
      const merged = U.mergeBufferGeometries(list, false);
      if (merged){ list.forEach(g => g.dispose()); this.byMat.set(tag === 'solid' ? SOLID_MAT : GLOW_MAT, [merged]); }
    }
    for (const [mat, list] of this.byMat){
      let geos = list;
      if (U && U.mergeBufferGeometries){ const merged = U.mergeBufferGeometries(list, false); if (merged){ geos = [merged]; list.forEach(g => g.dispose()); } }
      for (const g of geos){ const mesh = new THREE.Mesh(g, mat); const vc = g.attributes.position.count;
        mesh.castShadow = mat.userData.boxUV ? vc > 240 : mat === SOLID_MAT ? vc > 1500 : vc > 900; mesh.receiveShadow = true; mesh.userData.headPart = !!isHead; group.add(mesh); owned.push(g); }
    }
  }
}

function webbingTexture(base){
  const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0,0,128,128);
  for (let y=8;y<128;y+=16){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0,y,128,6); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0,y,128,1);
    for (let x=0;x<128;x+=20){ g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x,y-2,2,10); } }
  for (let i=0;i<500;i++){ g.fillStyle = `rgba(255,255,255,${Math.random()*.06})`; g.fillRect(Math.random()*128, Math.random()*128, 1, 1); }
  return toTex(c);
}
// team kit (character sheet): bright team-colour shirt and helmet, black plate carrier, trousers, boots and gloves
// with team-colour accents, light armband stripe, black balaclava and dark goggles
const TEAM_LOOK = [
  {shirt:0x1543c4, dark:0x0c1f52, light:0x8cc8ff, patch:0x3d8be0, pants:0x171b26},
  {shirt:0xc81a17, dark:0x560d0c, light:0xff9484, patch:0xe0503a, pants:0x221819},
];
const SOLID_MAT = stdMat({vertexColors:true, roughness:.72});
// team patches/bands: vertex colour drives both albedo and glow, so all of them share one material
const GLOW_MAT = stdMat({vertexColors:true, roughness:.6, emissive:new THREE.Color(1,1,1), emissiveIntensity:.32});
GLOW_MAT.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };
GLOW_MAT.customProgramCacheKey = () => 'glowvc';
const solidMat = o => { const m = stdMat(o); m.userData.solid = true; return m; };
const SOLDIER_MATS = new Map();
function soldierMats(team, bot){
  const key = team + (bot ? 'b' : 'h');
  if (SOLDIER_MATS.has(key)) return SOLDIER_MATS.get(key);
  const L = TEAM_LOOK[team], k = bot ? .82 : 1;
  const fab = n => ({normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(n, n)});
  const m = {
    uni: stdMat({color:C(L.shirt).multiplyScalar(k), roughness:.86, ...fab(.32)}),
    pants: stdMat({color:C(L.pants), roughness:.9, ...fab(.45)}),
    vest: stdMat({map:webbingTexture('#23211f'), roughness:.82, ...fab(.5)}),
    helm: stdMat({color:C(L.shirt).multiplyScalar(k), roughness:.38, metalness:.08, ...fab(.12)}),
    balac: stdMat({color:C(0x16171a), roughness:.95, ...fab(.35)}),
    gear: solidMat({color:C(0x17181b), roughness:.8}),
    accent: solidMat({color:C(L.shirt).multiplyScalar(k), roughness:.55}),
    dark: solidMat({color:C(L.dark), roughness:.75}),
    patch: stdMat({color:C(L.patch), emissive:C(L.patch), emissiveIntensity:bot ? .14 : .55, roughness:.5}),
    band: null,
  };
  m.band = stdMat({color:C(L.light)}); m.band.userData.glow = C(L.light).multiplyScalar(bot ? .75 : .9);
  m.patch.userData.glow = C(L.patch).multiplyScalar(bot ? .8 : 1.15);
  m.uni.userData.boxUV = 1.7; m.pants.userData.boxUV = 1.7; m.vest.userData.boxUV = 2.4; m.helm.userData.boxUV = 2.2; m.balac.userData.boxUV = 2;
  SOLDIER_MATS.set(key, m); return m;
}
const COMMON = {
  boot: solidMat({color:C(0x16171a), roughness:.7}),
  sole: solidMat({color:C(0x111111), roughness:.9}),
  glove: solidMat({color:C(0x18191c), roughness:.8}),
  black: pbrMat(GUNT.steel, {metalness:1, color:C(0x8a8a8a)}),
  blackS: solidMat({color:C(0x1c1c1a)}),
  lens: solidMat({color:C(0x1d2a36), roughness:.08, metalness:.9, emissive:C(0x0a1420)}),
  gold: stdMat({color:C(0x6a4a1e), roughness:.15, metalness:1}),
  gun: pbrMat(GUNT.cerakote, {metalness:1}),
  mouth: solidMat({color:C(0x5a2a22), roughness:.8}),
  eyeWhite: solidMat({color:C(0xe8e2d6), roughness:.3}),
  pupil: solidMat({color:C(0x1a120c), roughness:.15}),
  silver: pbrMat(GUNT.silver, {metalness:1}),
  olive: pbrMat(GUNT.olive, {metalness:1}),
  gunTan: pbrMat(GUNT.tan),
  wood: pbrMat(GUNT.wood),
  goggle: (() => { const m = stdMat({color:C(0x4d6f8c), roughness:.2}); m.userData.glow = C(0x557a98); return m; })(),
  scopeGlass: stdMat({color:C(0x224466), roughness:.05, metalness:1, emissive:C(0x0b2238)}),
};
function hashStr(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function nameSprite(text, hue){
  const c = makeCanvas(256, 64), g = c.getContext('2d'); g.font = '600 34px "Montserrat", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,.5)'; const w = Math.min(250, g.measureText(text).width + 24); g.fillRect(128-w/2,12,w,40);
  g.fillStyle = `hsl(${hue},85%,72%)`; g.fillText(text,128,33);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false, fog:false}));
  s.scale.set(1.5,.375,1); s.position.y = 2.3; s.renderOrder = 5; return s;
}

// third-person guns: the same models as in first person at lower detail, mapped so the pistol grip sits in the
// soldier's right hand, merged per material once and shared by every soldier (never disposed with an avatar)
const TP_MAP = [[.62,[.11,.3,-.36]],[.62,[.11,.3,-.36]],[.78,[.12,.3,-.16]],[.8,[.12,.3,-.14]],[.78,[.12,.3,-.14]],[.74,[.12,.3,-.14]],[.8,[.12,.3,-.14]],[.76,[.12,.3,-.14]],[.88,[.14,.37,-.26]]];
let TP_GUNS = null;
function thirdPersonGuns(){
  if (TP_GUNS) return TP_GUNS;
  const U = THREE.BufferGeometryUtils;
  const TM = {metal:COMMON.gun, metal2:COMMON.gun, dark:COMMON.black, dark2:COMMON.black, poly:COMMON.blackS, tan:COMMON.gunTan, olive:COMMON.olive, oliveDark:COMMON.olive,
    silver:COMMON.silver, wood:COMMON.wood, woodDark:COMMON.wood, rubber:COMMON.blackS, port:COMMON.blackS, gold:COMMON.gold, brass:COMMON.gold, shell:COMMON.wood,
    warhead:COMMON.olive, lens:COMMON.lens, lensDark:COMMON.lens};
  TP_GUNS = GUNS_BUILD(TM, 0).map((G, i) => {
    const [s3, R] = TP_MAP[i], gv = G.spec.grip;
    const T = new THREE.Matrix4().makeTranslation(R[0], R[1], R[2]).multiply(new THREE.Matrix4().makeScale(s3, s3, s3)).multiply(new THREE.Matrix4().makeTranslation(-gv.x, -gv.y, -gv.z));
    G.g.updateMatrixWorld(true);
    const byMat = new Map(); let rear = -1e9;
    G.g.traverse(o => {
      if (!o.isMesh) return;
      const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
      for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(T, o.matrixWorld));
      const p = geo.attributes.position; for (let k = 0; k < p.count; k++) rear = Math.max(rear, p.getZ(k));
      if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(geo);
      o.geometry.dispose();
    });
    if (HOLD[i].long) HOLD_REAR[i] = rear;
    return [...byMat].map(([mat, list]) => { const m = U && list.length > 1 ? U.mergeBufferGeometries(list, false) : list[0]; m.computeBoundingSphere(); return {geo:m, mat}; });
  });
  return TP_GUNS;
}
function buildWeaponModels(owned){
  return thirdPersonGuns().map(parts => {
    const g = new THREE.Group();
    for (const {geo, mat} of parts){ const m = new THREE.Mesh(geo, mat); m.castShadow = geo.attributes.position.count > 300; m.receiveShadow = true; g.add(m); }
    return g;
  });
}
const LIMB = {
  thigh:[[0,0],[.02,.06],[.06,.088],[.2,.099],[.42,.094],[.66,.082],[.86,.07],[.96,.062],[1,0]],
  shin:[[0,0],[.03,.058],[.12,.066],[.3,.074],[.5,.068],[.72,.06],[.92,.056],[1,0]],
  upper:[[0,0],[.05,.062],[.2,.074],[.42,.078],[.62,.07],[.86,.058],[1,0]],
  fore:[[0,0],[.05,.054],[.2,.06],[.42,.058],[.7,.052],[.92,.046],[1,0]],
};
// ---- third-person arm rig: two-bone IK from the shoulder to each weapon's grip
const ARM_L1 = .30, ARM_L2 = .28, HAND_OFF = .065;
const SH_R = new V(.19,.44,.02), SH_L = new V(-.2,.43,-.14);
const POLE_R = new V(1,-1.1,.1), POLE_L = new V(-1,-1.2,0);
const HOLD_REAR = [0, 0, .01, .07, .09, .10, .11, .11, 0];   // rear end (stock) of each weapon model
const HOLD = [
  {s:1, off:[.03,.12,-.06], R:[.11,.3,-.36], L:[.093,.285,-.352], pr:[1,-.2,-.2]},
  {s:1, off:[.03,.12,-.06], R:[.11,.3,-.36], L:[.093,.285,-.352], pr:[1,-.2,-.2]},
  {s:.8, long:true, R:[.12,.3,-.16], L:[.115,.30,-.46]},
  {s:.8, long:true, R:[.12,.3,-.14], L:[.115,.30,-.46]},
  {s:.8, long:true, R:[.12,.3,-.14], L:[.115,.30,-.46]},
  {s:.8, long:true, R:[.12,.3,-.14], L:[.115,.30,-.46]},
  {s:.8, long:true, R:[.12,.3,-.14], L:[.115,.30,-.46]},
  {s:.8, long:true, R:[.12,.3,-.14], L:[.115,.30,-.46]},
  {s:1, off:[.01,.12,0], R:[.14,.37,-.26], L:[.14,.40,-.5]},
];
function solveArm(S, H, pole){
  const l2 = ARM_L2 + HAND_OFF, max = (ARM_L1 + l2) * .995;
  const d = new V().subVectors(H, S); let L = d.length(); const dir = d.normalize();
  if (L > max){ L = max; H = S.clone().addScaledVector(dir, L); }
  L = Math.max(L, Math.abs(ARM_L1 - l2) + .02);
  const a = (ARM_L1*ARM_L1 - l2*l2 + L*L) / (2*L), h = Math.sqrt(Math.max(0, ARM_L1*ARM_L1 - a*a));
  const perp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  const E = S.clone().addScaledVector(dir, a).addScaledVector(perp, h);
  const fd = new V().subVectors(H, E).normalize();
  return {E, W:H.clone().addScaledVector(fd, -HAND_OFF), H, fd};
}
function buildArm(p, M, S, target, pole, side){
  const {E, W, H, fd} = solveArm(S, target, pole);
  p.limb(S.clone().addScaledVector(new V().subVectors(S, E).normalize(), .03), E.clone().addScaledVector(new V().subVectors(E, S).normalize(), .03), 'up', LIMB.upper, M.uni);   // upper arm with a biceps / triceps swell                                  // upper arm (sleeve)
  p.limb(new V().lerpVectors(S, E, .42), new V().lerpVectors(S, E, .54), 'band', [[0,.0805],[1,.0785]], M.band); // team armband: an open band round the sleeve (no end caps)
  { const out = new V().subVectors(E, S).normalize().multiplyScalar(-.004); p.add(SPH(.044,12,8), M.gear, E.clone().add(new V(side * .012, -.006, .006)).add(out), null, new V(.9,.85,.9)); }   // elbow pad
  const hem = W.clone().addScaledVector(fd, -.012);
  p.limb(E.clone().addScaledVector(new V().subVectors(E, hem).normalize(), .025), hem, 'fo', LIMB.fore, M.uni);                // forearm sleeve                                  // forearm sleeve, tapering to the cuff
  p.seg(hem.clone().addScaledVector(fd, -.03), hem, .05, .05, M.gear); // cuff band, just wider than the sleeve end
  p.seg(W.clone().addScaledVector(fd, -.03), W.clone().addScaledVector(fd, .02), .031, .034, COMMON.glove); // wrist, narrower than the cuff
  p.seg(W.clone().addScaledVector(fd, -.012), W.clone().addScaledVector(fd, .004), .036, .036, M.accent); // team-colour glove strap
  const q = new THREE.Quaternion().setFromUnitVectors(new V(0,0,1), fd);
  const hc = H.clone().addScaledVector(fd, -.012);
  p.addM(SPH(.04,10,8), COMMON.glove, new THREE.Matrix4().compose(hc, q, new V(.78,.68,1.12))); // hand around the grip
  p.seg(hc.clone().add(new V(side * .03, .012, .0)), hc.clone().add(new V(side * .028, .03, -.03)), .012, .01, COMMON.glove);   // thumb
  p.addM(SPH(.03,10,8), COMMON.glove, new THREE.Matrix4().compose(hc.clone().add(new V(-side * .01, -.012, -.018)), q, new V(.9,.7,.8))); // curled fingers
  p.addM(BOX(.05,.012,.03), M.accent, new THREE.Matrix4().compose(hc.clone().add(new V(side*.026,.012,0)), q, new V(1,1,1)));   // knuckle guard
  const mid = new V().lerpVectors(S, E, .28); mid.x += side*.07;
  p.add(BOX(.01,.06,.06), M.gear, mid);                       // team shoulder patch
}
function makeAvatar(team, name, id, isBot){
  const M = soldierMats(team, isBot), h = hashStr(String(id));
  const variant = {pack: isBot ? (h >>> 5) % 3 === 0 : (h >>> 5) % 2 === 0};
  const owned = [];
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const hips = new THREE.Group(); hips.position.y = .95; body.add(hips);
  const spine = new THREE.Group(); spine.position.y = .06; hips.add(spine);
  const head = new THREE.Group(); head.position.y = .6; spine.add(head);

  // ---- pelvis
  let p = new Parts();
  p.add(latheGeo('pelvis', [[0,-.1],[.14,-.1],[.165,-.02],[.16,.08],[0,.1]]), M.pants, new V(), null, new V(1,1,.72));
  p.add(CYL(.172,.172,.055,18,true), M.gear, new V(0,.03,0), null, new V(1,1,.74));
  p.add(BOX(.04,.04,.02), COMMON.blackS, new V(0,.03,-.128));
  p.add(BOX(.06,.15,.08), M.gear, new V(.19,-.07,.0)); p.add(BOX(.04,.07,.05), COMMON.blackS, new V(.19,.0,.0));
  p.add(BOX(.12,.09,.07), M.gear, new V(-.05,-.02,.14));
  p.build(hips, owned, false);

  // ---- legs (articulated)
  const legs = [];
  for (const s of [-1, 1]){
    const thigh = new THREE.Group(); thigh.position.set(s*.095, -.02, 0); hips.add(thigh);
    p = new Parts();
    p.limb(new V(0,.07,0), new V(0,-.45,.005), 'th', LIMB.thigh, M.pants, .92);
    p.add(SPH(.088,12,8), M.pants, new V(s*.012,-.05,.008), null, new V(1,1.25,.95));     // seat / upper thigh volume
    p.add(BOX(.032,.13,.1), M.pants, new V(s*.083,-.21,-.004));                        // cargo pocket
    p.add(BOX(.036,.03,.104), M.accent, new V(s*.085,-.14,-.004));                     // team-colour pocket flap
    p.add(BOX(.006,.3,.022), M.accent, new V(s*.1,-.2,.03), [0,0,s*.04]);              // side seam stripe
    p.add(BOX(.07,.05,.012), M.dark, new V(0,-.1,-.083));                              // front thigh panel
    if (s > 0){                                                                        // drop-leg holster on the right
      p.add(BOX(.045,.15,.075), M.gear, new V(.1,-.17,.02)); p.add(BOX(.03,.06,.04), COMMON.blackS, new V(.1,-.075,.02));
      p.add(BOX(.047,.012,.077), M.accent, new V(.1,-.2,.02));
      p.add(BOX(.012,.02,.11), M.gear, new V(.06,-.12,0)); p.add(BOX(.012,.02,.11), M.gear, new V(.06,-.26,0));
    }
    p.build(thigh, owned, false);
    const knee = new THREE.Group(); knee.position.y = -.42; thigh.add(knee);
    p = new Parts();
    p.limb(new V(0,.04,.004), new V(0,-.3,0), 'sh', LIMB.shin, M.uni, .95);
    p.add(SPH(.05,10,8), M.uni, new V(0,-.1,.03), null, new V(1,1.6,.8));                     // calf
    p.add(SPH(.064,12,8), M.gear, new V(0,-.015,-.045), null, new V(1.08,1.35,.66));     // knee pad shell
    p.add(BOX(.074,.014,.06), M.accent, new V(0,-.02,-.075));                            // team-colour pad ridge
    p.add(CYL(.068,.068,.016,14,true), COMMON.blackS, new V(0,-.07,0));                  // strap
    p.add(CYL(.06,.064,.05,14), COMMON.boot, new V(0,-.25,0));                           // tall boot collar
    p.add(CYL(.065,.065,.014,14), M.accent, new V(0,-.232,0));                           // team-colour boot trim
    p.add(CYL(.056,.061,.2,14), COMMON.boot, new V(0,-.35,0));                           // boot shaft
    p.add(BOX(.1,.075,.17), COMMON.boot, new V(0,-.455,-.03));                          // foot
    p.add(SPH(.05,12,8), COMMON.boot, new V(0,-.46,-.115), null, new V(1,.72,1.05));     // rounded toe
    for (const s2 of [-1,1]) p.add(BOX(.006,.03,.12), M.accent, new V(s2*.052,-.45,-.02)); // accent side panels
    p.add(BOX(.104,.022,.25), COMMON.sole, new V(0,-.495,-.04));                       // sole
    for (let k=0;k<5;k++) p.add(BOX(.05,.006,.008), COMMON.blackS, new V(0,-.28 - k*.03,-.06));  // laces
    p.build(knee, owned, false);
    legs.push({thigh, knee, s});
  }

  // ---- torso, vest, arms (static rifle-holding pose)
  p = new Parts();
  p.add(latheGeo('torso2', [[0,0],[.16,0],[.17,.1],[.18,.22],[.205,.35],[.215,.43],[.18,.51],[0,.54]], 18), M.uni, new V(), null, new V(1.04,1,.66));
  // plate carrier: front/back plates, cummerbund and padded shoulder straps
  p.add(BOX(.37,.3,.065), M.vest, new V(0,.335,-.132)); p.add(BOX(.37,.32,.065), M.vest, new V(0,.33,.132));
  p.add(CYL(.198,.198,.12,18,true), M.vest, new V(0,.245,0), null, new V(1,1,.76));
  for (const s of [-1,1]){
    p.add(BOX(.08,.04,.29), M.vest, new V(s*.115,.478,0));                                         // shoulder straps
    p.add(BOX(.075,.022,.13), M.vest, new V(s*.17,.468,-.02), [0,0,s*-.35]);                     // strap pads
    p.add(BOX(.065,.11,.085), M.gear, new V(s*.21,.25,-.03));                                       // side pouches
    p.add(BOX(.022,.06,.022), COMMON.blackS, new V(s*.185,.23,-.085));                             // cummerbund buckles
    p.add(BOX(.11,.09,.065), M.gear, new V(s*.12,.205,-.19));                                        // lower utility pouches
    p.add(BOX(.112,.026,.07), M.vest, new V(s*.12,.25,-.19));
  }
  for (const x of [-.11,0,.11]){
    p.add(BOX(.09,.12,.058), M.gear, new V(x,.33,-.19));                                           // rifle magazine pouches
    p.add(BOX(.092,.03,.062), M.vest, new V(x,.385,-.19));                                        // flaps
    p.add(BOX(.06,.03,.032), COMMON.blackS, new V(x,.408,-.195));                                   // magazines peeking out
  }
  p.add(BOX(.17,.055,.045), M.gear, new V(0,.455,-.178));                                            // admin pouch
  p.add(BOX(.05,.04,.008), COMMON.blackS, new V(.07,.455,-.202));                                   // velcro ID panel
  p.add(BOX(.05,.1,.05), M.gear, new V(-.19,.38,-.06)); p.add(CYL(.004,.004,.32,4), COMMON.blackS, new V(-.19,.58,-.05)); // radio + antenna
  if (variant.pack){
    p.add(BOX(.28,.33,.13), M.gear, new V(0,.29,.23)); p.add(BOX(.22,.12,.05), M.vest, new V(0,.22,.3));
    p.add(CYL(.05,.05,.27,10), M.gear, new V(0,.48,.22), [0,0,Math.PI/2]);
  } else {
    p.add(BOX(.26,.28,.03), M.vest, new V(0,.31,.172));                                            // MOLLE back panel
    for (const x of [-.08,.08]) p.add(BOX(.1,.09,.055), M.gear, new V(x,.235,.19));                  // lower back pouches
    p.add(BOX(.16,.07,.05), M.gear, new V(0,.4,.19));
  }
  p.seg(new V(0,.5,0), new V(0,.62,0), .058, .058, M.balac);                                       // balaclava neck
  p.add(CYL(.084,.076,.055,16,true), M.uni, new V(0,.515,0), null, new V(1,1,.9));                // shirt collar
  p.add(BOX(.12,.018,.03), M.band, new V(0,.47,.17));                                              // team tape on the back
  p.add(CYL(.172,.166,.09,18,true), M.gear, new V(0,.05,0), null, new V(1.04,1,.68));              // belt over the shirt tail
  // shoulder caps (the arms themselves are posed per weapon below)
  for (const S of [SH_R, SH_L]) p.add(SPH(.08,12,10), M.uni, S);
  p.build(spine, owned, false);

  // ---- head: black balaclava, dark wrap goggles, team-colour bump helmet with rails, NVG mount and headset
  p = new Parts();
  p.add(SPH(.115,24,18), M.balac, new V(0,.13,0), null, new V(.95,1.1,1.02));
  p.add(SPH(.09,18,12), M.balac, new V(0,.072,-.03), null, new V(1.02,.8,1));                      // jaw
  p.add(SPH(.032,10,8), M.balac, new V(0,.05,-.085), null, new V(1.3,.9,.9));                      // chin
  p.add(BOX(.026,.045,.03), M.balac, new V(0,.122,-.113), [-.15,0,0]);                              // nose bridge under the fabric
  p.add(SPH(.068,16,8), M.balac, new V(0,.0,-.006), null, new V(1.02,.35,1.02));                    // neck fold
  // goggles: wide dark lens in a black frame, strap round the helmet
  p.add(cachedGeo('goggle', () => new THREE.CylinderGeometry(.118,.118,.05,20,1,true,Math.PI*.62,Math.PI*.76)), COMMON.blackS, new V(0,.152,-.004), null, new V(1,1,1.04));
  p.add(cachedGeo('gogLens', () => new THREE.CylinderGeometry(.122,.122,.034,20,1,true,Math.PI*.69,Math.PI*.62)), COMMON.goggle, new V(0,.152,-.004), null, new V(1,1,1.04));
  p.add(BOX(.018,.012,.012), COMMON.blackS, new V(0,.142,-.123));
  p.add(cachedGeo('helmet2', () => new THREE.SphereGeometry(.15,18,10,0,Math.PI*2,0,Math.PI*.5)), M.helm, new V(0,.158,.014), [.2,0,0], new V(.97,.92,1.05));
  p.add(cachedGeo('helmrim2', () => new THREE.TorusGeometry(.15,.011,6,24)), M.helm, new V(0,.158,.014), [Math.PI/2 + .2,0,0], new V(.97,1.05,1));
  p.add(cachedGeo('helmband', () => new THREE.CylinderGeometry(.15,.15,.02,24,1,true)), COMMON.blackS, new V(0,.168,.014), [.2,0,0], new V(.975,1,1.06));   // goggle strap
  p.add(BOX(.03,.012,.2), COMMON.blackS, new V(0,.296,.02), [.2,0,0]);                             // top rail / velcro strip
  for (const s of [-1,1]){
    p.add(BOX(.016,.03,.14), COMMON.blackS, new V(s*.147,.19,.02), [0,0,s*-.12]);                  // side rails
    p.add(CYL(.05,.05,.045,16), M.gear, new V(s*.125,.12,0), [0,0,Math.PI/2]);                     // headset ear cups
    p.add(CYL(.035,.035,.05,12), COMMON.blackS, new V(s*.128,.12,0), [0,0,Math.PI/2]);
  }
  p.add(BOX(.006,.006,.085), COMMON.blackS, new V(.1,.085,-.075), [0,.5,0]);                        // boom mic
  p.add(SPH(.008,6,5), COMMON.blackS, new V(.07,.082,-.112));
  p.add(BOX(.06,.045,.018), COMMON.blackS, new V(0,.24,-.13), [.32,0,0]);                          // NVG shroud
  p.add(BOX(.03,.02,.03), COMMON.blackS, new V(0,.225,-.145), [.32,0,0]);
  p.add(SPH(.06,10,8), M.gear, new V(0,.2,.125), null, new V(1.2,.9,.5));                          // counterweight pouch
  p.add(BOX(.028,.012,.028), M.patch, new V(0,.27,.1));
  p.build(head, owned, true);

  // ---- weapons, each with its own IK-posed pair of arms so the hands sit on the grips
  const weaponModels = buildWeaponModels(owned), weapons = [];
  weaponModels.forEach((wg, i) => {
    const holder = new THREE.Group(); holder.visible = i === 3; spine.add(holder);
    const hd = HOLD[i], s = hd.s;
    const off = hd.long ? new V(.14 - .12*s, .12, -.155 - HOLD_REAR[i]*s) : new V(...hd.off);
    wg.scale.setScalar(s); wg.position.copy(off); holder.add(wg);
    const ap = new Parts();
    buildArm(ap, M, SH_R, new V(...hd.R).multiplyScalar(s).add(off), hd.pr ? new V(...hd.pr) : POLE_R, 1);
    buildArm(ap, M, SH_L, new V(...hd.L).multiplyScalar(s).add(off), POLE_L, -1);
    ap.build(holder, owned, false);
    weapons.push(holder);
  });

  const hitBase = [], hitW = weapons.map(() => []);
  body.traverse(o => {
    if (!o.isMesh) return;
    o.userData = {id, head:!!o.userData.headPart};
    let q = o, wi = -1; while (q && q !== body){ const k = weapons.indexOf(q); if (k >= 0){ wi = k; break; } q = q.parent; }
    (wi >= 0 ? hitW[wi] : hitBase).push(o);
  });
  const hit = hitBase.concat(hitW[3]);
  const blob = new THREE.Mesh(BLOB_GEO, BLOB_ROUND); blob.rotation.x = -Math.PI/2; blob.position.y = .02; g.add(blob);
  let label = null; if (name !== null){ label = nameSprite(name, TEAM_HUE[team]); g.add(label); }
  scene.add(g);
  return {g, body, hips, spine, head, legs, weapons, hit, hitBase, hitW, owned, label, hue:TEAM_HUE[team], name, phase:0, flinch:0, kick:0, weapon:3, fallDir:(h & 1) ? 1 : -1, fallSide:((h >>> 2) % 3 - 1) * .4};
}
function relabel(av, name){ if (av.label){ av.g.remove(av.label); av.label.material.map.dispose(); } av.label = nameSprite(name, av.hue); av.g.add(av.label); av.name = name; }
function disposeAvatar(av){ scene.remove(av.g); av.owned.forEach(g => g.dispose()); if (av.label) av.label.material.map.dispose(); }
function setAvatarWeapon(av, w){ if (av.weapon === w) return; av.weapon = w; av.weapons.forEach((m,i) => m.visible = i === w); av.hit = av.hitBase.concat(av.hitW[w] || []); }
function animateAvatar(av, o){
  const dt = o.dt, k = Math.min(1, o.speed / 5.5), dir = o.fwd < -.5 ? -1 : 1;
  if (o.speed > .3) av.phase += dt * (3 + o.speed * 1.55) * dir;
  else av.phase += (Math.round(av.phase / Math.PI) * Math.PI - av.phase) * Math.min(1, dt*6);
  const sideK = Math.max(-1, Math.min(1, o.side / Math.max(.5, o.speed)));
  for (const L of av.legs){
    const ph = av.phase + (L.s > 0 ? Math.PI : 0);
    L.thigh.rotation.x = Math.sin(ph) * .62 * k + .04;
    L.thigh.rotation.z = Math.sin(ph) * .22 * k * sideK * -1;
    L.knee.rotation.x = -(Math.max(0, Math.cos(ph)) * 1.05 * k + .08);
  }
  av.body.position.y = -Math.abs(Math.sin(av.phase)) * .045 * k - .01;
  const sk = o.slideK || 0;
  if (sk > .01){
    for (const L of av.legs){
      L.thigh.rotation.x += ((L.s > 0 ? 1.45 : 1.15) - L.thigh.rotation.x) * sk; L.thigh.rotation.z *= 1 - sk;
      L.knee.rotation.x += ((L.s > 0 ? -.15 : -1.2) - L.knee.rotation.x) * sk;
    }
    av.body.position.y += (-.5 - av.body.position.y) * sk;
  }
  av.body.rotation.x = .38 * sk;
  av.flinch *= Math.pow(.004, dt);
  const breathe = Math.sin(now / 700) * .012;
  av.kick = (av.kick || 0) * Math.pow(.0003, dt);
  av.spine.rotation.x = (o.pitch || 0) * .75 + breathe + av.flinch * .35 + k * .06 + av.kick * .09;
  av.spine.rotation.y = Math.sin(av.phase) * .07 * k;
  av.spine.rotation.z = av.flinch * .08;
  av.head.rotation.x = (o.pitch || 0) * .3 - k * .05;
}
function animateDeath(av, t, dt){
  const e = Math.min(1, t / .5), ease = e*e*(3 - 2*e);
  av.body.rotation.x = ease * 1.48 * av.fallDir;
  av.body.rotation.z = ease * av.fallSide;
  av.body.position.y = 0;
  av.spine.rotation.x += (.5 * av.fallDir - av.spine.rotation.x) * Math.min(1, dt*6);
  av.head.rotation.x += (.6 * av.fallDir - av.head.rotation.x) * Math.min(1, dt*6);
  for (const L of av.legs){ L.thigh.rotation.x *= .9; L.knee.rotation.x += (-.35 - L.knee.rotation.x) * Math.min(1, dt*5); }
}

// ---- menu backdrop: a live skirmish between two soldiers, filmed by a slow handheld camera
const preview = [];
const MB = {
  // two fighters across a lane in the north-west quarter, with crates, cover walls and the perimeter behind them
  // a blue rifleman and a red machine-gunner trading fire in the open ground behind the blue cover walls,
  // filmed side-on so both stay in the right part of the screen, clear of the menu
  spots:[{team:0, w:3, at:new V(-2.9, 0, 21.4), amp:.5}, {team:1, w:6, at:new V(.5, 0, 19.5), amp:.6}],
  cam:null, focus:null, dist:5.3, rot:0, t:0,
};
const MUZZLE_LOCAL = {2:[.12,.365,-.58], 3:[.12,.37,-.93], 6:[.12,.36,-.99]};
const _mbRay = new THREE.Raycaster(), _mbA = new V(), _mbB = new V(), _mbD = new V();
function buildPreview(){
  MB.spots.forEach((sp, i) => {
    const av = makeAvatar(sp.team, null, 'menu' + i + 'z', false);
    av.g.traverse(m => { if (m.isMesh) m.userData = {}; });
    setAvatarWeapon(av, sp.w);
    av.g.position.copy(sp.at); av.team = sp.team;
    av.mb = {state:'strafe', t:rnd(0, .6), dir:i ? -1 : 1, off:0, shots:0, next:0, slide:0, vel:0};
    preview.push(av);
  });
}
function mbMuzzle(av, out){
  const hd = HOLD[av.weapon], s = hd.s, L = MUZZLE_LOCAL[av.weapon] || MUZZLE_LOCAL[3];
  const off = hd.long ? new V(.14 - .12*s, .12, -.155 - HOLD_REAR[av.weapon]*s) : new V(...hd.off);
  out.set(L[0]*s + off.x, L[1]*s + off.y, L[2]*s + off.z);
  av.spine.updateMatrixWorld(true); return av.spine.localToWorld(out);
}
function mbFire(av, foe){
  const m = mbMuzzle(av, _mbA);
  // aim at the other soldier but miss a little: rounds crack past and hit the scenery behind
  _mbB.copy(foe.g.position).add(new V(rnd(-.9, .9), rnd(.4, 1.9), rnd(-.9, .9)));
  _mbD.subVectors(_mbB, m).normalize();
  _mbRay.set(m, _mbD); _mbRay.far = 60;
  const hit = _mbRay.intersectObjects(worldMeshes, false)[0];
  const end = hit ? hit.point.clone() : m.clone().addScaledVector(_mbD, 60);
  addTracer(m.clone(), end); addMuzzleFlash(m.clone().addScaledVector(_mbD, .05));
  if (hit) addImpact(hit);
  av.kick = Math.min(1.5, (av.kick || 0) + .9);
  if (Math.random() < .12) foe.flinch = 1;
}
function updatePreview(dt){
  const show = !started;
  for (const av of preview) av.g.visible = show;
  if (!show) return;
  MB.t += dt;
  preview.forEach((av, i) => {
    const foe = preview[1 - i], b = av.mb, sp = MB.spots[i];
    const toFoe = _mbD.subVectors(foe.g.position, av.g.position); toFoe.y = 0; toFoe.normalize();
    const side = new V(-toFoe.z, 0, toFoe.x);            // strafing axis, across the line of fire
    b.t -= dt;
    let speed = 0;
    if (b.state === 'strafe'){
      const target = b.dir * sp.amp; speed = 3.2;
      const step = Math.sign(target - b.off) * Math.min(Math.abs(target - b.off), speed * dt); b.off += step; b.vel = step / Math.max(dt, 1e-4);
      if (b.t <= 0 || Math.abs(target - b.off) < .02){ b.state = 'fire'; b.t = rnd(.9, 1.6); b.shots = 0; b.next = 0; b.dir = -b.dir; }
    } else if (b.state === 'fire'){
      b.vel *= Math.pow(.001, dt); b.next -= dt;
      if (b.next <= 0){ mbFire(av, foe); b.next = av.weapon === 6 ? .095 : .12 + rnd(0, .05); }
      if (b.t <= 0){ const r = Math.random(); if (r < .25){ b.state = 'slide'; b.t = .75; } else { b.state = 'strafe'; b.t = rnd(.6, 1.2); } }
    } else if (b.state === 'slide'){   // dive sideways into a slide, then come back up
      const target = b.dir * sp.amp * 1.15; speed = 5;
      const step = Math.sign(target - b.off) * Math.min(Math.abs(target - b.off), speed * dt); b.off += step; b.vel = step / Math.max(dt, 1e-4);
      if (b.t <= 0){ b.state = 'fire'; b.t = rnd(.8, 1.3); b.dir = -b.dir; }
    }
    b.slide += ((b.state === 'slide' ? 1 : 0) - b.slide) * Math.min(1, dt * 9);
    av.g.position.copy(sp.at).addScaledVector(side, b.off);
    // keep facing the enemy; legs show the sideways step
    const yaw = Math.atan2(-toFoe.x, -toFoe.z);
    av.g.rotation.y += ((yaw - av.g.rotation.y + Math.PI*3) % (Math.PI*2) - Math.PI) * Math.min(1, dt * 8);
    const sv = Math.abs(b.vel);
    animateAvatar(av, {speed:sv, fwd:0, side:b.vel * (i ? -1 : 1), pitch:b.state === 'fire' ? -.02 : .05, dt, slideK:b.slide});
  });
}
function menuCamera(dt){
  const t = MB.t;
  if (!MB.cam){
    // camera on the perpendicular through the middle of the line of fire
    const B = MB.spots[0].at, Rd = MB.spots[1].at, line = new V().subVectors(Rd, B).setY(0), half = line.length() / 2;
    const n = new V(-line.z, 0, line.x).normalize(); if (n.z < 0) n.negate();
    MB.focus = new V().addVectors(B, Rd).multiplyScalar(.5).setY(1.1);
    MB.cam = MB.focus.clone().addScaledVector(n, MB.dist).setY(1.5);
    MB.rot = Math.atan(half / MB.dist) + .04;
  }
  camera.position.copy(MB.cam).add(new V(Math.sin(t * .23) * .16, Math.sin(t * .31) * .04, -Math.abs(Math.cos(t * .19)) * .15));
  camera.lookAt(MB.focus);
  // the menu covers the left of wide screens: turn the shot so the blue soldier sits mid-screen and the red one to the right
  const aspect = camera.aspect || 1.6;
  camera.rotateY(aspect > 1.3 ? MB.rot * (innerWidth < 900 ? 1.45 : 1) : 0);
  camera.rotateZ(Math.sin(t * .7) * .004); camera.rotateX(Math.sin(t * 1.1) * .002);
}

// ================= Effects =================
const tracers = [], puffs = [], decals = [];
const tracerMat = new THREE.LineBasicMaterial({color:0xffe1a0, transparent:true, opacity:.95, blending:THREE.AdditiveBlending, depthWrite:false});
const TRACER_GEO = new THREE.CylinderGeometry(.01, .01, 1, 5, 1, true); TRACER_GEO.rotateX(Math.PI/2); TRACER_GEO.translate(0, 0, .5);
const TRACER_MAT = new THREE.MeshBasicMaterial({color:new THREE.Color(4.2, 2.9, 1.3), transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false});
function addTracer(o, e){
  const dir = e.clone().sub(o), L = dir.length(); if (L < .5) return; dir.divideScalar(L);
  const m = new THREE.Mesh(TRACER_GEO, TRACER_MAT); m.position.copy(o); m.lookAt(e); m.scale.set(1,1,.01); scene.add(m);
  tracers.push({m, o:o.clone(), dir, L, t:0, len:Math.min(6, L*.6)});
  if (tracers.length > (quality === 0 ? 30 : 120)){ const t = tracers.shift(); scene.remove(t.m); }
}
const _spritePool = [];
function spawnSprite(p, opts){
  if (puffs.length > (quality === 0 ? (MOBILE ? 50 : 90) : quality === 1 ? 220 : 320)) return;
  let s = _spritePool.pop();
  if (!s){ s = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, depthWrite:false})); s.layers.set(1); }
  const m = s.material; m.map = opts.tex || TEX.soft; m.color.set(opts.color === undefined ? 0xffffff : opts.color);
  m.opacity = opts.fadeIn ? 0 : (opts.op ?? 1); m.blending = opts.add ? THREE.AdditiveBlending : THREE.NormalBlending;
  m.rotation = opts.rot ?? (opts.tex ? Math.random()*6.28 : 0);
  s.position.copy(p); s.scale.setScalar(opts.size); scene.add(s);
  puffs.push({s, v:opts.v || new V(), life:opts.life, max:opts.life, grow:opts.grow || 0, grav:opts.grav || 0, op:opts.op ?? 1, spin:opts.spin || 0, fadeIn:opts.fadeIn || 0});
}
// pooled lights so remote muzzle flashes can light the surroundings without changing the light count
const FX_LIGHTS = [0].map(() => { const l = new THREE.PointLight(0xffb060, 0, 9, 2); scene.add(l); return l; });
function lightFlash(p, color, intensity, dist){
  let L = FX_LIGHTS[0]; for (const l of FX_LIGHTS) if (l.intensity < L.intensity) L = l;
  L.position.copy(p); L.color.setHex(color); L.intensity = intensity; L.distance = dist;
}
// small physical debris chunks for impacts and explosions
const debris = [], DEB_GEO = new THREE.DodecahedronGeometry(.025, 0), DEB_MAT = stdMat({color:C(0x6e665a), roughness:.95});
function spawnDebris(p, n, count, size){
  for (let i=0;i<count;i++){
    if (debris.length > 70){ const o = debris.shift(); scene.remove(o.m); }
    const m = new THREE.Mesh(DEB_GEO, DEB_MAT); m.scale.setScalar((size || 1) * rnd(.6, 1.4));
    m.position.copy(p).addScaledVector(n, .04); m.rotation.set(rnd(0,3), rnd(0,3), 0); scene.add(m);
    debris.push({m, v:n.clone().multiplyScalar(rnd(1.5,3.5)).add(new V(rnd(-1.5,1.5), rnd(.5,2.5), rnd(-1.5,1.5))), spin:new V(rnd(-15,15), rnd(-15,15), rnd(-15,15)), life:rnd(2,3.5), rest:false});
  }
}
const waves = [];
function updateDebris(dt){
  for (let i=debris.length-1;i>=0;i--){
    const c = debris[i]; c.life -= dt;
    if (!c.rest){
      c.v.y -= 9.8*dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += c.spin.x*dt; c.m.rotation.y += c.spin.y*dt;
      const gh = groundAt(c.m.position.x, c.m.position.z, c.m.position.y + .1) + .02;
      if (c.m.position.y < gh){ c.m.position.y = gh; if (Math.abs(c.v.y) < 1) c.rest = true; else { c.v.y *= -.3; c.v.x *= .5; c.v.z *= .5; c.spin.multiplyScalar(.4); } }
    }
    if (c.life < .4) c.m.scale.multiplyScalar(Math.pow(.02, dt));
    if (c.life <= 0){ scene.remove(c.m); debris.splice(i,1); }
  }
  for (let i=waves.length-1;i>=0;i--){
    const w = waves[i]; w.t += dt; const k = w.t / .45;
    w.m.scale.setScalar(1 + k*22); w.m.material.opacity = Math.max(0, 1 - k) * .55;
    if (k >= 1){ scene.remove(w.m); w.m.material.dispose(); waves.splice(i,1); }
  }
  for (const l of FX_LIGHTS) l.intensity *= Math.pow(.00001, dt);
}
function addPuff(p, color){
  if (color === 0x9a1d12){
    for (let i=0;i<5;i++) spawnSprite(p, {color:C(0x7a1006), size:rnd(.05,.11), life:rnd(.25,.45), v:new V(rnd(-1.6,1.6), rnd(0,2), rnd(-1.6,1.6)), grav:7, op:.95});
    spawnSprite(p, {tex:TEX.smoke, color:C(0x6a0c05), size:.3, life:.45, grow:1.6, op:.6, spin:rnd(-1,1)});
  } else {
    for (let i=0;i<3;i++) spawnSprite(p, {tex:TEX.smoke, color:C(0xb8ab8c), size:rnd(.18,.32), life:rnd(.6,1), v:new V(rnd(-.4,.4), rnd(.2,.8), rnd(-.4,.4)), grow:1.5, op:.55, fadeIn:.15, spin:rnd(-1,1)});
  }
}
const _n = new V(), _q = new V();
const decalGeo = new THREE.PlaneGeometry(.11, .11);
const decalMat = new THREE.MeshBasicMaterial({map:TEX.hole, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4});
function addImpact(hit){
  const p = hit.point;
  _n.set(0,1,0);
  if (hit.face) _n.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  const d = new THREE.Mesh(decalGeo, decalMat); d.position.copy(p).addScaledVector(_n, .005);
  d.lookAt(_q.copy(p).add(_n)); d.rotation.z = Math.random()*6; d.scale.setScalar(rnd(.7,1.2));
  d.layers.set(1); scene.add(d); decals.push(d);
  if (decals.length > (quality === 0 ? 24 : 90)){ const o = decals.shift(); scene.remove(o); }
  const spark = new THREE.Color(3.2, 2.1, .9);
  for (let i=0;i<7;i++) spawnSprite(p, {color:spark, size:rnd(.022,.045), life:rnd(.1,.28), v:_n.clone().multiplyScalar(rnd(2.5,5.5)).add(new V(rnd(-2.2,2.2), rnd(-1,2.4), rnd(-2.2,2.2))), grav:12, add:true});
  spawnSprite(p.clone().addScaledVector(_n, .02), {tex:TEX.flash, color:new THREE.Color(2.2, 1.6, .9), size:.16, life:.05, add:true});
  for (let i=0;i<3;i++) spawnSprite(p.clone().addScaledVector(_n, .08), {tex:TEX.smoke, color:C(0xb5a98a), size:rnd(.18,.32), life:rnd(.6,1.1), v:_n.clone().multiplyScalar(rnd(.4,.9)).add(new V(0, rnd(.1,.4), 0)), grow:1.7, op:.5, fadeIn:.12, spin:rnd(-1,1)});
  spawnDebris(p, _n, 3, 1);
}
function addMuzzleFlash(p){
  spawnSprite(p, {tex:TEX.flash, color:new THREE.Color(2.6, 1.9, 1.1), size:rnd(.45,.7), life:.05, add:true});
  spawnSprite(p, {tex:TEX.smoke, color:C(0xbdb8ae), size:.22, life:.9, v:new V(rnd(-.15,.15), .35, rnd(-.15,.15)), grow:2.2, op:.28, fadeIn:.1, spin:rnd(-1,1)});
  lightFlash(p, 0xffb060, 3.2, 9);
}
function updateFx(dt){
  WIND.value = now / 1000;
  for (let i=tracers.length-1;i>=0;i--){
    const tr = tracers[i]; tr.t += dt;
    const head = tr.t * 330, a = Math.max(0, head - tr.len), b = Math.min(tr.L, head);
    if (a >= tr.L){ scene.remove(tr.m); tracers.splice(i,1); continue; }
    tr.m.position.copy(tr.o).addScaledVector(tr.dir, a); tr.m.scale.z = Math.max(.01, b - a);
  }
  for (let i=puffs.length-1;i>=0;i--){ const p = puffs[i]; p.life -= dt;
    p.s.position.addScaledVector(p.v, dt); p.v.y -= p.grav*dt; p.v.multiplyScalar(Math.pow(.2, dt));
    if (p.grow) p.s.scale.multiplyScalar(1 + p.grow*dt);
    if (p.spin) p.s.material.rotation += p.spin*dt;
    { const k = Math.max(0, p.life/p.max); p.s.material.opacity = (p.fadeIn ? Math.min(k, (1 - k) / p.fadeIn) : k) * p.op; }
    if (p.life <= 0){ scene.remove(p.s); if (_spritePool.length < 400) _spritePool.push(p.s); else p.s.material.dispose(); puffs.splice(i,1); } }
  if (quality > 0) updateDust(dt);
}

let GRASS = null, PEBBLES = null;
await loadStep(53, 'Çevre ve bitki örtüsü');
// ================= Graphics upgrade: env, clouds, grass, contact shadows =================
// image-based lighting from the sky so metal and painted surfaces pick up real reflections
function buildEnv(){
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({map:SKY_TEX, side:THREE.BackSide})));
    const gr = new THREE.Mesh(new THREE.CircleGeometry(9.9, 32), new THREE.MeshBasicMaterial({color:C(0x6e5f45)}));
    gr.rotation.x = -Math.PI/2; gr.position.y = -.6; es.add(gr);
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(.6, 12, 8), new THREE.MeshBasicMaterial({color:new THREE.Color(14, 12, 9).multiplyScalar(Math.min(1, sun.intensity / 2.6))}));
    sunBall.position.copy(SUN_DIR).multiplyScalar(9); es.add(sunBall);
    const old = scene.environment;
    scene.environment = pm.fromScene(es, .03).texture;
    if (old) old.dispose();
    pm.dispose();
  } catch(e){}
}
buildEnv();

// clouds
const clouds = [];
(() => {
  const c = makeCanvas(256, 128), g = c.getContext('2d');
  for (let i=0;i<26;i++){
    const x = rnd(40, 216), y = rnd(50, 95) - (Math.abs(x-128) < 50 ? 18 : 0), r = rnd(18, 40);
    const gr = g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,.85)'); gr.addColorStop(.6,'rgba(245,245,250,.45)'); gr.addColorStop(1,'rgba(240,240,245,0)');
    g.fillStyle = gr; g.fillRect(x-r,y-r,r*2,r*2);
  }
  const shade = g.createLinearGradient(0,40,0,128); shade.addColorStop(0,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(90,100,120,.35)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = shade; g.fillRect(0,0,256,128);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  for (let i=0;i<28;i++){
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, opacity:rnd(.55,.9), fog:false, depthWrite:false}));
    const a = Math.random()*Math.PI*2, r = rnd(120, 380), w = rnd(80, 170);
    s.position.set(Math.cos(a)*r, rnd(70, 140), Math.sin(a)*r); s.scale.set(w, w*.5, 1);
    s.userData.v = rnd(.6, 1.6); s.renderOrder = -5; scene.add(s); clouds.push(s);
  }
})();
function updateClouds(dt){
  for (const s of clouds){ s.position.x += s.userData.v * dt; if (s.position.x > 400) s.position.x = -400; }
}

// grass tufts (crossed alpha planes, instanced)
(() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  for (let i=0;i<70;i++){
    const x = rnd(10,118), h = rnd(50,120), lean = rnd(-18,18);
    g.strokeStyle = `hsl(${rnd(60,85)},${rnd(30,45)}%,${rnd(22,42)}%)`; g.lineWidth = rnd(1.5,3.5);
    g.beginPath(); g.moveTo(x,128); g.quadraticCurveTo(x+lean*.3,128-h*.6,x+lean,128-h); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const p1 = new THREE.PlaneGeometry(1, .7).toNonIndexed(); p1.translate(0,.35,0);
  const p2 = p1.clone(); p2.rotateY(Math.PI/2);
  const p3 = p1.clone(); p3.rotateY(Math.PI/4);
  const geo = new THREE.BufferGeometry();
  for (const k of ['position','normal','uv']){
    const arrs = [p1,p2,p3].map(p => p.attributes[k].array), len = arrs.reduce((a,b) => a + b.length, 0), out = new Float32Array(len);
    let o = 0; for (const a of arrs){ out.set(a, o); o += a.length; }
    geo.setAttribute(k, new THREE.BufferAttribute(out, p1.attributes[k].itemSize));
  }
  // normals pointing up make the tufts light like the ground
  const n = geo.attributes.normal; for (let i=0;i<n.count;i++) n.setXYZ(i, 0, 1, 0);
  const mat = addWind(new THREE.MeshLambertMaterial({map:tex, alphaTest:.45, side:THREE.DoubleSide}), .35, true);
  const spots = [];
  for (let i=0;i<2600;i++){ const a = Math.random()*Math.PI*2, r = rnd(27.5, 75); spots.push([Math.cos(a)*r, Math.sin(a)*r, rnd(.8,1.6), 'out']); }
  for (let i=0;i<420;i++){
    const side = Math.floor(Math.random()*4), t = rnd(-A0+1, A0-1), off = A0 - rnd(.6, 2.2);
    const [x,z] = side === 0 ? [t, off] : side === 1 ? [t, -off] : side === 2 ? [off, t] : [-off, t];
    spots.push([x, z, rnd(.5, .9), 'edge']);
  }
  spots.reverse();
  spots.forEach(sp => sp.push(rnd(0,6), rnd(.8,1.3)));
  const inst = new THREE.InstancedMesh(geo, mat, spots.length); GRASS = inst; GRASS.userData.spots = spots;
  inst.receiveShadow = true; scene.add(inst);
  // pebbles and debris on the arena floor
  const peb = new THREE.InstancedMesh(MOBILE ? new THREE.OctahedronGeometry(.07, 0) : new THREE.DodecahedronGeometry(.07, 0), stdMat({color:C(0x8a8274)}), 500);
  peb.userData.spots = []; for (let i=0;i<500;i++) peb.userData.spots.push([rnd(-A0+1,A0-1), rnd(-A0+1,A0-1), rnd(0,3), rnd(0,3), rnd(.5,1.8)]);
  peb.receiveShadow = true; scene.add(peb); PEBBLES = peb;
})();

// soft contact shadows at the base of every obstacle and under each soldier
const BLOB_TEX = (() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 22; g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(30,30,68,68);
  return new THREE.CanvasTexture(c);
})();
const BLOB_MAT = new THREE.MeshBasicMaterial({map:BLOB_TEX, transparent:true, opacity:.55, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
const BLOB_GEO = new THREE.CircleGeometry(.42, 20);
const BLOB_ROUND = new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.55, depthWrite:false});
const _blobMark = scene.children.length;
for (const [a, len, rotY] of [[[0,-A0+.5], A0*2, 0],[[0,A0-.5], A0*2, 0],[[-A0+.5,0], A0*2, Math.PI/2],[[A0-.5,0], A0*2, Math.PI/2]]){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.2), BLOB_MAT); m.rotation.set(-Math.PI/2, 0, rotY); m.position.set(a[0], .013, a[1]); perimAdd(m, 'edge', true);
}
STATIC_ROOTS.push(...scene.children.slice(_blobMark));

// ---- build (or rebuild) the interior of the current map
const CAN_MAT = stdMat({color:C(0x4b5236), roughness:.6, metalness:.3});
const RUBBLE_MAT = new THREE.MeshStandardMaterial({color:C(0x8c877e), roughness:.95, flatShading:true});
const RUBBLE_GEO = new THREE.DodecahedronGeometry(1, 0);
function buildArena(){
  // throw away the previous interior
  ARENA.traverse(o => { if (o.isMesh && o.geometry && o.geometry !== RUBBLE_GEO && o.geometry !== BLOB_GEO) o.geometry.dispose(); });
  ARENA.clear(); ARENA_SOLIDS = []; SANDBAGS = null;
  if (!ARENA.parent) scene.add(ARENA);
  const inner = BOXES.slice(WALLS_N);
  inner.forEach(addArenaBox);
  buildSandbags(inner.filter(b => b.c === 'sandbag'));
  for (const b of inner){                                   // soft contact shadow at the foot of every obstacle
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 1.1, b.d + 1.1), BLOB_MAT);
    m.rotation.x = -Math.PI/2; m.position.set(b.x, .014, b.z); ARENA.add(m);
  }
  for (const b of inner.filter(b => b.c === 'crate').slice(0, 10)){
    if (Math.random() < .5) continue;
    const c = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .14), CAN_MAT); c.position.set(b.x + rnd(-.3,.3), b.h + .1, b.z + rnd(-.3,.3)); c.rotation.y = rnd(0,3); ARENA.add(c);
  }
  const rubbleM = [];
  for (const b of inner.filter(b => b.c === 'concrete' || b.c === 'pillar' || b.c === 'wall')){
    for (let i=0;i<5;i++){
      const side = Math.floor(Math.random()*4), r = rnd(.06, .2);
      const x = b.x + (side < 2 ? (side ? 1 : -1) * (b.w/2 + rnd(.05,.35)) : rnd(-b.w/2, b.w/2));
      const z = b.z + (side >= 2 ? (side === 3 ? 1 : -1) * (b.d/2 + rnd(.05,.35)) : rnd(-b.d/2, b.d/2));
      rubbleM.push(new THREE.Matrix4().compose(new V(x, r*.6, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0,3), rnd(0,3), 0)), new V(r, r, r)));
    }
  }
  if (rubbleM.length){ const im = new THREE.InstancedMesh(RUBBLE_GEO, RUBBLE_MAT, rubbleM.length); rubbleM.forEach((m, i) => im.setMatrixAt(i, m)); im.receiveShadow = true; ARENA.add(im); }
  // collision / hit lists: perimeter + this interior
  worldMeshes.length = 0; worldMeshes.push(floor, ...PERIM_MESHES, ...ARENA_SOLIDS);
  solidMeshes.length = 0; solidMeshes.push(...PERIM_MESHES, ...ARENA_SOLIDS);
  // merge what shares a material so the new layout costs few draw calls
  ARENA.updateMatrixWorld(true);
  const list = ARENA.children.filter(o => batchableMesh(o));
  mergeGroupMeshes(list, ARENA, o => Math.floor(o.position.x / A) + ',' + Math.floor(o.position.z / A));
  list.forEach(o => { if (o.userData.batchedInto) o.visible = false; });
  if (typeof liteOn !== 'undefined' && liteOn) liteSweep();
  renderer.shadowMap.needsUpdate = true;
}
function applyLayout(id){
  layoutMap(id); relayoutPerim(); buildArena();
  if (typeof buildZoneVisuals === 'function') buildZoneVisuals();
  if (typeof syncGoalLabels === 'function') syncGoalLabels();
}
function setMap(id, fromNet){
  id = Math.max(0, Math.min(MAPS.length - 1, id | 0));
  document.querySelectorAll('[data-map]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.map === id));
  if (id === mapId && ARENA.children.length) return;
  mapId = id; if (!fromNet){ try { localStorage.setItem('cephe-map', String(id)); } catch(e){} }
  applyLayout(id);
  for (const d of decals) scene.remove(d); decals.length = 0;
  if (isHost && started){ resetPickups(); resetZones(); for (const e of ents.values()) if (e.alive) spawnEnt(e); hostBroadcast(true); }
  if (started) perfToast(`Harita: ${MAPS[id].name}`);
}

// ejected shell casings
const casings = [];
const CASE_GEO = new THREE.CylinderGeometry(.009, .009, .045, 8);
const CASE_MAT = stdMat({color:C(0xc89b3c), roughness:.3, metalness:1});
const SHELL_MAT = stdMat({color:C(0x9c2a1e), roughness:.5, metalness:.2});
const ejector = new THREE.Object3D(); ejector.position.set(.05, .06, -.05); viewRoot.add(ejector);
function ejectCasing(){
  if (casings.length > 50){ const o = casings.shift(); scene.remove(o.m); }
  const W = WEAPONS[me.weapon];
  if (!W.shell && !W.casing) return;
  const m = new THREE.Mesh(CASE_GEO, W.shell ? SHELL_MAT : CASE_MAT);
  if (W.shell) m.scale.set(2.2, 1.6, 2.2); else m.scale.setScalar(W.casing);
  ejector.getWorldPosition(m.position); m.rotation.set(rnd(0,3), rnd(0,3), rnd(0,3));
  const right = new V(Math.cos(me.yaw), 0, -Math.sin(me.yaw));
  const v = right.multiplyScalar(rnd(1.6, 2.6)).add(new V(0, rnd(1.6, 2.4), 0)).add(me.vel.clone().setY(0));
  scene.add(m);
  casings.push({m, v, spin:new V(rnd(-20,20), rnd(-20,20), rnd(-20,20)), life:6, rest:false});
}
function groundAt(x, z, y){
  let h = 0;
  for (const b of BOXES) if (Math.abs(x-b.x) < b.w/2 && Math.abs(z-b.z) < b.d/2 && y >= b.h - .05) h = Math.max(h, b.h);
  return h;
}
function updateCasings(dt){
  for (let i=casings.length-1;i>=0;i--){
    const c = casings[i]; c.life -= dt;
    if (!c.rest){
      c.v.y -= 9.8*dt; c.m.position.addScaledVector(c.v, dt);
      c.m.rotation.x += c.spin.x*dt; c.m.rotation.y += c.spin.y*dt; c.m.rotation.z += c.spin.z*dt;
      const gh = groundAt(c.m.position.x, c.m.position.z, c.m.position.y + .1) + .01;
      if (c.m.position.y < gh){
        c.m.position.y = gh;
        if (Math.abs(c.v.y) < .8){ c.rest = true; c.m.rotation.x = Math.PI/2; }
        else { c.v.y = -c.v.y * .35; c.v.x *= .5; c.v.z *= .5; c.spin.multiplyScalar(.5); }
      }
    }
    if (c.life <= 0){ scene.remove(c.m); casings.splice(i,1); }
  }
}

// ---- custom post shaders (AO + god rays), shared by game and compile test
const AO_SHADER = {
  vertex: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  ao: [
    'uniform sampler2D tDepth; uniform vec2 texel; uniform vec2 projScale; uniform float cameraNear, cameraFar, radius, intensity;',
    'varying vec2 vUv;',
    'float viewZ(vec2 uv){ float d = texture2D(tDepth, uv).x; return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar); }',
    'vec3 viewPos(vec2 uv){ float z = viewZ(uv); return vec3((uv * 2.0 - 1.0) / projScale * -z, z); }',
    'void main(){',
    '  float d0 = texture2D(tDepth, vUv).x;',
    '  if (d0 >= 0.99999){ gl_FragColor = vec4(1.0); return; }',
    '  vec3 p = viewPos(vUv);',
    '  vec3 pr = viewPos(vUv + vec2(texel.x, 0.0)), pl = viewPos(vUv - vec2(texel.x, 0.0));',
    '  vec3 pu = viewPos(vUv + vec2(0.0, texel.y)), pd = viewPos(vUv - vec2(0.0, texel.y));',
    '  vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl;',
    '  vec3 dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;',
    '  vec3 n = normalize(cross(dx, dy));',
    '  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
    '  vec2 rUv = min(vec2(0.1), radius * projScale * 0.5 / -p.z);',
    '  float occ = 0.0;',
    '  for (int i = 0; i < AO_SAMPLES; i++){',
    '    float fi = (float(i) + jit) / float(AO_SAMPLES);',
    '    float a = (float(i) + jit) * 2.39996323 + jit * 6.2831853;',
    '    vec2 off = vec2(cos(a), sin(a)) * rUv * (0.15 + 0.85 * fi * fi);',
    '    vec3 q = viewPos(vUv + off) - p;',
    '    float dist = length(q);',
    '    occ += max(0.0, dot(n, q / max(dist, 1e-4)) - 0.08) * (1.0 - smoothstep(radius * 0.4, radius * 1.5, dist));',
    '  }',
    '  float ao = clamp(1.0 - occ / float(AO_SAMPLES) * intensity, 0.0, 1.0);',
    '  gl_FragColor = vec4(ao, ao, ao, 1.0);',
    '}'].join('\n'),
  blur: [
    'uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 texel; uniform float cameraNear, cameraFar;',
    'varying vec2 vUv;',
    'float lz(vec2 uv){ float d = texture2D(tDepth, uv).x; return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar); }',
    'void main(){',
    '  float z0 = lz(vUv), sum = 0.0, wsum = 0.0;',
    '  for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++){',
    '    vec2 uv = vUv + vec2(float(x), float(y)) * texel;',
    '    float w = 1.0 / (1e-3 + abs(lz(uv) - z0) * 4.0) * (1.0 - 0.12 * float(abs(x) + abs(y)));',
    '    sum += texture2D(tAO, uv).r * w; wsum += w;',
    '  }',
    '  float ao = sum / wsum; gl_FragColor = vec4(ao, ao, ao, 1.0);',
    '}'].join('\n'),
  composite: [
    'uniform sampler2D tDiffuse; uniform sampler2D tAO; uniform float strength;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec4 c = texture2D(tDiffuse, vUv);',
    '  float ao = mix(1.0, texture2D(tAO, vUv).r, strength);',
    '  gl_FragColor = vec4(c.rgb * ao, c.a);',
    '}'].join('\n'),
};
const RAYS_FRAG = [
  'uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform float useDepth; uniform vec2 sunPos; uniform float strength; uniform vec3 tintR; varying vec2 vUv;',
  'void main(){',
  '  vec3 base = texture2D(tDiffuse, vUv).rgb;',
  '  if (strength < 0.001){ gl_FragColor = vec4(base, 1.0); return; }',
  '  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
  '  vec2 delta = (vUv - sunPos) / float(RAY_SAMPLES) * 0.95; vec2 uv = vUv - delta * jit; float decay = 1.0; vec3 acc = vec3(0.0);',
  '  for (int i = 0; i < RAY_SAMPLES; i++){',
  '    uv -= delta;',
  '    vec2 cuv = clamp(uv, 0.0, 1.0);',
  '    vec3 c = texture2D(tDiffuse, cuv).rgb;',
  '    float sky = useDepth > 0.5 ? step(0.99999, texture2D(tDepth, cuv).x) : max(dot(c, vec3(0.3, 0.59, 0.11)) - 0.55, 0.0);',
  '    acc += c * sky * decay; decay *= RAY_DECAY;',
  '  }',
  '  gl_FragColor = vec4(base + acc * strength * tintR * 0.3, 1.0);',
  '}'].join('\n');

// ================= Ambient occlusion pass (depth-only SSAO, half resolution) =================
// Transparent effects, sprites, lines, alpha-tested foliage and the sky live on layer 1 so they
// are excluded from the depth pre-pass but still drawn normally by the main camera.
function syncFxLayers(){
  scene.traverse(o => {
    if (o.userData._lc) return; o.userData._lc = 1;
    const m = o.material;
    if (o.isSprite || o.isPoints || o.isLine || (m && !Array.isArray(m) && (m.transparent || m.alphaTest > 0 || m.side === THREE.BackSide))) o.layers.set(1);
  });
}
function makeAOPass(samples){
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const depthRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter});
  depthRT.depthTexture = new THREE.DepthTexture(2, 2); depthRT.depthTexture.type = THREE.UnsignedIntType;
  depthRT.depthTexture.minFilter = depthRT.depthTexture.magFilter = THREE.NearestFilter;
  const aoRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false});
  const blurRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false});
  const base = {depthTest:false, depthWrite:false, vertexShader:AO_SHADER.vertex};
  const aoMat = new THREE.ShaderMaterial(Object.assign({defines:{AO_SAMPLES:samples}, fragmentShader:AO_SHADER.ao,
    uniforms:{tDepth:{value:depthRT.depthTexture}, texel:{value:new THREE.Vector2()}, projScale:{value:new THREE.Vector2(1,1)}, cameraNear:{value:camera.near}, cameraFar:{value:camera.far}, radius:{value:.6}, intensity:{value:1.8}}}, base));
  const blurMat = new THREE.ShaderMaterial(Object.assign({fragmentShader:AO_SHADER.blur,
    uniforms:{tAO:{value:aoRT.texture}, tDepth:{value:depthRT.depthTexture}, texel:{value:new THREE.Vector2()}, cameraNear:{value:camera.near}, cameraFar:{value:camera.far}}}, base));
  const compMat = new THREE.ShaderMaterial(Object.assign({fragmentShader:AO_SHADER.composite,
    uniforms:{tDiffuse:{value:null}, tAO:{value:blurRT.texture}, strength:{value:1}}}, base));
  const depthMat = new THREE.MeshBasicMaterial({colorWrite:false});
  return {
    enabled:true, needsSwap:true, clear:false, renderToScreen:false, depthTex:depthRT.depthTexture,
    setSize(w, h){
      const hw = Math.max(1, Math.floor(w / 2)), hh = Math.max(1, Math.floor(h / 2));
      depthRT.setSize(hw, hh); aoRT.setSize(hw, hh); blurRT.setSize(hw, hh);
      aoMat.uniforms.texel.value.set(1/hw, 1/hh); blurMat.uniforms.texel.value.set(1/hw, 1/hh);
    },
    render(renderer, writeBuffer, readBuffer){
      syncFxLayers();
      const oldOverride = scene.overrideMaterial, oldBg = scene.background, oldAuto = renderer.shadowMap.autoUpdate, oldClear = renderer.autoClear;
      camera.layers.set(0); scene.overrideMaterial = depthMat; scene.background = null; renderer.shadowMap.autoUpdate = false; renderer.autoClear = true;
      renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(scene, camera);
      scene.overrideMaterial = oldOverride; scene.background = oldBg; renderer.shadowMap.autoUpdate = oldAuto; camera.layers.enable(0); camera.layers.enable(1);
      const pe = camera.projectionMatrix.elements;
      aoMat.uniforms.projScale.value.set(pe[0], pe[5]);
      for (const m of [aoMat, blurMat]){ m.uniforms.cameraNear.value = camera.near; m.uniforms.cameraFar.value = camera.far; }
      quad.material = aoMat; renderer.setRenderTarget(aoRT); renderer.render(quad, quadCam);
      quad.material = blurMat; renderer.setRenderTarget(blurRT); renderer.render(quad, quadCam);
      compMat.uniforms.tDiffuse.value = readBuffer.texture; quad.material = compMat;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); renderer.render(quad, quadCam);
      renderer.autoClear = oldClear;
    },
    dispose(){ depthRT.dispose(); aoRT.dispose(); blurRT.dispose(); aoMat.dispose(); blurMat.dispose(); compMat.dispose(); },
  };
}

await loadStep(59, 'Işık ve efektler');
// ================= Post-processing & quality presets =================
const GradeShader = {
  uniforms:{tDiffuse:{value:null}, vig:{value:.42}, sat:{value:1.1}, contrast:{value:1.07}, tint:{value:new THREE.Vector3(1.03, 1.0, .95)}, grain:{value:.025}, time:{value:0}, ca:{value:.0055}},
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:[
    'uniform sampler2D tDiffuse; uniform float vig, sat, contrast, grain, time, ca; uniform vec3 tint; varying vec2 vUv;',
    'vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }',
    'void main(){',
    '  vec2 cao = (vUv - 0.5) * ca;',
    '  vec3 raw = vec3(texture2D(tDiffuse, vUv + cao).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - cao).b);',
    '  vec3 c = toSRGB(clamp(raw, 0.0, 1.0));',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c = mix(vec3(l), c, sat);',
    '  c = (c - 0.5) * contrast + 0.5;',
    '  c *= mix(vec3(0.94, 0.98, 1.06), tint, smoothstep(0.15, 0.7, l));',
    '  vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * vig * 2.2;',
    '  c += (hash(vUv * 1000.0) - 0.5) * grain;',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'].join('\n'),
};
const QUALITY = [
  {name:'Düşük',  pr:MOBILE ? 1.15 : .75, shadow:1024, soft:false, post:false, bloom:false, msaa:false, rays:0,  ao:0,  grass:MOBILE ? 0 : .2, shadowEvery:3, lite:true,  rain:MOBILE ? 400 : 900, noShadow:true, far:340},
  {name:'Orta',   pr:MOBILE ? 1.6 : 1, shadow:1024, soft:true,  post:false, bloom:false, msaa:false, rays:0,  ao:0,  grass:.5, shadowEvery:2, lite:false, rain:1600},
  {name:'Yüksek', pr:MOBILE ? 2.1 : 1.25,shadow:2048, soft:true,  post:true,  bloom:true,  msaa:false, rays:32, ao:0,  grass:1,  shadowEvery:1, lite:false, rain:2600},
  {name:'Ultra',  pr:MOBILE ? 3 : 2,   shadow:4096, soft:true,  post:true,  bloom:true,  msaa:true,  rays:64, ao:12, grass:1,  shadowEvery:1, lite:false, rain:2600},
]
let quality = 2, composer = null, bloomPass = null, gradePass = null, fxaaPass = null, rayPass = null, aoPass = null;
// first run: pick a preset from the graphics chip (integrated laptop GPUs start low, dynamic resolution handles the rest)
function detectQuality(){
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|mali|adreno|powervr/i.test(name)) return 0;
    if (/iris xe|apple m\d|apple gpu/i.test(name)) return 1;
    if (/intel|uhd|hd graphics|radeon\(tm\)|radeon graphics|vega \d/i.test(name)) return 0;
    if (/nvidia|geforce|rtx|gtx|radeon rx|radeon pro|arc a/i.test(name)) return 2;
    return 1;
  } catch(e){ return 1; }
}
let dynScale = 1, perfAuto = true, showFps = false;
// lowest render scale: on phones at least one render pixel per screen point, so text-sized detail stays readable
const prFloor = () => MOBILE ? Math.min(devicePixelRatio || 1, quality >= 1 ? 1.1 : .9) : .5;
try {
  const q = localStorage.getItem('cephe-quality2'); quality = (q !== null && +q >= 0 && +q <= 3) ? +q : (MOBILE ? 0 : detectQuality());
  perfAuto = localStorage.getItem('cephe-perfauto') !== '0'; showFps = localStorage.getItem('cephe-fps') === '1';
} catch(e){ quality = 1; }
function disposeComposer(){
  if (!composer) return;
  try { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); if (bloomPass && bloomPass.dispose) bloomPass.dispose(); } catch(e){}
  try { if (aoPass) aoPass.dispose(); } catch(e){}
  composer = bloomPass = gradePass = fxaaPass = aoPass = null;
}
function buildComposer(q){
  disposeComposer();
  if (!q.post || !THREE.EffectComposer || !THREE.RenderPass || !THREE.ShaderPass) return;
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    let rt;
    if (q.msaa && renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget){
      rt = new THREE.WebGLMultisampleRenderTarget(size.x, size.y, {format:THREE.RGBAFormat}); rt.samples = 4;
    }
    composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    aoPass = null;
    if (q.ao && (renderer.capabilities.isWebGL2 || renderer.extensions.get('WEBGL_depth_texture'))){ try { aoPass = makeAOPass(q.ao); composer.addPass(aoPass); } catch(e){ aoPass = null; } }
    rayPass = null; if (q.rays){ GodRayShader.defines.RAY_SAMPLES = q.rays; GodRayShader.defines.RAY_DECAY = q.rays > 40 ? '0.962' : '0.93'; rayPass = new THREE.ShaderPass(GodRayShader); composer.addPass(rayPass); if (aoPass){ rayPass.uniforms.tDepth.value = aoPass.depthTex; rayPass.uniforms.useDepth.value = 1; } }
    if (q.bloom && THREE.UnrealBloomPass){ bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), .5, .45, .86); composer.addPass(bloomPass); }
    gradePass = new THREE.ShaderPass(GradeShader); composer.addPass(gradePass); gradePass.uniforms.tint.value.copy(gradeTint);
    if (!rt && THREE.FXAAShader){ fxaaPass = new THREE.ShaderPass(THREE.FXAAShader); composer.addPass(fxaaPass); }
  } catch(e){ composer = null; }
}
// On the low preset every PBR material is swapped for a cheap per-vertex Lambert equivalent
const _liteCache = new Map(); let liteOn = false;
function liteOf(m){
  if (_liteCache.has(m)) return _liteCache.get(m);
  const l = new THREE.MeshLambertMaterial({
    map: m === floor.material ? DIRT_MACRO : m.map, color: m.color ? m.color.clone() : undefined,
    emissive: m.emissive ? m.emissive.clone() : undefined, emissiveIntensity: m.emissiveIntensity ?? 1,
    transparent: m.transparent, opacity: m.opacity, side: m.side, alphaTest: m.alphaTest, depthWrite: m.depthWrite,
    polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, alphaMap: m.alphaMap || null, vertexColors: !!m.vertexColors,
  });
  if (m.onBeforeCompile && m.customProgramCacheKey && m.customProgramCacheKey() === 'glowvc'){ l.onBeforeCompile = m.onBeforeCompile; l.customProgramCacheKey = () => 'glowvc-lite'; }
  if (m.metalness > .5 && m.map) l.color.multiplyScalar(.85);
  _liteCache.set(m, l); return l;
}
function liteSweep(){
  scene.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    if (liteOn){ if (o.material.isMeshStandardMaterial){ o.userData.pbrMat = o.material; o.material = liteOf(o.material); } }
    else if (o.userData.pbrMat){ o.material = o.userData.pbrMat; o.userData.pbrMat = null; }
  });
}
function setLiteMaterials(on){ liteOn = !!on; liteSweep(); }
function applyQuality(i){
  quality = i; const q = QUALITY[i];
  try { localStorage.setItem('cephe-quality2', String(i)); } catch(e){}
  renderer.setPixelRatio(Math.max(prFloor(), Math.min(devicePixelRatio || 1, q.pr) * dynScale));
  const st = q.soft ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap, sOn = !q.noShadow;
  if (renderer.shadowMap.type !== st || renderer.shadowMap.enabled !== sOn){
    renderer.shadowMap.type = st; renderer.shadowMap.enabled = sOn;
    scene.traverse(o => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  }
  if (camera.far !== (q.far || 600)){ camera.far = q.far || 600; camera.updateProjectionMatrix(); }
  SKY_K = Math.min(1, (camera.far - 40) / 500); placeSky();
  if (typeof dust !== 'undefined') dust.visible = i > 0;
  if (typeof clouds !== 'undefined') clouds.forEach((c, k) => c.visible = k < (i === 0 ? (MOBILE ? 8 : 14) : 28));
  renderer.shadowMap.autoUpdate = q.shadowEvery === 1; renderer.shadowMap.needsUpdate = true;
  if (GRASS){ GRASS.count = Math.max(1, Math.floor(GRASS.instanceMatrix.count * q.grass)); GRASS.visible = q.grass > 0; GRASS.receiveShadow = i >= 2; }
  if (SANDBAGS) SANDBAGS.castShadow = i >= 1;   // ~800 bags: their shadow pass is the biggest single cost on the low preset
  if (typeof rain !== 'undefined') rain.geometry.setDrawRange(0, q.rain * 2);
  setLiteMaterials(q.lite);
  if (sun.shadow.mapSize.x !== q.shadow){ sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } }
  buildComposer(q);
  document.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.q === i));
  const vig = document.getElementById('vig'); if (vig) vig.style.display = composer ? 'none' : 'block';
  resize();
}
// The gun and hands are drawn in their own pass on top of the world (depth cleared in between), like every FPS:
// a scope or barrel that reaches into a wall, a crate or the floor in front of you can no longer vanish into it.
const VM_LAYER = 2, vmCam = new THREE.PerspectiveCamera();
function setupViewmodelLayer(){
  viewRoot.traverse(o => { o.layers.set(VM_LAYER); if (o.isLight){ o.layers.enable(0); o.layers.enable(1); } });
  scene.traverse(o => { if (o.isLight) o.layers.enable(VM_LAYER); });
  torch.layers.enable(VM_LAYER);
}
function renderViewmodel(){
  if (!viewRoot.visible || !viewRoot.parent) return;
  vmCam.copy(camera, false); vmCam.layers.set(VM_LAYER); vmCam.updateMatrixWorld(true);
  const ac = renderer.autoClear, sa = renderer.shadowMap.autoUpdate, sn = renderer.shadowMap.needsUpdate, bg = scene.background;
  renderer.autoClear = false; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = false; scene.background = null;
  renderer.setRenderTarget(null); renderer.clearDepth(); renderer.render(scene, vmCam);
  renderer.autoClear = ac; renderer.shadowMap.autoUpdate = sa; renderer.shadowMap.needsUpdate = sn; scene.background = bg;
}
function renderFrame(dt){
  if (composer){ gradePass.uniforms.time.value = (now % 10000) / 1000; updateGodRays(); composer.render(dt); }
  else renderer.render(scene, camera);
  renderViewmodel();
}

// hip-fire height per gun: long guns sit a little higher so the hand on the grip stays on screen
const HIP_Y = [-.125, -.125, -.185, -.18, -.18, -.185, -.185, -.18, -.2];
const HIP_RX = [.03, .03, .13, .15, .15, .15, .15, .15, .1], HIP_RY = .05;   // at the hip the gun is canted muzzle-up and slightly inwards: the stock drops out of view, the hands come into it
const ADS_Y = [-.114, -.11, -.1, -.15, -.1, -.072, -.168, -.1, -.13];
const lerp = (a, b, t) => a + (b - a) * t;


await loadStep(62, 'Atmosfer');
// ================= Atmosphere presets, god rays, terrain, puddles =================
const GodRayShader = {
  defines:{RAY_SAMPLES:32, RAY_DECAY:'0.93'},
  uniforms:{tDiffuse:{value:null}, tDepth:{value:null}, useDepth:{value:0}, sunPos:{value:new THREE.Vector2(.5,.5)}, strength:{value:0}, tintR:{value:new THREE.Vector3(1,.9,.75)}},
  vertexShader:AO_SHADER.vertex,
  fragmentShader:RAYS_FRAG,
};
const ATMOS = [
  {name:'Öğle', sunDir:[.55,.62,.35], sunCol:0xffe2b8, sunI:2.6, hemiSky:0xc7dcff, hemiGround:0x6b5838, hemiI:.5,
   sky:['#2f6db8','#6aa0d8','#c9d6dc','#e2dac4','#d9d3c0'], haze:0xd9d3c0, fogNear:45, fogFar:330, exposure:1.05, sunColor:0xfff2c8, cloud:0xffffff, tint:[1.03,1,.95], rays:.05, rayTint:[1,.92,.78]},
  {name:'Gün batımı', sunDir:[.84,.17,-.5], sunCol:0xff9450, sunI:2.4, hemiSky:0x98a2d4, hemiGround:0x5a3a28, hemiI:.42,
   sky:['#24345f','#6b5384','#df8458','#f6b878','#c8977a'], haze:0xd29a78, fogNear:30, fogFar:270, exposure:1.0, sunColor:0xffa860, cloud:0xffb08a, tint:[1.09,.98,.86], rays:.1, rayTint:[1,.7,.42]},
  {name:'Sisli sabah', sunDir:[-.45,.33,.62], sunCol:0xfff0d8, sunI:1.35, hemiSky:0xd0dce8, hemiGround:0x6b6658, hemiI:.78,
   sky:['#8ea2b4','#aebdc8','#cfd6d8','#d8dbd6','#cfd2cc'], haze:0xcfd3cf, fogNear:6, fogFar:115, exposure:1.1, sunColor:0xfff4e0, cloud:0xdde3e8, tint:[.97,1,1.04], rays:.08, rayTint:[1,.97,.9], flare:.3},
  {name:'Yağmurlu', sunDir:[.3,.75,.25], sunCol:0xcfd6e0, sunI:.85, hemiSky:0x9aa6b4, hemiGround:0x3c3a34, hemiI:.75,
   sky:['#46515c','#5c6772','#7a848d','#868e95','#7b8389'], haze:0x7b8389, fogNear:12, fogFar:140, exposure:1.05, sunColor:0x9aa2aa, cloud:0x56606a, tint:[.95,1,1.05], rays:0, rayTint:[1,1,1], rain:true, flare:0},
  {name:'Gece', sunDir:[-.35,.6,-.45], sunCol:0x8fa8ff, sunI:.5, hemiSky:0x2a3552, hemiGround:0x15130f, hemiI:.3,
   sky:['#03050b','#08101f','#152033','#1f2a3a','#151a22'], haze:0x151a22, fogNear:18, fogFar:150, exposure:1.25, sunColor:0xdfe8ff, cloud:0x2c3446, tint:[.94,1,1.12], rays:.03, rayTint:[.8,.9,1], night:true, flare:.25},
];
let atmos = 0, gradeTint = new THREE.Vector3(1.03, 1, .95);
try { const a = localStorage.getItem('cephe-atmos'); if (a !== null && +a >= 0 && +a < ATMOS.length) atmos = +a; } catch(e){}
function applyAtmos(i, remote){
  atmos = i; const P = ATMOS[i];
  if (!remote) try { localStorage.setItem('cephe-atmos', String(i)); } catch(e){}
  SUN_DIR.set(...P.sunDir).normalize();
  sun.position.copy(SUN_DIR).multiplyScalar(45); sun.color.copy(C(P.sunCol)); sun.intensity = P.sunI;
  fillLight.position.set(-SUN_DIR.x*40, 18, -SUN_DIR.z*40);
  hemiLight.color.copy(C(P.hemiSky)); hemiLight.groundColor.copy(C(P.hemiGround)); hemiLight.intensity = P.hemiI * 1.15;
  const cnv = SKY_TEX.image, g = cnv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, cnv.height);
  [0, .32, .47, .5, 1].forEach((st, k) => gr.addColorStop(st, P.sky[k])); g.fillStyle = gr; g.fillRect(0, 0, cnv.width, cnv.height); SKY_TEX.needsUpdate = true;
  const hz = C(P.haze); scene.fog.color.copy(hz); scene.background.copy(hz); scene.fog.near = P.fogNear; scene.fog.far = P.fogFar;
  if (SUN_SPR) SUN_SPR.material.color.copy(C(P.sunColor));
  placeSky();
  clouds.forEach(c => c.material.color.copy(C(P.cloud)));
  renderer.toneMappingExposure = P.exposure;
  gradeTint.set(...P.tint); if (gradePass) gradePass.uniforms.tint.value.copy(gradeTint);
  GodRayShader.uniforms.tintR.value.set(...P.rayTint);
  if (rayPass) rayPass.uniforms.tintR.value.set(...P.rayTint);
  buildEnv(); applyWeather(P);
  document.querySelectorAll('[data-atm]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.atm === i));
}
const _sp = new V(), _cd = new V();
function updateGodRays(){
  if (!rayPass) return;
  camera.getWorldDirection(_cd);
  const facing = _cd.dot(SUN_DIR), u = rayPass.uniforms;
  _sp.copy(camera.position).addScaledVector(SUN_DIR, 400).project(camera);
  u.sunPos.value.set((_sp.x + 1) / 2, (_sp.y + 1) / 2);
  const off = Math.max(Math.abs(_sp.x), Math.abs(_sp.y));
  u.strength.value = facing > 0 ? ATMOS[atmos].rays * Math.pow(facing, 1.5) * Math.max(0, 1 - Math.max(0, off - 1) * .7) : 0;
}
// rolling hills beyond the tree line
(() => {
  const geo = new THREE.PlaneGeometry(600, 600, MOBILE ? 90 : 160, MOBILE ? 90 : 160), pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i), r = Math.hypot(x, y);
    const k = Math.min(1, Math.max(0, (r - 112) / 70)), ks = k*k*(3 - 2*k);
    pos.setZ(i, ks * (5 + 4*Math.sin(x*.031)*Math.cos(y*.027) + 2.5*Math.sin(x*.07 + y*.05) + 1.2*Math.sin(y*.11)));
  }
  geo.computeVertexNormals(); ground.geometry.dispose(); ground.geometry = geo;
})();
// rain puddles that reflect the sky
(() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0,0,128,128);
  for (let i=0;i<7;i++){
    const x = 64 + rnd(-22,22), y = 64 + rnd(-22,22), r = rnd(20,38), gr = g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.6,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128);
  }
  const alpha = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({color:C(0x2a2822), roughness:.03, metalness:.25, envMapIntensity:1.5, transparent:true, opacity:.92, alphaMap:alpha, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
  let placed = 0;
  for (let k=0;k<80 && placed<10;k++){
    const x = rnd(-22,22), z = rnd(-22,22), w = rnd(1.4,3.4), d = rnd(1,2.4);
    if (BOXES.some(b => Math.abs(x-b.x) < b.w/2 + w/2 + .3 && Math.abs(z-b.z) < b.d/2 + d/2 + .3)) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.set(-Math.PI/2, 0, rnd(0,3)); m.position.set(x, .017, z); m.receiveShadow = true; scene.add(m); placed++;
  }
})();

await loadStep(64, 'Hava durumu ve dekor');
// ================= Weather, night lighting, lens flare, props =================
// stars for the night sky
const stars = (() => {
  const n = 1800, arr = new Float32Array(n*3);
  for (let i=0;i<n;i++){ const th = Math.random()*Math.PI*2, ph = Math.acos(.05 + Math.random()*.93); arr[i*3] = Math.sin(ph)*Math.cos(th)*450; arr[i*3+1] = Math.cos(ph)*450; arr[i*3+2] = Math.sin(ph)*Math.sin(th)*450; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:0xffffff, size:1.6, sizeAttenuation:false, fog:false, transparent:true, opacity:.85, depthWrite:false}));
  p.visible = false; scene.add(p); return p;
})();
// lamp posts that light the arena at night
const lamps = [];
(() => {
  const poleMat = stdMat({color:C(0x3a3c3a), roughness:.45, metalness:.7});
  const coneMat = new THREE.MeshBasicMaterial({color:C(0xffc27a), transparent:true, opacity:.05, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
  for (const [x, z] of [[-24.7,-12],[24.7,12],[-24.7,12],[24.7,-12],[-12,24.7],[12,-24.7]]){
    const g = new THREE.Group(), inX = -Math.sign(Math.abs(x) > 20 ? x : 0), inZ = -Math.sign(Math.abs(z) > 20 ? z : 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4.8,8), poleMat); pole.position.y = 2.4; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(inX) ? .9 : .08, .06, Math.abs(inZ) ? .9 : .08), poleMat); arm.position.set(inX*.45, 4.75, inZ*.45); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.24), poleMat); head.position.set(inX*.85, 4.68, inZ*.85); g.add(head);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(.3,.03,.18), new THREE.MeshBasicMaterial({color:C(0x555048)})); bulb.position.set(inX*.85, 4.61, inZ*.85); g.add(bulb);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.5, 20, 1, true), coneMat); cone.position.set(inX*.85, 2.35, inZ*.85); cone.visible = false; g.add(cone);
    const light = new THREE.PointLight(0xffc27a, 7, 22, 2); light.position.set(inX*.85, 4.45, inZ*.85);
    g.position.set(x, 0, z); scene.add(g);
    lamps.push({g, bulb, cone, light:(lamps.length === 2 || lamps.length === 3) ? new THREE.Object3D() : light});
  }
})();
// weapon flashlight (night only, F toggles)
const torch = new THREE.SpotLight(0xfff1dc, 0, 38, .42, .55, 1.6);
torch.position.set(.25, -.15, 0); const torchTarget = new THREE.Object3D(); torchTarget.position.set(.1, -.1, -5);
let torchOn = true;
// rain
const RAIN_N = 2600;
const rain = (() => {
  const arr = new Float32Array(RAIN_N*6);
  for (let i=0;i<RAIN_N;i++){ const x = rnd(-22,22), y = rnd(0,22), z = rnd(-22,22); arr.set([x,y,z, x+.06,y-.55,z+.03], i*6); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({color:C(0xb4c0cc), transparent:true, opacity:.38, depthWrite:false}));
  l.frustumCulled = false; l.visible = false; scene.add(l); return l;
})();
let nextLightning = Infinity, lightningT = 0;
function applyWeather(P){
  stars.visible = !!P.night;
  for (const L of lamps){
    L.bulb.material.color.copy(P.night ? new THREE.Color(6, 4.2, 2.2) : C(0x555048));
    L.cone.visible = !!P.night;
    if (P.night && !L.light.parent) L.g.add(L.light);
    if (!P.night && L.light.parent) L.g.remove(L.light);
  }
  if (P.night && !torch.parent){ camera.add(torch); camera.add(torchTarget); torch.target = torchTarget; }
  if (!P.night && torch.parent){ camera.remove(torch); camera.remove(torchTarget); }
  rain.visible = !!P.rain; dust.visible = !P.rain && !P.night;
  for (const m of [floor.material, ...Object.values(MATS)]){
    if (m.userData.baseRough === undefined) m.userData.baseRough = m.roughness;
    m.roughness = P.rain ? m.userData.baseRough * .5 : m.userData.baseRough;
  }
  floor.material.color.copy(P.rain ? C(0x8a8a8a) : C(0xffffff));
  nextLightning = P.rain ? now + rnd(4000, 9000) : Infinity;
  if (typeof setRainAudio === 'function') setRainAudio(!!P.rain);
}
function updateWeather(dt){
  const P = ATMOS[atmos];
  if (P.rain){
    rain.position.set(camera.position.x, 0, camera.position.z);
    const a = rain.geometry.attributes.position.array, fall = 24*dt;
    for (let i=0;i<RAIN_N;i++){
      const k = i*6; a[k+1] -= fall; a[k+4] -= fall;
      if (a[k+4] < 0){ const x = rnd(-22,22), z = rnd(-22,22), y = 18 + Math.random()*4; a[k] = x; a[k+1] = y; a[k+2] = z; a[k+3] = x+.06; a[k+4] = y-.55; a[k+5] = z+.03; }
    }
    rain.geometry.attributes.position.needsUpdate = true;
    for (let i=0;i<2;i++) spawnSprite(new V(camera.position.x + rnd(-9,9), .03, camera.position.z + rnd(-9,9)), {color:C(0xd0d8e0), size:.07, life:.14, grow:4, op:.45});
    if (now > nextLightning){ lightningT = .4; nextLightning = now + rnd(9000, 22000); const d = rnd(600, 2600); setTimeout(() => { if (typeof playThunder === 'function') playThunder(d < 1200); }, d); }
  }
  if (lightningT > 0){
    lightningT -= dt;
    const f = lightningT > 0 ? (Math.random() < .55 ? 1 : .25) * Math.min(1, lightningT / .4) : 0;
    renderer.toneMappingExposure = P.exposure * (1 + 2.2*f); hemiLight.intensity = P.hemiI * (1 + 5*f);
  }
  torch.intensity = (P.night && torchOn && isAlive()) ? 4 : 0;
}
// painted base markings on the perimeter walls
(() => {
  const paint = (text, color, w, h) => {
    const c = makeCanvas(512, 256), g = c.getContext('2d');
    g.font = 'bold 120px "Montserrat", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.fillText(text, 256, 130);
    g.globalCompositeOperation = 'destination-out';
    for (let i=0;i<900;i++){ g.fillStyle = `rgba(0,0,0,${Math.random()*.7})`; g.fillRect(Math.random()*512, Math.random()*256, rnd(1,5), rnd(1,5)); }
    for (let i=0;i<6;i++){ g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(rnd(0,512), rnd(0,256), rnd(20,80), rnd(2,6)); }
    const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:t, transparent:true, roughness:.9, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2}));
  };
  const a = paint('MAVİ ÜS', '#3f7fc8', 8, 4); a.position.set(0, 2.1, A0 - .5 - .02); a.rotation.y = Math.PI; perimAdd(a, 'edge');
  const b = paint('KIZIL ÜS', '#c8503c', 8, 4); b.position.set(0, 2.1, -A0 + .5 + .02); perimAdd(b, 'edge');
  const c1 = paint('A', '#d9c98f', 3, 1.5); c1.position.set(A0 - .5 - .02, 2.2, 0); c1.rotation.y = -Math.PI/2; perimAdd(c1, 'edge');
  const c2 = paint('B', '#d9c98f', 3, 1.5); c2.position.set(-A0 + .5 + .02, 2.2, 0); c2.rotation.y = Math.PI/2; perimAdd(c2, 'edge');
})();
// decorative props: tyre stacks, pallets, ammo cans, rubble, oil stains
const _propMark = scene.children.length;
(() => {
  const rubber = stdMat({color:C(0x1c1c1c), roughness:.85});
  const tyre = new THREE.TorusGeometry(.33, .13, 10, 20);
  for (const [x, z, n] of [[-24.4, 4, 3], [24.4, -4, 2], [-4, -24.4, 4], [4, 24.4, 3], [-24.4, -18, 2], [24.4, 18, 3]]){
    for (let i=0;i<n;i++){ const m = new THREE.Mesh(tyre, rubber); m.rotation.x = Math.PI/2; m.position.set(x + rnd(-.04,.04), .13 + i*.25, z + rnd(-.04,.04)); m.receiveShadow = true; perimAdd(m, 'edge'); }
  }
  const palletMat = stdMat({map:TEX.crate, color:C(0xb09070), roughness:.85});
  for (const [x, z, ry] of [[-24.9, 8, Math.PI/2], [24.9, -8, -Math.PI/2], [9, 24.9, 0], [-9, -24.9, Math.PI]]){
    const g = new THREE.Group();
    for (let i=0;i<5;i++){ const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, .1, .02), palletMat); s.position.set(0, .12 + i*.24, 0); g.add(s); }
    for (const sx of [-.5, 0, .5]){ const s = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.1, .1), palletMat); s.position.set(sx, .58, .05); g.add(s); }
    g.rotation.set(-.18, ry, 0); g.position.set(x, 0, z); perimAdd(g, 'edge');
  }
  const stain = new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.4, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
  for (let i=0;i<12;i++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(rnd(1,2.6), rnd(.8,2)), stain); m.rotation.set(-Math.PI/2, 0, rnd(0,3)); m.position.set(rnd(-22,22), .015, rnd(-22,22)); perimAdd(m, 'edge'); }
})();
STATIC_ROOTS.push(...scene.children.slice(_propMark));
// ---- re-lay the size-dependent scenery for the current arena (A): walls, fence, floor, trees, props, grass…
let perimA = -1;
function relayoutPerim(force){
  if (perimA === A && !force) return;
  perimA = A;
  const k = A / A0, dA = A - A0;
  const edge = c => Math.abs(c) > 23 ? Math.sign(c) * (Math.abs(c) + dA) : c * k;          // keep the gap to the nearest wall
  const out = (x, z, minD) => { const d = Math.max(Math.abs(x), Math.abs(z)) || 1, nd = Math.max(d + dA, minD || 0); return [x * nd / d, z * nd / d]; };
  // undo the previous merge
  for (const o of PERIM.children.slice()) if (o.userData.batched){ PERIM.remove(o); o.geometry.dispose(); }
  PERIM.traverse(o => { if (o.userData.batchedInto){ o.visible = true; o.userData.batchedInto = null; } });
  // walls follow the boxes laid out for this map
  PERIM_MESHES.forEach((m, i) => { const b = BOXES[i]; m.geometry.dispose(); m.geometry = arenaGeo(b); m.position.set(b.x, b.h/2, b.z); });
  for (const o of PERIM.children){
    const u = o.userData; if (!u.place) continue;
    if (u.place === 'out'){ const [x, z] = out(u.bx, u.bz, A + 1.5); o.position.x = x; o.position.z = z; }
    else { o.position.x = edge(u.bx); o.position.z = edge(u.bz); }
    if (u.stretch) o.scale.x = k;
  }
  // fence posts and wire on top of the wall
  { const P = FENCE.posts, M = new THREE.Matrix4(); let c = 0;
    for (let i = -A; i <= A && c < P.instanceMatrix.count - 4; i += 4) for (const [x, z] of [[i,-A],[i,A],[-A,i],[A,i]]) P.setMatrixAt(c++, M.makeTranslation(x, 4.6, z));
    P.count = c; P.instanceMatrix.needsUpdate = true;
    const pts = []; for (const [a, b] of [[[-A,-A],[A,-A]],[[-A,A],[A,A]],[[-A,-A],[-A,A]],[[A,-A],[A,A]]]) for (const y of [4.4,4.75,5.1]) pts.push(new V(a[0],y,a[1]), new V(b[0],y,b[1]));
    FENCE.wire.geometry.dispose(); FENCE.wire.geometry = new THREE.BufferGeometry().setFromPoints(pts); }
  // floor: same texel size whatever its extent
  { const g = new THREE.PlaneGeometry(A*2, A*2, Math.round(A / 2), Math.round(A / 2)), uv = g.attributes.uv;   // split up: huge triangles lose depth precision near the camera on some GPUs for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
    floor.geometry.dispose(); floor.geometry = g; }
  TEAM_STRIPES.forEach(m => { m.position.z = Math.sign(m.position.z) * (A - 5); m.scale.x = k; });
  // trees are pushed out with the wall (and never stand inside it)
  if (TREES.spots){ const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    TREES.spots.forEach(([x, z, sc, ry, sy], i) => { const [nx, nz] = out(x, z, A + 3); M.compose(new V(nx, 0, nz), q.setFromEuler(e.set(0, ry, 0)), new V(sc, sc * sy, sc)); TREES.inst.forEach(t => t.setMatrixAt(i, M)); });
    TREES.inst.forEach(t => { t.instanceMatrix.needsUpdate = true; }); }
  if (GRASS && GRASS.userData.spots){ const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    GRASS.userData.spots.forEach(([x, z, sc, place, ry, sy], i) => { const [nx, nz] = place === 'out' ? out(x, z) : [edge(x), edge(z)]; GRASS.setMatrixAt(i, M.compose(new V(nx, 0, nz), q.setFromEuler(e.set(0, ry, 0)), new V(sc, sc * sy, sc))); });
    GRASS.instanceMatrix.needsUpdate = true; }
  if (PEBBLES){ const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    PEBBLES.userData.spots.forEach(([x, z, a, b, sc], i) => PEBBLES.setMatrixAt(i, M.compose(new V(x * k, .02, z * k), q.setFromEuler(e.set(a, b, 0)), new V(sc, sc, sc))));
    PEBBLES.instanceMatrix.needsUpdate = true; }
  Object.assign(sun.shadow.camera, {left:-(A + 8), right:A + 8, top:A + 8, bottom:-(A + 8)}); sun.shadow.camera.updateProjectionMatrix();
  // merge what shares a material again
  PERIM.updateMatrixWorld(true);
  const list = []; PERIM.traverse(o => { if (o !== PERIM && batchableMesh(o)) list.push(o); });
  mergeGroupMeshes(list, PERIM, o => { const p = o.getWorldPosition(new V()); return Math.floor(p.x / 50) + ',' + Math.floor(p.z / 50); });
  list.forEach(o => { if (o.userData.batchedInto) o.visible = false; });
  if (typeof liteOn !== 'undefined' && liteOn) liteSweep();
  renderer.shadowMap.needsUpdate = true;
}
// screen-space lens flare
const FLARE = [
  {t:0,    s:260, bg:'radial-gradient(circle, rgba(255,244,220,.55) 0%, rgba(255,205,150,.14) 32%, rgba(255,190,120,0) 68%)'},
  {t:.32,  s:46,  bg:'radial-gradient(circle, rgba(150,205,255,.28), rgba(150,205,255,0) 70%)'},
  {t:.58,  s:110, bg:'radial-gradient(circle, rgba(255,170,90,0) 54%, rgba(255,170,90,.22) 62%, rgba(255,170,90,0) 72%)'},
  {t:.82,  s:24,  bg:'radial-gradient(circle, rgba(190,255,210,.3), rgba(190,255,210,0) 70%)'},
  {t:1.18, s:70,  bg:'radial-gradient(circle, rgba(210,160,255,.2), rgba(210,160,255,0) 70%)'},
  {t:1.6,  s:160, bg:'radial-gradient(circle, rgba(120,190,255,0) 58%, rgba(120,190,255,.16) 65%, rgba(120,190,255,0) 74%)'},
];
const flareEl = document.getElementById('flare');
FLARE.forEach(f => { const i = document.createElement('i'); i.style.width = i.style.height = f.s + 'px'; i.style.background = f.bg; flareEl.appendChild(i); });
let flareVis = 0, flareCheckT = 0, flareOcc = false;
const _fr = new THREE.Raycaster();
function updateFlare(dt){
  const P = ATMOS[atmos];
  camera.getWorldDirection(_cd);
  const facing = _cd.dot(SUN_DIR);
  _sp.copy(camera.position).addScaledVector(SUN_DIR, 400).project(camera);
  flareCheckT -= dt;
  if (flareCheckT <= 0){ flareCheckT = .1; _fr.set(camera.position, SUN_DIR); _fr.far = 300; flareOcc = _fr.intersectObjects(solidMeshes, false).length > 0; }
  const scoped = me.zoom && WEAPONS[me.weapon] && WEAPONS[me.weapon].scope;
  const on = facing > .2 && Math.abs(_sp.x) < 1.15 && Math.abs(_sp.y) < 1.15 && !flareOcc && !scoped;
  flareVis += ((on ? 1 : 0) - flareVis) * Math.min(1, dt*8);
  const k = flareVis * (P.flare ?? 1) * Math.pow(Math.max(0, facing), 2);
  flareEl.style.opacity = k.toFixed(3);
  if (k < .01) return;
  const W = stage.clientWidth, H = stage.clientHeight, sx = (_sp.x + 1) / 2 * W, sy = (1 - _sp.y) / 2 * H, cx = W/2, cy = H/2;
  FLARE.forEach((f, i) => { const el = flareEl.children[i]; el.style.left = (sx + (cx - sx) * f.t) + 'px'; el.style.top = (sy + (cy - sy) * f.t) + 'px'; });
}

// ================= Rockets & explosions =================
const rockets = [];
const boomLight = {position:new V(), intensity:0};
const RK_BODY = new THREE.CylinderGeometry(.04,.04,.36,10); RK_BODY.rotateX(Math.PI/2);
const RK_NOSE = new THREE.ConeGeometry(.04,.14,10); RK_NOSE.rotateX(Math.PI/2); RK_NOSE.translate(0,0,.25);
const RK_MAT = stdMat({color:C(0x58603e), roughness:.6});
function launchRocket(o, e, own){
  const g = new THREE.Group();
  g.add(new THREE.Mesh(RK_BODY, RK_MAT)); g.add(new THREE.Mesh(RK_NOSE, RK_MAT));
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash, color:0xffc070, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  fl.scale.setScalar(.45); fl.position.z = -.25; g.add(fl);
  g.position.copy(o); g.lookAt(e); scene.add(g);
  const T = Math.max(.05, o.distanceTo(e) / WEAPONS[8].rocketSpeed);
  rockets.push({g, o:o.clone(), e:e.clone(), t:0, T, own, puffT:0});
}
function explode(p, own, R = WEAPONS[8].explosive, DMG = WEAPONS[8].dmg){
  lightFlash(p.clone().add(new V(0,.6,0)), 0xff9040, 60, 24);
  spawnSprite(p.clone().add(new V(0,.4,0)), {tex:TEX.flash, color:new THREE.Color(4, 3.2, 2.1), size:3.4, life:.13, add:true, grow:2});
  for (let i=0;i<14;i++) spawnSprite(p.clone().add(new V(rnd(-.6,.6), rnd(0,.8), rnd(-.6,.6))), {tex:TEX.fire, color:new THREE.Color(rnd(2.2,3), rnd(1.1,1.6), .35), size:rnd(1,2), life:rnd(.35,.7), v:new V(rnd(-3,3), rnd(1,3.5), rnd(-3,3)), grow:1.3, add:true, spin:rnd(-2,2)});
  for (let i=0;i<16;i++) spawnSprite(p.clone().add(new V(rnd(-.9,.9), rnd(0,1), rnd(-.9,.9))), {tex:TEX.smoke, color:C(0x3f3b36), size:rnd(1.2,2.2), life:rnd(2.2,4), v:new V(rnd(-1.4,1.4), rnd(.8,2.2), rnd(-1.4,1.4)), grow:.7, op:.82, fadeIn:.12, spin:rnd(-.6,.6)});
  for (let i=0;i<22;i++) spawnSprite(p, {color:new THREE.Color(3, 2, .8), size:rnd(.04,.09), life:rnd(.4,.9), v:new V(rnd(-1,1), rnd(.2,1.2), rnd(-1,1)).normalize().multiplyScalar(rnd(6,13)), grav:9.8, add:true});
  { const ring = new THREE.Mesh(new THREE.RingGeometry(.15, .3, 48), new THREE.MeshBasicMaterial({color:new THREE.Color(1.6, 1.2, .8), transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2; ring.position.set(p.x, Math.max(.06, p.y - .3), p.z); ring.layers.set(1); scene.add(ring); waves.push({m:ring, t:0}); }
  spawnDebris(p, new V(0,1,0), 10, 2.2);
  if (p.y < .6){
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6), new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.75, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3}));
    sc.rotation.x = -Math.PI/2; sc.position.set(p.x, .02, p.z); scene.add(sc); decals.push(sc);
    if (decals.length > (quality === 0 ? 24 : 90)){ const o = decals.shift(); scene.remove(o); }
  }
  const d = p.distanceTo(me.pos);
  me.shake = Math.max(me.shake || 0, Math.max(0, 1 - d/28) * .55);
  { const k = Math.max(0, 1 - d/16); if (k > 0){ const bv = $('boomV'); if (bv && bv.animate) bv.animate([{opacity:Math.min(.85, k)}, {opacity:0}], {duration:260 + k*420, easing:'ease-out'}); buzz(Math.round(30 + k*90)); } }
  playBoom(p);
  if (!own) return;
  const myTeam = me.team, dealt = {};
  for (const [id, e] of ents){
    if (id === myId || !e.alive || e.team === myTeam || e.inv) continue;
    const dd = new V(e.pos.x, e.pos.y + .9, e.pos.z).distanceTo(p);
    if (dd < R) dealt[id] = DMG * Math.max(.15, 1 - dd / R);
  }
  let any = false;
  for (const id in dealt){ any = true; if (isHost) applyHit(myId, id, dealt[id]); else if (hostConn) hostConn.send({t:'hit', v:id, d:Math.round(dealt[id])}); }
  if (any) hitMarker(false);
}
function updateRockets(dt){
  boomLight.intensity *= Math.pow(.0005, dt);
  for (let i=rockets.length-1;i>=0;i--){
    const r = rockets[i]; r.t += dt;
    const k = Math.min(1, r.t / r.T);
    r.g.position.lerpVectors(r.o, r.e, k);
    r.puffT -= dt;
    if (r.puffT <= 0){ r.puffT = .016; spawnSprite(r.g.position.clone(), {color:C(0xd8d2c6), size:rnd(.2,.32), life:rnd(1.2,1.8), v:new V(rnd(-.15,.15), rnd(.1,.35), rnd(-.15,.15)), grow:1.3, op:.5}); }
    if (k >= 1){ scene.remove(r.g); rockets.splice(i,1); explode(r.e, r.own); }
  }
}

// ================= Hand grenades =================
const grenades = [];
const GR_GEO = (() => { const g = new THREE.SphereGeometry(.06, 12, 8); g.scale(1, 1.28, 1); return g; })();
const GR_CAP = (() => { const g = new THREE.CylinderGeometry(.022, .027, .05, 8); g.translate(0, .088, 0); return g; })();
const GR_MAT = stdMat({color:C(0x4d5236), roughness:.65}), GR_MET = stdMat({color:C(0x8c8b80), roughness:.4, metalness:.8});
const GR_R = .08, GR_FUSE = 2.3;
function launchGrenade(o, v, own){
  const g = new THREE.Group(); g.add(new THREE.Mesh(GR_GEO, GR_MAT)); g.add(new THREE.Mesh(GR_CAP, GR_MET));
  g.position.copy(o); scene.add(g);
  grenades.push({g, v:v.clone(), t:0, t0:now, own, w:new V(rnd(-9,9), rnd(-4,4), rnd(-9,9)), clinkT:-1});
}
function grenadeCollide(p, v){
  let hit = 0;
  if (p.y < GR_R){ p.y = GR_R; if (v.y < 0){ hit = -v.y; v.y = -v.y * .36; v.x *= .62; v.z *= .62; } }
  for (const b of BOXES){
    const dx = p.x - b.x, dz = p.z - b.z, ox = b.w/2 + GR_R - Math.abs(dx), oz = b.d/2 + GR_R - Math.abs(dz), oy = b.h + GR_R - p.y;
    if (ox <= 0 || oz <= 0 || oy <= 0) continue;
    if (oy < ox && oy < oz){ p.y = b.h + GR_R; if (v.y < 0){ hit = Math.max(hit, -v.y); v.y = -v.y * .36; v.x *= .62; v.z *= .62; } }
    else if (ox < oz){ const sx = dx < 0 ? -1 : 1; p.x += sx * ox; if (v.x * sx < 0){ hit = Math.max(hit, Math.abs(v.x)); v.x = -v.x * .42; v.z *= .8; v.y *= .85; } }
    else { const sz = dz < 0 ? -1 : 1; p.z += sz * oz; if (v.z * sz < 0){ hit = Math.max(hit, Math.abs(v.z)); v.z = -v.z * .42; v.x *= .8; v.y *= .85; } }
  }
  const L = A - .5;
  if (Math.abs(p.x) > L){ p.x = Math.sign(p.x) * L; v.x *= -.42; }
  if (Math.abs(p.z) > L){ p.z = Math.sign(p.z) * L; v.z *= -.42; }
  return hit;
}
function grenadeClink(p, k){
  if (typeof actx === 'undefined' || !actx || muted) return;
  try { const vv = voice(p, {verb:.1, dur:.12}); if (vv) click(vv.out, actx.currentTime + .005, .1 + .25 * k, 2300 + Math.random() * 1200); } catch(e){}
}
function updateGrenades(dt){
  for (let i = grenades.length - 1; i >= 0; i--){
    const n = grenades[i]; n.t += dt;
    const p = n.g.position, h = dt / 3;
    let hit = 0;
    for (let s = 0; s < 3; s++){ n.v.y -= 12 * h; p.addScaledVector(n.v, h); hit = Math.max(hit, grenadeCollide(p, n.v)); }
    const ground = p.y <= GR_R + .02 || p.y <= groundAt(p.x, p.z, p.y) + GR_R + .02;
    if (ground && Math.abs(n.v.y) < .8){ const f = Math.pow(.12, dt); n.v.x *= f; n.v.z *= f; n.w.multiplyScalar(Math.pow(.04, dt)); }
    n.g.rotation.x += n.w.x * dt; n.g.rotation.y += n.w.y * dt; n.g.rotation.z += n.w.z * dt;
    if (hit > 1.4 && n.t - n.clinkT > .12){ n.clinkT = n.t; grenadeClink(p.clone(), Math.min(1, hit / 10)); }
    if (now - n.t0 >= GR_FUSE * 1000){ scene.remove(n.g); grenades.splice(i, 1); explode(p.clone().add(new V(0, .2, 0)), n.own, 5.2, 120); }
  }
}

await loadStep(67, 'Ses motoru');
// ================= Audio =================
// Procedural, layered sound engine: 3D positional audio (HRTF), speed-of-sound delay,
// air absorption, outdoor reverb, compressor, per-weapon gunshot synthesis,
// mechanical reload sequences, footsteps, bullet whiz, explosions, ambience.
let actx = null, noiseBuf = null, master = null, muffle = null, dryBus = null, verbSend = null, comp = null;
let volume = .8, ambStarted = false;
try { const v = localStorage.getItem('cephe-volume'); if (v !== null) volume = Math.max(0, Math.min(1, +v)); } catch(e){}
const SPEED_OF_SOUND = 343;

function makeImpulse(ctx, secs, decay){
  const rate = ctx.sampleRate, len = Math.floor(rate*secs), buf = ctx.createBuffer(2, len, rate);
  for (let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay) * .55;
    // discrete early reflections from the arena walls and nearby trees
    for (const [ms, a] of [[23,.5],[41,.38],[67,.3],[96,.24],[140,.18],[210,.12]]){
      const k = Math.floor((ms + ch*3 + Math.random()*4) / 1000 * rate);
      for (let j=0;j<60 && k+j<len;j++) d[k+j] += (Math.random()*2-1) * a * (1 - j/60);
    }
  }
  return buf;
}
function initAudio(){
  if (actx){ if (actx.state === 'suspended') actx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    try { actx = new AC({latencyHint:'balanced'}); } catch(e){ actx = new AC(); }
    const len = actx.sampleRate * 2; noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    comp = actx.createDynamicsCompressor();
    comp.threshold.value = -9; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .25;
    muffle = actx.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000; muffle.Q.value = .4;
    master = actx.createGain(); master.gain.value = volume;
    dryBus = actx.createGain();
    const verb = actx.createConvolver(); verb.buffer = makeImpulse(actx, 2.2, 3.2);
    const verbLP = actx.createBiquadFilter(); verbLP.type = 'lowpass'; verbLP.frequency.value = 3200;
    verbSend = actx.createGain(); verbSend.gain.value = 1;
    const verbOut = actx.createGain(); verbOut.gain.value = .55;
    dryBus.connect(muffle); verbSend.connect(verb); verb.connect(verbLP); verbLP.connect(verbOut); verbOut.connect(muffle);
    muffle.connect(comp); comp.connect(master); master.connect(actx.destination); master.gain.value = muted ? 0 : volume;
    const L = actx.listener;
    if (L.positionX){ L.positionX.value = 0; }
    startAmbience(); setRainAudio(rainWanted);
    setTimeout(() => buildBank().catch(() => {}), 50);
  } catch(e){ actx = null; }
}
function setVolume(v){
  volume = v; try { localStorage.setItem('cephe-volume', String(v)); } catch(e){}
  if (master) master.gain.setTargetAtTime(muted ? 0 : v, actx.currentTime, .05);
  document.querySelectorAll('.volIn').forEach(i => { if (+i.value !== Math.round(v*100)) i.value = Math.round(v*100); });
}

// ---- output chain for one sound event: optional 3D position, air absorption, reverb send
const _lp = new V(), _lf = new V();
// Every sound is a small graph of audio nodes. Too many at once overloads the audio thread and the
// browser drops audio (heard as cuts and crackles), so voices are budgeted by priority:
// 3 = your own actions, 2 = nearby combat, 1 = distant shots/steps/impacts, 0 = ambience.
let _voices = [], _hrtf = [];
const VOICE_CAP = [6, 14, 22, 32];
function voice(pos, opts){
  opts = opts || {};
  const now = actx.currentTime, t0 = now + .005;
  let dist = 0, delay = 0;
  if (pos){ camera.getWorldPosition(_lp); dist = _lp.distanceTo(pos); }
  const pri = opts.pri ?? (pos ? (dist < 20 ? 2 : 1) : 3);
  _voices = _voices.filter(e => e > now);
  if (_voices.length >= VOICE_CAP[pri]) return null;
  _voices.push(now + (opts.dur ?? 1));
  const g = actx.createGain(); g.gain.value = opts.gain ?? 1;
  if (pos){
    delay = opts.noDelay ? 0 : dist / SPEED_OF_SOUND;
    const air = actx.createBiquadFilter(); air.type = 'lowpass';
    air.frequency.value = Math.max(700, 18000 / (1 + dist * .045)); air.Q.value = .3;
    const pan = actx.createPanner();
    _hrtf = _hrtf.filter(e => e > now);
    const hrtf = dist < 10 && pri >= 2 && _hrtf.length < 4; if (hrtf) _hrtf.push(now + (opts.dur ?? 1));
    pan.panningModel = hrtf ? 'HRTF' : 'equalpower'; pan.distanceModel = 'inverse'; pan.refDistance = opts.ref || 3; pan.rolloffFactor = opts.roll ?? 1.1; pan.maxDistance = 400;
    if (pan.positionX){ pan.positionX.value = pos.x; pan.positionY.value = pos.y; pan.positionZ.value = pos.z; } else pan.setPosition(pos.x, pos.y, pos.z);
    g.connect(air); air.connect(pan); pan.connect(dryBus);
    const send = actx.createGain(); send.gain.value = Math.min(.9, (opts.verb ?? .3) + dist * .012); air.connect(send); send.connect(verbSend);
  } else {
    g.connect(dryBus);
    const send = actx.createGain(); send.gain.value = opts.verb ?? .22; g.connect(send); send.connect(verbSend);
  }
  return {out:g, t:t0 + delay, dist, pri};
}
function updateListener(){
  if (!actx) return;
  const L = actx.listener, t = actx.currentTime;
  camera.getWorldPosition(_lp); camera.getWorldDirection(_lf);
  if (L.positionX){
    L.positionX.setTargetAtTime(_lp.x, t, .01); L.positionY.setTargetAtTime(_lp.y, t, .01); L.positionZ.setTargetAtTime(_lp.z, t, .01);
    L.forwardX.setTargetAtTime(_lf.x, t, .01); L.forwardY.setTargetAtTime(_lf.y, t, .01); L.forwardZ.setTargetAtTime(_lf.z, t, .01);
    L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
  } else { L.setPosition(_lp.x, _lp.y, _lp.z); L.setOrientation(_lf.x, _lf.y, _lf.z, 0, 1, 0); }
}

// ---- synthesis primitives
function noise(dest, t, o){
  const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = actx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q ?? .8;
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.sweep || o.decay));
  const g = actx.createGain(), a = o.attack ?? .001, dcy = o.decay ?? .1;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain ?? 1, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dcy);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t, Math.random() * 1.4); src.stop(t + a + dcy + .05);
}
function tone(dest, t, o){
  const osc = actx.createOscillator(); osc.type = o.wave || 'sine';
  osc.frequency.setValueAtTime(o.f0, t); if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.sweep || o.decay));
  const g = actx.createGain(), a = o.attack ?? .002, dcy = o.decay ?? .1;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain ?? 1, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dcy);
  osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + a + dcy + .05);
}
let satCurve = null;
function saturator(dest, amount){
  if (!satCurve){ satCurve = new Float32Array(1024); for (let i=0;i<1024;i++){ const x = i/511.5 - 1; satCurve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } }
  const ws = actx.createWaveShaper(); ws.curve = satCurve; ws.oversample = BAKING ? '4x' : 'none';
  const pre = actx.createGain(); pre.gain.value = amount || 1; pre.connect(ws); ws.connect(dest); return pre;
}
const click = (d, t, g, f) => { noise(d, t, {type:'highpass', f:f || 2500, q:.7, gain:g, decay:.012}); tone(d, t, {f0:(f || 2500)*1.3, gain:g*.35, decay:.02}); };
const slide = (d, t, g, f0, f1) => noise(d, t, {type:'bandpass', f:f0 || 1800, f2:f1 || 3400, q:2.2, gain:g, attack:.01, decay:.07});
const thunk = (d, t, g) => { tone(d, t, {f0:220, f1:110, gain:g, decay:.06}); noise(d, t, {type:'lowpass', f:900, gain:g*.6, decay:.04}); };

// ---- weapons: per-weapon layer recipes
const SHOT = [
  {click:.5, clickF:4200, body:.9, bodyF:1900, bodyQ:.8, bodyDcy:.07, th:.75, th0:150, th1:52, thDcy:.09, tail:.35, tailF:1300, tailDcy:.5, sat:1.4, mech:'slide'},
  {click:.6, clickF:3600, body:1.15, bodyF:1150, bodyQ:.7, bodyDcy:.13, th:1.1, th0:115, th1:38, thDcy:.17, tail:.6, tailF:950, tailDcy:.95, sat:1.8, mech:'slide'},
  {click:.4, clickF:5200, body:.7, bodyF:2300, bodyQ:.9, bodyDcy:.05, th:.45, th0:170, th1:65, thDcy:.06, tail:.25, tailF:1600, tailDcy:.35, sat:1.3},
  {click:.55, clickF:4400, body:.95, bodyF:1650, bodyQ:.8, bodyDcy:.08, th:.75, th0:125, th1:45, thDcy:.1, tail:.45, tailF:1150, tailDcy:.7, sat:1.6, crack:.5},
  {click:.6, clickF:4000, body:1.05, bodyF:1300, bodyQ:.75, bodyDcy:.12, th:.95, th0:105, th1:40, thDcy:.14, tail:.6, tailF:950, tailDcy:1.0, sat:1.8, crack:.6},
  {click:.5, clickF:3500, body:1.15, bodyF:900, bodyQ:.6, bodyDcy:.16, th:1.25, th0:95, th1:34, thDcy:.21, tail:.75, tailF:800, tailDcy:1.15, sat:2, mech:'pump'},
  {click:.5, clickF:4200, body:1.0, bodyF:1450, bodyQ:.8, bodyDcy:.09, th:.85, th0:115, th1:42, thDcy:.11, tail:.5, tailF:1050, tailDcy:.8, sat:1.7, crack:.55},
  {click:.75, clickF:3000, body:1.25, bodyF:1000, bodyQ:.7, bodyDcy:.19, th:1.35, th0:85, th1:30, thDcy:.26, tail:.95, tailF:700, tailDcy:1.7, sat:2.1, mech:'bolt', crack:.8},
  {click:.3, clickF:2500, body:.5, bodyF:700, bodyQ:.6, bodyDcy:.25, th:1.2, th0:75, th1:28, thDcy:.3, tail:.8, tailF:600, tailDcy:1.2, sat:1.5, mech:'rocket'},
];
// ---- recipes: each one writes a complete sound into `d` starting at time `t`.
// They run once per variant into an OfflineAudioContext (see the bank below); live synthesis is only a fallback.
const R = {
  shot(d, t, w, distant){
    const P = SHOT[w] || SHOT[3];
    if (distant){
      // far away: the high end is gone, the report rolls back off walls and hills
      noise(d, t, {type:'bandpass', f:P.bodyF * .7, q:P.bodyQ, gain:P.body * .8, decay:P.bodyDcy * 1.3});
      tone(d, t, {f0:P.th0 * .8, f1:P.th1, gain:P.th * .55, decay:P.thDcy * 1.6});
      noise(d, t + .01, {type:'lowpass', f:P.tailF * .7, q:.5, gain:P.tail * 1.5, attack:.01, decay:P.tailDcy * 1.3});
      for (const [dt, g] of [[.32, .35], [.71, .22], [1.18, .13]]) noise(d, t + dt + Math.random()*.05, {type:'lowpass', f:P.tailF * .5, q:.4, gain:P.tail * g * 1.6, attack:.03, decay:P.tailDcy * .9});
      return;
    }
    const s = saturator(d, P.sat);
    if (P.crack) noise(d, t, {type:'highpass', f:6500, q:.6, gain:P.crack, decay:.006, attack:.0003});           // supersonic crack
    noise(s, t, {type:'highpass', f:P.clickF * (1 + Math.random()*.1), q:.7, gain:P.click, decay:.012, attack:.0005});
    noise(s, t, {type:'bandpass', f:P.bodyF * (1 + Math.random()*.1), q:P.bodyQ, gain:P.body, decay:P.bodyDcy});
    noise(s, t + .002, {type:'bandpass', f:P.bodyF * 2.1, q:1.4, gain:P.body * .35, decay:P.bodyDcy * .6});
    tone(s, t, {f0:P.th0 * (1 + (Math.random()-.5)*.08), f1:P.th1, gain:P.th, decay:P.thDcy});
    tone(d, t, {f0:58, f1:36, gain:P.th * .45, decay:P.thDcy * 1.4});                                             // chest punch
    noise(d, t + .008, {type:'lowpass', f:P.tailF, q:.5, gain:P.tail, attack:.006, decay:P.tailDcy});
    for (const [dt, g] of [[.075, .3], [.13, .18]]) noise(d, t + dt + Math.random()*.02, {type:'bandpass', f:P.bodyF * .6, q:.7, gain:P.body * g, decay:P.bodyDcy * 1.8});  // slap off nearby walls
    if (P.mech === 'slide') click(d, t + .045, .18, 3200);
    if (P.mech === 'pump'){ slide(d, t + .38, .45, 900, 1800); click(d, t + .46, .3, 2000); slide(d, t + .52, .4, 1800, 900); click(d, t + .6, .32, 2200); }
    if (P.mech === 'bolt'){ click(d, t + .55, .3, 2600); slide(d, t + .63, .4, 1500, 2800); slide(d, t + .8, .4, 2800, 1500); click(d, t + .9, .32, 2400); }
    if (P.mech === 'rocket') noise(d, t, {type:'bandpass', f:500, f2:2400, sweep:.5, q:1.2, gain:.9, attack:.02, decay:.7});
  },
  casing(d, t){   // brass bouncing on the ground
    for (let i=0;i<3;i++){ const tt = t + [0, .09, .16][i] + Math.random()*.02, g = [.22, .12, .06][i], f = 5200 + Math.random()*1800;
      tone(d, tt, {f0:f, gain:g, decay:.05 + Math.random()*.03}); tone(d, tt, {f0:f*1.47, gain:g*.5, decay:.04}); noise(d, tt, {type:'highpass', f:6000, gain:g*.6, decay:.006}); }
  },
  slide(d, t){
    noise(d, t, {type:'bandpass', f:750, f2:320, sweep:.75, q:.8, gain:.55, attack:.03, decay:.75});
    noise(d, t, {type:'lowpass', f:300, gain:.3, attack:.02, decay:.5});
    for (let i=0;i<12;i++) noise(d, t + Math.random()*.7, {type:'highpass', f:3200 + Math.random()*2000, gain:.1, decay:.02});
  },
  dry(d, t){ click(d, t, .35, 3800); noise(d, t + .004, {type:'bandpass', f:1200, q:2, gain:.12, decay:.03}); },
  swap(d, t){ noise(d, t, {type:'lowpass', f:900, gain:.18, attack:.03, decay:.16}); click(d, t + .12, .22, 2800); noise(d, t + .14, {type:'bandpass', f:600, q:1.2, gain:.12, decay:.08}); },
  reload(d, t, w, s){
    if (w === 5){
      const n = 4, gap = (s - .5) / n;
      for (let i=0;i<n;i++){ noise(d, t + .1 + i*gap, {type:'bandpass', f:1400, q:1.5, gain:.25, attack:.01, decay:.06}); click(d, t + .18 + i*gap, .3, 2100); }
      slide(d, t + s - .32, .45, 900, 1800); click(d, t + s - .24, .32, 2000); slide(d, t + s - .16, .4, 1800, 900);
      return;
    }
    if (w === 8){ noise(d, t + .05, {type:'lowpass', f:600, gain:.3, attack:.05, decay:.4}); thunk(d, t + s*.5, .55); slide(d, t + s*.62, .35, 700, 1400); click(d, t + s*.8, .4, 1700); return; }
    click(d, t + .02, .25, 2600);
    slide(d, t + .1, .3, 2400, 1200);
    noise(d, t + .2, {type:'lowpass', f:700, gain:.15, attack:.04, decay:.25});
    noise(d, t + s*.3, {type:'bandpass', f:500, q:1, gain:.12, attack:.05, decay:.2});                       // mag rubbing the pouch
    thunk(d, t + s*.55, .5); click(d, t + s*.57, .32, 2200);
    if (w <= 1){ slide(d, t + s*.82, .4, 2000, 3600); click(d, t + s*.88, .35, 3000); }
    else { slide(d, t + s*.78, .4, 1600, 3000); slide(d, t + s*.86, .35, 3000, 1600); click(d, t + s*.9, .38, 2600); }
  },
  hit(d, t, head, kill){
    tone(d, t, {f0:1900, f1:1500, gain:.28, decay:.05}); noise(d, t, {type:'highpass', f:6000, gain:.15, decay:.02});
    if (head){ tone(d, t, {f0:2800, gain:.22, decay:.3}); tone(d, t, {f0:4130, gain:.14, decay:.25}); }
    if (kill){ tone(d, t + .06, {f0:880, gain:.22, decay:.18, wave:'triangle'}); tone(d, t + .14, {f0:1320, gain:.22, decay:.3, wave:'triangle'}); }
  },
  hurt(d, t){ tone(d, t, {f0:95, f1:45, gain:.9, decay:.18}); noise(d, t, {type:'lowpass', f:400, gain:.5, decay:.12}); noise(d, t + .01, {type:'bandpass', f:900, q:1, gain:.2, decay:.06}); },
  step(d, t, run){
    noise(d, t, {type:'bandpass', f:450 + Math.random()*300, q:1.1, gain:.6, attack:.004, decay:.07 + (run ? .02 : 0)});
    tone(d, t, {f0:90 + Math.random()*30, f1:55, gain:.25, decay:.05});
    noise(d, t + .01, {type:'bandpass', f:2600 + Math.random()*1200, q:.9, gain:.14, attack:.002, decay:.04});
    for (let i=0;i<4;i++) noise(d, t + .015 + Math.random()*.06, {type:'bandpass', f:3500 + Math.random()*2500, q:1.5, gain:.05 + Math.random()*.04, decay:.01});   // grit
    if (run) noise(d, t + .03, {type:'bandpass', f:1800, q:2, gain:.08, attack:.01, decay:.06});                   // gear rattle
  },
  land(d, t){ tone(d, t, {f0:120, f1:50, gain:.6, decay:.12}); noise(d, t, {type:'bandpass', f:600, gain:.7, decay:.1}); noise(d, t + .02, {type:'highpass', f:3500, gain:.25, decay:.08}); noise(d, t + .05, {type:'bandpass', f:1800, q:2, gain:.1, decay:.07}); },
  whiz(d, t){
    const f = 2800 + Math.random()*900;
    noise(d, t, {type:'highpass', f:3500, gain:.5, decay:.015, attack:.0005});
    noise(d, t, {type:'bandpass', f:f, f2:f * .25, sweep:.16, q:4, gain:.55, attack:.01, decay:.18});
  },
  impact(d, t, k){
    if (k === 0){ noise(d, t, {type:'bandpass', f:900, gain:.5, decay:.05}); for (let i=0;i<3;i++) noise(d, t + .02 + Math.random()*.08, {type:'highpass', f:3000, gain:.08, decay:.015}); }    // dirt / concrete
    else if (k === 1){ noise(d, t, {type:'bandpass', f:2400, q:1.5, gain:.45, decay:.03}); tone(d, t + .005, {f0:2600 + Math.random()*1800, f1:900, sweep:.25, gain:.14, decay:.28}); }   // ricochet
    else { noise(d, t, {type:'bandpass', f:1500, q:2.5, gain:.4, decay:.04}); tone(d, t, {f0:720 + Math.random()*300, gain:.18, decay:.12}); tone(d, t, {f0:1730, gain:.08, decay:.08}); }  // metal
  },
  boom(d, t, close){
    const s = saturator(d, 2.4);
    tone(s, t, {f0:68, f1:22, gain:1.6, decay:1.3, sweep:1.1});
    noise(s, t, {type:'lowpass', f:1800, f2:260, sweep:.8, q:.5, gain:1.3, attack:.003, decay:1.6});
    if (close) noise(s, t, {type:'highpass', f:2500, gain:.6, decay:.06, attack:.0008});
    for (let i=0;i<10;i++) noise(d, t + .05 + Math.random()*.5, {type:'highpass', f:2000 + Math.random()*3000, gain:.12 + Math.random()*.12, decay:.02});
    for (let i=0;i<14;i++) noise(d, t + .4 + Math.random()*1.6, {type:'bandpass', f:1500 + Math.random()*2500, q:2, gain:.05 + Math.random()*.05, decay:.03});   // debris
    noise(d, t + .2, {type:'lowpass', f:200, gain:.9, attack:.2, decay:2.5});
    for (const [dt, g] of [[.45, .4], [1.0, .25]]) noise(d, t + dt, {type:'lowpass', f:420, gain:g, attack:.06, decay:1.1});   // echoes
  },
  ring(d, t){ tone(d, t + .05, {f0:3900, gain:.06, attack:.2, decay:2.6}); },
  thunder(d, t, close){
    const s = saturator(d, 1.6);
    if (close) noise(s, t, {type:'highpass', f:1800, gain:.7, attack:.002, decay:.25});
    noise(s, t + (close ? .05 : .3), {type:'lowpass', f:220, f2:90, sweep:3, q:.4, gain:1.1, attack:.35, decay:3.8});
    tone(s, t + .2, {f0:48, f1:28, sweep:3, gain:.7, attack:.3, decay:3.2});
    for (let i=0;i<6;i++) noise(s, t + .4 + Math.random()*2.2, {type:'lowpass', f:300, gain:.35, attack:.1, decay:.6});
  },
  roundEnd(d, t, win){
    const notes = win ? [523, 659, 784, 1047] : [440, 415, 392, 330];
    notes.forEach((f,i) => { tone(d, t + i*.16, {f0:f, gain:.18, decay:.5, wave:'triangle'}); tone(d, t + i*.16, {f0:f*2, gain:.05, decay:.4}); });
  },
  heartbeat(d, t){ tone(d, t, {f0:62, f1:45, gain:.7, decay:.12}); tone(d, t + .17, {f0:55, f1:40, gain:.5, decay:.14}); },
  bird(d, t){ const base = 2600 + Math.random()*1800, n = 2 + Math.floor(Math.random()*4);
    for (let i=0;i<n;i++) tone(d, t + i*.13, {f0:base*(1 + Math.random()*.15), f1:base*(1.25 + Math.random()*.3), sweep:.07, gain:.25, decay:.09}); },
  cricket(d, t){ const f = 4300 + Math.random()*200; for (let i=0;i<8;i++) tone(d, t + i*.055, {f0:f, gain:.3, decay:.03}); },
};

// ---- sound bank: every recipe is rendered ahead of time (a few variants each) into plain buffers.
// In game a sound is then one buffer player instead of 10–25 live oscillators/filters, so heavy
// fire-fights no longer overload the audio thread, and the recipes can afford richer layers.
const BANK = {}; let bankBusy = false, bankDone = false, BAKING = false;
async function bake(sec, sr, fn){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
  const off = new OAC(1, Math.ceil(sec * sr), sr);
  const nb = off.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2 - 1;
  const live = actx, liveNoise = noiseBuf;
  actx = off; noiseBuf = nb; BAKING = true;
  try { fn(off.destination, .002); } finally { actx = live; noiseBuf = liveNoise; BAKING = false; }
  const buf = await off.startRendering();
  // trim the silent end so voices are released as early as possible
  const ch = buf.getChannelData(0); let end = ch.length - 1; while (end > 0 && Math.abs(ch[end]) < 2e-4) end--;
  if (end < ch.length - sr * .05){
    const out = off.createBuffer(1, end + Math.floor(sr * .02), sr); out.copyToChannel(ch.subarray(0, out.length), 0); return out;
  }
  return buf;
}
async function buildBank(onProgress){
  if (bankBusy || bankDone) return; bankBusy = true;
  const HI = actx ? Math.min(48000, actx.sampleRate) : 48000, LO = 24000;
  const jobs = [];
  const add = (key, n, sec, sr, fn) => jobs.push([key, n, sec, sr, fn]);
  // the player's own weapons first, so they are ready before anything else
  const order = [...new Set([...(me.loadout || []), 0,1,2,3,4,5,6,7,8])];
  for (const w of order){
    const P = SHOT[w];
    add('shot' + w, 3, P.tailDcy + (P.mech ? 1.05 : .35), HI, (d, t) => R.shot(d, t, w, false));
  }
  add('swap', 1, .4, HI, R.swap); add('dry', 2, .12, HI, R.dry);
  for (const w of order) add('reload' + w, 1, WEAPONS[w].reload / 1000 + .3, LO, (d, t) => R.reload(d, t, w, WEAPONS[w].reload / 1000));
  add('step', 6, .16, HI, (d, t) => R.step(d, t, false)); add('run', 6, .18, HI, (d, t) => R.step(d, t, true));
  add('whiz', 3, .25, HI, R.whiz);
  for (let k=0;k<3;k++) add('impact' + k, 2, k === 1 ? .35 : .18, HI, (d, t) => R.impact(d, t, k));
  add('hit', 1, .12, HI, (d, t) => R.hit(d, t, false, false)); add('hitHead', 1, .4, HI, (d, t) => R.hit(d, t, true, false));
  add('kill', 1, .5, HI, (d, t) => R.hit(d, t, false, true)); add('killHead', 1, .5, HI, (d, t) => R.hit(d, t, true, true));
  add('hurt', 2, .25, LO, R.hurt); add('land', 2, .2, HI, R.land); add('casing', 4, .3, HI, R.casing);
  add('slide', 2, .85, LO, R.slide); add('heartbeat', 1, .35, LO, R.heartbeat);
  for (const w of order){ const P = SHOT[w]; add('far' + w, 2, P.tailDcy * 1.3 + 1.5, LO, (d, t) => R.shot(d, t, w, true)); }
  add('boom', 2, 3.2, LO, (d, t) => R.boom(d, t, true)); add('ring', 1, 2.9, LO, R.ring);
  add('thunderNear', 1, 4.3, LO, (d, t) => R.thunder(d, t, true)); add('thunderFar', 2, 4.5, LO, (d, t) => R.thunder(d, t, false));
  add('win', 1, 1.2, LO, (d, t) => R.roundEnd(d, t, true)); add('lose', 1, 1.2, LO, (d, t) => R.roundEnd(d, t, false));
  add('bird', 4, .9, HI, R.bird); add('cricket', 2, .5, HI, R.cricket);
  let done = 0;
  for (const [key, n, sec, sr, fn] of jobs){
    if (onProgress) onProgress(done++, jobs.length);
    const list = [];
    for (let i=0;i<n;i++){ try { const b = await bake(sec, sr, fn); if (b) list.push(b); } catch(e){} }
    if (list.length) BANK[key] = list;
    await new Promise(r => setTimeout(r, 0));   // keep the page responsive while baking
  }
  bankDone = true; bankBusy = false;
}
// play a baked sound through a voice; returns false when it is not baked yet (caller falls back to live synthesis)
function playBank(key, v, rate, gain){
  const list = BANK[key]; if (!list || !v) return false;
  const src = actx.createBufferSource(); src.buffer = list[(Math.random() * list.length) | 0];
  src.playbackRate.value = rate || (.97 + Math.random() * .06);
  if (gain != null && gain !== 1){ const g = actx.createGain(); g.gain.value = gain; src.connect(g); g.connect(v.out); } else src.connect(v.out);
  src.start(v.t); return true;
}
const bankDur = key => BANK[key] ? BANK[key][0].duration : 1;

let _shotTimes = [], _lastCasing = 0;
function playShot(w, pos, pri){
  if (!actx) return;
  if (pos){ const tn = actx.currentTime; _shotTimes = _shotTimes.filter(x => tn - x < .25); camera.getWorldPosition(_lp); if (_shotTimes.length > 8 && _lp.distanceTo(pos) > 20) return; _shotTimes.push(tn); }
  const P = SHOT[w] || SHOT[3];
  let dist = 0; if (pos){ camera.getWorldPosition(_lp); dist = _lp.distanceTo(pos); }
  const far = pos && dist > 15, key = (far ? 'far' : 'shot') + w;
  const v = voice(pos, {gain:pos ? 1.25 : .85, verb:pos ? .25 : .18, ref:4, pri, dur:BANK[key] ? bankDur(key) : P.tailDcy + (P.mech ? 1 : .2)});
  if (!v) return;
  if (playBank(key, v)){
    if (!pos && w !== 5 && w !== 8 && actx.currentTime - _lastCasing > .12){ _lastCasing = actx.currentTime; const c = voice(null, {verb:.05, pri:1, dur:.3}); if (c){ c.t += .32 + Math.random()*.15; playBank('casing', c, 1, .55); } }
    return;
  }
  // fallback while the bank is still being prepared
  const t = v.t;
  if (far){ noise(v.out, t, {type:'bandpass', f:P.bodyF * .8, q:P.bodyQ, gain:P.body * .9, decay:P.bodyDcy}); noise(v.out, t + .008, {type:'lowpass', f:P.tailF * .8, q:.5, gain:P.tail * 1.4, attack:.006, decay:P.tailDcy}); return; }
  const d = saturator(v.out, P.sat);
  noise(d, t, {type:'highpass', f:P.clickF, q:.7, gain:P.click, decay:.012, attack:.0005});
  noise(d, t, {type:'bandpass', f:P.bodyF, q:P.bodyQ, gain:P.body, decay:P.bodyDcy});
  tone(d, t, {f0:P.th0, f1:P.th1, gain:P.th, decay:P.thDcy});
  noise(v.out, t + .008, {type:'lowpass', f:P.tailF, q:.5, gain:P.tail, attack:.006, decay:P.tailDcy});
}
// generic: baked if ready, otherwise the same recipe live
function sound(key, pos, opts, recipe){
  if (!actx) return null;
  const v = voice(pos || null, Object.assign({}, opts, {dur:BANK[key] ? bankDur(key) : (opts.dur ?? 1)})); if (!v) return null;
  if (!playBank(key, v, opts.rate)) recipe(v.out, v.t);
  return v;
}
function playSlide(pos){ sound('slide', pos, {verb:.08, gain:pos ? .8 : 1, ref:2, dur:.8}, R.slide); }
function playDry(){ sound('dry', null, {verb:.05, dur:.12}, R.dry); }
function playSwitch(){ sound('swap', null, {verb:.05, dur:.35}, R.swap); }
function playReload(w, dur){ sound('reload' + w, null, {verb:.08, dur:dur / 1000 + .25, rate:1}, (d, t) => R.reload(d, t, w, dur / 1000)); }
function playHit(head, kill){ sound(kill ? (head ? 'killHead' : 'kill') : (head ? 'hitHead' : 'hit'), null, {verb:.05, dur:.45, rate:1}, (d, t) => R.hit(d, t, head, kill)); }
const buzz = p => { try { if (touchOn && navigator.vibrate) navigator.vibrate(p); } catch(e){} };
function playHurt(){ sound('hurt', null, {verb:.05, dur:.3}, R.hurt); muffleFor(.18, 3200); buzz(28); }
let muffleUntil = 0, muffleFreq = 20000;
function muffleFor(sec, freq){ if (!actx) return; muffleUntil = Math.max(muffleUntil, actx.currentTime + sec); muffleFreq = Math.min(muffleFreq, freq); }
function playStep(pos, gain, run){ sound(run ? 'run' : 'step', pos, {gain:gain || .5, verb:.06, ref:1.5, roll:1.6, noDelay:true, pri:pos ? 1 : 2, dur:.18}, (d, t) => R.step(d, t, run)); }
function playLand(h){ sound('land', null, {verb:.1, gain:h, dur:.2}, R.land); }
function playWhiz(pos){ sound('whiz', pos, {gain:1, verb:.1, ref:1, noDelay:true, pri:2, dur:.25}, R.whiz); }
function playImpact(pos){
  if (!actx || Math.random() > .55) return;
  const k = Math.random() < .2 ? 1 : Math.random() < .3 ? 2 : 0;
  sound('impact' + k, pos, {gain:.45, verb:.25, ref:2, pri:1, dur:.35}, (d, t) => R.impact(d, t, k));
}
function playBoom(p){
  const v = sound('boom', p, {gain:1.6, verb:.5, ref:6, roll:.8, pri:3, dur:3, rate:.94 + Math.random()*.1}, (d, t) => R.boom(d, t, true));
  if (v && v.dist < 9){
    muffleFor(.5 + 1.1 * (1 - v.dist / 9), 1300);
    sound('ring', null, {verb:0, gain:1 - v.dist/9, dur:2.8, rate:1}, R.ring);
  }
}
function playThunder(close){ sound(close ? 'thunderNear' : 'thunderFar', null, {verb:.6, gain:1.2, pri:2, dur:4.5}, (d, t) => R.thunder(d, t, close)); }
let rainGain = null, rainWanted = false;
function setRainAudio(on){
  rainWanted = on;
  if (!actx) return;
  if (!rainGain){
    const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500;
    rainGain = actx.createGain(); rainGain.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(rainGain); rainGain.connect(dryBus); src.start();
  }
  rainGain.gain.setTargetAtTime(on ? .13 : 0, actx.currentTime, .6);
}
function playRoundEnd(win){ sound(win ? 'win' : 'lose', null, {verb:.5, dur:1.2, rate:1}, (d, t) => R.roundEnd(d, t, win)); }
function playHeartbeat(){ sound('heartbeat', null, {verb:0, dur:.35, rate:1}, R.heartbeat); }

// ---- menu music: an original, procedurally composed war-drum and strings march (D minor, 132 BPM).
// It is rendered once into a looping buffer in the background, and only plays on the menu screens.
const MUSIC = {buf:null, src:null, gain:null, baking:false, on:true};
try { MUSIC.on = localStorage.getItem('cephe-music') !== '0'; } catch(e){}
async function bakeMusic(){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (MUSIC.buf || MUSIC.baking || !OAC) return; MUSIC.baking = true;
  try {
    const BPM = 132, beat = 60 / BPM, bar = beat * 4, BARS = 16, loopLen = bar * BARS, sr = 32000;
    // the loop is rendered as four 4-bar pieces in parallel (each offline context runs on its own thread), then summed
    const renderBars = async (b0, b1) => {
    const m = new OAC(2, Math.ceil(((b1 - b0) * bar + 2.5) * sr), sr);
    const mf = n => 440 * Math.pow(2, (n - 69) / 12);
    // master: glue compressor, plus a hall reverb send
    const comp = m.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .2;
    const out = m.createGain(); out.gain.value = .9; comp.connect(out); out.connect(m.destination);
    const verb = m.createConvolver(); verb.buffer = makeImpulse(m, 2.4, 3.4); const verbG = m.createGain(); verbG.gain.value = .35; verb.connect(verbG); verbG.connect(comp);
    const nb = m.createBuffer(1, sr, sr), nd = nb.getChannelData(0); for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2 - 1;
    const bus = (pan, wet) => { const g = m.createGain(), p = m.createStereoPanner ? m.createStereoPanner() : null; if (p){ p.pan.value = pan; g.connect(p); p.connect(comp); } else g.connect(comp); if (wet){ const s = m.createGain(); s.gain.value = wet; g.connect(s); s.connect(verb); } return g; };
    const B = {strL:bus(-.35, .25), strR:bus(.35, .25), pad:bus(0, .5), bass:bus(0, .05), drum:bus(0, .2), taiko:bus(0, .35), lead:bus(.1, .45), fx:bus(0, .6)};
    const env = (g, t, a, peak, d, sus, rel, end) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * sus, t + a, d); g.gain.setTargetAtTime(0, end, rel); };
    // synth voice: detuned oscillators -> lowpass (with its own envelope) -> amp envelope
    const voiceN = (dest, t, dur, freq, o) => {
      const f = m.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = o.q || .7;
      f.frequency.setValueAtTime(o.f0 || 800, t); f.frequency.linearRampToValueAtTime(o.f1 || o.f0 || 800, t + (o.fT || dur));
      const g = m.createGain(); env(g, t, o.a || .005, o.gain || .3, o.d || .1, o.s ?? .6, o.r || .08, t + dur);
      f.connect(g); g.connect(dest);
      for (const det of (o.det || [0])){ const os = m.createOscillator(); os.type = o.type || 'sawtooth'; os.frequency.value = freq; os.detune.value = det;
        if (o.vib && !(o.vibOne && det !== (o.det || [0])[0])){ const l = m.createOscillator(), lg = m.createGain(); l.frequency.value = 5.2; lg.gain.value = o.vib; l.connect(lg); lg.connect(os.frequency); l.start(t + .15); l.stop(t + dur + .5); }
        os.connect(f); os.start(t); os.stop(t + dur + (o.r || .08) * 6); }
    };
    const noiseHit = (dest, t, o) => { const s = m.createBufferSource(); s.buffer = nb; const f = m.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dcy); f.Q.value = o.q || .8;
      const g = m.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain, t + (o.a || .002)); g.gain.exponentialRampToValueAtTime(.0005, t + (o.a || .002) + o.dcy);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * .5); s.stop(t + (o.a || .002) + o.dcy + .05); };
    const thump = (dest, t, f0, f1, dcy, gain) => { const os = m.createOscillator(); os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dcy * .7);
      const g = m.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0005, t + dcy); os.connect(g); g.connect(dest); os.start(t); os.stop(t + dcy + .05); };
    const taiko = (t, gain) => { gain *= .75; thump(B.taiko, t, 95, 42, .7, gain); noiseHit(B.taiko, t, {type:'lowpass', f:420, gain:gain * .5, dcy:.12}); };
    const kick = (t, gain) => { thump(B.drum, t, 150, 46, .28, gain); noiseHit(B.drum, t, {type:'highpass', f:3000, gain:gain * .12, dcy:.01}); };
    const snare = (t, gain) => { noiseHit(B.drum, t, {f:1900, q:.7, gain:gain, dcy:.16}); thump(B.drum, t, 230, 170, .09, gain * .5); };
    const crash = t => { noiseHit(B.fx, t, {type:'highpass', f:4500, gain:.22, dcy:1.8}); noiseHit(B.fx, t, {f:7000, q:.5, gain:.1, dcy:1.2}); };

    const CH = [{root:38, pad:[50,57,62,65]}, {root:34, pad:[46,53,58,62]}, {root:41, pad:[48,53,57,60]}, {root:36, pad:[48,55,60,64]}];
    const OST = [12, 12, 19, 12, 24, 12, 19, 12, 12, 12, 19, 12, 24, 19, 15, 12];   // staccato strings, 16ths over the chord root
    const MEL = [
      [[0,1,74],[1,.5,69],[1.5,.5,74],[2,1,77],[3,1,76]], [[0,1.5,74],[1.5,.5,72],[2,2,70]],
      [[0,1,72],[1,.5,69],[1.5,.5,72],[2,1,77],[3,1,79]], [[0,2,76],[2,1,79],[3,1,76]],
      [[0,1,81],[1,.5,77],[1.5,.5,81],[2,1,79],[3,1,77]], [[0,2,74],[2,1,77],[3,1,74]],
      [[0,1,72],[1,1,77],[2,1,81],[3,1,79]], [[0,3,76],[3,1,74]],
    ];
    for (let b = b0; b < b1; b++){
      const t0 = (b - b0) * bar, ch = CH[b % 4], sec = b < 4 ? 0 : b < 8 ? 1 : 2;
      // strings ostinato, left/right alternating for width
      for (let i = 0; i < 16; i++){
        const tt = t0 + i * beat / 4, acc = i % 4 === 0 ? 1 : .7;
        voiceN(i % 2 ? B.strR : B.strL, tt, beat / 4 * .55, mf(ch.root + 12 + OST[i]), {det:[i % 2 ? 6 : -6], f0:sec ? 2600 : 1700, f1:900, fT:.12, gain:.1 * acc * (sec ? 1.15 : .9), a:.004, d:.05, s:.5, r:.04});
      }
      // pad: sustained chord swelling through the bar
      for (const n of ch.pad) voiceN(B.pad, t0, bar - .05, mf(n), {det:[-8, 8], f0:500, f1:sec === 2 ? 2000 : 1300, fT:bar * .8, gain:sec ? .045 : .035, a:.35, d:.6, s:.85, r:.35});
      // brass stab on the downbeat from the second section
      if (sec >= 1) for (const n of ch.pad) voiceN(B.pad, t0, beat * .9, mf(n + 12), {type:'sawtooth', det:[0], f0:3000, f1:900, fT:.25, gain:.065, a:.01, d:.12, s:.4, r:.12});
      // bass: driving eighths
      if (sec >= 1) for (let i = 0; i < 8; i++){
        const tt = t0 + i * beat / 2;
        voiceN(B.bass, tt, beat / 2 * .8, mf(ch.root + (i % 2 ? 12 : 0)), {det:[0], f0:520, f1:240, fT:.15, gain:.2, a:.005, d:.08, s:.6, r:.05});
        if (i % 2 === 0) thump(B.bass, tt, mf(ch.root), mf(ch.root) * .98, beat * .9, .2);
      }
      // war drums
      taiko(t0, .9); taiko(t0 + beat * 1.5, .55); taiko(t0 + beat * 2, .8);
      if (sec >= 1){ taiko(t0 + beat * 3, .6); taiko(t0 + beat * 3.5, .45); }
      if (sec === 2) for (let i = 0; i < 4; i++) kick(t0 + i * beat, .9);
      if (sec >= 1){
        snare(t0 + beat, .55); snare(t0 + beat * 3, .55);
        for (const g of [.75, 1.75, 2.75, 3.25, 3.75]) snare(t0 + beat * g, .12);        // marching ghost notes
      }
      // lead horn melody in the second half
      if (b >= 8){
        for (const [st, len, n] of MEL[b - 8]) voiceN(B.lead, t0 + st * beat, len * beat * .95, mf(n - 12), {det:[-6, 6], type:'sawtooth', vibOne:true, f0:900, f1:2200, fT:.18, gain:.085, a:.04, d:.3, s:.75, r:.12, vib:3});
        for (const [st, len, n] of MEL[b - 8]) voiceN(B.lead, t0 + st * beat, len * beat * .95, mf(n - 24), {type:'square', f0:700, gain:.03, a:.05, d:.3, s:.8, r:.12});
      }
      if (b === 8 || b === 12) crash(t0);
      if (b === 0) crash(t0);
      if (b === 7){ noiseHit(B.fx, t0, {f:300, f2:5000, q:2, gain:.18, a:bar * .9, dcy:.15}); for (let i = 0; i < 8; i++) snare(t0 + beat * 2 + i * beat / 4, .15 + i * .05); }   // riser + snare roll
      if (b === 15) for (let i = 0; i < 6; i++) taiko(t0 + beat * 2.5 + i * beat / 4, .5 + i * .08);                                          // tom fill back to the top
    }
    return m.startRendering();
    };
    const pieces = await Promise.all([[0, 4], [4, 8], [8, 12], [12, 16]].map(([a, b]) => renderBars(a, b)));
    // sum the pieces into one loop; tails that run past the loop point wrap onto the start, so the loop is seamless
    const L = Math.round(loopLen * sr), buf = new OAC(2, 1, sr).createBuffer(2, L, sr);
    pieces.forEach((pc, k) => {
      const off = Math.round(k * 4 * bar * sr);
      for (let c = 0; c < 2; c++){ const src = pc.getChannelData(c), dst = buf.getChannelData(c); for (let i = 0; i < src.length; i++) dst[(off + i) % L] += src[i]; }
    });
    let pk = 0; for (let c = 0; c < 2; c++){ const d = buf.getChannelData(c); for (let i = 0; i < L; i++){ const x = Math.abs(d[i]); if (x > pk) pk = x; } }
    if (pk > 0) for (let c = 0; c < 2; c++){ const d = buf.getChannelData(c), k = .9 / pk; for (let i = 0; i < L; i++) d[i] *= k; }
    MUSIC.buf = buf;
  } catch(e){ console.warn('music bake failed', e); }
  MUSIC.baking = false;
}
// called every frame: plays only while the menu (or the pre-match room) is on screen
function updateMusic(){
  if (!actx || !MUSIC.buf || actx.state !== 'running') return;
  const want = MUSIC.on && !started, t = actx.currentTime;
  if (want && !MUSIC.src){
    const s = actx.createBufferSource(); s.buffer = MUSIC.buf; s.loop = true;
    const g = actx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + 1.6);
    s.connect(g); g.connect(master); s.start(t + .02); MUSIC.src = s; MUSIC.gain = g;
  } else if (!want && MUSIC.src){
    const s = MUSIC.src, g = MUSIC.gain; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + .6);
    s.stop(t + .7); MUSIC.src = MUSIC.gain = null;
  }
}
function setMusic(on, fromUser){
  MUSIC.on = !!on; try { localStorage.setItem('cephe-music', on ? '1' : '0'); } catch(e){}
  document.querySelectorAll('[data-music]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.music === '1') === MUSIC.on));
  document.querySelectorAll('.musicBtn').forEach(b => { b.setAttribute('aria-pressed', MUSIC.on); b.querySelector('span').textContent = MUSIC.on ? 'Müzik açık' : 'Müzik kapalı'; });
  if (MUSIC.on && fromUser){ initAudio(); bakeMusic(); }
}

// ---- ambience: wind, distant battle, birds
function startAmbience(){
  if (ambStarted || !actx) return; ambStarted = true;
  const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = .6;
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = .5;
  const g = actx.createGain(); g.gain.value = .07;
  const lfo = actx.createOscillator(); lfo.frequency.value = .07; const lfoG = actx.createGain(); lfoG.gain.value = .045;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  const lfo2 = actx.createOscillator(); lfo2.frequency.value = .11; const lfo2G = actx.createGain(); lfo2G.gain.value = 180;
  lfo2.connect(lfo2G); lfo2G.connect(lp.frequency);
  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(dryBus);
  src.start(); lfo.start(); lfo2.start();
  const scheduleBattle = () => {
    setTimeout(() => {
      if (actx && started){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*220, 2, Math.sin(a)*220);
        const n = 1 + Math.floor(Math.random()*5), w = [3,3,6,2,7][Math.floor(Math.random()*5)];
        for (let i=0;i<n;i++) setTimeout(() => playShot(w, pos, 0), i * (w === 7 ? 900 : 110) + Math.random()*40);
      }
      scheduleBattle();
    }, 7000 + Math.random()*14000);
  };
  const scheduleBird = () => {
    setTimeout(() => {
      const AT = typeof ATMOS !== 'undefined' ? ATMOS[atmos] : {};
      if (actx && AT.night && !AT.rain){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*25, .3, Math.sin(a)*25);
        sound('cricket', pos, {gain:.18, verb:.2, ref:8, pri:0, dur:.5}, R.cricket);
      } else if (actx && !AT.rain){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*40, 8, Math.sin(a)*40);
        sound('bird', pos, {gain:.25, verb:.35, ref:10, pri:0, dur:.9, rate:.85 + Math.random()*.3}, R.bird);
      }
      scheduleBird();
    }, 4000 + Math.random()*9000);
  };
  scheduleBattle(); scheduleBird();
}

// ---- per-frame audio state: listener, muffle (low health / near explosions), heartbeat
let nextBeat = 0;
function updateAudio(hp, alive){
  if (!actx) return;
  updateListener();
  const t = actx.currentTime;
  let target = 20000;
  if (started && !alive) target = 1800;
  else if (started && hp < 30) target = 4500;
  if (t < muffleUntil) target = Math.min(target, muffleFreq); else muffleFreq = 20000;
  muffle.frequency.setTargetAtTime(target, t, target < 5000 ? .08 : .35);
  if (started && alive && hp < 30 && t > nextBeat){ playHeartbeat(); nextBeat = t + .85; }
}
// compatibility shim for any remaining generic calls
function sfx(kind, vol){ if (kind === 'hit') playHit(vol >= 1, false); else if (kind === 'hurt') playHurt(); }

// ================= Game state =================
let isHost = false, myId = null, started = false, now = 0;
let score = [0,0], goal = 30, diff = 1, over = null, overView = null;
let humanSeq = 0, botSeq = [0,0];
const ents = new Map();        // id -> entity (host: authoritative, client: mirror)
const avatars = new Map();     // id -> {av, team, wasAlive}
let fxQ = [], evQ = [];
const me = {
  name:'Asker'+Math.floor(Math.random()*90+10), team:0,
  pos:new V(0,0,20), vel:new V(), yaw:0, pitch:0, grounded:true, rs:0,
  weapon:3, ammo:WEAPONS.map(w => w.mag), res:HANDLING.map(h => h.res), reloading:false, reloadEnd:0, nextFire:0, latched:false,
  zoom:false, recoil:0, prevHp:100, deadAt:0,
  bloom:0, burstN:0, trigK:0, streak:0, ejectAt:0, ejectW:-1, lastShotT:-1e9, recoilSide:1, recovP:0, recovY:0,     // recoil pattern and spread
  stam:1, stamT:-1e9, exhausted:false, sprinting:false,                    // sprint energy
  gren:2, med:2, grenCd:0, medCd:0, healFx:-1e9,                            // grenades and first-aid kits (per life)
};
function newEnt(id, kind, team, name){
  return {id, kind, team, name, pos:new V(0,0,0), yaw:0, pitch:0, hp:100, alive:false, weapon:3, rs:0, k:0, d:0,
          inv:false, invUntil:0, respawnAt:0, lastHurt:-1e9,
          ai: kind === 'b' ? {target:null, scanT:0, react:0, nextShot:0, burst:0, strafe:1, strafeT:0, wp:null, lastSeen:null, stuckT:0, stuckPos:new V()} : null};
}
const myEnt = () => ents.get(myId);
const cleanName = s => (typeof s === 'string' ? s : '').replace(/[\u0000-\u001f]/g,'').trim().slice(0,14) || 'Asker';
function nameOf(id){ const e = ents.get(id); if (!e) return 'Bilinmeyen'; return id === myId ? e.name + ' (sen)' : e.name; }

// ================= Menu =================
$('nameIn').value = me.name;
document.querySelectorAll('.team').forEach(b => b.onclick = () => {
  me.team = +b.dataset.team;
  document.querySelectorAll('.team').forEach(x => x.setAttribute('aria-pressed', x === b));
});
function readName(){ me.name = cleanName($('nameIn').value) || me.name; }
$('hostBtn').onclick = () => {
  readName(); initAudio();
  isHost = true; myId = 'h0';
  ents.set(myId, newEnt(myId, 'h', me.team, me.name));
  $('menu').hidden = true; showLobby(); openPeerHost();
};
$('joinBtn').onclick = () => { readName(); initAudio(); $('menu').hidden = true; $('joinO').hidden = false; $('joinCode').focus(); };
$('joinBack').onclick = () => { $('joinO').hidden = true; $('menu').hidden = false; showPanel('play'); };
$('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); $('joinGo').click(); } });

await loadStep(69, 'Bağlantı sistemi');
// ================= Networking =================
const ICE = {iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]};
const conns = new Map();   // host: id -> conn
let hostConn = null, roomCode = null, kicked = false, hostPeer = null;
function makeConn(raw){ const c = {raw, onmsg:null, onclose:null, closed:false}; c.send = o => { try { raw(JSON.stringify(o)); } catch(e){} }; return c; }
function deliver(c, data){ if (typeof data !== 'string') return; let m; try { m = JSON.parse(data); } catch(e){ return; } if (m && typeof m === 'object' && c.onmsg) c.onmsg(m); }
function closeConn(c){ if (c.closed) return; c.closed = true; if (c.onclose) c.onclose(); }
function wrapPeer(pc){
  const c = makeConn(s => { if (pc.open) pc.send(s); });
  pc.on('data', d => deliver(c, d)); pc.on('close', () => closeConn(c)); pc.on('error', () => closeConn(c));
  c.close = () => { try { pc.close(); } catch(e){} };
  return c;
}
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randCode = () => Array.from({length:5}, () => CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');

function peerHost(code){
  return new Promise((res, rej) => {
    if (!window.Peer) return rej({type:'nolib'});
    let p;
    try { p = new Peer(PEER_PREFIX + code, {debug:0, config:ICE}); } catch(e){ return rej(e); }
    let done = false;
    const to = setTimeout(() => { if (!done){ done = true; try{p.destroy();}catch(e){} rej({type:'timeout'}); } }, 8000);
    p.on('open', () => { if (done) return; done = true; clearTimeout(to); res(p); });
    p.on('error', e => { if (done) return; done = true; clearTimeout(to); try{p.destroy();}catch(_){} rej(e); });
    p.on('connection', pc => { pc.on('open', () => hostAddConn(wrapPeer(pc))); });
    // keep the code reachable: if the matchmaking server drops us while waiting, sign back in under the same code
    p.on('disconnected', () => { setTimeout(() => { try { if (!p.destroyed && p.disconnected) p.reconnect(); } catch(e){} }, 1500); });
  });
}
const PEER_ERR = {
  nolib:'bağlantı kütüphanesi yüklenemedi', timeout:'sunucu yanıt vermedi', network:'oda sunucusuna ulaşılamadı',
  'server-error':'oda sunucusu hata verdi', 'socket-error':'oda sunucusuna ulaşılamadı', 'socket-closed':'sunucu bağlantısı kapandı',
  'unavailable-id':'kod kullanımda', 'browser-incompatible':'tarayıcı desteklemiyor', webrtc:'doğrudan bağlantı kurulamadı',
};
const peerErrText = e => PEER_ERR[e && e.type] || 'oda sunucusuna ulaşılamadı';
let codeTry = 0;
function showRoomCode(code){ roomCode = code; $('roomCode').textContent = code; updateNet(); }
async function openPeerHost(){
  const myTry = ++codeTry;
  if (hostPeer){ try { hostPeer.destroy(); } catch(e){} hostPeer = null; }
  showRoomCode(randCode());
  $('codeBox').dataset.ready = '0';
  // registering the code with the matchmaking server happens quietly; failures are retried until it works
  for (let attempt = 0; myTry === codeTry; attempt++){
    try {
      if (!window.Peer) throw {type:'nolib'};
      hostPeer = await peerHost(roomCode);
      if (myTry !== codeTry){ try { hostPeer.destroy(); } catch(e){} return; }
      $('codeBox').dataset.ready = '1'; return;
    } catch(e){
      if (myTry !== codeTry) return;
      if (e && e.type === 'unavailable-id'){ showRoomCode(randCode()); continue; }
      await new Promise(r => setTimeout(r, Math.min(15000, 3000 + attempt * 2000)));
    }
  }
}
function peerJoin(code){
  return new Promise((res, rej) => {
    if (!window.Peer) return rej({type:'nolib'});
    let p; try { p = new Peer({debug:0, config:ICE}); } catch(e){ return rej(e); }
    let done = false;
    const to = setTimeout(() => { if (!done){ done = true; try{p.destroy();}catch(e){} rej({type:'timeout'}); } }, 15000);
    p.on('open', () => {
      const pc = p.connect(PEER_PREFIX + code, {reliable:true});
      pc.on('open', () => { if (done) return; done = true; clearTimeout(to); res(wrapPeer(pc)); });
    });
    p.on('error', e => { if (done) return; done = true; clearTimeout(to); try{p.destroy();}catch(_){} rej(e); });
  });
}
async function copyText(el){
  const text = el.value || el.textContent;
  try { await navigator.clipboard.writeText(text); return true; }
  catch(e){ try { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); return document.execCommand('copy'); } catch(_){ return false; } }
}
$('copyCode').onclick = async () => {
  const b = $('copyCode'), lbl = b.querySelector('span'), ok = !!roomCode && await copyText($('roomCode'));
  lbl.textContent = ok ? 'Kopyalandı' : 'Seçildi'; b.classList.toggle('done', ok);
  clearTimeout(b._t); b._t = setTimeout(() => { lbl.textContent = 'Kopyala'; b.classList.remove('done'); }, 1600);
};
const cleanCode = v => v.toUpperCase().split('').filter(ch => CODE_CHARS.includes(ch)).join('').slice(0, 5);
$('joinCode').addEventListener('input', () => { const el = $('joinCode'), c = cleanCode(el.value); if (el.value !== c) el.value = c; $('joinStatus').textContent = ''; });
$('joinGo').onclick = async () => {
  mobileImmersive();
  const code = cleanCode($('joinCode').value), st = $('joinStatus');
  if (code.length !== 5){ st.textContent = 'Oda kodu 5 haneli olmalı.'; $('joinCode').focus(); return; }
  $('joinGo').disabled = true; st.textContent = 'Odaya bağlanılıyor…';
  try { clientAttach(await peerJoin(code)); st.textContent = 'Bağlandı!'; }
  catch(e){
    st.textContent = e && e.type === 'peer-unavailable' ? 'Bu kodla açık bir oda yok. Kodu kontrol et; arkadaşın oda ekranında beklemeli.'
      : e && e.type === 'timeout' ? 'Oda bulundu ama bağlantı kurulamadı. Biriniz farklı bir ağ (ör. mobil veri yerine Wi-Fi) deneyin.'
      : `Bağlanılamadı: ${peerErrText(e)}.`;
    $('joinGo').disabled = false;
  }
};

// --- host side ---
function hostAddConn(conn){
  conn.onmsg = m => hostMsg(conn, m);
  conn.onclose = () => {
    if (!conn.id) return;
    const e = ents.get(conn.id);
    if (e && !conn.kicked) roomEvent(`${e.name} odadan ayrıldı`, 'out');
    ents.delete(conn.id); conns.delete(conn.id); updateLobby(); updateNet(); hostBroadcast(true);
  };
}
function hostMsg(conn, m){
  if (m.t === 'hi' && !conn.id){
    conn.id = 'h' + (++humanSeq);
    const e = newEnt(conn.id, 'h', m.team === 1 ? 1 : 0, cleanName(m.name));
    ents.set(conn.id, e); conns.set(conn.id, conn);
    if (started) spawnEnt(e);
    conn.send({t:'id', id:conn.id});
    conn.send({t:'logs', l:roomLog});
    roomEvent(`${e.name} odaya katıldı`, 'in'); updateLobby(); updateNet(); hostBroadcast(true);
    return;
  }
  if (!conn.id) return;
  const e = ents.get(conn.id); if (!e) return;
  if (m.t === 'st'){
    if (Array.isArray(m.p) && m.rs === e.rs && e.alive){
      const x = +m.p[0], y = +m.p[1], z = +m.p[2];
      if (isFinite(x) && isFinite(y) && isFinite(z)) e.pos.set(Math.max(-A,Math.min(A,x)), Math.max(0,Math.min(6,y)), Math.max(-A,Math.min(A,z)));
    }
    e.yaw = +m.y || 0; e.pitch = +m.x || 0; e.weapon = (m.w|0) % NW; e.slide = !!m.s; e.needAmmo = !!m.n;
  } else if (m.t === 'sh'){
    if (Array.isArray(m.o) && Array.isArray(m.e)){ const f = {o:m.o.slice(0,3), e:m.e.slice(0,12), w:(m.w|0)%NW, by:conn.id}; fxQ.push(f); renderFx(f); }
  } else if (m.t === 'hit'){
    applyHit(conn.id, String(m.v), Math.min(200, Math.max(0, +m.d || 0)));
  } else if (m.t === 'gr'){
    if (Array.isArray(m.o) && Array.isArray(m.v)){ const f = {g:1, o:m.o.slice(0,3), v:m.v.slice(0,3), by:conn.id}; fxQ.push(f); renderFx(f); }
  } else if (m.t === 'med'){
    hostHeal(conn.id);
  } else if (m.t === 'team'){
    setTeam(conn.id, m.team === 1 ? 1 : 0);
  }
}
const encEnt = e => [e.id, e.kind==='b'?1:0, e.team, e.name, r2(e.pos.x), r2(e.pos.y), r2(e.pos.z), r2(e.yaw), r2(e.pitch),
  Math.max(0,Math.ceil(e.hp)), e.alive?1:0, e.weapon, e.rs, e.k, e.d, e.inv?1:0, e.slide?1:0];
let lastBroadcast = 0;
function hostBroadcast(force){
  if (!force && now - lastBroadcast < 50) return;
  lastBroadcast = now;
  if (!conns.size){ fxQ = []; evQ = []; return; }
  const msg = JSON.stringify({t:'w', st:started?1:0, g:goal, sc:score, atm:atmos, df:diff, mp:mapId,
    ov: over ? [over.win, Math.max(0, Math.ceil((over.until-now)/1000))] : 0,
    e:[...ents.values()].map(encEnt), fx:fxQ, ev:evQ, pk:encPickups(),
    zn:MODE === 'dom' ? ZONES.map(z => [z.owner, Math.round(z.prog * 100), z.contested ? 1 : 0]) : 0});
  fxQ = []; evQ = [];
  for (const c of conns.values()) try { c.raw(msg); } catch(e){}
}
// ---- room events (join / leave / kick / team), kept by the host and mirrored to everyone
const roomLog = [];
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
function pushLog(item){
  roomLog.push(item); if (roomLog.length > 12) roomLog.shift();
  renderRoomLog(); addFeed(item.s);
}
function roomEvent(text, kind){
  const item = {s:text, k:kind, t:hhmm()};
  pushLog(item);
  for (const c of conns.values()) c.send({t:'log', s:item.s, k:item.k, tm:item.t});
}
function renderRoomLog(){
  const ol = $('roomLog'); if (!ol) return; ol.textContent = '';
  if (!roomLog.length){ const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Henüz kimse girip çıkmadı.'; ol.appendChild(li); return; }
  for (const it of roomLog.slice().reverse()){
    const li = document.createElement('li'); li.className = ['in','out','kick','team'].includes(it.k) ? 'lg-' + it.k : '';
    const tm = document.createElement('time'); tm.textContent = it.t || '';
    const sp = document.createElement('span'); sp.textContent = it.s;
    li.append(tm, sp); ol.appendChild(li);
  }
}
function kickPlayer(id){
  if (!isHost || id === myId) return;
  const c = conns.get(id), e = ents.get(id); if (!c) return;
  c.kicked = true; c.send({t:'kick'});
  roomEvent(`${e ? e.name : 'Bir oyuncu'} odadan atıldı`, 'kick');
  ents.delete(id); conns.delete(id); updateLobby(); updateNet(); hostBroadcast(true);
  setTimeout(() => { try { c.close && c.close(); } catch(e){} }, 400);
}
function setTeam(id, team){
  const e = ents.get(id); if (!e || e.team === team) return;
  e.team = team;
  if (started && !over) spawnEnt(e);
  roomEvent(`${e.name} ${TEAM_NAME[team]}'e geçti`, 'team');
  updateLobby(); hostBroadcast(true);
}
function requestTeam(team){
  team = team ? 1 : 0;
  if (isHost) setTeam(myId, team);
  else if (hostConn && myId) hostConn.send({t:'team', team});
  else me.team = team;
}
function changeBots(team, delta){
  const mine = [...ents.values()].filter(e => e.kind === 'b' && e.team === team);
  if (delta > 0 && mine.length < MAX_BOTS){
    const n = ++botSeq[team], id = `b${team}_${n}`;
    const e = newEnt(id, 'b', team, `${team ? 'Kızıl' : 'Mavi'} Er ${n}`);
    ents.set(id, e); if (started) spawnEnt(e);
  } else if (delta < 0 && mine.length){
    ents.delete(mine[mine.length-1].id);
  }
  updateLobby(); hostBroadcast(true);
}
function spawnEnt(e){
  let best = SPAWNS[e.team][0], bd = -1;
  for (const s of SPAWNS[e.team]){
    let md = 1e9;
    for (const o of ents.values()) if (o.alive && o !== e) md = Math.min(md, Math.hypot(o.pos.x-s[0], o.pos.z-s[1]) * (o.team === e.team ? 3 : 1));
    if (md === 1e9) md = Math.random()*100;
    md += Math.random()*3;
    if (md > bd){ bd = md; best = s; }
  }
  e.pos.set(best[0], 0, best[1]); e.yaw = Math.atan2(best[0], best[1]);
  e.hp = 100; e.alive = true; e.invUntil = now + 2000; e.inv = true; e.rs++; e.medN = 0; e.healLeft = 0;
  if (e.ai){ Object.assign(e.ai, {target:null, lastSeen:null, wp:null, burst:0, nextShot:now+800, path:null, obj:null, objPt:null, holdT:0}); e.weapon = BOT_WEAPONS[Math.floor(Math.random()*BOT_WEAPONS.length)]; }
}
function applyHit(fromId, toId, dmg){
  const s = ents.get(fromId), v = ents.get(toId);
  if (!started || over || !s || !v || !v.alive || v.team === s.team || now < v.invUntil || dmg <= 0) return;
  v.hp -= dmg; v.lastHurt = now;
  if (v.hp <= 0){
    v.hp = 0; v.alive = false; v.respawnAt = now + (v.kind === 'b' ? 4000 : 3000);
    v.d++; s.k++; score[s.team]++; dropPouch(v.pos.x, v.pos.z);
    evQ.push({k:fromId, v:toId}); onKill(fromId, toId);
    if (score[s.team] >= goalFor()){ over = {win:s.team, until:now + 7000}; }
  }
}
function hostResetRound(){
  over = null; score = [0,0]; resetPickups(); resetZones();
  for (const e of ents.values()){ e.k = 0; e.d = 0; spawnEnt(e); }
}
function hostStart(){
  goal = +$('goalSel').value; diff = +$('diffSel').value;
  started = true; score = [0,0]; resetPickups(); resetZones();
  for (const e of ents.values()){ e.k = 0; e.d = 0; spawnEnt(e); }
  hostBroadcast(true); enterGame();
}
// back to the main menu: a fresh page (drops the room cleanly) but skips the intro and the long loading screen
function goMainMenu(){ try { sessionStorage.setItem('cephe-quick', '1'); } catch(e){} location.reload(); }
$('reloadBtn').onclick = () => goMainMenu();
function syncGoalLabels(){ const dom = MODE === 'dom'; document.querySelectorAll('#goalSel option').forEach(o => { o.textContent = dom ? `${+o.value * 5} puan` : `${o.value} leş`; }); }
$('goalSel').onchange = () => { if (!isHost){ $('goalSel').value = String(goal); return; } goal = +$('goalSel').value; hostBroadcast(true); };
$('diffSel').onchange = () => { if (!isHost){ $('diffSel').value = String(diff); return; } diff = +$('diffSel').value; hostBroadcast(true); };

// --- client side ---
function clientAttach(conn){
  hostConn = conn;
  conn.onmsg = m => {
    if (m.t === 'id'){ myId = String(m.id); $('joinO').hidden = true; showLobby(); }
    else if (m.t === 'w') clientWorld(m);
    else if (m.t === 'log' && typeof m.s === 'string') pushLog({s:m.s.slice(0,80), k:String(m.k||''), t:String(m.tm||hhmm()).slice(0,5)});
    else if (m.t === 'logs' && Array.isArray(m.l)){ roomLog.length = 0; for (const it of m.l.slice(-12)) if (it && typeof it.s === 'string') roomLog.push({s:it.s.slice(0,80), k:String(it.k||''), t:String(it.t||'').slice(0,5)}); renderRoomLog(); }
    else if (m.t === 'kick'){ kicked = true; }
    else if (m.t === 'am') gotAmmo(m.k === 2 ? 2 : 1);
  };
  conn.onclose = () => {
    started = false; $('lostO').hidden = false; if (document.pointerLockElement) document.exitPointerLock();
    if (kicked){ $('lostH').textContent = 'Odadan çıkarıldın'; $('lostP').textContent = 'Odayı kuran oyuncu seni odadan çıkardı.'; }
  };
  conn.send({t:'hi', name:me.name, team:me.team});
}
function clientWorld(m){
  if (!myId) return;
  goal = +m.g || 30; score = Array.isArray(m.sc) ? m.sc.map(Number) : [0,0];
  if (Number.isInteger(m.atm) && m.atm >= 0 && m.atm < ATMOS.length && m.atm !== atmos) applyAtmos(m.atm, true);
  if (Number.isInteger(m.mp) && m.mp >= 0 && m.mp < MAPS.length && m.mp !== mapId) setMap(m.mp, true);
  if (Number.isInteger(m.df) && m.df >= 0 && m.df <= 2) diff = m.df;
  if ($('goalSel').value !== String(goal)) $('goalSel').value = String(goal);
  if ($('diffSel').value !== String(diff)) $('diffSel').value = String(diff);
  overView = Array.isArray(m.ov) ? m.ov : null;
  const seen = new Set();
  if (Array.isArray(m.e)) for (const a of m.e){
    if (!Array.isArray(a) || a.length < 16) continue;
    const id = String(a[0]); seen.add(id);
    let e = ents.get(id);
    if (!e){ e = newEnt(id, a[1] ? 'b' : 'h', a[2] ? 1 : 0, cleanName(a[3])); ents.set(id, e); }
    e.team = a[2] ? 1 : 0; e.name = cleanName(a[3]);
    e.pos.set(+a[4]||0, +a[5]||0, +a[6]||0); e.yaw = +a[7]||0; e.pitch = +a[8]||0;
    e.hp = +a[9]||0; e.alive = !!a[10]; e.weapon = (a[11]|0)%NW; e.rs = +a[12]||0; e.k = +a[13]||0; e.d = +a[14]||0; e.inv = !!a[15]; e.slide = !!a[16];
  }
  for (const id of [...ents.keys()]) if (!seen.has(id)) ents.delete(id);
  if (Array.isArray(m.fx)) for (const f of m.fx) if (f && f.by !== myId) renderFx(f);
  if (Array.isArray(m.ev)) for (const x of m.ev){ if (x && x.k) onKill(String(x.k), String(x.v)); else if (x && Number.isInteger(x.zc)) onZone(x.zc, x.o === 0 || x.o === 1 ? x.o : -1, x.p === 0 || x.p === 1 ? x.p : -1); }
  if (Array.isArray(m.zn)) m.zn.forEach((a, i) => { const z = ZONES[i]; if (z && Array.isArray(a)){ z.owner = a[0] === 0 || a[0] === 1 ? a[0] : -1; z.prog = Math.max(-1, Math.min(1, (+a[1] || 0) / 100)); z.contested = !!a[2]; } });
  if (Array.isArray(m.pk)) clientPickups(m.pk);
  if (m.st && !started) enterGame();
  if (!$('lobbyO').hidden) updateLobby();
}

// ================= Shared events =================
const SHOT_AT = new Map();
function renderFx(f){
  if (f.g){ if (Array.isArray(f.o) && Array.isArray(f.v)) launchGrenade(new V(+f.o[0]||0, +f.o[1]||0, +f.o[2]||0), new V(+f.v[0]||0, +f.v[1]||0, +f.v[2]||0), false); return; }
  if (!Array.isArray(f.o) || !Array.isArray(f.e)) return;
  const o = new V(+f.o[0]||0, +f.o[1]||0, +f.o[2]||0);
  const w = (f.w|0) % NW;
  addMuzzleFlash(o);
  if (f.by) SHOT_AT.set(String(f.by), now);
  { const sa = avatars.get(f.by); if (sa) sa.av.kick = 1; }
  if (WEAPONS[w].explosive){
    const e = f.e[0]; if (Array.isArray(e)) launchRocket(o, new V(+e[0]||0, +e[1]||0, +e[2]||0), false);
  } else for (const e of f.e) if (Array.isArray(e)){ const ev = new V(+e[0]||0, +e[1]||0, +e[2]||0); addTracer(o, ev); if (Math.random() < .5) addPuff(ev); }
  playShot(w, o);
  if (f.by !== myId && !WEAPONS[w].explosive){
    const head = new V(me.pos.x, me.pos.y + EYE, me.pos.z);
    if (o.distanceTo(head) > 4) for (const e of f.e){
      if (!Array.isArray(e)) continue;
      const ev = new V(+e[0]||0, +e[1]||0, +e[2]||0), seg = ev.clone().sub(o), L2 = seg.lengthSq();
      if (L2 < 1) continue;
      const t = Math.max(0, Math.min(1, head.clone().sub(o).dot(seg) / L2)), cp = o.clone().addScaledVector(seg, t);
      if (t > .05 && t < .97 && cp.distanceTo(head) < 2.2){ playWhiz(cp); break; }
    }
    const e0 = f.e[0]; if (Array.isArray(e0)){ const ev = new V(+e0[0]||0, +e0[1]||0, +e0[2]||0); if (ev.distanceTo(me.pos) < 25) playImpact(ev); }
  }
}
function addFeed(html, raw){
  const f = $('feed'), d = document.createElement('div');
  if (raw) d.append(...raw); else d.textContent = html;
  f.prepend(d); setTimeout(() => d.remove(), 5000);
  while (f.children.length > 6) f.lastChild.remove();
}
function teamSpan(id){
  const e = ents.get(id), s = document.createElement('span');
  s.className = e ? TEAM_CLS[e.team] : ''; s.textContent = nameOf(id); return s;
}
const STREAKS = {2:['Çifte vuruş','2 seri'], 3:['Üçlü seri','3 seri'], 4:['Dörtlü seri','4 seri'], 5:['Durdurulamaz','5 seri'], 7:['Cephe efsanesi','7 seri'], 10:['Tek kişilik ordu','10 seri']};
function showStreak(n){
  const t = STREAKS[n] || (n > 10 && n % 5 === 0 ? ['Tek kişilik ordu', n + ' seri'] : null); if (!t) return;
  const el = $('streak'); el.querySelector('b').textContent = t[0]; el.querySelector('small').textContent = t[1];
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  if (actx){ const vv = voice(null, {verb:.15, dur:.6}); if (vv){ const t0 = actx.currentTime + .02; tone(vv.out, t0, {f0:660, gain:.2, decay:.18, wave:'triangle'}); tone(vv.out, t0 + .1, {f0:990, gain:.2, decay:.3, wave:'triangle'}); } }
}
function onKill(k, v){
  addFeed(null, [teamSpan(k), document.createTextNode('  ➜  '), teamSpan(v)]);
  if (k === myId && v !== myId){ hitMarker(false, true); killNote(`${nameOf(v)} etkisiz hâle getirildi`); playHit(false, true); buzz([18, 40, 18]); me.streak = (me.streak || 0) + 1; showStreak(me.streak); }
  if (v === myId){ $('deathBy').textContent = `${nameOf(k)} seni vurdu.`; me.deadAt = now; me.streak = 0; }
}
function killNote(text){ const k = $('killNote'); k.textContent = text; k.classList.add('on'); clearTimeout(killNote.t); killNote.t = setTimeout(() => k.classList.remove('on'), 1300); }

// ================= Lobby UI =================
function showLobby(){
  $('lockO').hidden = true; $('pauseO').hidden = true;
  renderLoadout(); renderRoomLog();
  const lo = $('lobbyO'); lo.hidden = false; lo.classList.toggle('guest', !isHost);
  $('hostOnly').hidden = !isHost;
  $('lobbyTitle').textContent = started ? 'Oda' : (isHost ? 'Odan hazır' : 'Odaya bağlandın');
  $('lobbyGo').hidden = !(isHost || started);
  $('lobbyGo').textContent = started ? 'Savaşa dön' : 'Savaşı başlat';
  $('clientWait').textContent = isHost ? 'Kodu arkadaşına gönder, takımları ve botları ayarla.' : 'Maç ayarlarını, botları ve havayı odayı kuran oyuncu belirler.';
  $('lbHint').textContent = !isHost && !started ? 'Odayı kuran oyuncu savaşı başlatınca oyun açılacak.' : started ? 'B tuşu ya da Ayarlar › Oda ve silahlar ile bu ekrana dönebilirsin. T ile takım değiştirirsin.' : '';
  document.querySelectorAll('#lobbyO .hostCtl').forEach(el => el.disabled = !isHost);
  $('goalSel').value = String(goal); $('diffSel').value = String(diff);
  updateLobby();
}
function showTab(name){
  document.querySelectorAll('#lobbyO [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  document.querySelectorAll('#lobbyO [data-pane]').forEach(p => p.classList.toggle('on', p.dataset.pane === name));
}
document.querySelectorAll('#lobbyO [data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));
showTab('room');
function updateLobby(){
  let humans = 0;
  const myTeam = (myEnt() || {team:me.team}).team;
  for (const t of [0,1]){
    const ul = $('list'+t); ul.textContent = '';
    let bots = 0;
    for (const e of ents.values()){
      if (e.team !== t) continue;
      if (e.kind === 'b'){ bots++; continue; }
      humans++;
      const li = document.createElement('li'); if (e.id === myId) li.className = 'me';
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = e.name; li.appendChild(nm);
      const tags = []; if (e.id === myId) tags.push('SEN'); if (e.id === 'h0') tags.push('KURUCU');
      for (const tg of tags){ const s = document.createElement('span'); s.className = 'tag'; s.textContent = tg; li.appendChild(s); }
      if (isHost && e.id !== myId){ const k = document.createElement('button'); k.className = 'kick'; k.textContent = 'AT'; k.title = `${e.name} adlı oyuncuyu odadan çıkar`; k.onclick = () => kickPlayer(e.id); li.appendChild(k); }
      ul.appendChild(li);
    }
    if (bots){ const li = document.createElement('li'); li.className = 'bots'; li.textContent = `+ ${bots} bot asker`; ul.appendChild(li); }
    $('botN'+t).textContent = bots;
    const jb = document.querySelector(`#lobbyO [data-jt="${t}"]`); if (jb) jb.hidden = myTeam === t;
  }
  $('roomCount').textContent = `${humans} oyuncu`;
}
document.querySelectorAll('#lobbyO [data-jt]').forEach(b => b.onclick = () => { requestTeam(+b.dataset.jt); updateLobby(); });
$('openRoomBtn').onclick = () => { $('pauseO').hidden = true; showLobby(); };
document.querySelectorAll('[data-bot]').forEach(b => b.onclick = () => {
  if (isHost) changeBots(+b.dataset.bot, +b.dataset.n);
});
// phones: going into battle also goes full screen and locks landscape, so browser bars stop eating the view
function mobileImmersive(){
  if (!touchOn) return;
  const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) return;
  toggleFullscreen();
}
$('lobbyGo').onclick = () => {
  mobileImmersive();
  if (!started && isHost){ hostStart(); return; }
  if (started){ $('lobbyO').hidden = true; requestLock(); }
};

// ---- first match: a short, skippable walkthrough of the controls (shown once per device)
const TUT = {on:false, i:0, t:0, base:null, done:false, ok:0};
function tutSteps(){
  return touchOn ? [
    {t:'Soldaki <em>çubuğu</em> sürükleyerek yürü', ok:() => TUT.base && me.pos.distanceTo(TUT.base.p) > 2.5},
    {t:'Ekranın <em>sağ tarafını</em> kaydırarak etrafına bak', ok:() => TUT.base && Math.abs(me.yaw - TUT.base.y) > 1},
    {t:'<em>NİŞAN</em> düğmesiyle nişan al', ok:() => me.zoom},
    {t:'<em>ATEŞ</em> düğmesine basarak ateş et', ok:() => TUT.base && me.lastShotT > TUT.base.s},
    {t:'<em>Bomba</em> ve <em>ilk yardım</em> sağ sütunda. Bayrakları ele geçir, iyi savaşlar!', wait:4.5},
  ] : [
    {t:'<em>W A S D</em> ile yürü, <em>Shift</em> ile koş', ok:() => TUT.base && me.pos.distanceTo(TUT.base.p) > 2.5},
    {t:'<em>Fareyle</em> etrafına bak', ok:() => TUT.base && Math.abs(me.yaw - TUT.base.y) > 1},
    {t:'<em>Sağ tık</em> ile nişan al', ok:() => me.zoom},
    {t:'<em>Sol tık</em> ile ateş et, <em>R</em> ile şarjör değiştir', ok:() => TUT.base && me.lastShotT > TUT.base.s},
    {t:'<em>G</em> bomba, <em>H</em> ilk yardım. Bayrakları ele geçir, iyi savaşlar!', wait:4.5},
  ];
}
function tutStart(){
  let seen = false; try { seen = localStorage.getItem('cephe-tut1') === '1'; } catch(e){}
  if (seen || TUT.done) return;
  TUT.on = true; TUT.i = 0; TUT.t = 0; TUT.base = null; tutShow();
}
function tutEnd(){ TUT.on = false; TUT.done = true; $('tutO').hidden = true; try { localStorage.setItem('cephe-tut1', '1'); } catch(e){} }
function tutShow(){ const S = tutSteps(), st = S[TUT.i]; $('tutT').innerHTML = st.t; $('tutN').textContent = `${TUT.i + 1}/${S.length}`; $('tutP').style.width = '0%'; $('tutO').classList.remove('ok'); TUT.ok = 0; }
function tutStep(dt){
  if (!TUT.on) return;
  const el = $('tutO'), hide = overlayOpen() || !isAlive();
  el.hidden = hide; if (hide) return;
  if (!TUT.base) TUT.base = {p:me.pos.clone(), y:me.yaw, s:me.lastShotT || 0};
  const S = tutSteps(), st = S[TUT.i]; TUT.t += dt;
  if (TUT.ok > 0){ TUT.ok -= dt; if (TUT.ok <= 0) next(); return; }
  const lim = st.wait || 14;
  $('tutP').style.width = Math.min(100, TUT.t / lim * 100) + '%';
  if ((st.ok && st.ok()) || TUT.t >= lim){ el.classList.add('ok'); $('tutP').style.width = '100%'; TUT.ok = st.ok && TUT.t < lim ? .55 : .01; if (st.ok && TUT.t < lim) playSwitch(); }
  function next(){ TUT.i++; TUT.t = 0; TUT.base = null; if (TUT.i >= S.length) tutEnd(); else tutShow(); }
}
$('tutSkip').addEventListener('click', e => { e.stopPropagation(); tutEnd(); });
$('tutSkip').addEventListener('touchstart', e => { e.stopPropagation(); }, {passive:true});
function enterGame(){
  started = true; initAudio(); applyLoadout(); stage.classList.add('playing'); setTimeout(tutStart, 1200);
  if (touchOn && !(document.fullscreenElement || document.webkitFullscreenElement)) toggleFullscreen();
  $('lobbyO').hidden = true; $('joinO').hidden = true; $('menu').hidden = true;
  requestLock(); updateNet();
}
function updateNet(){
  const n = $('net');
  if (isHost) n.textContent = (roomCode ? `Oda kodu: ${roomCode}` : 'Oda') + ` · ${conns.size + 1} oyuncu`;
  else if (hostConn) n.textContent = 'Odaya bağlı';
  else n.textContent = '';
}

// ================= Input =================
let keys = {}, mouseDown = false, rightDown = false, locked = false, fallback = false;
// Pointer lock: browsers only grant it right after a click or key press, and Chrome refuses a re-lock for ~1 s
// after Esc. A refused request therefore just shows "click to play"; drag-to-look is only used when the
// browser keeps refusing even with real clicks (for example inside a frame that does not allow pointer lock).
let lockFails = 0, lockAsked = 0, lastUnlock = -1e9;
const hasGesture = () => { try { return !navigator.userActivation || navigator.userActivation.isActive; } catch(e){ return true; } };
const overlayOpen = () => !$('lobbyO').hidden || !$('lostO').hidden || !$('arsO').hidden || !$('setO').hidden || !$('helpO').hidden || !$('teamO').hidden;
function wantsLock(){ return started && !touchOn && !fallback && !locked && !overlayOpen() && $('pauseO').hidden; }
function syncLockPrompt(){ $('lockO').hidden = !wantsLock(); }
function lockRefused(withGesture){
  // refusals during Chrome's re-lock cooldown after Esc are expected and do not count
  if (withGesture && performance.now() - lastUnlock > 1500 && ++lockFails >= 3) enableFallback();
  syncLockPrompt();
}
function requestLock(){
  if (touchOn){ $('pauseO').hidden = true; return; }
  $('pauseO').hidden = true;
  if (fallback || document.pointerLockElement === cv){ syncLockPrompt(); return; }
  const gesture = hasGesture(); lockAsked = performance.now();
  if (!gesture){ syncLockPrompt(); return; }
  const plain = () => { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => lockRefused(true)); } catch(e){ lockRefused(true); } };
  try {
    // raw mouse input (no OS acceleration) where the browser supports it
    const r = cv.requestPointerLock({unadjustedMovement:true});
    if (r && r.catch) r.catch(err => { if (err && err.name === 'NotSupportedError') plain(); else lockRefused(true); });
  } catch(e){ plain(); }
  syncLockPrompt();
}
function enableFallback(){
  if (fallback) return;
  fallback = true; $('pauseO').hidden = true; $('lockO').hidden = true;
  const h = $('hint'); h.innerHTML = 'Tarayıcı fareyi kilitlemiyor: bakmak için <b>sağ tuşu basılı tutup sürükle</b> ya da ok tuşlarını kullan. Dürbün: <b>Z</b>'; h.style.display = 'block';
}
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === cv;
  if (locked){ lockFails = 0; if (fallback){ fallback = false; $('hint').style.display = 'none'; } }
  else lastUnlock = performance.now();
  // losing the lock mid-game (Esc) opens the settings screen; everything else shows "click to play"
  $('pauseO').hidden = locked || fallback || !started || touchOn || overlayOpen();
  syncLockPrompt();
});
document.addEventListener('pointerlockerror', () => lockRefused(performance.now() - lockAsked < 1000 && hasGesture()));
$('lockO').addEventListener('click', requestLock);
$('resumeBtn').addEventListener('click', requestLock);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (!started) return;
  if (!locked && !fallback && !touchOn){ requestLock(); return; }
  if (!locked && fallback && !touchOn && e.button === 0){ try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch(_){} }
  if (e.button === 0) mouseDown = true;
  if (e.button === 2){ rightDown = true; if (!fallback) me.zoom = true; }
});
addEventListener('mouseup', e => {
  if (e.button === 0){ mouseDown = false; me.latched = false; }
  if (e.button === 2){ rightDown = false; if (!fallback) me.zoom = false; }
});
addEventListener('mousemove', e => {
  if (!started) return;
  if (locked || (fallback && rightDown)){
    const s = (me.zoom ? (WEAPONS[me.weapon].scope ? .0006 : .0022 * WEAPONS[me.weapon].adsFov / 75) * adsSens : .0022) * sens;
    me.yaw -= e.movementX * s; me.pitch -= e.movementY * s;
    if (e.movementY > 0) me.recovP = Math.max(0, me.recovP - e.movementY * s);
    me.swayX = Math.max(-200, Math.min(200, me.swayX + e.movementX)); me.swayY = Math.max(-200, Math.min(200, me.swayY + e.movementY));
    me.pitch = Math.max(-1.45, Math.min(1.45, me.pitch));
  }
});
cv.addEventListener('wheel', e => { if (started){ e.preventDefault(); const n = me.loadout.length, k = Math.max(0, me.loadout.indexOf(me.weapon)); selectSlot((k + (e.deltaY > 0 ? 1 : n - 1)) % n); } }, {passive:false});

// ---- rebindable keys: every physical key is translated to the default key of its action,
// so the rest of the game keeps reading the default codes (KeyW, KeyC, …)
const BIND_DEF = [
  ['Hareket', [['fwd','İleri','KeyW'], ['back','Geri','KeyS'], ['left','Sola','KeyA'], ['right','Sağa','KeyD'], ['jump','Zıpla','Space'], ['sprint','Koş','ShiftLeft'], ['slide','Kay (koşarken)','KeyC']]],
  ['Savaş', [['reload','Şarjör değiştir','KeyR'], ['zoom','Nişan / dürbün aç-kapat','KeyZ'], ['w1','1. silah','Digit1'], ['w2','2. silah','Digit2'], ['w3','3. silah','Digit3'], ['torch','Gece feneri','KeyF'], ['gren','El bombası at','KeyG'], ['med','İlk yardım çantası','KeyH']]],
  ['Oyun', [['lobby','Oda, silah ve bot menüsü','KeyB'], ['team','Takım değiştir','KeyT'], ['mute','Sesi kapat / aç','KeyM']]],
];
const BIND_ACTS = BIND_DEF.flatMap(([, list]) => list);
const DEFAULT_KEY = Object.fromEntries(BIND_ACTS.map(([a, , k]) => [a, k]));
let BINDS = Object.assign({}, DEFAULT_KEY);
try { const sv = JSON.parse(localStorage.getItem('cephe-keys') || 'null'); if (sv) for (const a in sv) if (a in DEFAULT_KEY && typeof sv[a] === 'string') BINDS[a] = sv[a]; } catch(e){}
let BIND_MAP = null;
function rebuildBindMap(){
  BIND_MAP = new Map();
  for (const a in BINDS) BIND_MAP.set(BINDS[a], DEFAULT_KEY[a]);
  if (BINDS.sprint === 'ShiftLeft' && !BIND_MAP.has('ShiftRight')) BIND_MAP.set('ShiftRight', 'ShiftLeft');
}
rebuildBindMap();
const FREED = () => new Set(Object.values(DEFAULT_KEY).filter(k => !Object.values(BINDS).includes(k)));
function vkey(code){
  if (BIND_MAP.has(code)) return BIND_MAP.get(code);
  if (code === 'ShiftRight' && BINDS.sprint !== 'ShiftLeft') return null;
  if (FREED().has(code)) return null;     // a default key that was moved to another action
  return code;
}
const KEY_NAMES = {Space:'Boşluk', ShiftLeft:'Sol Shift', ShiftRight:'Sağ Shift', ControlLeft:'Sol Ctrl', ControlRight:'Sağ Ctrl', AltLeft:'Alt', AltRight:'Alt Gr', Tab:'Tab', CapsLock:'Caps Lock',
  Enter:'Enter', Backspace:'Geri sil', ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→', Backquote:'"', Minus:'-', Equal:'=', BracketLeft:'Ğ', BracketRight:'Ü', Semicolon:'Ş', Quote:'İ', Comma:'Ö', Period:'Ç', Slash:'.', Backslash:',', IntlBackslash:'<'};
const keyName = c => KEY_NAMES[c] || (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') ? 'Num ' + c.slice(6) : c);
const keyLabel = a => keyName(BINDS[a]);
let bindWait = null;
function renderBinds(){
  const g = $('bindGrid'); if (!g) return;
  g.innerHTML = BIND_DEF.map(([title, list]) => `<div class="bindCol"><h4>${title}</h4>` + list.map(([a, label]) =>
    `<div class="bindRow"><span>${label}</span><button class="keyBtn${BINDS[a] !== DEFAULT_KEY[a] ? ' changed' : ''}${bindWait === a ? ' wait' : ''}" data-act="${a}">${bindWait === a ? 'Bir tuşa bas…' : keyLabel(a)}</button></div>`).join('') +
    (title === 'Oyun' ? `<h4>Fare</h4><div class="bindRow"><span>Ateş</span><b class="fixed">Sol tık</b></div><div class="bindRow"><span>Nişan al (basılı)</span><b class="fixed">Sağ tık</b></div><div class="bindRow"><span>Silah değiştir</span><b class="fixed">Tekerlek</b></div><div class="bindRow"><span>Ayarlar / duraklat</span><b class="fixed">Esc</b></div>` : '') + `</div>`).join('');
  g.querySelectorAll('.keyBtn').forEach(b => b.onclick = () => { bindWait = bindWait === b.dataset.act ? null : b.dataset.act; renderBinds(); });
  const bh = $('bHint'); if (bh) bh.innerHTML = `<kbd>${keyLabel('lobby')}</kbd> silahlar ve botlar`;
}
function setBind(a, code){
  const other = Object.keys(BINDS).find(x => x !== a && BINDS[x] === code);
  if (other) BINDS[other] = BINDS[a];       // swap, so no action is ever left without a key
  BINDS[a] = code; rebuildBindMap();
  try { localStorage.setItem('cephe-keys', JSON.stringify(BINDS)); } catch(e){}
  const n = $('bindNote'); if (n) n.textContent = other ? `${keyName(code)} artık "${BIND_ACTS.find(x => x[0] === a)[1]}". Eski tuşu "${BIND_ACTS.find(x => x[0] === other)[1]}" eylemine geçti.` : `"${BIND_ACTS.find(x => x[0] === a)[1]}" için yeni tuş: ${keyName(code)}.`;
}
addEventListener('keydown', e => {
  if (!bindWait) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.code !== 'Escape' && e.code) setBind(bindWait, e.code);
  bindWait = null; renderBinds();
}, true);
$('bindReset').onclick = () => { BINDS = Object.assign({}, DEFAULT_KEY); rebuildBindMap(); try { localStorage.removeItem('cephe-keys'); } catch(e){} bindWait = null; renderBinds(); $('bindNote').textContent = 'Tüm tuşlar varsayılana döndü.'; };
renderBinds();
const BLOCK = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab']);
addEventListener('keydown', ev => {
  const tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (!$('arsO').hidden){ if (ev.key === 'Escape' || ev.code === 'KeyB'){ ev.preventDefault(); closeArsenal(); } return; }
  if (!$('setO').hidden){ if (ev.key === 'Escape'){ ev.preventDefault(); closeSettings(); } return; }
  if (!$('helpO').hidden){ if (ev.key === 'Escape'){ ev.preventDefault(); closeHelp(); } return; }
  if (!$('teamO').hidden){ if (ev.key === 'Escape'){ ev.preventDefault(); $('teamBack').click(); } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight'){ const t = ev.key === 'ArrowLeft' ? 0 : 1; const src = document.querySelector(`.teamPick .team[data-team="${t}"]`); if (src) src.click(); tmPaint(); const sd = document.querySelector(`#teamO .tmSide[data-team="${t}"]`); if (sd) sd.focus({preventScroll:true, focusVisible:false}); } else if (ev.key === 'Enter'){ ev.preventDefault(); tmChoose(me.team === 1 ? 1 : 0); } return; }
  if (!started){ if (ev.key === 'Escape' && !$('menu').hidden) showPanel('home'); return; }
  const vc = vkey(ev.code); if (vc === null) return;
  const e = {code:vc, key:ev.key, preventDefault:() => ev.preventDefault()};
  if (e.code === 'KeyM'){ setMuted(!muted); return; }
  if (e.code === 'KeyT' && !overlayOpen()){ requestTeam(1 - me.team); return; }
  if (e.code === 'KeyB'){
    if ($('lobbyO').hidden){ showLobby(); keys = {}; mouseDown = false; if (document.pointerLockElement) document.exitPointerLock(); }
    else { $('lobbyO').hidden = true; requestLock(); }
    syncLockPrompt();
    return;
  }
  if (overlayOpen()) return;
  if (BLOCK.has(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'KeyR') startReload();
  if (/^Digit[1-3]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
  if (e.code === 'KeyC') tryStartSlide();
  if (e.code === 'KeyF'){ torchOn = !torchOn; if (actx){ const vv = voice(null, {verb:0, dur:.05}); if (vv) click(vv.out, actx.currentTime + .01, .25, 3000); } }
  if (e.code === 'KeyZ') me.zoom = !me.zoom;
  if (e.code === 'KeyG') throwGrenade();
  if (e.code === 'KeyH') useMedkit();
});
addEventListener('keyup', e => { const vc = vkey(e.code); if (vc) keys[vc] = false; });
addEventListener('blur', () => { keys = {}; mouseDown = false; rightDown = false; });
// ================= Touch controls (mobile) =================
// Every touch control writes into the same input state the keyboard and mouse use
// (keys, mouseDown, me.yaw/pitch, me.zoom), so gameplay code is unchanged.
const touchUI = $('touchUI'), stickBase = $('stickBase'), stickKnob = $('stickKnob');
const T = {stick:null, look:null, fire:null, fire2:null, jump:null, ox:0, oy:0, lx:0, ly:0, fx:0, fy:0, ax:0, ay:0};
const STICK_R = 48;
function setTouchMode(on){
  touchOn = !!on; document.body.classList.toggle('touch', touchOn);
  try { localStorage.setItem('cephe-touch', touchOn ? '1' : '0'); } catch(e){}
  if (touchOn){ $('hint').style.display = 'none'; if (document.pointerLockElement) document.exitPointerLock(); }
  if (typeof syncLockPrompt === 'function') syncLockPrompt();
  document.querySelectorAll('[data-touchset]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.touchset === '1') === touchOn));
}

// ---- touch aim assist: the look slows down over an enemy and the sight is gently pulled onto them;
// optional auto-fire shoots once the sight sits on a visible enemy
const AIM = {slow:0, tgt:null, ex:0, ey:0, tight:false, losT:0, los:false, losId:null};
const _ac = new V(), _ap = new V(), _ad = new V(), _ar = new THREE.Raycaster(), _am = new THREE.Matrix4();
function updateAimAssist(dt){
  AIM.tgt = null; AIM.tight = false;
  if (!touchOn || !isAlive() || overlayOpen() || (!aimAssist && !autoFire)){ AIM.slow = 0; return; }
  camera.updateMatrixWorld(); camera.getWorldPosition(_ac); _am.copy(camera.matrixWorld).invert();
  const W = WEAPONS[me.weapon], zoomK = me.zoom ? (W.scope ? .3 : Math.max(.45, (W.adsFov || 60) / 75)) : 1;
  const cone = .11 * zoomK;                       // radians around the crosshair that count as "on target"
  let best = null, bestS = 1e9;
  for (const [id, e] of ents){
    if (id === myId || !e.alive || e.team === me.team || e.inv) continue;
    _ap.set(e.pos.x, e.pos.y + 1.15, e.pos.z);
    const dist = _ap.distanceTo(_ac); if (dist > 70 || dist < .5) continue;
    _ad.copy(_ap).applyMatrix4(_am); if (_ad.z > -.3) continue;     // behind the camera
    // the body is a column from the knees to the top of the head: aiming anywhere inside it counts as on target
    const ex = Math.atan2(_ad.x, -_ad.z), yTop = Math.atan2(_ad.y + .5, -_ad.z), yBot = Math.atan2(_ad.y - .8, -_ad.z);
    const ey = yBot > 0 ? yBot : yTop < 0 ? yTop : 0, body = Math.atan2(.3, dist);
    const exo = Math.max(0, Math.abs(ex) - body * .5) * Math.sign(ex), err = Math.hypot(exo, ey);
    const r = Math.max(cone, body * 1.6);                           // a body's angular size counts too up close
    if (err > r) continue;
    const sc = err / r + dist * .004;
    if (sc < bestS){ bestS = sc; best = {id, ex, ey, exo, err, dist, body}; }
  }
  if (best){
    // line of sight, rechecked a few times a second
    if (AIM.losId !== best.id || now > AIM.losT){
      AIM.losId = best.id; AIM.losT = now + 120;
      const e = ents.get(best.id); _ap.set(e.pos.x, e.pos.y + 1.15, e.pos.z);
      _ad.subVectors(_ap, _ac); const L = _ad.length(); _ad.normalize();
      _ar.set(_ac, _ad); _ar.far = L - .4; AIM.los = _ar.intersectObjects(solidMeshes, false).length === 0;
    }
    if (!AIM.los) best = null;
  }
  AIM.tgt = best;
  const want = best && aimAssist ? Math.min(.55, .62 - best.err / (cone * 4)) : 0;
  AIM.slow += (Math.max(0, want) - AIM.slow) * Math.min(1, dt * 12);
  if (!best) return;
  // magnetism only while the player is actively aiming, moving or shooting, never snapping
  const active = T.look !== null || T.fire !== null || me.zoom || mouseDown || Math.hypot(T.ax || 0, T.ay || 0) > .2;
  if (aimAssist && active){
    const k = Math.min(1, dt * (me.zoom ? 3.2 : 2.2));
    me.yaw -= (best.err < 1e-4 ? best.ex * .35 : best.exo + Math.sign(best.ex) * best.body * .3) * k * .6;
    me.pitch = Math.max(-1.45, Math.min(1.45, me.pitch + best.ey * k * .45));
  }
  AIM.tight = Math.abs(best.ex) < best.body * .85 && Math.abs(best.ey) < .004;
}
function autoFireStep(moving){
  if (!autoFire || !touchOn || mouseDown || !AIM.tight || overlayOpen()) return;
  const W = WEAPONS[me.weapon]; if (W.explosive || (W.scope && !me.zoom)) return;
  if (!W.auto) me.latched = false;
  tryFire(moving); if (!W.auto) me.latched = false;
}
function lookBy(dx, dy){
  const W = WEAPONS[me.weapon];
  const s = (me.zoom ? (W.scope ? .0006 : .0022 * W.adsFov / 75) * adsSens : .0022) * sens * 2.3 * (1 - AIM.slow);
  me.yaw -= dx * s; me.pitch = Math.max(-1.45, Math.min(1.45, me.pitch - dy * s));
  if (dy > 0) me.recovP = Math.max(0, me.recovP - dy * s);
  me.swayX = Math.max(-200, Math.min(200, me.swayX + dx)); me.swayY = Math.max(-200, Math.min(200, me.swayY + dy));
}
function stickTo(x, y){
  const sc = stickScale(), R = STICK_R * sc;
  let dx = x - T.ox, dy = y - T.oy; const L = Math.hypot(dx, dy), raw = L / R;
  if (L > R){ dx *= R / L; dy *= R / L; }
  stickKnob.style.transform = `translate(${(dx / sc).toFixed(1)}px,${(dy / sc).toFixed(1)}px)`;
  const vx = dx / R, vy = dy / R, D = .32;
  T.ax = vx; T.ay = vy;
  keys.KeyW = vy < -D; keys.KeyS = vy > D; keys.KeyA = vx < -D; keys.KeyD = vx > D;
  T.sx = x; T.sy = y;
  const run = (raw > 1.2 && vy < -.6) || (T.sprint && vy < -.35);
  keys.ShiftLeft = run; stickBase.classList.toggle('run', run);
}
function releaseStick(){
  T.stick = null; T.ax = T.ay = 0; keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = keys.ShiftLeft = false;
  stickKnob.style.transform = ''; stickBase.style.left = stickBase.style.top = stickBase.style.bottom = ''; stickBase.classList.remove('run', 'on'); placeTouch('stickBase');
}
function releaseFire(){ if (T.fire === null && T.fire2 === null){ mouseDown = false; me.latched = false; } }
function resetTouches(){
  releaseStick(); T.look = T.fire = T.fire2 = T.jump = null;
  keys = {}; mouseDown = false; me.latched = false;
  touchUI.querySelectorAll('.on').forEach(b => b.classList.remove('on'));
}
function toggleFullscreen(){
  const d = document, el = d.documentElement;
  try {
    if (d.fullscreenElement || d.webkitFullscreenElement){ (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, {navigationUI:'hide'});
    const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch(e){} };
    if (r && r.then) r.then(lock).catch(() => {}); else lock();
  } catch(e){}
}

// sideways page (phone held upright): convert screen coordinates into the game's landscape coordinates
const ROTD = () => document.body.classList.contains('rot');
const VW = () => (window.visualViewport ? visualViewport.width : innerWidth);
function ltouch(t){ return ROTD() ? {identifier:t.identifier, target:t.target, clientX:t.clientY, clientY:VW() - t.clientX} : t; }
function lrect(el){ const r = el.getBoundingClientRect(); if (!ROTD()) return r; const w = VW(); return {left:r.top, top:w - r.right, width:r.height, height:r.width, right:r.bottom, bottom:w - r.left}; }
function lpt(x, y){ return ROTD() ? [y, VW() - x] : [x, y]; }
function tapAction(act, t, btn){
  if (act === 'aim'){ if (isAlive()) me.zoom = !me.zoom; }
  else if (act === 'slide') tryStartSlide();
  else if (act === 'reload') startReload();
  else if (act === 'swap'){ const n = me.loadout.length, k = Math.max(0, me.loadout.indexOf(me.weapon)); let d = 1; if (t && btn){ const r = lrect(btn); if (t.clientX < r.left + r.width * .4) d = n - 1; } selectSlot((k + d) % n); }
  else if (act === 'gren') throwGrenade();
  else if (act === 'med') useMedkit();
  else if (act === 'sprint'){ T.sprint = !T.sprint; $('tSprint').setAttribute('aria-pressed', T.sprint); if (T.stick !== null && T.sx !== undefined) stickTo(T.sx, T.sy); }
  else if (act === 'menu'){ resetTouches(); showLobby(); }
  else if (act === 'pause'){ resetTouches(); $('pauseO').hidden = false; }
  else if (act === 'torch'){ torchOn = !torchOn; if (actx){ const vv = voice(null, {verb:0, dur:.05}); if (vv) click(vv.out, actx.currentTime + .01, .25, 3000); } }
  else if (act === 'full') toggleFullscreen();
}
let tIdleT = 0;
function touchAwake(){ document.body.classList.remove('tIdle'); clearTimeout(tIdleT); tIdleT = setTimeout(() => document.body.classList.add('tIdle'), 2600); }
touchUI.addEventListener('touchstart', e => {
  e.preventDefault(); initAudio(); touchAwake();
  if (tEdit || !started || overlayOpen()) return;
  const r = lrect(touchUI);
  for (const t0 of e.changedTouches){
    const t = ltouch(t0);
    const btn = t.target && t.target.closest ? t.target.closest('[data-t]') : null, act = btn ? btn.dataset.t : null;
    if (act === 'fire'){ if (T.fire === null){ T.fire = t.identifier; T.fx = t.clientX; T.fy = t.clientY; mouseDown = true; btn.classList.add('on'); } }
    else if (act === 'fire2'){ if (T.fire2 === null){ T.fire2 = t.identifier; mouseDown = true; btn.classList.add('on'); } }
    else if (act === 'jump'){ T.jump = t.identifier; keys.Space = true; btn.classList.add('on'); }
    else if (act){ btn.classList.add('on'); setTimeout(() => btn.classList.remove('on'), 140); tapAction(act, t, btn); }
    else if (TLAYOUT.stickBase && TLAYOUT.stickBase.x > .5 ? t.clientX - r.left > r.width * .58 : t.clientX - r.left < r.width * .42){
      if (T.stick === null){
        T.stick = t.identifier; T.ox = t.clientX; T.oy = t.clientY;
        if (stickBase.dataset.custom){ stickBase.style.left = (t.clientX - r.left) + 'px'; stickBase.style.top = (t.clientY - r.top) + 'px'; }
        else { const hw = stickBase.offsetWidth / 2 || 52; stickBase.style.left = (t.clientX - r.left - hw) + 'px'; stickBase.style.top = (t.clientY - r.top - hw) + 'px'; stickBase.style.bottom = 'auto'; }
        stickBase.classList.add('on');
      }
    } else if (T.look === null){ T.look = t.identifier; T.lx = t.clientX; T.ly = t.clientY; }
  }
}, {passive:false});
touchUI.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t0 of e.changedTouches){
    const t = ltouch(t0);
    const id = t.identifier;
    if (id === T.stick) stickTo(t.clientX, t.clientY);
    else if (id === T.look){ lookBy(t.clientX - T.lx, t.clientY - T.ly); T.lx = t.clientX; T.ly = t.clientY; }
    else if (id === T.fire){ lookBy(t.clientX - T.fx, t.clientY - T.fy); T.fx = t.clientX; T.fy = t.clientY; }
  }
}, {passive:false});
function touchEnd(e){
  e.preventDefault();
  for (const t of e.changedTouches){
    const id = t.identifier;
    if (id === T.stick) releaseStick();
    if (id === T.look) T.look = null;
    if (id === T.fire){ T.fire = null; $('tFire').classList.remove('on'); releaseFire(); }
    if (id === T.fire2){ T.fire2 = null; $('tFire2').classList.remove('on'); releaseFire(); }
    if (id === T.jump){ T.jump = null; keys.Space = false; $('tJump').classList.remove('on'); }
  }
}
touchUI.addEventListener('touchend', touchEnd, {passive:false});
touchUI.addEventListener('touchcancel', touchEnd, {passive:false});
document.addEventListener('gesturestart', e => e.preventDefault());
addEventListener('blur', () => { if (touchOn) resetTouches(); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !touchOn) return;
  resetTouches();
  if (started && $('lobbyO').hidden && $('pauseO')) $('pauseO').hidden = false;
});
const _tui = {};
function updateTouchUI(){
  const sw = WEAPONS[me.weapon].short + ' ' + (Math.max(0, me.loadout.indexOf(me.weapon)) + 1) + '/' + me.loadout.length;
  if (_tui.sw !== sw){ _tui.sw = sw; $('tSwapTxt').textContent = sw; }
  const z = !!me.zoom; if (_tui.z !== z){ _tui.z = z; $('tAim').setAttribute('aria-pressed', z); }
  const night = !!ATMOS[atmos].night; if (_tui.n !== night){ _tui.n = night; $('tTorch').hidden = !night; }
  const ta = torchOn; if (_tui.t !== ta){ _tui.t = ta; $('tTorch').setAttribute('aria-pressed', ta); }
  { const gm = me.gren + '|' + me.med; if (_tui.gm !== gm){ _tui.gm = gm; $('tGrenN').textContent = me.gren; $('tMedN').textContent = me.med; $('tGren').classList.toggle('empty', me.gren <= 0); $('tMed').classList.toggle('empty', me.med <= 0); } }
  { const W = WEAPONS[me.weapon], am = me.ammo[me.weapon] + '|' + me.res[me.weapon];
    if (_tui.am !== am){ _tui.am = am; $('tAmmo').innerHTML = `${me.ammo[me.weapon]}<small> / ${me.res[me.weapon]}</small>`; $('tSwap').classList.toggle('low', me.ammo[me.weapon] <= Math.ceil(W.mag * .25)); }
    const sil = WEAPON_SIL[me.weapon], wk = me.weapon + '|' + !!sil;
    if (_tui.wk !== wk){ _tui.wk = wk; const im = $('tWepImg'); if (sil){ im.src = sil; im.hidden = false; } else im.hidden = true; $('tSwap').classList.toggle('noimg', !sil); }
    const rl = me.reloading && isAlive() ? Math.min(1, Math.max(0, 1 - (me.reloadEnd - now) / W.reload)) : 0, rk = Math.round(rl * 50);
    if (_tui.rl !== rk){ _tui.rl = rk; $('tSwap').style.setProperty('--rl', (rk / 50).toFixed(2)); } }
}
document.querySelectorAll('[data-touchset]').forEach(b => b.onclick = () => setTouchMode(b.dataset.touchset === '1'));
setTouchMode(touchOn);
// ---- movable / resizable touch controls
const TL_IDS = ['stickBase', 'tFire', 'tAim', 'tGren', 'tMed', 'tJump', 'tSlide', 'tReload', 'tSprint', 'tSwap', 'tSet', 'tTorch'];
const TL_NAMES = {stickBase:'Joystick', tFire:'Ateş', tFire2:'Sol ateş', tAim:'Nişan', tJump:'Zıpla', tSlide:'Kay', tReload:'Şarjör', tSwap:'Silah kartı', tSet:'Duraklat', tTorch:'Fener', tGren:'El bombası', tMed:'İlk yardım', tSprint:'Koş'};
let TLAYOUT = {}, TOPAC = .9, tEdit = null;
try { TLAYOUT = JSON.parse(localStorage.getItem('cephe-tlayout4') || '{}') || {}; const o = localStorage.getItem('cephe-topac'); if (o !== null) TOPAC = Math.max(.35, Math.min(1, +o)); } catch(e){}
const stickScale = () => (TLAYOUT.stickBase && TLAYOUT.stickBase.s) || 1;
function placeTouch(id){
  const el = $(id), L = TLAYOUT[id]; if (!el) return;
  if (L){ el.style.left = (L.x * 100) + '%'; el.style.top = (L.y * 100) + '%'; el.style.right = el.style.bottom = 'auto'; el.style.transform = `translate(-50%,-50%) scale(${L.s || 1})`; el.dataset.custom = '1'; }
  else { el.style.left = el.style.top = el.style.right = el.style.bottom = el.style.transform = ''; delete el.dataset.custom; }
}
function applyTouchLayout(){ TL_IDS.forEach(placeTouch); touchUI.style.setProperty('--tOp', TOPAC); const oi = $('tOpIn'); if (oi) oi.value = Math.round(TOPAC * 100); }
function saveTouchLayout(){ try { localStorage.setItem('cephe-tlayout4', JSON.stringify(TLAYOUT)); localStorage.setItem('cephe-topac', String(TOPAC)); } catch(e){} }
function tlCenter(id){ const r = lrect($(id)), sr = lrect(touchUI); return {x:(r.left + r.width / 2 - sr.left) / sr.width, y:(r.top + r.height / 2 - sr.top) / sr.height}; }
function tlSelect(id){
  if (!tEdit) return; tEdit.sel = id;
  TL_IDS.forEach(i => $(i) && $(i).classList.toggle('tlSel', i === id));
  $('tEditSel').textContent = id ? `${TL_NAMES[id]} · boyut ${Math.round(((TLAYOUT[id] && TLAYOUT[id].s) || 1) * 100)}%` : 'Bir tuşa dokun ve sürükle';
}
let tEditFromMenu = false;
function openTouchEditor(){
  resetTouches(); tEdit = {sel:null, drag:null};
  tEditFromMenu = !$('menu').hidden;
  $('pauseO').hidden = true; if (tEditFromMenu) $('menu').hidden = true;
  document.body.classList.add('tEditing'); $('tEditBar').hidden = false; tlSelect(null);
}
function closeTouchEditor(){
  saveTouchLayout(); tEdit = null; document.body.classList.remove('tEditing'); $('tEditBar').hidden = true;
  TL_IDS.forEach(i => $(i) && $(i).classList.remove('tlSel'));
  if (tEditFromMenu) $('menu').hidden = false; else if (started) $('pauseO').hidden = false;
  if (setReturn){ setReturn = false; $('setO').hidden = false; pxState(); }
}
touchUI.addEventListener('pointerdown', e => {
  if (!tEdit) return;
  const el = e.target.closest ? e.target.closest(TL_IDS.map(i => '#' + i).join(',')) : null;
  if (!el){ tlSelect(null); return; }
  e.preventDefault(); tlSelect(el.id);
  const c = tlCenter(el.id), sr = lrect(touchUI), [ex, ey] = lpt(e.clientX, e.clientY);
  tEdit.drag = {id:el.id, pid:e.pointerId, dx:ex - (sr.left + c.x * sr.width), dy:ey - (sr.top + c.y * sr.height)};
  try { touchUI.setPointerCapture(e.pointerId); } catch(_){}
});
touchUI.addEventListener('pointermove', e => {
  if (!tEdit || !tEdit.drag || tEdit.drag.pid !== e.pointerId) return;
  const d = tEdit.drag, sr = lrect(touchUI), [ex, ey] = lpt(e.clientX, e.clientY);
  const x = Math.max(.03, Math.min(.97, (ex - d.dx - sr.left) / sr.width)), y = Math.max(.05, Math.min(.95, (ey - d.dy - sr.top) / sr.height));
  TLAYOUT[d.id] = {x, y, s:(TLAYOUT[d.id] && TLAYOUT[d.id].s) || 1}; placeTouch(d.id);
});
const endDrag = e => { if (tEdit && tEdit.drag && tEdit.drag.pid === e.pointerId) tEdit.drag = null; };
touchUI.addEventListener('pointerup', endDrag); touchUI.addEventListener('pointercancel', endDrag);
function tlResize(k){
  if (!tEdit || !tEdit.sel) return;
  const id = tEdit.sel, cur = TLAYOUT[id] || Object.assign(tlCenter(id), {s:1});
  cur.s = Math.max(.6, Math.min(1.8, +(((cur.s || 1) + k).toFixed(2)))); TLAYOUT[id] = cur; placeTouch(id); tlSelect(id);
}
$('tSmaller').onclick = () => tlResize(-.1); $('tBigger').onclick = () => tlResize(.1);
$('tReset').onclick = () => { TLAYOUT = {}; TOPAC = .9; applyTouchLayout(); tlSelect(null); };
$('tDone').onclick = closeTouchEditor;
$('tOpIn').oninput = e => { TOPAC = +e.target.value / 100; touchUI.style.setProperty('--tOp', TOPAC); };
document.querySelectorAll('.tEditOpen').forEach(b => b.onclick = openTouchEditor);
$('fullBtn').onclick = () => toggleFullscreen();
applyTouchLayout();



function setView(i){
  views.forEach((v,j) => v.visible = j === i); muzzle.position.set(0,0,muzzles[i]);
  flash.position.copy(muzzle.position); flashSprite.position.copy(muzzle.position); flashPetals.position.copy(muzzle.position);
}
function selectWeapon(i){
  if (i === me.weapon) return;
  me.weapon = i; me.reloading = false; me.zoom = false; me.latched = false; playSwitch(); me.switchT = 1;
  me.bloom = 0; me.burstN = 0; me.recovP = me.recovY = 0;
  me.nextFire = Math.max(me.nextFire, now + 250); setView(i);
}
setView(3);
function startReload(){
  const W = WEAPONS[me.weapon];
  if (me.reloading || !isAlive() || me.ammo[me.weapon] === W.mag) return;
  if (me.res[me.weapon] <= 0){ outOfAmmo(); return; }
  me.reloading = true; me.reloadEnd = now + W.reload; me.zoom = false; playReload(me.weapon, W.reload);
}
const isAlive = () => { const e = myEnt(); return started && !!e && e.alive; };
// ---- hand grenade and first-aid kit (2 of each per life)
function throwGrenade(){
  if (!isAlive() || overView) return;
  if (me.gren <= 0){ perfToast('El bomban kalmadı · yeniden doğunca 2 tane verilir'); return; }
  if (now < me.grenCd) return;
  me.gren--; me.grenCd = now + 900; me.zoom = false; me.reloading = false; me.switchT = 1; playSwitch();
  const dir = new V(); camera.getWorldDirection(dir);
  const o = camera.position.clone().addScaledVector(dir, .45); o.y -= .12;
  const v = dir.clone(); v.y += .2; v.normalize().multiplyScalar(16); v.x += me.vel.x * .5; v.z += me.vel.z * .5; v.y += Math.max(0, me.vel.y) * .5;
  launchGrenade(o, v, true);
  const fx = {g:1, o:v3(o, 2), v:v3(v, 2)};
  if (isHost){ fx.by = myId; fxQ.push(fx); } else if (hostConn) hostConn.send({t:'gr', o:fx.o, v:fx.v});
}
function hostHeal(id){ const e = ents.get(id); if (!e || !e.alive || (e.medN | 0) >= 2) return; e.medN = (e.medN | 0) + 1; e.healLeft = 50; }
function useMedkit(){
  if (!isAlive()) return;
  const e = myEnt();
  if (me.med <= 0){ perfToast('İlk yardım çantan kalmadı'); return; }
  if (e && e.hp >= 99.5){ perfToast('Sağlığın zaten dolu'); return; }
  if (now < me.medCd) return;
  me.med--; me.medCd = now + 1500; me.healFx = now; playSwitch();
  if (isHost) hostHeal(myId); else if (hostConn) hostConn.send({t:'med'});
}


// ================= Physics =================
function resolveXZ(p){
  for (const b of BOXES){
    if (p.y >= b.h - .01) continue;
    const hx = b.w/2, hz = b.d/2;
    const cx = Math.max(b.x-hx, Math.min(p.x, b.x+hx)), cz = Math.max(b.z-hz, Math.min(p.z, b.z+hz));
    let dx = p.x-cx, dz = p.z-cz; const d2 = dx*dx + dz*dz;
    if (d2 < RADIUS*RADIUS){
      if (d2 < 1e-9){ dx = p.x-b.x; dz = p.z-b.z; const L = Math.hypot(dx,dz) || 1; p.x += dx/L*RADIUS; p.z += dz/L*RADIUS; continue; }
      const d = Math.sqrt(d2); p.x += dx/d*(RADIUS-d); p.z += dz/d*(RADIUS-d);
    }
  }
  p.x = Math.max(-A+1, Math.min(A-1, p.x)); p.z = Math.max(-A+1, Math.min(A-1, p.z));
}
function tryStartSlide(){
  if (!isAlive() || me.slideT > 0 || now < me.slideCd || !me.grounded || me.stam < .1) return;
  const hs = Math.hypot(me.vel.x, me.vel.z);
  if (hs < 4.5) return;
  me.stam = Math.max(0, me.stam - .12); me.stamT = now;
  me.slideDir.set(me.vel.x / hs, 0, me.vel.z / hs); me.slideT = .8; me.slideSpeed = Math.max(hs, 7) + 4.5; me.zoom = false; me.dustT = 0;
  playSlide(null);
}
function updateMovement(dt){
  if (keys.ArrowLeft) me.yaw += 2.2*dt;
  if (keys.ArrowRight) me.yaw -= 2.2*dt;
  if (keys.ArrowUp) me.pitch = Math.min(1.45, me.pitch + 1.6*dt);
  if (keys.ArrowDown) me.pitch = Math.max(-1.45, me.pitch - 1.6*dt);
  let f = (keys.KeyW?1:0) - (keys.KeyS?1:0), s = (keys.KeyD?1:0) - (keys.KeyA?1:0), amt = 1;
  if (T.stick !== null){
    // analog stick: any direction, and a light push walks slowly
    const m = Math.hypot(T.ax, T.ay), DZ = .14;
    if (m > DZ){ amt = Math.min(1, (m - DZ) / (.82 - DZ)); f = -T.ay / m; s = T.ax / m; amt = .3 + .7 * amt; } else { f = s = 0; }
  }
  let mx = -Math.sin(me.yaw)*f + Math.cos(me.yaw)*s, mz = -Math.cos(me.yaw)*f - Math.sin(me.yaw)*s;
  const L = Math.hypot(mx, mz); if (L > 0){ mx /= L; mz /= L; }
  const wm = WEAPONS[me.weapon].move || 1;
  const wantSprint = (keys.ShiftLeft || keys.ShiftRight) && f > .45 && !me.zoom && !mouseDown && !me.exhausted && me.stam > 0;
  const speed = (wantSprint ? 8.2 : (me.zoom ? 3.2 : 5.4) * amt) * wm;
  // sprint energy: drains while running flat out, refills after a short breather
  me.sprinting = wantSprint && L > 0 && me.grounded && Math.hypot(me.vel.x, me.vel.z) > 5;
  if (me.sprinting){ me.stam = Math.max(0, me.stam - dt / 6); me.stamT = now; if (me.stam <= 0) me.exhausted = true; }
  else if (now - me.stamT > 900) me.stam = Math.min(1, me.stam + dt / (me.exhausted ? 4.5 : 3.2));
  if (me.exhausted && me.stam >= .35) me.exhausted = false;
  if (me.slideT > 0){
    me.slideT -= dt;
    const sk = Math.max(0, me.slideT / .8), sp = 4 + (me.slideSpeed - 4) * sk;
    me.slideDir.x += Math.cos(me.yaw) * s * dt * 1.2; me.slideDir.z += -Math.sin(me.yaw) * s * dt * 1.2; me.slideDir.normalize();
    me.vel.x = me.slideDir.x * sp; me.vel.z = me.slideDir.z * sp;
    me.dustT -= dt;
    if (me.dustT <= 0 && me.grounded){ me.dustT = .035; spawnSprite(new V(me.pos.x - me.slideDir.x*.3 + rnd(-.2,.2), .08, me.pos.z - me.slideDir.z*.3 + rnd(-.2,.2)), {color:C(0xb5a585), size:rnd(.25,.45), life:rnd(.6,1), v:new V(rnd(-.4,.4), rnd(.2,.6), rnd(-.4,.4)), grow:1.5, op:.5}); }
    if (me.slideT <= 0) me.slideCd = now + 900;
  } else {
    // a soldier with kit does not start or stop on a coin: speeding up is slower than slowing down, heavy guns slower still
    const k = 1 - Math.exp(-(me.grounded ? (L > 0 ? 7.5 : 8) * (.55 + wm * .45) : 2.2) * dt);
    me.vel.x += (mx*speed - me.vel.x) * k; me.vel.z += (mz*speed - me.vel.z) * k;
  }
  const p = me.pos;
  p.x += me.vel.x*dt; resolveXZ(p); p.z += me.vel.z*dt; resolveXZ(p);
  if (keys.Space && me.grounded){ me.vel.y = JUMP; me.grounded = false; me.stam = Math.max(0, me.stam - .06); me.stamT = now; if (me.slideT > 0){ me.slideT = 0; me.slideCd = now + 900; } }
  const prevY = p.y; me.vel.y -= GRAV*dt; p.y += me.vel.y*dt; me.grounded = false;
  if (p.y <= 0){ p.y = 0; me.vel.y = 0; me.grounded = true; }
  for (const b of BOXES)
    if (Math.abs(p.x-b.x) < b.w/2 + RADIUS*.6 && Math.abs(p.z-b.z) < b.d/2 + RADIUS*.6 && prevY >= b.h - .03 && p.y <= b.h){ p.y = b.h; me.vel.y = 0; me.grounded = true; }
  return L > 0;
}

// ================= Player shooting =================
const ray = new THREE.Raycaster();
const tmpO = new V(), tmpD = new V(), tmpM = new V();
function hitTargets(){
  const list = worldMeshes.slice();
  for (const [id, a] of avatars){ const e = ents.get(id); if (e && e.alive) list.push(...a.av.hit); }
  return list;
}
const _dn = new V();
function dmgNumber(p, n, head){
  const box = $('dmgNums'); if (!box || box.childElementCount > 14) return;
  _dn.copy(p).project(camera); if (_dn.z > 1) return;
  const el = document.createElement('i'); el.textContent = Math.round(n); if (head) el.className = 'h';
  el.style.left = ((_dn.x * .5 + .5) * 100 + (Math.random() - .5) * 3).toFixed(1) + '%'; el.style.top = ((-_dn.y * .5 + .5) * 100).toFixed(1) + '%';
  box.appendChild(el); setTimeout(() => el.remove(), 800);
}
// radar: allies always, enemies while they are firing, zone letters on the front-line map; turns with the view
const _rf = new V();
function drawRadar(){
  const cv2 = $('radar'); if (!cv2) return;
  const g = cv2.getContext('2d'), S = cv2.width, R = S / 2 - 3, RANGE = 34;
  g.clearRect(0, 0, S, S);
  g.save(); g.translate(S / 2, S / 2);
  const TC = touchOn, AC = TC ? '255,255,255' : '205,182,124';
  camera.getWorldDirection(_rf); _rf.y = 0; if (_rf.lengthSq() < 1e-6) _rf.set(0, 0, -1); _rf.normalize();
  const fx = _rf.x, fz = _rf.z, rx = -fz, rz = fx;
  g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fillStyle = TC ? 'rgba(34,37,36,.62)' : 'rgba(9,11,8,.62)'; g.fill();
  // buildings and walls around you, turning with the view
  { const Pm = me.pos, k = R / RANGE;
    g.save(); g.beginPath(); g.arc(0, 0, R - 1, 0, Math.PI * 2); g.clip();
    g.fillStyle = TC ? 'rgba(178,180,176,.5)' : 'rgba(205,182,124,.2)'; g.strokeStyle = TC ? 'rgba(235,236,232,.55)' : 'rgba(205,182,124,.35)'; g.lineWidth = 1;
    for (const b of BOXES){
      if (b.h < .4 || Math.abs(b.x - Pm.x) > RANGE * 1.45 + b.w / 2 || Math.abs(b.z - Pm.z) > RANGE * 1.45 + b.d / 2) continue;
      const hx = b.w / 2, hz = b.d / 2; g.beginPath();
      for (const [cx, cz] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]){ const dx = b.x + cx - Pm.x, dz = b.z + cz - Pm.z; g.lineTo((dx * rx + dz * rz) * k, -(dx * fx + dz * fz) * k); }
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore(); }
  g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.strokeStyle = TC ? 'rgba(255,255,255,.92)' : 'rgba(205,182,124,.5)'; g.lineWidth = TC ? 3 : 1.5; g.stroke();
  g.strokeStyle = `rgba(${AC},.14)`; g.lineWidth = 1;
  g.beginPath(); g.arc(0, 0, R * .5, 0, Math.PI * 2); g.moveTo(-R, 0); g.lineTo(R, 0); g.moveTo(0, -R); g.lineTo(0, R); g.stroke();
  // sweep
  const sw = (now / 1600) % (Math.PI * 2); const gr = g.createConicGradient ? g.createConicGradient(sw - Math.PI / 2, 0, 0) : null;
  if (gr){ gr.addColorStop(0, `rgba(${AC},${TC ? .16 : .28})`); gr.addColorStop(.12, `rgba(${AC},0)`); gr.addColorStop(1, `rgba(${AC},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill(); }
  // the N marker rides the rim, pointing at world north (-z)
  { const nx = -rz, ny = fz, L = Math.hypot(nx, ny) || 1, el = cv2.parentNode.querySelector('span');
    if (el){ const kx = (50 + nx / L * 41).toFixed(1), ky = (50 + ny / L * 41).toFixed(1);
      if (el.dataset.p !== kx + ',' + ky){ el.dataset.p = kx + ',' + ky; el.style.left = kx + '%'; el.style.top = ky + '%'; el.style.transform = 'translate(-50%,-50%)'; } } }
  const self = myEnt(), myTeam = self ? self.team : me.team, P = me.pos;
  const plot = (x, z) => { const dx = x - P.x, dz = z - P.z; let sx = (dx * rx + dz * rz) / RANGE * R, sy = -(dx * fx + dz * fz) / RANGE * R; const d = Math.hypot(sx, sy); if (d > R - 5){ sx *= (R - 5) / d; sy *= (R - 5) / d; } return [sx, sy, d > R - 5]; };
  if (MODE === 'dom') ZONES.forEach(z => { const [x, y] = plot(z.x, z.z); g.fillStyle = ZONE_HEX[z.owner === 0 || z.owner === 1 ? z.owner : 2]; g.font = '700 11px "Montserrat",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = .9; g.fillText(z.label, x, y); g.globalAlpha = 1; });
  for (const [id, e] of ents){
    if (id === myId || !e.alive) continue;
    const ally = e.team === myTeam;
    if (!ally && !(now - (SHOT_AT.get(id) || -1e9) < 2600)) continue;
    const [x, y, edge] = plot(e.pos.x, e.pos.z);
    g.fillStyle = ally ? (myTeam ? '#ff8a72' : '#7fb3ee') : '#ff5a44';
    if (ally){ g.beginPath(); g.arc(x, y, edge ? 2.5 : 3.6, 0, Math.PI * 2); g.fill(); }
    else { g.globalAlpha = .55 + .45 * Math.sin(now / 90); g.fillRect(x - 3.5, y - 3.5, 7, 7); g.globalAlpha = 1; }
  }
  // me
  g.fillStyle = touchOn ? '#4da3ff' : '#f1e4bb'; g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 6.5); g.lineTo(0, 3); g.lineTo(-6.5, 6.5); g.closePath(); g.fill();
  if (touchOn){ g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; g.stroke(); }
  g.restore();
}
function hitMarker(head, kill){
  const h = $('hitm'); h.classList.remove('on', 'kill'); void h.offsetWidth;
  h.classList.toggle('head', head); h.classList.add('on'); if (kill) h.classList.add('kill');
  clearTimeout(hitMarker.t); hitMarker.t = setTimeout(() => h.classList.remove('on', 'kill'), kill ? 420 : 150);
  if (!kill){ playHit(head, false); buzz(head ? 16 : 7); }
}
// blood + spark burst where a bullet meets a soldier; headshots spray more
function fleshHit(p, head){
  const n = quality === 0 ? 4 : head ? 12 : 7;
  for (let i=0;i<n;i++) spawnSprite(p, {color:C(head ? 0x8a0f05 : 0x6e0d05), size:rnd(.04,.1), life:rnd(.3,.55), v:new V(rnd(-2.2,2.2), rnd(.3,2.6), rnd(-2.2,2.2)), grav:8, op:.95});
  spawnSprite(p, {tex:TEX.flash, color:new THREE.Color(head ? 2.4 : 1.6, head ? .7 : .55, .3), size:head ? .55 : .34, life:.07, add:true, grow:1.6});
  if (quality > 0) spawnSprite(p, {tex:TEX.smoke, color:C(0x5a0a04), size:head ? .5 : .32, life:.6, grow:1.8, op:.5, spin:rnd(-1,1)});
}
// current cone half-angle of the player's gun: stance, movement, air time and recent shots all widen it
function curSpread(){
  const W = WEAPONS[me.weapon], H = HANDLING[me.weapon];
  const hs = Math.min(1, Math.hypot(me.vel.x, me.vel.z) / 6);
  if (W.scope){
    if (!me.zoom || me.adsT < .5) return .085 + hs * .05 + (me.grounded ? 0 : .05);
    return .0012 + hs * H.move + (me.grounded ? 0 : .06) + me.bloom;
  }
  const ads = me.zoom ? me.adsT : 0;
  let s = W.spread * (H.hip + (H.ads - H.hip) * ads) + me.bloom * (1 - ads * .4);
  s += hs * H.move * (1 - ads * .35);
  if (!me.grounded) s += .045;
  if (me.slideT > 0) s += .025;
  return s + me.sprintT * .04;
}
// a random direction inside a cone around `base` (uniform over the disc, so it really scatters)
const _sx = new V(), _sy = new V();
function spreadDir(base, s){
  _sx.set(base.z, 0, -base.x); if (_sx.lengthSq() < 1e-6) _sx.set(1, 0, 0); _sx.normalize(); _sy.crossVectors(base, _sx).normalize();
  const a = Math.random() * Math.PI * 2, r = s * Math.sqrt(Math.random());
  return base.clone().addScaledVector(_sx, Math.cos(a) * r).addScaledVector(_sy, Math.sin(a) * r).normalize();
}
// recoil climbs with every shot in a burst and drifts sideways in a weapon-specific pattern;
// part of it settles back once the trigger is released, the rest the player pulls down
function applyRecoil(W){
  const H = HANDLING[me.weapon];
  if (now - me.lastShotT > W.rate + 140){ me.burstN = 0; me.recoilSide = Math.random() < .5 ? -1 : 1; }
  const n = me.burstN++, adsK = me.zoom ? .78 : 1, ramp = 1 + Math.min(n, 8) * .07;
  const kv = H.rv * ramp * adsK * (.88 + Math.random() * .24) * (me.slideT > 0 ? 1.15 : 1);
  const side = n < 3 ? me.recoilSide * .35 : Math.sin(n * .55 + me.recoilSide) * (1 + Math.min(n, 12) * .06);
  const kh = (H.rh * side + (Math.random() - .5) * 2 * H.rr) * adsK;
  me.pitch = Math.min(1.45, me.pitch + kv); me.yaw -= kh;
  me.recovP += kv * H.rec; me.recovY += kh * H.rec * .5;
  me.bloom = Math.min(H.bmax, me.bloom + H.bloom);
  me.lastShotT = now;
}
function updateRecoil(dt){
  const H = HANDLING[me.weapon], W = WEAPONS[me.weapon];
  me.bloom = Math.max(0, me.bloom - H.bdec * dt * (me.zoom ? 1.3 : 1));
  if (now - me.lastShotT > W.rate + 60 && (me.recovP > 1e-5 || Math.abs(me.recovY) > 1e-5)){
    const k = 1 - Math.exp(-dt * 7), dp = me.recovP * k, dy = me.recovY * k;
    me.pitch = Math.max(-1.45, me.pitch - dp); me.yaw += dy; me.recovP -= dp; me.recovY -= dy;
  }
}
function tryFire(moving){
  if (me.sprintT > .25) return;
  const W = WEAPONS[me.weapon];
  if (me.reloading || now < me.nextFire) return;
  if (!W.auto && me.latched) return;
  if (me.ammo[me.weapon] <= 0){ if (!me.latched){ playDry(); me.latched = true; } startReload(); return; }
  me.latched = true; me.nextFire = now + W.rate; me.ammo[me.weapon]--;
  const scoped = W.scope && me.zoom;
  const spread = curSpread();
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD); muzzle.getWorldPosition(tmpM);
  const targets = hitTargets(), dealt = {}, ends = [], dmgAt = {};
  let anyHit = false, anyHead = false;
  for (let i=0;i<W.pellets;i++){
    const d = spreadDir(tmpD, spread);
    ray.set(tmpO, d); ray.far = 200;
    const hit = ray.intersectObjects(targets, false)[0];
    const end = hit ? hit.point.clone() : tmpO.clone().addScaledVector(d, 200);
    ends.push(end);
    if (!hit) continue;
    if (W.explosive) continue;
    const u = hit.object.userData;
    if (u.id){
      const e = ents.get(u.id);
      if (e && e.team !== me.team && !e.inv){ fleshHit(end, u.head); const sa = avatars.get(u.id); if (sa) sa.av.flinch = 1; } else addPuff(end, 0x9a1d12);
      if (e && e.team !== me.team && !e.inv){
        let dmg = W.dmg * (u.head ? W.hs : 1);
        if (W.falloff) dmg *= Math.max(.3, Math.min(1, 1 - (hit.distance-8)/20));
        dealt[u.id] = (dealt[u.id] || 0) + dmg; anyHit = true; anyHead = anyHead || u.head;
        if (!dmgAt[u.id]) dmgAt[u.id] = {p:end, h:false}; dmgAt[u.id].h = dmgAt[u.id].h || u.head;
      }
    } else { addImpact(hit); playImpact(hit.point); }
  }
  for (const id in dealt){
    if (dmgAt[id]) dmgNumber(dmgAt[id].p, dealt[id], dmgAt[id].h);
    if (isHost) applyHit(myId, id, dealt[id]);
    else if (hostConn) hostConn.send({t:'hit', v:id, d:Math.round(dealt[id])});
  }
  if (anyHit) hitMarker(anyHead);
  if (W.explosive) launchRocket(tmpM.clone(), ends[0], true);
  else ends.forEach(e => addTracer(tmpM.clone(), e));
  const fx = {o:v3(tmpM,1), e:ends.map(e => v3(e,1)), w:me.weapon};
  if (isHost){ fx.by = myId; fxQ.push(fx); } else if (hostConn) hostConn.send({t:'sh', ...fx});
  applyRecoil(W);
  me.heat = Math.min(1, (me.heat || 0) + (W.auto ? .045 : .12));
  me.recoil = 1; flash.intensity = 5; flashSprite.material.opacity = 1; flashPetals.rotation.set(Math.random()*6.28, Math.PI/2, 0); flashPetals.scale.setScalar(rnd(.75,1.25));
  me.kz.v += .25 + W.kick*6; me.kp.v += .4 + W.kick*14; me.kr.v += (Math.random()-.5)*(.6 + W.kick*16); me.ky.v += (Math.random()-.5)*(.3 + W.kick*8); me.cr.v += (Math.random()-.5)*W.kick*3; me.fovK.v += W.kick*120; flashSprite.material.rotation = Math.random()*6; flashSprite.scale.setScalar(rnd(.26,.4));
  spawnSprite(tmpM.clone(), {tex:TEX.smoke, color:C(0xa8a39a), size:.12, life:1, v:new V(rnd(-.1,.1), .45, rnd(-.1,.1)), grow:2.2, op:.32, fadeIn:.1, spin:rnd(-1,1)});
  if ((me.weapon === 5 || me.weapon === 7) && me.ammo[me.weapon] > 0){ me.ejectAt = now + (me.weapon === 7 ? 720 : 460); me.ejectW = me.weapon; }
  else ejectCasing();
  playShot(me.weapon, null);
  if (me.ammo[me.weapon] === 0) setTimeout(startReload, 150);
}
const r2 = v => Math.round(v*100)/100;
const v3 = (v, dp=2) => { const m = 10**dp; return [Math.round(v.x*m)/m, Math.round(v.y*m)/m, Math.round(v.z*m)/m]; };

function outOfAmmo(){ if (now - (outOfAmmo.t || -1e9) > 500){ outOfAmmo.t = now; playDry(); } }

// ================= Zone control (front-line map) =================
// Standing in a zone moves its flag towards your team; two teams inside freeze it. Each zone a team holds
// scores a point every 1.5 s, taking one is worth 5 points and kills still count 1.
const goalFor = () => MODE === 'dom' ? goal * 5 : goal;
const ZONE_HEX = ['#4f9cff', '#ff5a44', '#d9c98f'];
let zoneTick = 0;
function resetZones(){ for (const z of ZONES){ z.owner = -1; z.prog = 0; z.contested = false; z.cnt[0] = z.cnt[1] = 0; } zoneTick = 0; }
function hostZones(dt){
  if (MODE !== 'dom' || over) return;
  ZONES.forEach((z, i) => {
    z.cnt[0] = z.cnt[1] = 0;
    for (const e of ents.values()) if (e.alive && e.pos.y < 3 && Math.hypot(e.pos.x - z.x, e.pos.z - z.z) < z.r) z.cnt[e.team]++;
    const b = z.cnt[0], r = z.cnt[1];
    z.contested = !!(b && r);
    if (z.contested) return;
    if (!b && !r){                                           // empty: drift back to whoever holds it
      const tgt = z.owner === 0 ? 1 : z.owner === 1 ? -1 : 0;
      z.prog += Math.sign(tgt - z.prog) * Math.min(Math.abs(tgt - z.prog), dt / 20);
      return;
    }
    const t = b ? 0 : 1, sign = t === 0 ? 1 : -1, n = b || r;
    z.prog = Math.max(-1, Math.min(1, z.prog + sign * dt / 7 * Math.min(2, 1 + (n - 1) * .35)));
    if (z.owner !== -1 && z.owner !== t && (z.owner === 0 ? z.prog <= 0 : z.prog >= 0)){ const p = z.owner; z.owner = -1; evQ.push({zc:i, o:-1, p}); onZone(i, -1, p); }
    if (z.owner !== t && Math.abs(z.prog) >= 1){ const p = z.owner; z.owner = t; score[t] += 5; evQ.push({zc:i, o:t, p}); onZone(i, t, p); }
  });
  zoneTick += dt;
  if (zoneTick >= 1.5){ zoneTick -= 1.5; for (const z of ZONES) if (z.owner >= 0) score[z.owner]++; }
  for (const t of [0, 1]) if (!over && score[t] >= goalFor()) over = {win:t, until:now + 7000};
}
function onZone(i, o, prev){
  const z = ZONES[i]; if (!z) return;
  const mine = myEnt() ? myEnt().team : me.team, el = $('zoneNote');
  const [txt, cls] = o === -1 ? (prev === mine ? [`${z.label} bölgesi elden gidiyor!`, 'b'] : [`${z.label} bölgesi nötrlendi`, 'n'])
    : o === mine ? [`${z.label} bölgesini ele geçirdik`, 'g']
    : prev === mine ? [`${z.label} bölgesini kaybettik`, 'b'] : [`Düşman ${z.label} bölgesini aldı`, 'b'];
  el.textContent = txt; el.className = 'hud on ' + cls; clearTimeout(onZone.t); onZone.t = setTimeout(() => el.classList.remove('on'), 2200);
  if (o === mine) playHit(false, true);
}
const ZONE_G = new THREE.Group(); ZONE_G.name = 'zones'; scene.add(ZONE_G);
const ZONE_LETTERS = {};
function zoneLetterTex(ch){
  if (ZONE_LETTERS[ch]) return ZONE_LETTERS[ch];
  const c = makeCanvas(128), g = c.getContext('2d');
  g.font = '96px "Montserrat", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(10,12,8,.9)'; g.strokeText(ch, 64, 70); g.fillStyle = '#ffffff'; g.fillText(ch, 64, 70);
  return (ZONE_LETTERS[ch] = toTex(c));
}
function buildZoneVisuals(){
  ZONE_G.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o !== ZONE_G) o.material.dispose(); });
  ZONE_G.clear();
  for (const z of ZONES){
    const g = new THREE.Group(); g.position.set(z.x, 0, z.z);
    const flat = (geo, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:op, depthWrite:false, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-3})); m.rotation.x = -Math.PI/2; g.add(m); return m; };
    const ring = flat(new THREE.RingGeometry(z.r - .22, z.r, 72), .8); ring.position.y = .03;
    const fill = flat(new THREE.CircleGeometry(z.r, 56), .08); fill.position.y = .025;
    const arc = flat(new THREE.RingGeometry(z.r - .7, z.r - .35, 72, 1, Math.PI/2, .001), .85); arc.position.y = .035;
    const px = z.r * .55;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 5, 8), stdMat({color:C(0x8a8a82), roughness:.4, metalness:.8})); pole.position.set(px, 2.5, 0); pole.castShadow = true; g.add(pole);
    const fg = new THREE.PlaneGeometry(1.3, .8, 6, 1); fg.translate(.65, 0, 0);
    const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.9, side:THREE.DoubleSide})); flag.position.set(px + .05, 4.5, 0); flag.castShadow = true; g.add(flag);
    const letter = new THREE.Sprite(new THREE.SpriteMaterial({map:zoneLetterTex(z.label), transparent:true, depthWrite:false, fog:false})); letter.position.set(px, 5.75, 0); letter.scale.setScalar(1.1); g.add(letter);
    z.vis = {ring, fill, arc, flag, letter, arcP:-1, arcT:-1};
    ZONE_G.add(g);
  }
  ZONE_G.visible = MODE === 'dom';
  if (typeof liteOn !== 'undefined' && liteOn) liteSweep();
}
const _zc = new THREE.Color();
function updateZoneVisuals(){
  if (!ZONE_G.visible) return;
  const t = now / 1000;
  for (const z of ZONES){
    const v = z.vis; if (!v) continue;
    _zc.set(ZONE_HEX[z.owner >= 0 ? z.owner : 2]);
    v.ring.material.color.copy(_zc); v.fill.material.color.copy(_zc); v.flag.material.color.copy(_zc); v.letter.material.color.copy(_zc);
    if (v.flag.userData.pbrMat) v.flag.userData.pbrMat.color.copy(_zc);
    v.fill.material.opacity = z.contested ? .13 + .07 * Math.sin(t * 9) : .08;
    const p = Math.round(Math.abs(z.prog) * 100) / 100, tc = z.prog >= 0 ? 0 : 1;
    const showArc = p > .01 && !(z.owner === tc && p >= 1);
    if (p !== v.arcP || tc !== v.arcT){
      v.arcP = p; v.arcT = tc; v.arc.geometry.dispose();
      v.arc.geometry = new THREE.RingGeometry(z.r - .7, z.r - .35, 72, 1, Math.PI/2, -Math.max(.001, p) * Math.PI * 2);
      v.arc.material.color.set(ZONE_HEX[tc]);
    }
    v.arc.visible = showArc;
    v.flag.rotation.y = Math.sin(t * 1.7 + z.x) * .35;
    const pa = v.flag.geometry.attributes.position;
    for (let k = 0; k < pa.count; k++){ const x = pa.getX(k); pa.setZ(k, Math.sin(x * 4 - t * 6 + z.z) * .07 * x); }
    pa.needsUpdate = true;
  }
}
function updateZoneHud(alive){
  const dom = MODE === 'dom' && started;
  hudStyle('zoneHud', 'display', dom ? 'flex' : 'none'); hudClass('stage', 'dom', dom);
  if (!dom){ hudStyle('zoneCap', 'display', 'none'); return; }
  const els = document.querySelectorAll('#zoneHud .zb');
  ZONES.forEach((z, i) => {
    const el = els[i]; if (!el) return;
    const gain = z.prog >= 0 ? 0 : 1, p = Math.round(Math.abs(z.prog) * 100), key = z.owner + '|' + p + '|' + gain + '|' + (z.contested ? 1 : 0);
    if (el._k === key) return; el._k = key;
    el.style.setProperty('--p', p); el.style.setProperty('--c', ZONE_HEX[gain]); el.dataset.owner = z.owner; el.classList.toggle('cont', z.contested);
  });
  const myTeam = myEnt() ? myEnt().team : me.team;
  let zi = -1; if (alive) ZONES.forEach((z, i) => { if (Math.hypot(me.pos.x - z.x, me.pos.z - z.z) < z.r && me.pos.y < 3) zi = i; });
  hudStyle('zoneCap', 'display', zi >= 0 ? 'flex' : 'none');
  if (zi < 0) return;
  const z = ZONES[zi], mp = myTeam === 0 ? z.prog : -z.prog;
  const txt = z.contested ? `${z.label} · çekişmeli — düşmanı temizle`
    : z.owner === myTeam && mp >= .999 ? `${z.label} bölgesi bizde`
    : mp < 0 ? `${z.label} · düşman bayrağı indiriliyor` : `${z.label} ele geçiriliyor · %${Math.round(mp * 100)}`;
  hudText('zoneCapT', txt);
  hudStyle('zoneCapFill', 'width', Math.round((mp + 1) * 50) + '%');
  hudStyle('zoneCapFill', 'background', z.contested ? '#ffb347' : mp >= 0 ? ZONE_HEX[myTeam] : ZONE_HEX[1 - myTeam]);
}

// ================= Ammo pickups =================
// Crates stand at fixed spots on every map and come back 25 s after someone empties them; a fallen
// soldier drops a pouch for 20 s. The host decides who got what - players only report whether they need ammo.
const PICKUPS = [];           // {id, kind:'c'|'d', x, z, on, back, until}
let pickSeq = 0, pickSig = '';
const needAmmo = () => (me.loadout || [me.weapon]).some(w => me.res[w] < HANDLING[w].res);
function resetPickups(){
  PICKUPS.length = 0;
  for (const [x, z] of MAP_AMMO) PICKUPS.push({id:'c' + (pickSeq++), kind:'c', x, z, on:true, back:0});
  syncPickupMeshes();
}
function dropPouch(x, z){
  PICKUPS.push({id:'d' + (pickSeq++), kind:'d', x, z, on:true, until:now + 20000});
  const drops = PICKUPS.filter(p => p.kind === 'd'); if (drops.length > 8) PICKUPS.splice(PICKUPS.indexOf(drops[0]), 1);
  syncPickupMeshes();
}
function hostPickups(){
  let changed = false;
  for (let i = PICKUPS.length - 1; i >= 0; i--){
    const p = PICKUPS[i];
    if (!p.on){ if (p.kind === 'c' && now >= p.back){ p.on = true; changed = true; } continue; }
    if (p.kind === 'd' && now > p.until){ PICKUPS.splice(i, 1); changed = true; continue; }
    for (const e of ents.values()){
      if (!e.alive || e.kind === 'b' || !e.needAmmo || e.pos.y > 1.6) continue;
      if (Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > 1.35) continue;
      e.needAmmo = false; changed = true;
      if (p.kind === 'c'){ p.on = false; p.back = now + 25000; } else PICKUPS.splice(i, 1);
      if (e.id === myId) gotAmmo(p.kind === 'c' ? 2 : 1);
      else { const c = conns.get(e.id); if (c) c.send({t:'am', k:p.kind === 'c' ? 2 : 1}); }
      break;
    }
  }
  if (changed) syncPickupMeshes();
}
function gotAmmo(kind){
  for (const w of (me.loadout || [me.weapon])){
    const max = HANDLING[w].res;
    me.res[w] = kind === 2 ? Math.max(me.res[w], max) : Math.min(max, me.res[w] + WEAPONS[w].mag);
  }
  playSwitch(); killNote(kind === 2 ? 'Mühimmat alındı · tüm şarjörler dolu' : 'Mermi kesesi · +1 şarjör');
  if (me.ammo[me.weapon] === 0) setTimeout(startReload, 200);
}
const encPickups = () => PICKUPS.filter(p => p.on).map(p => [p.id, r2(p.x), r2(p.z), p.kind === 'c' ? 0 : 1]);
function clientPickups(list){
  const sig = JSON.stringify(list); if (sig === pickSig) return; pickSig = sig;
  PICKUPS.length = 0;
  for (const a of list) if (Array.isArray(a) && a.length >= 4) PICKUPS.push({id:String(a[0]), kind:a[3] ? 'd' : 'c', x:+a[1] || 0, z:+a[2] || 0, on:true});
  syncPickupMeshes();
}
// visuals: an olive ammo crate (or a small pouch) with a floating bullet icon and a soft glow on the ground
const PICK_G = new THREE.Group(); PICK_G.name = 'pickups'; scene.add(PICK_G);
const PICK_OBJ = new Map();
const PICK_ICON = (() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = 'rgba(18,20,12,.82)'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.strokeStyle = '#e9c76a'; g.lineWidth = 6; g.stroke();
  for (const x of [42, 64, 86]){
    g.fillStyle = '#d9a640'; g.fillRect(x - 8, 50, 16, 40);
    g.fillStyle = '#f2d590'; g.beginPath(); g.moveTo(x - 8, 50); g.quadraticCurveTo(x, 22, x + 8, 50); g.fill();
    g.fillStyle = '#8a6420'; g.fillRect(x - 8, 84, 16, 6);
  }
  return toTex(c);
})();
const PICK_MATS = {
  crate:stdMat({color:C(0x4d5634), roughness:.7, metalness:.35}), dark:stdMat({color:C(0x23271a), roughness:.6, metalness:.5}),
  band:stdMat({color:C(0xd8b24a), roughness:.5}), pouch:stdMat({color:C(0x8a7a52), roughness:.9}),
  glow:new THREE.MeshBasicMaterial({map:TEX.soft, color:C(0xffd27a), transparent:true, opacity:.5, depthWrite:false, blending:THREE.AdditiveBlending}),
};
const PICK_GEO = {};
function pickupGeo(kind){
  if (PICK_GEO[kind]) return PICK_GEO[kind];
  const parts = [], U = THREE.BufferGeometryUtils;
  const add = (w, h, d, x, y, z, hex) => { const b = new THREE.BoxGeometry(w, h, d).toNonIndexed(); b.translate(x, y, z); const c = new THREE.Color(hex).convertSRGBToLinear(), n = b.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++){ col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b; } b.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(b); };
  if (kind === 'c'){ add(.62, .3, .36, 0, .15, 0, 0x4d5634); add(.64, .05, .38, 0, .32, 0, 0x23271a); add(.63, .06, .37, 0, .2, 0, 0xd8b24a); add(.06, .05, .2, -.24, .37, 0, 0x23271a); add(.06, .05, .2, .24, .37, 0, 0x23271a); }
  else { add(.3, .17, .2, 0, .085, 0, 0x8a7a52); add(.31, .04, .21, 0, .14, 0, 0x23271a); }
  return (PICK_GEO[kind] = U && U.mergeBufferGeometries ? U.mergeBufferGeometries(parts, false) : parts[0]);
}
PICK_MATS.box = stdMat({vertexColors:true, roughness:.7, metalness:.3});
function makePickupMesh(kind){
  const g = new THREE.Group();
  const body = new THREE.Mesh(pickupGeo(kind), PICK_MATS.box); body.castShadow = true; g.add(body);
  g.rotation.y = Math.random() * Math.PI;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), PICK_MATS.glow); glow.rotation.x = -Math.PI/2; glow.position.y = .02; g.add(glow);
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({map:PICK_ICON, transparent:true, depthWrite:false, fog:false}));
  icon.scale.setScalar(kind === 'c' ? .42 : .32); icon.position.y = kind === 'c' ? 1.05 : .75; g.add(icon);
  g.userData = {icon, glow, base:icon.position.y, ph:Math.random() * 6};
  return g;
}
function syncPickupMeshes(){
  const live = new Set();
  for (const p of PICKUPS){
    if (!p.on) continue;
    live.add(p.id);
    let o = PICK_OBJ.get(p.id);
    if (!o){ o = makePickupMesh(p.kind); PICK_OBJ.set(p.id, o); PICK_G.add(o); if (typeof liteOn !== 'undefined' && liteOn) o.traverse(m => { if (m.isMesh && m.material.isMeshStandardMaterial){ m.userData.pbrMat = m.material; m.material = liteOf(m.material); } }); }
    o.position.set(p.x, 0, p.z);
  }
  for (const [id, o] of PICK_OBJ) if (!live.has(id)){ PICK_G.remove(o); o.traverse(m => { if (m.isSprite) m.material.dispose(); if (m.isMesh && m.geometry.type === 'PlaneGeometry') m.geometry.dispose(); }); PICK_OBJ.delete(id); }
}
function updatePickups(){
  const t = now / 1000;
  for (const o of PICK_OBJ.values()){
    const u = o.userData; u.icon.position.y = u.base + Math.sin(t * 2.2 + u.ph) * .06;
    u.glow.material.opacity = .32 + Math.sin(t * 3 + u.ph) * .12;
  }
}

// ================= Bots (host only) =================
const wray = new THREE.Raycaster(), tA = new V(), tB = new V(), tC = new V();
function losClear(a, b){
  tC.subVectors(b, a); const L = tC.length(); if (L < .01) return true;
  tC.divideScalar(L); wray.set(a, tC); wray.far = L;
  return wray.intersectObjects(solidMeshes, false).length === 0;
}
function raySphere(o, d, cx, cy, cz, r){
  const ox = o.x-cx, oy = o.y-cy, oz = o.z-cz;
  const b = ox*d.x + oy*d.y + oz*d.z, c = ox*ox + oy*oy + oz*oz - r*r, disc = b*b - c;
  if (disc < 0) return -1; return -b - Math.sqrt(disc);
}
const BODY_SPHERES = [[.4,.36,false],[.85,.38,false],[1.28,.36,false],[1.74,.26,true]];
function traceShot(o, d, selfId){
  wray.set(o, d); wray.far = 150;
  const wh = wray.intersectObjects(solidMeshes, false)[0];
  let tMax = wh ? wh.distance : 150, hit = null;
  if (d.y < 0){ const tf = -o.y / d.y; if (tf < tMax) tMax = tf; }
  for (const e of ents.values()){
    if (e.id === selfId || !e.alive) continue;
    for (const [h, r, head] of BODY_SPHERES){
      const t = raySphere(o, d, e.pos.x, e.pos.y + h * (e.slide ? .55 : 1), e.pos.z, r);
      if (t > 0 && t < tMax){ tMax = t; hit = {id:e.id, head}; }
    }
  }
  return {end: o.clone().addScaledVector(d, tMax), hit};
}
function randomWp(team){
  const enemySide = Math.random() < .55;
  const pool = WAYPTS.filter(([,z]) => enemySide ? (team === 0 ? z < 4 : z > -4) : true);
  const p = pool[Math.floor(Math.random()*pool.length)] || [0,0];
  return new V(p[0], 0, p[1]);
}
function botShoot(b, T, dist){
  const D = BOT_DIFF[diff], ai = b.ai, W = WEAPONS[b.weapon] && WEAPONS[b.weapon].bot ? WEAPONS[b.weapon] : WEAPONS[3], bp = W.bot;
  const o = new V(b.pos.x, 1.45, b.pos.z);
  const base = new V(T.pos.x, T.pos.y + (Math.random() < .15 ? 1.72 : 1.1), T.pos.z).sub(o).normalize();
  const sp = D.spread * (W.scope ? .6 : 1) + W.spread + dist * .001;
  const ends = [], dealt = {};
  for (let i=0;i<W.pellets;i++){
    const d = base.clone().add(new V((Math.random()-.5)*2*sp, (Math.random()-.5)*2*sp, (Math.random()-.5)*2*sp)).normalize();
    const {end, hit} = traceShot(o, d, b.id); ends.push(end);
    if (hit){
      let dmg = W.dmg * D.dmgMul * (hit.head ? Math.min(W.hs, 1.8) : 1);
      if (W.falloff) dmg *= Math.max(.3, Math.min(1, 1 - (o.distanceTo(end) - 8) / 20));
      dealt[hit.id] = (dealt[hit.id] || 0) + dmg;
    }
  }
  for (const id in dealt) applyHit(b.id, id, dealt[id]);
  const fx = {o:v3(o.clone().addScaledVector(base, .6), 1), e:ends.map(e => v3(e, 1)), w:WEAPONS.indexOf(W), by:b.id};
  fxQ.push(fx); renderFx(fx);
  ai.burst--;
  if (ai.burst > 0) ai.nextShot = now + Math.max(W.rate, 90);
  else { ai.nextShot = now + D.gap * bp.gap * (.7 + Math.random()*.6); ai.burst = bp.burst[0] + Math.floor(Math.random() * (bp.burst[1] - bp.burst[0] + 1)); }
}
// zone the bot should head for: mostly zones its team does not hold, sometimes one of its own under attack
function pickObjective(b){
  let best = 0, bs = -1;
  ZONES.forEach((z, i) => {
    const d = Math.hypot(z.x - b.pos.x, z.z - b.pos.z), held = z.owner === b.team && Math.abs(z.prog) >= .999;
    const attacked = z.owner === b.team && (z.cnt[1 - b.team] > 0 || Math.abs(z.prog) < .999);
    const w = held ? (attacked ? 1.4 : .12) : z.owner === -1 ? 1.25 : 1;
    const sc = w / (1 + d / 25) * (.65 + Math.random() * .7);
    if (sc > bs){ bs = sc; best = i; }
  });
  return best;
}
// next step along a nav path to `goal` (re-planned every few seconds or when the goal moves)
function botFollow(b, goal){
  const ai = b.ai;
  if (!ai.path || !ai.pathGoal || Math.hypot(ai.pathGoal.x - goal.x, ai.pathGoal.z - goal.z) > 1.5 || now > ai.pathT){
    ai.path = navPath(b.pos.x, b.pos.z, goal.x, goal.z) || [[goal.x, goal.z]];
    ai.pathGoal = goal.clone(); ai.pathT = now + 2500 + Math.random() * 1500;
  }
  while (ai.path.length > 1 && Math.hypot(ai.path[0][0] - b.pos.x, ai.path[0][1] - b.pos.z) < .7) ai.path.shift();
  const p = ai.path[0], dx = p[0] - b.pos.x, dz = p[1] - b.pos.z;
  return {dx, dz, d:Math.hypot(dx, dz) || 1};
}
function botThink(b, dt){
  const ai = b.ai, D = BOT_DIFF[diff];
  ai.scanT -= dt;
  if (ai.scanT <= 0){
    ai.scanT = .2 + Math.random()*.1;
    let best = null, bd = 1e9;
    tA.set(b.pos.x, 1.5, b.pos.z);
    for (const e of ents.values()){
      if (e.team === b.team || !e.alive) continue;
      const d = Math.hypot(e.pos.x-b.pos.x, e.pos.z-b.pos.z);
      if (d > 45 || d > bd) continue;
      tB.set(e.pos.x, e.pos.y + 1.3, e.pos.z);
      if (losClear(tA, tB)){ best = e; bd = d; }
    }
    if (best && best !== ai.target) ai.react = now + D.react * (.7 + Math.random()*.6);
    ai.target = best;
    if (best) ai.lastSeen = best.pos.clone();
  }
  let mx = 0, mz = 0, faceYaw = null;
  const T = ai.target;
  if (T && T.alive){
    const dx = T.pos.x-b.pos.x, dz = T.pos.z-b.pos.z, d = Math.hypot(dx,dz) || 1;
    faceYaw = Math.atan2(-dx, -dz);
    const bpr = (WEAPONS[b.weapon] && WEAPONS[b.weapon].bot) || WEAPONS[3].bot;
    const fwd = d > bpr.max ? 1 : d < bpr.min ? -1 : 0;
    ai.strafeT -= dt;
    if (ai.strafeT <= 0){ ai.strafeT = .7 + Math.random()*1.4; ai.strafe = Math.random() < .2 ? 0 : (Math.random() < .5 ? -1 : 1); }
    const nx = dx/d, nz = dz/d;
    mx = nx*fwd - nz*ai.strafe; mz = nz*fwd + nx*ai.strafe;
    let dy = faceYaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (Math.abs(dy) < .25 && now > ai.react && now > ai.nextShot && !over) botShoot(b, T, d);
  } else {
    let goal = ai.lastSeen;
    if (!goal && MODE === 'dom' && ZONES.length){
      if (ai.obj == null || now > ai.objT){ ai.obj = pickObjective(b); ai.objT = now + 7000 + Math.random() * 6000; ai.objPt = null; }
      const z = ZONES[ai.obj];
      if (!ai.objPt){
        for (let k = 0; k < 8; k++){ const a = Math.random() * 6.283, r = Math.random() * z.r * .65; const p = new V(z.x + Math.cos(a) * r, 0, z.z + Math.sin(a) * r); if (navFree(p.x, p.z)){ ai.objPt = p; break; } }
        if (!ai.objPt) ai.objPt = new V(z.x, 0, z.z);
      }
      goal = ai.objPt;
    }
    if (!goal){ if (!ai.wp) ai.wp = randomWp(b.team); goal = ai.wp; }
    const gd = Math.hypot(goal.x - b.pos.x, goal.z - b.pos.z);
    if (gd < 1.2){
      if (goal === ai.lastSeen) ai.lastSeen = null;
      else if (goal === ai.wp) ai.wp = null;
      else {                                                 // holding a zone: look towards the enemy side, move on after a while
        if (!ai.holdT) ai.holdT = now + 1500 + Math.random() * 2500;
        faceYaw = b.team === 0 ? Math.PI * .05 * Math.sin(now / 900 + b.pos.x) : Math.PI + Math.PI * .05 * Math.sin(now / 900 + b.pos.x);
        if (now > ai.holdT){ ai.holdT = 0; ai.objPt = null; }
      }
    } else {
      const f = botFollow(b, goal);
      faceYaw = Math.atan2(-f.dx, -f.dz); mx = f.dx / f.d; mz = f.dz / f.d;
    }
  }
  if (faceYaw !== null){ let dy = faceYaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); b.yaw += Math.max(-7*dt, Math.min(7*dt, dy)); }
  const L = Math.hypot(mx, mz);
  if (L > 0){ const sp = 4.3*dt*((WEAPONS[b.weapon] && WEAPONS[b.weapon].move) || 1); b.pos.x += mx/L*sp; resolveXZ(b.pos); b.pos.z += mz/L*sp; resolveXZ(b.pos); }
  // separation from others
  for (const o of ents.values()){
    if (o === b || !o.alive) continue;
    const dx = b.pos.x-o.pos.x, dz = b.pos.z-o.pos.z, d = Math.hypot(dx,dz);
    if (d > 0 && d < .8){ b.pos.x += dx/d*(.8-d)*.5; b.pos.z += dz/d*(.8-d)*.5; }
  }
  ai.stuckT += dt;
  if (ai.stuckT > 1.2){
    if (L > 0 && b.pos.distanceTo(ai.stuckPos) < .4){ ai.wp = randomWp(b.team); ai.lastSeen = null; ai.strafe = -ai.strafe || 1; ai.path = null; ai.objPt = null; }
    ai.stuckPos.copy(b.pos); ai.stuckT = 0;
  }
}

// ================= Host simulation =================
function hostStep(dt){
  const self = myEnt();
  if (self && self.alive && me.rs === self.rs){ self.pos.copy(me.pos); self.yaw = me.yaw; self.pitch = me.pitch; self.weapon = me.weapon; self.slide = me.slideT > 0; self.needAmmo = needAmmo(); }
  if (started){
    hostPickups(); hostZones(dt);
    if (over && now >= over.until) hostResetRound();
    for (const e of ents.values()){
      e.inv = now < e.invUntil;
      if (!e.alive){ if (!over && now >= e.respawnAt) spawnEnt(e); continue; }
      if (now - e.lastHurt > 5000 && e.hp < 100) e.hp = Math.min(100, e.hp + 12*dt);
      if (e.healLeft > 0){ const a = Math.min(e.healLeft, 38*dt); e.healLeft -= a; e.hp = Math.min(100, e.hp + a); if (e.hp >= 100) e.healLeft = 0; }
      if (e.ai && !over) botThink(e, dt);
    }
  }
  overView = over ? [over.win, Math.max(0, Math.ceil((over.until-now)/1000))] : null;
  hostBroadcast(false);
}

// ================= Avatars sync =================
const _tgt = new V();
function syncAvatars(dt){
  for (const [id, e] of ents){
    if (id === myId) continue;
    let a = avatars.get(id);
    const bot = e.kind === 'b';
    if (!a || a.team !== e.team || a.bot !== bot){
      if (a) disposeAvatar(a.av);
      a = {av:makeAvatar(e.team, e.name, id, bot), team:e.team, bot, wasAlive:false, dieT:-1, last:new V(), speed:0, fwd:0, side:0, lastHp:e.hp, pitch:0};
      a.av.g.position.copy(e.pos); a.last.copy(e.pos); avatars.set(id, a);
    }
    const av = a.av;
    if (av.name !== e.name) relabel(av, e.name);
    setAvatarWeapon(av, (e.weapon|0) % NW);
    if (e.alive && !a.wasAlive){ av.g.position.copy(e.pos); a.last.copy(e.pos); a.np = null; av.body.rotation.set(0,0,0); a.dieT = -1; a.lastHp = e.hp; a.speed = 0; }
    if (!e.alive && a.wasAlive) a.dieT = 0;
    a.wasAlive = e.alive;
    if (e.alive){
      if (e.hp < a.lastHp - 1) av.flinch = 1;
      a.lastHp = e.hp;
      av.g.visible = !e.inv || Math.floor(now/120) % 2 === 0;
      if (av.label) av.label.visible = true;
      if (!a.np){ a.np = e.pos.clone(); a.nv = new V(); a.npT = now; }
      else if (!a.np.equals(e.pos)){ const ds = (now - a.npT) / 1000;
        if (ds > .008 && ds < .5 && a.np.distanceToSquared(e.pos) < 9){ const k2 = .55; a.nv.x += ((e.pos.x - a.np.x) / ds - a.nv.x) * k2; a.nv.z += ((e.pos.z - a.np.z) / ds - a.nv.z) * k2; a.nv.y = 0; if (a.nv.length() > 12) a.nv.setLength(12); } else a.nv.set(0, 0, 0);
        a.np.copy(e.pos); a.npT = now; }
      if (now - a.npT > 250) a.nv.multiplyScalar(Math.pow(.02, dt));
      const lead = isHost && bot ? 0 : Math.min(.1, (now - a.npT) / 1000);
      const tgt = _tgt.set(e.pos.x + a.nv.x * lead, e.pos.y, e.pos.z + a.nv.z * lead);
      av.g.position.lerp(tgt, Math.min(1, dt * (isHost && bot ? 40 : 16)));
      let dy = e.yaw - av.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      av.g.rotation.y += dy * Math.min(1, dt*14);
      if (dt > 0){
        const vx = (av.g.position.x - a.last.x) / dt, vz = (av.g.position.z - a.last.z) / dt, yaw = av.g.rotation.y;
        const f = -(vx*Math.sin(yaw) + vz*Math.cos(yaw)), sd = vx*Math.cos(yaw) - vz*Math.sin(yaw);
        const kk = Math.min(1, dt*8);
        a.speed += (Math.min(Math.hypot(vx, vz), 12) - a.speed) * kk; a.fwd += (f - a.fwd) * kk; a.side += (sd - a.side) * kk;
      }
      a.pitch += ((e.pitch || 0) - a.pitch) * Math.min(1, dt*12);
      a.slideK = (a.slideK || 0) + ((e.slide ? 1 : 0) - (a.slideK || 0)) * Math.min(1, dt*10);
      if (e.slide && !a.wasSlide && av.g.position.distanceTo(me.pos) < 25) playSlide(av.g.position.clone().setY(.1));
      a.wasSlide = !!e.slide;
      animateAvatar(av, {speed:a.speed, fwd:a.fwd, side:a.side, pitch:a.pitch, dt, slideK:a.slideK});
      { const si = Math.floor(av.phase / Math.PI); if (si !== a.stepIdx){ a.stepIdx = si; if (a.speed > 1.2 && av.g.position.distanceTo(me.pos) < 22) playStep(av.g.position.clone().setY(.05), Math.min(.9, .3 + a.speed/8), a.speed > 6); } }
      a.last.copy(av.g.position);
    } else if (a.dieT >= 0){
      a.dieT += dt; animateDeath(av, a.dieT, dt);
      if (av.label) av.label.visible = false;
      av.g.visible = a.dieT < 3;
    } else av.g.visible = false;
  }
  for (const [id, a] of avatars) if (!ents.has(id) || id === myId){ disposeAvatar(a.av); avatars.delete(id); }
}

// ================= HUD =================
let lastBoard = 0;
function updateBoard(){
  if (now - lastBoard < 300) return; lastBoard = now;
  const b = $('board'); b.textContent = '';
  for (const t of [0,1]){
    const h = document.createElement('div'); h.className = 'th ' + TEAM_CLS[t]; h.textContent = `${TEAM_NAME[t]} · ${score[t]}`; b.appendChild(h);
    const tbl = document.createElement('table');
    const list = [...ents.values()].filter(e => e.team === t).sort((x,y) => y.k - x.k || x.d - y.d).slice(0, 9);
    for (const e of list){
      const tr = document.createElement('tr'); if (e.id === myId) tr.className = 'me'; else if (e.kind === 'b') tr.className = 'bot';
      const n = document.createElement('td'); n.textContent = (e.alive ? '' : '✕ ') + e.name + (e.id === myId ? ' (sen)' : '');
      const k = document.createElement('td'); k.className = 'n'; k.textContent = e.k;
      const d = document.createElement('td'); d.className = 'n'; d.textContent = e.d;
      tr.append(n, k, d); tbl.appendChild(tr);
    }
    b.appendChild(tbl);
  }
}
// HUD writes are cached so the DOM (and its paint layers) only change when a value actually changes
const _hud = {};
const hudText = (id, v) => { const k = 't' + id; if (_hud[k] !== v){ _hud[k] = v; $(id).textContent = v; } };
const hudHTML = (id, v) => { const k = 'h' + id; if (_hud[k] !== v){ _hud[k] = v; $(id).innerHTML = v; } };
const hudStyle = (id, prop, v) => { const k = 's' + id + prop; if (_hud[k] !== v){ _hud[k] = v; $(id).style[prop] = v; } };
const hudClass = (id, cls, on) => { const k = 'c' + id + cls; if (_hud[k] !== on){ _hud[k] = on; $(id).classList.toggle(cls, on); } };
let stageH = 600;
function updateHud(){
  const W = WEAPONS[me.weapon], e = myEnt();
  const hp = e ? e.hp : 100, alive = isAlive();
  hudText('hpNum', String(Math.max(0, Math.ceil(hp))));
  hudStyle('hpFill', 'width', Math.max(0, Math.round(hp)) + '%');
  hudStyle('hpFill', 'background', hp > 50 ? '' : hp > 25 ? 'linear-gradient(90deg,#d9a531,#ffd166)' : 'linear-gradient(90deg,#c9372a,#ff6b55)');
  hudClass('hpBox', 'low', hp < 30 && alive);
  hudHTML('ammoNum', `${me.ammo[me.weapon]} <small${me.res[me.weapon] ? '' : ' class="empty"'}>/ ${me.res[me.weapon]}</small>`);
  { const show = alive && (me.stam < .995 || me.sprinting);
    hudClass('stamBox', 'on', show); hudClass('stamBox', 'low', me.exhausted);
    hudStyle('stamFill', 'transform', `scaleX(${me.stam.toFixed(3)})`); }
  { const out = alive && me.ammo[me.weapon] === 0 && me.res[me.weapon] === 0 && !me.reloading;
    hudStyle('ammoWarn', 'display', out ? 'block' : 'none');
    if (out){ const all = (me.loadout || [me.weapon]).every(w => me.ammo[w] + me.res[w] === 0);
      hudText('ammoWarn', all ? 'Mermin bitti · mühimmat kutusu ya da düşen kese bul' : 'Bu silahın mermisi bitti · silah değiştir'); } }
  hudClass('ammoNum', 'low', me.ammo[me.weapon] <= Math.ceil(W.mag * .25));
  hudText('fireMode', W.explosive ? 'PATLAYICI' : W.pellets > 1 ? 'SAÇMA' : W.auto ? 'OTO' : 'TEK');
  const reloadingNow = me.reloading && alive;
  hudStyle('reloadBar', 'visibility', reloadingNow ? 'visible' : 'hidden');
  if (reloadingNow) hudStyle('reloadFill', 'width', Math.round(Math.min(100, Math.max(0, (1 - (me.reloadEnd - now) / W.reload) * 100))) + '%');
  { const spr = curSpread();
    const gap = 4 + spr / Math.tan(camera.fov * Math.PI / 360) * (stageH / 2) + me.recoil * 6;
    const g = Math.min(80, gap).toFixed(0) + 'px';
    if (_hud.gap !== g){ _hud.gap = g; $('cross').style.setProperty('--g', g); } }
  hudText('wepName', W.name);
  if (_hud.slotW !== me.weapon + '|' + $('slots').childElementCount){ _hud.slotW = me.weapon + '|' + $('slots').childElementCount; document.querySelectorAll('#slots span').forEach(s => s.classList.toggle('on', +s.dataset.i === me.weapon)); }
  hudStyle('reloadTxt', 'display', reloadingNow ? 'block' : 'none');
  const scoped = alive && me.zoom && (W.scope || (W.optic && me.adsT > .82));
  hudStyle('scope', 'display', scoped ? 'block' : 'none');
  if (_hud.scopeKind !== (W.optic ? 'o' : 's')){ _hud.scopeKind = W.optic ? 'o' : 's'; $('scope').classList.toggle('optic', !!W.optic); }
  hudStyle('cross', 'display', scoped || me.adsT > .5 ? 'none' : 'block');
  viewRoot.visible = !scoped && alive;
  hudText('sc0', String(score[0])); hudText('sc1', String(score[1]));
  { const ov = !!overView; if (_hud.rt0 === undefined || (_hud.ovC && !ov)) _hud.rt0 = now; _hud.ovC = ov;
    if (!ov){ const sec = Math.max(0, Math.floor((now - _hud.rt0) / 1000)); hudText('tsClock', String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')); } }
  hudText('grN', String(me.gren)); hudText('mdN', String(me.med));
  hudClass('hpBox', 'heal', now - me.healFx < 1600);
  hudStyle('tsb0', 'width', Math.min(100, score[0] / Math.max(1, goalFor()) * 100) + '%'); hudStyle('tsb1', 'width', Math.min(100, score[1] / Math.max(1, goalFor()) * 100) + '%');
  hudText('goalTxt', MODE === 'dom' ? `${goalFor()} puanda biter` : `${goal} leşte biter`);
  updateZoneHud(alive);
  const showDeath = started && e && !e.alive && !overView;
  $('death').hidden = !showDeath;
  if (showDeath){
    const left = Math.max(1, Math.ceil(((me.deadAt || now) + 3000 - now) / 1000));
    $('deathT').textContent = `${left} saniye içinde yeniden doğacaksın`;
  }
  if (!!overView !== !!updateHud.wasOver){ updateHud.wasOver = !!overView; if (overView) playRoundEnd(overView[0] === (myEnt() ? myEnt().team : me.team)); }
  const ob = $('overB');
  if (overView){
    ob.style.display = 'block'; $('overT').textContent = `${TEAM_NAME[overView[0]]} kazandı!`;
    $('overT').style.color = overView[0] ? '#ff7a62' : '#6fb0ff';
    $('overS').textContent = `Yeni tur ${overView[1]} saniye içinde başlıyor`;
  } else ob.style.display = 'none';
  // hurt flash
  if (e){
    if (e.hp < me.prevHp - .5 && e.alive){ const h = $('hurt'); h.classList.add('on'); clearTimeout(updateHud.t); updateHud.t = setTimeout(() => h.classList.remove('on'), 90); sfx('hurt'); }
    me.prevHp = e.hp;
  }
}

await loadStep(71, 'Silah görselleri çekiliyor');
// ================= Settings & loadout =================
let sens = 1, muted = false;
// aim sensitivity multiplier, touch aim assist and auto-fire (saved on the device)
let adsSens = 1, aimAssist = true, autoFire = false;
try { const v = localStorage.getItem('cephe-adssens'); if (v !== null && isFinite(+v)) adsSens = Math.max(.2, Math.min(2, +v));
  if (localStorage.getItem('cephe-assist') === '0') aimAssist = false; if (localStorage.getItem('cephe-autofire') === '1') autoFire = true; } catch(e){}
function setAdsSens(v){ adsSens = v; try { localStorage.setItem('cephe-adssens', String(v)); } catch(e){}
  document.querySelectorAll('.adsIn').forEach(i => { if (+i.value !== Math.round(v*100)) i.value = Math.round(v*100); });
  document.querySelectorAll('.adsVal').forEach(el => el.textContent = v.toFixed(2)); }
function setAssist(on){ aimAssist = !!on; try { localStorage.setItem('cephe-assist', on ? '1' : '0'); } catch(e){} }
function setAutoFire(on){ autoFire = !!on; try { localStorage.setItem('cephe-autofire', on ? '1' : '0'); } catch(e){} }
try { const v = localStorage.getItem('cephe-sens'); if (v !== null && isFinite(+v)) sens = Math.max(.1, Math.min(3, +v)); } catch(e){}
function setSens(v){
  sens = v; try { localStorage.setItem('cephe-sens', String(v)); } catch(e){}
  document.querySelectorAll('.sensIn').forEach(i => { if (+i.value !== Math.round(v*100)) i.value = Math.round(v*100); });
  document.querySelectorAll('.sensVal').forEach(el => el.textContent = v.toFixed(2));
}
function setMuted(m){
  muted = m;
  if (master && actx) master.gain.setTargetAtTime(m ? 0 : volume, actx.currentTime, .03);
  document.querySelectorAll('.muteBtn').forEach(b => { b.setAttribute('aria-pressed', m); b.textContent = m ? 'Sesi aç' : 'Sesi kapat'; });
}
let loadout = [3, 0, 5];
try {
  const l = JSON.parse(localStorage.getItem('cephe-loadout') || 'null');
  if (Array.isArray(l) && l.length >= 1 && l.length <= 3 && l.every(x => Number.isInteger(x) && x >= 0 && x < NW)) loadout = [...new Set(l)];
} catch(e){}
function statBars(i){
  const W = WEAPONS[i];
  const dmg = Math.min(1, W.dmg * W.pellets / 130), rpm = Math.min(1, (60000 / W.rate) / 860), mob = Math.max(.05, Math.min(1, (W.move - .75) / .38));
  const range = W.scope ? 1 : W.explosive ? .8 : W.pellets > 1 ? .22 : Math.min(1, .3 + Math.max(0, 1 - W.spread * 25) * .65);
  return [['Hasar', dmg], ['Atış hızı', rpm], ['Menzil', range], ['Hareket', mob]];
}
// ---- weapon pictures for the loadout cards: each first-person model is rendered once (without arms)
const WEAPON_THUMBS = [], WEAPON_SIL = [];
// A small photo-studio environment: dim grey room with bright softboxes, so metal parts catch highlights
function studioEnvironment(){
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({color:new THREE.Color(.2, .21, .19), side:THREE.BackSide})));
  const panel = (w, h, x, y, z, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color:new THREE.Color(k, k, k * .96), side:THREE.DoubleSide}));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
  };
  panel(7, 3, 1, 6, 1.5, 7);      // overhead softbox
  panel(2.2, 7, 6, 1, 2, 5);      // camera-side strip
  panel(2.2, 7, -5, 1.5, -4, 4);  // back-left rim strip
  panel(2.2, 7, 5, 1.5, -5, 3.5); // back-right rim strip
  panel(6, 2, 0, -5, 2, 1.2);     // floor bounce
  const tex = pm.fromScene(es, .025).texture; pm.dispose();
  return tex;
}
function buildWeaponThumbs(){
  const wasLite = liteOn, prevExp = renderer.toneMappingExposure;
  let env = null, rt = null;
  const prevRT = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  try {
    if (wasLite) setLiteMaterials(false); // always photograph the full PBR materials
    const W2 = 768, H2 = 300; rt = new THREE.WebGLRenderTarget(W2, H2);
    rt.texture.encoding = THREE.sRGBEncoding;
    const ts = new THREE.Scene();
    env = studioEnvironment(); ts.environment = env;
    ts.add(new THREE.HemisphereLight(0xf2f4ff, 0x3a3428, .75));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.9); key.position.set(4, 5, 3); ts.add(key);
    const rimL = new THREE.DirectionalLight(0xcfe0ff, 1.9); rimL.position.set(-2, 3, -5); ts.add(rimL);
    const rimR = new THREE.DirectionalLight(0xffe2c4, 1.8); rimR.position.set(3, 2, -5); ts.add(rimR);
    const fill = new THREE.DirectionalLight(0xffffff, .7); fill.position.set(3, -2, 2); ts.add(fill);
    const cam = new THREE.PerspectiveCamera(22, W2 / H2, .01, 20);
    const buf = new Uint8Array(W2 * H2 * 4);
    renderer.setClearColor(0x000000, 0); renderer.toneMappingExposure = .95;
    views.forEach((v, i) => {
      // Object3D.clone JSON-copies userData; stash it so mesh references (magazine, PBR originals) are not serialized
      const saved = []; v.traverse(o => { saved.push([o, o.userData]); o.userData = {}; });
      const c = v.clone(true); saved.forEach(([o, u]) => { o.userData = u; }); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.traverse(o => o.layers.set(0));
      const drop = [], mats = [];
      c.traverse(o => {
        o.visible = true;
        if (o.name === 'vmArm' || (o.isMesh && (o.material === sleeveMat || o.material === gloveMat))){ drop.push(o); return; }
        if (o.isMesh && o.material && o.material.isMeshStandardMaterial){ o.material = o.material.clone(); o.material.envMapIntensity = 1.0; mats.push(o.material); }
      });
      drop.forEach(o => o.parent && o.parent.remove(o));
      ts.add(c); c.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(c), size = box.getSize(new V()), ctr = box.getCenter(new V());
      c.position.sub(ctr); c.updateMatrixWorld(true);
      const half = Math.max(size.y, size.z / cam.aspect) * .5;
      const dist = half / Math.tan(cam.fov * Math.PI / 360) * 1.16 + size.x * .5;
      cam.position.set(dist * .95, dist * .2, dist * .24); cam.lookAt(0, 0, 0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ts, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf);
      const buf2 = new Uint8Array(buf.length);
      { const h2 = Math.max(size.y, size.z / cam.aspect) * .5, d2 = h2 / Math.tan(cam.fov * Math.PI / 360) * 1.05 + size.x * .5;
        cam.position.set(-d2, 0, 0); cam.lookAt(0, 0, 0); renderer.clear(); renderer.render(ts, cam); renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf2); }
      ts.remove(c); mats.forEach(m => m.dispose());
      const big = document.createElement('canvas'); big.width = W2; big.height = H2;
      const g = big.getContext('2d'), img = g.createImageData(W2, H2);
      for (let y=0;y<H2;y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
      g.putImageData(img, 0, 0);
      const out = document.createElement('canvas'); out.width = 384; out.height = 150;
      const og = out.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(big, 0, 0, 384, 150);
      WEAPON_THUMBS[i] = out.toDataURL('image/png');
      { const sc = document.createElement('canvas'); sc.width = W2; sc.height = H2; const sg = sc.getContext('2d'), si = sg.createImageData(W2, H2), dd = si.data;
        for (let y=0;y<H2;y++){ const src = (H2 - 1 - y) * W2 * 4, dst = y * W2 * 4;
          for (let x=0;x<W2*4;x+=4){ const al = buf2[src+x+3]; if (!al) continue; const l = (buf2[src+x] + buf2[src+x+1] + buf2[src+x+2]) / 765, vv = 196 + 59 * Math.min(1, l * 1.7); dd[dst+x] = dd[dst+x+1] = dd[dst+x+2] = vv; dd[dst+x+3] = al; } }
        sg.putImageData(si, 0, 0); const so = document.createElement('canvas'); so.width = 288; so.height = 112; const sog = so.getContext('2d'); sog.imageSmoothingQuality = 'high'; sog.drawImage(sc, 0, 0, 288, 112); WEAPON_SIL[i] = so.toDataURL('image/png'); }
    });
  } catch(e){ WEAPON_THUMBS.length = 0; }
  try { renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevAlpha); } catch(e){}
  renderer.toneMappingExposure = prevExp;
  if (rt) rt.dispose(); if (env) env.dispose();
  if (wasLite) setLiteMaterials(true);
}

// team screen art: a squad of three soldiers per side, rendered once with the real avatars
function buildTeamGroups(){
  const wasLite = liteOn, prevExp = renderer.toneMappingExposure;
  const prevRT = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  let env = null, rt = null;
  try {
    if (wasLite) setLiteMaterials(false);
    const W2 = 680, H2 = 860; rt = new THREE.WebGLRenderTarget(W2, H2); rt.texture.encoding = THREE.sRGBEncoding;
    const ts = new THREE.Scene(); env = studioEnvironment(); ts.environment = env;
    ts.add(new THREE.HemisphereLight(0xf2f4ff, 0x2a2620, .45));
    const buf = new Uint8Array(W2 * H2 * 4);
    renderer.setClearColor(0x000000, 0); renderer.toneMappingExposure = 1.1;
    [0, 1].forEach(t => {
      const key = new THREE.DirectionalLight(0xfff2e4, 2.6); key.position.set(t ? 2.5 : -2.5, 3.2, -3.5); ts.add(key);
      const rim = new THREE.DirectionalLight(t ? 0xff5a30 : 0x3f8cff, 5.5); rim.position.set(t ? -3 : 3, 2.6, 3.5); ts.add(rim);
      const rim2 = new THREE.DirectionalLight(t ? 0xff9a70 : 0x9cc8ff, 2.2); rim2.position.set(t ? 3 : -3, 1.5, 3); ts.add(rim2);
      const cam = new THREE.PerspectiveCamera(30, W2 / H2, .05, 30);
      const side = 1;
      const squad = [[0, 0, 0, .3 * side, t ? 2 : 3]];   // one soldier, close up, turned toward the middle of the screen
      const avs = squad.map(([x, y, z, ry, w], k) => {
        const av = makeAvatar(t, null, (t ? 'grpR' : 'grpB') + k, false);
        scene.remove(av.g); ts.add(av.g); setAvatarWeapon(av, w);
        av.g.position.set(x, y, z); av.g.rotation.y = ry;
        animateAvatar(av, {speed:0, fwd:0, side:0, pitch:-.42, dt:.016}); av.g.updateMatrixWorld(true); return av;
      });
      cam.fov = 32; cam.updateProjectionMatrix(); cam.position.set(-.18 * side, 1.12, -2.55); cam.lookAt(-.04 * side, 1.27, 0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ts, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf);
      avs.forEach(av => { ts.remove(av.g); av.owned.forEach(g => g.dispose()); });
      ts.remove(key); ts.remove(rim); ts.remove(rim2);
      const c = document.createElement('canvas'); c.width = W2; c.height = H2;
      const g = c.getContext('2d'), img = g.createImageData(W2, H2);
      for (let y=0;y<H2;y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
      g.putImageData(img, 0, 0);
      const url = c.toDataURL('image/png');
      document.querySelectorAll(`img[data-group="${t}"]`).forEach(im => im.src = url);
    });
  } catch(e){ console.warn('team groups skipped', e); }
  try { renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevAlpha); } catch(e){}
  renderer.toneMappingExposure = prevExp;
  if (rt) rt.dispose(); if (env) env.dispose();
  if (wasLite) setLiteMaterials(true);
}
// team cards on the play screen: a studio portrait of one soldier from each side, holding his rifle
function buildTeamPortraits(){
  const wasLite = liteOn, prevExp = renderer.toneMappingExposure;
  const prevRT = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  let env = null, rt = null;
  try {
    if (wasLite) setLiteMaterials(false);
    const W2 = 420, H2 = 480; rt = new THREE.WebGLRenderTarget(W2, H2); rt.texture.encoding = THREE.sRGBEncoding;
    const ts = new THREE.Scene(); env = studioEnvironment(); ts.environment = env;
    ts.add(new THREE.HemisphereLight(0xf2f4ff, 0x3a3428, .7));
    const key = new THREE.DirectionalLight(0xfff1e0, 2.4); key.position.set(-3, 4, -4); ts.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 2.2); rim.position.set(3, 3, 4); ts.add(rim);
    const cam = new THREE.PerspectiveCamera(26, W2 / H2, .05, 20);
    const buf = new Uint8Array(W2 * H2 * 4);
    renderer.setClearColor(0x000000, 0); renderer.toneMappingExposure = 1.15;
    [0, 1].forEach(t => {
      const av = makeAvatar(t, null, t ? 'portraitR7' : 'portraitB2', false);
      scene.remove(av.g); ts.add(av.g);
      setAvatarWeapon(av, t ? 6 : 3);
      av.g.rotation.y = t ? .5 : -.5;
      animateAvatar(av, {speed:0, fwd:0, side:0, pitch:.04, dt:.016});
      av.g.updateMatrixWorld(true);
      cam.position.set(t ? -.6 : .6, 1.55, -3.0); cam.lookAt(0, 1.33, 0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ts, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf);
      ts.remove(av.g); av.owned.forEach(g => g.dispose());
      const c = document.createElement('canvas'); c.width = W2; c.height = H2;
      const g = c.getContext('2d'), img = g.createImageData(W2, H2);
      for (let y=0;y<H2;y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
      g.putImageData(img, 0, 0);
      const url = c.toDataURL('image/png');
      document.querySelectorAll(`img[data-portrait="${t}"]`).forEach(im => im.src = url);
    });
  } catch(e){ console.warn('team portraits skipped', e); }
  try { renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevAlpha); } catch(e){}
  renderer.toneMappingExposure = prevExp;
  if (rt) rt.dispose(); if (env) env.dispose();
  if (wasLite) setLiteMaterials(true);
}
let wFocus = null;
const wTag = W => W.explosive ? 'PATLAYICI' : W.pellets > 1 ? 'SAÇMA' : W.scope ? 'DÜRBÜNLÜ' : W.auto ? 'OTOMATİK' : 'TEK ATIŞ';
function renderWeaponDetail(){
  const i = wFocus ?? loadout[0] ?? 0, W = WEAPONS[i];
  document.querySelectorAll('.loadout').forEach(lo => {
    let d = lo.querySelector('.wdetail');
    if (!d){ d = document.createElement('div'); d.className = 'wdetail'; d.setAttribute('aria-live', 'polite'); lo.appendChild(d); }
    d.innerHTML = `<b>${W.name}<small>${wTag(W)} · ${W.mag} mermi · şarjör ${(W.reload / 1000).toFixed(1)} sn</small></b>` + statBars(i).map(([n, v]) => `<span>${n}<i><em style="width:${Math.round(v*100)}%"></em></i></span>`).join('');
  });
}
function renderLoadout(){
  document.querySelectorAll('.wgrid').forEach(g => { g.textContent = '';
  WEAPONS.forEach((W, i) => {
    const b = document.createElement('button'); b.className = 'wcard'; b.type = 'button';
    const idx = loadout.indexOf(i); b.setAttribute('aria-pressed', idx >= 0);
    b.setAttribute('aria-label', `${W.name}${idx >= 0 ? ', ' + (idx + 1) + '. silah' : ''}`);
    b.innerHTML = `<span class="wslot">${idx >= 0 ? idx + 1 : ''}</span><span class="wthumb">${WEAPON_THUMBS[i] ? `<img src="${WEAPON_THUMBS[i]}" alt="">` : ''}<span class="wtag">${wTag(W)}</span></span><span class="wname"><b>${W.name}</b></span>`;
    b.onclick = () => { wFocus = i; toggleWeapon(i); };
    b.onpointerenter = b.onfocus = () => { if (wFocus !== i){ wFocus = i; renderWeaponDetail(); } };
    g.appendChild(b);
  }); });
  renderWeaponDetail();
  document.querySelectorAll('.loadCount').forEach(el => el.textContent = `${loadout.length}/3`);
  document.querySelectorAll('.loadout').forEach(lo => {
    let st = lo.querySelector('.slotStrip');
    if (!st){ st = document.createElement('div'); st.className = 'slotStrip'; const h = lo.querySelector('h3'); h.after(st); }
    st.innerHTML = [0, 1, 2].map(k => { const w = loadout[k]; return w === undefined
      ? `<span class="ss empty"><i>${k + 1}</i><b>Boş</b></span>`
      : `<span class="ss"><i>${k + 1}</i>${WEAPON_THUMBS[w] ? `<img src="${WEAPON_THUMBS[w]}" alt="">` : ''}<b>${WEAPONS[w].name}</b></span>`; }).join('');
  });
  document.querySelectorAll('.arsMiniSlots').forEach(el => el.innerHTML = [0, 1, 2].map(k => { const w = loadout[k]; return w === undefined ? `<span class="empty"><i>${k + 1}</i>Boş</span>` : `<span><i>${k + 1}</i>${WEAPON_THUMBS[w] ? `<img src="${WEAPON_THUMBS[w]}" alt="">` : ''}${WEAPONS[w].name}</span>`; }).join(''));
  if (typeof renderArsenal === 'function' && $('arsO') && !$('arsO').hidden) renderArsenal();
  const names = loadout.map(i => WEAPONS[i].name).join(', ');
  $('navLoad').textContent = `${loadout.length} silah seçili`;
  $('homeLoadout').textContent = `Silahların: ${names}`;
}






// ---- the screen never turns: lock to landscape where the browser allows it (installed app / full screen);
// elsewhere the page itself is drawn sideways while the phone is held upright
(function landscapeOnly(){
  const tryLock = () => { try { const o = screen.orientation; if (o && o.lock){ const p = o.lock('landscape'); if (p && p.catch) p.catch(() => {}); } } catch(e){} };
  ['pointerdown', 'touchend', 'click'].forEach(ev => addEventListener(ev, tryLock, {passive:true}));
  document.addEventListener('fullscreenchange', tryLock); document.addEventListener('webkitfullscreenchange', tryLock);
  tryLock();
  const q = window.__rotQ || matchMedia('(orientation: portrait) and (pointer: coarse)');
  const apply = () => { document.body.classList.toggle('rot', q.matches); if (started && typeof resetTouches === 'function') resetTouches(); setTimeout(() => dispatchEvent(new Event('resize')), 60); };
  try { q.addEventListener('change', apply); } catch(e){ q.addListener(apply); }
  document.body.classList.toggle('rot', q.matches);
})();
// ---- mobile: keep the screen awake in a match, quiet the audio in the background,
// install / home-screen prompts, long-press menus off, offline cache when served over http(s)
(function mobilePolish(){
  // screen wake lock: the phone does not dim or lock mid-fight
  let wl = null;
  const wantWake = () => started && !document.hidden;
  async function wake(){ try { if (!('wakeLock' in navigator) || wl || !wantWake()) return; wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } catch(e){ wl = null; } }
  function sleep(){ try { if (wl) wl.release(); } catch(e){} wl = null; }
  setInterval(() => { if (wantWake()) wake(); else if (wl && !started) sleep(); }, 3000);
  ['touchstart', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { if (wantWake()) wake(); }, {passive:true}));
  // background: stop the audio clock (saves battery, avoids a burst of queued sounds on return)
  let audioWasOn = false;
  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden){ sleep(); if (typeof actx !== 'undefined' && actx && actx.state === 'running'){ audioWasOn = true; actx.suspend(); } }
      else { if (audioWasOn && typeof actx !== 'undefined' && actx){ actx.resume(); audioWasOn = false; } wake(); }
    } catch(e){}
  });
  addEventListener('pagehide', () => { sleep(); try { if (typeof actx !== 'undefined' && actx && actx.state === 'running') actx.suspend(); } catch(e){} });
  // long-press anywhere on a phone must not pop the system menu over the game
  document.addEventListener('contextmenu', e => { if (touchOn && !(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) e.preventDefault(); });
  // inside the store app (Capacitor) there is nothing to install and no home-screen hint
  const NATIVE_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  // Android / desktop Chrome: offer "install" once the browser allows it
  let deferred = null; const ib = $('installBtn');
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (ib && !NATIVE_APP) ib.hidden = false; });
  addEventListener('appinstalled', () => { deferred = null; if (ib) ib.hidden = true; });
  if (ib) ib.onclick = async () => { if (!deferred) return; ib.hidden = true; try { deferred.prompt(); await deferred.userChoice; } catch(e){} deferred = null; };
  // iPhone / iPad Safari cannot go full screen from a page: suggest the home-screen app once
  const ios = /iP(hone|od|ad)/.test(navigator.platform || '') || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) || /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = navigator.standalone || (matchMedia && matchMedia('(display-mode: standalone)').matches);
  let seen = false; try { seen = localStorage.getItem('cephe-ioshint') === '1'; } catch(e){}
  if (ios && !standalone && !seen && !NATIVE_APP && $('iosHint')){ $('iosHint').hidden = false;
    $('iosHintX').onclick = () => { $('iosHint').hidden = true; try { localStorage.setItem('cephe-ioshint', '1'); } catch(e){} }; }
  // offline cache (only when the game is served from a web address, not opened as a local file)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel="manifest"]')){
    const reg = () => navigator.serviceWorker.register('sw.js').catch(() => {});
    if (document.readyState === 'complete') reg(); else addEventListener('load', reg);
  }
})();
// ---- team select screen: two sides split by a slanted line; picking a side (or the countdown) continues to the play panel
let tmTimer = 0, tmLeft = 0, tmFrom = 'home';
function tmPaint(){ const t = me.team === 1 ? 1 : 0;
  document.querySelectorAll('#teamO .tmSide').forEach(b => b.setAttribute('aria-pressed', +b.dataset.team === t));
  const c = $('teamChip'); c.classList.toggle('b', t === 0); c.classList.toggle('r', t === 1); $('teamChipName').textContent = t ? 'KIZIL TİM' : 'MAVİ TİM'; }
function tmTick(){ tmLeft--; $('tmCount').textContent = Math.max(0, tmLeft); $('tmArc').style.strokeDashoffset = (106.8 * (1 - Math.max(0, tmLeft) / 10)).toFixed(1);
  if (tmLeft <= 0) tmChoose(me.team === 1 ? 1 : 0); }
function openTeam(from){
  tmFrom = from || 'home'; tmPaint();
  const sh = (typeof SET_SHOTS !== 'undefined' && SET_SHOTS[0]) || ''; if (sh) document.querySelectorAll('#teamO .tmBg').forEach(e => e.style.setProperty('--shot', `url(${sh})`));
  tmLeft = 10; $('tmCount').textContent = tmLeft; const arc = $('tmArc'); arc.style.transition = 'none'; arc.style.strokeDashoffset = 0; void arc.getBoundingClientRect(); arc.style.transition = '';
  clearInterval(tmTimer); tmTimer = setInterval(tmTick, 1000);
  $('teamO').hidden = false; const cur = document.querySelector(`#teamO .tmSide[data-team="${me.team === 1 ? 1 : 0}"]`); if (cur) cur.focus({preventScroll:true, focusVisible:false});
}
function closeTeam(){ clearInterval(tmTimer); $('teamO').hidden = true; }
function tmChoose(t){
  const src = document.querySelector(`.teamPick .team[data-team="${t}"]`); if (src) src.click(); else me.team = t;
  tmPaint(); clearInterval(tmTimer);
  setTimeout(() => { closeTeam(); const h = $('hostBtn'); if (h) h.focus({preventScroll:true}); }, 220);
}
document.querySelectorAll('#teamO .tmSide').forEach(b => {
  b.onclick = () => { initAudio(); tmChoose(+b.dataset.team); };
});
$('teamBack').onclick = () => { closeTeam(); if (tmFrom === 'home') showPanel('home'); };
$('teamChip').onclick = () => openTeam('play');
['hostBtn', 'joinBtn'].forEach(id => $(id).addEventListener('click', () => { if (!$('teamO').hidden) closeTeam(); }));
tmPaint();
document.querySelectorAll('#menu [data-go="play"]').forEach(b => b.addEventListener('click', () => openTeam('home')));
// ---- how-to-play screen: themed like the settings; the touch list reuses the real button icons
const HELP_TOUCH = [['#stickBase', 'Sol başparmak', 'Sol tarafa dokunup sürükle: yürü. Sonuna kadar itersen koşarsın.'], ['look', 'Sağ başparmak', 'Sağ tarafta sürükle: etrafına bak, nişan al.'],
  ['#tFire', 'Ateş', 'Basılı tut: ateş et. Basılıyken sürükleyerek nişan da alırsın.'], ['#tAim', 'Nişan', 'Nişan / dürbün aç-kapat.'],
  ['#tGren', 'Bomba', 'El bombası at. Her doğuşta 2 tane.'], ['#tMed', 'Sağlık', 'İlk yardım çantası 50 can doldurur. Her doğuşta 2 tane.'],
  ['#tSlide', 'Kay', 'Koşarken eğilip kay.'], ['#tJump', 'Zıpla', 'Engelin üstünden atla.'],
  ['#tReload', 'Şarjör', 'Şarjör değiştir.'], ['#tSprint', 'Koş', 'Sürekli koşmayı aç-kapat.'],
  ['#tSwap', 'Silah kartı', 'Sol yarısı önceki, sağ yarısı sonraki silah.'], ['#tSet', 'Duraklat', 'Ayarlar, oda ve ana menü.']];
const HELP_STICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.6" fill="currentColor"/></svg>', HELP_LOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5V6.5a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7.5-6.5 7.5-2.5 0-4.2-1.2-5.5-3.2L3.8 14a1.5 1.5 0 0 1 2.4-1.8L9 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
(function buildHelpTouch(){
  const box = $('helpTouch'); if (!box) return;
  box.innerHTML = HELP_TOUCH.map(([src, t, d]) => {
    let ic = src === 'look' ? HELP_LOOK : src === '#stickBase' ? HELP_STICK : '';
    if (!ic){ const sv = document.querySelector(`#touchUI ${src} svg`); ic = sv ? sv.outerHTML : ''; }
    return `<div class="hRow"><span class="hIc">${ic}</span><span class="hTx"><b>${t}</b><small>${d}</small></span></div>`; }).join('');
})();
function helpTab(p){ $('helpO').dataset.tab = p; document.querySelectorAll('#helpO .setTab').forEach(b => b.setAttribute('aria-selected', b.dataset.p === p)); document.querySelectorAll('#helpO .setPane').forEach(el => el.hidden = el.dataset.p !== p); }
function openHelp(tab){
  const bw = document.querySelector('.bindWrap'); if (bw && bw.parentNode !== $('helpKeys')) $('helpKeys').appendChild(bw);
  const img = $('helpPrevImg'), sh = (typeof SET_SHOTS !== 'undefined' && (SET_SHOTS[1] || SET_SHOTS[0])) || MAP_THUMBS[0]; if (sh && img.getAttribute('src') !== sh) img.src = sh;
  helpTab(tab || 'basic'); renderBinds(); $('helpO').hidden = false; $('helpBack').focus({preventScroll:true, focusVisible:false});
}
function closeHelp(){ bindWait = null; $('helpO').hidden = true; const b = document.querySelector('#menu:not([hidden]) [data-go="help"]'); if (b) b.focus({preventScroll:true}); }
$('helpBack').onclick = closeHelp;
document.querySelectorAll('#helpO .setTab').forEach(b => b.onclick = () => helpTab(b.dataset.p));
// ---- settings screen: every control drives the original setting buttons, so the game logic stays in one place
const SET_SRC = '#menu [data-panel="settings"]';
const Q_NAMES = ['DÜŞÜK', 'ORTA', 'YÜKSEK', 'ULTRA'], Q_FILTER = ['blur(1.4px) saturate(.75) brightness(.92)', 'blur(.5px) saturate(.9)', 'none', 'contrast(1.08) saturate(1.12)'];
let setReturn = false;
const SET_SHOTS = [...document.querySelectorAll('.ldShot')].map(e => (e.style.backgroundImage.match(/url\(["']?(.*?)["']?\)$/) || [])[1]).filter(Boolean);
function pxState(){
  const o = $('setO'); if (!o) return;
  o.querySelectorAll('.pxSel').forEach(sl => { const on = document.querySelector(`${SET_SRC} [data-${sl.dataset.src}][aria-pressed="true"]`); if (on) sl.value = on.dataset[sl.dataset.src]; });
  o.querySelectorAll('.pxTgl').forEach(t => { const k = t.dataset.src; let v;
    if (k === 'sound') v = !muted; else if (k === 'assist') v = aimAssist; else if (k === 'autofire') v = autoFire; else { const b = document.querySelector(`${SET_SRC} [data-${k}="1"]`); v = !!b && b.getAttribute('aria-pressed') === 'true'; }
    t.setAttribute('aria-checked', v); });
  o.querySelectorAll('.volVal').forEach(e => e.textContent = Math.round(volume * 100));
  const img = $('setPrevImg'), th = SET_SHOTS[0] || MAP_THUMBS[typeof mapId === 'number' ? mapId : 0] || MAP_THUMBS[0];
  if (th && img.getAttribute('src') !== th) img.src = th;
  img.style.filter = Q_FILTER[quality] || 'none'; $('setPrevQ').textContent = Q_NAMES[quality] || '';
}
function setTab(p){ $('setO').dataset.tab = p; document.querySelectorAll('#setO .setTab').forEach(b => b.setAttribute('aria-selected', b.dataset.p === p)); document.querySelectorAll('#setO .setPane').forEach(el => el.hidden = el.dataset.p !== p); }
function openSettings(){ setTab('gfx'); pxState(); $('setO').hidden = false; document.querySelectorAll('#setO input[type=range]').forEach(fillRange); $('setBack').focus({preventScroll:true, focusVisible:false}); }
function closeSettings(){ $('setO').hidden = true; const b = document.querySelector('#menu:not([hidden]) [data-go="settings"]'); if (b) b.focus({preventScroll:true}); }
$('setBack').onclick = closeSettings;
document.querySelectorAll('#setO .setTab').forEach(b => b.onclick = () => setTab(b.dataset.p));
document.querySelectorAll('#setO .pxSel').forEach(sl => sl.onchange = () => { initAudio(); const b = document.querySelector(`${SET_SRC} [data-${sl.dataset.src}="${sl.value}"]`); if (b) b.click(); pxState(); });
document.querySelectorAll('#setO .pxTgl').forEach(t => t.onclick = () => { initAudio(); const k = t.dataset.src, on = t.getAttribute('aria-checked') === 'true';
  if (k === 'sound') setMuted(on); else if (k === 'assist') setAssist(!on); else if (k === 'autofire') setAutoFire(!on); else { const b = document.querySelector(`${SET_SRC} [data-${k}="${on ? 0 : 1}"]`); if (b) b.click(); }
  pxState(); });
document.querySelectorAll('#setO .volIn').forEach(i => i.addEventListener('input', pxState));
$('setTEdit').onclick = () => { $('setO').hidden = true; setReturn = true; openTouchEditor(); };
$('setKeys').onclick = () => { closeSettings(); openHelp('keys'); };
$('nameIn').addEventListener('input', () => { try { localStorage.setItem('cephe-name', cleanName($('nameIn').value)); } catch(e){} });
try { const nm = localStorage.getItem('cephe-name'); if (nm){ me.name = cleanName(nm); $('nameIn').value = me.name; } } catch(e){}
$('setReset').onclick = () => {
  initAudio();
  const click = (k, v) => { const b = document.querySelector(`${SET_SRC} [data-${k}="${v}"]`); if (b) b.click(); };
  click('q', MOBILE ? 0 : detectQuality()); click('atm', 0); click('perf', 1); click('fps', 0); click('music', 1); click('touchset', MOBILE ? 1 : 0);
  setSens(1); setAdsSens(1); setAssist(true); setAutoFire(false); setVolume(.8); setMuted(false);
  document.querySelectorAll('#setO input[type=range]').forEach(fillRange); pxState();
};
// ---- weapon select screen: categories, cards, details with stats and built-in equipment
const ARS_CATS = [['TÜFEK', [3, 4]], ['MAKİNELİ', [2, 6]], ['KESKİN NİŞANCI', [7]], ['POMPALI', [5]], ['TABANCA', [0, 1]], ['PATLAYICI', [8]]];
const ARS_SUB = ['Yarı otomatik tabanca', 'Yüksek kalibre tabanca', 'Hafif makineli tüfek', 'Otomatik piyade tüfeği', 'Optikli muharebe tüfeği', 'Pompalı av tüfeği', 'Ağır makineli tüfek', 'Sürgülü keskin nişancı tüfeği', 'Omuzdan atılan roketatar'];
const EQ_DEF = [['scope', 'Dürbün'], ['dot', 'Nişangah'], ['mag', 'Şarjör'], ['grip', 'Tutamak'], ['stock', 'Dipçik']];
const EQ_ICON = {"scope": "<svg viewBox=\"0 0 24 24\"><rect x=\"5\" y=\"8.5\" width=\"12\" height=\"5\" rx=\"2.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M17 9.5l3-1.5v6l-3-1.5M3 11h2M9 13.5V16M13 13.5V16M7.5 16h7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "dot": "<svg viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"7\" width=\"16\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"12\" r=\".9\" fill=\"currentColor\"/><path d=\"M6 17v2.5h12V17\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "mag": "<svg viewBox=\"0 0 24 24\"><path d=\"M8.5 3.5h6l1.2 6.5-1.2 10.5h-5l-1-10.5z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9.6 7h4.6M9.8 10.5h4.4M9.7 14h4.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "grip": "<svg viewBox=\"0 0 24 24\"><path d=\"M5 5h14v3H5zM9.5 8l-1 11.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L14.5 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M10.2 12h3.6M10 15.5h3.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "stock": "<svg viewBox=\"0 0 24 24\"><path d=\"M3 9h7l9 -2.5v8.5l-4 1.5H11L8 13H3z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14 8v8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"};
const EQ_HAS = [['dot', 'mag'], ['dot', 'mag'], ['dot', 'mag', 'stock'], ['dot', 'mag', 'grip', 'stock'], ['scope', 'mag', 'stock'], ['dot', 'stock'], ['dot', 'mag', 'grip', 'stock'], ['scope', 'mag', 'stock'], ['scope', 'grip']];
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let arsCat = 0, arsSel = 3;
const arsCatOf = i => Math.max(0, ARS_CATS.findIndex(c => c[1].includes(i)));
function arsStats(i){
  const W = WEAPONS[i], H = HANDLING[i];
  const dmg = Math.min(100, Math.round(Math.sqrt(W.dmg * W.pellets / 130) * 100));
  const rate = Math.max(3, Math.min(100, Math.round(60000 / W.rate / 860 * 100)));
  const ctl = Math.max(5, Math.round((1 - Math.min(1, H.rv / .1)) * 100));
  const rng = Math.round(statBars(i)[2][1] * 100);
  return [['HASAR', dmg, dmg], ['ATIŞ HIZI', rate, rate], ['KONTROL', ctl, ctl], ['MENZİL', rng, rng], ['MERMİ', Math.min(100, Math.round(W.mag / 80 * 100)), `${W.mag} / ${H.res}`]];
}
function renderArsenal(){
  const o = $('arsO'); if (!o) return;
  const cats = $('arsCats'), list = $('arsList'), det = $('arsDet');
  cats.innerHTML = ARS_CATS.map(([n, ws], k) => { const sil = WEAPON_SIL[ws[0]];
    return `<button class="arsCat" role="tab" type="button" data-c="${k}" aria-selected="${k === arsCat}"><span class="ci"${sil ? ` style="--m:url(${sil})"` : ''}></span><span>${n}</span></button>`; }).join('');
  cats.querySelectorAll('.arsCat').forEach(b => b.onclick = () => { arsCat = +b.dataset.c; if (!ARS_CATS[arsCat][1].includes(arsSel)) arsSel = ARS_CATS[arsCat][1][0]; renderArsenal(); });
  list.innerHTML = ARS_CATS[arsCat][1].map(i => { const k = loadout.indexOf(i);
    return `<button class="arsCard${k >= 0 ? ' eq' : ''}" role="option" type="button" data-w="${i}" aria-selected="${i === arsSel}">${WEAPON_THUMBS[i] ? `<img src="${WEAPON_THUMBS[i]}" alt="">` : ''}<b>${WEAPONS[i].name}</b><span class="ck">${k >= 0 ? k + 1 : ''}${CHECK_SVG}</span></button>`; }).join('');
  list.querySelectorAll('.arsCard').forEach(b => { b.onclick = () => { arsSel = +b.dataset.w; renderArsenal(); }; b.ondblclick = () => arsPick(); });
  const i = arsSel, W = WEAPONS[i], k = loadout.indexOf(i);
  let note = k >= 0 ? `${k + 1}. silahın. Oyunda ${k + 1} tuşuyla eline alırsın.` : 'Seçince silahlarına eklenir (en fazla 3).';
  if (k < 0 && loadout.length >= 3){ let r = started ? loadout.indexOf(me.weapon) : -1; if (r < 0) r = loadout.length - 1; note = `3 silahın dolu: seçersen ${WEAPONS[loadout[r]].name} ile değişir.`; }
  if (k >= 0 && loadout.length === 1) note = 'En az bir silah seçili kalmalı.';
  det.innerHTML = `<div class="adHead"><h3>${W.name}</h3><p>${ARS_SUB[i]}</p></div>
    <div class="adImg">${WEAPON_THUMBS[i] ? `<img src="${WEAPON_THUMBS[i]}" alt="${W.name}">` : ''}</div>
    <div class="adStats">${arsStats(i).map(([n, v, t]) => `<span>${n}</span><i><em style="width:${v}%"></em></i><b>${t}</b>`).join('')}</div>
    <div class="adEq"><h4>DONANIM</h4><div class="adEqRow">${EQ_DEF.map(([key, lab]) => `<div class="${EQ_HAS[i].includes(key) ? '' : 'off'}"><span>${EQ_ICON[key]}</span>${lab}</div>`).join('')}</div></div>
    <div class="adFoot"><p class="loadNote">${note}</p><button class="adPick${k >= 0 ? ' out' : ''}" type="button" id="adPick"${k >= 0 && loadout.length === 1 ? ' disabled' : ''}>${k >= 0 ? 'ÇIKAR' : 'SEÇ'}</button></div>`;
  $('adPick').onclick = arsPick;
  $('arsSlots').innerHTML = [0, 1, 2].map(n => { const w = loadout[n]; return w === undefined
    ? `<span class="arsSlot empty"><i>${n + 1}</i><b>Boş</b></span>`
    : `<button class="arsSlot${w === arsSel ? ' on' : ''}" type="button" data-w="${w}"><i>${n + 1}</i>${WEAPON_THUMBS[w] ? `<img src="${WEAPON_THUMBS[w]}" alt="">` : ''}<b>${WEAPONS[w].name}</b></button>`; }).join('');
  $('arsSlots').querySelectorAll('button').forEach(b => b.onclick = () => { arsSel = +b.dataset.w; arsCat = arsCatOf(arsSel); renderArsenal(); });
}
function arsPick(){ const i = arsSel, k = loadout.indexOf(i); if (k >= 0 && loadout.length === 1) return; toggleWeapon(i); renderArsenal(); }
function openArsenal(){
  arsSel = started && loadout.includes(me.weapon) ? me.weapon : (loadout[0] ?? 3); arsCat = arsCatOf(arsSel);
  renderArsenal(); $('arsO').hidden = false; $('arsBack').focus({preventScroll:true, focusVisible:false});
}
function closeArsenal(){ $('arsO').hidden = true; const b = document.querySelector('#lobbyO:not([hidden]) .arsOpen, #menu:not([hidden]) [data-go="arsenal"]'); if (b) b.focus({preventScroll:true}); }
$('arsBack').onclick = closeArsenal;
document.querySelectorAll('.arsOpen, .arsMiniSlots').forEach(b => b.onclick = () => { initAudio(); openArsenal(); });
function toggleWeapon(i){
  let replaced = null;
  const k = loadout.indexOf(i), note = {set textContent(t){ document.querySelectorAll('.loadNote').forEach(el => el.textContent = t); }};
  if (k >= 0){
    if (loadout.length === 1){ note.textContent = 'En az bir silah seçili kalmalı.'; return; }
    loadout.splice(k, 1);
  } else {
    if (loadout.length >= 3){
      // full: swap out the weapon in your hands (in a match) or the last slot, instead of refusing
      let r = started ? loadout.indexOf(me.weapon) : -1; if (r < 0) r = loadout.length - 1;
      replaced = WEAPONS[loadout[r]].name; loadout[r] = i;
    } else loadout.push(i);
  }
  try { localStorage.setItem('cephe-loadout', JSON.stringify(loadout)); } catch(e){}
  applyLoadout();
  if (started && isAlive() && k < 0) selectWeapon(i);   // a weapon picked mid-match goes straight into your hands
  note.textContent = (replaced ? `${replaced} yerine ${WEAPONS[i].name} alındı. ` : '') + (started ? 'Silahın hemen değişti. 1, 2 ve 3 tuşlarıyla geçiş yaparsın.' : 'Seçimin kaydedildi. Oyunda 1, 2 ve 3 tuşlarıyla geçiş yaparsın.');
  renderLoadout();
}
function renderSlots(){
  _hud.slotW = null;
  $('slots').innerHTML = me.loadout.map((w, k) => `<span data-i="${w}" title="${WEAPONS[w].name}">${k+1}<small>${WEAPONS[w].short}</small></span>`).join('');
}
function applyLoadout(){
  me.loadout = loadout.slice(); renderSlots();
  if (!me.loadout.includes(me.weapon)){ const w = me.loadout[0]; me.weapon = -1; selectWeapon(w); }
}
function selectSlot(k){ if (me.loadout && k < me.loadout.length) selectWeapon(me.loadout[k]); }

// range sliders paint their filled part from a CSS variable (WebKit has no native progress fill)
const fillRange = el => { const mn = +el.min || 0, mx = +el.max || 100; el.style.setProperty('--fill', ((el.value - mn) / (mx - mn) * 100).toFixed(1) + '%'); };
document.addEventListener('input', e => { if (e.target && e.target.matches && e.target.matches('input[type=range]')) fillRange(e.target); });
function showPanel(name){
  if (name === 'arsenal'){ openArsenal(); return; }
  if (name === 'settings'){ openSettings(); return; }
  if (name === 'help'){ openHelp(); return; }
  document.querySelectorAll('#menu [data-panel]').forEach(p => p.hidden = p.dataset.panel !== name);
  if (name === 'arsenal') renderLoadout();
  if (name === 'settings') document.querySelectorAll('#menu input[type=range]').forEach(fillRange);
  const first = document.querySelector(`#menu [data-panel="${name}"] button, #menu [data-panel="${name}"] input`);
  if (first) first.focus({preventScroll:true});
}
document.querySelectorAll('#menu [data-go]').forEach(b => b.addEventListener('click', () => { initAudio(); showPanel(b.dataset.go); }));
$('quitBtn').addEventListener('click', () => goMainMenu());

await loadStep(77, 'Son hazırlıklar');
// ================= Main loop =================
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight; stageH = h;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  if (composer){
    const pr = renderer.getPixelRatio(); composer.setPixelRatio(pr); composer.setSize(w, h);
    if (fxaaPass) fxaaPass.material.uniforms.resolution.value.set(1/(w*pr), 1/(h*pr));
  }
}
new ResizeObserver(resize).observe(stage); resize();

let lastSt = 0, bob = 0, lastFrame = performance.now(), lastLogic = performance.now();
function logic(dt){
  now += dt*1000;
  { const se = myEnt(); if (se && se.team !== me.team && (isHost || hostConn)) me.team = se.team; }
  const e = myEnt();
  if (e && e.rs > me.rs){
    me.rs = e.rs; me.pos.copy(e.pos); me.vel.set(0,0,0); me.yaw = e.yaw; me.pitch = 0;
    me.ammo = WEAPONS.map(w => w.mag); me.res = HANDLING.map(h => h.res); me.reloading = false; me.prevHp = 100; me.slideT = 0;
    me.stam = 1; me.exhausted = false; me.bloom = 0; me.recovP = me.recovY = 0; me.gren = 2; me.med = 2; applyLoadout();
  }
  let moving = false;
  if (isAlive()){
    const wasG = me.grounded, vyPrev = me.vel.y;
    moving = updateMovement(dt);
    if (!wasG && me.grounded && vyPrev < -3){ me.land = Math.min(.15, -vyPrev * .02); playLand(Math.min(1, -vyPrev / 10)); }
    if (me.reloading && now >= me.reloadEnd){
      me.reloading = false;
      const take = Math.min(WEAPONS[me.weapon].mag - me.ammo[me.weapon], me.res[me.weapon]);
      me.ammo[me.weapon] += take; me.res[me.weapon] -= take;
    }
    updateRecoil(dt);
    updateAimAssist(dt); tutStep(dt, moving);
    if (mouseDown && !overlayOpen()) tryFire(moving); else autoFireStep(moving);
  } else { me.zoom = false; if (e && !e.alive && !me.deadAt) me.deadAt = now; }
  if (e && e.alive) me.deadAt = 0;
  if (isHost) hostStep(dt);
  else if (hostConn && started && now - lastSt > 50){
    lastSt = now;
    hostConn.send({t:'st', p:v3(me.pos), y:r2(me.yaw), x:r2(me.pitch), w:me.weapon, rs:me.rs, s:me.slideT > 0 ? 1 : 0, n:needAmmo() ? 1 : 0});
  }
  return moving;
}
let fpsAcc = 0, fpsN = 0, lowStreak = 0, shadowFrame = 0, liteT = 0;
function applyPixelRatio(){ renderer.setPixelRatio(Math.max(prFloor(), Math.min(devicePixelRatio || 1, QUALITY[quality].pr) * dynScale)); resize(); }
function perfToast(text){ const t = $('toast'); t.textContent = text; t.classList.add('on'); clearTimeout(perfToast.h); perfToast.h = setTimeout(() => t.classList.remove('on'), 4000); }
let highStreak = 0, lastScaleT = 0;
function perfTick(raw){
  fpsAcc += raw; fpsN++;
  if (fpsAcc < 1) return;
  const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
  if (showFps) $('fps').textContent = Math.round(fps) + ' FPS';
  if (!perfAuto || !started || document.hidden) return;
  const LOW = MOBILE ? 26 : 45, HIGH = MOBILE ? 50 : 57, t = performance.now();
  if (fps < LOW){
    highStreak = 0;
    if (t - lastScaleT < 3000) return;
    if (dynScale > .65){ dynScale = Math.max(.6, dynScale - .1); applyPixelRatio(); lastScaleT = t; }
    else if (++lowStreak >= 3 && quality > 0){ lowStreak = 0; dynScale = 1; lastScaleT = t; applyQuality(quality - 1); perfToast(`Akıcılık için grafik kalitesi "${QUALITY[quality].name}" seviyesine düşürüldü`); }
  } else {
    lowStreak = 0;
    if (fps > HIGH && dynScale < 1){ if (++highStreak >= 5 && t - lastScaleT > 6000){ highStreak = 0; lastScaleT = t; dynScale = Math.min(1, dynScale + .1); applyPixelRatio(); } }
    else highStreak = 0;
  }
}
// magazine change: the support hand leaves the gun, strips the old magazine (which tumbles away), fetches a fresh one
// from the belt, rocks it into the well with a slap and goes back to the handguard. Hand paths are curved and eased,
// the wrist turns as it works, so nothing moves on straight rails.
const RL_H = new V(), RL_T = new V(), RL_A = new V(), RL_B = new V(), RL_C = new V(), RL_R = new V();
const RL_PREV = new V(), RL_GUN = {px:0, py:0, pz:0, rx:0, rz:0};
const easeIO = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const easeIn = t => t*t*t, easeOut = t => 1 - Math.pow(1 - t, 3);
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3*Math.pow(t - 1, 3) + c1*Math.pow(t - 1, 2); };
function arcTo(out, a, b, bulge, t){                                    // quadratic curve a -> b, bowed by `bulge`
  RL_C.addVectors(a, b).multiplyScalar(.5).add(bulge);
  const u = 1 - t; return out.set(u*u*a.x + 2*u*t*RL_C.x + t*t*b.x, u*u*a.y + 2*u*t*RL_C.y + t*t*b.y, u*u*a.z + 2*u*t*RL_C.z + t*t*b.z);
}
const seg = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
function reloadPose(view, rp){
  const ud = view.userData, mag = ud.mag, lh = ud.lhand, base0 = ud.lhBase;
  if (rp < 0 || !mag || !ud.magReach){
    if (lh && base0){ lh.position.copy(base0); lh.rotation.set(0, 0, 0); }
    if (mag){ mag.position.copy(mag.userData.base); mag.rotation.set(0, 0, 0); mag.visible = true; }
    return;
  }
  const D = ud.magReach, dir = ud.magDir, P = ud.pouch, H = RL_H, R = RL_R.set(0, 0, 0);
  const pulled = RL_A.copy(D).addScaledVector(dir, .1), ready = RL_B.copy(D).addScaledVector(dir, .07);
  if (rp < .1){ const t = easeIO(seg(0, .1, rp)); arcTo(H, RL_T.set(0, 0, 0), D, RL_PREV.set(-.03, -.04, .04), t); R.set(-.25*t, 0, .35*t); }
  else if (rp < .13){ const t = seg(.1, .13, rp); H.copy(D).addScaledVector(dir, -.005*Math.sin(t*Math.PI)); R.set(-.25, 0, .35); }   // squeeze the catch
  else if (rp < .24){ const t = easeIn(seg(.13, .24, rp)); H.copy(D).lerp(pulled, t); R.set(-.25 + .45*t, 0, .35 + .1*t); }          // yank it out
  else if (rp < .4){ const t = easeIO(seg(.24, .4, rp)); arcTo(H, pulled, P, RL_PREV.set(-.07, .02, .05), t); R.set(.2 + .5*t, 0, .45 - .2*t); }
  else if (rp < .43){ H.copy(P); R.set(.7, 0, .25); }                                                                                 // in the pouch
  else if (rp < .54){ const t = easeOut(seg(.43, .54, rp)); arcTo(H, P, ready, RL_PREV.set(-.06, -.03, .06), t); R.set(.7 - .55*t, 0, .25 + .1*t); }
  else if (rp < .585){ const t = easeIn(seg(.54, .585, rp)); H.copy(ready).lerp(RL_T.copy(D).addScaledVector(dir, -.014), t); R.set(.15 - .25*t, 0, .35); } // slap it home
  else if (rp < .63){ const t = easeOut(seg(.585, .63, rp)); H.copy(D).addScaledVector(dir, -.014*(1 - t)); R.set(-.1, 0, .35 - .05*t); }
  else if (rp < .82){ const t = easeIO(seg(.63, .82, rp)); arcTo(H, D, RL_T.set(0, 0, 0), RL_PREV.set(-.02, -.05, .03), t); R.set(-.1*(1 - t), 0, .3*(1 - t)); }
  else H.set(0, 0, 0);
  if (lh && base0){ lh.position.copy(base0).add(H); lh.rotation.set(R.x, R.y, R.z); }
  const base = mag.userData.base; mag.visible = true; mag.rotation.set(0, 0, 0);
  if (rp < .13) mag.position.copy(base);
  else if (rp < .24){ const t = easeIn(seg(.13, .24, rp)); mag.position.copy(base).addScaledVector(dir, .1*t); mag.rotation.x = .08*t; }
  else if (rp < .42){                                                                                   // let go: the empty one tumbles away
    const t = seg(.24, .42, rp);
    mag.position.copy(base).addScaledVector(dir, .1 + .12*t + t*t*.55); mag.position.x -= t*.07; mag.position.z += t*.04;
    mag.rotation.set(.08 + t*1.4, t*.5, -t*1.1); mag.visible = t < .96;
  } else if (rp < .43) mag.visible = false;
  else if (rp < .63){                                                                                   // the fresh one rides in the hand, rocked in nose first
    mag.position.copy(base).add(RL_T.copy(H).sub(D));
    const k = 1 - easeOut(seg(.43, .58, rp)); mag.rotation.set(.5*k, 0, -.25*k);
  } else mag.position.copy(base);
}
// extra gun motion during a magazine change: release flick, the tug when the magazine is stripped, a one-handed sag,
// the jolt of the slap, the charging-handle yank and a small overshoot as the gun comes back up
// shotgun: the moments a shell clicks home match the reload sound (4 inserts over a 2.3 s reload)
const SG_T = [.078, .274, .47, .666];
const SG_PORT = new V(0, -.062, .07), SG_HAND = new V(-.012, -.045, .37), SG_POUCH = new V(-.1, -.3, .44), _sg = new V(), _sg2 = new V();
function shotgunReload(view, rp){
  const ud = view.userData, lh = ud.lhand, base = ud.lhBase, sh = ud.rShell; if (!lh || !base || !sh) return;
  if (rp < 0 || rp >= .8){ lh.rotation.set(0, 0, 0); sh.visible = false; if (rp < 0 || rp >= .8) lh.position.x = base.x, lh.position.y = base.y; return; }
  let i = SG_T.findIndex(t => rp < t), H = _sg; sh.visible = false;
  if (i < 0){                                        // last shell in: hand back to the pump
    const u = easeIO(seg(SG_T[3], .78, rp)); arcTo(H, SG_HAND, RL_T.set(0, 0, 0), RL_PREV.set(-.03, -.04, 0), u);
  } else {
    const t0 = i ? SG_T[i - 1] : 0, t1 = SG_T[i], u = (rp - t0) / (t1 - t0), from = i ? SG_HAND : RL_T.set(0, 0, 0);
    const ready = _sg2.copy(SG_HAND).add(RL_A.set(0, -.07, .015));
    if (u < .3) arcTo(H, from, SG_POUCH, RL_PREV.set(-.05, .02, .03), easeIO(u / .3));
    else if (u < .4) H.copy(SG_POUCH);
    else if (u < .82) arcTo(H, SG_POUCH, ready, RL_PREV.set(-.04, -.02, .02), easeOut((u - .4) / .42));
    else H.copy(ready).lerp(SG_HAND, easeIn((u - .82) / .18));
    if (u > .4){                                     // the shell rides between finger and thumb, then is pushed up and forward into the tube
      sh.visible = true;
      sh.position.set(H.x + base.x + .03, H.y + base.y + .045, H.z + base.z - .01);
      sh.rotation.set(0, 0, 0);
      if (u < .82) sh.rotation.set(.5 * (1 - (u - .4) / .42), .3 * (1 - (u - .4) / .42), 0);
      if (u > .92){ const f = (u - .92) / .08; sh.position.set(SG_PORT.x, SG_PORT.y + .035 * f, SG_PORT.z - .07 * f); }
    }
  }
  lh.position.copy(base).add(H);
  lh.rotation.set(-.35 * (H.y < -.1 ? 1 : 0), 0, .3);
}
function reloadGunMotion(rp, o){
  const t1 = seg(0, .1, rp); o.rx += .05*Math.sin(t1*Math.PI);
  const t2 = seg(.13, .26, rp); o.py -= .016*Math.sin(t2*Math.PI); o.rz -= .07*Math.sin(t2*Math.PI); o.px -= .01*Math.sin(t2*Math.PI);
  const one = seg(.2, .28, rp) * (1 - seg(.5, .56, rp));
  o.py -= .01*one; o.rz += one*(.03*Math.sin(rp*31) + .02); o.rx += one*.018*Math.sin(rp*23 + 1);
  if (rp > .575 && rp < .75){ const t = (rp - .575) / .175; const j = Math.sin(t*Math.PI*2.5) * Math.exp(-t*4); o.py += .022*j; o.rx += .09*j; o.rz -= .05*j; }
  if (rp > .78 && rp < .92){ const t = (rp - .78) / .14; const j = Math.sin(t*Math.PI) * (t < .35 ? 1 : 1); o.pz += .04*j; o.rx -= .08*j; o.rz += .07*Math.sin(t*Math.PI*2)*(1 - t); }
}
function frame(t){
  const rawDt = Math.max(0, (t - lastFrame) / 1000);
  const dt = Math.min(.1, rawDt); lastFrame = t; lastLogic = performance.now();
  perfTick(Math.min(rawDt, 1));
  { const q = QUALITY[quality]; if (q.shadowEvery > 1 && (++shadowFrame % q.shadowEvery) === 0) renderer.shadowMap.needsUpdate = true;
    if (liteOn && (liteT += rawDt) > .5){ liteT = 0; liteSweep(); } }
  let moving = false; { const n = Math.max(1, Math.ceil(dt / .034)); for (let i = 0; i < n; i++) moving = logic(dt / n) || moving; }
  syncAvatars(dt);
  const W = WEAPONS[me.weapon], aliveNow = isAlive();
  const ads = me.zoom && !W.scope && aliveNow;
  const sprinting = aliveNow && me.sprinting && !me.reloading;
  me.adsT += ((ads ? 1 : 0) - me.adsT) * Math.min(1, dt*14);
  me.sprintT += ((sprinting ? 1 : 0) - me.sprintT) * Math.min(1, dt*8);
  me.swayX *= Math.pow(.002, dt); me.swayY *= Math.pow(.002, dt); me.land *= Math.pow(.003, dt);
  { const hs = Math.hypot(me.vel.x, me.vel.z); me.strideK = (me.strideK || 0) + ((me.grounded ? Math.min(1.55, hs / 5.4) : 0) - (me.strideK || 0)) * Math.min(1, dt * 10);
    bob += dt * (sprinting ? 12.5 : 9.5) * (.75 + (WEAPONS[me.weapon].move || 1) * .25) * Math.min(1.2, me.strideK * (sprinting ? .66 : 1)); }
  me.bobS += ((me.grounded ? Math.min(1, Math.hypot(me.vel.x, me.vel.z) / 4.5) : 0) - me.bobS) * Math.min(1, dt*8);
  const bobAmt = me.bobS * (1 - me.adsT*.85);
  { const si = Math.floor(bob / Math.PI); if (si !== me.lastStep){ me.lastStep = si; if (moving && me.grounded && aliveNow && me.slideT <= 0) playStep(null, sprinting ? .5 : .32, sprinting); } }
  { const se = myEnt(); updateAudio(se ? se.hp : 100, se ? se.alive : true); }
  updateMusic();
  me.eye += ((me.slideT > 0 ? .95 : EYE) - me.eye) * Math.min(1, dt*12); me.slideK += ((me.slideT > 0 ? 1 : 0) - me.slideK) * Math.min(1, dt*10);
  camera.position.set(me.pos.x, me.pos.y + me.eye - me.land + Math.sin(bob*2)*(.022 + me.sprintT*.03)*bobAmt, me.pos.z);
  camera.rotation.set(me.pitch, me.yaw, Math.sin(bob)*(.004 + me.sprintT*.012)*bobAmt + me.slideK*.07);
  { const rv = me.vel.x*Math.cos(me.yaw) - me.vel.z*Math.sin(me.yaw); me.roll += (-rv*.0045 - me.roll) * Math.min(1, dt*8); camera.rotation.z += me.roll + me.cr.x; }
  updatePreview(dt);
  if (!started){ menuCamera(dt); viewRoot.visible = false; }
  const targetFov = me.zoom && aliveNow ? W.adsFov : (me.slideT > 0 ? 85 : me.sprintT > .5 ? 80 : 75);
  me.baseFov += (targetFov - me.baseFov) * Math.min(1, 12*dt);
  { const fv = me.baseFov + me.fovK.x; if (Math.abs(camera.fov - fv) > .01){ camera.fov = fv; camera.updateProjectionMatrix(); } }
  me.recoil *= Math.pow(.0005, dt);
  // ---- viewmodel animation: springs for recoil, reload choreography, switch, jump lag, breathing
  const SPR_K = 220, SPR_C = 16;
  for (const s of [me.kz, me.kp, me.kr, me.ky, me.cr, me.fovK]){ s.v += (-SPR_K*s.x - SPR_C*s.v) * dt; s.x += s.v * dt; }
  me.switchT = Math.max(0, me.switchT - dt / .32);
  me.vyLag += (Math.max(-.05, Math.min(.05, -me.vel.y * .008)) - me.vyLag) * Math.min(1, dt*10);
  const at = me.adsT, sp = me.sprintT, rk = 1 - at*.55;
  { const cy = Math.cos(me.yaw), sy = Math.sin(me.yaw), lat = me.vel.x*cy - me.vel.z*sy, fwd = -(me.vel.x*sy + me.vel.z*cy), q = Math.min(1, dt*7);
    me.mvX = (me.mvX || 0) + (lat - (me.mvX || 0)) * q; me.mvZ = (me.mvZ || 0) + (fwd - (me.mvZ || 0)) * q; }
  const mvk = 1 - at * .8;
  let px = lerp(.215, 0, at) + Math.cos(bob)*.012*bobAmt - me.swayX*.00025 - sp*.06;
  let py = lerp(HIP_Y[me.weapon], ADS_Y[me.weapon], at) + Math.abs(Math.sin(bob))*.012*bobAmt + me.swayY*.0002 - sp*.05 - me.land*.4 + me.vyLag + Math.sin(now/1100)*.003*(1 - at);
  let pz = lerp(touchOn ? -.47 : -.45, me.weapon < 2 ? -.43 : -.36, at) + me.kz.x * rk;
  let rx = HIP_RX[me.weapon] * (1 - at) + me.kp.x * rk + me.swayY*.0005 - sp*.3 + Math.sin(now/1300)*.004*(1 - at);
  let ry = HIP_RY * (1 - at) - me.swayX*.0008 + sp*.55 + me.ky.x * rk;
  let rz = sp*.25 - me.swayX*.0004 + me.kr.x * rk;
  px -= me.mvX * .0042 * mvk; rz += me.mvX * .011 * mvk; ry += me.mvX * .006 * mvk; pz += Math.max(-.02, Math.min(.03, me.mvZ * .0036)) * mvk; py -= Math.abs(me.mvZ) * .0012 * mvk;
  { const sw = sp * (1 - at);                       // sprint: the gun swings in a figure eight with each stride
    px += Math.sin(bob) * .028 * sw; py += (Math.abs(Math.cos(bob)) - .5) * .03 * sw;
    rz += Math.sin(bob) * .09 * sw; rx += Math.cos(bob * 2) * .04 * sw; ry += Math.sin(bob) * .05 * sw;
    const wk = me.bobS * (1 - sp) * (1 - at * .8);   // walking: a gentler sway that sells the weight
    rz += Math.sin(bob) * .025 * wk; ry += Math.cos(bob) * .012 * wk; px += Math.sin(bob) * .006 * wk; }
  const view = views[me.weapon], mag = view && view.userData.mag;
  if (VM_GLASS) VM_GLASS.opacity = .5 - .4 * me.adsT;
  if (view){                                         // trigger finger squeezes while firing; pistol slides cycle and lock back when empty
    const ud = view.userData, since = now - me.lastShotT;
    const pull = (started && mouseDown && !me.reloading && aliveNow) || since < 110 ? 1 : 0;
    me.trigK += (pull - me.trigK) * Math.min(1, dt * (pull ? 40 : 22));
    if (ud.trig){ ud.trig.position.z = ud.trig.userData.base.z + me.trigK * .0055; ud.trig.rotation.x = .35 + me.trigK * .3; }
    if (ud.trigFinger){ ud.trigFinger.position.set(0, -me.trigK * .0015, me.trigK * .0065); }
    const rpS = me.reloading ? Math.max(0, Math.min(1, 1 - (me.reloadEnd - now) / W.reload)) : 0;
    if (ud.slide){ const t = since / 80; ud.slide.position.z = (me.ammo[me.weapon] <= 0 && (!me.reloading || rpS < .82)) ? .028 : t < 1 ? Math.sin(t * Math.PI) * .032 : 0; }
  }
  if (me.reloading && aliveNow){
    const rp = Math.max(0, Math.min(1, 1 - (me.reloadEnd - now) / W.reload));
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t*t*(3 - 2*t); };
    const tilt = ss(0, .15, rp) * (rp < .84 ? 1 : 1 - backOut(seg(.84, 1, rp)));
    if (me.weapon === 8){ rx -= tilt*.55; py -= tilt*.12; rz += tilt*.15; }
    else if (me.weapon === 5){
      // rolled over to show the loading port underneath, a small jolt as each shell is thumbed in
      rz -= tilt*.7; rx += tilt*.3; py += tilt*.05; px -= tilt*.1; ry += tilt*.12;
      const k = SG_T.findIndex(t => rp < t + .05), tt = k >= 0 ? SG_T[k] : -1;
      if (tt >= 0 && rp > tt - .02){ const j = Math.sin(Math.min(1, (rp - tt + .02) / .07) * Math.PI); py += j*.012; rx += j*.05; }
      const pump = rp > .78 && rp < .92 ? Math.sin((rp - .78) / .14 * Math.PI) : 0; pz += pump*.05;
      if (view) shotgunReload(view, rp);
    } else {
      // gun brought in towards the centre and rolled so the magazine well faces the support hand
      // long guns are lifted more so the magazine well (low under the receiver) comes into view
      const lift = me.weapon < 2 ? .02 : .085;
      rz -= tilt*.62; rx += tilt*.34; py += tilt*lift; pz += tilt*.03; px -= tilt*.13; ry += tilt*.18;
      const o = RL_GUN; o.px = o.py = o.pz = o.rx = o.rz = 0; reloadGunMotion(rp, o);
      px += o.px; py += o.py; pz += o.pz; rx += o.rx; rz += o.rz;
      if (view) reloadPose(view, rp);
    }
  } else if (view){ reloadPose(view, -1); if (me.weapon === 5) shotgunReload(view, -1); }
  me.heat = Math.max(0, (me.heat || 0) - dt * .16);
  if (aliveNow && me.heat > .3 && now - me.lastShotT > 160 && Math.random() < dt * 9 * me.heat){   // hot barrel: wisps of smoke curl off the muzzle
    muzzle.getWorldPosition(tmpM);
    spawnSprite(tmpM.clone(), {tex:TEX.smoke, color:C(0xb9b5ad), size:.05, life:1.4, v:new V(rnd(-.05,.05), .32, rnd(-.05,.05)), grow:2.6, op:.16 * Math.min(1, me.heat), fadeIn:.15, spin:rnd(-1,1)});
  }
  if (me.ejectAt && now >= me.ejectAt){ if (me.weapon === me.ejectW && aliveNow) ejectCasing(); me.ejectAt = 0; }
  if (view){                                         // working actions, timed to the mechanical sounds of each shot
    const ud = view.userData, since = now - me.lastShotT;
    const rpA = me.reloading ? Math.max(0, Math.min(1, 1 - (me.reloadEnd - now) / W.reload)) : -1;
    const ammoLeft = me.ammo[me.weapon] > 0;
    if (ud.bolt){                                    // bolt action: lift 550-620 ms, draw 620-720, drive 780-860, lock 860-920
      let rot = 0, back = 0, k = -1;
      if (rpA >= 0){ if (rpA > .76 && rpA < .96) k = (rpA - .76) / .2 * 370 + 550; }
      else if (ammoLeft && since > 550 && since < 920) k = since;
      if (k >= 0){
        if (k < 620) rot = easeIO((k - 550) / 70);
        else if (k < 720){ rot = 1; back = easeIO((k - 620) / 100); }
        else if (k < 780){ rot = 1; back = 1; }
        else if (k < 860){ rot = 1; back = 1 - easeIO((k - 780) / 80); }
        else rot = 1 - easeIO(Math.min(1, (k - 860) / 60));
        const w = Math.sin(Math.min(1, (k - 550) / 370) * Math.PI);
        rz += .1 * w; rx += .035 * w; py -= .012 * w; px -= .01 * w;
      }
      ud.bolt.rotation.z = rot * 1.15; ud.bolt.position.z = ud.bolt.userData.base.z + back * .078;
    }
    if (ud.pump){                                    // pump: back 380-460 ms, forward 520-600 (and once at the end of a reload)
      let z = 0, k = -1;
      if (rpA >= 0){ if (rpA > .78 && rpA < .92) k = 380 + (rpA - .78) / .14 * 220; }
      else if (since > 380 && since < 600) k = since;
      if (k >= 0){ z = k < 460 ? easeIO((k - 380) / 80) : k < 520 ? 1 : 1 - easeIO((k - 520) / 80); rx += .03 * z; pz += .012 * z; }
      ud.pump.position.z = ud.pump.userData.base.z + z * .085;
      if (ud.lhand && ud.lhBase && !(rpA >= 0 && rpA < .78)) ud.lhand.position.z = ud.lhBase.z + z * .085;   // the support hand rides the pump
    }
    if (ud.bcg){                                     // gas guns: the carrier flicks back and returns in a few ms; locks back on empty
      const t = since / 55, open = !ammoLeft && rpA < .78;
      const z = open ? 1 : t < 1 ? Math.sin(t * Math.PI) : 0;
      ud.bcg.position.set(ud.bcg.userData.base.x - .004 * z, ud.bcg.userData.base.y, ud.bcg.userData.base.z + z * .05);   // slides back and into the receiver, baring the port
      if (ud.chandle) ud.chandle.position.z = ud.chandle.userData.base.z + z * .05;
    }
  }
  py -= me.switchT * me.switchT * .3; rx -= me.switchT * .5;
  viewRoot.position.set(px, py, pz);
  viewRoot.rotation.set(rx, ry, rz);
  viewRoot.rotation.z += me.slideK * .28; viewRoot.position.y -= me.slideK * .03;
  if (flashPetals){ flashPetals.visible = flashSprite.material.opacity > .05; flashPetals.children.forEach(m => m.material.opacity = flashSprite.material.opacity); }
  flash.intensity *= Math.pow(.0001, dt); flashSprite.material.opacity *= Math.pow(.00001, dt);
  updatePickups(); updateZoneVisuals(); updateFx(dt); updateDebris(dt); updateCasings(dt); updateClouds(dt); updateRockets(dt); updateGrenades(dt); updateWeather(dt); if (started) updateFlare(dt);
  if (rocketHead) rocketHead.visible = me.ammo[8] > 0 || me.weapon !== 8;
  if (me.shake > .002){ camera.position.x += (Math.random()-.5)*me.shake*.4; camera.position.y += (Math.random()-.5)*me.shake*.4; camera.rotation.z += (Math.random()-.5)*me.shake*.06; me.shake *= Math.pow(.02, dt); }
  { const se = myEnt(); updateSleeves(se ? se.team : me.team); }
  if (started){ updateHud(); updateBoard(); if (touchOn) updateTouchUI(); if ((drawRadar.t = (drawRadar.t || 0) + dt) > .066){ drawRadar.t = 0; drawRadar(); } }
  renderFrame(dt);
  requestAnimationFrame(frame);
}
// keep the host simulating when its tab is in the background
setInterval(() => {
  const t = performance.now();
  if (isHost && t - lastLogic > 150){ const dt = Math.min(.1, (t - lastLogic)/1000); lastLogic = t; logic(dt); }
}, 50);
me.pos.set(0, 4, 24); me.pitch = -.12;
Object.assign(me, {kz:{x:0,v:0}, kp:{x:0,v:0}, kr:{x:0,v:0}, ky:{x:0,v:0}, cr:{x:0,v:0}, fovK:{x:0,v:0}, switchT:0, vyLag:0, roll:0, bobS:0, baseFov:75, adsT:0, sprintT:0, swayX:0, swayY:0, land:0, shake:0, lastStep:0, slideT:0, slideCd:0, slideSpeed:0, slideDir:new V(), dustT:0, eye:EYE, slideK:0});
document.querySelectorAll('.sensIn').forEach(i => i.addEventListener('input', () => setSens(+i.value / 100)));
document.querySelectorAll('.adsIn').forEach(i => i.addEventListener('input', () => { setAdsSens(+i.value / 100); if (typeof fillRange === 'function') fillRange(i); }));
setAdsSens(adsSens);
document.querySelectorAll('.muteBtn').forEach(b => b.addEventListener('click', () => { initAudio(); setMuted(!muted); }));
setSens(sens); setMuted(muted);
me.loadout = loadout.slice(); renderSlots(); renderLoadout();
if (!me.loadout.includes(me.weapon)){ me.weapon = me.loadout[0]; setView(me.weapon); }
document.querySelectorAll('.volIn').forEach(i => { i.value = Math.round(volume*100); i.addEventListener('input', () => { initAudio(); setVolume(+i.value / 100); }); });
buildPreview();
document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => applyQuality(+b.dataset.q));
document.querySelectorAll('[data-atm]').forEach(b => b.onclick = () => { if (hostConn && !isHost) return; applyAtmos(+b.dataset.atm); if (isHost) hostBroadcast(true); });

applyAtmos(atmos);
applyQuality(quality);
buildWeaponThumbs(); renderLoadout(); buildTeamPortraits(); buildTeamGroups();
function syncPerfUI(){
  document.querySelectorAll('[data-perf]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.perf === '1') === perfAuto));
  document.querySelectorAll('[data-fps]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.fps === '1') === showFps));
  $('fps').style.display = showFps ? 'block' : 'none';
}
document.querySelectorAll('[data-perf]').forEach(b => b.onclick = () => { perfAuto = b.dataset.perf === '1'; if (!perfAuto && dynScale < 1){ dynScale = 1; applyPixelRatio(); } try { localStorage.setItem('cephe-perfauto', perfAuto ? '1' : '0'); } catch(e){} syncPerfUI(); });
document.querySelectorAll('[data-fps]').forEach(b => b.onclick = () => { showFps = b.dataset.fps === '1'; try { localStorage.setItem('cephe-fps', showFps ? '1' : '0'); } catch(e){} syncPerfUI(); });
document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { dynScale = 1; applyPixelRatio(); }));
syncPerfUI();
try { batchStaticScenery(); if (liteOn) liteSweep(); } catch(e){ console.warn('batching skipped', e); }
relayoutPerim(true); applyLayout(mapId); setMap(mapId);
// ---- map picture cards: every map is photographed once from the air at start-up
const MAP_THUMBS = [];
function buildMapThumbs(){
  const wasLite = liteOn, prevRT = renderer.getRenderTarget();
  let rt = null;
  try {
    if (wasLite) setLiteMaterials(false);
    const W2 = 480, H2 = 270; rt = new THREE.WebGLRenderTarget(W2, H2); rt.texture.encoding = THREE.sRGBEncoding;
    const cam = new THREE.PerspectiveCamera(46, W2 / H2, .5, 400);
    const buf = new Uint8Array(W2 * H2 * 4), hidden = preview.map(a => [a.g, a.g.visible]);
    preview.forEach(a => a.g.visible = false);
    for (let i = 0; i < MAPS.length; i++){
      applyLayout(i); if (wasLite) setLiteMaterials(false);
      { const k = A / A0; cam.position.set(0, 33 * k, 36 * k); cam.lookAt(0, 0, 3 * k); }
      scene.updateMatrixWorld(true);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf);
      const c = document.createElement('canvas'); c.width = W2; c.height = H2;
      const g = c.getContext('2d'), img = g.createImageData(W2, H2);
      for (let y = 0; y < H2; y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
      g.putImageData(img, 0, 0);
      MAP_THUMBS[i] = c.toDataURL('image/jpeg', .82);
    }
    hidden.forEach(([g, v]) => g.visible = v);
  } catch(e){ console.warn('map pictures skipped', e); }
  try { renderer.setRenderTarget(prevRT); } catch(e){}
  if (rt) rt.dispose();
  applyLayout(mapId);
  if (wasLite) setLiteMaterials(true);
}
function renderMapCards(){
  document.querySelectorAll('.mapGrid').forEach(g => {
    const host = g.dataset.host === '1';
    g.innerHTML = MAPS.map((m, i) => `<button class="mapCard${host ? ' hostCtl' : ''}" data-map="${i}" aria-pressed="${i === mapId}" title="${m.desc}">
      <span class="mcImg">${MAP_THUMBS[i] ? `<img src="${MAP_THUMBS[i]}" alt="">` : ''}<i class="mcCheck">✓</i>${m.mode === 'dom' ? '<i class="mcMode">Bölge</i>' : ''}</span>
      <span class="mcTxt"><b>${m.name}</b><small>${m.desc}</small></span></button>`).join('');
  });
  document.querySelectorAll('.mapCard').forEach(b => b.onclick = () => {
    const inLobby = !!b.closest('#lobbyO');
    if (inLobby && hostConn && !isHost) return;
    setMap(+b.dataset.map); if (isHost) hostBroadcast(true);
  });
}
$('lobbyBack').onclick = () => {
  if (started || conns.size || hostConn){ if (!confirm(isHost ? 'Odayı kapatıp ana menüye dönülsün mü? Bağlı arkadaşların odadan düşer.' : 'Odadan çıkıp ana menüye dönülsün mü?')) return; }
  goMainMenu();
};
await loadStep(78, 'Harita görselleri');
buildMapThumbs(); renderMapCards();
// warm up: compile every shader now so the first seconds of play do not stutter
await loadStep(80, 'Gölgelendiriciler derleniyor');
try { renderer.compile(scene, camera); } catch(e){}
setupViewmodelLayer();
requestAnimationFrame(frame);
await loadStep(86, 'Sesler hazırlanıyor');
try { await buildBank((i, n) => LOADER.set(86 + 13 * i / n)); } catch(e){}
await loadStep(100, 'Hazır');
setTimeout(() => LOADER.done(), 250);
setTimeout(() => { if (MUSIC.on) bakeMusic(); }, 400);
// browsers only allow sound after the first click/tap/key: use it to start the menu music
{ const first = () => { removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); if (MUSIC.on) initAudio(); };
  addEventListener('pointerdown', first, true); addEventListener('keydown', first, true); }
document.querySelectorAll('[data-music]').forEach(b => b.onclick = () => setMusic(b.dataset.music === '1', true));
document.querySelectorAll('.musicBtn').forEach(b => b.onclick = () => setMusic(!MUSIC.on, true));
setMusic(MUSIC.on);
})().catch(e => {
  console.error(e);
  const st = document.getElementById('ldStep'); if (st) st.textContent = 'Oyun yüklenirken bir hata oluştu. Sayfayı yenile. (' + (e && e.message || e) + ')';
  const o = document.getElementById('loadO'); if (o) o.classList.add('err');
});
