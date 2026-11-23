// Multipliers stack across tracks. Other fields set a tower-specific capability.
const tierCosts = [25, 55, 180, 400, 3600];
const upgrades = {
  gun: [
    [['Rapid feed · 12% shorter reload',{reload:.88}],['Heavy rounds · +15% damage',{power:1.15}],['Double tap · fires two rounds',{shots:2}],['Suppressive fire · three rounds that slow for 2s',{shots:3,slow:2}],['Hammer battery · six rounds per burst and double damage',{shots:6,power:2}]],
    [['Tracer · hits two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Armor breaker · bypasses armor and adds 35% damage',{ignoreArmor:true,power:1.35}],['Belt fed · hits five targets with a 25% shorter reload',{pierce:5,reload:.75}],['Manticore belt · hits 18 targets at triple fire rate',{pierce:18,reload:1/3}]]
  ],
  sniper: [
    [['Hard tips · hits three targets',{pierce:3}],['High caliber · +20% damage',{power:1.2}],['Rail shot · hits seven targets',{pierce:7}],['Shockwave · +65% damage and a 3s slow',{power:1.65,slow:3}],['Horizon rail · twelvefold damage, pierces 24 targets',{power:12,pierce:24}]],
    [['Concussion · stuns for 0.25s',{stun:.25}],['Spotter · +15% range',{reach:1.15}],['Quick chamber · 35% shorter reload',{reload:.65}],['Crippling shot · stuns for 1.4s and bypasses armor',{stun:1.4,ignoreArmor:true}],['Deadeye array · double range, quadruple fire rate',{reach:2,reload:.25}]]
  ],
  shotgun: [
    [['Wide load · nine pellets',{shots:9}],['Buckshot · +15% damage',{power:1.15}],['Drum magazine · 35% shorter reload',{reload:.65}],['Storm shot · seventeen pellets in the same cone',{shots:17}],['Wall of lead · 35 pellets, each deals triple damage',{shots:35,power:3}]],
    [['Choke · +15% range',{reach:1.15}],['Heavy pellets · +15% damage',{power:1.15}],['Shrapnel · each pellet hits three targets',{pierce:3}],['Stopping power · +50% damage and a 2s slow',{power:1.5,slow:2}],['Breach cannon · pellets pierce 12 and stun for 2s',{pierce:12,stun:2}]]
  ],
  rocket: [
    [['Blast charge · blast radius 32',{blast:32}],['Heavy warhead · +15% damage',{power:1.15}],['Fragmentation · radius 38, six targets and +25% damage',{blast:38,areaCap:6,power:1.25}],['Siege warhead · double impact damage',{power:2}],['Caldera · radius 65, ten targets and fivefold impact damage',{blast:65,areaCap:10,power:5}]],
    [['Concussion · slows for 0.8s',{slow:.8}],['Accelerator · 15% shorter reload',{reload:.85}],['Incendiary · burns for 6 damage/s for 4s',{dot:6,duration:4}],['Firestorm · burns for 12 damage/s for 6s',{dot:12,duration:6}],['Sunburn · blast burns for 100 damage/s for 12s',{dot:100,duration:12}]]
  ],
  lightning: [
    [['Capacitor · 12% shorter recharge',{reload:.88}],['High voltage · +15% damage',{power:1.15}],['Arc relay · 50% longer jumps',{jump:135}],['Overcharge · double arc damage',{power:2}],['Thunderhead · sixfold arc damage and jumps up to 240 units',{power:6,jump:240}]],
    [['Conductor · chains to five',{chains:5}],['Static field · stuns for 0.65s',{stun:.65}],['Storm relay · chains to ten',{chains:10}],['Lockdown · stuns the chain for 1.5s',{stun:1.5}],['Blackout grid · chains to 32 zombies and stuns for 4s',{chains:32,stun:4}]]
  ],
  barracks: [
    [['Drill · 12% shorter rifle reload',{rifleReload:.88}],['Field training · +20% rifle damage',{power:1.2}],['Rapid deployment · halves recruitment time',{reload:.5}],['Veterans · double rifle damage and 25% shorter reload',{power:2,rifleReload:.75}],['Shock company · rifles deal fivefold damage at double fire rate',{power:5,rifleReload:.5}]],
    [['Reinforcements · squad cap five',{cap:5}],['Combat armor · recruits have 56 health',{soldierHp:56}],['Reserve squad · squad cap seven',{cap:7}],['Field hospital · recruits have 100 health and heal 4 HP/s',{soldierHp:100,regen:4}],['Citadel · 16 troops, 450 recruit health and 20 HP/s healing',{cap:16,soldierHp:450,regen:20}]]
  ],
  flame: [
    [['Pressure valve · 12% shorter reload',{reload:.88}],['Hot fuel · +15% impact damage',{power:1.15}],['Flashover · adds 3s of burn',{extraDuration:3}],['Inferno · doubles impact and adds 8 burn damage/s',{power:2,extraDot:8}],['Solar furnace · sixfold impact and +60 burn damage/s',{power:6,extraDot:60}]],
    [['Wildfire · adds 1s of burn',{extraDuration:1}],['Long nozzle · +15% range',{reach:1.15}],['Fuel mix · adds 6 burn damage/s',{extraDot:6}],['Firestorm · hits six zombies, retains 60% heat per hit',{pierce:6,heatRetention:.6}],['Fire corridor · triple range, 18 targets, retains 70% heat per hit',{reach:3,pierce:18,heatRetention:.7}]]
  ],
  frost: [
    [['Deep freeze · 3s slow',{slow:3}],['Cold snap · +15% damage',{power:1.15}],['Cryogenic · 7s slow and +35% damage',{slow:7,power:1.35}],['Absolute zero · freezes targets for 1s',{stun:1}],['Deep winter · freezes for 5s and deals fivefold damage',{stun:5,power:5}]],
    [['Shatter · +20% damage',{power:1.2}],['Long hose · +15% range',{reach:1.15}],['Ice shards · hits three targets',{pierce:3}],['Blizzard · halves reload time',{reload:.5}],['Whiteout · fourfold fire rate, shards pierce 16',{reload:.25,pierce:16}]]
  ],
  cannon: [
    [['Belt feed · 12% shorter reload',{reload:.88}],['Heavy shell · +15% damage',{power:1.15}],['Rapid loader · 35% shorter reload',{reload:.65}],['Siege cannon · doubles shell damage',{power:2}],['Dreadnought · eightfold shell damage and double fire rate',{power:8,reload:.5}]],
    [['Sabot · pierces two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Tungsten · ignores armor and +40% damage',{ignoreArmor:true,power:1.4}],['Rail shell · pierces six targets',{pierce:6}],['Mass driver · shells pierce 24 with double range and 3s stun',{pierce:24,reach:2,stun:3}]]
  ],
  venom: [
    [['Concentrate · adds 1 poison damage/s',{extraDot:1}],['Corrosive · +20% impact damage',{power:1.2}],['Toxic load · adds 4 poison damage/s and 2s duration',{extraDot:4,extraDuration:2}],['Potent toxin · adds 12 poison damage/s',{extraDot:12}],['Black bloom · +100 poison damage/s and +5s duration',{extraDot:100,extraDuration:5}]],
    [['Contagion · adds 1s of poison',{extraDuration:1}],['Long nozzle · +15% range',{reach:1.15}],['Twin nozzle · hits three targets',{pierce:3}],['Lingering toxin · adds 6s duration and 4 poison damage/s',{extraDuration:6,extraDot:4}],['Plague front · shots pierce 20 with double range and +30 poison damage/s',{pierce:20,reach:2,extraDot:30}]]
  ],
  minigun: [
    [['High speed · 12% shorter reload',{reload:.88}],['Reinforced rounds · +15% damage',{power:1.15}],['Rotary feed · 35% shorter reload',{reload:.65}],['Overdrive · doubles shot damage',{power:2}],['Cyclone · quad rounds at double fire rate',{shots:4,reload:.5}]],
    [['Tracer · hits two targets',{pierce:2}],['Long barrel · +15% range',{reach:1.15}],['Heavy rounds · +55% damage',{power:1.55}],['Depleted cores · bypass armor and hit five targets',{ignoreArmor:true,pierce:5}],['Needle storm · rounds pierce 20 and deal quadruple damage',{pierce:20,power:4}]]
  ],
  mortar: [
    [['Wider shells · blast radius 37',{blast:37}],['Heavy shells · +20% damage',{power:1.2}],['Barrage · 35% shorter reload',{reload:.65}],['Siege shells · radius 46, eight targets and +70% damage',{blast:46,areaCap:8,power:1.7}],['Earthbreaker · radius 76, twelve targets and fivefold shell damage',{blast:76,areaCap:12,power:5}]],
    [['Long tube · +15% range',{reach:1.15}],['Concussion · slows for 1.5s',{slow:1.5}],['Pressure wave · pushes blast survivors',{push:105}],['Flashbang · stuns the blast zone for 2s',{stun:2}],['Aftershock · 5s area stun and triple fire rate',{stun:5,reload:1/3}]]
  ],
  disc: [
    [['Honed edge · +20% damage',{power:1.2}],['Wider blade · hits four targets per pass',{pierce:4}],['Serrations · slows cut targets for 1s',{slow:1}],['Mill wheel · seven targets per pass and +60% damage',{pierce:7,power:1.6}],['Harvest wheel · eighteen targets per pass and quadruple damage',{pierce:18,power:4}]],
    [['Tighter spool · 15% shorter reload',{reload:.85}],['Long throw · +20% range',{reach:1.2}],['Backspin · return cuts deal double damage',{returnPower:2}],['Counterweight · +25% range and 35% shorter reload',{reach:1.25,reload:.65}],['Reaper clutch · sixfold return damage and double fire rate',{returnPower:6,reload:.5}]]
  ],
  prism: [
    [['Cut glass · +15% beam damage',{power:1.15}],['Focal mount · faster buildup per repeated hit',{focusStep:.5}],['Ruby core · focus can reach fourfold damage',{focusMax:4}],['Annealed core · +60% damage and faster focus',{power:1.6,focusStep:.85}],['Solar lens · twelvefold focus ceiling and double fire rate',{focusMax:12,reload:.5}]],
    [['Optical bench · +15% range',{reach:1.15}],['Quick shutter · 15% shorter pulse interval',{reload:.85}],['Beam splitter · one nearby enemy takes half beam damage',{split:1}],['Diffraction fan · two secondary targets within 80 units',{split:2,splitReach:80}],['Aurora array · six secondary targets take full beam damage',{split:6,splitPower:1}]]
  ],
  pulse: [
    [['Amplifier · +15% damage',{power:1.15}],['Quick charge · 15% shorter recharge',{reload:.85}],['Overload · +60% damage',{power:1.6}],['Cascade · halves recharge time',{reload:.5}],['Resonance engine · fivefold damage and double pulse rate',{power:5,reload:.5}]],
    [['Broad field · +15% range, hits six targets',{reach:1.15,areaCap:6}],['Disruptor · 10% chance to stun for 0.45s',{stunChance:.10,stun:.45}],['Repulsor · stronger shove',{push:48}],['Static field · 12% stun for 0.65s and a brief slow',{stunChance:.12,stun:.65,slow:.75}],['Exclusion field · double radius, ten targets, stronger shove, 15% stun for 1s',{reach:2,areaCap:10,push:65,stunChance:.15,stun:1}]]
  ]
};

