// Dimensions, road diameters and landmark footprints are authored in world units.
// Identical knots join roads. Each link starts and ends on a main route.
const maps={
  meadow:{
    name:'Clover Meadow',setting:'Meadow',size:'Compact',width:1540,height:840,
    startingSupplies:350,hordeScale:1,
    briefing:'A floodplain curls around a grassy bluff. Cover both bends from its inside bank.',
    widths:[200,255,125,94,185,265,146,89,138,108],
    paths:[[[-35,270],[180,270],[370,352],[550,524],[730,590],[920,535],[1100,355],[1240,265],[1380,256],[1502,256]]],
    links:[],landmarks:[]
  },
  forest:{
    name:'Blackpine Hollow',setting:'Forest',size:'Mid-size',width:1850,height:1110,
    startingSupplies:425,hordeScale:1.15,
    briefing:'The creek divides around two long wooded islands. The saddle between them covers both crossings.',
    widths:[235,254,135,115,198,220,108,140,182,110],
    paths:[
      [[-35,564],[226,564],[463,346],[680,286],[905,486],[1040,492],[1250,302],[1460,327],[1640,468],[1812,468]],
      [[-35,564],[226,564],[475,690],[700,738],[905,486],[1040,492],[1280,660],[1480,672],[1640,468],[1812,468]]
    ],
    links:[[86,[[463,346],[525,444],[606,582],[700,738]]]],landmarks:[]
  },
  quarry:{
    name:'Redstone Quarry',setting:'Quarry',size:'Wide',width:2220,height:1090,
    startingSupplies:500,hordeScale:1.3,
    briefing:'Three haul roads fan out around the cuts. Build on the long benches or cover the diagonal ramps.',
    widths:[265,290,126,100,176,116,158,230,120],
    paths:[
      [[-35,554],[270,554],[555,277],[844,192],[1160,270],[1450,224],[1730,311],[1930,485],[2182,485]],
      [[-35,554],[270,554],[550,540],[870,570],[1150,557],[1460,493],[1735,484],[1930,485],[2182,485]],
      [[-35,554],[270,554],[580,786],[885,885],[1180,817],[1485,862],[1725,724],[1930,485],[2182,485]]
    ],
    links:[[86,[[555,277],[655,354],[770,473],[870,570]]],[90,[[1150,557],[1250,653],[1350,762],[1485,862]]]],
    landmarks:[[900,360,90,35],[855,735,88,31],[1330,1000,120,32],[340,908,68,30],[1610,91,94,26]]
  },
  town:{
    name:'Bellwether Ruins',setting:'Ruined town',size:'Large',width:2480,height:1460,
    startingSupplies:600,hordeScale:1.45,
    briefing:'Four avenues surround the market blocks. Two inner streets meet at a square and split again near the station.',
    widths:[240,258,155,116,110,156,176,126,195,118],
    paths:[
      [[-35,735],[235,735],[480,533],[748,280],[1060,261],[1380,303],[1660,367],[1950,456],[2190,625],[2442,625]],
      [[-35,735],[235,735],[480,533],[765,495],[1065,560],[1370,685],[1690,561],[1950,456],[2190,625],[2442,625]],
      [[-35,735],[235,735],[492,894],[765,851],[1060,813],[1370,685],[1660,794],[1900,842],[2190,625],[2442,625]],
      [[-35,735],[235,735],[492,894],[755,1122],[1075,1192],[1410,1110],[1665,1035],[1900,842],[2190,625],[2442,625]]
    ],
    links:[[84,[[748,280],[870,358],[977,455],[1065,560]]],[80,[[765,851],[882,950],[975,1051],[1075,1192]]],[90,[[1380,303],[1485,382],[1588,476],[1690,561]]]],
    landmarks:[[287,206,65,40],[510,216,59,28],[1070,395,28,18],[1270,426,46,30],[840,680,82,28],[536,720,53,34],[1110,997,49,35],[1430,919,52,27],[1819,664,51,36],[2080,220,79,52],[2170,1040,63,48],[684,1320,68,43]]
  },
  marsh:{
    name:'Saltmarsh Delta',setting:'Wetlands',size:'Expansive',width:3040,height:1580,
    startingSupplies:700,hordeScale:1.6,
    briefing:'Four tidal channels cut around reed islands. Guard the upstream fords or group pontoons where the channels meet.',
    widths:[278,310,185,145,103,190,132,118,192,125],
    paths:[
      [[-35,760],[310,760],[635,521],[930,332],[1240,252],[1550,290],[1875,365],[2180,461],[2640,755],[3002,755]],
      [[-35,760],[310,760],[635,521],[940,602],[1235,652],[1550,630],[1860,594],[2180,461],[2640,755],[3002,755]],
      [[-35,760],[310,760],[645,967],[945,893],[1240,858],[1555,930],[1880,890],[2240,875],[2640,755],[3002,755]],
      [[-35,760],[310,760],[645,967],[925,1187],[1245,1292],[1560,1260],[1905,1165],[2240,875],[2640,755],[3002,755]]
    ],
    links:[[100,[[940,602],[1045,682],[1130,776],[1240,858]]],[92,[[1555,930],[1660,835],[1760,710],[1860,594]]],[98,[[1875,365],[1980,484],[2090,675],[2240,875]]]],
    landmarks:[[865,780,100,42],[1270,450,144,56],[1580,1075,110,46],[2155,1090,102,44],[895,1370,190,61],[2380,294,170,64],[520,300,153,48],[2700,1180,189,62]]
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
