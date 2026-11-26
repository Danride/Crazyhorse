'use strict';
// Lateral motion is shared by the planner and the actual simulation.
function npcLateralStep(x,v,goal,dt,tow=false,rain=0){
 const grip=1-rain*.45,limit=(tow?2.45:3.85)*grip,acc=(tow?5.4:9.5)*grip;
 const error=goal-x,desired=Math.sign(error)*Math.min(limit,Math.abs(error)*3.3,Math.sqrt(2*acc*Math.abs(error)));
 let nv=v+clamp(desired-v,-acc*dt,acc*dt),nx=x+(v+nv)*.5*dt;
 if((goal-x)*(goal-nx)<=0&&Math.abs(error)<.13&&Math.abs(nv)<.65){nx=goal;nv=0;}
 nx=clamp(nx,-edge+.95,edge-.95);if(Math.abs(nx)>=edge-.95&&Math.sign(nv)===Math.sign(nx))nv=0;
 return {x:nx,v:nv};
}
function npcLaneGoal(x){return clamp(laneX(clamp(Math.floor((x+edge)/laneW),0,5)),-edge+1,edge-1);}
function npcPlanRisk(c,a,near,hazards){
 const tow=c.kind===1||c.kind===2,shape=bodyShape(c),wide=shape.r,front=Math.max(-shape.back,shape.front)+shape.r,grip=1-weatherRain*.45;
 let x=c.x,v=c.xVel||0,z=0,vel=c.actualV,risk=0,hard=0,urgent=0;
 for(let k=1;k<=22;k++){
  const t=k*.1,p=npcLateralStep(x,v,a.goal,.1,tow,weatherRain);x=p.x;v=p.v;
  vel=c.rude?overtakeSpeed(speed):vel+(a.speed-vel)*(1-Math.exp(-.1*(a.speed<vel?4:2)*grip));z+=vel*.1;
  if(k%2&&k>5)continue;
  for(const o of near){
   const oz=o.z-c.z+o.v*t,ox=clamp(o.x+(o.vx||0)*t,-edge+.85,edge-.85),dx=Math.abs(x-ox),dz=Math.abs(z-oz),sep=wide+o.w,long=front+o.f;
   if(dz<long+2&&dx<sep+.85){risk+=Math.max(0,sep+.85-dx)*2.6;if(dz<long&&dx<sep+.08){hard++;if(t<=.6)urgent++;}}
  }
  for(const h of hazards){const active=Math.max(0,t-(h.delay||0)),dx=Math.abs(x-h.x-h.vx*active),dz=Math.abs(z-h.z-h.vz*active);
   if(dz<front+h.l+1.5&&dx<wide+h.w+.65){risk+=8;if(dz<front+h.l&&dx<wide+h.w+.08){hard++;if(t<=.6)urgent++;}}
  }
 }
 return {risk,hard,urgent};
}
function trafficSafety(c,desired,perception){
 const {danger,blocked,target}=perception,near=perception.near.filter(o=>Math.abs(o.z-c.z)<16+Math.max(Math.abs(c.actualV-o.v),Math.abs(desired-o.v))*2.4+Math.max(c.actualV,desired)*.8),hazards=perception.hazards.filter(h=>h.z<12+Math.max(c.actualV,desired)*2.5),T=c.traits,F=c.feelings,bounds=edge-1,options=[];
 const travel=desired,cruise=c.maneuver?.goal??c.targetX??c.x,forwardReward=c.purpose==='courier'||c.purpose==='racer'?7:3;
 function add(action,x,v,reward){options.push({action,goal:clamp(x,-bounds,bounds),speed:c.rude?overtakeSpeed(speed):clamp(v,.2,Math.max(desired,speed*.94)),reward});}
 const lane=npcLaneGoal(c.x);
 add('cruise',cruise,travel,forwardReward+5);add('follow',cruise,travel*.70,blocked?8+T.patience*9:0);add('brake',cruise,travel*.30,blocked||danger>.05?danger*19+T.fear*4:-25);
 for(const side of [-1,1]){
  const next=clamp(lane+side*laneW,-bounds,bounds);
  if(Math.abs(next-c.x)>.4){add('overtake',next,travel*(1+T.aggression*.13),blocked?12+F.angry*.14+T.aggression*5-T.patience*5:-12);add('evade',next,travel*.78,danger*25+F.panic*.08-5);}
  add('shoulder',side*bounds,travel*.5,danger*22+F.panic*.12-18);
 }
 if(target&&c.kind===0&&F.panic<65){const side=c.passSide||(target.x>0?-1:1);add('pursue',npcLaneGoal(target.x+side*2.7),Math.max(travel,target.v+3),12+F.angry*.15);}
 if(c.rude&&c.z<=12){for(const side of [-1,1]){let x=clamp(npcLaneGoal(px+side*3.3),-bounds,bounds);if(Math.abs(x-px)>1.65)add('rudePass',x,overtakeSpeed(speed),30+(side===c.passSide?8:0));}}
 if(c.rude&&c.z>12)add('cruise',cruise,overtakeSpeed(speed),45);
 const m=c.maneuver;
 if(m){add(m.action,m.goal,travel,forwardReward+8);add('brake',m.goal,travel*.28,blocked||danger>.05?danger*22+T.fear*5:-25);}
 const caution=.9+T.fear*.55+T.skill*.55+F.panic*.004;
 const riskCache=new Map();for(const a of options){const key=a.goal.toFixed(3)+':'+a.speed.toFixed(3);if(!riskCache.has(key))riskCache.set(key,npcPlanRisk(c,a,near,hazards));Object.assign(a,riskCache.get(key));a.value=a.reward+a.speed*.13-Math.abs(a.goal-c.x)*1.25-a.risk*caution-a.hard*(45+T.skill*25);if(m)a.value-=Math.abs(a.goal-m.goal)*1.4;if(a.action==='pursue'&&danger>.45)a.value-=30;}
 options.sort((a,b)=>b.value-a.value);let best=options[0];
 if(m){
  const settled=Math.abs(c.x-m.goal)<.16&&Math.abs(c.xVel||0)<.24;
  if(settled&&!m.settled){m.settled=true;m.cooldownUntil=nowTime+rand(1.5,3);}
  const keep=options.filter(a=>Math.abs(a.goal-m.goal)<.12).sort((a,b)=>b.value-a.value)[0];
  const locked=!m.settled||nowTime<m.cooldownUntil||nowTime<m.lockUntil;
  const emergency=keep&&keep.urgent>=2&&best.urgent+1<keep.urgent&&nowTime>=m.emergencyAt;
  if(locked&&!emergency&&keep)best=keep;
 }
 if(!m||Math.abs(best.goal-m.goal)>.18){c.maneuver={goal:best.goal,action:best.action,lockUntil:nowTime+1,settled:false,cooldownUntil:0,emergencyAt:nowTime+.7};}
 else{best.goal=m.goal;if(best.action!=='brake'&&best.action!=='follow')m.action=best.action;}
 c.targetX=c.maneuver.goal;
 if(c.intent!==best.action){c.intent=best.action;c.intentUntil=nowTime+1;if(best.action==='pursue')socialSay(c,'revenge');}
 if(target&&best.action==='pursue'&&Math.abs(target.z-c.z)<7&&Math.abs(target.x-c.x)<4){socialSay(c,'revenge');c.memory.target=null;c.memory.chaseUntil=0;}
 if(best.action==='rudePass')c.passSide=best.goal<px?-1:1;
 return best;
}
