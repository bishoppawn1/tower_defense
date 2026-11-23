const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');

const types={gun:{name:'Gun tower',cost:50,range:140,rate:.45,damage:9,color:'#d5dcb3',desc:'Reliable single-target fire'},sniper:{name:'Sniper tower',cost:85,range:260,rate:1.65,damage:30,color:'#d6c89a',desc:'Long range · piercing shots'},shotgun:{name:'Shotgun tower',cost:75,range:100,rate:1.1,damage:9,color:'#e0b26d',desc:'Short range · directional spread'},rocket:{name:'Rocket tower',cost:110,range:180,rate:1.6,damage:30,color:'#d6845e',desc:'Explosive area damage'},lightning:{name:'Lightning tower',cost:120,range:150,rate:1.35,damage:13,color:'#8bc8d0',desc:'Chains between enemies · stuns'}};
Object.assign(types,{barracks:{name:'Barracks',cost:110,range:130,rate:3,damage:0,color:'#79a7ad',desc:'Deploys soldiers during waves'},flame:{name:'Flamethrower',cost:90,range:105,rate:.18,damage:4,color:'#f18d4c',desc:'Short-range stream · burns'},frost:{name:'Cryo tower',cost:95,range:140,rate:.8,damage:6,color:'#9adbe2',desc:'Chilling rounds slow zombies'},cannon:{name:'Autocannon',cost:125,range:180,rate:.65,damage:18,color:'#d8c17e',desc:'Heavy armor-piercing shells'},venom:{name:'Toxic sprayer',cost:100,range:130,rate:.7,damage:5,color:'#b2d75d',desc:'Poison damages over time'}});
Object.assign(types,{minigun:{name:'Minigun',cost:100,range:155,rate:.16,damage:4,color:'#d9b664',desc:'Rapid automatic fire'},mortar:{name:'Mortar',cost:130,range:230,rate:2.5,damage:22,color:'#d99f6c',desc:'Arcing explosive shells'},pulse:{name:'Pulse tower',cost:115,range:105,rate:1.8,damage:8,color:'#b5b1ef',desc:'Repels nearby zombies'}});
const omnidirectional=['gun','lightning','barracks','frost','venom','minigun','mortar','pulse'];
let started=false;
const FLOW_CELL=10;
let activeMap=maps.meadow, routes=[], segments=[], exitGate, flowCols, flowRows, flowField;
let routeBag=[];

