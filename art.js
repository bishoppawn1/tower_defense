// The artwork uses world coordinates. Only the cached canvases know their resolution.
const FieldArt = (() => {
  const tau = Math.PI * 2;
  const ink = '#253839';
  function surface(w, h, scale = 3) {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const g = canvas.getContext('2d');
    g.scale(scale, scale);
    g.lineJoin = g.lineCap = 'round';
    return {canvas, g};
  }
  function seeded(seed) {
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  function gradient(g, x, y, endX, endY, ...colors) {
    const grad = g.createLinearGradient(x, y, endX, endY);
    colors.forEach((color, i) => grad.addColorStop(i / (colors.length - 1), color));
    return grad;
  }
  function oval(g, x, y, rx, ry, color, angle = 0) {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, angle, 0, tau);
    g.fill();
  }
  function shape(g, points, color, outline) {
    g.beginPath();
    points.forEach(([x,y], i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
    g.closePath();
    g.fillStyle = color;
    g.fill();
    if (outline) { g.strokeStyle = outline; g.lineWidth = 0.8; g.stroke(); }
  }
  function line(g, points, color, width) {
    g.beginPath();
    points.forEach(([x,y], i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
    g.strokeStyle = color; g.lineWidth = width; g.stroke();
  }
  function box(g, x, y, w, h, r, color) {
    g.fillStyle = color; g.beginPath(); g.roundRect(x,y,w,h,r); g.fill();
  }
  function pine(g, x, y, height, color, light, lean = 0) {
    g.save(); g.translate(x,y); g.scale(height,height); g.rotate(lean);
    const points = [[0,-1],[.065,-.78],[.042,-.79],[.14,-.61],[.087,-.63],[.20,-.44],[.12,-.46],[.25,-.24],[.16,-.26],[.29,-.10],[.037,-.15],[.025,0],[-.025,0],[-.04,-.14],[-.28,-.09],[-.17,-.25],[-.235,-.22],[-.12,-.48],[-.18,-.45],[-.077,-.67],[-.116,-.64],[-.035,-.82],[-.055,-.80]];
    shape(g, points, color);
    if (light) shape(g, [[0,-1],[-.035,-.71],[-.09,-.62],[-.035,-.64],[-.145,-.44],[-.075,-.47],[-.19,-.25],[-.085,-.29],[-.26,-.11],[-.07,-.16],[.03,-.38],[0,-.36],[.045,-.54],[.01,-.52],[.038,-.72],[.015,-.70]], light);
    g.restore();
  }
  function landscape(canvas) {
    const {width,height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    const g = canvas.getContext('2d');
    // Anchor the lookout on the right even on narrow screens.
    const zoom = Math.max(canvas.width/1500, canvas.height/850);
    g.setTransform(zoom,0,0,zoom,(canvas.width-1500*zoom)*.78,(canvas.height-850*zoom)*.5);
    g.fillStyle=gradient(g,0,0,0,690,'#517880','#9baba0','#efbc8c','#edac78'); g.fillRect(0,0,1500,850);
    const random=seeded(771);
    const sun=g.createRadialGradient(1085,276,65,1085,276,236);
    sun.addColorStop(0,'#ffe4ae77');sun.addColorStop(1,'#ffe4ae00');
    oval(g,1085,276,236,236,sun); oval(g,1085,276,70,70,'#ffe5b4');
    for(let i=0;i<68;i++){
      const x=random()*1540, y=50+random()*310, w=18+random()*155;
      oval(g,x,y,w,1+random()*2.3,'#ffe2b427',-.012);
    }
    function ridge(y,amp,frequency,color,trees){
      const crest=x=>y+amp*(Math.sin(x*frequency)+.48*Math.sin(x*.015+y)+.24*Math.sin(x*.034));
      const points=[];
      for(let x=-10;x<=1510;x+=5) points.push([x,crest(x)]);
      shape(g,[...points,[1510,850],[-10,850]],color);
      if(trees)for(let x=0;x<1500;x+=trees*.31){const h=trees*(.45+random()*.7);pine(g,x,crest(x)+3,h,color);}
    }
    ridge(365,58,.006,'#a6a797',0);ridge(430,79,.005,'#83968b',0);
    ridge(482,63,.006,'#637f77',9);ridge(553,65,.008,'#476b65',16);
    // A river picks up the last light below the ridge.
    g.fillStyle=gradient(g,0,520,0,850,'#c2b79a','#829b8e','#526e68');
    g.beginPath();g.moveTo(743,510);g.bezierCurveTo(1140,548,563,548,829,593);g.bezierCurveTo(1145,648,580,700,720,852);g.lineTo(255,852);g.bezierCurveTo(420,685,1020,656,772,601);g.bezierCurveTo(544,551,1050,544,743,510);g.fill();
    ridge(685,70,.0045,'#30534f',27);
    // Signal lookout: open truss, glazed cabin, roof-mounted antenna.
    g.save();g.translate(1178,565);
    const steel='#263f3d',edge='#587169';
    for(const x of [-40,39])line(g,[[x*.58,-77],[x,48]],steel,7);
    for(let k=0;k<3;k++){const y=-70+k*37,w=25+k*4;line(g,[[-w,y],[w+4,y+37]],edge,3);line(g,[[w,y],[-w-4,y+37]],steel,4);}
    box(g,-45,-90,88,10,2,steel);shape(g,[[-33,-123],[29,-123],[29,-91],[-33,-91]],steel);
    for(let i=0;i<4;i++)box(g,-28+i*14,-118,11,19,1,i<2?'#edc58b':'#adac85');
    shape(g,[[-43,-121],[-28,-138],[22,-138],[43,-121]],'#283f3c');line(g,[[-28,-138],[22,-138],[43,-121]],edge,2);
    line(g,[[4,-138],[4,-177]],steel,2.5);line(g,[[-8,-157],[17,-157]],steel,2);
    oval(g,4,-178,8,8,'#ffad652c');oval(g,4,-178,2.8,2.8,'#ffb86d');
    line(g,[[-47,-91],[-47,-102],[40,-102],[40,-91]],steel,2);g.restore();
    for(let i=0;i<120;i++){
      const x=950+random()*570, base=612+(x-1178)*.18+Math.sin(x*.012)*12+random()*62;
      pine(g,x,base,18+random()*46,'#345751');
    }
    ridge(770,76,.0042,'#233f3d',37);
    for(let i=0;i<40;i++){const x=i<20?random()*400:1315+random()*210;pine(g,x,855+random()*12,65+random()*155,'#172f30','#25413d');}
    for(let i=0;i<9;i++){const x=1010+random()*126,y=167+random()*30;line(g,[[x-4,y-1],[x,y+1.4],[x+3,y-2]],'#586b62',1);}
  }
  const terrainColors = {
    Orchard:{ground:['#8a994f','#aeb470','#788b58'],road:['#bf925f','#e9c990','#c6a472'],edge:'#8d8255'},
    Glacier:{ground:['#8fabb8','#b2cad0','#7e9eac'],road:['#cddde1','#e1e9e6','#c4d2d8'],edge:'#829ba8'},
    Foundry:{ground:['#68564f','#936b52','#4f5350'],road:['#ac8e75','#ccac89','#b99a83'],edge:'#705f50'},
    Freight:{ground:['#364551','#52616b','#394951'],road:['#777675','#9a9282','#777979'],edge:'#64757c'},
    Atoll:{ground:['#88a785','#b8bd8a','#689b82'],road:['#d6ba8b','#eadab0','#c6b186'],edge:'#968d74'}

  };
  function ruins(g,x,y,rx,ry,random){
    g.save();g.translate(x,y);g.scale(random()>.5?1:-1,random()>.5?1:-1);
    box(g,-rx+3,-ry+5,rx*2,ry*2,2,'#3243405e');
    box(g,-rx,-ry,rx*2,ry*2,2,'#9b9c8a');
    box(g,-rx+4,-ry+4,rx*2-8,ry*2-8,1,'#5c6360');
    // The surviving outer walls cast shadows into the exposed rooms.
    for(const [x1,y1,x2,y2] of [[-rx,ry,-rx,-ry],[-rx,-ry,rx*.60,-ry],[rx,-ry*.45,rx,ry],[-rx,ry,-rx*.15,ry],[rx*.3,ry,rx,ry],[2,-ry,2,ry*.35]]){
      line(g,[[x1+2,y1+3],[x2+2,y2+3]],'#414848',5);
      line(g,[[x1,y1],[x2,y2]],'#bcaa91',4);
    }
    shape(g,[[-rx+2,-ry+2],[-3,-ry+2],[-4,-ry*.4],[-rx*.42,0],[-rx*.38,-ry*.24],[-rx+2,ry*.16]],'#925f50');
    for(let k=-rx+7;k<-5;k+=6)line(g,[[k,-ry+4],[k,-ry*.45]],'#be8a70',1);
    for(let i=0;i<10;i++){
      const tx=(random()-.5)*rx*1.5,ty=(random()-.5)*ry*1.4;
      shape(g,[[tx-2,ty+2],[tx,ty-1],[tx+4,ty],[tx+1,ty+3]],i%2?'#8e897a':'#a8a492');
    }
    g.restore();
  }
  function depot(g,x,y,rx,ry,variant,random){
    // Fractured brick station, collapsed warehouse and terraced houses.
    if(variant%4===0){ruins(g,x,y,rx,ry,random);return;}
    g.save();g.translate(x,y);
    const w=rx*2,h=ry*2;
    box(g,-rx+3,-ry+6,w,h,3,'#29382e68');
    box(g,-rx,-ry,w,h,2,'#98998a');
    box(g,-rx+3,-ry+3,w-6,h-6,2,'#525957');
    if(variant%4===1){
      // Three party walls persist after the roof of the last house has fallen.
      for(let i=0;i<3;i++){
        const lx=-rx+i*w/3+3,sw=w/3-5;
        if(i<2){
          shape(g,[[lx,-ry+4],[lx+sw,-ry+4],[lx+sw-3,0],[lx+3,0]],i?'#8c6354':'#ae7e63');
          shape(g,[[lx+3,0],[lx+sw-3,0],[lx+sw,ry-5],[lx,ry-5]],i?'#624f47':'#796252');
          line(g,[[lx+3,0],[lx+sw-3,0]],'#d0a484',1);
          box(g,lx+4,-ry*.55,4,7,1,'#594d45');
        }else line(g,[[lx,ry-5],[lx,-ry+4],[lx+sw,-ry+4]],'#b8a58d',3);
      }
    }else if(variant%4===2){
      // A sawtooth shed with broken skylights and a collapsed end bay.
      for(let k=0;k<4;k++){
        const lx=-rx+3+k*(w-6)/4,bw=(w-6)/4;
        shape(g,[[lx,-ry+4],[lx+bw*.73,-ry+4],[lx+bw*.73,ry-4],[lx,ry-4]],k===3?'#65706a':'#8e9d95');
        shape(g,[[lx+bw*.73,-ry+4],[lx+bw,-ry+4],[lx+bw,ry-4],[lx+bw*.73,ry-4]],'#596d70');
        for(let j=0;j<4;j++)line(g,[[lx+3,-ry+7+j*(h-12)/4],[lx+bw-2,-ry+7+j*(h-12)/4]],'#546461',.9);
      }
      shape(g,[[rx*.3,-ry+1],[rx-1,-ry+1],[rx-2,ry*.3],[rx*.71,ry*.1],[rx*.56,-ry*.3]],'#4a504c');
    }else{
      box(g,-rx+5,-ry+5,w-10,h-10,3,'#787e71');
      const r=Math.min(rx,ry)*.72;
      oval(g,3,4,r,r,'#4a5851');oval(g,0,0,r,r,gradient(g,-r,-r,r,r,'#beae8c','#8f947d','#657a74'));
      for(let i=0;i<8;i++){const a=i*tau/8;line(g,[[0,0],[Math.cos(a)*r,Math.sin(a)*r]],'#687770',1.2);}
      oval(g,-1,-2,3,3,'#c6b99d');
    }
    g.restore();
  }
  function workCrane(g,x,y,size){
    g.save();g.translate(x,y);g.scale(size,size);g.rotate(-.25);
    for(const y of [-6,6]){box(g,-11,y-2,22,4,2,'#45443c');for(let i=-9;i<10;i+=3)line(g,[[i,y-1],[i,y+1]],'#8b836b',1);}
    box(g,-8,-5,14,10,2,'#d6a352');box(g,-6,-3,6,6,1,'#657b77');
    line(g,[[1,-2],[11,-10],[20,-8],[26,-14]],'#5e5345',4);
    line(g,[[1,-4],[11,-12],[20,-10],[26,-16]],'#e4b56b',2.6);
    shape(g,[[23,-17],[30,-19],[31,-14],[26,-13]],'#514e43');
    g.restore();
  }
  function quarryPit(g,x,y,rx,ry,random){
    g.save();g.translate(x,y);g.scale(rx,ry);
    const colors=['#805640','#d29b73','#88624c','#bd8c69','#785849','#665648'];
    const phase=random()*tau;
    colors.forEach((color,i)=>{
      const r=1-i*.115,points=[];
      for(let j=0;j<16;j++){
        const a=j*tau/16,edge=r*(.87+.09*Math.sin(a*3+phase)+.055*Math.sin(a*5+phase));
        points.push([Math.cos(a)*edge+i*.019,Math.sin(a)*edge-i*.037]);
      }
      shape(g,points,color);
    });
    g.restore();
    for(let i=0;i<14;i++){
      const px=x+(random()-.5)*rx,py=y+(random()-.5)*ry*.8;
      line(g,[[px,py],[px+3+random()*7,py-.6]],'#cfab897a',1);
    }
  }
  function waterways(map){
    if(!map.water&&!map.islands)return null;
    const water=new Path2D();
    // Counter-wound island rings cut dry land out of the open sea. The same
    // path drives shoreline paint, bridge decks and pontoon placement.
    if(map.islands)water.rect(-1000,-1000,map.width+2000,map.height+2000);
    for(const [cx,cy,rx,ry] of map.islands||map.water){
      const pool=new Path2D();
      for(let i=0;i<80;i++){
        const a=(map.islands?-1:1)*i*tau/80,r=.92+.06*Math.cos(3*a+cx)+.04*Math.sin(5*a+cy);
        const x=cx+rx*r*Math.cos(a),y=cy+ry*r*Math.sin(a);
        if(i)pool.lineTo(x,y);else pool.moveTo(x,y);
      }
      pool.closePath();water.addPath(pool);
    }
    return water;
  }
  function roadOutline(segments){
    const road=new Path2D();
    for(const {a,b,r0,r1} of segments){
      road.moveTo(a.x,a.y-r0);road.lineTo(b.x,b.y-r1);
      road.lineTo(b.x,b.y+r1);road.lineTo(a.x,a.y+r0);road.closePath();
    }
    return road;
  }
  function terrain(map, roads, segments, distance, seed, water, scale) {
    const {width,height,setting}=map, {canvas,g}=surface(width,height,scale),random=seeded(seed);
    const palette=terrainColors[setting],exit=map.exit;
    const urban=setting==='Freight',quarry=setting==='Foundry',marsh=setting==='Atoll';
    g.fillStyle=gradient(g,0,0,width,height,...palette.ground);g.fillRect(0,0,width,height);
    if(urban){
      for(let y=-20;y<height;y+=85)for(let x=-38;x<width;x+=115){
        box(g,x,y,110,80,3,random()<.55?'#8a908533':'#6977734f');
        line(g,[[x,y+81],[x+111,y+81],[x+111,y]],'#5966618c',1.3);
        if(random()<.4)line(g,[[x+25,y+16],[x+30,y+24],[x+36,y+22],[x+39,y+31]],'#54605b99',1);
      }
    }else{
      for(let i=0;i<(marsh?13:26);i++){
        const cx=random()*width,cy=random()*height,radius=35+random()*105,phase=random()*tau;
        for(let j=0;j<(quarry?5:3);j++){
          const ring=[];
          for(let a=0;a<tau;a+=tau/80){
            const r=(radius-j*radius*.16)*(1+.13*Math.sin(a*3+phase)+.06*Math.cos(a*5-phase));
            ring.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*.57]);
          }
          shape(g,ring,quarry?'#e8b0880b':'#dbe1b007');
          line(g,[...ring,ring[0]],quarry?'#815d4b44':'#d4dec51e',quarry?1.6:.9);
        }
      }
    }
    // Broad patches of canopy shadow, flowering grass and exposed stone
    // break up flat ground without competing with the roads.
    for(let i=0;i<52;i++){
      const cx=random()*width,cy=random()*height,r=28+random()*110;
      const wash=g.createRadialGradient(cx,cy,0,cx,cy,r);
      wash.addColorStop(0,urban?'#bbb29a34':quarry?'#e6ac8054':marsh?'#c9c58d4c':'#d2cb8250');
      wash.addColorStop(1,'#b8c6a000');oval(g,cx,cy,r,r,wash);
    }
    if(water){
      g.save();
      g.strokeStyle=marsh?'#e1cc9c':'#d0dfe1';g.lineWidth=marsh?33:12;g.stroke(water);
      g.strokeStyle=marsh?'#b9d4b6':'#91b6c5';g.lineWidth=marsh?13:5;g.stroke(water);
      g.fillStyle=gradient(g,0,0,width,height,...(marsh?['#55a8a2','#398c91','#306b7b']:['#7bb8c6','#76a8be','#56869e']));g.fill(water);
      g.clip(water);
      if(marsh){
        g.strokeStyle='#87c7b5';g.lineWidth=38;g.stroke(water);
        g.strokeStyle='#a5dbc7';g.lineWidth=6;g.stroke(water);
      }
      for(let i=0;i<1700;i++){
        const x=random()*width,y=random()*height,length=5+random()*30;
        line(g,[[x,y],[x+length*.45,y-1.4],[x+length,y-1]],i%4?'#a3c7b644':'#cce1c984',1.25);
      }
      if(setting==='Glacier'){
        for(let i=0;i<270;i++){
          const x=random()*width,y=random()*height,d=8+random()*38;
          shape(g,[[x-d,y],[x-d*.4,y-d*.45],[x+d*.7,y-d*.35],[x+d,y+d*.1],[x,y+d*.32]],'#c1e0e4b8','#9cc5d0');
        }
      }
      g.restore();
    }
    const roadbed=roadOutline(segments);
    g.lineWidth=10;g.strokeStyle=palette.edge;g.stroke(roadbed);
    g.lineWidth=4;g.strokeStyle=urban?'#c2beb0':palette.edge;g.stroke(roadbed);
    // The lit bank and its shaded face follow the same edge as placement.
    g.fillStyle=palette.edge;g.fill(roadbed);
    g.save();g.clip(roadbed);g.translate(0,urban?4:quarry?12:7);
    g.fillStyle=gradient(g,0,0,width,height,...palette.road);g.fill(roadbed);g.restore();
    // Faint wheel ruts carry the eye through forks without marking enemy lanes.
    for(const road of roads){
      for(const offset of urban?[0]:[-11,11]){
        const knots=road.points.map(p=>[p.x,p.y+offset+Math.sin(p.x*.028)*1.7]);
        g.beginPath();g.moveTo(...knots[0]);
        for(let i=1;i<knots.length-1;i++){
          const [x,y]=knots[i],next=knots[i+1];
          g.quadraticCurveTo(x,y,(x+next[0])/2,(y+next[1])/2);
        }
        g.lineTo(...knots[knots.length-1]);g.strokeStyle=urban?'#ddc78c80':'#856b4821';
        if(urban)g.setLineDash([12,16]);g.lineWidth=2;g.stroke();g.setLineDash([]);
      }
    }
    if(water){
      g.save();g.clip(water);g.clip(roadbed);
      g.fillStyle=marsh?'#d9c49d':'#9f9175';g.fillRect(0,0,width,height);
      for(const {a,b,ux,uy,length,r0,r1} of segments){
        const steps=Math.max(1,Math.round(length/(marsh?21:6)));
        for(let i=0;i<steps;i++){
          const t=(i+.5)/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,r=r0+(r1-r0)*t;
          line(g,[[x-uy*r,y+ux*r],[x+uy*r,y-ux*r]],marsh?'#91846a65':'#756f5d',1.3);
        }
      }
      g.restore();
    }
    for(let i=0;i<1500;i++){
      const x=random()*width,y=random()*height,d=distance(x,y);
      if(d < -5){
        line(g,[[x-2,y+.2],[x+random()*5,y-.3]],i%4?'#8c765523':'#fff1c65c',.6+random());
      }else if(d>6 && !urban){
        line(g,[[x-2,y-2],[x,y],[x+1,y-4]],'#d3dfb84d',.85);
      }
    }
    const groves=[];
    const clumps={Orchard:8,Glacier:72,Foundry:34,Atoll:95,Freight:10};
    for(let i=0;i<clumps[setting];i++){
      const cx=random()*width,cy=random()*height;
      for(let j=0;j<2+random()*5;j++){
        const x=cx+(random()-.5)*75,y=cy+(random()-.5)*44,h=11+random()*26;
        if((!water||!g.isPointInPath(water,x*scale,y*scale)) && distance(x,y-h*.5)>h*.65 && (x<exit.x-56 || Math.abs(y-exit.y)>90))groves.push({x,y,h});
      }
    }
    groves.sort((a,b)=>a.y-b.y);
    for(const [i,{x,y,h}] of groves.entries()){
      oval(g,x+h*.13,y-1,h*.31,h*.10,'#344c453d',-.18);
      if(marsh){
        const crown=y-h*.55;
        line(g,[[x+2,y],[x-1,y-h*.3],[x,crown]],'#826d50',2.8);
        for(let leaf=0;leaf<6;leaf++){
          const angle=leaf*tau/6+i,dx=Math.cos(angle)*h*.48,dy=Math.sin(angle)*h*.25;
          shape(g,[[x,crown],[x+dx*.52-dy*.21,crown+dy*.48-3],[x+dx,crown+dy+2],[x+dx*.55+dy*.20,crown+dy*.55]],leaf%2?'#508878':'#659c77');
        }
      }else if(setting==='Glacier'){
        pine(g,x,y,h,'#516e77','#748e96');
        shape(g,[[x-h*.21,y-h*.60],[x,y-h],[x+h*.18,y-h*.64],[x+h*.04,y-h*.70]],'#dbe6e5');
      }else if(quarry || i%7===0){

        shape(g,[[x-8,y],[x-7,y-5],[x-1,y-9],[x+6,y-6],[x+9,y-1],[x+4,y+2]],quarry?'#9b7962':'#859992');
        shape(g,[[x-7,y-5],[x-1,y-9],[x+6,y-6],[x+1,y-4]],quarry?'#e3c59d':'#bac4ae');
      }else if(setting==='Orchard'||urban){
        if(i%3===0){
          oval(g,x,y-h*.17,h*.39,h*.29,'#627e58');
          oval(g,x-h*.08,y-h*.25,h*.31,h*.21,'#8ba56c');
        }else for(let k=0;k<4;k++)oval(g,x+random()*7,y+random()*4,1.45,1.1,'#f0d8a4');
      }else pine(g,x,y,h,i%3?'#3e6156':'#476d5d',i%3?'#668674':'#799782');
    }
    for(const [index,[x,y,rx,ry]] of map.landmarks.entries()){
      if(urban)depot(g,x,y,rx,ry,index,random);
      else if(quarry){
        quarryPit(g,x,y,rx,ry,random);
        oval(g,x,y,rx*.44,ry*.64,'#383b39');oval(g,x,y-3,rx*.31,ry*.35,'#d37242');
        oval(g,x-2,y-4,rx*.20,ry*.19,'#f2b46a');
        if(index%2===0)workCrane(g,x-rx*.1,y+ry*.45,.85);
      }
    }
    if(setting==='Orchard'){
      // Working orchards have planting rows, with grass headlands between blocks.
      for(let row=0;row<height/97;row++)for(let col=0;col<width/85;col++){
        if(col%6===5||row%5===4)continue;
        const x=35+col*85+row*14,y=46+row*97+col*3;
        if(distance(x,y)<35||x>exit.x-60&&Math.abs(exit.y-y)<110)continue;
        oval(g,x+6,y+6,19,10,'#525a3f55',-.28);
        box(g,x-2,y-1,4,12,1,'#755d40');
        oval(g,x,y-4,18,14,'#606f3e');oval(g,x-4,y-8,14,10,'#94a15a');
        for(let n=0;n<5;n++)oval(g,x-12+random()*22,y-15+random()*14,2.4,2.7,'#e4b264');
      }
    }
    if(urban){
      for(const {points,a} of roads){
        for(const side of [-1,1]){
          const track=points.map(p=>[p.x,p.y+side*9]);
          line(g,track,'#3d464b',3.5);line(g,track,'#aca8a0',1.15);
        }
        for(const p of points)line(g,[[p.x,p.y-13],[p.x,p.y+13]],'#514a4580',2.1);
        if(a.outgoing.length>1){
          const p=points[Math.floor(points.length*.48)],y=p.y-p.width*.5-7;
          box(g,p.x-3,y-11,6,14,2,'#29333b');
          oval(g,p.x,y-8,2,2,'#ffba6f');
        }
      }
    }
    // Fortified gate at the road exit with side towers and amber landing lights.
    g.save();g.translate(exit.x,exit.y);g.scale(1,exit.span/84);
    box(g,-36,-48,80,103,10,'#263c3752');
    box(g,-35,-49,80,98,10,'#3b5151');
    box(g,-29,-43,74,86,8,'#8c9d8e');
    box(g,-23,-34,67,68,5,'#354e50');
    for(let y=-25;y<=25;y+=10)line(g,[[-17,y],[33,y]],'#607674',3);
    for(const y of [-42,42]){
      box(g,-39,y-9,62,18,5,'#31464a');
      box(g,-37,y-9,57,12,4,gradient(g,0,y-9,0,y+4,'#c3c9b4','#7f948c'));
      box(g,-33,y-6,11,4,2,'#ffc486');
    }
    line(g,[[-12,-10],[-4,0],[-12,10]],'#f5c98b',3);g.restore();
    return canvas;
  }
  function foundation(wet=false){
    const {canvas,g}=surface(72,72,3);g.translate(36,36);
    if(wet){
      oval(g,1,3,25,22,'#c1ded170');oval(g,2,3,23,20,'#305a59');
      for(const y of [-14,14]){
        box(g,-23,y-4,46,8,4,gradient(g,0,y-4,0,y+4,'#bfcac0','#617b7d','#354c51'));
        for(const x of [-14,12])box(g,x,y-4,3,8,1,'#394d51');
      }
    }
    oval(g,2,3,21.5,20,'#1a302a67');
    const rim=gradient(g,-13,-20,14,21,'#a6aba0','#667272','#35464a','#273739');
    oval(g,0,0,20,20,rim);oval(g,0,0,16.8,16.8,'#26373c');
    oval(g,-.5,-.8,15.6,15.6,gradient(g,-9,-17,12,17,'#87948c','#4c5e5e','#33494a'));
    for(let i=0;i<6;i++){
      g.save();g.rotate(i*tau/6);
      box(g,-4,-21,8,6,1.3,'#3a4846');box(g,-3.6,-21,7,4.1,1,'#839089');
      oval(g,0,-19,.95,.95,'#273633');g.restore();
    }
    return canvas;
  }
  function tower(type,accent,levels=[0,0]){
    const {canvas,g}=surface(72,72,4);g.translate(36,36);
    const [left,right]=levels;
    const alloy=['#d3d4c0','#89968c','#506464','#303f43'];
    const carbon=['#9aaba8','#627575','#405457','#27363b'];
    const copper=['#e3c194','#ab8156','#765239','#423d36'];
    const finishes={gun:['#afbaa0','#56685b'],sniper:['#a4ac94','#465847'],shotgun:['#bea785','#756353'],
      rocket:['#b89d79','#675d4d'],cannon:['#b4ae94','#5e685c'],minigun:['#96a9a9','#465b5e'],
      venom:['#a2b586','#536e50'],flame:['#bea083','#775849']};
    const [paint,shade]=finishes[type]||['#afbaa7','#5a6b62'];
    const coat=gradient(g,-12,-13,10,13,'#c9cbb8',paint,shade,'#344547');
    function casework(x,y,w,h,colors=alloy,r=2){
      box(g,x+1,y+1.8,w,h,r,'#1c2c30bd');
      box(g,x,y,w,h,r,gradient(g,x,y,x+w*.25,y+h,...colors));
      line(g,[[x+r,y+.6],[x+w-r,y+.6]],'#e7e7cf94',.8);
    }
    function tube(x,y,len,d,colors=carbon){
      box(g,x+.7,y-d/2+1.4,len,d,.9,'#1d2a2cc9');
      box(g,x,y-d/2,len,d,1,gradient(g,0,y-d/2,0,y+d/2,...colors));
      line(g,[[x+1,y-d*.23],[x+len-1,y-d*.23]],'#d8dcca95',.6);
    }
    function vents(x,y,n,dy=2.5){
      for(let i=0;i<n;i++){line(g,[[x,y+i*dy],[x+5,y+i*dy-.5]],'#253b3d',1.2);}
    }
    function lens(x,y,r,color){
      oval(g,x+.5,y+.7,r+1,r+1,'#203137');
      const shine=g.createRadialGradient(x-r*.35,y-r*.45,0,x,y,r);
      shine.addColorStop(0,'#f4fbef');shine.addColorStop(.38,color);shine.addColorStop(1,'#294550');
      oval(g,x,y,r,r,shine);
    }
    function bore(x,y,len,d){
      tube(x,y,len,d);tube(x+2,y,len*.38,d+1.6,alloy);
      tube(x+len-4,y,4,d+1.1);oval(g,x+len-.6,y,1,d*.38,'#182a2e');
    }
    function trackPod(level,y,chemical=false){
      if(!level)return;
      const length=9+level*2;
      tube(-13,y,length,4.8+level*.55,chemical?copper:carbon);
      for(let i=0;i<level;i++)tube(-12+i*3,y,1.4,6.2+level*.55,chemical?carbon:copper);
      if(level>=3){line(g,[[-11,y],[-17,y],[-20,y*.62],[-15,1]],'#263b3b',2.6);}
    }
    const energy=['frost','pulse','lightning'].includes(type);
    const sprayer=['flame','venom'].includes(type);
    // The lower bank carries magazines, reservoirs or field equipment.
    // The upper bank carries sights, cooling hardware or targeting arrays.
    if(type==='barracks'){
      casework(-16,-10,31,24,carbon,3);
      shape(g,[[-16,-3],[-12,-13],[10,-13],[17,-3]],coat,'#36483f');
      shape(g,[[-16,-3],[17,-3],[12,10],[-12,10]],'#78816b','#42574e');
      for(const x of [-9,1,9])line(g,[[x-2,-11],[x+1,-3],[x-1,8]],'#bcc1a5',1.3);
      casework(11,-5,7,9,carbon);vents(12,-2,3,2);
      if(left){
        casework(-14,9,12+left*3,5+left,carbon);
        for(let i=0;i<left;i++)tube(-12+i*4,13,3,4,copper);
        if(left>=3)bore(4,13,8+left*2,3.8);
        if(left===5)bore(4,17,15,3.6);
      }
      if(right){
        casework(-13,-13-right*1.2,10+right*3.4,7+right*.8,alloy);
        const y=-12-right*.75;
        box(g,-5,y-2,2,6,.3,'#914d3e');box(g,-7,y,6,2,.3,'#914d3e');
        line(g,[[8,y],[11,-17-right*1.4]],'#304447',1.2);
        if(right>=3)lens(11,-17-right*1.4,1.7,'#e9bc79');
        if(right===5){casework(12,-14,7,15,carbon);vents(13,-11,4);}
      }
    }else if(energy){
      const lobes=type==='pulse'?4:3;
      for(let i=0;i<lobes;i++){
        g.save();g.rotate(i*tau/lobes);
        casework(3,-3.8,13+left*1.7,7.6,carbon);
        const end=14+left*1.7;
        tube(end-4,0,5,5,type==='lightning'?copper:alloy);
        lens(end,0,1.65+left*.23,accent);
        if(right){casework(3,4,5+right*2,2.6+right*.35,alloy,1);lens(5+right*2,5.7,1.2,accent);}
        g.restore();
      }
      if(right>=3){g.beginPath();g.arc(0,0,12+right*.9,0,tau);g.strokeStyle='#515f65';g.lineWidth=3;g.stroke();g.lineWidth=.9;g.strokeStyle=accent;g.stroke();}
      oval(g,0,.8,10+left*.65,10+left*.65,'#26383f');
      if(type==='pulse'){
        for(let i=0;i<3;i++){const r=9-i*2+left*.60;oval(g,0,-i,r,r*.85,i%2?accent:coat);}
        lens(0,-2,3+right*.35,accent);
      }else if(type==='frost'){
        shape(g,[[-9,0],[-5,-9],[4,-10],[9,-4],[8,5],[1,9],[-6,7]],accent,ink);
        shape(g,[[-5,-9],[-1,0],[-6,7],[-9,0]],'#effff4');
        shape(g,[[-1,0],[9,-4],[8,5],[1,9]],'#6699a5');
      }else{
        for(let i=0;i<4;i++){oval(g,-i*.5,-i,8-i*.8,5-i*.45,i%2?coat:'#92704c');}
        lens(-2,-5,3.8+left*.35,accent);
      }
      if(left===5){for(const y of [-10,10])tube(-18,y,11,5,copper);}
      if(right===5){for(const y of [-9,9])lens(15,y,3,accent);}
    }else if(type==='seeker'){
      casework(-15,-11,25,22,carbon,4);
      for(const side of [-1,1]){
        casework(-12,side*9-4.5,29+right,9,alloy);
        for(const row of [-1.8,1.8]){
          tube(-8,side*9+row,23+right,3.2,carbon);
          oval(g,15+right,side*9+row,.9,1.45,accent);
        }
      }
      lens(0,0,4,accent);trackPod(left,15);trackPod(right,-15,true);
      if(left>=3)casework(-10,-3,19,6,carbon);
      if(right>=3)lens(11,0,2+right*.4,accent);
    }else if(type==='solar'){
      casework(-13,-9,25,19,carbon,4);
      for(const side of [-1,1]){
        shape(g,[[-15,side*5],[-14,side*12],[-2,side*16],[10,side*11],[14,side*5],[2,side*8]],
          gradient(g,-11,-10,13,13,'#fff0b7','#d5a853','#8f683c'),'#53483f');
        line(g,[[-10,side*11],[0,side*12],[9,side*8]],'#fff1c4',1);
      }
      tube(1,0,20+left,5,copper);lens(2,0,5.5+left*.4,accent);
      trackPod(left,17,true);trackPod(right,-17);
      if(right>=3)lens(13,-7,2.2+right*.25,'#ffc380');
    }else if(type==='disc'){
      casework(-14,-9,28,18,carbon,4);
      for(const y of [-6,6])tube(1,y,20+right,4.5,copper);
      oval(g,-3,0,12+left*.55,10,gradient(g,-12,-8,8,9,'#e5b980','#99734d','#494e48'));
      for(let i=0;i<7;i++){
        g.save();g.translate(-3,0);g.rotate(i*tau/7);
        shape(g,[[5,-2],[11+left*.55,-4],[9,2],[5,4]],'#dbc29c','#665943');g.restore();
      }
      lens(-3,0,3.2,accent);trackPod(left,12,true);trackPod(right,-12);
      if(right>=3)lens(14,-7,2.8,'#a1dbc5');
    }else if(type==='prism'){
      casework(-12,-9,22,18,carbon,5);
      for(const side of [-1,1]){
        tube(-9,side*8,24,3.5,alloy);lens(14,side*8,2.2,accent);
      }
      const tip=17+left;
      shape(g,[[-10,0],[-3,-8],[7,-6],[tip,0],[7,7],[-3,8]],'#a55b99','#43374e');
      shape(g,[[-8,0],[-2,-7],[6,-5],[tip,0],[4,1]],'#ffe4fa');
      shape(g,[[-8,0],[4,1],[tip,0],[5,6],[-2,7]],'#cf84c0');
      trackPod(left,12);trackPod(right,-12);
      if(right>=3)for(const y of [-10,10])lens(10,y,1.3+right*.45,'#ecd4ff');
    }else if(type==='rocket'){
      const rows=left>=3?3:2;
      for(let i=0;i<rows;i++){
        const y=(i-(rows-1)/2)*8.8;
        casework(-14,y-4.3,29+left*1.2,8.5,carbon);
        tube(-12,y,25+left,5.6,alloy);tube(8+left,y,5,6.7,copper);
        oval(g,13+left,y,1.3,2.7,'#3e3830');
      }
      if(left===5)for(const y of [-13,13])tube(-10,y,30,4.2,copper);
      trackPod(right,-13.5-(rows-2)*3,true);
      if(right>=3)lens(12,-15.5,2.6,'#f4a057');
    }else if(type==='mortar'){
      trackPod(left,13,true);trackPod(right,-14);
      casework(-15,-10,26,21);const r=8+left*.9;
      for(let i=0;i<3;i++)oval(g,i*2,-i*1.2,r+2-i*.4,r+1-i*.45,i===1?'#394c4d':coat,-.3);
      oval(g,5,-3,r*.80,r*.75,'#213239',-.3);oval(g,5.7,-2,r*.49,r*.48,'#14262a',-.3);
      if(right>=2)lens(10,-13,1.8+right*.3,'#f4be77');
      if(right===5)bore(-5,-14,24,5);
    }else{
      trackPod(left,11.8,sprayer);trackPod(right,-12.1);
      const rear=type==='sniper'?-15:-13;
      shape(g,[[rear-2,-6],[rear+2,-10],[2,-11],[10,-6],[12,2],[6,10],[rear+2,9],[rear-2,5]],coat,'#34474a');
      vents(rear+1,-3,3);
      if(type==='minigun'){
        const n=left>=3?5:3;
        for(let i=0;i<n;i++)bore(4,(i-(n-1)/2)*2.45,21+left,2.5);
        casework(8,-n*1.3,4,n*2.6,alloy,1);casework(18,-n*1.3,3,n*2.6,carbon,1);
      }else if(sprayer){
        for(const y of [-6,6]){tube(-13,y,16,6.5,type==='flame'?copper:alloy);box(g,-7,y-3,2,6,.4,accent);}
        bore(4,0,17+left,5);
        shape(g,[[16, -2],[23+left,-4],[23+left,4],[16,2]],coat,ink);
        if(left>=3)bore(5,7,13+left,3);
      }else{
        const n=type==='shotgun'?2+(left>=3)+(left===5):left===5&&type!=='sniper'?2:1;
        const d=type==='cannon'?8:type==='sniper'?3.8:4.7;
        for(let i=0;i<n;i++)bore(4,(i-(n-1)/2)*(d+1),type==='sniper'?26+left*.6:16+left*1.45,d);
        if(type==='sniper' || right>=1){tube(-3,-7,9+right*2.2,3.1,carbon);lens(6+right*2.2,-7,1.4,'#88c9c7');}
      }
      casework(-4,-4,12,8,carbon);box(g,-2,-3,4,1.4,.3,accent);
      if(left>=2){casework(-12,8,8+left*1.4,4+left,carbon);for(let i=0;i<left;i++)tube(-11+i*2.4,12,1.6,3.2,copper);}
      if(right>=3){casework(-5,-13,12,5,alloy);lens(5,-11,2,accent);}
      if(right===5){tube(4,-13,22,4.9,alloy);tube(12,-13,3,5.7,copper);lens(24,-13,2,accent);}
    }
    if(left===5 && !energy && type!=='barracks'){
      // Spent casings feed around the drum on the heavy magazine variants.
      oval(g,-12,12.5,6.4,5.5,'#2b3939');
      oval(g,-12.5,11.5,5.7,4.7,gradient(g,-17,7,-8,17,'#d0ab7d','#957958','#5b5141'));
      oval(g,-12.5,11.5,2.3,2,'#536060');
      for(let k=0;k<4;k++){const x=-10+k*2.9;line(g,[[x,15.7],[x+1,18.1]],'#baa078',1.7);}
    }
    if(right===5 && type==='barracks'){
      g.save();g.translate(-15,-12);g.rotate(-.6);
      oval(g,0,0,7.6,4.3,'#364950');oval(g,-.4,-1.3,7.3,3.9,coat);
      line(g,[[-5,-1],[0,-5],[4,-1.5]],'#6e766b',.9);lens(0,-5,1.2,'#abcacf');g.restore();
    }
    return canvas;
  }
  function zombie(kind,skin,tier=1){
    // Trace the early walker's wide brow, torn shoulders and two forward hands
    // in continuous curves. Each arm has its own sleeve, wrist and finger line.
    const {canvas,g}=surface(44,44,6);g.translate(22,22);
    function piece(path,fill,edge='#293427',weight=.7){
      const outline=new Path2D(path);
      g.fillStyle=fill;g.fill(outline);
      if(edge){g.strokeStyle=edge;g.lineWidth=weight;g.stroke(outline);}
    }
    if(kind==='runner')g.scale(1.13,.79);
    if(kind==='brute')g.scale(.98,1.12);
    oval(g,0,1.5,9,6.8,'#28352f40');
    piece('M-8 -6 Q-6 -8 -2 -7 L1 -4 -1 4 -6 7 -8 6 -6 3 -9 4 -8 0 -10 -1 -7 -3 Z','#69604b');
    function arm(side){
      g.save();g.scale(1,side);
      piece('M-4 -5 Q-4 -9 -1 -10 L3 -10 5 -8 3 -6 -1 -6 Z','#69654d');
      piece('M1 -9.7 L4.2 -10.5 8 -9.7 11 -9.4 13 -10.2 Q15 -10.6 16 -10 L13.7 -9 16 -9 Q17 -8.8 15.8 -8.2 L13.8 -7.8 10.4 -7.9 9.1 -7.1 8.5 -7.3 9 -8.3 5.6 -8 2 -7.3 Z',skin);
      piece('M-3 -9 Q-1 -11 2 -10.5 L3.5 -10 3 -8.9 2.2 -9.2 1.6 -7.9 .8 -8.5 -.4 -7.7 -2 -8 Z','#4e5946');
      line(g,[[4,-9.8],[6,-9.1],[7,-9.3]],'#924f43',.95);g.restore();
    }
    arm(1);arm(-1);
    piece('M-6 -4 Q-6 -6.3 -2 -6.8 L2 -6.1 4 -4.6 3 5 -1 6.6 -4 5.5 -5 6 -5.6 3.5 -7 3 -6.2 .4 -7.1 -1.4 Z','#71604e');
    piece('M-4.4 -4.6 L-1 -5.8 1 -4.8 -1 -2 -3 -2.9 Z','#525d46');
    piece('M-4.6 2.8 L-1.9 1.3 .5 4.1 -2.2 5.6 Z','#5a473c');
    piece('M-2.8 -4 Q-1.3 -6 2 -5.7 Q5.1 -5.7 6.2 -4 L7 -2.1 8 -.9 7.5 .3 8 1.4 7.2 3.8 5.3 4.9 3.4 5.4 -.2 5.2 -2.5 3.2 -3.5 .9 Z',skin);
    piece('M-.9 -4.5 Q1.1 -5.8 3.4 -4.9 L2 -4.1 2.6 -3.3 .4 -3.3 -.3 -1.7 -1.6 -2.5 Z','#8b4b44',null);
    piece('M4.1 -3.9 Q6.1 -4.1 6.8 -2.8 L6.9 -1.2 5.9 -.6 5.2 -1.3 4.7 -1 Z M5.4 .7 L6.7 .4 7.2 1.8 6.8 3.2 5.2 3.7 4.7 2.6 Z','#343b2d',null);
    line(g,[[5.8,-2.8],[6.5,-2.1]],'#f2e9bc',.92);line(g,[[5.75,2.65],[6.5,2.0]],'#f2e9bc',.92);
    piece('M6.8 -.4 L8 -.6 8.6 .6 7.5 1.4 7.6 .3 Z','#795347',null);
    line(g,[[2,4.9],[3.7,3.6],[4.5,4.1]],'#8b5247',.7);
    if(kind==='runner'){
      piece('M-9 -5 L-6 -7 -2 -5 -3 -2 -4 4 -7 6 -9 4 -7 0 Z','#aa5140');
      line(g,[[-7,-5],[-5,-3],[-6,3]],'#f4d9a7',1.35);
      for(const side of [-1,1])line(g,[[-4,side*4],[-8-side,side*6],[-10-side,side*4]],'#425047',2);
    }
    if(kind==='brute'){
      for(const side of [-1,1]){
        g.save();g.scale(1,side);
        piece('M-6 -4 Q-8 -8 -4 -10 L0 -11 5 -10 5 -7 1 -6 -2 -5 Z','#596650');
        line(g,[[-4,-9],[0,-9.5],[2,-8.5]],'#9b9a76',1);g.restore();
      }
      line(g,[[-5,-4],[-1,-2],[-4,4]],'#6c4738',1.6);
    }
    if(kind==='armor'){
      piece('M-3.8 -3.3 Q-2 -6.8 1.4 -6.2 L3.5 -5.6 3.3 -3.7 2.7 -1.9 2.9 1.9 3.6 4.1 2.2 5.5 Q-1 6.1 -3.6 3.2 Z','#6e7a71');
      line(g,[[-2.7,-3],[0,-4.9],[2.3,-4.6]],'#a5af96',.9);
    }
    if(kind==='blast'){
      // A padded bomb-suit collar and gold visor stay visible between tier plates.
      piece('M-8 -5 Q-9 -9 -4 -9 L0 -7 -2 -4 -2 4 0 7 -4 9 Q-9 9 -8 5 Z','#386c71');
      piece('M-4 -4 Q-2 -7 3 -6 L5 -4 5 4 3 6 Q-2 7 -4 4 Z','#477d7d');
      piece('M2 -4 L5 -3 6 -2 6 2 5 3 2 4 Z','#efb957');
      line(g,[[-6,-5],[-4,-4],[-4,4],[-6,5]],'#9ac0b6',1.2);
    }
    if(tier===1)return canvas;
    // Keep the face, hands and central jacket exposed. Paired growths sit
    // outside the torso so their silhouettes survive rotation and downsampling.
    function ridge(outline,facet,base,light){
      piece(outline,base,'#302c31',1.1);
      piece(facet,light,null);
    }
    const sides=tier===2?1:2;
    for(let side=0;side<sides;side++){
      g.save();if(side)g.scale(1,-1);
      if(tier===2){
        ridge('M-7 -4 Q-10 -7 -8 -10 L-5 -14 -1 -13 2 -10 1 -7 -2 -5 Z',
          'M-7.7 -9.5 L-4.8 -13 -1.4 -12.3 .6 -10 -3.2 -9.6 -6 -7.5 Z','#84928f','#f0eee0');
      }else if(tier===3){
        ridge('M-9 -3.5 L-12 -8.8 -10 -12.6 -4 -14 2 -12 4 -8 1 -5 -5 -4 Z',
          'M-10.2 -9.6 L-9 -12 -4 -13 1.5 -11.5 2.8 -9.4 -3 -10.3 -8.4 -8 Z','#98513b','#ed9e69');
      }else if(tier===4){
        ridge('M-8 -4 Q-12 -6 -12 -10 Q-10 -15 -4 -18 Q-5 -13 1 -12 L4 -10 2 -6 -3 -4 Z',
          'M-10.7 -10 Q-9 -14 -5.6 -15.9 Q-6 -12.1 -3.4 -11 L1.5 -10.2 -2 -9.3 -7 -9.4 Z','#9d773d','#ffe2a0');
      }else{
        ridge('M-10 -3 L-17 -8 -12 -8.5 -13 -16 -7 -12.5 -3 -18.3 -.5 -12.8 3.5 -11.4 4.4 -7 1 -4.8 -4 -4 Z',
          'M-14.4 -7.7 L-10.3 -7 -11.8 -13.7 -7.4 -10.4 -3.2 -15.8 -2.2 -11.6 1.8 -10.5 -2.9 -9.6 -7.8 -9.1 -9.5 -5.4 Z','#714066','#f5add4');
        piece('M-8.5 -7.5 L-5.6 -10.7 -2.4 -10.4 -.9 -8.4 -4.2 -7.1 Z','#ba6f9b',null);
      }
      g.restore();
    }
    if(tier===5){
      ridge('M-8 -4 L-12 -3.5 -18.1 0 -12 3.5 -8 4 -6 0 Z',
        'M-16.1 0 L-10.8 -2.4 -8.5 -2.4 -10.2 0 Z','#693e62','#f6b9db');
    }
    return canvas;
  }
  function infantry(){
    const {canvas,g}=surface(32,24,4);g.translate(14,12);
    oval(g,-1,1,7.5,7.7,'#283e4259');oval(g,-2,0,5.8,7,'#364b53');
    box(g,-8,-5,4,10,1.5,'#8c9c87');
    line(g,[[-1,4],[3,5],[8,1]],'#728f8c',3.3);line(g,[[1,-4],[5,-4],[7,-1]],'#91aaa2',3.3);
    box(g,4,-1.6,11,3,1,'#24383e');box(g,7,-1.5,6,1,.45,'#c9d2bd');
    oval(g,0,-1,5.4,5.1,'#253d43');oval(g,-.5,-1.8,4.9,4.3,'#8daba5');
    line(g,[[2.8,-4],[4.1,-1],[3.4,1]],'#daceaa',1.2);
    line(g,[[-3,-4],[-1,-5],[1,-4.7]],'#cfddc6',1);
    return canvas;
  }
  function flameJet(g,t,seconds){
    const muzzle=13,start=Math.min(muzzle,t.plumeLength*.7),len=Math.max(4,t.plumeLength-start);
    const phase=seconds*22+t.x*.11+t.y*.07,fade=Math.max(0,Math.min(1,t.plumeTime/.045));
    g.save();g.translate(t.x,t.y);g.rotate(t.angle);g.translate(start,0);g.globalAlpha=.88*fade;
    function tongue(length,width,offset,phaseShift,colors){
      width*=t.jetSpread?2.4:1;
      const pts=[];
      for(const side of [-1,1]){
        for(let j=0;j<=18;j++){
          const u=side===-1?j/18:1-j/18;
          const belly=Math.sin(Math.PI*u)**.65;
          const bend=(Math.sin(phase+phaseShift-u*9)*.60+Math.sin(phase*.68-u*17)*.29)*width*belly;
          const flicker=.83+.17*Math.sin(phase*1.3-u*23+side);
          pts.push([u*length,offset*u+bend+side*(.7*(1-u)+belly*width*flicker)]);
        }
      }
      shape(g,pts,gradient(g,0,0,length,0,...colors));
    }
    const w=Math.min(12,3+len*.064);
    tongue(len,w,0,0,['#ffaa33a8','#ff7e19e8','#ec4b10df','#b8320b16']);
    tongue(len*.91,w*.65,-1,.65,['#fffaaa','#ffcf47','#ff8d19','#ff7d1610']);
    tongue(len*.64,w*.31,0,.25,['#eafffb','#fff5a1','#ffd443','#ffb32722']);
    g.restore();
  }
  function round(g,p) {
    if(p.type==='disc'){
      g.save();g.translate(p.x,p.y);g.rotate((p.total-p.remaining)*.11);
      for(let i=0;i<5;i++){
        shape(g,[[1,-1],[6,-2],[4,2],[1,3]],'#f6bb73','#795c42');g.rotate(tau/5);
      }
      oval(g,0,0,2.6,2.6,'#526969');g.restore();return;
    }
    const colors={seeker:'#9af4cf',frost:'#96edff',venom:'#cbeb6f',flame:'#ff9852',rocket:'#ffc187',mortar:'#e8c79b',sniper:'#fff5d2'};
    const color=colors[p.type]||'#ffe3a1';
    const shell=['mortar','rocket','seeker'].includes(p.type);
    const arc=p.type==='mortar'&&p.total?Math.sin(Math.PI*(1-p.remaining/p.total))*24:0;
    g.save();g.translate(p.x,p.y-arc);g.rotate(Math.atan2(p.dy,p.dx));
    shape(g,[[-(shell?12:8),0],[1,-1.6],[4,0],[1,1.6]],color+'a8');
    oval(g,1,0,shell?4.3:2.4,shell?2.4:1.25,shell?'#4c5853':color);
    oval(g,2,-.4,shell?2.1:1.3,.8,color);g.restore();
  }
  function effect(g,e){
    g.save();g.lineCap=g.lineJoin='round';
    if(e.solar){
      const beam=[[e.x,e.y],[e.x2,e.y2]],power=Math.max(.05,e.time/.22);
      g.globalAlpha=power;
      line(g,beam,'#f19a4477',12);line(g,beam,'#ffd884',5);line(g,beam,'#fff8d9',2);
      oval(g,e.x2,e.y2,7*power,7*power,'#ffcf7ad9');
    }else if(e.prism){
      const beam=[[e.x,e.y],[e.x2,e.y2]];
      line(g,beam,e.color+'88',4.5);line(g,beam,'#ffe7fc',1.4);
      oval(g,e.x2,e.y2,2.7,2.7,'#ffd2ec');
    }else if(e.flash){
      const r=4+3*Math.min(1,e.time/.08);
      oval(g,e.x,e.y,r*1.2,r*1.2,e.color+'44');
      const points=[];for(let i=0;i<10;i++){const a=i*tau/10,dist=i%2?r*.32:r;points.push([e.x+Math.cos(a)*dist,e.y+Math.sin(a)*dist]);}
      shape(g,points,'#fff1bb');
    }else if(e.r){
      const r=Math.max(.1,e.r*(1-e.time/.3));
      oval(g,e.x,e.y,r,r,e.color+'21');g.strokeStyle=e.color;g.lineWidth=1.8;g.stroke();
    }else{
      const dx=e.x2-e.x,dy=e.y2-e.y,points=[[e.x,e.y],[e.x+.34*dx-.043*dy,e.y+.34*dy+.043*dx],[e.x+.59*dx+.035*dy,e.y+.59*dy-.035*dx],[e.x2,e.y2]];
      line(g,points,e.color+'65',4);line(g,points,'#e3ffff',1.3);
    }
    g.restore();
  }
  return {landscape,roadOutline,terrain,waterways,foundation,tower,zombie,infantry,flameJet,round,effect};
})();
