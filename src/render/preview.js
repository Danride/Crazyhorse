'use strict';
// A separate stable scene built using the existing voxel geometry pipeline.
const stableColors={wood:col('744629'),beam:col('553420'),edge:col('aa7544'),stone:col('716054'),hay:col('c99a45'),red:col('7e2928'),gold:col('d6ab5c'),iron:col('4a4140')};
let stableGeo=null,stableGeoN=0;
function stableBox(x,y,z,w,h,l,c){box(x,y,z,w,h,l,c);}
function stableLantern(x,y,z){
 const c=stableColors;box(x,y,z,.42,.09,.42,c.iron);box(x,y+.50,z,.48,.10,.48,c.iron);
 box(x,y+.09,z,.32,.41,.32,col('ffc471'));
 for(const dx of [-.18,.18])for(const dz of [-.18,.18])box(x+dx,y+.08,z+dz,.052,.44,.052,c.beam);
 box(x,y+.60,z,.15,.13,.15,c.iron);
}
function stableBarrel(x,z,s=1){
 const c=stableColors;for(let i=0;i<10;i++){let a=i*Math.PI/5,b=(i+1)*Math.PI/5;for(const [y0,y1,r0,r1,color] of [[0,.12,.43,.45,c.wood],[.12,.43,.45,.51,c.wood],[.43,.79,.51,.45,c.wood],[.79,.91,.45,.43,c.wood]])quad([x+Math.cos(a)*r0*s,y0*s,z+Math.sin(a)*r0*s],[x+Math.cos(b)*r0*s,y0*s,z+Math.sin(b)*r0*s],[x+Math.cos(b)*r1*s,y1*s,z+Math.sin(b)*r1*s],[x+Math.cos(a)*r1*s,y1*s,z+Math.sin(a)*r1*s],shade(color,.74+.24*Math.cos(a+.8)));for(let y of [.15,.67])quad([x+Math.cos(a)*.52*s,y*s,z+Math.sin(a)*.52*s],[x+Math.cos(b)*.52*s,y*s,z+Math.sin(b)*.52*s],[x+Math.cos(b)*.52*s,(y+.08)*s,z+Math.sin(b)*.52*s],[x+Math.cos(a)*.52*s,(y+.08)*s,z+Math.sin(a)*.52*s],c.iron);vertex([x,.92*s,z],c.edge);vertex([x+Math.cos(a)*.43*s,.92*s,z+Math.sin(a)*.43*s],c.edge);vertex([x+Math.cos(b)*.43*s,.92*s,z+Math.sin(b)*.43*s],c.edge);}
}
function stableHay(x,y,z,w=1.35){
 const c=stableColors;box(x,y,z,w,.73,.92,c.hay);for(const off of [-.32,.32])box(x+off*w,y+.003,z,.055,.74,.94,col('8c622c'));for(let i=0;i<16;i++){const u=(hash(i+x*29)-.5)*w,v=(hash(i+z*13)-.5)*.8;box(x+u,y+.73,z+v,.07,.025,.27,shade(c.hay,.82+hash(i+3)*.3));}
}
function stablePlatform(z){
 const c=stableColors,N=12;for(let i=0;i<N;i++){const a=i*2*Math.PI/N,b=(i+1)*2*Math.PI/N;const p=[Math.cos(a)*1.95,0,z+Math.sin(a)*1.7],q=[Math.cos(b)*1.95,0,z+Math.sin(b)*1.7];vertex([0,0,z],c.edge);vertex(p,shade(c.edge,.92+hash(i)*.12));vertex(q,c.edge);quad(p,q,[q[0],-.38,q[2]],[p[0],-.38,p[2]],shade(c.wood,.79+hash(i+4)*.2));quad([p[0],-.08,p[2]],[q[0],-.08,q[2]],[q[0],-.13,q[2]],[p[0],-.13,p[2]],c.edge);}
 for(let k=-6;k<=6;k++){let x=k*.27;let l=1.6*Math.sqrt(Math.max(0,1-(x/1.95)**2));flat(x-.009,x+.009,z-l,z+l,.002,shade(c.wood,.66));}
 box(0,-.37,z-1.715,.83,.37,.025,c.red);box(0,-.36,z-1.735,.85,.035,.02,c.gold);box(0,-.25,z-1.74,.06,.18,.025,c.gold);box(0,-.18,z-1.74,.23,.04,.025,c.gold);
}
function buildStableGeometry(){
 const c=stableColors;rawModel=true;
 // Stone paving and sunlit aisle.
 for(let zi=0;zi<20;zi++)for(let xi=-12;xi<=12;xi++){let x=xi*.77+(zi%2)*.385,z=zi*.67-.25;box(x,-.51,z,.755,.10,.65,shade(c.stone,.72+hash(xi*53+zi*19)*.42));}
 flat(-14,14,13,35,-.52,col('817748'));
 // Rear wall, open gateway and distant castle silhouette.
 for(let side of [-1,1]){for(let j=0;j<7;j++)for(let k=0;k<8;k++){let x=side*(2.45+k*.88+(j%2)*.30);box(x,j*.49-.4,12.7,.86,.475,.55,shade(c.stone,.70+hash(k*11+j*37+side)*.33));}}
 box(0,3.55,12.5,4.6,.38,.55,c.beam);box(0,4.0,12.6,17,1.8,.55,c.wood);
 for(let side of [-1,1]){
  // Timber frame, side planks, stalls and roof rafters.
  for(let z of [1.4,5.1,8.8,12.4]){box(side*5.25,-.42,z,.40,5.8,.42,c.beam);box(side*5.04,-.42,z,.10,5.8,.46,c.edge);box(side*3.1,4.75,z,4.6,.30,.34,c.wood);}
  for(let k=0;k<14;k++)box(side*5.55,-.4+k*.34,7,.22,.33,12,c.wood);
  box(side*5.0,3.4,7,.27,.25,12,c.beam);box(side*5.05,.40,7,.22,.15,12,c.edge);
  for(let z of [6.8,9.3,11.8])box(side*3.85,-.35,z,.16,1.45,.16,c.beam);
  box(side*3.85,.56,9.3,.16,.13,5.2,c.wood);box(side*3.85,1.00,9.3,.16,.13,5.2,c.edge);
  for(let z of [3.7,7.8,11.6]){let from=n;box(side*2.7,5.0,z,5.7,.25,.24,c.beam); // horizontal rafters
  }
  for(let k=0;k<7;k++)box(side*(.4+k*.78),5.24,7,.68,.18,12,shade(c.wood,.66+hash(k+side)*.21));
  stableHay(side*4.3,-.4,8.1);stableHay(side*4.35,.33,8.05);stableHay(side*3.9,-.4,9.4);stableBarrel(side*4.55,5.8,1.15);stableBarrel(side*4.7,6.9,.85);
  stableLantern(side*4.82,2.50,5.1);stableLantern(side*3.0,.03,8.5);
  box(side*4.8,1.32,4.6,.075,.08,.8,c.beam);
  box(side*3.38,1.85,12.35,.94,1.68,.04,c.red);box(side*3.38,1.85,12.30,.98,.06,.03,c.gold);
  box(side*3.38,3.43,12.30,1.08,.08,.08,c.gold);
  // Golden heraldic horse motif on the banners.
  box(side*3.38,2.46,12.28,.34,.32,.035,c.gold);box(side*3.38+.17,2.70,12.28,.16,.30,.035,c.gold);box(side*3.38+.26,2.91,12.28,.19,.13,.035,c.gold);
  for(let dx of [-.12,.11])box(side*3.38+dx,2.22,12.28,.065,.30,.035,c.gold);
 }
 // Background visible through gateway, with geometric castle towers and fence.
 for(let j=0;j<9;j++){let x=-4+j*.95;box(x,-.40,22,1.0,2.4+hash(j*7)*1.8,1.9,col('8d806c'));}
 for(let x of [-3.1,0,3.1]){box(x,-.40,22,1.3,4.7,1.5,col('a29077'));for(let k=0;k<3;k++)box(x+(k-1)*.49,4.3,22,.29,.45,1.5,col('a29077'));box(x,4.65,22,.045,1.15,.045,c.beam);box(x+.28,5.32,22,.56,.27,.04,c.red);}
 for(let side of [-1,1])for(let i=0;i<5;i++){let x=side*(3+i*1.4);box(x,-.5,15,.15,1.1,.15,c.beam);box(x,.12,15,1.5,.12,.13,c.wood);}
 // Carpet, scattered straw and front pedestal.
 flat(-1.3,1.3,.1,4.2,-.396,c.red);for(let side of [-1,1])flat(side*1.15-.025,side*1.15+.025,.1,4.2,-.391,c.gold);
 for(let i=0;i<80;i++){let x=(hash(i*41)*2-1)*6.8,z=hash(i*17+2)*12;if(Math.abs(x)<2.1&&Math.abs(z-6.3)<2)continue;let y=-.388;let from=n;box(x,y,z,.035,.025,.19+hash(i+11)*.23,shade(c.hay,.8+hash(i+4)*.3));rotateRange(from,x,z,hash(i*9)*6.28);}
 stablePlatform(6.3);stableLantern(-2.2,-.4,5.05);stableLantern(2.2,-.4,5.05);
 // Baked warm light from lanterns and the gateway, no extra shader or GPU light cost.
 const lights=[[-4.82,2.85,5.1],[4.82,2.85,5.1],[-3,.35,8.5],[3,.35,8.5],[-2.2,-.05,5.05],[2.2,-.05,5.05]];
 for(let i=0;i<n;i+=6){let x=verts[i],y=verts[i+1],z=verts[i+2],warm=0;
  for(const a of lights){let d=(x-a[0])**2+(y-a[1])**2+(z-a[2])**2;warm+=.32/(1+d*1.35);}
  warm+=.16*Math.exp(-((x*x)*.24+(z-12.5)**2*.14))*Math.max(0,1-y*.12);
  verts[i+3]=clamp(verts[i+3]*(.92+warm)+warm*.11,0,1);
  verts[i+4]=clamp(verts[i+4]*(.91+warm*.73)+warm*.035,0,1);
  verts[i+5]=clamp(verts[i+5]*(.90+warm*.32),0,1);
 }
 rawModel=false;
}
function renderPreview(){
 gl.uniform1f(uChunk,0);gl.uniform2f(uFogRange,28,65);gl.uniform2f(uWeatherTone,0,1);gl.uniform1f(uMesh,0);
 clearBubbles();ctx.clearRect(0,0,W,H);gl.disable(gl.SCISSOR_TEST);gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const catalog=$('mainMenu').dataset.pane==='skins',small=W<=760||catalog,r=small?$('previewFrame').getBoundingClientRect():{left:0,top:0,right:W,bottom:H,width:W,height:H};
 if(r.width<2||r.height<2||r.bottom<=0||r.top>=H)return;
 gl.viewport(Math.round(r.left*dpr),Math.round((H-r.bottom)*dpr),Math.round(r.width*dpr),Math.round(r.height*dpr));
 gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.max(0,Math.round(r.left*dpr)),Math.max(0,Math.round((H-r.bottom)*dpr)),Math.max(0,Math.round((Math.min(W,r.right)-Math.max(0,r.left))*dpr)),Math.max(0,Math.round((Math.min(H,r.bottom)-Math.max(0,r.top))*dpr)));
 n=0;meshJobs=[];curveOrigin=0;gl.uniform3f(uFog,.64,.45,.31);
 if(!stableGeo){buildStableGeometry();stableGeo=verts.slice(0,n);stableGeoN=n;}else{if(verts.length<stableGeoN)verts=new Float32Array(stableGeoN*2);verts.set(stableGeo);n=stableGeoN;}
 const aspect=r.width/r.height,f=small?2.45*Math.min(1,aspect/.9):2.02;
 // Subtle dust motes, restricted to the menu. Stable mesh itself is cached.
 for(let i=0;i<24;i++){let x=(hash(i*13+1)*2-1)*5.1,y=.2+hash(i*23+4)*3.9+Math.sin(menuAngle*.7+i)*.13,z=3+hash(i*37+8)*9;let s=.018+hash(i)*.012;box(x+Math.sin(menuAngle*.3+i)*.13,y,z,s,s,s,col('dcb17a'));}
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(ac,3,gl.FLOAT,false,24,12);gl.bufferData(gl.ARRAY_BUFFER,verts.subarray(0,n),gl.DYNAMIC_DRAW);
 gl.uniform3f(ul,f/aspect,f,0);gl.uniform4f(uc,0,small?2.0:2.55,0,small?.18:.22);gl.drawArrays(gl.TRIANGLES,0,n/6);
 const yaw=-.92+Math.sin(menuAngle*.35)*.12;queueHorse(0,6.3,yaw,previewSkin,menuAngle*.25,0,Math.sin(menuAngle*.85)*.09,false);drawHorses();
 gl.disable(gl.SCISSOR_TEST);gl.uniform2f(uFogRange,125,580);
}
