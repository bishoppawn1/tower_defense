const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');

const types={gun:{name:'Gun tower',cost:40,range:182,rate:.7,damage:16,color:'#d5dcb3',desc:'Cheap flank guard. One round drops a fresh tier-one walker.'},sniper:{name:'Sniper tower',cost:85,range:260,rate:1.65,damage:30,color:'#d6c89a',desc:'Long range · piercing shots'},shotgun:{name:'Shotgun tower',cost:80,range:112,rate:.92,damage:12,color:'#e0b26d',desc:'Breach defense. Centers a pellet fan on a pack, with extra damage inside 65 units.'},rocket:{name:'Rocket tower',cost:110,range:185,rate:1.25,damage:40,color:'#d6845e',desc:'Fast contact rockets intercept the front of a rush.'},lightning:{name:'Lightning tower',cost:420,range:188,rate:1.2,damage:42,color:'#8bc8d0',desc:'Chains between enemies · stuns'}};
Object.assign(types,{barracks:{name:'Barracks',cost:110,range:130,rate:3,damage:0,color:'#79a7ad',desc:'Deploys soldiers during waves'},flame:{name:'Flamethrower',cost:90,range:105,rate:.18,damage:4,color:'#f18d4c',desc:'Burns through three targets · each hit loses heat'},frost:{name:'Cryo tower',cost:95,range:140,rate:.8,damage:6,color:'#9adbe2',desc:'Chilling rounds slow zombies'},cannon:{name:'Autocannon',cost:390,range:210,rate:.50,damage:54,color:'#d8c17e',desc:'Heavy armor-piercing shells'},venom:{name:'Toxic sprayer',cost:100,range:130,rate:.7,damage:5,color:'#b2d75d',desc:'Poison damages over time'}});
Object.assign(types,{minigun:{name:'Minigun',cost:145,range:138,rate:.32,damage:8,color:'#d9b664',desc:'Sustained fire spins the barrels up to 3.6× firing speed. A gap in targets costs momentum.'},mortar:{name:'Mortar',cost:165,range:345,rate:2.65,damage:38,color:'#d99f6c',desc:'Backline artillery. Leads the densest group in range and lobs shells over the front rank.'},pulse:{name:'Pulse tower',cost:115,range:105,rate:1.8,damage:8,color:'#b5b1ef',desc:'Shoves up to five nearby zombies · 8% stun chance'}});
Object.assign(types,{
  seeker:{name:'Seeker battery',cost:820,range:245,rate:1.1,damage:64,color:'#92d9b7',desc:'Guided missiles lock onto four separate zombies.'},
  solar:{name:'Solar lance',cost:1200,range:320,rate:1.5,damage:190,color:'#ffd083',desc:'Sears the toughest target, then sweeps nearby zombies with reserve heat and unused damage.'},
  disc:{name:'Disc launcher',cost:105,range:155,rate:1.35,damage:11,color:'#eda15e',desc:'Blades cut through zombies on the way out and back.'},
  prism:{name:'Prism turret',cost:140,range:150,rate:.42,damage:5,color:'#f2aeea',desc:'A focused beam grows stronger on the same target.'}
});
const omnidirectional=['gun','lightning','barracks','frost','venom','minigun','mortar','pulse','prism','seeker','solar'];
let started=false,sandbox=false,sandboxRun=null;
const FLOW_CELL=10;
let activeMap=maps.orchard, segments=[], exitGate, flowCols, flowRows, flowField;
// Sample the rendered road union once. A signed distance to the exposed
// banks gives round bodies a smooth contact normal across seams and forks.
const BANK_CELL=2, BANK_MARGIN=96;
let bankGrid,bankCols,bankRows;
function buildRoutes(map) {
  activeMap=map;exitGate=map.exit;segments=map.segments;
  for(const fork of map.forks)for(const exit of fork.outgoing)exit.entries=0;
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
// Road samples are spaced evenly in x. Read the cross-section ahead instead
// of sending a walker to a point that everyone must reach.
function roadSection(edge,x){
  const points=edge.points;
  const t=Math.max(0,Math.min(1,(x-edge.a.x)/(edge.b.x-edge.a.x)))*(points.length-1);
  const i=Math.min(points.length-2,Math.floor(t)),f=t-i;
  const a=points[i],b=points[i+1];
  return {y:a.y+(b.y-a.y)*f,width:a.width+(b.width-a.width)*f};
}
function forkDirection(e){
  if(e.turn && e.x>e.turn.end)e.turn=null;
  if(!e.turn){
    for(const fork of activeMap.forks){
      if(e.x<fork.x-250 || e.x>=fork.x)continue;
      for(const approach of fork.incoming){
        if(e.x<fork.x-Math.min(250,(fork.x-approach.a.x)*.58))continue;
        const section=roadSection(approach,e.x);
        if(Math.abs(e.y-section.y)>section.width/2)continue;
        const side=Math.max(-.45,Math.min(.45,(e.y-section.y)/section.width));
        // Prefer the nearer opening when equally many walkers have entered each.
        let best=null,distance=Infinity;
        for(const exit of fork.outgoing){
          const d=Math.abs(exit.mouthOffset/fork.span-side);
          if(!best||exit.entries<best.entries||(exit.entries===best.entries&&d<distance)){
            best=exit;distance=d;
          }
        }
        best.entries++;
        e.turn={approach,exit:best,side:side*.5,end:fork.x+Math.min(130,(best.b.x-fork.x)*.4)};
        break;
      }
      if(e.turn)break;
    }
  }
  if(!e.turn)return null;
  const {approach,exit,side}=e.turn,fork=exit.a;
  const x=e.x+Math.max(18,e.speed*.48);
  const before=x<fork.x,section=roadSection(before?approach:exit,x);
  const offset=before?(exit.mouthOffset+side*exit.mouthSpan)/fork.span:side;
  const dy=section.y+section.width*offset-e.y,dx=x-e.x;
  const length=Math.hypot(dx,dy);
  return {x:dx/length,y:dy/length};
}
const TOWER_RADIUS=15,TOWER_SPRITE=50;
function buildableGround(x,y){
  if(x<22 || x>activeMap.width-22 || y<22 || y>activeMap.height-22)return false;
  if(x>exitGate.x-60 && Math.abs(y-exitGate.y)<exitGate.span*.65+TOWER_RADIUS)return false;
  if(pathDistance(x,y)<TOWER_RADIUS)return false;
  for(const [cx,cy,rx,ry] of activeMap.landmarks){
    const dx=Math.abs(x-cx),dy=Math.abs(y-cy);
    if(activeMap.landmarkShape==='box'){
      if(Math.hypot(Math.max(0,dx-rx),Math.max(0,dy-ry))<TOWER_RADIUS)return false;
    }else if((dx/(rx+TOWER_RADIUS))**2+(dy/(ry+TOWER_RADIUS))**2<1)return false;
  }
  return true;
}
function canPlace(p){return buildableGround(p.x,p.y)&&!towers.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<2*TOWER_RADIUS)}
let money=activeMap.startingSupplies,health=20,wave=0,towers=[],enemies=[],effects=[],projectiles=[],soldiers=[],selected=null,building=null,aiming=null,waveQueue=[],spawn=0,running=false,over=false,mouse={x:-100,y:-100};
const shop=document.querySelector('#shop'),details=document.querySelector('#details'),status=document.querySelector('#status'),upgradeDialog=document.querySelector('#upgradeDialog'),notice=document.querySelector('#notice');
let seenKinds=new Set(),noticeQueue=[],noticeTimer;
function showNotice(){if(!noticeQueue.length){notice.hidden=true;noticeTimer=null;return}notice.textContent=noticeQueue.shift();notice.hidden=false;noticeTimer=setTimeout(showNotice,6000)}
function announce(kind,message){if(seenKinds.has(kind))return;seenKinds.add(kind);noticeQueue.push(message||({normal:'Walker · A standard zombie.',brute:'Brute · Pulse-proof melee bruiser. Nine times walker health and 5 base damage.',runner:'Runner · Fast, lightly built and easy to pick off.',armor:'Armored zombie · Stops 85% of bullet damage. Armor-piercing upgrades bypass its plating.',shock:'Insulated zombie · Immune to lightning damage and stun.',fire:'Fireproof zombie · Immune to fire damage and burning.',cold:'Frostproof zombie · Immune to cryo damage and freezing.',toxic:'Hazmat zombie · Immune to poison damage and poison.',blast:'Blastproof zombie · Its padded suit absorbs explosives and pulse waves.'})[kind]);if(!noticeTimer)showNotice()}
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
for(const [key,t] of Object.entries(types)){
  const button=document.createElement('button');
  button.title=t.desc;button.className='tower';button.dataset.type=key;
  button.innerHTML=`<img class="icon" src="${towerIcon(key)}" alt=""><span><strong>${t.name}</strong></span><span class="cost">${t.cost} ⬡</span>`;
  button.onclick=()=>{
    if(sandbox)closeLab();
    upgradeDialog.hidden=true;
    if(aiming){money+=types[aiming.type].cost;towers=towers.filter(a=>a!==aiming);aiming=null;}
    building=key;selected=null;ui();
  };
  shop.appendChild(button);
}
let inspectedTower,inspectedSpend;
function ui(){
  document.querySelector('#money').textContent=sandbox?'∞':money;document.querySelector('#health').textContent=sandbox?'∞':health;
  document.querySelector('#wave').textContent=sandboxRun?.custom?'Custom':wave;
  document.querySelector('#cancel').hidden=!(building||aiming);document.querySelector('#placementLegend').hidden=!building;
  speedButton.disabled=over;
  const start=document.querySelector('#start');start.disabled=!sandbox&&(running||over);
  start.textContent=sandbox?'Wave lab':over?'Outpost lost':running?'Wave in progress':'Start wave →';
  for(const button of shop.children)button.classList.toggle('active',button.dataset.type===building);
  const squad=selected?.type==='barracks'?soldiers.filter(s=>s.home===selected&&s.hp>0).length:0;
  if(selected&&(selected!==inspectedTower||selected.spent!==inspectedSpend)){
    showTowerDetails(selected,squad);
    inspectedSpend=selected.spent;
  }
  if(selected?.type==='barracks')details.querySelector('.squad-count').textContent=squad;
  inspectedTower=selected;
  if(selected){
    for(const button of details.querySelectorAll('[data-cost]'))button.disabled=money<Number(button.dataset.cost);
  }
}
function showTowerDetails(t,squad){
  const barracks=t.type==='barracks';
  const tierRows=upgrades[t.type].map((track,i)=>{
    const n=t.upgrades[i];
    if(n===track.length)return '';
    const [name,benefit]=track[n][0].split(' · ');
    const following=track[n+1]?.[0].split(' · ')[0];
    return `<button class="upgrade track-card" data-track="${i}" data-tier="${n}" data-cost="${tierCosts[n]}">
      <small>${trackNames[t.type][i]} · ${n+1}/${track.length}</small>
      <strong>${name}</strong><span>${benefit}</span>
      <b>Buy · ${tierCosts[n]} ⬡</b>${following?`<span class="following">Then · ${following}</span>`:''}
    </button>`;
  }).join('');
  const labels={damage:barracks?'Rifle damage':'Damage',speed:barracks?'Rifle fire rate':'Fire rate',range:barracks?'Patrol radius':'Range'};
  const tuningRows=Object.entries(tuning).map(([key,step])=>
    `<button class="upgrade stat-buy" data-tune="${key}" data-cost="${tuningCost(t,key)}"><span>${labels[key]} +${Math.round(step*100)}%<small>Rank ${t.ranks[key]}</small></span>
      <b>${tuningCost(t,key)} ⬡</b></button>`).join('');
  details.innerHTML=`<div class="tower-heading"><img src="${t.portrait||towerIcons[t.type]}" alt=""><h2>${types[t.type].name}</h2></div>
    <p>${labels.damage} ${Number(t.damage.toFixed(2))} · ${(1/(barracks?t.rifleRate:t.rate)).toFixed(2)}/s · ${labels.range} ${Math.round(t.range)}
    ${['gun','shotgun','rocket','minigun','mortar','disc','prism','solar','cannon','lightning'].includes(t.type)?`<br>${types[t.type].desc}`:''}
    ${t.type==='seeker'?`<br>${t.locks} independent locks · ${t.shots} missile${t.shots===1?'':'s'} per lock`:''}
    ${t.type==='solar'?`<br>+${Math.round(100*t.hpShare)}% max HP · up to ${t.hpCap} bonus damage · sweeps up to ${t.sweepCap} more within ${t.sweepRadius} units`:''}
    ${t.type==='sniper'?`<br>Up to ${t.pierce} in a line${t.lineGain?' · +'+Math.round(100*t.lineGain)+'% damage per body':''}`:''}
    ${t.type==='flame'?`<br>Up to ${t.pierce} targets · keeps ${Math.round(100*t.heatRetention)}% heat per hit`:''}
    ${t.areaCap?`<br>Up to ${t.areaCap} targets · damage fades toward the edge`:''}
    ${barracks?`<br>Soldiers <span class="squad-count">${squad}</span> / ${t.cap}`:''}</p>
    <section class="stat-tuning"><h3>Base upgrades</h3><div class="stat-options">${tuningRows}</div></section>
    ${tierRows?`<div class="track-options">${tierRows}</div>`:''}
    <button class="sell" id="sellTower">Sell · ${Math.floor(t.spent*.7)} ⬡</button>`;
  details.onclick=event=>{
    const button=event.target.closest('button');
    if(!button||selected!==t)return;
    if(button.id==='sellTower'){
      money+=Math.floor(t.spent*.7);towers=towers.filter(a=>a!==t);soldiers=soldiers.filter(a=>a.home!==t);
      selected=null;upgradeDialog.hidden=true;status.textContent='Tower sold';ui();return;
    }
    const stat=button.dataset.tune,track=Number(button.dataset.track),tier=Number(button.dataset.tier);
    if(stat ? !Object.hasOwn(tuning,stat) : t.upgrades[track]!==tier)return;
    const cost=stat?tuningCost(t,stat):tierCosts[tier];
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
function nearestTower(p,event){
  const touch=event.pointerType==='touch'||(!event.pointerType&&matchMedia('(pointer:coarse)').matches);
  let distance=touch?Math.max(23,12*activeMap.width/canvas.getBoundingClientRect().width):23;
  let nearest=null;
  for(const t of towers){
    const d=Math.hypot(t.x-p.x,t.y-p.y);
    if(d<distance){distance=d;nearest=t;}
  }
  return nearest;
}
canvas.onmousemove=e=>mouse=pos(e);
canvas.onmouseleave=()=>{mouse={x:-100,y:-100};};
canvas.onclick=e=>{if(sandbox)closeLab();let p=pos(e);if(aiming){aiming.facing=Math.atan2(p.y-aiming.y,p.x-aiming.x);aiming.angle=aiming.facing;aiming=null;status.textContent='Tower deployed';ui();return}if(building){let t=types[building];if(money<t.cost){status.textContent='Not enough supplies';return}if(!canPlace(p)){status.textContent='Choose a clear spot';return}money-=t.cost;let tower=createTower(building,p.x,p.y);tower.wet=Boolean(overWater(p.x,p.y));towers.push(tower);aiming=omnidirectional.includes(building)?null:tower;building=null;status.textContent=aiming?'Click to choose firing direction':'Tower deployed';ui();return}selected=nearestTower(p,e);ui();upgradeDialog.hidden=!selected};document.querySelector('#closeDetails').onclick=()=>{upgradeDialog.hidden=true;selected=null;ui()};function cancelPlacement(){building=null;if(aiming){money+=types[aiming.type].cost;towers=towers.filter(t=>t!==aiming);aiming=null}status.textContent='Placement cancelled';ui()}document.querySelector('#cancel').onclick=cancelPlacement;document.onkeydown=e=>{if(e.key==='Escape'&&(building||aiming))cancelPlacement()};
function launchWave(roster,message){
  waveQueue=roster.reverse();running=true;spawn=0;status.textContent=message;ui();
}
document.querySelector('#start').onclick=()=>{
  if(sandbox){openLab();return;}
  if(running||over)return;
  wave++;
  launchWave(waveRoster(wave,activeMap),'Wave '+wave+' incoming');
};

const immuneTo={shock:['lightning'],fire:['flame','solar'],cold:['frost'],toxic:['venom'],
  blast:['rocket','mortar','pulse','seeker'],brute:['pulse']};
const ballistic=['gun','shotgun','sniper','minigun','cannon','soldier'];
function strike(e,attack,dx=0,dy=0){
  if(immuneTo[e.kind]?.includes(attack.type))return;
  const armored=e.kind==='armor'&&ballistic.includes(attack.type)&&!attack.ignoreArmor;
  const finisher=attack.finishAt&&e.hp<=e.max*attack.finishAt?attack.finishPower:1;
  const heavy=e.kind==='brute'?(attack.brutePower||1):1;
  e.hp-=attack.damage*(armored?.15:1)*finisher*heavy;
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
// Two offset grids keep a pack straddling a cell boundary together. Each
// candidate contributes twice, so acquiring a battery target scales linearly.
function targetPack(t){
  const mortar=t.type==='mortar',size=mortar?t.blast*1.35:46;
  const grids=[new Map(),new Map()];
  const fx=Math.cos(t.facing),fy=Math.sin(t.facing);
  let best=null;
  for(const e of enemies){
    const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy);
    if(e.hp<=0||d>=t.range||immuneTo[e.kind]?.includes(t.type))continue;
    if(!mortar&&dx*fx+dy*fy<d*Math.SQRT1_2)continue;
    for(let i=0;i<grids.length;i++){
      const offset=i*.5,key=Math.floor(e.x/size+offset)+','+Math.floor(e.y/size+offset);
      let cell=grids[i].get(key);
      if(!cell){cell={count:0,x:0,y:0,vx:0,vy:0};grids[i].set(key,cell);}
      cell.count++;cell.x+=e.x;cell.y+=e.y;cell.vx+=e.vx;cell.vy+=e.vy;
      if(!best||cell.count>best.count||(cell.count===best.count&&cell.x>best.x))best=cell;
    }
  }
  if(!best)return null;
  const x=best.x/best.count,y=best.y/best.count;
  const flight=mortar?Math.hypot(x-t.x,y-t.y)/MORTAR_SPEED:0;
  const dx=x+best.vx/best.count*flight-t.x,dy=y+best.vy/best.count*flight-t.y;
  const scale=Math.min(1,t.range/(Math.hypot(dx,dy)||1));
  return {x:t.x+dx*scale,y:t.y+dy*scale};
}
const MORTAR_SPEED=470;
function selectTarget(t){
  if(t.type==='shotgun'||t.type==='mortar')return targetPack(t);
  const directional=!omnidirectional.includes(t.type);
  const fx=Math.cos(t.facing),fy=Math.sin(t.facing);
  let best=null,bestPriority=-1,bestScore=-Infinity;
  for(const e of enemies){
    const dx=e.x-t.x,dy=e.y-t.y,d2=dx*dx+dy*dy;
    if(e.hp<=0||d2>=t.range*t.range)continue;
    if(directional&&dx*fx+dy*fy<Math.sqrt(d2)*Math.SQRT1_2)continue;
    if((t.type==='solar'||t.type==='seeker')&&immuneTo[e.kind]?.includes(t.type))continue;
    if(e===t.locked)return e;
    const priority=Number((t.type==='cannon'&&t.brutePower&&e.kind==='brute')||
      (t.type==='gun'&&t.finishAt&&e.hp<=e.max*t.finishAt)||false);
    const score=t.type==='solar'?e.hp:e.x;
    if(priority>bestPriority||(priority===bestPriority&&score>bestScore)){
      best=e;bestPriority=priority;bestScore=score;
    }
  }
  return best;
}
function fire(t,target){
  const type=t.type;
  t.angle=Math.atan2(target.y-t.y,target.x-t.x);
  if(!['lightning','flame','pulse','venom','frost','prism'].includes(type))t.recoil=t.blast?2.8:1.4;
  if(t.focusStep){
    t.focus=t.locked===target?Math.min(t.focusMax,t.focus+t.focusStep):1;
    t.locked=target;
  }
  if(type==='minigun')t.spin=Math.min(1,t.spin+.08);
  if(type==='solar'){
    const damage=t.damage+Math.min(t.hpCap,target.max*t.hpShare);
    strike(target,{...t,damage});
    effects.push({solar:true,x:t.x,y:t.y,x2:target.x,y2:target.y,time:.22});
    // Reserve heat works even against a surviving brute. The HP bonus and
    // finisher apply once; a secondary body consumes its share of one budget.
    let heat=t.damage*t.reserve+Math.max(0,-target.hp);
    const nearby=enemies.filter(e=>e!==target&&e.hp>0&&!immuneTo[e.kind]?.includes(type)
      &&Math.hypot(e.x-target.x,e.y-target.y)<=t.sweepRadius&&Math.hypot(e.x-t.x,e.y-t.y)<=t.range);
    nearby.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
    let from=target;
    for(const e of nearby.slice(0,t.sweepCap)){
      if(heat<=0)break;
      const share=Math.min(heat,e.hp);
      strike(e,{type,damage:share,dot:t.dot,duration:t.duration});
      effects.push({solar:true,x:from.x,y:from.y,x2:e.x,y2:e.y,time:.16});
      heat-=share;from=e;
    }
    return;
  }
  if(type==='seeker'){
    const locks=enemies.filter(e=>e.hp>0&&!immuneTo[e.kind]?.includes(type)&&Math.hypot(e.x-t.x,e.y-t.y)<=t.range)
      .sort((a,b)=>b.x-a.x).slice(0,t.locks);
    for(const e of locks)for(let i=0;i<t.shots;i++){
      const angle=Math.atan2(e.y-t.y,e.x-t.x),offset=(i-(t.shots-1)/2)*7;
      projectiles.push({type,target:e,x:t.x-Math.sin(angle)*offset,y:t.y+Math.cos(angle)*offset,
        dx:Math.cos(angle),dy:Math.sin(angle),speed:t.missileSpeed,remaining:t.range*1.45,
        pierce:1,damage:t.damage,brutePower:t.brutePower});
    }
    return;
  }
  if(type==='flame'){
    const dx=Math.cos(t.angle),dy=Math.sin(t.angle);
    const contacts=[];
    for(const e of enemies){
      if(e.hp<=0)continue;
      const x=e.x-t.x,y=e.y-t.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);
      const radius=e.r+2+Math.max(0,along)*(t.jetSpread||.035);
      if(along<0||side>radius)continue;
      const entry=Math.max(0,along-Math.sqrt(radius*radius-side*side));
      if(entry<t.range)contacts.push({e,entry});
    }
    contacts.sort((a,b)=>a.entry-b.entry);
    const hits=contacts.slice(0,t.pierce);
    let heat=1;
    for(const {e} of hits){
      strike(e,{...t,damage:t.damage*heat,dot:t.dot*heat});
      heat*=t.heatRetention;
    }
    t.plumeLength=hits.length===t.pierce?Math.min(t.range,hits.at(-1).entry+9):t.range;
    t.plumeTime=t.rate+.045;
    return;
  }
  if(type==='prism'){
    const damage=t.damage*t.focus;
    strike(target,{type,damage});
    effects.push({prism:true,x:t.x,y:t.y,x2:target.x,y2:target.y,time:.13,color:types.prism.color});
    if(t.split){
      const nearby=enemies.filter(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=t.splitReach)
        .sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
      for(const e of nearby.slice(0,t.split)){
        strike(e,{type,damage:damage*t.splitPower});
        effects.push({prism:true,x:target.x,y:target.y,x2:e.x,y2:e.y,time:.1,color:'#c38ad4'});
      }
    }
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
  effects.push({x:t.x+Math.cos(t.angle)*14,y:t.y+Math.sin(t.angle)*14,flash:true,time:.08,color:'#ffe7a0'});
  const distance=t.blast?Math.hypot(target.x-t.x,target.y-t.y):t.range;
  const speed={disc:385,sniper:2100,cannon:1650,gun:1440,minigun:1440,shotgun:1320,mortar:MORTAR_SPEED,rocket:600}[type]||960;
  for(let i=0;i<t.shots;i++){
    const spread=t.shots>1?(i/(t.shots-1)-.5)*(type==='shotgun'?.68:type==='disc'?.28:0):0;
    const angle=t.angle+spread;
    const p={x:t.x,y:t.y,dx:Math.cos(angle),dy:Math.sin(angle),speed,remaining:distance,total:distance,
      damage:t.damage*(t.focus||1),type,pierce:t.pierce,lineGain:t.lineGain,closePower:t.closePower,brutePower:t.brutePower,
      finishAt:t.finishAt,finishPower:t.finishPower,residueCap:t.residueCap,residueRadius:t.residueRadius,residueSlow:t.residueSlow,ignoreArmor:t.ignoreArmor,radius:t.blast,areaCap:t.areaCap,slow:t.slow,stun:t.stun,
      push:t.push,dot:t.dot,duration:t.duration,hit:[]};
    if(type==='disc'){p.passLimit=t.pierce;p.returnPower=t.returnPower;}
    projectiles.push(p);
  }
}
function advanceProjectile(p,travel){
  let distance=Math.min(travel,p.remaining),startX=p.x,startY=p.y;
  const hits=[];
  const endX=startX+p.dx*distance,endY=startY+p.dy*distance;
  const xmin=Math.min(startX,endX),xmax=Math.max(startX,endX),ymin=Math.min(startY,endY),ymax=Math.max(startY,endY);
  if(p.type!=='mortar'&&p.pierce>0)for(const e of enemies){
    if(e.hp<=0||e.x+e.r<xmin||e.x-e.r>xmax||e.y+e.r<ymin||e.y-e.r>ymax||p.hit.includes(e))continue;
    const along=(e.x-startX)*p.dx+(e.y-startY)*p.dy,side=Math.abs((e.x-startX)*p.dy-(e.y-startY)*p.dx);
    if(side>e.r||along+e.r<0)continue;
    const entry=Math.max(0,along-Math.sqrt(e.r*e.r-side*side));
    if(entry<=distance)hits.push({e,entry});
  }
  hits.sort((a,b)=>a.entry-b.entry);
  for(const {e,entry} of hits){
    if(p.type==='rocket'){distance=entry;p.pierce=0;break;}
    const close=p.closePower&&p.total-p.remaining+entry<=65?p.closePower:1;
    strike(e,{...p,damage:p.damage*close*(1+p.hit.length*(p.lineGain||0))});
    if(p.residueCap&&!immuneTo[e.kind]?.includes(p.type)){
      const nearby=enemies.filter(o=>o!==e&&o.hp>0&&!immuneTo[o.kind]?.includes(p.type)&&Math.hypot(o.x-e.x,o.y-e.y)<=p.residueRadius)
        .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));
      for(const other of nearby.slice(0,p.residueCap)){
        const dot=other.poison>0&&other.poisonDamage>p.dot*.5?0:p.dot*.5;
        strike(other,{type:p.type,damage:0,slow:p.residueSlow,dot,duration:p.duration});
      }
      effects.push({x:e.x,y:e.y,r:p.residueRadius,time:.24,color:types[p.type].color});
    }
    p.hit.push(e);
    if(--p.pierce<=0){if(p.type!=='disc')distance=entry;break;}
  }
  p.x+=p.dx*distance;p.y+=p.dy*distance;p.remaining-=distance;if((p.type==='rocket'||p.type==='mortar')&&(p.pierce<=0||p.remaining<=0)){areaStrike(p,p.x,p.y,p.radius);effects.push({x:p.x,y:p.y,r:p.radius,time:.25,color:'#f6a357'})}
}
function moveProjectiles(dt){
 for(const p of projectiles){
   const travel=p.speed*dt,outward=p.remaining;
   if(p.type==='seeker'){
     if(p.target.hp<=0){
       const options=enemies.filter(e=>e.hp>0&&!immuneTo[e.kind]?.includes(p.type)&&Math.hypot(e.x-p.x,e.y-p.y)<p.remaining);
       p.target=options.reduce((nearest,e)=>!nearest||Math.hypot(e.x-p.x,e.y-p.y)<Math.hypot(nearest.x-p.x,nearest.y-p.y)?e:nearest,null);
       if(!p.target){p.remaining=0;continue;}
     }
     const e=p.target;
     const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),step=Math.min(travel,p.remaining);
     if(d-e.r<=step){
       strike(e,p);p.remaining=0;
       effects.push({x:e.x,y:e.y,r:10,time:.18,color:types.seeker.color});
     }else{
       p.dx=dx/d;p.dy=dy/d;p.x+=step*p.dx;p.y+=step*p.dy;p.remaining-=step;
     }
     continue;
   }
   advanceProjectile(p,travel);
   if(p.type==='disc'&&!p.returning&&p.remaining<=0){
     p.returning=true;p.dx=-p.dx;p.dy=-p.dy;p.remaining=p.total;
     p.hit=[];p.pierce=p.passLimit;p.damage*=p.returnPower;
     if(travel>outward)advanceProjectile(p,travel-outward);
   }
 }
 projectiles=projectiles.filter(p=>p.remaining>0&&(p.pierce>0||p.type==='disc'));
}
function update(dt){if(!started||over)return;if(running)spawnPack(dt,sandboxRun?.custom?5:wave);let breached=false;for(let e of enemies){
 e.pulseRecovery=Math.max(0,(e.pulseRecovery||0)-dt);e.stun-=dt;if(e.poison>0){e.hp-=e.poisonDamage*dt;e.poison-=dt}e.slow=(e.slow||0)-dt;
 let progress=soldiers.length?flowProgress(e.x,e.y):0,defender=null,closest=110;
 for(let soldier of soldiers){let d=Math.hypot(soldier.x-e.x,soldier.y-e.y);if(soldier.hp>0&&d<closest&&flowProgress(soldier.x,soldier.y)<=progress-5&&roadIsClear(e,soldier)){defender=soldier;closest=d}}
 let inMelee=defender&&closest<e.r+10;
 if(inMelee&&e.stun<=0){e.attack=(e.attack||0)-dt;if(e.attack<=0){defender.hp-=e.body.melee;e.attack=.7}}
 const speed=e.speed*(e.slow>0?.55:1);
 if(e.stun>0||inMelee){e.vx*=Math.exp(-5*dt);e.vy*=Math.exp(-5*dt);}else{
  // Between forks zombies coast downhill, sliding and spreading on contact.
  let ax=1,ay=0;
  if(defender){ax=(defender.x-e.x)/closest;ay=(defender.y-e.y)/closest;}
  const turn=defender?null:forkDirection(e);
  if(turn){ax=turn.x;ay=turn.y;}
  const acceleration=speed*(defender||turn?2.7:.62);
  const drag=1+dt*acceleration*Math.hypot(e.vx,e.vy)/(speed*speed);
  e.vx=(e.vx+dt*acceleration*ax)/drag;
  e.vy=(e.vy+dt*acceleration*ay)/drag;
 }
 e.x+=e.vx*dt;e.y+=e.vy*dt;keepOnRoad(e,defender||e.stun>0?0:speed);
 if(Math.hypot(e.vx,e.vy)>1)e.angle=Math.atan2(e.vy,e.vx);
 if(e.hp>0&&e.x>exitGate.x-20){e.escaped=true;if(sandboxRun)sandboxRun.breached++;health=Math.max(0,health-e.body.breach);e.hp=0;if(health<=0){health=0;over=true;running=false;document.querySelector('#defeat').hidden=false}breached=true}
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
for(let t of towers){if(t===aiming)continue;t.cool-=dt;if(t.recoil)t.recoil=Math.max(0,t.recoil-24*dt);if(t.plumeTime>0)t.plumeTime-=dt;if(t.type==='barracks'){if(running&&t.cool<=0&&soldiers.filter(a=>a.home===t).length<t.cap){let rally=nearestRoad(t.x,t.y),dx=t.x-rally.x,dy=t.y-rally.y,d=Math.hypot(dx,dy)||1;soldiers.push({home:t,x:rally.x+dx/d*12,y:rally.y+dy/d*12,hp:t.soldierHp,maxHp:t.soldierHp,cool:0,rally});t.cool=t.rate;if(selected===t)ui()}continue}
 if(t.cool>0){
   if(t.locked&&(t.locked.hp<=0||Math.hypot(t.locked.x-t.x,t.locked.y-t.y)>t.range)){t.locked=null;t.focus=1;}
   continue;
 }
 const target=selectTarget(t);
 if(t.type==='minigun'&&!target)t.spin=Math.max(0,t.spin-dt*1.5);
 if(t.focusStep&&target!==t.locked){t.locked=null;t.focus=1;}
 if(target&&t.cool<=0){fire(t,target);t.cool=t.rate*(t.spin?1-.72*t.spin:1)}}for(let a of soldiers){a.cool-=dt;if(a.hp>0&&a.home.regen)a.hp=Math.min(a.maxHp,a.hp+a.home.regen*dt);let target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-a.home.x,e.y-a.home.y)<a.home.range+60).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];if(target){let dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);a.angle=Math.atan2(dy,dx);if(d>85){a.x+=dx/d*45*dt;a.y+=dy/d*45*dt}else if(a.cool<=0){projectiles.push({x:a.x,y:a.y,dx:dx/d,dy:dy/d,speed:1200,remaining:100,damage:a.home.damage,type:'soldier',pierce:1,hit:[]});a.cool=a.home.rifleRate}}else{let dx=a.rally.x-a.x,dy=a.rally.y-a.y,d=Math.hypot(dx,dy);if(d>5){a.x+=dx/d*40*dt;a.y+=dy/d*40*dt}}}let previousSoldierCount=soldiers.length;soldiers=soldiers.filter(a=>a.hp>0);if(selected&&selected.type==='barracks'&&soldiers.length!==previousSoldierCount)ui();for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++){let a=soldiers[i],b=soldiers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16){if(d<.01){dx=1;dy=0;d=1}let shift=(16-d)/2;a.x-=dx/d*shift;a.y-=dy/d*shift;b.x+=dx/d*shift;b.y+=dy/d*shift}}
 moveProjectiles(dt);
 const dead=enemies.filter(e=>e.hp<=0&&!e.escaped);
 if(dead.length){
   if(sandboxRun)sandboxRun.defeated+=dead.length;
   money+=dead.reduce((sum,e)=>sum+e.body.bounty,0);ui();
 }
 enemies=enemies.filter(e=>e.hp>0);
 effects.forEach(e=>e.time-=dt);effects=effects.filter(e=>e.time>0);
 if(running&&!waveQueue.length&&!enemies.length){
   if(sandbox){finishTest(false);return;}
   running=false;soldiers=[];money+=45+wave*7;
   status.textContent='Wave cleared · supplies delivered';ui();
 }
}
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
      ctx.beginPath(); ctx.arc(t.x,t.y,TOWER_RADIUS*2,0,Math.PI*2);
      ctx.fillStyle='#bd483b55'; ctx.fill();
    }
    const valid=canPlace(mouse);
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,types[building].range,0,Math.PI*2);
    ctx.strokeStyle='#f5f1d68c'; ctx.lineWidth=1; ctx.stroke();
    ctx.globalAlpha=.66;
    ctx.drawImage(foundations[overWater(mouse.x,mouse.y)?1:0],mouse.x-TOWER_SPRITE/2,mouse.y-TOWER_SPRITE/2,TOWER_SPRITE,TOWER_SPRITE);
    ctx.drawImage(heads[building],mouse.x-TOWER_SPRITE/2,mouse.y-TOWER_SPRITE/2,TOWER_SPRITE,TOWER_SPRITE);
    ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,TOWER_RADIUS,0,Math.PI*2);
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
    ctx.drawImage(foundations[t.wet?1:0],t.x-TOWER_SPRITE/2,t.y-TOWER_SPRITE/2,TOWER_SPRITE,TOWER_SPRITE);
    drawUnit(t.head||heads[t.type],t,-TOWER_SPRITE/2-(t.recoil||0),-TOWER_SPRITE/2,TOWER_SPRITE,TOWER_SPRITE);
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
  for(const t of towers)if(t.plumeTime>0)FieldArt.flameJet(ctx,t,simulationTime);
  for(const p of projectiles) FieldArt.round(ctx,p);
  for(const e of effects) FieldArt.effect(ctx,e);
  if(over){
    ctx.fillStyle='#102326c9'; ctx.fillRect(0,0,activeMap.width,activeMap.height);
  }
}
const landscape = document.querySelector('#landscape');
FieldArt.landscape(landscape);
window.addEventListener('resize', () => { if (!started) FieldArt.landscape(landscape); });
const speedButton=document.querySelector('#speed');
const speeds=[1,2,4];
let speedIndex=0,simulationTime=0,last=performance.now();
speedButton.onclick=()=>{
  speedIndex=(speedIndex+1)%speeds.length;
  const speed=speeds[speedIndex],next=speeds[(speedIndex+1)%speeds.length];
  speedButton.textContent='Speed '+speed+'×';
  speedButton.title='Switch to '+next+'× speed';
  speedButton.setAttribute('aria-label','Game speed '+speed+'×. '+speedButton.title+'.');
  speedButton.classList.toggle('fast',speed>1);
};
function loop(now){
  const dt=Math.max(0,Math.min(.05,(now-last)/1000));
  last=now;
  // Fast forward with normal-sized physics steps so bullets and bodies still collide.
  if(started&&!over){
    for(let step=0;step<speeds[speedIndex]&&!over;step++){
      simulationTime+=dt;
      update(dt);
    }
  }
  draw();
  requestAnimationFrame(loop);
}
ui();requestAnimationFrame(loop);

