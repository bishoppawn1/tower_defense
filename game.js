const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
ctx.scale(2,2);
const types={gun:{name:'Gun tower',cost:50,range:140,rate:.45,damage:9,color:'#d5dcb3',desc:'Reliable single-target fire'},sniper:{name:'Sniper tower',cost:85,range:260,rate:1.65,damage:30,color:'#d6c89a',desc:'Long range · piercing shots'},shotgun:{name:'Shotgun tower',cost:75,range:100,rate:1.1,damage:9,color:'#e0b26d',desc:'Short range · directional spread'},rocket:{name:'Rocket tower',cost:110,range:180,rate:1.6,damage:30,color:'#d6845e',desc:'Explosive area damage'},lightning:{name:'Lightning tower',cost:120,range:150,rate:1.35,damage:13,color:'#8bc8d0',desc:'Chains between enemies · stuns'}};
Object.assign(types,{barracks:{name:'Barracks',cost:110,range:130,rate:8,damage:0,color:'#79a7ad',desc:'Deploys soldiers during waves'},flame:{name:'Flamethrower',cost:90,range:105,rate:.18,damage:4,color:'#f18d4c',desc:'Short-range stream · burns'},frost:{name:'Cryo tower',cost:95,range:140,rate:.8,damage:6,color:'#9adbe2',desc:'Chilling rounds slow zombies'},cannon:{name:'Autocannon',cost:125,range:180,rate:.65,damage:18,color:'#d8c17e',desc:'Heavy armor-piercing shells'},venom:{name:'Toxic sprayer',cost:100,range:130,rate:.7,damage:5,color:'#b2d75d',desc:'Poison damages over time'}});
const upgrades={
 gun:[['Rapid feed · fires 25% faster','Double tap · fires two rounds','Heavy rounds · +40% damage','Suppressive fire · bullets briefly slow'],['Tracer · bullets hit two targets','Long barrel · +25% range','Armor breaker · ignores armor','Belt fed · bullets hit four targets']],
 sniper:[['Hardened rounds · pierces four','High caliber · +50% damage','Rail shot · pierces six','Shockwave · hits slow zombies'],['Concussion · briefly stuns','Spotter · +30% range','Quick chamber · 25% faster','Crippling shot · longer stun']],
 shotgun:[['Wide load · 11 pellets','Close quarters · +35% damage','Drum magazine · 25% faster','Storm shot · 15 pellets'],['Choke · +30% range','Heavy pellets · +35% damage','Shrapnel · pellets pierce two','Stopping power · pellets slow']],
 rocket:[['Blast charge · larger explosion','Heavy warhead · +40% damage','Cluster charge · wider blast','Siege warhead · +60% damage'],['Napalm · slows survivors','Accelerator · 25% faster','Incendiary · burns survivors','Firestorm · longer burn']],
 lightning:[['Capacitor · 25% faster','High voltage · +35% damage','Arc relay · chains further','Overcharge · +50% damage'],['Conductor · chains to seven','Static field · longer stun','Storm relay · chains to ten','Lockdown · longer stun']],
 barracks:[['Training · soldiers attack faster','Field training · soldiers deal +50% damage','Rapid deployment · recruits twice as fast','Veterans · soldiers deal +50% damage'],['Reinforcements · larger squad','Combat armor · new soldiers gain health','Reserve squad · more soldiers','Fortified gear · new soldiers gain more health']],
 flame:[['Pressure valve · faster fire','Hot fuel · +35% damage','Flashover · burns longer','Inferno · +50% damage'],['Wildfire · longer burn','Long nozzle · +30% range','Fuel mix · stronger burn','Firestorm · flames pierce two']],
 frost:[['Deep freeze · longer slow','Cold snap · +35% damage','Cryogenic · longer slow','Absolute zero · hits briefly stun'],['Shatter · bonus damage','Long hose · +25% range','Ice shards · pierces two','Blizzard · fires 25% faster']],
 cannon:[['Belt feed · faster fire','Heavy shell · +40% damage','Rapid loader · 25% faster','Siege cannon · +50% damage'],['Sabot · pierces three','Long barrel · +25% range','Tungsten · ignores armor','Rail shell · pierces five']],
 venom:[['Concentrate · stronger poison','Corrosive · ignores armor','Toxic load · +40% damage','Potent toxin · stronger poison'],['Contagion · longer poison','Long nozzle · +25% range','Twin nozzle · pierces two','Lingering toxin · longer poison']]
};
const omnidirectional=['gun','lightning','barracks','frost','venom'];
let started=false;
const maps={
 crossroads:{path:[[-30,190],[310,190],[310,425],[610,425],[610,230],[800,230],[800,325],[960,325]],widths:[100,76,100,70,92,70,105]},
 switchback:{path:[[-30,480],[240,480],[240,170],[500,170],[500,385],[720,385],[720,325],[960,325]],widths:[100,82,110,72,100,76,105]},
 longway:{path:[[-30,320],[180,320],[180,120],[430,120],[430,500],[700,500],[700,325],[960,325]],widths:[90,70,100,80,110,70,105]}
};
let path=maps.crossroads.path.map(([x,y])=>({x,y})),roadWidths=maps.crossroads.widths,routes=[],segments=[];
function buildRoutes(){let y=path[1].y<300?75:575;let alternative=[path[0],path[1],{x:path[1].x,y},{x:path[4].x,y},path[4],...path.slice(5)];routes=[{points:path,widths:roadWidths},{points:alternative,widths:[roadWidths[0],72,85,72,...roadWidths.slice(4)]}];segments=routes.flatMap(route=>route.points.slice(1).map((b,i)=>({a:route.points[i],b,width:route.widths[i]})))}
buildRoutes();
function roadSegments(){return segments}
function pathDistance(x,y){let best=Infinity;for(let {a,b,width} of roadSegments()){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy)-width/2)}return best}
function nearestRoad(x,y){let best=null,dist=Infinity;for(let {a,b} of roadSegments()){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))),point={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(point.x-x,point.y-y);if(d<dist){best=point;dist=d}}return best}
const FLOW_CELL=10,FLOW_COLS=100,FLOW_ROWS=65;
let flowField,routeFields=[];
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
function flowDirection(e){
 let field=routeFields.find((field,i)=>routes[i].points===e.route)||flowField,cell=flowCell(e.x,e.y),current=field.distance[cell.index],best=Infinity,tx=0,ty=0;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let x=cell.x+dx,y=cell.y+dy;if(x<0||x>=FLOW_COLS||y<0||y>=FLOW_ROWS)continue;let i=y*FLOW_COLS+x,d=field.distance[i];if(!Number.isFinite(d))continue;let px=x*10+5,py=y*10+5,score=d+Math.hypot(px-e.x,py-e.y)*.45;if(d<current&&score<best){best=score;tx=px;ty=py}}
 if(!Number.isFinite(best)){let road=nearestRoad(e.x,e.y);return {x:road.x-e.x+1,y:road.y-e.y}}
 return {x:tx-e.x,y:ty-e.y};
}
function canPlace(p){return p.x>=45&&p.x<=910&&p.y>=45&&p.y<=605&&pathDistance(p.x,p.y)>=21&&!towers.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<44)}
let money=250,health=20,wave=0,towers=[],enemies=[],effects=[],projectiles=[],soldiers=[],selected=null,building=null,aiming=null,remaining=0,spawn=0,running=false,over=false,mouse={x:-100,y:-100};
const shop=document.querySelector('#shop'),details=document.querySelector('#details'),status=document.querySelector('#status'),upgradeDialog=document.querySelector('#upgradeDialog'),notice=document.querySelector('#notice');
let seenKinds=new Set(),noticeQueue=[],noticeTimer;
function showNotice(){if(!noticeQueue.length){notice.hidden=true;noticeTimer=null;return}notice.textContent=noticeQueue.shift();notice.hidden=false;noticeTimer=setTimeout(showNotice,6000)}
function announce(kind){if(seenKinds.has(kind))return;seenKinds.add(kind);noticeQueue.push(({normal:'Walker · A standard zombie.',big:'Brute · Larger and tougher. Deals extra base damage.',armor:'Armored zombie · Resists gun, shotgun and sniper damage.',shock:'Insulated zombie · Immune to lightning damage and stun.'})[kind]);if(!noticeTimer)showNotice()}
const spritePatterns={
 gun:['..KKKKKK....','..KMMMMK....','.KMMHHMMK...','KMMMHMMMKKKK','KMMACAAAMMHK','KMMACAAAMMHK','KMMMHMMMKKKK','.KMMHHMMK...','..KMMMMK....','..KKKKKK....'],
 sniper:['..KKKKKK......','..KMMMMK......','.KMMHHMMK.....','KMMMAAMMKKKKKK','KMMMACAAMMMHHK','KMMMAAMMKKKKKK','.KMMHHMMK.....','..KMMMMK......','..KKKKKK......'],
 shotgun:['..KKKKKK.....','..KMMMMK.....','.KMHHHMMKKKK.','KMMMAAMMMHHKK','KMMMACAMMHHHK','KMMMAAMMMHHKK','.KMHHHMMKKKK.','..KMMMMK.....','..KKKKKK.....'],
 rocket:['..KKKKKK....','.KKMMMMKK...','KMMHHHHMMKK.','KMMMAAAAMMKK','KMMAACCAAMHK','KMMMAAAAMMKK','KMMHHHHMMKK.','.KKMMMMKK...','..KKKKKK....'],
 lightning:['..KKKKKK....','.KMMHHMMK...','KMMHAAHMMK..','KMMHCCAHMKK.','KMMACCAAMMHK','KMMHACCHMKK.','KMMHAAHMMK..','.KMMHHMMK...','..KKKKKK....'],
 barracks:['.KKKKKKKKKK.','KKMMMMMMMMKK','KMHHHHHHHHMK','KMHMMMMMMHMK','KMHMMCCMMHMK','KMHMCCCCMHMK','KMHMMCCMMHMK','KMHMMMMMMHMK','KMHHHHHHHHMK','KKMMMMMMMMKK','.KKKKKKKKKK.'],
 flame:['..KKKKKK.....','.KMMMMMMK....','KMMHHHHMMKK..','KMMAAAAMMMKKK','KMMACCAAMMHHK','KMMAAAAMMMKKK','KMMHHHHMMKK..','.KMMMMMMK....','..KKKKKK.....'],
 frost:['..KKKKKK....','.KMMHHMMK...','KMMHAAHMMK..','KMHACCAHMKK.','KMMHCCAHMMHK','KMHACCAHMKK.','KMMHAAHMMK..','.KMMHHMMK...','..KKKKKK....'],
 cannon:['..KKKKKK......','.KMMMMMMK.....','KMMHHHHMMKKKK.','KMMAAAAMMMMHHK','KMMACCAAMMMHHK','KMMAAAAMMMMHHK','KMMHHHHMMKKKK.','.KMMMMMMK.....','..KKKKKK......'],
 venom:['..KKKKKK....','.KMMHHMMK...','KMMHAAHMMKK.','KMMAACCAAMKK','KMMACCCAMMHK','KMMAACCAAMKK','KMMHAAHMMKK.','.KMMHHMMK...','..KKKKKK....']};
