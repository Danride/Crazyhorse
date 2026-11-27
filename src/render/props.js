'use strict';
let propModels={},propTexture=null,propAssetPending=false;const propDecoded=new Map();
function initPropAssets(){
 if(propTexture)return true;
 if(typeof propSource==='undefined'){
  if(!propAssetPending){propAssetPending=true;loadGameAsset('assets/props/prop-data.js',2).then(()=>{propAssetPending=false;if(typeof propSource!=='undefined'){initPropAssets();clearChunks();}});}
  return false;
 }
 propModels=propSource.models;propTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,propTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,propSource.texture.w,propSource.texture.h,0,gl.RGBA,gl.UNSIGNED_BYTE,decode64(propSource.texture.pixels));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(gl.getUniformLocation(prog,'propMap'),1);gl.activeTexture(gl.TEXTURE0);return true;
}
function getProp(id){if(!initPropAssets()||!propModels[id])return null;if(propDecoded.has(id))return propDecoded.get(id);let a=propModels[id],p={pos:new Int16Array(decode64(a.frames).buffer),c:new Float32Array(decode64(a.colors).buffer),ix:new Uint16Array(decode64(a.indices).buffer)};propDecoded.set(id,p);return p;}
function drawProp(id,x,y,z,yaw,scale=[1,1,1]){let p=getProp(id);if(!p)return;let co=Math.cos(yaw),si=Math.sin(yaw),[sx,sy,sz]=scale;let end=p.ix.length;for(let j=0;j<end;j++){let i=p.ix[j]*3,xx=p.pos[i]*.001*sx,zz=p.pos[i+2]*.001*sz;vertex([x+xx*co+zz*si,y+p.pos[i+1]*.001*sy,z-xx*si+zz*co],[p.c[i],p.c[i+1],p.c[i+2]]);}}
function roadsideProp(id,x,z,yaw=0,s=1,y=0){if(!initPropAssets()||!propModels[id]){const color=id.includes('Lamp')?col('c6ab72'):wood;box(x,y,z,.48*s,.65*s,.48*s,color);return;}drawProp(id,x,y,z,yaw,[s,s,s]);}
