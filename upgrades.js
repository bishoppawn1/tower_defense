// Multipliers stack across tracks. Other fields set a tower-specific capability.
const tierCosts = [25, 55, 180, 400];
const upgrades = {
  gun: [
    [['Rapid feed · 12% shorter reload',{reload:.88}],['Heavy rounds · +15% damage',{power:1.15}],['Double tap · fires two rounds',{shots:2}],['Suppressive fire · three rounds that slow for 2s',{shots:3,slow:2}]],
    [['Tracer · hits two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Armor breaker · bypasses armor and adds 35% damage',{ignoreArmor:true,power:1.35}],['Belt fed · hits five targets with a 25% shorter reload',{pierce:5,reload:.75}]]
  ],
  sniper: [
    [['Hard tips · hits three targets',{pierce:3}],['High caliber · +20% damage',{power:1.2}],['Rail shot · hits seven targets',{pierce:7}],['Shockwave · +65% damage and a 3s slow',{power:1.65,slow:3}]],
    [['Concussion · stuns for 0.25s',{stun:.25}],['Spotter · +15% range',{reach:1.15}],['Quick chamber · 35% shorter reload',{reload:.65}],['Crippling shot · stuns for 1.4s and bypasses armor',{stun:1.4,ignoreArmor:true}]]
  ],
  shotgun: [
    [['Wide load · nine pellets',{shots:9}],['Buckshot · +15% damage',{power:1.15}],['Drum magazine · 35% shorter reload',{reload:.65}],['Storm shot · seventeen pellets in the same cone',{shots:17}]],
    [['Choke · +15% range',{reach:1.15}],['Heavy pellets · +15% damage',{power:1.15}],['Shrapnel · each pellet hits three targets',{pierce:3}],['Stopping power · +50% damage and a 2s slow',{power:1.5,slow:2}]]
  ],
  rocket: [
    [['Blast charge · blast radius 39',{blast:39}],['Heavy warhead · +15% damage',{power:1.15}],['Fragmentation · radius 47 and +25% damage',{blast:47,power:1.25}],['Siege warhead · double impact damage',{power:2}]],
    [['Concussion · slows for 0.8s',{slow:.8}],['Accelerator · 15% shorter reload',{reload:.85}],['Incendiary · burns for 6 damage/s for 4s',{dot:6,duration:4}],['Firestorm · burns for 12 damage/s for 6s',{dot:12,duration:6}]]
  ],
  lightning: [
    [['Capacitor · 12% shorter recharge',{reload:.88}],['High voltage · +15% damage',{power:1.15}],['Arc relay · 50% longer jumps',{jump:135}],['Overcharge · double arc damage',{power:2}]],
    [['Conductor · chains to five',{chains:5}],['Static field · stuns for 0.65s',{stun:.65}],['Storm relay · chains to ten',{chains:10}],['Lockdown · stuns the chain for 1.5s',{stun:1.5}]]
  ],
  barracks: [
    [['Drill · 12% shorter rifle reload',{rifleReload:.88}],['Field training · +20% rifle damage',{power:1.2}],['Rapid deployment · halves recruitment time',{reload:.5}],['Veterans · double rifle damage and 25% shorter reload',{power:2,rifleReload:.75}]],
    [['Reinforcements · squad cap five',{cap:5}],['Combat armor · recruits have 56 health',{soldierHp:56}],['Reserve squad · squad cap seven',{cap:7}],['Field hospital · recruits have 100 health and heal 4 HP/s',{soldierHp:100,regen:4}]]
  ],
  flame: [
    [['Pressure valve · 12% shorter reload',{reload:.88}],['Hot fuel · +15% impact damage',{power:1.15}],['Flashover · adds 3s of burn',{extraDuration:3}],['Inferno · doubles impact and adds 8 burn damage/s',{power:2,extraDot:8}]],
    [['Wildfire · adds 1s of burn',{extraDuration:1}],['Long nozzle · +15% range',{reach:1.15}],['Fuel mix · adds 6 burn damage/s',{extraDot:6}],['Firestorm · flame passes through four zombies',{pierce:4}]]
  ],
  frost: [
    [['Deep freeze · 3s slow',{slow:3}],['Cold snap · +15% damage',{power:1.15}],['Cryogenic · 7s slow and +35% damage',{slow:7,power:1.35}],['Absolute zero · freezes targets for 1s',{stun:1}]],
    [['Shatter · +20% damage',{power:1.2}],['Long hose · +15% range',{reach:1.15}],['Ice shards · hits three targets',{pierce:3}],['Blizzard · halves reload time',{reload:.5}]]
  ],
  cannon: [
    [['Belt feed · 12% shorter reload',{reload:.88}],['Heavy shell · +15% damage',{power:1.15}],['Rapid loader · 35% shorter reload',{reload:.65}],['Siege cannon · doubles shell damage',{power:2}]],
    [['Sabot · pierces two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Tungsten · ignores armor and +40% damage',{ignoreArmor:true,power:1.4}],['Rail shell · pierces six targets',{pierce:6}]]
  ],
  venom: [
    [['Concentrate · adds 1 poison damage/s',{extraDot:1}],['Corrosive · +20% impact damage',{power:1.2}],['Toxic load · adds 4 poison damage/s and 2s duration',{extraDot:4,extraDuration:2}],['Potent toxin · adds 12 poison damage/s',{extraDot:12}]],
    [['Contagion · adds 1s of poison',{extraDuration:1}],['Long nozzle · +15% range',{reach:1.15}],['Twin nozzle · hits three targets',{pierce:3}],['Lingering toxin · adds 6s duration and 4 poison damage/s',{extraDuration:6,extraDot:4}]]
  ],
  minigun: [
    [['High speed · 12% shorter reload',{reload:.88}],['Reinforced rounds · +15% damage',{power:1.15}],['Rotary feed · 35% shorter reload',{reload:.65}],['Overdrive · doubles shot damage',{power:2}]],
    [['Tracer · hits two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Heavy rounds · +55% damage',{power:1.55}],['Depleted cores · bypass armor and hit five targets',{ignoreArmor:true,pierce:5}]]
  ],
  mortar: [
    [['Wider shells · blast radius 40',{blast:40}],['Heavy shells · +20% damage',{power:1.2}],['Barrage · 35% shorter reload',{reload:.65}],['Siege shells · radius 60 and +70% damage',{blast:60,power:1.7}]],
    [['Long tube · +15% range',{reach:1.15}],['Concussion · slows for 1.5s',{slow:1.5}],['Pressure wave · pushes blast survivors',{push:105}],['Flashbang · stuns the blast zone for 2s',{stun:2}]]
  ],
  pulse: [
    [['Amplifier · +15% damage',{power:1.15}],['Quick charge · 15% shorter recharge',{reload:.85}],['Overload · +60% damage',{power:1.6}],['Cascade · halves recharge time',{reload:.5}]],
    [['Broad field · +15% range',{reach:1.15}],['Disruptor · 0.35s stun',{stun:.35}],['Repulsor · doubles knockback',{push:120}],['Static field · stuns for 1.3s and slows for 3s',{stun:1.3,slow:3}]]
  ]
};

