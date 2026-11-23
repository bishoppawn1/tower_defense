const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');

const types={gun:{name:'Gun tower',cost:50,range:140,rate:.45,damage:9,color:'#d5dcb3',desc:'Reliable single-target fire'},sniper:{name:'Sniper tower',cost:85,range:260,rate:1.65,damage:30,color:'#d6c89a',desc:'Long range · piercing shots'},shotgun:{name:'Shotgun tower',cost:75,range:100,rate:1.1,damage:9,color:'#e0b26d',desc:'Short range · directional spread'},rocket:{name:'Rocket tower',cost:110,range:180,rate:1.6,damage:30,color:'#d6845e',desc:'Blast damage falls off · up to four targets'},lightning:{name:'Lightning tower',cost:120,range:150,rate:1.35,damage:13,color:'#8bc8d0',desc:'Chains between enemies · stuns'}};
Object.assign(types,{barracks:{name:'Barracks',cost:110,range:130,rate:3,damage:0,color:'#79a7ad',desc:'Deploys soldiers during waves'},flame:{name:'Flamethrower',cost:90,range:105,rate:.18,damage:4,color:'#f18d4c',desc:'Short-range stream · burns'},frost:{name:'Cryo tower',cost:95,range:140,rate:.8,damage:6,color:'#9adbe2',desc:'Chilling rounds slow zombies'},cannon:{name:'Autocannon',cost:125,range:180,rate:.65,damage:18,color:'#d8c17e',desc:'Heavy armor-piercing shells'},venom:{name:'Toxic sprayer',cost:100,range:130,rate:.7,damage:5,color:'#b2d75d',desc:'Poison damages over time'}});
Object.assign(types,{minigun:{name:'Minigun',cost:100,range:155,rate:.16,damage:4,color:'#d9b664',desc:'Rapid automatic fire'},mortar:{name:'Mortar',cost:130,range:230,rate:2.5,damage:22,color:'#d99f6c',desc:'Arcing shells · up to five targets per blast'},pulse:{name:'Pulse tower',cost:115,range:105,rate:1.8,damage:8,color:'#b5b1ef',desc:'Shoves up to five nearby zombies · 8% stun chance'}});
const omnidirectional=['gun','lightning','barracks','frost','venom','minigun','mortar','pulse'];
let started=false;
const FLOW_CELL=10;
let activeMap=maps.meadow, segments=[], exitGate, flowCols, flowRows, flowField;
// Sample the rendered road union once. A signed distance to the exposed
// banks gives round bodies a smooth contact normal across seams and forks.
const BANK_CELL=2, BANK_MARGIN=96;
let bankGrid,bankCols,bankRows;
function buildRoutes(map) {
  activeMap=map;exitGate=map.exit;segments=map.segments;
  flowCols=Math.ceil(map.width/FLOW_CELL);flowRows=Math.ceil(map.height/FLOW_CELL);
  const mask=document.createElement('canvas');
  mask.width=bankCols=Math.ceil((map.width+2*BANK_MARGIN)/BANK_CELL);
  mask.height=bankRows=Math.ceil((map.height+2*BANK_MARGIN)/BANK_CELL);
  const g=mask.getContext('2d');
  g.setTransform(1/BANK_CELL,0,0,1/BANK_CELL,BANK_MARGIN/BANK_CELL,BANK_MARGIN/BANK_CELL);
  g.fill(FieldArt.roadOutline(segments));
  const pixels=g.getImageData(0,0,bankCols,bankRows).data;
  bankGrid=new Float32Array(bankCols*bankRows);
  const inside=i=>pixels[i*4+3]>=128;
  bankGrid.fill(1e5);
  for(let y=1;y<bankRows-1;y++)for(let x=1;x<bankCols-1;x++){
    const i=y*bankCols+x,s=inside(i);
    if(inside(i-1)!==s||inside(i+1)!==s||inside(i-bankCols)!==s||inside(i+bankCols)!==s)bankGrid[i]=BANK_CELL/2;
  }
  const diag=Math.SQRT2*BANK_CELL;
  for(const step of [1,-1]){
    for(let y=step===1?1:bankRows-2;y>0&&y<bankRows-1;y+=step){
      for(let x=step===1?1:bankCols-2;x>0&&x<bankCols-1;x+=step){
        const i=y*bankCols+x,prev=i-step*bankCols;
        bankGrid[i]=Math.min(bankGrid[i],bankGrid[i-step]+BANK_CELL,bankGrid[prev]+BANK_CELL,
          bankGrid[prev-1]+diag,bankGrid[prev+1]+diag);
      }
    }
  }
  for(let i=0;i<bankGrid.length;i++)if(inside(i))bankGrid[i]*=-1;
}
function pathDistance(x,y){
  const gx=(x+BANK_MARGIN)/BANK_CELL-.5,gy=(y+BANK_MARGIN)/BANK_CELL-.5;
  const col=Math.floor(gx),row=Math.floor(gy);
  if(col<0||row<0||col>=bankCols-1||row>=bankRows-1)return Infinity;
  const i=row*bankCols+col,fx=gx-col,fy=gy-row;
  return (bankGrid[i]*(1-fx)+bankGrid[i+1]*fx)*(1-fy)
    +(bankGrid[i+bankCols]*(1-fx)+bankGrid[i+bankCols+1]*fx)*fy;
}
function nearestRoad(x,y){let best=null,dist=Infinity;for(let {a,b} of segments){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))),point={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(point.x-x,point.y-y);if(d<dist){best=point;dist=d}}return best}
function buildFlowField(){
 const size=flowCols*flowRows,walkable=new Uint8Array(size),distance=new Float64Array(size);distance.fill(Infinity);
 for(let y=0;y<flowRows;y++)for(let x=0;x<flowCols;x++){let px=x*FLOW_CELL+5,py=y*FLOW_CELL+5;walkable[y*flowCols+x]=pathDistance(px,py)<=-5?1:0}
 const heap=[];
 function push(index,cost){let n=heap.length;heap.push({index,cost});while(n){let p=(n-1)>>1;if(heap[p].cost<=cost)break;heap[n]=heap[p];n=p}heap[n]={index,cost}}
 function pop(){let first=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=heap.length)break;let child=r<heap.length&&heap[r].cost<heap[l].cost?r:l;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child}heap[i]=last}return first}
 for(let y=0;y<flowRows;y++)for(let x=Math.floor((exitGate.x-20)/FLOW_CELL);x<flowCols;x++){let i=y*flowCols+x;if(walkable[i]&&Math.abs(y*FLOW_CELL+FLOW_CELL/2-exitGate.y)<exitGate.span/2){distance[i]=0;push(i,0)}}
 while(heap.length){let current=pop();if(current.cost!==distance[current.index])continue;let x=current.index%flowCols,y=Math.floor(current.index/flowCols);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy;if(nx<0||nx>=flowCols||ny<0||ny>=flowRows)continue;let next=ny*flowCols+nx;if(!walkable[next]||(dx&&dy&&(!walkable[y*flowCols+nx]||!walkable[ny*flowCols+x])))continue;let cost=current.cost+(dx&&dy?14.142:10);if(cost<distance[next]){distance[next]=cost;push(next,cost)}}}
 return {walkable,distance};
}
function flowCell(x,y){let cx=Math.max(0,Math.min(flowCols-1,Math.floor(x/FLOW_CELL))),cy=Math.max(0,Math.min(flowRows-1,Math.floor(y/FLOW_CELL)));return {x:cx,y:cy,index:cy*flowCols+cx}}
function flowProgress(x,y){let cell=flowCell(x,y),best=flowField.distance[cell.index];if(Number.isFinite(best))return best;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let nx=cell.x+dx,ny=cell.y+dy;if(nx>=0&&nx<flowCols&&ny>=0&&ny<flowRows)best=Math.min(best,flowField.distance[ny*flowCols+nx]+Math.hypot(dx,dy)*FLOW_CELL)}return best}
function roadIsClear(a,b){
 let steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10);for(let i=1;i<steps;i++){let t=i/steps;if(pathDistance(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)>0)return false}return true;
}
function keepOnRoad(e,drift=0){
 // Push a circular body inside the road and remove only velocity into the wall.
 for(let iteration=0;iteration<3;iteration++){
  let distance=pathDistance(e.x,e.y),limit=-e.r*.55;if(distance<=limit)return;
  let nx=pathDistance(e.x+1,e.y)-pathDistance(e.x-1,e.y),ny=pathDistance(e.x,e.y+1)-pathDistance(e.x,e.y-1),length=Math.hypot(nx,ny);
  if(length<.001){e.vy+=e.bias*8;return}
  nx/=length;ny/=length;let overlap=distance-limit;e.x-=nx*overlap;e.y-=ny*overlap;
  let outward=e.vx*nx+e.vy*ny;if(outward>0){
    e.vx-=1.24*outward*nx;e.vy-=1.24*outward*ny;
    // At a fork nose the downhill pull can meet the bank head-on. Let that
    // component slide along its downstream face instead of pinning the body.
    if(drift){
      const sign=ny===0?e.bias:Math.sign(ny),tx=ny*sign,ty=-nx*sign;
      const along=e.vx*tx+e.vy*ty,carry=Math.max(0,drift*.25-along);
      e.vx+=tx*carry;e.vy+=ty*carry;
    }
  }
 }
}
function buildableGround(x,y){
  if(x<30 || x>activeMap.width-30 || y<30 || y>activeMap.height-30)return false;
  if(x>exitGate.x-60 && Math.abs(y-exitGate.y)<exitGate.span*.65+21)return false;
  if(pathDistance(x,y)<21)return false;
  if(activeMap===maps.marsh)return true;
  for(const [cx,cy,rx,ry] of activeMap.landmarks){
    const dx=Math.abs(x-cx),dy=Math.abs(y-cy);
    if(activeMap===maps.town){
      if(Math.hypot(Math.max(0,dx-rx),Math.max(0,dy-ry))<21)return false;
    }else if((dx/(rx+21))**2+(dy/(ry+21))**2<1)return false;
  }
  return true;
}
function canPlace(p){return buildableGround(p.x,p.y)&&!towers.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<44)}
let money=250,health=20,wave=0,towers=[],enemies=[],effects=[],projectiles=[],soldiers=[],selected=null,building=null,aiming=null,waveQueue=[],spawn=0,running=false,over=false,mouse={x:-100,y:-100};
const shop=document.querySelector('#shop'),details=document.querySelector('#details'),status=document.querySelector('#status'),upgradeDialog=document.querySelector('#upgradeDialog'),notice=document.querySelector('#notice');
let seenKinds=new Set(),noticeQueue=[],noticeTimer;
function showNotice(){if(!noticeQueue.length){notice.hidden=true;noticeTimer=null;return}notice.textContent=noticeQueue.shift();notice.hidden=false;noticeTimer=setTimeout(showNotice,6000)}
function announce(kind,message){if(seenKinds.has(kind))return;seenKinds.add(kind);noticeQueue.push(message||({normal:'Walker · A standard zombie.',brute:'Brute · Pulse-proof melee bruiser. Nine times walker health and 5 base damage.',runner:'Runner · Fast, lightly built and easy to pick off.',armor:'Armored zombie · Stops 85% of bullet damage. Armor-piercing upgrades bypass its plating.',shock:'Insulated zombie · Immune to lightning damage and stun.',fire:'Fireproof zombie · Immune to fire damage and burning.',cold:'Frostproof zombie · Immune to cryo damage and freezing.',toxic:'Hazmat zombie · Immune to poison damage and poison.',blast:'Blastproof zombie · Its padded suit absorbs rockets, mortars and pulse waves.'})[kind]);if(!noticeTimer)showNotice()}
const foundations=[FieldArt.foundation(),FieldArt.foundation(true)];
const sprites={}, heads={}, towerIcons={};
const waterHit=document.createElement('canvas').getContext('2d');
let waterShape=null;
function overWater(x,y){return waterShape && waterHit.isPointInPath(waterShape,x,y);}
function portrait(type,head,wet=false){
  const c=document.createElement('canvas');c.width=c.height=180;
  const g=c.getContext('2d');g.translate(90,90);g.scale(3,3);
  g.drawImage(foundations[+wet],-36,-36,72,72);
  g.rotate(type==='barracks'?-.18:-.55);g.drawImage(head,-36,-36,72,72);
  return c;
}
for (const [type, spec] of Object.entries(types)) {
  heads[type]=FieldArt.tower(type,spec.color);
  sprites[type]=portrait(type,heads[type]);
  towerIcons[type] = sprites[type].toDataURL();
}
const zombieSprites=new Map();
const skinColors={normal:'#92b286',runner:'#c9b879',brute:'#849977',armor:'#c8ad84',shock:'#b89bd1',fire:'#e8a27c',cold:'#96cdd7',toxic:'#b9ca73',blast:'#81bab5'};
const enemyNames={normal:'Walker',runner:'Runner',brute:'Brute',armor:'Armored',shock:'Insulated',fire:'Fireproof',cold:'Frostproof',toxic:'Hazmat',blast:'Blastproof'};
function zombieSprite(kind,tier){
  const key=kind+'-'+tier;
  if(!zombieSprites.has(key))zombieSprites.set(key,FieldArt.zombie(kind,skinColors[kind],tier));
  return zombieSprites.get(key);
}
const soldierSprite = FieldArt.infantry();
function towerIcon(type) { return towerIcons[type]; }
function ui(){document.querySelector('#money').textContent=money;document.querySelector('#health').textContent=health;document.querySelector('#wave').textContent=wave;document.querySelector('#cancel').hidden=!(building||aiming);document.querySelector('#placementLegend').hidden=!building;document.querySelector('#start').disabled=running||over;document.querySelector('#start').textContent=over?'Outpost lost':running?'Wave in progress':'Start wave →';shop.innerHTML='';Object.entries(types).forEach(([key,t])=>{let b=document.createElement('button');b.className='tower '+(building===key?'active':'');b.innerHTML=`<img class="icon" src="${towerIcon(key)}" alt=""><span><strong>${t.name}</strong></span><span class="cost">${t.cost} ⬡</span>`;b.onclick=()=>{upgradeDialog.hidden=true;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}building=key;selected=null;ui()};shop.appendChild(b)});if(selected)showTowerDetails(selected);}
function showTowerDetails(t){
  const barracks=t.type==='barracks';
  const tierRows=upgrades[t.type].map((track,i)=>`<div class="track"><small>${trackNames[t.type][i]}</small>${track.map(([text],n)=>{
    const bought=n<t.upgrades[i],next=n===t.upgrades[i];
    return `<button class="upgrade" data-track="${i}" data-tier="${n}" ${next?'':'disabled'}>${n+1}. ${text}<br>${bought?'Purchased':(next?'':'Locked · ')+tierCosts[n]+' ⬡'}</button>`;
  }).join('')}</div>`).join('');
  const labels={damage:barracks?'Rifle damage':'Damage',speed:barracks?'Rifle fire rate':'Fire rate',range:barracks?'Patrol radius':'Range'};
  const tuningOpen=details.querySelector('.stat-tuning')?.open;
  const tuningRows=Object.entries(tuning).map(([key,step])=>
    `<button class="upgrade" data-tune="${key}">${labels[key]} +${Math.round(step*100)}% · Rank ${t.ranks[key]}<br>${tuningCost(t)} ⬡</button>`).join('');
  details.innerHTML=`<div class="tower-heading"><img src="${t.portrait||towerIcons[t.type]}" alt=""><div><small>Selected tower</small><h2>${types[t.type].name}</h2></div></div>
    <p>${labels.damage} ${Number(t.damage.toFixed(2))} · ${(1/(barracks?t.rifleRate:t.rate)).toFixed(2)}/s · ${labels.range} ${Math.round(t.range)}
    ${t.areaCap?`<br>Up to ${t.areaCap} targets · damage fades toward the edge`:''}
    ${barracks?`<br>Soldiers ${soldiers.filter(a=>a.home===t&&a.hp>0).length} / ${t.cap}`:''}</p>
    <button class="sell" id="sellTower">Sell · ${Math.floor(t.spent*.7)} ⬡</button>
    <details class="stat-tuning" ${tuningOpen?'open':''}><summary>Stat upgrades · ${tuningCost(t)} ⬡</summary>${tuningRows}</details>
    ${tierRows}`;
  details.onclick=event=>{
    const button=event.target.closest('button');
    if(!button||selected!==t)return;
    if(button.id==='sellTower'){
      money+=Math.floor(t.spent*.7);towers=towers.filter(a=>a!==t);soldiers=soldiers.filter(a=>a.home!==t);
      selected=null;upgradeDialog.hidden=true;status.textContent='Tower sold';ui();return;
    }
    const stat=button.dataset.tune,track=Number(button.dataset.track),tier=Number(button.dataset.tier);
    if(stat ? !Object.hasOwn(tuning,stat) : t.upgrades[track]!==tier)return;
    const cost=stat?tuningCost(t):tierCosts[tier];
    if(money<cost){status.textContent='Not enough supplies';return;}
    money-=cost;t.spent+=cost;
    if(stat)tune(t,stat);
    else {applyTier(t,upgrades[t.type][track][tier][1]);t.upgrades[track]++;
      t.head=FieldArt.tower(t.type,types[t.type].color,t.upgrades);
      t.portrait=portrait(t.type,t.head,Boolean(overWater(t.x,t.y))).toDataURL();}
    ui();
  };
}
function pos(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*activeMap.width/r.width,y:(e.clientY-r.top)*activeMap.height/r.height}}
canvas.onmousemove=e=>mouse=pos(e);
canvas.onmouseleave=()=>{mouse={x:-100,y:-100};};
canvas.onclick=e=>{let p=pos(e);if(aiming){aiming.facing=Math.atan2(p.y-aiming.y,p.x-aiming.x);aiming.angle=aiming.facing;aiming=null;status.textContent='Tower deployed';ui();return}if(building){let t=types[building];if(money<t.cost){status.textContent='Not enough supplies';return}if(!canPlace(p)){status.textContent='Choose a clear spot';return}money-=t.cost;let tower=createTower(building,p.x,p.y);tower.wet=Boolean(overWater(p.x,p.y));towers.push(tower);aiming=omnidirectional.includes(building)?null:tower;building=null;status.textContent=aiming?'Click to choose firing direction':'Tower deployed';ui();return}selected=towers.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<23)||null;ui();upgradeDialog.hidden=!selected};document.querySelector('#closeDetails').onclick=()=>{upgradeDialog.hidden=true;selected=null;ui()};function cancelPlacement(){building=null;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}status.textContent='Placement cancelled';ui()}document.querySelector('#cancel').onclick=cancelPlacement;document.onkeydown=e=>{if(e.key==='Escape'&&(building||aiming))cancelPlacement()};document.querySelector('#start').onclick=()=>{wave++;waveQueue=waveRoster(wave).reverse();running=true;spawn=0;status.textContent='Wave '+wave+' incoming';ui()};
const immuneTo={shock:['lightning'],fire:['flame'],cold:['frost'],toxic:['venom'],
  blast:['rocket','mortar','pulse'],brute:['pulse']};