function buildRoutes(map) {
  activeMap=map;
  routes=map.paths.map(points=>({points:points.map(([x,y])=>({x,y})),widths:map.widths}));
  exitGate=routes[0].points.at(-1);
  const unique=new Map();
  for(const route of routes){
    route.points.slice(1).forEach((b,i)=>{
      const a=route.points[i], width=route.widths[i], dx=b.x-a.x, dy=b.y-a.y;
      unique.set([a.x,a.y,b.x,b.y,width].join(','),{a,b,width,dx,dy,length2:dx*dx+dy*dy});
    });
  }
  segments=[...unique.values()];
  flowCols=Math.ceil(map.width/FLOW_CELL);
  flowRows=Math.ceil(map.height/FLOW_CELL);
  routeBag=[];
}
function nextRoute(){
  if(!routeBag.length){
    routeBag=routes.slice();
    for(let i=routeBag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [routeBag[i],routeBag[j]]=[routeBag[j],routeBag[i]];
    }
  }
  return routeBag.pop();
}
function pathDistance(x,y){
  let best=Infinity;
  for(const {a,dx,dy,length2,width} of segments){
    const px=x-a.x,py=y-a.y,t=Math.max(0,Math.min(1,(px*dx+py*dy)/length2));
    const sx=px-t*dx,sy=py-t*dy;
    best=Math.min(best,Math.sqrt(sx*sx+sy*sy)-width/2);
  }
  return best;
}
// Both banks carry the same current. Only near a bank does the crowd turn
// inward; the open middle of each branch leaves room for bodies to spread.
function currentAt(route,x){
  const {points,widths}=route;
  let i=0;
  while(i<points.length-2 && points[i+1].x<x)i++;
  const a=points[i],b=points[i+1],slope=(b.y-a.y)/(b.x-a.x);
  const y=a.y+slope*Math.max(0,Math.min(b.x-a.x,x-a.x));
  return {y,width:widths[i],verticalRadius:widths[i]/2*Math.hypot(1,slope)};
}
function streamSlope(enemy){
  let here=currentAt(enemy.route,enemy.x);
  // A packed junction or a soldier can sweep someone onto another road.
  // Once the banks separate, stay with the current under their feet.
  if(Math.abs(here.y-enemy.y)>here.verticalRadius+2){
    let best=Infinity;
    for(const route of routes){
      const bank=currentAt(route,enemy.x), separation=Math.abs(bank.y-enemy.y)/bank.verticalRadius;
      if(separation<best){best=separation;enemy.route=route;here=bank;}
    }
  }
  const ahead=currentAt(enemy.route,enemy.x+34);
  const offset=here.y-enemy.y,slack=Math.max(4,here.width*.31-enemy.r*.4);
  const inward=Math.sign(offset)*Math.max(0,Math.abs(offset)-slack);
  return (ahead.y-here.y)/34+inward/22;
}
function nearestRoad(x,y){let best=null,dist=Infinity;for(let {a,b} of segments){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))),point={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(point.x-x,point.y-y);if(d<dist){best=point;dist=d}}return best}
function buildFlowField(){
 const size=flowCols*flowRows,walkable=new Uint8Array(size),distance=new Float64Array(size);distance.fill(Infinity);
 for(let y=0;y<flowRows;y++)for(let x=0;x<flowCols;x++){let px=x*FLOW_CELL+5,py=y*FLOW_CELL+5;walkable[y*flowCols+x]=segments.some(({a,b,width})=>{let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(px-a.x-t*dx,py-a.y-t*dy)<=width/2-5})?1:0}
 const heap=[];
 function push(index,cost){let n=heap.length;heap.push({index,cost});while(n){let p=(n-1)>>1;if(heap[p].cost<=cost)break;heap[n]=heap[p];n=p}heap[n]={index,cost}}
 function pop(){let first=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=heap.length)break;let child=r<heap.length&&heap[r].cost<heap[l].cost?r:l;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child}heap[i]=last}return first}
 for(let y=0;y<flowRows;y++)for(let x=Math.floor((exitGate.x-20)/FLOW_CELL);x<flowCols;x++){let i=y*flowCols+x;if(walkable[i]&&Math.abs(y*FLOW_CELL+FLOW_CELL/2-exitGate.y)<40){distance[i]=0;push(i,0)}}
 while(heap.length){let current=pop();if(current.cost!==distance[current.index])continue;let x=current.index%flowCols,y=Math.floor(current.index/flowCols);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy;if(nx<0||nx>=flowCols||ny<0||ny>=flowRows)continue;let next=ny*flowCols+nx;if(!walkable[next]||(dx&&dy&&(!walkable[y*flowCols+nx]||!walkable[ny*flowCols+x])))continue;let cost=current.cost+(dx&&dy?14.142:10);if(cost<distance[next]){distance[next]=cost;push(next,cost)}}}
 return {walkable,distance};
}
function flowCell(x,y){let cx=Math.max(0,Math.min(flowCols-1,Math.floor(x/FLOW_CELL))),cy=Math.max(0,Math.min(flowRows-1,Math.floor(y/FLOW_CELL)));return {x:cx,y:cy,index:cy*flowCols+cx}}
function flowProgress(x,y){let cell=flowCell(x,y),best=flowField.distance[cell.index];if(Number.isFinite(best))return best;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let nx=cell.x+dx,ny=cell.y+dy;if(nx>=0&&nx<flowCols&&ny>=0&&ny<flowRows)best=Math.min(best,flowField.distance[ny*flowCols+nx]+Math.hypot(dx,dy)*FLOW_CELL)}return best}
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
function buildableGround(x,y){
  if(x<30 || x>activeMap.width-30 || y<30 || y>activeMap.height-30)return false;
  if(x>exitGate.x-60 && Math.abs(y-exitGate.y)<76)return false;
  if(pathDistance(x,y)<21)return false;
  for(const [cx,cy,rx,ry] of activeMap.landmarks){
    const dx=Math.abs(x-cx),dy=Math.abs(y-cy);
    if(activeMap===maps.town){
      if(Math.hypot(Math.max(0,dx-rx),Math.max(0,dy-ry))<21)return false;
    }else if((dx/(rx+21))**2+(dy/(ry+21))**2<1)return false;
  }
  return true;
}
function canPlace(p){return buildableGround(p.x,p.y)&&!towers.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<44)}
let money=250,health=20,wave=0,towers=[],enemies=[],effects=[],projectiles=[],soldiers=[],selected=null,building=null,aiming=null,remaining=0,spawn=0,running=false,over=false,mouse={x:-100,y:-100};
const shop=document.querySelector('#shop'),details=document.querySelector('#details'),status=document.querySelector('#status'),upgradeDialog=document.querySelector('#upgradeDialog'),notice=document.querySelector('#notice');
let seenKinds=new Set(),noticeQueue=[],noticeTimer;
function showNotice(){if(!noticeQueue.length){notice.hidden=true;noticeTimer=null;return}notice.textContent=noticeQueue.shift();notice.hidden=false;noticeTimer=setTimeout(showNotice,6000)}
function announce(kind){if(seenKinds.has(kind))return;seenKinds.add(kind);noticeQueue.push(({normal:'Walker · A standard zombie.',big:'Brute · Larger and tougher. Deals extra base damage.',armor:'Armored zombie · Takes half damage from bullets and rifle fire.',shock:'Insulated zombie · Immune to lightning damage and stun.',fire:'Fireproof zombie · Immune to fire damage and burning.',cold:'Frostproof zombie · Immune to cryo damage and freezing.',toxic:'Hazmat zombie · Immune to poison damage and poison.'})[kind]);if(!noticeTimer)showNotice()}
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
function ui(){document.querySelector('#money').textContent=money;document.querySelector('#health').textContent=health;document.querySelector('#wave').textContent=wave;document.querySelector('#cancel').hidden=!(building||aiming);document.querySelector('#placementLegend').hidden=!building;document.querySelector('#start').disabled=running||over;document.querySelector('#start').textContent=over?'Outpost lost':running?'Wave in progress':'Start wave →';shop.innerHTML='';Object.entries(types).forEach(([key,t])=>{let b=document.createElement('button');b.className='tower '+(building===key?'active':'');b.innerHTML=`<img class="icon" src="${towerIcon(key)}" alt=""><span><strong>${t.name}</strong></span><span class="cost">${t.cost} ⬡</span>`;b.onclick=()=>{upgradeDialog.hidden=true;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}building=key;selected=null;ui()};shop.appendChild(b)});if(selected)showTowerDetails(selected);}
function showTowerDetails(t){
  const barracks=t.type==='barracks';
  const tierRows=upgrades[t.type].map((track,i)=>`<div class="track"><small>Track ${i+1}</small>${track.map(([text],n)=>{
    const bought=n<t.upgrades[i],next=n===t.upgrades[i];
    return `<button class="upgrade" data-track="${i}" data-tier="${n}" ${next?'':'disabled'}>${n+1}. ${text}<br>${bought?'Purchased':(next?'':'Locked · ')+tierCosts[n]+' ⬡'}</button>`;
  }).join('')}</div>`).join('');
  const labels={damage:barracks?'Rifle damage':'Damage',speed:barracks?'Rifle fire rate':'Fire rate',range:barracks?'Patrol radius':'Range'};
  const tuningRows=fullyUpgraded(t)?Object.entries(tuning).map(([key,step])=>
    `<button class="upgrade" data-tune="${key}">${labels[key]} +${Math.round(step*100)}% · Rank ${t.ranks[key]}<br>${tuningCost(t)} ⬡</button>`).join(''):'<p>Complete both tracks to unlock repeatable stat upgrades.</p>';
  details.innerHTML=`<small>Selected tower</small><h2>${types[t.type].name}</h2>
    <p>${labels.damage} ${Number(t.damage.toFixed(2))} · ${(1/(barracks?t.rifleRate:t.rate)).toFixed(2)}/s · ${labels.range} ${Math.round(t.range)}
    ${barracks?`<br>Soldiers ${soldiers.filter(a=>a.home===t&&a.hp>0).length} / ${t.cap}`:''}</p>
    <button class="sell" id="sellTower">Sell · ${Math.floor(t.spent*.7)} ⬡</button>
    ${tierRows}<div class="track"><small>Advanced tuning</small>${tuningRows}</div>`;
  details.onclick=event=>{
    const button=event.target.closest('button');
    if(!button||selected!==t)return;
    if(button.id==='sellTower'){
      money+=Math.floor(t.spent*.7);towers=towers.filter(a=>a!==t);soldiers=soldiers.filter(a=>a.home!==t);
      selected=null;upgradeDialog.hidden=true;status.textContent='Tower sold';ui();return;
    }
    const stat=button.dataset.tune,track=Number(button.dataset.track),tier=Number(button.dataset.tier);
    if(stat ? !fullyUpgraded(t)||!(stat in tuning) : t.upgrades[track]!==tier)return;
    const cost=stat?tuningCost(t):tierCosts[tier];
    if(money<cost){status.textContent='Not enough supplies';return;}
    money-=cost;t.spent+=cost;
    if(stat)tune(t,stat);
    else {applyTier(t,upgrades[t.type][track][tier][1]);t.upgrades[track]++;}
    ui();
  };
}
function pos(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*activeMap.width/r.width,y:(e.clientY-r.top)*activeMap.height/r.height}}
canvas.onmousemove=e=>mouse=pos(e);canvas.onclick=e=>{let p=pos(e);if(aiming){aiming.facing=Math.atan2(p.y-aiming.y,p.x-aiming.x);aiming.angle=aiming.facing;aiming=null;status.textContent='Tower deployed';ui();return}if(building){let t=types[building];if(money<t.cost){status.textContent='Not enough supplies';return}if(!canPlace(p)){status.textContent='Choose a clear spot';return}money-=t.cost;let tower=createTower(building,p.x,p.y);towers.push(tower);aiming=omnidirectional.includes(building)?null:tower;building=null;status.textContent=aiming?'Click to choose firing direction':'Tower deployed';ui();return}selected=towers.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<23)||null;ui();upgradeDialog.hidden=!selected};document.querySelector('#closeDetails').onclick=()=>{upgradeDialog.hidden=true;selected=null;ui()};function cancelPlacement(){building=null;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}status.textContent='Placement cancelled';ui()}document.querySelector('#cancel').onclick=cancelPlacement;document.onkeydown=e=>{if(e.key==='Escape'&&(building||aiming))cancelPlacement()};document.querySelector('#start').onclick=()=>{wave++;remaining=wave<=3?[12,18,25][wave-1]:8+wave*6;running=true;spawn=0;status.textContent='Wave '+wave+' incoming';ui()};
const immuneTo={shock:'lightning',fire:'flame',cold:'frost',toxic:'venom'};
const ballistic=['gun','shotgun','sniper','minigun','cannon','soldier'];
function strike(e,attack,dx=0,dy=0){
  if(immuneTo[e.kind]===attack.type)return;
  const armored=e.kind==='armor'&&ballistic.includes(attack.type)&&!attack.ignoreArmor;
  e.hp-=attack.damage*(armored?.5:1);
  if(attack.slow)e.slow=Math.max(e.slow||0,attack.slow);
  if(attack.stun)e.stun=Math.max(e.stun||0,attack.stun);
  if(attack.push){const d=Math.hypot(dx,dy)||1;e.vx+=dx/d*attack.push;e.vy+=dy/d*attack.push;}
  if(attack.dot && !(attack.type==='rocket'&&e.kind==='fire')){
    e.poisonDamage=attack.dot;e.poison=attack.duration;
  }
}
function fire(t,target){
  const type=t.type;
  t.angle=Math.atan2(target.y-t.y,target.x-t.x);
  if(type==='pulse'){
    for(const e of enemies){
      const dx=e.x-t.x,dy=e.y-t.y;
      if(Math.hypot(dx,dy)<t.range)strike(e,t,dx,dy);
    }
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
  effects.push({x:t.x+Math.cos(t.angle)*20,y:t.y+Math.sin(t.angle)*20,flash:true,time:.08,color:type==='flame'?'#ff9a45':'#ffe7a0'});
  const distance=t.blast?Math.hypot(target.x-t.x,target.y-t.y):t.range;
  const speed={sniper:700,mortar:190,rocket:260}[type]||480;
  for(let i=0;i<t.shots;i++){
    const spread=type==='shotgun'?(i/(t.shots-1)-.5)*.68:0;
    const angle=t.angle+spread;
    projectiles.push({x:t.x,y:t.y,dx:Math.cos(angle),dy:Math.sin(angle),speed,remaining:distance,total:distance,
      damage:t.damage,type,pierce:t.pierce,ignoreArmor:t.ignoreArmor,radius:t.blast,slow:t.slow,stun:t.stun,
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
  p.x+=p.dx*distance;p.y+=p.dy*distance;p.remaining-=distance;if((p.type==='rocket'||p.type==='mortar')&&(p.pierce<=0||p.remaining<=0)){for(let e of enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<p.radius){strike(e,p,e.x-p.x,e.y-p.y)}effects.push({x:p.x,y:p.y,r:p.radius,time:.25,color:'#f6a357'})}
 }
 projectiles=projectiles.filter(p=>p.remaining>0&&p.pierce>0);
}
function update(dt){if(!started||over)return;if(running&&remaining>0){spawn-=dt;if(spawn<=0){let available=['normal'];if(wave>=3)available.push('armor');if(wave>=5)available.push('shock');if(wave>=7)available.push('fire');if(wave>=9)available.push('cold');if(wave>=11)available.push('toxic');let kind=Math.random()<.5?'normal':available[Math.floor(Math.random()*available.length)],big=wave>=2&&Math.random()<Math.min(.3,wave*.035),hp=(20+wave*5)*(big?2.8:1);let radius=big?14:9,lanes=[routes[0].points[0].y-28,routes[0].points[0].y,routes[0].points[0].y+28].filter(y=>enemies.every(e=>Math.hypot(e.x+20,e.y-y)>=e.r+radius+1));if(lanes.length){let y=lanes[Math.floor(Math.random()*lanes.length)];announce(kind);if(big)announce('big');enemies.push({route:nextRoute(),x:-20,y,vx:0,vy:0,bias:Math.random()<.5?-1:1,r:radius,hp,max:hp,kind,speed:(49+Math.random()*18)*(big?.75:1)*(wave<=3?[.7,.8,.9][wave-1]:1),stun:0,phase:Math.random()*6});remaining--;spawn=wave<=3?[.7,.6,.5][wave-1]:Math.max(.12,.42-wave*.015)}else spawn=.05}}for(let e of enemies){
 e.stun-=dt;if(e.poison>0){e.hp-=e.poisonDamage*dt;e.poison-=dt}e.slow=(e.slow||0)-dt;
 let progress=flowProgress(e.x,e.y),defender=null,closest=110;
 for(let soldier of soldiers){let d=Math.hypot(soldier.x-e.x,soldier.y-e.y);if(soldier.hp>0&&d<closest&&flowProgress(soldier.x,soldier.y)<=progress-5&&roadIsClear(e,soldier)){defender=soldier;closest=d}}
 let inMelee=defender&&closest<e.r+10;
 if(inMelee&&e.stun<=0){e.attack=(e.attack||0)-dt;if(e.attack<=0){defender.hp-=8;e.attack=.7}}
 let drag=Math.exp(-3.5*dt),speed=e.speed*(e.slow>0?.55:1);
 if(e.stun>0||inMelee){e.vx*=drag;e.vy*=drag}else{
  // Soldiers ahead can briefly draw zombies out of the branch current.
  let dx=defender?defender.x-e.x:1,dy=defender?defender.y-e.y:streamSlope(e),length=Math.hypot(dx,dy)||1;
  e.vx=e.vx*drag+dx/length*speed*(1-drag);e.vy=e.vy*drag+dy/length*speed*(1-drag);
  e.x+=e.vx*dt;e.y+=e.vy*dt;keepOnRoad(e);
  if(Math.hypot(e.vx,e.vy)>1)e.angle=Math.atan2(e.vy,e.vx);
 }
 e.phase+=dt*7;if(e.x>exitGate.x-20&&Math.abs(e.y-exitGate.y)<55){e.escaped=true;health-=e.r>10?2:1;e.hp=0;if(health<=0){health=0;over=true;running=false}ui()}
}
// Resolve nearby bodies with a spatial grid so crowds can spread without an all-pairs scan.
for(let pass=0;pass<2;pass++){
 let buckets=new Map(),cellSize=32;
 for(let e of enemies){if(e.hp<=0)continue;let cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){let bucket=buckets.get(x+','+y);if(!bucket)continue;for(let other of bucket){let dx=e.x-other.x,dy=e.y-other.y,d=Math.hypot(dx,dy),minimum=e.r+other.r;if(d>=minimum)continue;if(d<.01){dx=0;dy=1;d=1}let shift=(minimum-d)/2,ex=dx/d*shift,ey=dy/d*shift;e.x+=ex;e.y+=ey;other.x-=ex;other.y-=ey;let relative=(e.vx-other.vx)*dx/d+(e.vy-other.vy)*dy/d;if(relative<0){let impulse=-relative*.35;e.vx+=dx/d*impulse;e.vy+=dy/d*impulse;other.vx-=dx/d*impulse;other.vy-=dy/d*impulse}keepOnRoad(e);keepOnRoad(other)}}let key=cx+','+cy;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e)}
}
for(let t of towers){if(t===aiming)continue;t.cool-=dt;if(t.type==='barracks'){if(running&&t.cool<=0&&soldiers.filter(a=>a.home===t).length<t.cap){let rally=nearestRoad(t.x,t.y),dx=t.x-rally.x,dy=t.y-rally.y,d=Math.hypot(dx,dy)||1;soldiers.push({home:t,x:rally.x+dx/d*12,y:rally.y+dy/d*12,hp:t.soldierHp,maxHp:t.soldierHp,cool:0,rally});t.cool=t.rate;if(selected===t)ui()}continue}let target=enemies.filter(e=>{let angle=Math.atan2(e.y-t.y,e.x-t.x),difference=Math.atan2(Math.sin(angle-t.facing),Math.cos(angle-t.facing));return e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.range&&(omnidirectional.includes(t.type)||Math.abs(difference)<=Math.PI/4)}).sort((a,b)=>b.x-a.x)[0];if(target&&t.cool<=0){fire(t,target);t.cool=t.rate}}for(let a of soldiers){a.cool-=dt;if(a.hp>0&&a.home.regen)a.hp=Math.min(a.maxHp,a.hp+a.home.regen*dt);let target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-a.home.x,e.y-a.home.y)<a.home.range+60).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];if(target){let dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);a.angle=Math.atan2(dy,dx);if(d>85){a.x+=dx/d*45*dt;a.y+=dy/d*45*dt}else if(a.cool<=0){projectiles.push({x:a.x,y:a.y,dx:dx/d,dy:dy/d,speed:400,remaining:100,damage:a.home.damage,type:'soldier',pierce:1,hit:[]});a.cool=a.home.rifleRate}}else{let dx=a.rally.x-a.x,dy=a.rally.y-a.y,d=Math.hypot(dx,dy);if(d>5){a.x+=dx/d*40*dt;a.y+=dy/d*40*dt}}}let previousSoldierCount=soldiers.length;soldiers=soldiers.filter(a=>a.hp>0);if(selected&&selected.type==='barracks'&&soldiers.length!==previousSoldierCount)ui();for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++){let a=soldiers[i],b=soldiers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16){if(d<.01){dx=1;dy=0;d=1}let shift=(16-d)/2;a.x-=dx/d*shift;a.y-=dy/d*shift;b.x+=dx/d*shift;b.y+=dy/d*shift}}moveProjectiles(dt);let dead=enemies.filter(e=>e.hp<=0&&!e.escaped);if(dead.length){money+=dead.length*4;ui()}enemies=enemies.filter(e=>e.hp>0);effects.forEach(e=>e.time-=dt);effects=effects.filter(e=>e.time>0);if(running&&!remaining&&!enemies.length){running=false;soldiers=[];money+=30+wave*5;status.textContent='Wave cleared · supplies delivered';ui()}}
function makeMap() {
  const seed = 372 + Object.values(maps).indexOf(activeMap) * 101;
  return FieldArt.terrain(activeMap, routes, segments, pathDistance, seed);
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
  ctx.drawImage(mapArt,0,0,activeMap.width,activeMap.height);
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
    ctx.fillStyle='#102326c9'; ctx.fillRect(0,0,activeMap.width,activeMap.height);
    ctx.fillStyle='#f4f0dd'; ctx.textAlign='center'; ctx.font='bold 46px system-ui';
    ctx.fillText('The outpost has fallen',activeMap.width/2,activeMap.height/2-15); ctx.font='18px system-ui';
    ctx.fillText('Refresh to try again',activeMap.width/2,activeMap.height/2+25);
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
  document.querySelector('#mapProfile').textContent=map.size+' · '+map.paths.length+(map.paths.length===1?' route':' routes');
  const diagram=document.querySelector('#mapDiagram'),g=diagram.getContext('2d');
  g.clearRect(0,0,diagram.width,diagram.height);
  const scale=Math.min((diagram.width-18)/map.width,(diagram.height-12)/map.height);
  g.save();g.translate((diagram.width-map.width*scale)/2,(diagram.height-map.height*scale)/2);g.scale(scale,scale);
  g.lineJoin=g.lineCap='round';g.lineWidth=4/scale;g.strokeStyle='#b6c9b6';
  for(const points of map.paths){
    g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
  }
  const [x,y]=map.paths[0].at(-1);
  g.fillStyle='#ffad73';g.beginPath();g.arc(x,y,6/scale,0,Math.PI*2);g.fill();g.restore();
}
mapSelect.addEventListener('change',previewZone);
previewZone();
document.querySelector('#play').onclick=()=>{
  buildRoutes(maps[mapSelect.value]);
  canvas.width=activeMap.width*2;canvas.height=activeMap.height*2;ctx.setTransform(2,0,0,2,0,0);
  document.documentElement.style.setProperty('--map-ratio',activeMap.width/activeMap.height);
  canvas.setAttribute('aria-label',activeMap.name+' battlefield');
  flowField=buildFlowField();mapArt=makeMap();placementOverlay=makePlacementOverlay();
  started=true;document.querySelector('#menu').hidden=true;last=performance.now();
};
