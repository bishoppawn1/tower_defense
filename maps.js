// Coordinates and road diameters are in world units. Reused knots are junctions.
const maps={
  orchard:{
    name:'Lantern Orchard',setting:'Orchard',size:'Compact',width:1500,height:920,
    startingSupplies:350,hordeScale:1,accent:'#e2b566',
    briefing:'One carriage road climbs through the pear trees, then drops into the packing yard. The inside of the crest covers two bends.',
    widths:[178,207,115,92,120,138,200,103,115,98],
    paths:[[[-35,655],[175,655],[345,567],[507,344],[668,245],[847,257],[992,409],[1142,527],[1304,510],[1462,445]]],
    links:[],landmarks:[]
  },
  glacier:{
    name:'Glasswater Shelf',setting:'Glacier',size:'Tall',width:1830,height:1230,
    startingSupplies:425,hordeScale:1.15,accent:'#a3d9ee',
    briefing:'Both trails start on the southern shore. Hold the long climb together or cover the ice shelf and the far bank separately.',
    widths:[210,220,110,185,164,106,96,145,184,105],
    paths:[
      [[-35,958],[204,958],[417,815],[667,614],[822,413],[1050,247],[1290,227],[1493,353],[1660,486],[1792,498]],
      [[-35,958],[204,958],[417,815],[667,614],[900,665],[1090,755],[1296,736],[1482,613],[1660,486],[1792,498]]
    ],
    links:[],water:[[1210,492,297,126],[154,315,240,106],[1630,1020,215,83]],landmarks:[]
  },
  kilns:{
    name:'Cinderlock Foundry',setting:'Foundry',size:'Wide',width:2410,height:1090,
    startingSupplies:500,hordeScale:1.30,accent:'#ee9a65',
    briefing:'Two slag runs squeeze through one furnace throat. Beyond it, three casting aisles fan out. The throat is the best shared firing position.',
    widths:[224,246,123,113,233,252,123,99,161,115],
    paths:[
      [[-35,378],[219,378],[449,214],[670,272],[892,523],[1142,580],[1410,350],[1708,213],[2036,355],[2372,550]],
      [[-35,378],[219,378],[459,568],[679,669],[892,523],[1142,580],[1426,581],[1715,550],[2044,530],[2372,550]],
      [[-35,378],[219,378],[459,568],[679,669],[892,523],[1142,580],[1433,785],[1720,869],[2053,776],[2372,550]]
    ],
    links:[],landmarks:[[526,406,68,39],[857,174,66,46],[1260,919,81,59],[1682,381,68,41],[1815,700,71,38],[2153,940,65,45]]
  },
  freight:{
    name:'Midnight Switchyard',setting:'Freight',size:'Large',width:2460,height:1490,
    startingSupplies:600,hordeScale:1.45,accent:'#95cbda',landmarkShape:'box',
    briefing:'Four sidings leave the signal house together. The northern pair merge early. A transfer track feeds the southern line before the final platform.',
    widths:[260,323,167,97,115,169,132,151,121],
    paths:[
      [[-35,717],[249,717],[538,409],[809,224],[1084,206],[1363,365],[1650,407],[2044,609],[2422,735]],
      [[-35,717],[249,717],[557,593],[818,486],[1100,460],[1363,365],[1650,407],[2044,609],[2422,735]],
      [[-35,717],[249,717],[563,826],[845,808],[1132,773],[1434,798],[1714,865],[2044,609],[2422,735]],
      [[-35,717],[249,717],[537,1024],[817,1193],[1100,1251],[1412,1188],[1733,1060],[2055,929],[2422,735]]
    ],
    links:[[94,[[1132,773],[1252,911],[1358,1063],[1412,1188]]]],
    landmarks:[[817,353,52,21],[990,636,98,38],[731,1002,51,30],[1208,1020,40,20],[1640,602,99,37],[1700,1290,74,31],[2009,293,87,38]]
  },
  atoll:{
    name:'Beacon Atoll',setting:'Atoll',size:'Expansive',width:3040,height:1700,
    startingSupplies:700,hordeScale:1.6,accent:'#74d6bc',
    briefing:'The high causeway runs straight to the beacon. The southern convoy splits into three island crossings. Pontoons can defend from the lagoons.',
    widths:[256,281,167,227,121,106,148,142,172,115],
    paths:[
      [[-35,569],[287,569],[583,393],[887,287],[1218,224],[1542,260],[1865,346],[2200,439],[2615,521],[3002,623]],
      [[-35,569],[287,569],[586,740],[881,900],[1183,738],[1528,624],[1842,624],[2192,718],[2615,521],[3002,623]],
      [[-35,569],[287,569],[586,740],[881,900],[1186,966],[1523,1013],[1856,1006],[2195,1157],[2613,908],[3002,623]],
      [[-35,569],[287,569],[586,740],[881,900],[1167,1198],[1476,1372],[1842,1407],[2195,1157],[2613,908],[3002,623]]
    ],
    links:[[100,[[1218,224],[1357,355],[1451,490],[1528,624]]],[104,[[1842,624],[2015,712],[2190,853],[2372,900],[2613,908]]]],
    islands:[[45,574,409,326],[761,325,324,186],[1499,219,374,156],[2312,380,311,218],[857,956,310,268],[1597,883,382,233],[1877,1356,304,153],[2319,988,272,207],[3028,672,379,319],[280,1616,224,150]],
    landmarks:[]
  }
};