const mapSelect=document.querySelector('#mapSelect');
for(const [key,map] of Object.entries(maps))mapSelect.add(new Option(map.name,key));
function previewZone(){
  const map=maps[mapSelect.value];
  document.querySelector('#mapSummary').textContent=map.briefing;
  document.querySelector('#mapEconomy').textContent=map.startingSupplies+' starting supplies · '+waveSize(1,map)+' zombies in wave 1';
  document.querySelector('#mapProfile').textContent=map.size+' · '+map.paths.length+(map.links?.length?' linked approaches':map.paths.length===1?' route':' routes');
  const diagram=document.querySelector('#mapDiagram'),g=diagram.getContext('2d');
  g.clearRect(0,0,diagram.width,diagram.height);
  const scale=Math.min((diagram.width-18)/map.width,(diagram.height-12)/map.height);
  g.save();g.translate((diagram.width-map.width*scale)/2,(diagram.height-map.height*scale)/2);g.scale(scale,scale);
  g.fillStyle=map.accent;g.fill(FieldArt.roadOutline(map.segments));
  const [x,y]=map.paths[0].at(-1);
  g.fillStyle='#ffad73';g.beginPath();g.arc(x,y,6/scale,0,Math.PI*2);g.fill();g.restore();
}
mapSelect.addEventListener('change',previewZone);
previewZone();
function deploy(practice){
  sandbox=practice;
  buildRoutes(maps[mapSelect.value]);
  money=practice?Infinity:activeMap.startingSupplies;health=practice?Infinity:20;ui();
  waterShape=FieldArt.waterways(activeMap);
  const scale=Math.min(2,3072/activeMap.width);
  canvas.width=Math.round(activeMap.width*scale);canvas.height=Math.round(activeMap.height*scale);
  ctx.setTransform(canvas.width/activeMap.width,0,0,canvas.height/activeMap.height,0,0);
  document.documentElement.style.setProperty('--map-ratio',activeMap.width/activeMap.height);
  canvas.setAttribute('aria-label',activeMap.name+' battlefield');
  flowField=buildFlowField();mapArt=makeMap();placementOverlay=makePlacementOverlay();
  started=true;document.querySelector('#menu').hidden=true;last=performance.now();
  if(practice)openLab();
}
document.querySelector('#play').onclick=()=>deploy(false);
document.querySelector('#practice').onclick=()=>deploy(true);
