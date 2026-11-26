'use strict';
function worldChaos(dt){crashTalk=crashTalk.filter(g=>g.until>nowTime);for(let t of fallingTrees){let z=t.d-distance;if(z<Math.max(105,Math.min(280,speed*2.55)))t.age+=dt;let a=clamp(t.age/1.45,0,1);t.angle=Math.PI*.5*a*a;if(a===1&&!t.landed){t.landed=true;let reach=t.reach,x=t.x-t.side*reach/2;obstacles.push({d:t.d,x,w:reach,h:1.05,l:3.8,log:true,tree:true,id:'tree'+t.d,seen:false});damageRoad(t.x-t.side*7,t.d,2.2,1.8,.34);debris(t.x-t.side*7,t.d,[wood,palette.bark,col('617b46')],35,2);}}
fallingTrees=fallingTrees.filter(t=>t.d>distance-25);eventHouses=eventHouses.filter(h=>h.d>distance-35);brokenFences=brokenFences.filter(f=>f.d>distance-35);holes=holes.filter(h=>h.d>distance-35);
for(let c of crossers){if(c.dead)continue;if(c.delay>0){c.delay-=dt;continue;}let oldX=c.x,oldD=c.d;if(c.kind==='ram'){let target=clamp(c.targetX,-edge+1,edge-1);c.v+=(clamp((target-c.x)*1.6,-3.8,3.8)-c.v)*(1-Math.exp(-dt*4));c.yaw=Math.atan2(c.v,c.vz);}c.x+=c.v*dt;c.d+=(c.vz||0)*dt;c.phase+=c.kind==='barrel'?-c.v*dt/(2*Math.PI*.52912):dt*Math.hypot(c.v,c.vz||0)*3;
let z=c.d-distance,w=c.kind==='barrel'?1:.86,l=c.kind==='ram'?1.5:1.35,h=c.kind==='person'?1.70:c.kind==='barrel'?1.16:1.03,base=0;let contact=surfaceContact(px-c.x,distance-c.d,prevPlayerX-oldX,prevDistance-oldD,w-.43,l-.65,h,.43,.65);if(contact===2){if(jumpY>.08&&prevJumpY>.08&&Math.abs(c.x-px)>.48&&Math.abs(prevPlayerX-oldX)>.48){c.dead=true;debris(c.x,c.d,[c.color,wood],12,.7);continue;}lose(({ram:'Столкновение с бараном',person:'Столкновение с горожанином',barrel:'Столкновение с бочкой'})[c.kind]||'Столкновение');return;}trackCombo(c,z,w,l,contact===1);for(let o of traffic){if(!o.dead&&npcCrosserContact(c,o,oldX,oldD,w-.43,l-.65)){killNPC(o);c.dead=true;debris(c.x,c.d,[c.color,wood],14,.7);break;}}}
crossers=crossers.filter(c=>!c.dead&&Math.abs(c.x)<edge+12&&c.d>distance-25);for(let h of holes){if(!h.danger)continue;if(pitContact(h)){lose('Провал в дорожную яму');return;}trackCombo(h,h.d-distance,h.w/2+.25,h.l/2,jumpY>=.18&&Math.abs(h.d-distance)<h.l/2);}}

function triggerEvent(type,d){
 if(d===undefined)d=distance+Math.max(85,speed*2.5);const z=d-distance,zone=biomeAt(d);
 if(type===undefined)type=['barrels','crowd',null,'rams'][zone.kind];
 if(type==='barrels'){spawnBarrels(z);return true;}if(type==='crowd')return spawnCrowd(z);if(type==='rams'){spawnFlock(z);return true;}if(type==='tree'){startTree(z);return true;}return false;
}
function runDistanceEvents(){
 for(const e of distanceEvents){if(e.done)continue;const lead=e.d-distance,trigger=e.type==='crowd'?Math.max(115,speed*3.2):e.type==='rams'?Math.max(85,speed*2.35):Math.max(65,speed*2.1);
  if(lead>trigger)continue;if(lead<15){e.done=true;continue;}if(triggerEvent(e.type,e.d))e.done=true;
 }distanceEvents=distanceEvents.filter(e=>!e.done&&e.d>distance);
}
const OVERTAKE_DELTA=50/3.6;
function overtakeSpeed(playerSpeed){return playerSpeed+OVERTAKE_DELTA;}
function setOvertaker(c,revenge=false){
 c.rude=true;c.personality='sprinter';c.purpose='courier';c.traits.aggression=Math.max(.78,c.traits.aggression);
 c.actualV=overtakeSpeed(speed);c.baseV=c.actualV;c.speedFactor=1;c.change=5;c.speedClock=6;c.passed=c.z<0;
 c.passSide=c.x<px?-1:1;if(Math.abs(c.x-px)<1.5)c.passSide=px>0?-1:1;
 c.targetX=clamp(px+c.passSide*3.3,-edge+1,edge-1);c.plan=null;c.brainAt=nowTime;
 if(!revenge)emotionalAdd(c,'angry',35);
 return c;
}
function spawnRude(){
 if(traffic.filter(c=>!c.dead&&c.rude&&c.z>-65&&c.z<85).length>=3)return false;
 const side=px>0?-1:1,x=clamp(px+side*rand(2.5,3.6),-edge+1,edge-1),c=spawnAt(-38,0,x,true);
 if(!c)return false;setOvertaker(c);return true;
}
function events(dt){runDistanceEvents();eventLeft-=dt;if(eventLeft<=0&&eventName){eventName='';$('eventBanner').classList.remove('active');$('eventStatus').textContent='ТРАКТ · СВОБОДНОЕ ДВИЖЕНИЕ';}neighClock-=dt;if(neighClock<=0){neigh(rand(.42,.85));neighClock=rand(6,14);}}