function prepareRoads(map){
  const nodes=new Map(),edges=new Map();
  function nodeAt([x,y]){
    const key=x+','+y;
    if(!nodes.has(key))nodes.set(key,{x,y,incoming:[],outgoing:[]});
    return nodes.get(key);
  }
  // Widths are diameters at knots. The curved reaches taper between them.
  function road(points,widths){
    points.slice(1).forEach((p,i)=>{
      const a=nodeAt(points[i]),b=nodeAt(p),key=[a.x,a.y,b.x,b.y].join(',');
      a.width??=widths[i];b.width??=widths[i+1];
      if(edges.has(key))return;
      const edge={a,b};
      a.outgoing.push(edge);b.incoming.push(edge);edges.set(key,edge);
    });
  }
  for(const path of map.paths)road(path,map.widths);
  for(const [width,path] of map.links||[])road(path,path.map((_,i)=>i===0||i===path.length-1?width+12:width-10));
  function tangent(node,edge){
    if(node.incoming.length===1 && node.outgoing.length===1){
      const prev=node.incoming[0].a,next=node.outgoing[0].b;
      return (next.y-prev.y)/(next.x-prev.x);
    }
    return (edge.b.y-edge.a.y)/(edge.b.x-edge.a.x);
  }
  // At a junction the upstream bank opening is physically divided between
  // the outlets. A single continuous ribbon has no round end caps to trap
  // bodies in pockets when a broad basin tapers into a steep passage.
  for(const node of nodes.values()){
    const reach=node.incoming[0]||node.outgoing[0];
    const grade=(reach.b.y-reach.a.y)/(reach.b.x-reach.a.x);
    node.span=node.width*Math.hypot(1,grade);
    if(node.outgoing.length<2)continue;
    const exits=node.outgoing.slice().sort((l,r)=>(l.b.y-node.y)/(l.b.x-node.x)-(r.b.y-node.y)/(r.b.x-node.x));
    // Each outlet must pass even a brute across its narrowest diagonal.
    const minSpans=exits.map(({a,b})=>58*Math.hypot(1,(b.y-a.y)/(b.x-a.x)));
    let reserved=minSpans.reduce((sum,w)=>sum+w,0);
    node.span=Math.max(node.span,reserved);
    const offset=-.43*grade/Math.hypot(.4,grade);
    let top=-node.span/2;
    exits.forEach((edge,i)=>{
      reserved-=minSpans[i];
      const split=((i+1)/exits.length-.5+offset)*node.span;
      const bottom=i===exits.length-1?node.span/2:Math.min(node.span/2-reserved,Math.max(top+minSpans[i],split));
      edge.mouthOffset=(top+bottom)/2;edge.mouthSpan=bottom-top;top=bottom;
    });
  }
  for(const edge of edges.values()){
    const {a,b}=edge,dx=b.x-a.x,dy=b.y-a.y,m0=tangent(a,edge)*dx,m1=tangent(b,edge)*dx;
    const n=Math.max(2,Math.ceil(Math.hypot(dx,dy)/16));
    const mouth=edge.mouthOffset||0,startSpan=edge.mouthSpan||a.span;
    edge.points=[];
    for(let j=0;j<=n;j++){
      const t=j/n,u=1-t,blend=t*t*(3-2*t);
      const y=a.y+dy*blend+m0*t*u*u-m1*t*t*u+mouth*(1-blend);
      edge.points.push({x:a.x+t*dx,y,width:startSpan+(b.span-startSpan)*blend});
    }
  }
  map.forks=[...nodes.values()].filter(node=>node.outgoing.length>1);
  map.roads=[...edges.values()];
  map.segments=map.roads.flatMap(road=>road.points.slice(1).map((b,i)=>{
    const a=road.points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    return {a,b,length,ux:dx/length,uy:dy/length,r0:a.width/2,r1:b.width/2};
  }));
  map.entry=nodeAt(map.paths[0][0]);
  map.exit=nodeAt(map.paths[0].at(-1));
}
Object.values(maps).forEach(prepareRoads);
