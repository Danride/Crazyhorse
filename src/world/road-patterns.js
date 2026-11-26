'use strict';
let roadRows=[],roadSegment=0,lastRoadLane=2;
const ROAD_PATTERNS=['разброс','ворота','змейка','двойной завал'];
function resetRoadPatterns(){roadRows=[];roadSegment=0;lastRoadLane=2;}
function roadGapAt(d){const v=START_SPEED*speedPercentAt(d)/100;return Math.max(58,v*1.45+12);}
function patternRouteExists(rows,entryLane=2){
 let reachable=[entryLane],prev=null;
 for(const r of rows){const gap=prev?r.d-prev.d:Infinity;const moves=prev?Math.floor(gap/roadGapAt(r.d)):5;
  reachable=r.free.filter(l=>reachable.some(p=>Math.abs(l-p)<=moves));
  if(!reachable.length)return false;prev=r;
 }return true;
}
function roadSpawnClear(x,d){return !roadRows.some(r=>Math.abs(r.d-d)<8&&Math.abs(x-laneX(r.safe))<1.8);}
function createRoadRow(d,biome,kind,safe,blocked){
 const free=[0,1,2,3,4,5].filter(i=>!blocked.includes(i));
 return {d,biome,kind,safe,blocked,free};
}
function planRoadSegment(seg){
 const start=seg*BIOME_LEN,b=biomeIndex(start+1),gap=roadGapAt(start+BIOME_LEN),rows=[];
 let safe=lastRoadLane,pattern=Math.floor(rand(0,4)),first=seg===0?105:90;
 if(b===2){
  // Two falling trees per forest. The opposite two lanes remain open.
  let side=safe<=2?1:-1;safe=side===1?1:4;
  for(const off of [125,390]){const d=start+off;rows.push({...createRoadRow(d,b,'tree',safe,side===1?[2,3,4,5]:[0,1,2,3]),side});}
  const mid=start+255;if(mid-rows[0].d>=gap&&rows[1].d-mid>=gap){const candidates=[0,1,2,3,4,5].filter(i=>i!==safe&&Math.abs(i-safe)>1);rows.push(createRoadRow(mid,b,'rock',safe,[pick(candidates)]));}
  rows.sort((a,b)=>a.d-b.d);
 }else{
  const count=Math.min(3,1+Math.floor((BIOME_LEN-100-first)/gap));
  const kind=b===0?'cart':b===1?'cart':'sheaf';
  for(let i=0;i<count;i++){
   const d=start+first+i*gap;let step=pattern===2&&i>0?(safe<3?1:-1):0;safe=clamp(safe+step,0,5);
   const neighbor=safe<5?safe+1:safe-1,available=[0,1,2,3,4,5].filter(k=>k!==safe&&k!==neighbor);
   let blocked=[];let n=pattern===0?1:pattern===1?3:2;if(i===0&&seg===0)n=1;
   for(let j=0;j<n&&available.length;j++)blocked.push(available.splice(Math.floor(rand(0,available.length)),1)[0]);
   rows.push(createRoadRow(d,b,b===0&&pattern===3&&i%2===0?'pit':kind,safe,blocked));
  }
 }
 if(!patternRouteExists(rows,lastRoadLane))return [];
 return rows;
}
function generateRoadPatterns(){
 while(roadSegment*BIOME_LEN<distance+430){
  const rows=planRoadSegment(roadSegment++);
  for(const r of rows){roadRows.push(r);
   if(r.kind==='tree'){startTree(r.d-distance,r.side);continue;}
   for(const lane of r.blocked){let x=laneX(lane);if(r.kind==='pit')addDangerPit(x,r.d);else addObstacle(r.d,r.kind,x);}
  }
  if(rows.length)lastRoadLane=rows[rows.length-1].safe;
 }
 roadRows=roadRows.filter(r=>r.d>distance-40);
}