function pixelSprite(pattern,palette){let c=document.createElement('canvas');c.width=Math.max(...pattern.map(row=>row.length));c.height=pattern.length;let g=c.getContext('2d');pattern.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(palette[pixel]){g.fillStyle=palette[pixel];g.fillRect(x,y,1,1)}}));return c}
function makeTowerSprite(type){
 const c=document.createElement('canvas');c.width=44;c.height=36;const g=c.getContext('2d'),accent=types[type].color;
 // A compact, shaded housing with mechanical details, facing right.
 g.fillStyle='#18241f';g.fillRect(7,7,23,22);g.fillRect(3,11,32,14);g.fillStyle='#384c3f';g.fillRect(8,8,21,20);g.fillRect(4,12,29,12);
 g.fillStyle='#74836a';g.fillRect(9,9,18,18);g.fillStyle='#a1ad8c';g.fillRect(10,10,16,3);g.fillStyle='#4e6251';g.fillRect(9,21,18,5);
 g.fillStyle='#202b25';g.fillRect(13,12,12,12);g.fillStyle=accent;g.fillRect(15,14,8,8);g.fillStyle='#dce3bb';g.fillRect(16,15,4,2);
 g.fillStyle='#1d2822';g.fillRect(24,14,17,8);g.fillStyle='#75876e';g.fillRect(25,15,13,3);g.fillStyle='#111c19';g.fillRect(38,13,5,10);
 g.fillStyle='#d9ba71';g.fillRect(10,15,2,2);g.fillRect(10,22,2,2);g.fillStyle='#a3b49a';g.fillRect(6,13,3,2);g.fillRect(6,21,3,2);
 if(type==='sniper'||type==='cannon'){g.fillStyle='#192620';g.fillRect(28,15,16,6);g.fillStyle='#9aaa92';g.fillRect(29,16,12,2)}
 if(type==='shotgun'){g.fillStyle='#1a2520';g.fillRect(26,10,14,6);g.fillRect(26,20,14,6);g.fillStyle='#899982';g.fillRect(28,11,10,2);g.fillRect(28,21,10,2)}
 if(type==='rocket'){g.fillStyle='#29342a';g.fillRect(20,8,16,20);g.fillStyle='#a06a4f';g.fillRect(22,10,12,16);g.fillStyle='#242e26';for(let y=12;y<25;y+=6)g.fillRect(29,y,5,4)}
 if(type==='lightning'||type==='frost'){g.fillStyle=accent;g.fillRect(12,5,3,8);g.fillRect(21,5,3,8);g.fillStyle='#e3efce';g.fillRect(13,5,1,5);g.fillRect(22,5,1,5)}
 if(type==='flame'||type==='venom'){g.fillStyle='#27372c';g.fillRect(4,8,9,20);g.fillStyle=accent;g.fillRect(6,10,5,15);g.fillStyle='#c4caa0';g.fillRect(7,11,2,8)}
 if(type==='barracks'){g.clearRect(0,0,44,36);g.fillStyle='#1d2923';g.fillRect(5,4,30,28);g.fillStyle='#748778';g.fillRect(7,6,26,24);g.fillStyle='#354e49';g.fillRect(10,10,20,16);g.fillStyle='#a4b8a0';g.fillRect(12,8,16,3);g.fillStyle='#e4e2b9';g.fillRect(18,12,4,12);g.fillRect(14,16,12,4)}
 return c;
}
const sprites={};for(const type of Object.keys(types))sprites[type]=makeTowerSprite(type);
function makeZombie(color){
 let c=document.createElement('canvas');c.width=32;c.height=24;let g=c.getContext('2d');
 // Facing right. Dark sleeves lead into two long, separated green arms.
 g.fillStyle='#243329';g.fillRect(14,6,12,12);g.fillRect(14,2,16,6);g.fillRect(14,16,16,6);
 g.fillStyle='#465848';g.fillRect(14,3,7,4);g.fillRect(14,17,7,4);
 g.fillStyle=color;g.fillRect(20,3,9,4);g.fillRect(20,17,9,4);g.fillRect(15,7,10,10);
 g.fillStyle='#b6d591';g.fillRect(21,3,6,1);g.fillRect(21,17,6,1);g.fillRect(16,8,6,2);
 g.fillStyle='#26352b';g.fillRect(22,9,2,2);g.fillRect(22,13,2,2);g.fillStyle='#e1e8b9';g.fillRect(23,9,1,1);g.fillRect(23,13,1,1);
 return c;
}
const zombieSprites={};for(let [kind,color] of Object.entries({normal:'#86b96c',armor:'#c6a36f',shock:'#aa82b9'}))zombieSprites[kind]=makeZombie(color);
function towerIcon(type){return sprites[type].toDataURL()}
function ui(){document.querySelector('#money').textContent=money;document.querySelector('#health').textContent=health;document.querySelector('#wave').textContent=wave;document.querySelector('#cancel').hidden=!(building||aiming);document.querySelector('#placementLegend').hidden=!building;document.querySelector('#start').disabled=running||over;document.querySelector('#start').textContent=over?'OUTPOST LOST':running?'WAVE IN PROGRESS':'START WAVE →';shop.innerHTML='';Object.entries(types).forEach(([key,t])=>{let b=document.createElement('button');b.className='tower '+(building===key?'active':'');b.innerHTML=`<img class="icon" src="${towerIcon(key)}" alt=""><span><strong>${t.name}</strong></span><span class="cost">${t.cost} ⬡</span>`;b.onclick=()=>{upgradeDialog.hidden=true;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}building=key;selected=null;ui()};shop.appendChild(b)});if(selected){let t=selected, tracks=upgrades[t.type];details.innerHTML=`<small>SELECTED TOWER</small><h2>${types[t.type].name}</h2><p>Buy each tier in order.</p><button class="sell" id="sellTower">SELL · ${Math.floor(t.spent*.7)} ⬡</button>${tracks.map((description,i)=>{let steps=description;return `<div class="track"><small>TRACK ${i+1}</small>${steps.map((step,n)=>{let level=t.upgrades[i],cost=[60,90,140,210][n],label=n<level?'PURCHASED':n===level?`${cost} ⬡`:'LOCKED';return `<button class="upgrade" id="track${i}-${n}" ${n!==level?'disabled':''}>${n+1}. ${step}<br>${label}</button>`}).join('')}</div>`}).join('')}`;document.querySelector('#sellTower').onclick=()=>{money+=Math.floor(t.spent*.7);towers=towers.filter(a=>a!==t);soldiers=soldiers.filter(a=>a.home!==t);selected=null;upgradeDialog.hidden=true;status.textContent='Tower sold';ui()};tracks.forEach((description,i)=>{let level=t.upgrades[i];if(level>=4)return;document.querySelector(`#track${i}-${level}`).onclick=()=>{let cost=[60,90,140,210][level];if(money<cost){status.textContent='Not enough supplies';return}money-=cost;t.upgrades[i]++;t.spent+=cost;applyUpgrade(t,i,level);ui()}})}else details.innerHTML='<small>SELECTED TOWER</small><p>Select a placed tower to view its upgrades.</p>'}
function applyUpgrade(t,path,tier){
 const damage={gun:[[0,0,.4,0],[0,0,0,0]],sniper:[[0,.5,0,0],[0,0,0,0]],shotgun:[[0,.35,0,0],[0,.35,0,0]],rocket:[[0,.4,0,.6],[0,0,0,0]],lightning:[[0,.35,0,.5],[0,0,0,0]],flame:[[0,.35,0,.5],[0,0,0,0]],frost:[[0,.35,0,0],[0,0,0,0]],cannon:[[0,.4,0,.5],[0,0,0,0]],venom:[[0,0,.4,0],[0,0,0,0]]};
 const ranges={gun:[1,1],sniper:[1,1],shotgun:[1,0],flame:[1,1],frost:[1,1],cannon:[1,1],venom:[1,1]};
 let boost=damage[t.type]?.[path]?.[tier]||0;if(boost)t.damage*=1+boost;
 if(ranges[t.type]?.[0]===path&&ranges[t.type]?.[1]===tier)t.range*=t.type==='sniper'||t.type==='shotgun'||t.type==='flame'?1.3:1.25;
}
function pos(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*1000/r.width,y:(e.clientY-r.top)*650/r.height}}
canvas.onmousemove=e=>mouse=pos(e);canvas.onclick=e=>{let p=pos(e);if(aiming){aiming.facing=Math.atan2(p.y-aiming.y,p.x-aiming.x);aiming.angle=aiming.facing;aiming=null;status.textContent='Tower deployed';ui();return}if(building){let t=types[building];if(money<t.cost){status.textContent='Not enough supplies';return}if(!canPlace(p)){status.textContent='Choose a clear spot';return}money-=t.cost;let tower={type:building,x:p.x,y:p.y,range:t.range,damage:t.damage,cool:0,angle:0,facing:0,upgrades:[0,0],spent:t.cost};towers.push(tower);aiming=omnidirectional.includes(building)?null:tower;building=null;status.textContent=aiming?'Click to choose firing direction':'Tower deployed';ui();return}selected=towers.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<23)||null;ui();upgradeDialog.hidden=!selected};document.querySelector('#closeDetails').onclick=()=>{upgradeDialog.hidden=true;selected=null;ui()};function cancelPlacement(){building=null;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}status.textContent='Placement cancelled';ui()}document.querySelector('#cancel').onclick=cancelPlacement;document.onkeydown=e=>{if(e.key==='Escape'&&(building||aiming))cancelPlacement()};document.querySelector('#start').onclick=()=>{wave++;remaining=wave<=3?[12,18,25][wave-1]:8+wave*6;running=true;spawn=0;status.textContent='Wave '+wave+' incoming';ui()};
function hit(e,damage,type){if(e.kind==='shock'&&type==='lightning')return;let multiplier=e.kind==='armor'&&['gun','shotgun','sniper'].includes(type)?.5:1;e.hp-=damage*multiplier}
function fire(t,target){
 let type=t.type;t.angle=Math.atan2(target.y-t.y,target.x-t.x);
 if(['gun','sniper','shotgun','flame','frost','cannon','venom'].includes(type)){
  let count=type==='shotgun'?(t.upgrades[0]>=4?15:t.upgrades[0]>=1?11:7):type==='gun'&&t.upgrades[0]>=2?2:1;
  for(let i=0;i<count;i++){
   let angle=t.angle+(type==='shotgun'?(i-(count-1)/2)*.10:0);
   projectiles.push({x:t.x,y:t.y,dx:Math.cos(angle),dy:Math.sin(angle),speed:type==='sniper'?700:480,remaining:t.range,damage:t.damage,type,pierce:type==='sniper'?(t.upgrades[0]>=3?6:t.upgrades[0]>=1?4:2):(type==='gun'&&t.upgrades[1]?2:type==='cannon'&&t.upgrades[1]>=4?5:type==='cannon'&&t.upgrades[1]?3:type==='shotgun'&&t.upgrades[1]>=3?2:type==='flame'&&t.upgrades[1]>=4?2:type==='frost'&&t.upgrades[1]>=3?2:type==='venom'&&t.upgrades[1]>=3?2:1),ability:t.upgrades.slice(),ignoreArmor:(type==='gun'&&t.upgrades[1]>=3)||(type==='cannon'&&t.upgrades[1]>=3)||(type==='venom'&&t.upgrades[0]>=2),stun:type==='sniper'&&t.upgrades[1],hit:[]});
  }
 }else if(type==='rocket'){
  projectiles.push({x:t.x,y:t.y,dx:Math.cos(t.angle),dy:Math.sin(t.angle),speed:260,remaining:Math.hypot(target.x-t.x,target.y-t.y),damage:t.damage,type,pierce:1,hit:[],radius:t.upgrades[0]>=3?65:t.upgrades[0]?48:35,slow:t.upgrades[1],burn:t.upgrades[1]>=3?(t.upgrades[1]>=4?5:3):0});
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
  let hits=enemies.filter(e=>e.hp>0&&!p.hit.includes(e)).map(e=>{
   let along=(e.x-startX)*p.dx+(e.y-startY)*p.dy;
   let side=Math.abs((e.x-startX)*p.dy-(e.y-startY)*p.dx);
   let entry=along-Math.sqrt(Math.max(0,e.r*e.r-side*side));
   return {enemy:e,entry,side,along};
  }).filter(h=>h.side<=h.enemy.r&&h.along+h.enemy.r>=0&&h.entry<=distance).sort((a,b)=>a.entry-b.entry);
  for(let h of hits){if(p.type==='rocket'){distance=Math.max(0,h.entry);p.pierce=0;break}hit(h.enemy,p.damage+(p.type==='frost'&&p.ability[1]?6:0),p.ignoreArmor?'piercing':p.type);if((p.type==='gun'&&p.ability[0]>=4)||(p.type==='shotgun'&&p.ability[1]>=4)||(p.type==='sniper'&&p.ability[0]>=4))h.enemy.slow=1.5;if(p.type==='frost'&&p.ability[0]>=4)h.enemy.stun=.4;if(p.type==='flame'||p.type==='venom'){h.enemy.poison=p.ability[1]>=4?7:p.ability[1]||p.ability[0]>=3?4:2;h.enemy.poisonDamage=p.type==='venom'&&p.ability[0]>=4?12:(p.type==='venom'&&p.ability[0]||p.type==='flame'&&p.ability[1]>=3)?8:4}if(p.type==='frost')h.enemy.slow=p.ability[0]>=3?6:p.ability[0]?4:2;if(p.stun)h.enemy.stun=p.ability[1]>=4?1.2:.6;p.hit.push(h.enemy);p.pierce--;if(p.pierce<=0){distance=Math.max(0,h.entry);break}}
  p.x+=p.dx*distance;p.y+=p.dy*distance;p.remaining-=distance;if(p.type==='rocket'&&(p.pierce<=0||p.remaining<=0)){for(let e of enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<p.radius){hit(e,p.damage,p.type);if(p.slow)e.slow=3;if(p.burn){e.poison=p.burn;e.poisonDamage=5}}effects.push({x:p.x,y:p.y,r:p.radius,time:.25,color:'#f6a357'})}
 }
 projectiles=projectiles.filter(p=>p.remaining>0&&p.pierce>0);
}
function update(dt){if(!started||over)return;if(running&&remaining>0){spawn-=dt;if(spawn<=0){let kind=wave>=3&&Math.random()<.2?'armor':wave>=5&&Math.random()<.2?'shock':'normal',big=wave>=2&&Math.random()<Math.min(.3,wave*.035),hp=(20+wave*5)*(big?2.8:1);let radius=big?14:9,lanes=[path[0].y-28,path[0].y,path[0].y+28].filter(y=>enemies.every(e=>Math.hypot(e.x+20,e.y-y)>=e.r+radius+1));if(lanes.length){let y=lanes[Math.floor(Math.random()*lanes.length)];announce(kind);if(big)announce('big');enemies.push({x:-20,y,route:routes[Math.random()<.5?0:1].points,lane:y-path[0].y,waypoint:1,r:radius,hp,max:hp,kind,speed:(49+Math.random()*18)*(big?.75:1)*(wave<=3?[.7,.8,.9][wave-1]:1),stun:0,phase:Math.random()*6});remaining--;spawn=wave<=3?[.7,.6,.5][wave-1]:Math.max(.12,.42-wave*.015)}else spawn=.05}}for(let e of enemies){
 e.stun-=dt;if(e.poison>0){e.hp-=e.poisonDamage*dt;e.poison-=dt}e.slow=(e.slow||0)-dt;
 let progress=flowProgress(e.x,e.y),defender=null,closest=110;
 for(let soldier of soldiers){let d=Math.hypot(soldier.x-e.x,soldier.y-e.y);if(soldier.hp>0&&d<closest&&flowProgress(soldier.x,soldier.y)<=progress-5&&roadIsClear(e,soldier)){defender=soldier;closest=d}}
 let inMelee=defender&&closest<e.r+10;
 if(inMelee&&e.stun<=0){e.attack=(e.attack||0)-dt;if(e.attack<=0){defender.hp-=8;e.attack=.7}}
 let direction=defender?{x:defender.x-e.x,y:defender.y-e.y}:flowDirection(e);
 let distance=Math.hypot(direction.x,direction.y)||1,angle=Math.atan2(direction.y,direction.x);e.angle=angle;
 if(e.stun<=0&&!inMelee){let step=e.speed*dt*(e.slow>0?.55:1),nx=e.x+direction.x/distance*step,ny=e.y+direction.y/distance*step;if(pathDistance(nx,ny)<=0||pathDistance(nx,ny)<pathDistance(e.x,e.y)){e.x=nx;e.y=ny}}
 e.phase+=dt*7;if(e.x>940&&Math.abs(e.y-325)<55){health-=e.r>10?2:1;e.hp=0;if(health<=0){health=0;over=true;running=false}ui()}
}
// Resolve nearby bodies with a spatial grid so crowds can spread without an all-pairs scan.
for(let pass=0;pass<2;pass++){
 let buckets=new Map(),cellSize=32;
 for(let e of enemies){if(e.hp<=0)continue;let cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){let bucket=buckets.get(x+','+y);if(!bucket)continue;for(let other of bucket){let dx=e.x-other.x,dy=e.y-other.y,d=Math.hypot(dx,dy),minimum=e.r+other.r;if(d>=minimum)continue;if(d<.01){dx=0;dy=1;d=1}let shift=(minimum-d)/2,ex=dx/d*shift,ey=dy/d*shift;if(pathDistance(e.x+ex,e.y+ey)<=0){e.x+=ex;e.y+=ey}if(pathDistance(other.x-ex,other.y-ey)<=0){other.x-=ex;other.y-=ey}}}let key=cx+','+cy;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e)}
}
for(let t of towers){if(t===aiming)continue;t.cool-=dt;if(t.type==='barracks'){if(running&&t.cool<=0&&soldiers.filter(a=>a.home===t).length<(t.upgrades[1]>=3?7:t.upgrades[1]?5:3)){let rally=nearestRoad(t.x,t.y),dx=t.x-rally.x,dy=t.y-rally.y,d=Math.hypot(dx,dy)||1;soldiers.push({home:t,x:rally.x+dx/d*12,y:rally.y+dy/d*12,hp:t.upgrades[1]>=4?90:t.upgrades[1]>=2?67.5:45,cool:0,rally});t.cool=types.barracks.rate*(t.upgrades[0]>=3?.5:1)}continue}let target=enemies.filter(e=>{let angle=Math.atan2(e.y-t.y,e.x-t.x),difference=Math.atan2(Math.sin(angle-t.facing),Math.cos(angle-t.facing));return e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.range&&(omnidirectional.includes(t.type)||Math.abs(difference)<=Math.PI/4)}).sort((a,b)=>b.x-a.x)[0];if(target&&t.cool<=0){fire(t,target);t.cool=types[t.type].rate*((t.upgrades[0]&&['gun','lightning','flame','cannon'].includes(t.type))?.75:1)*((t.upgrades[0]>=3&&['shotgun','cannon'].includes(t.type))?.75:1)*((t.upgrades[1]>=3&&t.type==='sniper'||t.upgrades[1]>=2&&t.type==='rocket'||t.upgrades[1]>=4&&t.type==='frost')?.75:1)}}for(let a of soldiers){a.cool-=dt;let target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-a.home.x,e.y-a.home.y)<a.home.range+60).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];if(target){let dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);a.angle=Math.atan2(dy,dx);if(d>85){a.x+=dx/d*45*dt;a.y+=dy/d*45*dt}else if(a.cool<=0){projectiles.push({x:a.x,y:a.y,dx:dx/d,dy:dy/d,speed:400,remaining:100,damage:a.home.upgrades[0]>=4?9:a.home.upgrades[0]>=2?6:4,type:'soldier',pierce:1,ability:[],hit:[]});a.cool=a.home.upgrades[0]?.5:.8}}else{let dx=a.rally.x-a.x,dy=a.rally.y-a.y,d=Math.hypot(dx,dy);if(d>5){a.x+=dx/d*40*dt;a.y+=dy/d*40*dt}}}soldiers=soldiers.filter(a=>a.hp>0);for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++){let a=soldiers[i],b=soldiers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16){if(d<.01){dx=1;dy=0;d=1}let shift=(16-d)/2;a.x-=dx/d*shift;a.y-=dy/d*shift;b.x+=dx/d*shift;b.y+=dy/d*shift}}moveProjectiles(dt);let dead=enemies.filter(e=>e.hp<=0&&e.x<=940);if(dead.length){money+=dead.length*4;ui()}enemies=enemies.filter(e=>e.hp>0);effects.forEach(e=>e.time-=dt);effects=effects.filter(e=>e.time>0);if(running&&!remaining&&!enemies.length){running=false;soldiers=[];money+=30+wave*5;status.textContent='Wave cleared · supplies delivered';ui()}}
function makeMap(){
 let c=document.createElement('canvas');c.width=500;c.height=325;let g=c.getContext('2d'),seed=371;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 g.fillStyle='#40573c';g.fillRect(0,0,500,325);
 // Layer irregular patches and small stones across the high ground.
 for(let i=0;i<420;i++){let x=random()*500,y=random()*325,rx=3+random()*15,ry=2+random()*7;g.fillStyle=['#3a5038','#496344','#4c6645','#394f37'][i%4];g.beginPath();g.ellipse(x,y,rx,ry,random()*.5,0,Math.PI*2);g.fill()}
 for(let layer of [{color:'#334234',extra:42},{color:'#7f7858',extra:18},{color:'#a6906c',extra:5},{color:'#bca77f',extra:0}])for(let {a,b,width} of roadSegments()){g.lineCap='round';g.beginPath();g.moveTo(a.x/2,a.y/2);g.lineTo(b.x/2,b.y/2);g.strokeStyle=layer.color;g.lineWidth=(width+layer.extra)/2;g.stroke()}
 for(let i=0;i<700;i++){let x=random()*500,y=random()*325,d=pathDistance(x*2,y*2);if(d>24){g.fillStyle=i%3?'#648653':'#a2a66d';g.fillRect(x,y,1.5,2.5);if(i%4===0){g.fillStyle='#2f4932';g.fillRect(x+2,y+1,3,2)}}else if(d<-4&&i%3===0){g.fillStyle='#a18b68';g.fillRect(x,y,2+random()*3,1)}}
 g.fillStyle='#1f2d29';g.fillRect(458,130,42,70);g.fillStyle='#65765d';g.fillRect(464,136,36,58);g.fillStyle='#c7bc7d';g.fillRect(470,144,30,42);g.fillStyle='#273a32';g.fillRect(476,150,24,30);g.fillStyle='#e0d584';g.fillRect(480,158,20,4);return c;
}
function makePlacementOverlay(){
 let c=document.createElement('canvas');c.width=500;c.height=325;let g=c.getContext('2d'),data=g.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let px=x*2+1,py=y*2+1,valid=px>=45&&px<=910&&py>=45&&py<=605&&pathDistance(px,py)>=21,i=(y*c.width+x)*4;data.data[i]=valid?115:190;data.data[i+1]=valid?195:63;data.data[i+2]=valid?100:50;data.data[i+3]=valid?42:75}g.putImageData(data,0,0);return c;
}
let mapArt=makeMap(),placementOverlay=makePlacementOverlay();
function draw(){ctx.imageSmoothingEnabled=false;ctx.drawImage(mapArt,0,0,1000,650);if(building){ctx.drawImage(placementOverlay,0,0,1000,650);for(let placed of towers){ctx.beginPath();ctx.arc(placed.x,placed.y,44,0,Math.PI*2);ctx.fillStyle='#c03f3280';ctx.fill()}let t=types[building];ctx.strokeStyle='#dce99a';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(mouse.x,mouse.y,t.range,0,7);ctx.stroke();ctx.globalAlpha=1;let valid=canPlace(mouse);ctx.fillStyle=valid?'#dce99a66':'#ee554c88';ctx.strokeStyle=valid?'#e1eaa2':'#ff7468';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,22,0,Math.PI*2);ctx.fill();ctx.stroke()}let preview=aiming||selected;if(preview){let direction=aiming?Math.atan2(mouse.y-preview.y,mouse.x-preview.x):preview.facing;ctx.fillStyle='#e2eaa433';ctx.strokeStyle='#e2eaa4';ctx.beginPath();ctx.moveTo(preview.x,preview.y);ctx.arc(preview.x,preview.y,preview.range,omnidirectional.includes(preview.type)?0:direction-Math.PI/4,omnidirectional.includes(preview.type)?Math.PI*2:direction+Math.PI/4);ctx.closePath();ctx.fill();ctx.stroke();if(aiming)preview.angle=direction}for(let t of towers){ctx.save();ctx.translate(t.x,t.y);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#1a2822';ctx.beginPath();ctx.arc(0,1,23,0,Math.PI*2);ctx.fill();ctx.fillStyle='#71836b';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#354a3b';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b9c2a0';for(let i=0;i<8;i++){let a=i*Math.PI/4;ctx.fillRect(Math.cos(a)*18-1,Math.sin(a)*18-1,2,2)}ctx.rotate(t.angle);let sprite=sprites[t.type];ctx.drawImage(sprite,-22,-18,44,36);ctx.restore()}for(let a of soldiers){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle||0);ctx.fillStyle='#1d2a29';ctx.fillRect(-7,-7,14,14);ctx.fillRect(2,-2,13,4);ctx.fillStyle='#425d54';ctx.fillRect(-6,-6,10,12);ctx.fillStyle='#81a28b';ctx.fillRect(-4,-5,6,10);ctx.fillStyle='#c6b38c';ctx.fillRect(1,-4,5,8);ctx.fillStyle='#344a3d';ctx.fillRect(2,-5,4,2);ctx.fillStyle='#222c28';ctx.fillRect(5,-1,9,2);ctx.fillStyle='#b9bb9b';ctx.fillRect(7,-2,5,1);ctx.restore()}for(let e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);let s=e.r/9;ctx.scale(s,s);ctx.imageSmoothingEnabled=false;let sprite=zombieSprites[e.kind];ctx.drawImage(sprite,-16,-12,32,24);ctx.restore();if(e.hp<e.max){ctx.fillStyle='#293429';ctx.fillRect(e.x-10,e.y-e.r-7,20,3);ctx.fillStyle='#d4e385';ctx.fillRect(e.x-10,e.y-e.r-7,20*Math.max(0,e.hp/e.max),3)}}for(let p of projectiles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.dy,p.dx));ctx.fillStyle=p.type==='rocket'?'#e17849':p.type==='sniper'?'#fff3c0':'#e9b65d';ctx.fillRect(-5,-2,10,4);ctx.fillStyle='#fff1be';ctx.fillRect(2,-1,3,2);ctx.restore()}for(let e of effects){ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();if(e.r)ctx.arc(e.x,e.y,e.r*(1-e.time/.3),0,7);else{ctx.moveTo(e.x,e.y);ctx.lineTo(e.x2,e.y2)}ctx.stroke()}if(over){ctx.fillStyle='#111b16bb';ctx.fillRect(0,0,1000,650);ctx.fillStyle='#f2e9c2';ctx.textAlign='center';ctx.font='bold 52px Barlow Condensed';ctx.fillText('THE OUTPOST HAS FALLEN',500,310);ctx.font='18px IBM Plex Mono';ctx.fillText('Refresh to try again',500,350)}}let last=performance.now();function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}ui();requestAnimationFrame(loop);

document.querySelector('#play').onclick=()=>{let map=maps[document.querySelector('#mapSelect').value];path=map.path.map(([x,y])=>({x,y}));roadWidths=map.widths;buildRoutes();flowField=buildFlowField();routeFields=routes.map(route=>buildFlowField(route));mapArt=makeMap();placementOverlay=makePlacementOverlay();started=true;document.querySelector('#menu').hidden=true;last=performance.now()};
