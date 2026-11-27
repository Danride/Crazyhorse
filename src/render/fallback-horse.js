'use strict';
// Compact animated placeholder, used only while the original model downloads or is unavailable.
// No external resources, no per-frame mesh rebuilding.
const fallbackHorseMeshes=new Map();
function makeFallbackHorseMesh(kind){
 const coat=col((skinSwatches[kind]||skinSwatches[FREE_SKIN]).slice(1)),mane=shade(coat,.47),hoof=col('302923'),nose=shade(coat,.77);
 const positions=[],colors=[],indices=[],headIndices=[],clips={};
 let frame=0,point=0;
 function cuboid(x,y,z,w,h,d,c,rot=0,isHead=false){
  const co=Math.cos(rot),si=Math.sin(rot);
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2,y+b*h/2*co-e*d/2*si,z+b*h/2*si+e*d/2*co]);
  const faces=[[0,1,2,3,.78],[5,4,7,6,.86],[4,0,3,7,.90],[1,5,6,2,.66],[3,2,6,7,1],[4,5,1,0,.53]];
  for(const [a,b,e,f,light] of faces){
   const start=point;
   for(const k of [a,b,e,f]){positions.push(...corners[k].map(v=>Math.round(v*1000)));if(!frame)colors.push(...shade(c,light).map(v=>Math.round(clamp(v,0,1)*255)));point++;}
   if(!frame){const ix=[start,start+1,start+2,start,start+2,start+3];indices.push(...ix);if(isHead)headIndices.push(...ix);}
  }
 }
 for(const [name,count,amp] of [['Idle',4,0],['Walk',8,.20],['Run',8,.42]]){
  clips[name]={start:frame,count,duration:name==='Idle'?3:name==='Walk'?1.1:.6};
  for(let k=0;k<count;k++){
   point=0;const t=k/count*Math.PI*2,bob=amp*.09*Math.cos(t*2);
   cuboid(0,1.35+bob,0,.78,.70,1.66,coat);
   cuboid(0,1.29+bob,-.65,.73,.60,.65,coat);
   cuboid(0,1.37+bob,.64,.70,.70,.55,coat);
   cuboid(0,1.75+bob,.82,.46,.91,.48,coat,.53,true);
   cuboid(0,2.14+bob,1.16,.47,.48,.68,coat,-.17,true);
   cuboid(0,1.99+bob,1.49,.43,.32,.45,nose,-.16,true);
   cuboid(0,1.87+bob,.56,.26,.81,.19,mane,.53,true);
   for(const s of [-1,1]){
    cuboid(s*.16,2.48+bob,1.03,.14,.32,.15,coat,.12,true);
    cuboid(s*.242,2.18+bob,1.29,.025,.095,.105,hoof,0,true);
    for(const end of [-1,1]){
     const a=t+(s*end===1?0:Math.PI),swing=Math.sin(a)*amp,lift=Math.max(0,Math.sin(a+.7))*amp*.33;
     cuboid(s*.29,.94+bob,end*.62+swing*.32,.20,.64,.21,coat,swing*.8);
     cuboid(s*.29,.38+lift,end*.62+swing*.75,.14,.57,.15,shade(coat,.83),-swing*.45);
     cuboid(s*.29,.12+lift,end*.62+swing,.22,.21,.29,hoof);
    }
   }
   cuboid(0,.99+bob,-1.13,.21,.72,.23,mane,-.40);
   if(kind===7){cuboid(.396,1.40+bob,-.22,.025,.42,.55,col('e8ddc8'));cuboid(-.396,1.40+bob,-.22,.025,.42,.55,col('e8ddc8'));}
   if(kind===9)for(let z=-.60;z<.7;z+=.25)for(const s of [-1,1])cuboid(s*.397,1.35+bob,z,.025,.65,.085,col('303036'));
   if(kind===11)for(const s of [-1,1])cuboid(s*.19,2.57+bob,.88,.14,.40,.15,col('362331'),.3,true);
   if(kind===13)cuboid(0,2.49+bob,1.38,.13,.59,.13,col('e9cd89'),.37,true);
   if(kind===10)for(let j=0;j<4;j++)cuboid(0,1.64+bob+j*.20,.52+j*.10,.29,.45,.25,col(j%2?'f5ab37':'e44c20'),.55,true);
   frame++;
  }
 }
 const m={n:point,clips,frames:staticBuffer(gl.ARRAY_BUFFER,new Int16Array(positions)),colors:staticBuffer(gl.ARRAY_BUFFER,new Uint8Array(colors)),index:staticBuffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices)),head:staticBuffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(headIndices)),count:indices.length,headCount:headIndices.length,fallback:true};
 return m;
}
function fallbackHorseMesh(kind){if(!fallbackHorseMeshes.has(kind))fallbackHorseMeshes.set(kind,makeFallbackHorseMesh(kind));return fallbackHorseMeshes.get(kind);}
