// Points are world units, ordered west to east. Shared stretches use identical
// coordinates so road art, crowd movement, and building all see the same fork.
const maps = {
  meadow: {
    name: 'Clover Meadow', setting: 'Meadow', size: 'Compact', width: 820, height: 480,
    briefing: 'Start here. One winding road brings every walker past the central bend.',
    widths: [110, 160, 58, 46, 162, 120, 48, 84],
    paths: [[[-30,190],[125,190],[220,215],[330,298],[440,322],[555,297],[695,220],[786,220]]],
    landmarks: []
  },
  forest: {
    name: 'Blackpine Hollow', setting: 'Forest', size: 'Mid-size', width: 980, height: 680,
    briefing: 'A short ridge trail and a sweeping forest road meet at the eastern clearing.',
    widths: [124, 154, 64, 44, 128, 86, 54, 84],
    paths: [
      [[-30,400],[158,400],[290,296],[442,178],[602,158],[722,226],[842,296],[946,296]],
      [[-30,400],[158,400],[326,435],[460,526],[592,508],[706,390],[842,296],[946,296]]
    ],
    landmarks: []
  },
  quarry: {
    name: 'Redstone Quarry', setting: 'Quarry', size: 'Wide', width: 1180, height: 570,
    briefing: 'Three haul roads fan around the excavation. The middle cut is the fastest approach.',
    widths: [118, 158, 74, 44, 104, 50, 126, 84],
    paths: [
      [[-30,292],[160,292],[315,180],[480,95],[655,92],[825,150],[1000,266],[1146,266]],
      [[-30,292],[160,292],[335,265],[485,245],[643,265],[824,305],[1000,266],[1146,266]],
      [[-30,292],[160,292],[322,399],[480,475],[666,470],[865,384],[1000,266],[1146,266]]
    ],
    landmarks: [[570,170,68,25],[515,362,108,35],[691,385,45,23],[935,80,78,31],[174,485,94,36]]
  },
  town: {
    name: 'Bellwether Ruins', setting: 'Ruined town', size: 'Large', width: 1160, height: 820,
    briefing: 'Four streets leave the old market. Build in the vacant lots or guard the eastern junction.',
    widths: [116, 144, 66, 46, 96, 58, 110, 54, 84, 84],
    paths: [
      [[-30,450],[120,450],[245,425],[312,197],[502,155],[686,163],[805,243],[985,294],[1126,294]],
      [[-30,450],[120,450],[245,425],[385,328],[523,380],[636,389],[733,292],[805,243],[985,294],[1126,294]],
      [[-30,450],[120,450],[267,530],[396,555],[523,452],[636,389],[750,447],[854,415],[985,294],[1126,294]],
      [[-30,450],[120,450],[267,530],[391,689],[607,673],[755,591],[854,415],[985,294],[1126,294]]
    ],
    landmarks: [[107,155,45,31],[207,182,33,25],[448,257,20,15],[621,235,41,28],
      [353,449,36,18],[443,423,26,18],[558,556,49,34],[675,510,28,22],[813,345,24,16],
      [962,163,53,33],[1032,560,54,33],[218,703,41,31],[716,751,47,25],[965,699,58,33]]

  },
  marsh: {
    name: 'Saltmarsh Delta', setting: 'Wetlands', size: 'Expansive', width: 1450, height: 750,
    briefing: 'Two causeways split again around tidal pools. Four narrow crossings return to a single levee.',
    widths: [126, 170, 90, 58, 42, 126, 64, 48, 128, 84],
    paths: [
      [[-30,378],[183,378],[342,294],[464,228],[657,111],[802,97],[977,216],[1112,285],[1274,378],[1416,378]],
      [[-30,378],[183,378],[342,294],[464,228],[641,274],[798,300],[977,216],[1112,285],[1274,378],[1416,378]],
      [[-30,378],[183,378],[348,457],[514,518],[694,443],[826,426],[1032,520],[1148,459],[1274,378],[1416,378]],
      [[-30,378],[183,378],[348,457],[514,518],[682,619],[828,646],[1032,520],[1148,459],[1274,378],[1416,378]]
    ],
    landmarks: [[745,190,70,30],[750,535,82,32],[619,370,103,34],[208,142,100,38],
      [173,570,96,43],[1150,125,105,45],[1241,599,85,39],[945,349,60,25]]
  }
};

// Crossings are playable roads. Both endpoints occur on existing approaches.
// A bend may contain extra points, but travel always progresses eastward.
maps.forest.links=[
  [54,[[290,296],[348,323],[397,385],[460,526]]]
];
maps.quarry.links=[
  [50,[[315,180],[380,188],[432,220],[485,245]]],
  [50,[[643,265],[714,310],[774,368],[865,384]]]
];
maps.town.links=[
  [48,[[312,197],[365,233],[418,302],[523,380]]],
  [48,[[502,155],[527,226],[558,285],[636,389]]],
  [53,[[396,555],[426,602],[518,642],[607,673]]]
];
maps.marsh.links=[
  [59,[[342,294],[394,315],[429,385],[463,459],[514,518]]],
  [53,[[641,274],[696,332],[753,382],[826,426]]],
  [57,[[826,426],[899,382],[951,321],[1025,280],[1112,285]]]
];
maps.forest.briefing='A creek-side trail crosses from the pine ridge into the hollow. The junction commands both valleys.';
maps.quarry.briefing='Three haul roads change levels on two cutting ramps. Pits protect the shortcuts from one side.';
maps.town.briefing='Market streets meet narrow alleys between bombed-out blocks. The central square covers several crossings.';
maps.marsh.briefing='Raised trails cross the tidal basin in both directions. Build on the pools to cover the boardwalks.';

// Give the later fronts distinct physical scales, including room between streets
// for tower clusters. Ranges, unit sizes and road widths stay in world units.
function expandZone(map,sx,sy){
  const point=([x,y])=>[Math.round(x*sx),Math.round(y*sy)];
  map.width=Math.round(map.width*sx);map.height=Math.round(map.height*sy);
  map.paths=map.paths.map(path=>path.map(point));
  map.links=map.links.map(([w,path])=>[w,path.map(point)]);
  map.landmarks=map.landmarks.map(([x,y,rx,ry])=>[...point([x,y]),Math.round(rx*sx),Math.round(ry*sy)]);
}
expandZone(maps.town,1.22,1.10);
expandZone(maps.marsh,1.23,1.13);
maps.marsh.landmarks.push([519,144,128,51],[1044,797,142,33]);

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
    const minSpans=exits.map(({a,b})=>34*Math.hypot(1,(b.y-a.y)/(b.x-a.x)));
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
  map.roads=[...edges.values()];
  map.segments=map.roads.flatMap(road=>road.points.slice(1).map((b,i)=>{
    const a=road.points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    return {a,b,length,ux:dx/length,uy:dy/length,r0:a.width/2,r1:b.width/2};
  }));
  map.entry=nodeAt(map.paths[0][0]);
  map.exit=nodeAt(map.paths[0].at(-1));
}
Object.values(maps).forEach(prepareRoads);
