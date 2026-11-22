const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
ctx.scale(2,2);
const types={gun:{name:'Gun tower',cost:50,range:140,rate:.45,damage:9,color:'#d5dcb3',desc:'Reliable single-target fire'},sniper:{name:'Sniper tower',cost:85,range:260,rate:1.65,damage:30,color:'#d6c89a',desc:'Long range · piercing shots'},shotgun:{name:'Shotgun tower',cost:75,range:100,rate:1.1,damage:9,color:'#e0b26d',desc:'Short range · directional spread'},rocket:{name:'Rocket tower',cost:110,range:180,rate:1.6,damage:30,color:'#d6845e',desc:'Explosive area damage'},lightning:{name:'Lightning tower',cost:120,range:150,rate:1.35,damage:13,color:'#8bc8d0',desc:'Chains between enemies · stuns'}};
Object.assign(types,{barracks:{name:'Barracks',cost:110,range:130,rate:3,damage:0,color:'#79a7ad',desc:'Deploys soldiers during waves'},flame:{name:'Flamethrower',cost:90,range:105,rate:.18,damage:4,color:'#f18d4c',desc:'Short-range stream · burns'},frost:{name:'Cryo tower',cost:95,range:140,rate:.8,damage:6,color:'#9adbe2',desc:'Chilling rounds slow zombies'},cannon:{name:'Autocannon',cost:125,range:180,rate:.65,damage:18,color:'#d8c17e',desc:'Heavy armor-piercing shells'},venom:{name:'Toxic sprayer',cost:100,range:130,rate:.7,damage:5,color:'#b2d75d',desc:'Poison damages over time'}});
Object.assign(types,{minigun:{name:'Minigun',cost:100,range:155,rate:.16,damage:4,color:'#d9b664',desc:'Rapid automatic fire'},mortar:{name:'Mortar',cost:130,range:230,rate:2.5,damage:22,color:'#d99f6c',desc:'Arcing explosive shells'},pulse:{name:'Pulse tower',cost:115,range:105,rate:1.8,damage:8,color:'#b5b1ef',desc:'Repels nearby zombies'}});
const upgrades={
 minigun:[['High speed · 25% faster','Reinforced rounds · +35% damage','Rotary feed · 25% faster','Overdrive · +40% damage'],['Tracer · pierces two','Long barrel · +25% range','Heavy rounds · +35% damage','Armor piercing · ignores armor']],
 mortar:[['Wider shells · larger blast','Heavy shells · +40% damage','Barrage · 25% faster','Siege shells · +40% damage'],['Long tube · +25% range','Concussion · slows survivors','Pressure wave · pushes survivors','Flashbang · briefly stuns']],
 pulse:[['Amplifier · +35% damage','Quick charge · 25% faster','Overload · +40% damage','Cascade · 25% faster'],['Broad field · +25% range','Disruptor · briefly stuns','Repulsor · stronger push','Static field · longer stun']],
 gun:[['Rapid feed · fires 25% faster','Double tap · fires two rounds','Heavy rounds · +40% damage','Suppressive fire · bullets briefly slow'],['Tracer · bullets hit two targets','Long barrel · +25% range','Armor breaker · ignores armor','Belt fed · bullets hit four targets']],
 sniper:[['Hardened rounds · pierces four','High caliber · +50% damage','Rail shot · pierces six','Shockwave · hits slow zombies'],['Concussion · briefly stuns','Spotter · +30% range','Quick chamber · 25% faster','Crippling shot · longer stun']],
 shotgun:[['Wide load · 11 pellets','Close quarters · +35% damage','Drum magazine · 25% faster','Storm shot · 15 pellets'],['Choke · +30% range','Heavy pellets · +35% damage','Shrapnel · pellets pierce two','Stopping power · pellets slow']],
 rocket:[['Blast charge · larger explosion','Heavy warhead · +40% damage','Cluster charge · wider blast','Siege warhead · +60% damage'],['Napalm · slows survivors','Accelerator · 25% faster','Incendiary · burns survivors','Firestorm · longer burn']],
 lightning:[['Capacitor · 25% faster','High voltage · +35% damage','Arc relay · chains further','Overcharge · +50% damage'],['Conductor · chains to seven','Static field · longer stun','Storm relay · chains to ten','Lockdown · longer stun']],
 barracks:[['Training · soldiers attack faster','Field training · soldiers deal +50% damage','Rapid deployment · recruits twice as fast','Veterans · soldiers deal +50% damage'],['Reinforcements · squad cap 5','Combat armor · new soldiers gain health','Reserve squad · squad cap 7','Fortified gear · new soldiers gain more health']],
 flame:[['Pressure valve · faster fire','Hot fuel · +35% damage','Flashover · burns longer','Inferno · +50% damage'],['Wildfire · longer burn','Long nozzle · +30% range','Fuel mix · stronger burn','Firestorm · flames pierce two']],
 frost:[['Deep freeze · longer slow','Cold snap · +35% damage','Cryogenic · longer slow','Absolute zero · hits briefly stun'],['Shatter · bonus damage','Long hose · +25% range','Ice shards · pierces two','Blizzard · fires 25% faster']],
 cannon:[['Belt feed · faster fire','Heavy shell · +40% damage','Rapid loader · 25% faster','Siege cannon · +50% damage'],['Sabot · pierces three','Long barrel · +25% range','Tungsten · ignores armor','Rail shell · pierces five']],
 venom:[['Concentrate · stronger poison','Corrosive · ignores armor','Toxic load · +40% damage','Potent toxin · stronger poison'],['Contagion · longer poison','Long nozzle · +25% range','Twin nozzle · pierces two','Lingering toxin · longer poison']]
};
const omnidirectional=['gun','lightning','barracks','frost','venom','minigun','mortar','pulse'];
let started=false;
const maps={
 crossroads:{path:[[-30,300],[220,300],[310,320],[430,390],[570,410],[690,370],[800,325],[960,325]],alternate:[[-30,300],[220,300],[310,280],[430,210],[570,190],[690,250],[800,325],[960,325]],widths:[110,100,95,90,100,95,110]},
 switchback:{path:[[-30,430],[180,430],[280,410],[390,350],[510,300],[650,310],[800,325],[960,325]],alternate:[[-30,430],[180,430],[290,445],[410,500],[550,500],[680,425],[800,325],[960,325]],widths:[105,100,90,95,100,95,110]},
 longway:{path:[[-30,230],[200,230],[300,250],[420,320],[550,370],[680,370],[800,325],[960,325]],alternate:[[-30,230],[200,230],[300,210],[430,150],[560,150],[690,230],[800,325],[960,325]],widths:[100,95,90,100,100,95,110]},
 trifork:{path:[[-30,325],[180,325],[300,290],[420,160],[590,110],[720,190],[820,300],[960,325]],alternate:[[-30,325],[180,325],[300,360],[420,490],[590,540],[720,460],[820,350],[960,325]],extra:[[[-30,325],[180,325],[330,325],[500,325],[680,325],[820,325],[960,325]]],widths:[85,70,65,70,75,70,90]},
 narrow:{path:[[-30,280],[260,280],[390,300],[530,345],[680,370],[820,335],[960,325]],widths:[65,60,55,70,60,85]}
};
let activeMap=maps.crossroads,path=activeMap.path.map(([x,y])=>({x,y})),roadWidths=activeMap.widths,routes=[],segments=[];
function buildRoutes(){let paths=[activeMap.path,...(activeMap.alternate?[activeMap.alternate]:[]),...(activeMap.extra||[])];routes=paths.map(points=>({points:points.map(([x,y])=>({x,y})),widths:roadWidths}));segments=routes.flatMap(route=>route.points.slice(1).map((b,i)=>({a:route.points[i],b,width:route.widths[i]})))}
buildRoutes();
function roadSegments(){return segments}
function pathDistance(x,y){let best=Infinity;for(let {a,b,width} of roadSegments()){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy)-width/2)}return best}
function nearestRoad(x,y){let best=null,dist=Infinity;for(let {a,b} of roadSegments()){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))),point={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(point.x-x,point.y-y);if(d<dist){best=point;dist=d}}return best}
const FLOW_CELL=10,FLOW_COLS=100,FLOW_ROWS=65;
let flowField;
function buildFlowField(route=null){
 const size=FLOW_COLS*FLOW_ROWS,walkable=new Uint8Array(size),distance=new Float64Array(size);distance.fill(Infinity);
 let segments=route?route.points.slice(1).map((b,i)=>({a:route.points[i],b,width:route.widths[i]})):roadSegments();
 for(let y=0;y<FLOW_ROWS;y++)for(let x=0;x<FLOW_COLS;x++){let px=x*FLOW_CELL+5,py=y*FLOW_CELL+5;walkable[y*FLOW_COLS+x]=segments.some(({a,b,width})=>{let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(px-a.x-t*dx,py-a.y-t*dy)<=width/2-5})?1:0}
 const heap=[];
 function push(index,cost){let n=heap.length;heap.push({index,cost});while(n){let p=(n-1)>>1;if(heap[p].cost<=cost)break;heap[n]=heap[p];n=p}heap[n]={index,cost}}
 function pop(){let first=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=heap.length)break;let child=r<heap.length&&heap[r].cost<heap[l].cost?r:l;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child}heap[i]=last}return first}
 for(let y=0;y<FLOW_ROWS;y++)for(let x=94;x<FLOW_COLS;x++){let i=y*FLOW_COLS+x;if(walkable[i]&&Math.abs(y*10+5-325)<40){distance[i]=0;push(i,0)}}
 while(heap.length){let current=pop();if(current.cost!==distance[current.index])continue;let x=current.index%FLOW_COLS,y=Math.floor(current.index/FLOW_COLS);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy;if(nx<0||nx>=FLOW_COLS||ny<0||ny>=FLOW_ROWS)continue;let next=ny*FLOW_COLS+nx;if(!walkable[next]||(dx&&dy&&(!walkable[y*FLOW_COLS+nx]||!walkable[ny*FLOW_COLS+x])))continue;let cost=current.cost+(dx&&dy?14.142:10);if(cost<distance[next]){distance[next]=cost;push(next,cost)}}}
 return {walkable,distance};
}
function flowCell(x,y){let cx=Math.max(0,Math.min(FLOW_COLS-1,Math.floor(x/FLOW_CELL))),cy=Math.max(0,Math.min(FLOW_ROWS-1,Math.floor(y/FLOW_CELL)));return {x:cx,y:cy,index:cy*FLOW_COLS+cx}}
function flowProgress(x,y){let cell=flowCell(x,y),best=flowField.distance[cell.index];if(Number.isFinite(best))return best;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let nx=cell.x+dx,ny=cell.y+dy;if(nx>=0&&nx<FLOW_COLS&&ny>=0&&ny<FLOW_ROWS)best=Math.min(best,flowField.distance[ny*FLOW_COLS+nx]+Math.hypot(dx,dy)*FLOW_CELL)}return best}
function roadIsClear(a,b){
 let steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10);for(let i=1;i<steps;i++){let t=i/steps;if(pathDistance(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)>0)return false}return true;
}
function keepOnRoad(e){
 // Push a circular body inside the road and remove only velocity into the wall.
 for(let iteration=0;iteration<3;iteration++){
  let distance=pathDistance(e.x,e.y),limit=-e.r*.55;if(distance<=limit)return;
  let nx=pathDistance(e.x+1,e.y)-pathDistance(e.x-1,e.y),ny=pathDistance(e.x,e.y+1)-pathDistance(e.x,e.y-1),length=Math.hypot(nx,ny);
  if(length<.001){e.vy+=e.bias*8;return}
  nx/=length;ny/=length;let overlap=distance-limit;e.x-=nx*overlap;e.y-=ny*overlap;
  let outward=e.vx*nx+e.vy*ny;if(outward>0){e.vx-=outward*nx;e.vy-=outward*ny;if(Math.abs(ny)<.15)e.vy+=e.bias*8}
 }
}
function canPlace(p){return p.x>=45&&p.x<=910&&p.y>=45&&p.y<=605&&pathDistance(p.x,p.y)>=21&&!towers.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<44)}
let money=250,health=20,wave=0,towers=[],enemies=[],effects=[],projectiles=[],soldiers=[],selected=null,building=null,aiming=null,remaining=0,spawn=0,running=false,over=false,mouse={x:-100,y:-100};
const shop=document.querySelector('#shop'),details=document.querySelector('#details'),status=document.querySelector('#status'),upgradeDialog=document.querySelector('#upgradeDialog'),notice=document.querySelector('#notice');
let seenKinds=new Set(),noticeQueue=[],noticeTimer;
function showNotice(){if(!noticeQueue.length){notice.hidden=true;noticeTimer=null;return}notice.textContent=noticeQueue.shift();notice.hidden=false;noticeTimer=setTimeout(showNotice,6000)}
function announce(kind){if(seenKinds.has(kind))return;seenKinds.add(kind);noticeQueue.push(({normal:'Walker · A standard zombie.',big:'Brute · Larger and tougher. Deals extra base damage.',armor:'Armored zombie · Resists gun, shotgun and sniper damage.',shock:'Insulated zombie · Immune to lightning damage and stun.',fire:'Fireproof zombie · Immune to fire damage and burning.',cold:'Frostproof zombie · Immune to cryo damage and freezing.',toxic:'Hazmat zombie · Immune to poison damage and poison.'})[kind]);if(!noticeTimer)showNotice()}
const sprites = {}, towerIcons = {};
for (const [type, spec] of Object.entries(types)) {
  sprites[type] = FieldArt.tower(type, spec.color);
  towerIcons[type] = sprites[type].toDataURL();
}
const zombieSprites = {};
for (const [kind, color] of Object.entries({normal:'#92b286',armor:'#c8ad84',shock:'#b89bd1',fire:'#e8a27c',cold:'#96cdd7',toxic:'#b9ca73'})) {
  zombieSprites[kind] = [-1, 0, 1].map(step => FieldArt.zombie(kind, color, step));
}
const soldierSprite = FieldArt.infantry();
function towerIcon(type) { return towerIcons[type]; }
function ui(){document.querySelector('#money').textContent=money;document.querySelector('#health').textContent=health;document.querySelector('#wave').textContent=wave;document.querySelector('#cancel').hidden=!(building||aiming);document.querySelector('#placementLegend').hidden=!building;document.querySelector('#start').disabled=running||over;document.querySelector('#start').textContent=over?'Outpost lost':running?'Wave in progress':'Start wave →';shop.innerHTML='';Object.entries(types).forEach(([key,t])=>{let b=document.createElement('button');b.className='tower '+(building===key?'active':'');b.innerHTML=`<img class="icon" src="${towerIcon(key)}" alt=""><span><strong>${t.name}</strong></span><span class="cost">${t.cost} ⬡</span>`;b.onclick=()=>{upgradeDialog.hidden=true;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}building=key;selected=null;ui()};shop.appendChild(b)});if(selected){let t=selected, tracks=upgrades[t.type];details.innerHTML=`<small>SELECTED TOWER</small><h2>${types[t.type].name}</h2><p>Buy each tier in order.${t.type==='barracks'?`<br>Soldiers ${soldiers.filter(a=>a.home===t&&a.hp>0).length} / ${t.upgrades[1]>=3?7:t.upgrades[1]?5:3}${running?' deployed':' · deploy during waves'}`:''}</p><button class="sell" id="sellTower">SELL · ${Math.floor(t.spent*.7)} ⬡</button>${tracks.map((description,i)=>{let steps=description;return `<div class="track"><small>TRACK ${i+1}</small>${steps.map((step,n)=>{let level=t.upgrades[i],cost=[60,90,140,210][n],label=n<level?'PURCHASED':n===level?`${cost} ⬡`:'LOCKED';return `<button class="upgrade" id="track${i}-${n}" ${n!==level?'disabled':''}>${n+1}. ${step}<br>${label}</button>`}).join('')}</div>`}).join('')}`;document.querySelector('#sellTower').onclick=()=>{money+=Math.floor(t.spent*.7);towers=towers.filter(a=>a!==t);soldiers=soldiers.filter(a=>a.home!==t);selected=null;upgradeDialog.hidden=true;status.textContent='Tower sold';ui()};tracks.forEach((description,i)=>{let level=t.upgrades[i];if(level>=4)return;document.querySelector(`#track${i}-${level}`).onclick=()=>{let cost=[60,90,140,210][level];if(money<cost){status.textContent='Not enough supplies';return}money-=cost;t.upgrades[i]++;t.spent+=cost;if(t.type==='barracks'&&i===1&&(level===0||level===2))t.cool=0;applyUpgrade(t,i,level);ui()}})}else details.innerHTML='<small>SELECTED TOWER</small><p>Select a placed tower to view its upgrades.</p>'}
function applyUpgrade(t,path,tier){
 const damage={minigun:[[0,.35,0,.4],[0,0,.35,0]],mortar:[[0,.4,0,.4],[0,0,0,0]],pulse:[[.35,0,.4,0],[0,0,0,0]],gun:[[0,0,.4,0],[0,0,0,0]],sniper:[[0,.5,0,0],[0,0,0,0]],shotgun:[[0,.35,0,0],[0,.35,0,0]],rocket:[[0,.4,0,.6],[0,0,0,0]],lightning:[[0,.35,0,.5],[0,0,0,0]],flame:[[0,.35,0,.5],[0,0,0,0]],frost:[[0,.35,0,0],[0,0,0,0]],cannon:[[0,.4,0,.5],[0,0,0,0]],venom:[[0,0,.4,0],[0,0,0,0]]};
 const ranges={minigun:[1,1],mortar:[1,0],pulse:[1,0],gun:[1,1],sniper:[1,1],shotgun:[1,0],flame:[1,1],frost:[1,1],cannon:[1,1],venom:[1,1]};
 let boost=damage[t.type]?.[path]?.[tier]||0;if(boost)t.damage*=1+boost;
 if(ranges[t.type]?.[0]===path&&ranges[t.type]?.[1]===tier)t.range*=t.type==='sniper'||t.type==='shotgun'||t.type==='flame'?1.3:1.25;
}
function pos(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*1000/r.width,y:(e.clientY-r.top)*650/r.height}}
canvas.onmousemove=e=>mouse=pos(e);canvas.onclick=e=>{let p=pos(e);if(aiming){aiming.facing=Math.atan2(p.y-aiming.y,p.x-aiming.x);aiming.angle=aiming.facing;aiming=null;status.textContent='Tower deployed';ui();return}if(building){let t=types[building];if(money<t.cost){status.textContent='Not enough supplies';return}if(!canPlace(p)){status.textContent='Choose a clear spot';return}money-=t.cost;let tower={type:building,x:p.x,y:p.y,range:t.range,damage:t.damage,cool:0,angle:0,facing:0,upgrades:[0,0],spent:t.cost};towers.push(tower);aiming=omnidirectional.includes(building)?null:tower;building=null;status.textContent=aiming?'Click to choose firing direction':'Tower deployed';ui();return}selected=towers.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<23)||null;ui();upgradeDialog.hidden=!selected};document.querySelector('#closeDetails').onclick=()=>{upgradeDialog.hidden=true;selected=null;ui()};function cancelPlacement(){building=null;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}status.textContent='Placement cancelled';ui()}document.querySelector('#cancel').onclick=cancelPlacement;document.onkeydown=e=>{if(e.key==='Escape'&&(building||aiming))cancelPlacement()};document.querySelector('#start').onclick=()=>{wave++;remaining=wave<=3?[12,18,25][wave-1]:8+wave*6;running=true;spawn=0;status.textContent='Wave '+wave+' incoming';ui()};
function hit(e,damage,type,ignoreArmor=false){if((e.kind==='shock'&&type==='lightning')||(e.kind==='fire'&&type==='flame')||(e.kind==='cold'&&type==='frost')||(e.kind==='toxic'&&type==='venom'))return;let multiplier=!ignoreArmor&&e.kind==='armor'&&['gun','shotgun','sniper'].includes(type)?.5:1;e.hp-=damage*multiplier}
function fire(t,target){
 let type=t.type;t.angle=Math.atan2(target.y-t.y,target.x-t.x);if(type!=='lightning'&&type!=='pulse')effects.push({x:t.x+Math.cos(t.angle)*20,y:t.y+Math.sin(t.angle)*20,flash:true,time:.08,color:type==='flame'?'#ff9a45':'#ffe7a0'});
 if(['gun','sniper','shotgun','flame','frost','cannon','venom','minigun'].includes(type)){
  let count=type==='shotgun'?(t.upgrades[0]>=4?15:t.upgrades[0]>=1?11:7):type==='gun'&&t.upgrades[0]>=2?2:1;
  for(let i=0;i<count;i++){
   let angle=t.angle+(type==='shotgun'?(i-(count-1)/2)*.10:0);
   projectiles.push({x:t.x,y:t.y,dx:Math.cos(angle),dy:Math.sin(angle),speed:type==='sniper'?700:480,remaining:t.range,damage:t.damage,type,pierce:type==='sniper'?(t.upgrades[0]>=3?6:t.upgrades[0]>=1?4:2):(type==='gun'&&t.upgrades[1]>=4?4:type==='gun'&&t.upgrades[1]?2:type==='cannon'&&t.upgrades[1]>=4?5:type==='cannon'&&t.upgrades[1]?3:type==='shotgun'&&t.upgrades[1]>=3?2:type==='flame'&&t.upgrades[1]>=4?2:type==='frost'&&t.upgrades[1]>=3?2:type==='venom'&&t.upgrades[1]>=3?2:type==='minigun'&&t.upgrades[1]>=1?2:1),ability:t.upgrades.slice(),ignoreArmor:(type==='gun'&&t.upgrades[1]>=3)||(type==='cannon'&&t.upgrades[1]>=3)||(type==='venom'&&t.upgrades[0]>=2)||(type==='minigun'&&t.upgrades[1]>=4),stun:type==='sniper'&&t.upgrades[1],hit:[]});
  }
 }else if(type==='rocket'||type==='mortar'){
  projectiles.push({x:t.x,y:t.y,dx:Math.cos(t.angle),dy:Math.sin(t.angle),speed:type==='mortar'?190:260,remaining:Math.hypot(target.x-t.x,target.y-t.y),total:Math.hypot(target.x-t.x,target.y-t.y),damage:t.damage,type,pierce:1,hit:[],radius:type==='mortar'?(t.upgrades[0]?48:35):(t.upgrades[0]>=3?65:t.upgrades[0]?48:35),slow:t.upgrades[1]>=(type==='mortar'?2:1),push:type==='mortar'&&t.upgrades[1]>=3,blastStun:type==='mortar'&&t.upgrades[1]>=4,burn:type==='rocket'&&t.upgrades[1]>=3?(t.upgrades[1]>=4?5:3):0});
 }else if(type==='pulse'){
  for(let e of enemies){let dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy);if(d<t.range&&d>0){hit(e,t.damage,type);let force=t.upgrades[1]>=3?100:60;e.vx+=dx/d*force;e.vy+=dy/d*force;if(t.upgrades[1]>=2)e.stun=t.upgrades[1]>=4?1:.4}}effects.push({x:t.x,y:t.y,r:t.range,time:.25,color:'#c7c1ff'});
 }else if(type==='lightning'){
  let current=target,seen=[];
  for(let i=0;i<(t.upgrades[1]>=3?10:t.upgrades[1]?7:4)&&current;i++){
   seen.push(current);hit(current,t.damage,type);if(current.kind!=='shock')current.stun=t.upgrades[1]>=4?1.3:t.upgrades[1]>=2?.85:.5;
   let next=enemies.filter(e=>!seen.includes(e)&&Math.hypot(e.x-current.x,e.y-current.y)<(t.upgrades[0]>=3?130:90)).sort((a,b)=>Math.hypot(a.x-current.x,a.y-current.y)-Math.hypot(b.x-current.x,b.y-current.y))[0];
   effects.push({x:i?seen[i-1].x:t.x,y:i?seen[i-1].y:t.y,x2:current.x,y2:current.y,time:.16,color:'#a4f4f2'});current=next;
  }
 }
}
function moveProjectiles(dt){
 for(let p of projectiles){
  let distance=Math.min(p.speed*dt,p.remaining),startX=p.x,startY=p.y;
  let hits=(p.type==='mortar'?[]:enemies).filter(e=>e.hp>0&&!p.hit.includes(e)).map(e=>{
   let along=(e.x-startX)*p.dx+(e.y-startY)*p.dy;
   let side=Math.abs((e.x-startX)*p.dy-(e.y-startY)*p.dx);
   let entry=along-Math.sqrt(Math.max(0,e.r*e.r-side*side));
   return {enemy:e,entry,side,along};
  }).filter(h=>h.side<=h.enemy.r&&h.along+h.enemy.r>=0&&h.entry<=distance).sort((a,b)=>a.entry-b.entry);
  for(let h of hits){if(p.type==='rocket'||p.type==='mortar'){distance=Math.max(0,h.entry);p.pierce=0;break}hit(h.enemy,p.damage+(p.type==='frost'&&p.ability[1]?6:0),p.type,p.ignoreArmor);if((p.type==='gun'&&p.ability[0]>=4)||(p.type==='shotgun'&&p.ability[1]>=4)||(p.type==='sniper'&&p.ability[0]>=4))h.enemy.slow=1.5;if(p.type==='frost'&&p.ability[0]>=4&&h.enemy.kind!=='cold')h.enemy.stun=.4;if((p.type==='flame'&&h.enemy.kind!=='fire')||(p.type==='venom'&&h.enemy.kind!=='toxic')){h.enemy.poison=p.ability[1]>=4?7:p.ability[1]||p.ability[0]>=3?4:2;h.enemy.poisonDamage=p.type==='venom'&&p.ability[0]>=4?12:(p.type==='venom'&&p.ability[0]||p.type==='flame'&&p.ability[1]>=3)?8:4}if(p.type==='frost'&&h.enemy.kind!=='cold')h.enemy.slow=p.ability[0]>=3?6:p.ability[0]?4:2;if(p.stun)h.enemy.stun=p.ability[1]>=4?1.2:.6;p.hit.push(h.enemy);p.pierce--;if(p.pierce<=0){distance=Math.max(0,h.entry);break}}
  p.x+=p.dx*distance;p.y+=p.dy*distance;p.remaining-=distance;if((p.type==='rocket'||p.type==='mortar')&&(p.pierce<=0||p.remaining<=0)){for(let e of enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<p.radius){hit(e,p.damage,p.type);if(p.slow)e.slow=3;if(p.push){let dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;e.vx+=dx/d*70;e.vy+=dy/d*70}if(p.blastStun)e.stun=.5;if(p.burn&&e.kind!=='fire'){e.poison=p.burn;e.poisonDamage=5}}effects.push({x:p.x,y:p.y,r:p.radius,time:.25,color:'#f6a357'})}
 }
 projectiles=projectiles.filter(p=>p.remaining>0&&p.pierce>0);
}
function update(dt){if(!started||over)return;if(running&&remaining>0){spawn-=dt;if(spawn<=0){let available=['normal'];if(wave>=3)available.push('armor');if(wave>=5)available.push('shock');if(wave>=7)available.push('fire');if(wave>=9)available.push('cold');if(wave>=11)available.push('toxic');let kind=Math.random()<.5?'normal':available[Math.floor(Math.random()*available.length)],big=wave>=2&&Math.random()<Math.min(.3,wave*.035),hp=(20+wave*5)*(big?2.8:1);let radius=big?14:9,lanes=[path[0].y-28,path[0].y,path[0].y+28].filter(y=>enemies.every(e=>Math.hypot(e.x+20,e.y-y)>=e.r+radius+1));if(lanes.length){let y=lanes[Math.floor(Math.random()*lanes.length)];announce(kind);if(big)announce('big');enemies.push({x:-20,y,vx:0,vy:0,bias:Math.random()<.5?-1:1,r:radius,hp,max:hp,kind,speed:(49+Math.random()*18)*(big?.75:1)*(wave<=3?[.7,.8,.9][wave-1]:1),stun:0,phase:Math.random()*6});remaining--;spawn=wave<=3?[.7,.6,.5][wave-1]:Math.max(.12,.42-wave*.015)}else spawn=.05}}for(let e of enemies){
 e.stun-=dt;if(e.poison>0){e.hp-=e.poisonDamage*dt;e.poison-=dt}e.slow=(e.slow||0)-dt;
 let progress=flowProgress(e.x,e.y),defender=null,closest=110;
 for(let soldier of soldiers){let d=Math.hypot(soldier.x-e.x,soldier.y-e.y);if(soldier.hp>0&&d<closest&&flowProgress(soldier.x,soldier.y)<=progress-5&&roadIsClear(e,soldier)){defender=soldier;closest=d}}
 let inMelee=defender&&closest<e.r+10;
 if(inMelee&&e.stun<=0){e.attack=(e.attack||0)-dt;if(e.attack<=0){defender.hp-=8;e.attack=.7}}
 let drag=Math.exp(-3.5*dt),speed=e.speed*(e.slow>0?.55:1);
 if(e.stun>0||inMelee){e.vx*=drag;e.vy*=drag}else{
  // The same pull acts on every zombie. Soldiers can attract nearby zombies
  // only when they are ahead along the route.
  let dx=defender?defender.x-e.x:1,dy=defender?defender.y-e.y:0,length=Math.hypot(dx,dy)||1;
  e.vx=e.vx*drag+dx/length*speed*(1-drag);e.vy=e.vy*drag+dy/length*speed*(1-drag);
  e.x+=e.vx*dt;e.y+=e.vy*dt;keepOnRoad(e);
  if(Math.hypot(e.vx,e.vy)>1)e.angle=Math.atan2(e.vy,e.vx);
 }
 e.phase+=dt*7;if(e.x>940&&Math.abs(e.y-325)<55){health-=e.r>10?2:1;e.hp=0;if(health<=0){health=0;over=true;running=false}ui()}
}
// Resolve nearby bodies with a spatial grid so crowds can spread without an all-pairs scan.
for(let pass=0;pass<2;pass++){
 let buckets=new Map(),cellSize=32;
 for(let e of enemies){if(e.hp<=0)continue;let cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){let bucket=buckets.get(x+','+y);if(!bucket)continue;for(let other of bucket){let dx=e.x-other.x,dy=e.y-other.y,d=Math.hypot(dx,dy),minimum=e.r+other.r;if(d>=minimum)continue;if(d<.01){dx=0;dy=1;d=1}let shift=(minimum-d)/2,ex=dx/d*shift,ey=dy/d*shift;e.x+=ex;e.y+=ey;other.x-=ex;other.y-=ey;let relative=(e.vx-other.vx)*dx/d+(e.vy-other.vy)*dy/d;if(relative<0){let impulse=-relative*.35;e.vx+=dx/d*impulse;e.vy+=dy/d*impulse;other.vx-=dx/d*impulse;other.vy-=dy/d*impulse}keepOnRoad(e);keepOnRoad(other)}}let key=cx+','+cy;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e)}
}
for(let t of towers){if(t===aiming)continue;t.cool-=dt;if(t.type==='barracks'){if(running&&t.cool<=0&&soldiers.filter(a=>a.home===t).length<(t.upgrades[1]>=3?7:t.upgrades[1]?5:3)){let rally=nearestRoad(t.x,t.y),dx=t.x-rally.x,dy=t.y-rally.y,d=Math.hypot(dx,dy)||1;soldiers.push({home:t,x:rally.x+dx/d*12,y:rally.y+dy/d*12,hp:t.upgrades[1]>=4?90:t.upgrades[1]>=2?67.5:45,cool:0,rally});t.cool=types.barracks.rate*(t.upgrades[0]>=3?.5:1);if(selected===t)ui()}continue}let target=enemies.filter(e=>{let angle=Math.atan2(e.y-t.y,e.x-t.x),difference=Math.atan2(Math.sin(angle-t.facing),Math.cos(angle-t.facing));return e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.range&&(omnidirectional.includes(t.type)||Math.abs(difference)<=Math.PI/4)}).sort((a,b)=>b.x-a.x)[0];if(target&&t.cool<=0){fire(t,target);t.cool=types[t.type].rate*((t.upgrades[0]&&['gun','lightning','flame','cannon','minigun'].includes(t.type))?.75:1)*((t.type==='minigun'&&t.upgrades[0]>=3||t.type==='mortar'&&t.upgrades[0]>=3||t.type==='pulse'&&t.upgrades[0]>=2)?.75:1)*((t.type==='pulse'&&t.upgrades[0]>=4)?.75:1)*((t.upgrades[0]>=3&&['shotgun','cannon'].includes(t.type))?.75:1)*((t.upgrades[1]>=3&&t.type==='sniper'||t.upgrades[1]>=2&&t.type==='rocket'||t.upgrades[1]>=4&&t.type==='frost')?.75:1)}}for(let a of soldiers){a.cool-=dt;let target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-a.home.x,e.y-a.home.y)<a.home.range+60).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];if(target){let dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);a.angle=Math.atan2(dy,dx);if(d>85){a.x+=dx/d*45*dt;a.y+=dy/d*45*dt}else if(a.cool<=0){projectiles.push({x:a.x,y:a.y,dx:dx/d,dy:dy/d,speed:400,remaining:100,damage:a.home.upgrades[0]>=4?9:a.home.upgrades[0]>=2?6:4,type:'soldier',pierce:1,ability:[],hit:[]});a.cool=a.home.upgrades[0]?.5:.8}}else{let dx=a.rally.x-a.x,dy=a.rally.y-a.y,d=Math.hypot(dx,dy);if(d>5){a.x+=dx/d*40*dt;a.y+=dy/d*40*dt}}}let previousSoldierCount=soldiers.length;soldiers=soldiers.filter(a=>a.hp>0);if(selected&&selected.type==='barracks'&&soldiers.length!==previousSoldierCount)ui();for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++){let a=soldiers[i],b=soldiers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16){if(d<.01){dx=1;dy=0;d=1}let shift=(16-d)/2;a.x-=dx/d*shift;a.y-=dy/d*shift;b.x+=dx/d*shift;b.y+=dy/d*shift}}moveProjectiles(dt);let dead=enemies.filter(e=>e.hp<=0&&e.x<=940);if(dead.length){money+=dead.length*4;ui()}enemies=enemies.filter(e=>e.hp>0);effects.forEach(e=>e.time-=dt);effects=effects.filter(e=>e.time>0);if(running&&!remaining&&!enemies.length){running=false;soldiers=[];money+=30+wave*5;status.textContent='Wave cleared · supplies delivered';ui()}}
function makeMap() {
  const seed = 372 + Object.values(maps).indexOf(activeMap) * 101;
  return FieldArt.terrain(routes, roadSegments(), pathDistance, seed);
}
function makePlacementOverlay(){
 let c=document.createElement('canvas');c.width=500;c.height=325;let g=c.getContext('2d'),data=g.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let px=x*2+1,py=y*2+1,valid=px>=45&&px<=910&&py>=45&&py<=605&&pathDistance(px,py)>=21,i=(y*c.width+x)*4;data.data[i]=valid?115:190;data.data[i+1]=valid?195:63;data.data[i+2]=valid?100:50;data.data[i+3]=valid?42:75}g.putImageData(data,0,0);return c;
}
let mapArt, placementOverlay;
function drawRanges() {
  if (building) {
    ctx.drawImage(placementOverlay,0,0,1000,650);
    for (const t of towers) {
      ctx.beginPath(); ctx.arc(t.x,t.y,44,0,Math.PI*2);
      ctx.fillStyle='#bd483b55'; ctx.fill();
    }
    const valid=canPlace(mouse);
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,types[building].range,0,Math.PI*2);
    ctx.strokeStyle='#f5f1d68c'; ctx.lineWidth=1; ctx.stroke();
    ctx.globalAlpha=.66;
    ctx.drawImage(sprites[building],mouse.x-32,mouse.y-32,64,64);
    ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,22,0,Math.PI*2);
    ctx.fillStyle=valid?'#9bef9f48':'#f3615199';
    ctx.strokeStyle=valid?'#ccf7b5':'#ff927d'; ctx.lineWidth=2; ctx.fill(); ctx.stroke();
  }
  const tower=aiming||selected;
  if (!tower) return;
  const angle=aiming?Math.atan2(mouse.y-tower.y,mouse.x-tower.x):tower.facing;
  ctx.beginPath();
  if (omnidirectional.includes(tower.type)) ctx.arc(tower.x,tower.y,tower.range,0,2*Math.PI);
  else {
    ctx.moveTo(tower.x,tower.y);
    ctx.arc(tower.x,tower.y,tower.range,angle-Math.PI/4,angle+Math.PI/4);
    ctx.closePath();
  }
  ctx.fillStyle='#f5dba424'; ctx.strokeStyle='#ffe0ae'; ctx.lineWidth=1.4; ctx.fill(); ctx.stroke();
  if(aiming) tower.angle=angle;
}
function drawUnit(sprite,unit,left,top,width,height) {
  ctx.save(); ctx.translate(unit.x,unit.y); ctx.rotate(unit.angle||0);
  ctx.drawImage(sprite,left,top,width,height); ctx.restore();
}
function draw() {
  if (!started) return;
  ctx.drawImage(mapArt,0,0,1000,650);
  drawRanges();
  for (const t of towers) drawUnit(sprites[t.type],t,-32,-32,64,64);
  for (const a of soldiers) drawUnit(soldierSprite,a,-14,-12,32,24);
  for (const e of enemies) {
    const size=e.r/9;
    const frame=e.stun>0?1:Math.round(Math.sin(e.phase))+1;
    drawUnit(zombieSprites[e.kind][frame],e,-15*size,-14*size,34*size,28*size);
    if(e.hp<e.max){
      ctx.fillStyle='#253533'; ctx.fillRect(e.x-9,e.y-e.r-5,18,2.5);
      ctx.fillStyle='#f4ce93'; ctx.fillRect(e.x-9,e.y-e.r-5,18*Math.max(0,e.hp/e.max),2.5);
    }
  }
  for(const p of projectiles) FieldArt.round(ctx,p);
  for(const e of effects) FieldArt.effect(ctx,e);
  if(over){
    ctx.fillStyle='#102326c9'; ctx.fillRect(0,0,1000,650);
    ctx.fillStyle='#f4f0dd'; ctx.textAlign='center'; ctx.font='bold 46px system-ui';
    ctx.fillText('The outpost has fallen',500,310); ctx.font='18px system-ui';
    ctx.fillText('Refresh to try again',500,350);
  }
}
const landscape = document.querySelector('#landscape');
FieldArt.landscape(landscape);
window.addEventListener('resize', () => { if (!started) FieldArt.landscape(landscape); });
let last=performance.now();function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}ui();requestAnimationFrame(loop);

document.querySelector('#play').onclick=()=>{let map=maps[document.querySelector('#mapSelect').value];path=map.path.map(([x,y])=>({x,y}));roadWidths=map.widths;activeMap=map;buildRoutes();flowField=buildFlowField();mapArt=makeMap();placementOverlay=makePlacementOverlay();started=true;document.querySelector('#menu').hidden=true;last=performance.now()};
