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
    Meadow: {ground:['#a8b483','#93a67a','#7c986e'],road:['#c3aa82','#decca2','#c2ae84'],edge:'#979772'},
    Forest: {ground:['#789885','#638675','#41685f'],road:['#ae9771','#c9b38a','#aa9574'],edge:'#77846b'},
    Quarry: {ground:['#b28166','#be9573','#986c59'],road:['#dac3a4','#e4c9a1','#c7a582'],edge:'#957259'},
    'Ruined town': {ground:['#77847e','#7f867c','#677573'],road:['#4e585b','#646c6c','#545f62'],edge:'#a4a69a'},
    Wetlands: {ground:['#749e90','#83a699','#5f8d88'],road:['#b8aa86','#d0c19a','#bcae8a'],edge:'#648073'}
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
  function basin(g,x,y,rx,ry,quarry,random){
    g.save();g.translate(x,y);g.scale(rx,ry);
    const colors=quarry?['#8d614b','#c99872','#a3775f','#bb8d6e','#735d51']:['#a5b594','#628f82','#487c78','#447774'];
    const phase=random()*tau;
    colors.forEach((color,i)=>{
      const r=1-i*(quarry?.13:.09),points=[];
      for(let j=0;j<40;j++){
        const a=j*tau/40,edge=r*(.92+.048*Math.sin(a*3+phase)+.032*Math.sin(a*5+phase));
        points.push([Math.cos(a)*edge,Math.sin(a)*edge+i*.016]);
      }
      shape(g,points,color);
    });
    g.restore();
    for(let i=0;i<14;i++){
      const px=x+(random()-.5)*rx,py=y+(random()-.5)*ry*.8;
      line(g,[[px,py],[px+3+random()*7,py-.6]],quarry?'#cfab897a':'#add4bb7c',1);
    }
  }
  function terrain(map, routes, segments, distance, seed) {
    const {width,height,setting}=map, {canvas,g}=surface(width,height,2),random=seeded(seed);
    const palette=terrainColors[setting],exit=routes[0].points.at(-1);
    const urban=setting==='Ruined town',quarry=setting==='Quarry',marsh=setting==='Wetlands';
    g.fillStyle=gradient(g,0,0,width,height,...palette.ground);g.fillRect(0,0,width,height);
    if(urban){
      for(let y=-20;y<height;y+=85)for(let x=-38;x<width;x+=115){
        box(g,x,y,110,80,3,random()<.55?'#8a908533':'#6977734f');
        line(g,[[x,y+81],[x+111,y+81],[x+111,y]],'#5966618c',1.3);
        if(random()<.4)line(g,[[x+25,y+16],[x+30,y+24],[x+36,y+22],[x+39,y+31]],'#54605b99',1);
      }
    }else{
      for(let i=0;i<34;i++){
        const cx=random()*width,cy=random()*height,radius=35+random()*105,phase=random()*tau;
        for(let j=0;j<(quarry?5:3);j++){
          const ring=[];
          for(let a=0;a<tau;a+=tau/80){
            const r=(radius-j*radius*.16)*(1+.13*Math.sin(a*3+phase)+.06*Math.cos(a*5-phase));
            ring.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*.57]);
          }
          shape(g,ring,quarry?'#e8b0880b':'#dbe1b007');
          line(g,[...ring,ring[0]],quarry?'#815d4b66':'#d4dec535',quarry?1.6:.9);
        }
      }
    }
    // Uneven verges stay within a few world units of the collision boundary.
    const shoulders=segments.map(({a,b,width})=>{
      const length=Math.hypot(b.x-a.x,b.y-a.y),nx=(a.y-b.y)/length,ny=(b.x-a.x)/length;
      const edges=[[],[]];
      for(let side=0;side<2;side++){
        const sign=side?1:-1, steps=Math.ceil(length/6);
        for(let i=0;i<=steps;i++){
          const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
          const drift=1.5*Math.sin(x*.066+y*.028)+.7*Math.cos(y*.15-x*.13);
          const w=sign*(width*.5+drift);
          edges[side].push([x+nx*w,y+ny*w]);
        }
      }
      return [...edges[0],...edges[1].reverse()];
    });
    const dust=gradient(g,0,0,width,height,...palette.road);
    for(const [extra,color] of [[12,palette.edge],[6,urban?'#c2beb0':palette.edge],[0,dust]]){
      segments.forEach(({a,b,width},i)=>{
        for(const point of [a,b])oval(g,point.x,point.y,(width+extra)/2,(width+extra)/2,color);
        shape(g,shoulders[i],color);
        if(extra){g.lineWidth=extra;g.strokeStyle=color;g.stroke();}
      });
    }
    // Faint wheel ruts carry the eye through forks without marking enemy lanes.
    for(const route of routes){
      for(const offset of urban?[0]:[-11,11]){
        const knots=route.points.map((p,i)=>[p.x,p.y+offset+Math.sin(i*1.6)*4]);
        g.beginPath();g.moveTo(...knots[0]);
        for(let i=1;i<knots.length-1;i++){
          const [x,y]=knots[i],next=knots[i+1];
          g.quadraticCurveTo(x,y,(x+next[0])/2,(y+next[1])/2);
        }
        g.lineTo(...knots[knots.length-1]);g.strokeStyle=urban?'#ddc78c80':'#856b4821';
        if(urban)g.setLineDash([12,16]);g.lineWidth=2;g.stroke();g.setLineDash([]);
      }
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
    const clumps={Meadow:32,Forest:170,Quarry:58,Wetlands:155,'Ruined town':32};
    for(let i=0;i<clumps[setting];i++){
      const cx=random()*width,cy=random()*height;
      for(let j=0;j<2+random()*5;j++){
        const x=cx+(random()-.5)*75,y=cy+(random()-.5)*44,h=11+random()*26;
        if(distance(x,y-h*.5)>h*.65 && (x<exit.x-56 || Math.abs(y-exit.y)>90))groves.push({x,y,h});
      }
    }
    groves.sort((a,b)=>a.y-b.y);
    for(const [i,{x,y,h}] of groves.entries()){
      oval(g,x+h*.13,y-1,h*.31,h*.10,'#344c453d',-.18);
      if(marsh){
        for(let k=-1;k<=1;k++){
          line(g,[[x+k*2,y],[x+k*4-1,y-h*.40]],'#57745d',1.3);
          oval(g,x+k*4-1,y-h*.4,1.2,2.6,'#8a7955',-.2);
        }
      }else if(quarry || i%7===0){

        shape(g,[[x-8,y],[x-7,y-5],[x-1,y-9],[x+6,y-6],[x+9,y-1],[x+4,y+2]],quarry?'#9b7962':'#859992');
        shape(g,[[x-7,y-5],[x-1,y-9],[x+6,y-6],[x+1,y-4]],quarry?'#e3c59d':'#bac4ae');
      }else if(setting==='Meadow'||urban){
        if(i%3===0){
          oval(g,x,y-h*.17,h*.39,h*.29,'#627e58');
          oval(g,x-h*.08,y-h*.25,h*.31,h*.21,'#8ba56c');
        }else for(let k=0;k<4;k++)oval(g,x+random()*7,y+random()*4,1.45,1.1,'#f0d8a4');
      }else pine(g,x,y,h,i%3?'#3e6156':'#476d5d',i%3?'#668674':'#799782');
    }
    for(const [x,y,rx,ry] of map.landmarks){
      if(urban)ruins(g,x,y,rx,ry,random);
      else basin(g,x,y,rx,ry,quarry,random);
    }
    // Fortified gate at the road exit with side towers and amber landing lights.
    g.save();g.translate(exit.x,exit.y);
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
  function tower(type, accent) {
    const {canvas,g}=surface(64,64,4);g.translate(32,32);
    oval(g,1.5,3,21,20,'#182b2e6b');
    oval(g,0,0,21,21,'#253c40');
    oval(g,0,-1,19.5,19.5,gradient(g,-15,-18,12,15,'#c3ccbb','#778d88','#526969'));
    oval(g,0,0,15.8,15.8,'#455b5b');
    for(let i=0;i<8;i++){let a=i*tau/8;oval(g,Math.cos(a)*17.5,Math.sin(a)*17.5,1,1,'#d5d9c4');}
    const metal=gradient(g,0,-8,0,8,'#d1d6c4','#819994','#486060');
    const plate=(x,y,w,h,r=2)=>{box(g,x,y+.9,w,h,r,ink);box(g,x,y,w,h-1,r,metal);};
    const barrel=(x,y,len,thick)=>{
      box(g,x,y-thick/2,len,thick,1.4,ink);
      box(g,x+1,y-thick/2+.6,len-2,Math.max(1,thick*.36),.6,'#b9c8c0');
      box(g,x+len-4,y-thick*.56,4,thick*1.12,1,'#34494b');
    };
    if(type==='barracks'){
      box(g,-14,-12,30,25,3,ink);
      shape(g,[[-16,-2],[-11,-14],[8,-14],[17,-2]],'#acbda8',ink);
      shape(g,[[-16,-2],[17,-2],[11,11],[-11,11]],'#738e7e',ink);
      for(const x of [-7,5])line(g,[[x,-13],[x+4,-2],[x+1,9]],'#dfdaca',1.8);
      shape(g,[[-15,-2],[-9,-10],[-6,-2],[-8,8],[-11,8]],'#324c46');
      line(g,[[10,-12],[12,-21]],ink,1.3);oval(g,12,-21,1.5,1.5,'#ffa574');
    }else if(['pulse','lightning','frost'].includes(type)){
      for(let i=0;i<3;i++){g.save();g.rotate(i*tau/3);plate(4,-4,14,8);box(g,10,-2,7,3,1,accent);g.restore();}
      oval(g,0,0,11,11,ink);
      if(type==='frost'){
        shape(g,[[-8,-2],[-3,-10],[7,-8],[10,0],[4,9],[-6,7]],accent,ink);
        shape(g,[[-3,-10],[2,0],[-6,7],[-8,-2]],'#e4fffd');shape(g,[[2,0],[10,0],[4,9],[-6,7]],'#5695a7');
      }else{
        oval(g,0,0,9,9,type==='pulse'?'#807799':'#658f93');
        for(const r of [7,4]){g.beginPath();g.arc(0,0,r,.4,6);g.strokeStyle=accent;g.lineWidth=1.5;g.stroke();}
        oval(g,-1,-1,2.5,2.5,'#e6fff6');
        if(type==='lightning')line(g,[[-7,3],[-1,-4],[0,1],[7,-5]],'#edffff',1.4);
      }
    }else if(type==='rocket'){
      for(const y of [-8,2]){plate(-12,y-1,31,10,3);box(g,12,y,8,7,1.5,ink);for(const k of [2,5])oval(g,16,y+k,2.2,1.2,'#ffae7d');box(g,-7,y,4,7,1,accent);}
    }else if(type==='mortar'){
      plate(-12,-9,24,20);oval(g,1,0,12,10,'#36484b',-.28);oval(g,4,-2,10,9,metal,-.28);
      oval(g,6,-3,7,6,ink,-.28);oval(g,7,-4,4.5,3.5,'#192c30',-.28);box(g,-12,5,7,3,1,accent);
    }else{
      plate(-13,-10,24,20,6);box(g,-11,-7,8,14,3,'#4c686a');box(g,-9,-5,3,9,1,accent);
      if(type==='minigun'){for(const y of [-4,0,4])barrel(6,y,20,3);plate(10,-6,4,13);plate(20,-6,3,13);}
      else if(type==='shotgun'){for(const y of [-3.5,3.5])barrel(5,y,17,5.5);}
      else if(type==='venom'||type==='flame'){
        for(const y of [-7,7]){box(g,-12,y-3,13,6,3,ink);box(g,-10,y-2.5,9,4.5,2,accent);}
        barrel(5,0,16,5);shape(g,[[15,-3],[23,-5],[23,5],[15,3]],type==='flame'?'#c57e52':'#829e65',ink);
      }else{
        const sniper=type==='sniper',heavy=type==='cannon';
        barrel(5,0,sniper?25:heavy?19:16,heavy?9:sniper?3.8:5);
        plate(-2,-5,13,10,3);
        if(sniper){box(g,-2,-8,12,3.5,1.5,'#31454a');oval(g,9,-6,1.2,1.2,'#e8bd76');}
        if(heavy)for(const x of [13,17])line(g,[[x,-3],[x,3]],ink,1);
      }
    }
    return canvas;
  }
  function zombie(kind,skin,step){
    // Trace the early walker's wide brow, torn shoulders and two forward hands
    // in continuous curves. Each arm has its own sleeve, wrist and finger line.
    const {canvas,g}=surface(34,28,6);g.translate(14,14);
    function piece(path,fill,edge='#293427',weight=.7){
      const outline=new Path2D(path);
      g.fillStyle=fill;g.fill(outline);
      if(edge){g.strokeStyle=edge;g.lineWidth=weight;g.stroke(outline);}
    }
    oval(g,0,1.5,9,6.8,'#28352f40');
    piece('M-8 -6 Q-6 -8 -2 -7 L1 -4 -1 4 -6 7 -8 6 -6 3 -9 4 -8 0 -10 -1 -7 -3 Z','#69604b');
    function arm(side,shift){
      g.save();g.scale(1,side);g.translate(shift,0);
      piece('M-4 -5 Q-4 -9 -1 -10 L3 -10 5 -8 3 -6 -1 -6 Z','#69654d');
      piece('M1 -9.7 L4.2 -10.5 8 -9.7 11 -9.4 13 -10.2 Q15 -10.6 16 -10 L13.7 -9 16 -9 Q17 -8.8 15.8 -8.2 L13.8 -7.8 10.4 -7.9 9.1 -7.1 8.5 -7.3 9 -8.3 5.6 -8 2 -7.3 Z',skin);
      piece('M-3 -9 Q-1 -11 2 -10.5 L3.5 -10 3 -8.9 2.2 -9.2 1.6 -7.9 .8 -8.5 -.4 -7.7 -2 -8 Z','#4e5946');
      line(g,[[4,-9.8],[6,-9.1],[7,-9.3]],'#924f43',.95);g.restore();
    }
    arm(1,step*1.15);arm(-1,-step*1.15);
    piece('M-6 -4 Q-6 -6.3 -2 -6.8 L2 -6.1 4 -4.6 3 5 -1 6.6 -4 5.5 -5 6 -5.6 3.5 -7 3 -6.2 .4 -7.1 -1.4 Z','#71604e');
    piece('M-4.4 -4.6 L-1 -5.8 1 -4.8 -1 -2 -3 -2.9 Z','#525d46');
    piece('M-4.6 2.8 L-1.9 1.3 .5 4.1 -2.2 5.6 Z','#5a473c');
    piece('M-2.8 -4 Q-1.3 -6 2 -5.7 Q5.1 -5.7 6.2 -4 L7 -2.1 8 -.9 7.5 .3 8 1.4 7.2 3.8 5.3 4.9 3.4 5.4 -.2 5.2 -2.5 3.2 -3.5 .9 Z',skin);
    piece('M-.9 -4.5 Q1.1 -5.8 3.4 -4.9 L2 -4.1 2.6 -3.3 .4 -3.3 -.3 -1.7 -1.6 -2.5 Z','#8b4b44',null);
    piece('M4.1 -3.9 Q6.1 -4.1 6.8 -2.8 L6.9 -1.2 5.9 -.6 5.2 -1.3 4.7 -1 Z M5.4 .7 L6.7 .4 7.2 1.8 6.8 3.2 5.2 3.7 4.7 2.6 Z','#343b2d',null);
    line(g,[[5.8,-2.8],[6.5,-2.1]],'#f2e9bc',.92);line(g,[[5.75,2.65],[6.5,2.0]],'#f2e9bc',.92);
    piece('M6.8 -.4 L8 -.6 8.6 .6 7.5 1.4 7.6 .3 Z','#795347',null);
    line(g,[[2,4.9],[3.7,3.6],[4.5,4.1]],'#8b5247',.7);
    if(kind==='armor'){
      piece('M-3.8 -3.3 Q-2 -6.8 1.4 -6.2 L3.5 -5.6 3.3 -3.7 2.7 -1.9 2.9 1.9 3.6 4.1 2.2 5.5 Q-1 6.1 -3.6 3.2 Z','#6e7a71');
      line(g,[[-2.7,-3],[0,-4.9],[2.3,-4.6]],'#a5af96',.9);
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
  function round(g,p) {
    const colors={frost:'#96edff',venom:'#cbeb6f',flame:'#ff9852',rocket:'#ffc187',mortar:'#e8c79b',sniper:'#fff5d2'};
    const color=colors[p.type]||'#ffe3a1';
    const shell=p.type==='mortar'||p.type==='rocket';
    const arc=p.type==='mortar'&&p.total?Math.sin(Math.PI*(1-p.remaining/p.total))*24:0;
    g.save();g.translate(p.x,p.y-arc);g.rotate(Math.atan2(p.dy,p.dx));
    shape(g,[[-(shell?12:8),0],[1,-1.6],[4,0],[1,1.6]],color+'a8');
    oval(g,1,0,shell?4.3:2.4,shell?2.4:1.25,shell?'#4c5853':color);
    oval(g,2,-.4,shell?2.1:1.3,.8,color);g.restore();
  }
  function effect(g,e){
    g.save();g.lineCap=g.lineJoin='round';
    if(e.flash){
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
  return {landscape,terrain,tower,zombie,infantry,round,effect};
})();
