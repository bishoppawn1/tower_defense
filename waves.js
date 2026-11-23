// Walkers and their resistant variants all share one unmodified movement speed.
const walkerBody={speed:46,radius:9,health:1,melee:8,breach:1,bounty:4,stride:7};
const enemyBodies={
  runner:{speed:88,radius:8,health:.72,melee:6,breach:1,bounty:5,stride:12},
  brute:{speed:30,radius:16,health:9,melee:24,breach:5,bounty:24,stride:4.5}
};
function waveRoster(number){
  const count=number<=3?[14,24,36][number-1]:48+(number-4)*12;
  const brutes=number<4?0:Math.max(1,Math.floor(count/50));
  const runners=number<3?0:Math.floor(count*.12);
  const variants=['armor','shock','fire','cold','toxic'].filter((_,i)=>number>=3+i*2);
  const special=variants.length?Math.floor(count*.21):0;
  const mobile=Array(count-brutes-runners-special).fill('normal').concat(Array(runners).fill('runner'));
  for(let i=0;i<special;i++)mobile.push(variants[i%variants.length]);
  for(let i=mobile.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [mobile[i],mobile[j]]=[mobile[j],mobile[i]];
  }
  // Space heavy encounters apart, even on very late waves.
  for(let i=0;i<brutes;i++)mobile.splice(Math.floor((i+.70)*count/brutes),0,'brute');
  return mobile;
}
function spawnPack(dt){
  if(!waveQueue.length)return;
  spawn-=dt;
  if(spawn>0)return;
  const entry=activeMap.entry;
  const lanes=[entry.y-28,entry.y,entry.y+28];
  const pack=wave===1?1:wave<5?2:3;
  let made=0;
  while(made<pack && waveQueue.length){
    const kind=waveQueue[waveQueue.length-1],body=enemyBodies[kind]||walkerBody;
    const open=lanes.filter(y=>enemies.every(e=>Math.hypot(e.x+20,e.y-y)>=e.r+body.radius+1));
    if(!open.length)break;
    const y=open[Math.floor(Math.random()*open.length)];
    const hp=(wave===1?16:20+wave*5)*body.health;
    enemies.push({x:-20,y,vx:body.speed,vy:0,bias:Math.random()<.5?-1:1,
      r:body.radius,hp,max:hp,kind,speed:body.speed,stun:0,phase:Math.random()*6,body});
    announce(kind);waveQueue.pop();made++;
  }
  spawn=made===pack?(wave===1?.68:wave<5?.66:.46):.08;
}
