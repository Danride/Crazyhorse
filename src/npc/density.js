'use strict';
// Indexed in BIOMES order: village, city, forest, wheat fields.
const BIOME_TRAFFIC_RANGES=[[.70,1.20],[1.30,1.70],[.90,1.10],[.50,.80]];
let trafficDensity=1,densityGoal=1,densityClock=0,densitySegment=-1;
function trafficFactor(zone){
 if(!Number.isFinite(zone.trafficFactor)){
  const [lo,hi]=BIOME_TRAFFIC_RANGES[zone.kind];zone.trafficFactor=rand(lo,hi);zone.trafficGoal=zone.trafficFactor;
 }
 return zone.trafficFactor;
}
function resetDensity(){
 const zone=biomeAt(0);trafficDensity=densityGoal=trafficFactor(zone);densitySegment=zone.index;densityClock=rand(7,17);
}
function varyDensity(dt){
 const zone=biomeAt(distance);trafficFactor(zone);
 if(densitySegment!==zone.index){densitySegment=zone.index;densityClock=rand(7,17);densityGoal=zone.trafficGoal;}
 densityClock-=dt;
 if(densityClock<=0){const [lo,hi]=BIOME_TRAFFIC_RANGES[zone.kind];zone.trafficGoal=densityGoal=rand(lo,hi);densityClock=rand(7,17);}
 zone.trafficFactor+=(zone.trafficGoal-zone.trafficFactor)*(1-Math.exp(-dt*.48));
 const [lo,hi]=BIOME_TRAFFIC_RANGES[zone.kind];zone.trafficFactor=clamp(zone.trafficFactor,lo,hi);trafficDensity=zone.trafficFactor;
}
function trafficAt(d){return trafficFactor(biomeAt(d));}
function trafficHardCap(special=false){return (quality===0?88:104)+(special?4:0);}
function trafficSectors(d=distance,extra=progress){
 const out=[],end=d+TRAFFIC_LOOKAHEAD;let cursor=d;
 while(cursor<end){const zone=biomeAt(cursor),stop=Math.min(end,zone.end),length=stop-cursor;
  const target=(TRAFFIC_BASE_COUNT+extra*4)*trafficFactor(zone)*length/TRAFFIC_LOOKAHEAD;
  out.push({zone,from:cursor-d,to:stop-d,target,count:0});cursor=stop;
 }
 return out;
}
function seedBiomeTraffic(){
 // Fill the actual road ahead without spawning on top of the player.
 for(const sector of trafficSectors(0,0)){
  const lo=Math.max(42,sector.from+3),hi=sector.to-3;if(hi<=lo)continue;
  const count=Math.round(TRAFFIC_BASE_COUNT*trafficFactor(sector.zone)*(hi-lo)/TRAFFIC_LOOKAHEAD);
  for(let i=0;i<count;i++){const z=lo+(i+.5)*(hi-lo)/count;spawnAt(clamp(z+rand(-2,2),lo,hi));}
 }
}
function replenishBiomeTraffic(){
 const sectors=trafficSectors();
 for(const c of traffic){if(c.dead||c.rude||c.z<=0||c.z>=TRAFFIC_LOOKAHEAD)continue;
  const sector=sectors.find(s=>c.z>=s.from&&c.z<s.to);if(sector)sector.count++;
 }
 let candidates=sectors.filter(s=>s.to>Math.max(90,s.from)+8&&s.count<Math.round(s.target))
  .sort((a,b)=>(b.target-b.count)-(a.target-a.count));
 let added=0,factor=candidates.length?trafficFactor(candidates[0].zone):trafficAt(distance+160);
 const batch=factor>=1.30?3:2;
 for(let i=0;i<batch;i++){
  const sector=candidates.find(s=>s.count<Math.round(s.target));if(!sector)break;
  const lo=Math.max(90,sector.from+3),hi=sector.to-3;
  if(i>0&&Math.random()>.8)break;
  if(spawnAt(rand(lo,hi))){sector.count++;added++;}
 }
 // Scale arrival rate by the local density; retain the speed-related replenishment.
 const interval=rand(.65,1.5)/Math.max(.5,factor)/(1+progress*.25)/Math.min(1.7,Math.sqrt(speed/START_SPEED));
 return Math.max(.18,interval*.60);
}
