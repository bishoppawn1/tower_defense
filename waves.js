// Walkers and their resistant variants all share one unmodified movement speed.
const walkerBody={speed:51,radius:7,health:1,melee:8,breach:1,bounty:5};
const enemyBodies={
  runner:{speed:97,radius:6.5,health:.72,melee:6,breach:1,bounty:6},
  brute:{speed:33,radius:13,health:9,melee:24,breach:5,bounty:30}
};
// Health belongs to the tier and body. Wave number only selects a roster.
const enemyTiers=[
  {hp:16}, {hp:40,feature:'One pale shoulder'}, {hp:90,feature:'Two copper shoulder plates'},
  {hp:200,feature:'Twin golden horns'}, {hp:450,feature:'A crown of violet spines'}
];
const tierWaves=[
  {from:1,shares:[100]},
  {from:5,shares:[75,25]},
  {from:10,shares:[48,36,16]},
  {from:16,shares:[30,30,25,15]},
  {from:24,shares:[20,20,25,20,15]}
];
function shuffle(items){
  for(let i=items.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [items[i],items[j]]=[items[j],items[i]];
  }
  return items;
}
function tierRoster(number,count){
  const {shares}=tierWaves.findLast(stage=>number>=stage.from);
  const ranks=[];
  let percent=0;
  shares.forEach((share,i)=>{
    percent+=share;
    const end=Math.round(count*percent/100);
    while(ranks.length<end)ranks.push(i+1);
  });
  return shuffle(ranks);
}
function waveSize(number,map){
  const base=number<=3?[28,62,104][number-1]:160+(number-4)*38;
  return Math.round(base*map.hordeScale);
}
function waveRoster(number,map){
  const count=waveSize(number,map);
  const brutes=number<4?0:Math.max(1,Math.floor(count/50));
  const runners=number<3?0:Math.floor(count*.12);
  const variants=['armor','shock','fire','cold','toxic','blast'].filter((_,i)=>number>=3+i*2);
  const special=variants.length?Math.floor(count*.21):0;
  const mobile=Array(count-brutes-runners-special).fill('normal').concat(Array(runners).fill('runner'));
  for(let i=0;i<special;i++)mobile.push(variants[i%variants.length]);
  shuffle(mobile);
  // Space heavy encounters apart, even on very late waves.
  for(let i=0;i<brutes;i++)mobile.splice(Math.floor((i+.70)*count/brutes),0,'brute');
  const tiers=tierRoster(number,count);
  return mobile.map((kind,i)=>({kind,tier:tiers[i]}));
}
// Subtract the cross-sections of occupied collision circles from the entrance.
function freeSpawnY(x,top,bottom,radius){
  let gaps=[[top+radius+2,bottom-radius-2]];
  for(const e of enemies){
    if(e.hp<=0)continue;
    const dx=x-e.x,clearance=radius+e.r+1;
    if(Math.abs(dx)>=clearance)continue;
    const side=Math.sqrt(clearance*clearance-dx*dx);
    const lo=e.y-side,hi=e.y+side;
    gaps=gaps.flatMap(([a,b])=>[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([l,r])=>r>l));
    if(!gaps.length)return null;
  }
  const open=gaps.reduce((sum,[a,b])=>sum+b-a,0);
  if(open<=0)return null;
  let pick=Math.random()*open;
  for(const [a,b] of gaps){
    if(pick<b-a)return a+pick;
    pick-=b-a;
  }
  return null;
}
function spawnPack(dt){
  if(!waveQueue.length)return;
  spawn-=dt;
  if(spawn>0)return;
  const entry=activeMap.entry,x=entry.x+20;
  const points=entry.outgoing[0].points;
  const i=points.findIndex(p=>p.x>=x),a=points[i-1],b=points[i];
  const t=(x-a.x)/(b.x-a.x);
  const center=a.y+(b.y-a.y)*t,width=a.width+(b.width-a.width)*t;
  let made=0;
  while(waveQueue.length){
    const {kind,tier}=waveQueue.at(-1),body=enemyBodies[kind]||walkerBody;
    const y=freeSpawnY(x,center-width/2,center+width/2,body.radius);
    if(y===null)break;
    const hp=Math.round(enemyTiers[tier-1].hp*body.health);
    enemies.push({x,y,vx:body.speed*.8,vy:0,bias:Math.random()<.5?-1:1,
      r:body.radius,hp,max:hp,kind,tier,speed:body.speed,stun:0,pulseRecovery:0,body});
    announce(kind);
    if(tier>1){
      const rank=enemyTiers[tier-1];
      announce('tier-'+tier,'Tier '+tier+' spotted · '+rank.feature+' · '+rank.hp+' walker HP.');
    }
    waveQueue.pop();made++;
  }
  spawn=made?made*(wave===1?.22:wave<5?.085:.034)/activeMap.hordeScale:.04;
}
