'use strict';
// Separate NPC asset; never included in skinNames, inventory, or the player preview.
let policeMesh=null,policeAssetLoading=false;
function decodePoliceFrames(a){
 const src=decode64(a.frames),out=new Uint8Array(a.frameBytes);let i=0,j=0;
 while(i<src.length){
  const t=src[i++];let lit=t>>4;
  if(lit===15){let v;do{if(i>=src.length)throw Error('Police literal');v=src[i++];lit+=v;}while(v===255);}
  if(i+lit>src.length||j+lit>out.length)throw Error('Police block range');
  out.set(src.subarray(i,i+lit),j);i+=lit;j+=lit;if(i===src.length)break;
  if(i+2>src.length)throw Error('Police offset');const off=src[i]|src[i+1]<<8;i+=2;
  if(!off||off>j)throw Error('Police back-reference');
  let len=(t&15)+4;if((t&15)===15){let v;do{if(i>=src.length)throw Error('Police match');v=src[i++];len+=v;}while(v===255);}
  if(j+len>out.length)throw Error('Police block overflow');
  for(let k=0;k<len;k++)out[j+k]=out[j-off+k];j+=len;
 }
 if(j!==out.length)throw Error('Police frame length');
 const v=new Int16Array(out.buffer),stride=a.n*3;
 for(let f=0;f<v.length;f+=stride)for(let k=f+3;k<f+stride;k++)v[k]+=v[k-3];
 for(let k=stride;k<v.length;k++)v[k]+=v[k-stride];
 return out;
}
function uploadPoliceAsset(a){
 if(a?.version!==1||a.frameEncoding!=='lz4-delta2'||!Number.isInteger(a.n)||a.n<1||a.n>65535||!Number.isInteger(a.frameBytes)||a.frameBytes<1||a.frameBytes>30000000||a.frameBytes%(a.n*6))throw Error('Police format');
 const total=a.frameBytes/(a.n*6);for(const name of ['Idle','Walk','Run']){const c=a.clips?.[name];if(!c||!Number.isInteger(c.start)||!Number.isInteger(c.count)||c.start<0||c.count<2||c.start+c.count>total)throw Error('Police animation');}
 const colors=decode64(a.colors),indices=decode64(a.indices);
 if(colors.length!==a.n*3||indices.length%2||!Number.isInteger(a.baseCount)||a.baseCount<3||a.baseCount%3||a.beaconCounts?.length!==2||a.beaconCounts.some(n=>!Number.isInteger(n)||n<0||n%3)||(a.baseCount+a.beaconCounts[0]+a.beaconCounts[1])*2!==indices.length)throw Error('Police mesh data');
 if(new Uint16Array(indices.buffer).some(i=>i>=a.n))throw Error('Police index');
 const frames=decodePoliceFrames(a);
 policeMesh={police:true,n:a.n,clips:a.clips,frames:staticBuffer(gl.ARRAY_BUFFER,frames),colors:staticBuffer(gl.ARRAY_BUFFER,colors),index:staticBuffer(gl.ELEMENT_ARRAY_BUFFER,indices),count:a.baseCount,beaconCounts:a.beaconCounts};
 return policeMesh;
}
function loadPoliceAsset(){
 if(policeMesh||policeAssetLoading)return;
 policeAssetLoading=true;
 try{
  if(window.POLICE_HORSE_ASSET){uploadPoliceAsset(window.POLICE_HORSE_ASSET);return;}
  if(typeof fetch!=='function')return;
  fetch('assets/npc/police-horse.json?v=3.7.2').then(r=>r.ok?r.json():null).then(a=>{if(a)uploadPoliceAsset(a);}).catch(e=>console.warn('[Police horse] Using lightweight fallback',e));
 }catch(e){console.warn('[Police horse] Using lightweight fallback',e);}
}
function policeBeaconPhase(){return Math.floor(((nowTime%.96)+.96)%.96/.12);}
// Lightweight fallback follows armor bounds extracted from the provided GLB.
// The full original skinned model replaces this as soon as its baked asset is available.
function policeFallbackArmor(c,bob){
 const x=c.x,z=c.z,steel=col('273849'),rim=col('526575'),plate=col('182733');
 for(const s of [-1,1]){
  // Chest, shoulder, and hindquarter plates. Side-mounted parts stay clear of legs.
  box(x+s*.315,1.34+bob,z+.51,.15,.41,.62,steel);
  box(x+s*.38,1.41+bob,z+.51,.035,.28,.48,rim);
  box(x+s*.30,1.42+bob,z-.55,.16,.28,.53,steel);
  box(x+s*.30,1.43+bob,z-.14,.13,.22,.33,plate);
  for(let k=0;k<3;k++)box(x+s*.27,1.54+bob+k*.105,z+.79+k*.095,.12,.19,.19,steel);
 }
 box(x,1.43+bob,z+1.35,.42,.25,.30,steel);
 box(x,1.67+bob,z-.41,.46,.10,.23,plate);
 const phase=policeBeaconPhase(),red=phase===0||phase===2,blue=phase===4||phase===6;
 box(x-.17,1.77+bob,z-.41,.18,.13,.15,col(red?'ff2925':'652320'));
 box(x+.17,1.77+bob,z-.41,.18,.13,.15,col(blue?'328aff':'233b70'));
}
function policeRider(c){
 const x=c.x,z=c.z,bob=Math.sin(c.animPhase*Math.PI*4)*.06;
 groundShadow(x,z,.64,1.30);
 if(!policeMesh){box(x,1.56+bob,z-.22,.74,.12,.70,c.cloth);box(x,1.67+bob,z-.22,.56,.10,.58,darkWood);policeFallbackArmor(c,bob);}
 rider(x,1.74+bob,z-.22,col('293c50'));
 box(x,2.50+bob,z-.22,.43,.20,.43,col('35495a'));
 box(x,2.51+bob,z+.015,.38,.07,.07,col('91a4b3'));
 box(x,1.99+bob,z-.04,.38,.35,.08,col('43586b'));
 box(x,2.09+bob,z+.015,.11,.11,.035,col('d2b579'));
 queueHorse(x,z,c.yaw,POLICE_MODEL_ID,c.animPhase,c.actualV,0);
}