const ballistic=['gun','shotgun','sniper','minigun','cannon','soldier'];
function strike(e,attack,dx=0,dy=0){
  if(immuneTo[e.kind]?.includes(attack.type))return;
  const armored=e.kind==='armor'&&ballistic.includes(attack.type)&&!attack.ignoreArmor;
  e.hp-=attack.damage*(armored?.15:1);
  const pulse=attack.type==='pulse';
  if(pulse){
    if(e.pulseRecovery>0)return;
    e.pulseRecovery=3;
  }
  if(attack.slow)e.slow=Math.max(e.slow||0,attack.slow);
  if(attack.stun&&e.kind!=='shock'&&(!pulse||Math.random()<attack.stunChance))e.stun=Math.max(e.stun||0,attack.stun);
  if(attack.push){
    const d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;
    const impulse=pulse?attack.push*Math.min(1,9/e.r):attack.push;
    e.vx+=nx*impulse;e.vy+=ny*impulse;
  }
  if(attack.dot && !(attack.type==='rocket'&&e.kind==='fire')){
    e.poisonDamage=attack.dot;e.poison=attack.duration;
  }
}
function areaStrike(attack,x,y,radius){
  const hits=[];
  for(const e of enemies){
    if(e.hp<=0||immuneTo[e.kind]?.includes(attack.type))continue;
    const dx=e.x-x,dy=e.y-y;
    const distance=Math.max(0,Math.hypot(dx,dy)-e.r);
    if(distance<radius)hits.push({e,dx,dy,distance});
  }
  hits.sort((a,b)=>a.distance-b.distance);
  for(const {e,dx,dy,distance} of hits.slice(0,attack.areaCap)){
    // Contact takes full damage. At the rim, only a fifth of the energy remains.
    const strength=1-.8*distance/radius;
    strike(e,{...attack,damage:attack.damage*strength,dot:attack.dot*strength,
      push:attack.push*strength,slow:attack.slow*strength,
      stun:attack.type==='pulse'?attack.stun:attack.stun*strength},dx,dy);
  }
}
function fire(t,target){
  const type=t.type;
  t.angle=Math.atan2(target.y-t.y,target.x-t.x);
  if(!['lightning','flame','pulse','venom','frost'].includes(type))t.recoil=t.blast?2.8:1.4;
  if(type==='flame'){
    const dx=Math.cos(t.angle),dy=Math.sin(t.angle);
    const contacts=[];
    for(const e of enemies){
      if(e.hp<=0)continue;
      const x=e.x-t.x,y=e.y-t.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);
      const radius=e.r+2+Math.max(0,along)*.035;
      if(along<0||side>radius)continue;
      const entry=Math.max(0,along-Math.sqrt(radius*radius-side*side));
      if(entry<t.range)contacts.push({e,entry});
    }
    contacts.sort((a,b)=>a.entry-b.entry);
    const hits=contacts.slice(0,t.pierce);
    for(const {e} of hits)strike(e,t);
    t.plumeLength=hits.length===t.pierce?Math.min(t.range,hits.at(-1).entry+9):t.range;
    t.plumeTime=t.rate+.045;
    return;
  }
  if(type==='pulse'){
    areaStrike(t,t.x,t.y,t.range);
    effects.push({x:t.x,y:t.y,r:t.range,time:.25,color:'#c7c1ff'});return;
  }
  if(type==='lightning'){
    let current=target,previous=t;
    const seen=new Set();
    while(current&&seen.size<t.chains){
      strike(current,t);seen.add(current);
      effects.push({x:previous.x,y:previous.y,x2:current.x,y2:current.y,time:.16,color:'#a4f4f2'});
      previous=current;
      current=enemies.filter(e=>e.hp>0&&!seen.has(e)&&Math.hypot(e.x-previous.x,e.y-previous.y)<t.jump)
        .sort((a,b)=>Math.hypot(a.x-previous.x,a.y-previous.y)-Math.hypot(b.x-previous.x,b.y-previous.y))[0];
    }
    return;
  }
  effects.push({x:t.x+Math.cos(t.angle)*20,y:t.y+Math.sin(t.angle)*20,flash:true,time:.08,color:'#ffe7a0'});
  const distance=t.blast?Math.hypot(target.x-t.x,target.y-t.y):t.range;
  const speed={sniper:700,mortar:190,rocket:260}[type]||480;
  for(let i=0;i<t.shots;i++){
    const spread=type==='shotgun'?(i/(t.shots-1)-.5)*.68:0;
    const angle=t.angle+spread;
    projectiles.push({x:t.x,y:t.y,dx:Math.cos(angle),dy:Math.sin(angle),speed,remaining:distance,total:distance,
      damage:t.damage,type,pierce:t.pierce,ignoreArmor:t.ignoreArmor,radius:t.blast,areaCap:t.areaCap,slow:t.slow,stun:t.stun,
      push:t.push,dot:t.dot,duration:t.duration,hit:[]});
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
  for(let h of hits){if(p.type==='rocket'||p.type==='mortar'){distance=Math.max(0,h.entry);p.pierce=0;break}strike(h.enemy,p);p.hit.push(h.enemy);p.pierce--;if(p.pierce<=0){distance=Math.max(0,h.entry);break}}
  p.x+=p.dx*distance;p.y+=p.dy*distance;p.remaining-=distance;if((p.type==='rocket'||p.type==='mortar')&&(p.pierce<=0||p.remaining<=0)){areaStrike(p,p.x,p.y,p.radius);effects.push({x:p.x,y:p.y,r:p.radius,time:.25,color:'#f6a357'})}
 }
 projectiles=projectiles.filter(p=>p.remaining>0&&p.pierce>0);
}
function update(dt){if(!started||over)return;if(running)spawnPack(dt);let breached=false;for(let e of enemies){
 e.pulseRecovery=Math.max(0,(e.pulseRecovery||0)-dt);e.stun-=dt;if(e.poison>0){e.hp-=e.poisonDamage*dt;e.poison-=dt}e.slow=(e.slow||0)-dt;
 let progress=soldiers.length?flowProgress(e.x,e.y):0,defender=null,closest=110;
 for(let soldier of soldiers){let d=Math.hypot(soldier.x-e.x,soldier.y-e.y);if(soldier.hp>0&&d<closest&&flowProgress(soldier.x,soldier.y)<=progress-5&&roadIsClear(e,soldier)){defender=soldier;closest=d}}
 let inMelee=defender&&closest<e.r+10;
 if(inMelee&&e.stun<=0){e.attack=(e.attack||0)-dt;if(e.attack<=0){defender.hp-=e.body.melee;e.attack=.7}}
 const speed=e.speed*(e.slow>0?.55:1);
 if(e.stun>0||inMelee){e.vx*=Math.exp(-5*dt);e.vy*=Math.exp(-5*dt);}else{
  // A single eastward body force acts on the entire board. Road geometry
  // enters the movement calculation only when a body touches a bank.
  let ax=1,ay=0;
  if(defender){ax=(defender.x-e.x)/closest;ay=(defender.y-e.y)/closest;}
  const acceleration=speed*(defender?2.7:.62);
  const drag=1+dt*acceleration*Math.hypot(e.vx,e.vy)/(speed*speed);
  e.vx=(e.vx+dt*acceleration*ax)/drag;
  e.vy=(e.vy+dt*acceleration*ay)/drag;
 }
 e.x+=e.vx*dt;e.y+=e.vy*dt;keepOnRoad(e,defender||e.stun>0?0:speed);
 if(Math.hypot(e.vx,e.vy)>1)e.angle=Math.atan2(e.vy,e.vx);
 if(e.hp>0&&e.x>exitGate.x-20){e.escaped=true;health=Math.max(0,health-e.body.breach);e.hp=0;if(health<=0){health=0;over=true;running=false;document.querySelector('#defeat').hidden=false}breached=true}
}
if(breached)ui();
// Resolve nearby bodies with a spatial grid so crowds can spread without an all-pairs scan.
for(let pass=0;pass<2;pass++){
 const buckets=new Map(),cellSize=40;
 for(const e of enemies){
  if(e.hp<=0)continue;
  const cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize);
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){
   const bucket=buckets.get(x+','+y);
   if(!bucket)continue;
   for(const other of bucket){
    let dx=e.x-other.x,dy=e.y-other.y,d=Math.hypot(dx,dy);
    const minimum=e.r+other.r,overlap=minimum-d;
    if(overlap<=0)continue;
    if(d<.001){dx=0;dy=e.bias;d=1;}
    const nx=dx/d,ny=dy/d;
    const m1=other.r**2/(e.r**2+other.r**2),m2=1-m1;
    // A little compliance lets a packed arch give way at a narrow bank.
    // Correct deep penetration immediately and integrate contact pressure in time.
    const correction=Math.max(0,overlap-minimum*.16);
    e.x+=nx*correction*m1;e.y+=ny*correction*m1;
    other.x-=nx*correction*m2;other.y-=ny*correction*m2;
    const closing=(other.vx-e.vx)*nx+(other.vy-e.vy)*ny;
    // Transfer momentum and release compression as the front leaves a pinch.
    const impulse=Math.max(0,closing)*.85+overlap*48*dt;
    e.vx+=nx*impulse*m1;e.vy+=ny*impulse*m1;
    other.vx-=nx*impulse*m2;other.vy-=ny*impulse*m2;
    keepOnRoad(e);keepOnRoad(other);
   }
  }
  const key=cx+','+cy;
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push(e);
 }
}
for(let t of towers){if(t===aiming)continue;t.cool-=dt;if(t.recoil)t.recoil=Math.max(0,t.recoil-24*dt);if(t.plumeTime>0)t.plumeTime-=dt;if(t.type==='barracks'){if(running&&t.cool<=0&&soldiers.filter(a=>a.home===t).length<t.cap){let rally=nearestRoad(t.x,t.y),dx=t.x-rally.x,dy=t.y-rally.y,d=Math.hypot(dx,dy)||1;soldiers.push({home:t,x:rally.x+dx/d*12,y:rally.y+dy/d*12,hp:t.soldierHp,maxHp:t.soldierHp,cool:0,rally});t.cool=t.rate;if(selected===t)ui()}continue}let target=enemies.filter(e=>{let angle=Math.atan2(e.y-t.y,e.x-t.x),difference=Math.atan2(Math.sin(angle-t.facing),Math.cos(angle-t.facing));return e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.range&&(omnidirectional.includes(t.type)||Math.abs(difference)<=Math.PI/4)}).sort((a,b)=>b.x-a.x)[0];if(target&&t.cool<=0){fire(t,target);t.cool=t.rate}}for(let a of soldiers){a.cool-=dt;if(a.hp>0&&a.home.regen)a.hp=Math.min(a.maxHp,a.hp+a.home.regen*dt);let target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-a.home.x,e.y-a.home.y)<a.home.range+60).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];if(target){let dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);a.angle=Math.atan2(dy,dx);if(d>85){a.x+=dx/d*45*dt;a.y+=dy/d*45*dt}else if(a.cool<=0){projectiles.push({x:a.x,y:a.y,dx:dx/d,dy:dy/d,speed:400,remaining:100,damage:a.home.damage,type:'soldier',pierce:1,hit:[]});a.cool=a.home.rifleRate}}else{let dx=a.rally.x-a.x,dy=a.rally.y-a.y,d=Math.hypot(dx,dy);if(d>5){a.x+=dx/d*40*dt;a.y+=dy/d*40*dt}}}let previousSoldierCount=soldiers.length;soldiers=soldiers.filter(a=>a.hp>0);if(selected&&selected.type==='barracks'&&soldiers.length!==previousSoldierCount)ui();for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++){let a=soldiers[i],b=soldiers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16){if(d<.01){dx=1;dy=0;d=1}let shift=(16-d)/2;a.x-=dx/d*shift;a.y-=dy/d*shift;b.x+=dx/d*shift;b.y+=dy/d*shift}}moveProjectiles(dt);let dead=enemies.filter(e=>e.hp<=0&&!e.escaped);if(dead.length){money+=dead.reduce((sum,e)=>sum+e.body.bounty,0);ui()}enemies=enemies.filter(e=>e.hp>0);effects.forEach(e=>e.time-=dt);effects=effects.filter(e=>e.time>0);if(running&&!waveQueue.length&&!enemies.length){running=false;soldiers=[];money+=30+wave*5;status.textContent='Wave cleared · supplies delivered';ui()}}
function makeMap() {
  const seed = 372 + Object.values(maps).indexOf(activeMap) * 101;
  return FieldArt.terrain(activeMap, activeMap.roads, segments, pathDistance, seed, waterShape, canvas.width/activeMap.width);
}
function makePlacementOverlay(){
 let c=document.createElement('canvas');c.width=Math.ceil(activeMap.width/2);c.height=Math.ceil(activeMap.height/2);let g=c.getContext('2d'),data=g.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let px=x*2+1,py=y*2+1,valid=buildableGround(px,py),i=(y*c.width+x)*4;data.data[i]=valid?115:190;data.data[i+1]=valid?195:63;data.data[i+2]=valid?100:50;data.data[i+3]=valid?42:75}g.putImageData(data,0,0);return c;
}
let mapArt, placementOverlay;
function drawRanges() {
  if (building) {
    ctx.drawImage(placementOverlay,0,0,activeMap.width,activeMap.height);
    for (const t of towers) {
      ctx.beginPath(); ctx.arc(t.x,t.y,44,0,Math.PI*2);
      ctx.fillStyle='#bd483b55'; ctx.fill();
    }
    const valid=canPlace(mouse);
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,types[building].range,0,Math.PI*2);
    ctx.strokeStyle='#f5f1d68c'; ctx.lineWidth=1; ctx.stroke();
    ctx.globalAlpha=.66;
    ctx.drawImage(foundations[overWater(mouse.x,mouse.y)?1:0],mouse.x-36,mouse.y-36,72,72);
    ctx.drawImage(heads[building],mouse.x-36,mouse.y-36,72,72);
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
const enemyReadout=document.querySelector('#enemyReadout');
function draw() {
  if (!started) return;
  ctx.drawImage(mapArt,0,0,activeMap.width,activeMap.height);
  drawRanges();
  for(const t of towers){
    ctx.drawImage(foundations[t.wet?1:0],t.x-36,t.y-36,72,72);
    drawUnit(t.head||heads[t.type],t,-36-(t.recoil||0),-36,72,72);
  }
  for (const a of soldiers) drawUnit(soldierSprite,a,-14,-12,32,24);
  let inspected=null,nearest=Infinity;
  for (const e of enemies) {
    const size=e.r/9;
    drawUnit(zombieSprite(e.kind,e.tier),e,-22*size,-22*size,44*size,44*size);
    if(!building&&!aiming){
      const d=(mouse.x-e.x)**2+(mouse.y-e.y)**2;
      if(d<(e.r+4)**2 && d<nearest){inspected=e;nearest=d;}
    }
    if(e.hp<e.max){
      const barY=e.y-(e.tier>=4?20:e.tier>=2?16:13)*size-3;
      ctx.fillStyle='#253533'; ctx.fillRect(e.x-9,barY,18,2.5);
      ctx.fillStyle='#f4ce93'; ctx.fillRect(e.x-9,barY,18*Math.max(0,e.hp/e.max),2.5);
    }
  }
  if(inspected){
    const label=enemyNames[inspected.kind]+' · Tier '+inspected.tier+' · '+Math.ceil(inspected.hp)+' / '+inspected.max+' HP';
    if(enemyReadout.textContent!==label)enemyReadout.textContent=label;
  }
  enemyReadout.hidden=!inspected;
  for(const t of towers)if(t.plumeTime>0)FieldArt.flameJet(ctx,t,performance.now()*.001);
  for(const p of projectiles) FieldArt.round(ctx,p);
  for(const e of effects) FieldArt.effect(ctx,e);
  if(over){
    ctx.fillStyle='#102326c9'; ctx.fillRect(0,0,activeMap.width,activeMap.height);
  }
}
const landscape = document.querySelector('#landscape');
FieldArt.landscape(landscape);
window.addEventListener('resize', () => { if (!started) FieldArt.landscape(landscape); });
let last=performance.now();function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}ui();requestAnimationFrame(loop);

