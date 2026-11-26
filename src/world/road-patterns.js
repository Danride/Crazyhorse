'use strict';
let roadRows=[],roadSegment=0,lastRoadLane=2,roadPending=[],distanceEvents=[];
const ROAD_PATTERNS=['разброс','ворота','змейка','двойной завал','цепочка','тройной завал'];
function resetRoadPatterns(){roadRows=[];roadSegment=0;lastRoadLane=2;roadPending=[];distanceEvents=[];}
function roadGapAt(d){const v=START_SPEED*speedPercentAt(d)/100;return Math.max(58,v*1.45+12);}
function patternRouteExists(rows,entryLane=2){
 let reachable=[entryLane],prev=null;
 for(const r of rows){const gap=prev?r.d-prev.d:Infinity,moves=prev?Math.floor((gap+.01)/roadGapAt(r.d)):5;
  reachable=r.free.filter(l=>reachable.some(p=>Math.abs(l-p)<=moves));
  if(!reachable.length)return false;prev=r;
 }return true;
}
function roadSpawnClear(x,d){return !roadRows.some(r=>Math.abs(r.d-d)<8&&(Math.abs(x-laneX(r.safe))<1.8||r.blocked.some(k=>Math.abs(x-laneX(k))<1.8)));}
function createRoadRow(d,biome,kind,safe,blocked,pattern='разброс'){return {d,biome,kind,safe,blocked,free:[0,1,2,3,4,5].filter(i=>!blocked.includes(i)),pattern};}
function planRoadSegment(seg){
 const zone=biomeSegment(seg),start=zone.start,end=zone.end,b=zone.kind,rows=[];
 let safe=lastRoadLane,i=0,d=start+(seg===0?105:85),previous=null;
 // A forest starts on the side compatible with the preceding corridor; the first forest at spawn can start on either side.
 let treeSide=b===2?(seg===0?(Math.random()<.5?-1:1):(safe<=2?1:-1)):0;
 while(d<=end-65){
  const gap=roadGapAt(d+180),forest=b===2,tree=forest&&i%3===0;
  const p=Math.floor(rand(0,6));
  if(tree){const side=treeSide;safe=side===1?1:4;rows.push({...createRoadRow(d,b,'tree',safe,side===1?[2,3,4,5]:[0,1,2,3],'лесоповал'),side});treeSide=-treeSide;}
  else{
   if(forest){
    // The two rock groups between trees move the reserved passage one lane at a time toward the opposite side.
    const nextSafe=treeSide===1?1:4;safe+=Math.sign(nextSafe-safe);
   }else if(p===2&&previous&&d-previous.d>=roadGapAt(d))safe=clamp(safe+(safe===0?1:safe===5?-1:(Math.random()<.5?-1:1)),0,5);
   const neighbor=safe<5?safe+1:safe-1,pit=b===0&&(i%3===1||p===3),kind=pit?'pit':forest?'rock':b===3?'sheaf':'cart';
   let available=[0,1,2,3,4,5].filter(k=>k!==safe&&k!==neighbor&&(!pit||(k>0&&k<5)));
   const blocked=[],n=p===0||p===4?1:p===1?3:2;
   for(let j=0;j<n&&available.length;j++)blocked.push(available.splice(Math.floor(rand(0,available.length)),1)[0]);
   if(!blocked.length)blocked.push(safe<3?4:1);
   const repeat=pit?2:((kind==='rock'||kind==='sheaf')&&(p>=3||i%3===1)?3:p===3?2:1),count=Math.min(repeat,1+Math.floor((end-65-d)/9));
   for(let j=0;j<count;j++)rows.push(createRoadRow(d+j*9,b,kind,safe,blocked.slice(),ROAD_PATTERNS[p]));
  }
  previous=rows[rows.length-1];d=previous.d+gap+rand(0,15);i++;
 }
 // The reserved lane is never blocked; on a failed slalom keep the last reachable corridor instead.
 if(!patternRouteExists(rows,lastRoadLane))throw Error('Invalid static road corridor');
 return rows;
}
function planDistanceEvents(zone,rows){
 if(zone.kind===2)return;const type=['barrels','crowd',null,'rams'][zone.kind];
 let last=-Infinity;
 for(let d=zone.start+120;d<=zone.end-80;d+=20){
  if(d-last<(zone.kind===1?180:245)||rows.some(r=>Math.abs(r.d-d)<38))continue;
  distanceEvents.push({d,type});last=d;
 }
 if(!distanceEvents.some(e=>e.d>=zone.start&&e.d<zone.end)){
  let best=null,sep=0;for(let d=zone.start+65;d<=zone.end-65;d+=10){const s=rows.length?Math.min(...rows.map(r=>Math.abs(r.d-d))):100;if(s>sep){sep=s;best=d;}}
  if(best!==null&&sep>=25)distanceEvents.push({d:best,type});
 }
}
function generateRoadPatterns(){
 while(biomeSegment(roadSegment).start<distance+520){
  const zone=biomeSegment(roadSegment),rows=planRoadSegment(roadSegment++);
  roadRows.push(...rows);roadPending.push(...rows);planDistanceEvents(zone,rows);
  if(rows.length)lastRoadLane=rows[rows.length-1].safe;
 }
 while(roadPending.length&&roadPending[0].d<=distance+500){const r=roadPending.shift();
  if(r.kind==='tree'){startTree(r.d-distance,r.side);continue;}
  for(const lane of r.blocked){const x=laneX(lane);if(r.kind==='pit')addDangerPit(x,r.d);else addObstacle(r.d,r.kind,x);}
 }
 roadRows=roadRows.filter(r=>r.d>distance-40);
}