const towerDefaults = {
  sniper:{pierce:2}, shotgun:{shots:7}, rocket:{blast:35}, mortar:{blast:35},
  lightning:{chains:4,jump:90,stun:.5}, pulse:{push:60},
  frost:{slow:2}, flame:{duration:2,dot:4}, venom:{duration:2,dot:4},
  barracks:{damage:4,rifleRate:.8,cap:3,soldierHp:45,regen:0}
};
function createTower(type,x,y){
  const spec=types[type];
  return {type,x,y,range:spec.range,damage:spec.damage,rate:spec.rate,cool:0,angle:0,facing:0,
    spent:spec.cost,upgrades:[0,0],ranks:{damage:0,speed:0,range:0},
    shots:1,pierce:1,stun:0,slow:0,push:0,dot:0,duration:0,...towerDefaults[type]};
}
function applyTier(t,changes){
  const {power=1,reload=1,reach=1,rifleReload=1,extraDot=0,extraDuration=0,...settings}=changes;
  t.damage*=power;t.rate*=reload;t.range*=reach;
  t.dot+=extraDot;t.duration+=extraDuration;
  if(t.type==='barracks')t.rifleRate*=rifleReload;
  if(settings.cap)t.cool=0;
  Object.assign(t,settings);
}
const tuning={damage:.04,speed:.03,range:.02};
function fullyUpgraded(t){return t.upgrades.every(level=>level===4);}
function tuningCost(t){return 20+15*Object.values(t.ranks).reduce((a,b)=>a+b,0);}
function tune(t,stat){
  // Linear gains relative to the finished tower, independent of purchase order.
  const rank=t.ranks[stat]++,step=tuning[stat];
  const factor=(1+(rank+1)*step)/(1+rank*step);
  if(stat==='damage')t.damage*=factor;
  if(stat==='range')t.range*=factor;
  if(stat==='speed'){
    if(t.type==='barracks')t.rifleRate/=factor;
    else t.rate/=factor;
  }
}