const trackNames={
  gun:['Burst battery','Ballistic feed'],sniper:['Rail assembly','Targeting array'],
  shotgun:['Drum magazine','Breach shells'],rocket:['Siege payload','Incendiary fuel'],
  lightning:['Arc generator','Relay grid'],barracks:['Rifle company','Garrison'],
  flame:['Combustion chamber','Projector nozzle'],frost:['Cold core','Shard array'],
  cannon:['Siege battery','Penetrator rail'],venom:['Toxin vat','Dispersal rig'],
  minigun:['Rotary drive','Core ammunition'],mortar:['Bombardment','Shock shells'],
  disc:['Cutting wheel','Return drive'],prism:['Focus lens','Splitter optics'],
  pulse:['Resonator','Repulsor field']
};
const towerDefaults = {
  disc:{pierce:3,returnPower:1},prism:{focus:1,focusStep:.3,focusMax:2.2,split:0,splitReach:55,splitPower:.5},
  sniper:{pierce:2}, shotgun:{shots:7}, rocket:{blast:27,areaCap:4}, mortar:{blast:32,areaCap:5},
  lightning:{chains:4,jump:90,stun:.5}, pulse:{areaCap:5,push:35,stun:.25,stunChance:.08},
  frost:{slow:2}, flame:{duration:2,dot:4,pierce:3,heatRetention:.5}, venom:{duration:2,dot:4},
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
function tuningCost(t){return 20+15*Object.values(t.ranks).reduce((a,b)=>a+b,0);}
function tune(t,stat){
  // Use a ratio of successive ranks so later chain multipliers commute with tuning.
  const rank=t.ranks[stat]++,step=tuning[stat];
  const factor=(1+(rank+1)*step)/(1+rank*step);
  if(stat==='damage')t.damage*=factor;
  if(stat==='range')t.range*=factor;
  if(stat==='speed'){
    if(t.type==='barracks')t.rifleRate/=factor;
    else t.rate/=factor;
  }
}