const mapSelect=document.querySelector('#mapSelect');
for(const [key,map] of Object.entries(maps))mapSelect.add(new Option(map.name,key));
function previewZone(){
  const map=maps[mapSelect.value];
  document.querySelector('#mapSummary').textContent=map.briefing;
  document.querySelector('#mapProfile').textContent=map.size+' · '+map.paths.length+(map.links?.length?' linked approaches':map.paths.length===1?' route':' routes');
  const diagram=document.querySelector('#mapDiagram'),g=diagram.getContext('2d');
  g.clearRect(0,0,diagram.width,diagram.height);
  const scale=Math.min((diagram.width-18)/map.width,(diagram.height-12)/map.height);
  g.save();g.translate((diagram.width-map.width*scale)/2,(diagram.height-map.height*scale)/2);g.scale(scale,scale);
  g.fillStyle='#b6c9b6';g.fill(FieldArt.roadOutline(map.segments));
  const [x,y]=map.paths[0].at(-1);
  g.fillStyle='#ffad73';g.beginPath();g.arc(x,y,6/scale,0,Math.PI*2);g.fill();g.restore();
}
mapSelect.addEventListener('change',previewZone);
previewZone();
document.querySelector('#play').onclick=()=>{
  buildRoutes(maps[mapSelect.value]);
  waterShape=FieldArt.waterways(activeMap);
  const scale=Math.min(2,3072/activeMap.width);
  canvas.width=Math.round(activeMap.width*scale);canvas.height=Math.round(activeMap.height*scale);
  ctx.setTransform(canvas.width/activeMap.width,0,0,canvas.height/activeMap.height,0,0);
  document.documentElement.style.setProperty('--map-ratio',activeMap.width/activeMap.height);
  canvas.setAttribute('aria-label',activeMap.name+' battlefield');
  flowField=buildFlowField();mapArt=makeMap();placementOverlay=makePlacementOverlay();
  started=true;document.querySelector('#menu').hidden=true;last=performance.now();
};
