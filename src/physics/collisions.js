'use strict';
// Continuous contacts over a fixed physics step, in road-local coordinates.
function sweepBox(x0,z0,x1,z1,w,l){
 let lo=0,hi=1;for(const [a,b,r] of [[x0,x1,w],[z0,z1,l]]){let v=b-a;if(Math.abs(v)<1e-9){if(Math.abs(a)>=r)return null;continue;}let t1=(-r-a)/v,t2=(r-a)/v;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>=hi)return null;}return [lo,hi];
}
function sweepCircle(x0,z0,x1,z1,r){
 const dx=x1-x0,dz=z1-z0,a=dx*dx+dz*dz,b=2*(x0*dx+z0*dz),c=x0*x0+z0*z0-r*r;
 if(a<1e-12)return c<0?[0,1]:null;const disc=b*b-4*a*c;if(disc<=0)return null;const root=Math.sqrt(disc),lo=Math.max(0,(-b-root)/(2*a)),hi=Math.min(1,(-b+root)/(2*a));return lo<hi?[lo,hi]:null;
}
function mergeContact(a,b){return !a?b:!b?a:[Math.min(a[0],b[0]),Math.max(a[1],b[1])];}
function sweepRoundedBox(x0,z0,x1,z1,w,l,r){
 let hit=mergeContact(sweepBox(x0,z0,x1,z1,w+r,l),sweepBox(x0,z0,x1,z1,w,l+r));
 for(const x of [-w,w])for(const z of [-l,l])hit=mergeContact(hit,sweepCircle(x0-x,z0-z,x1-x,z1-z,r));return hit;
}
// Separate body sections based on the visible horse, ox and cart layout.
// Decorative tails/reins are excluded from lethal contacts.
const HORSE_HULL=[[-.88,.36],[-.48,.43],[0,.43],[.48,.40],[.88,.32],[1.24,.27]];
const OX_HULL=[[-.91,.46],[-.48,.51],[0,.51],[.48,.48],[.94,.39],[1.34,.34]];
const CART_HULL=[[-2.15,.85],[-1.60,.91],[-1.05,.96],[-.50,.93],[.04,.81],[.62,.35]];
function hullSections(c){if(c.kind===3)return OX_HULL;if(c.kind!==1&&c.kind!==2)return HORSE_HULL;return CART_HULL.concat((c.kind===2&&c.ox?OX_HULL:HORSE_HULL).map(([k,r])=>[k+2,r]));}
function bodyShape(c){if(c.kind===1||c.kind===2)return {r:.96,back:-2.15,front:3.34};return c.kind===3?{r:.51,back:-.91,front:1.34}:{r:.43,back:-.88,front:1.24};}
function bodyPoint(x,z,yaw,k){return [x+Math.sin(yaw||0)*k,z+Math.cos(yaw||0)*k];}
function bodyPrevious(c){return {x:c.stepX??c.x,z:c.stepZ??c.z,yaw:c.stepYaw??c.yaw??0};}
function bodySamples(c){return hullSections(c).map(s=>s[0]);}
function hullMotion(c,old){return hullSections(c).map(([k,r])=>({r,a:bodyPoint(old.x,old.z,old.yaw,k),b:bodyPoint(c.x,c.z,c.yaw,k)}));}
function npcCollision(a,b){
 const pa=bodyPrevious(a),pb=bodyPrevious(b);
 if(!sweepBox(pa.x-pb.x,pa.z-pb.z,a.x-b.x,a.z-b.z,3.8,9))return false;
 for(const p of hullMotion(a,pa))for(const q of hullMotion(b,pb)){
  if(sweepCircle(p.a[0]-q.a[0],p.a[1]-q.a[1],p.b[0]-q.b[0],p.b[1]-q.b[1],p.r+q.r-.025))return true;
 }return false;
}
function resolveNPCs(){for(let i=0;i<traffic.length;i++){let a=traffic[i];if(a.dead)continue;for(let j=i+1;j<traffic.length;j++){let b=traffic[j];if(b.dead)continue;if(npcCollision(a,b)){killNPC(a);killNPC(b);if(Math.abs(a.z)<55)neigh(.7);break;}}}}
function heightAt(t){return prevJumpY+(jumpY-prevJumpY)*t;}
// 0 = clear, 1 = cleared/landed on top, 2 = frontal/side impact.
function surfaceContact(dx,dz,oldDx,oldDz,halfW,halfL,top,sideW,sideL){
 const hit=sweepBox(oldDx,oldDz,dx,dz,halfW+sideW,halfL+sideL);if(!hit)return 0;
 const [enter,exit]=hit,threshold=top-.015;
 if(heightAt(enter)<threshold)return 2;
 if(jumpV<=0&&prevJumpY>=threshold&&jumpY<=top&&prevJumpY>jumpY){
  const t=clamp((prevJumpY-top)/(prevJumpY-jumpY),0,1);
  if(t>=enter-1e-6&&t<=exit+1e-6){const atX=oldDx+(dx-oldDx)*t,atZ=oldDz+(dz-oldDz)*t;
   if(Math.abs(atX)<=halfW+.30&&Math.abs(atZ)<=halfL+.55){jumpY=top+.025;jumpV=1.9;shake=Math.max(shake,.11);return 1;}
  }
 }
 return heightAt(exit)>=threshold?1:2;
}
function obstacleContact(o){return surfaceContact(px-o.x,distance-o.d,prevPlayerX-o.x,prevDistance-o.d,o.w*.5,o.l*.5,o.h,.43,.85);}
function localRelative(x,z,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return [x*c-z*s,x*s+z*c];}
function playerBodyPose(x,yaw){return {kind:0,x:x+Math.sin(yaw||0)*.5,z:.5,yaw:yaw||0};}
// 0 clear, 1 brush, 2 skid, 3 direct lethal impact.
function playerContact(c){
 const old=bodyPrevious(c),p0=playerBodyPose(prevPlayerX,prevPlayerYaw),p1=playerBodyPose(px,playerYaw);
 if(!sweepBox(p0.x-old.x,p0.z-old.z,p1.x-c.x,p1.z-c.z,3.8,7)){c.contactHeld=false;c.sideSafe=false;return 0;}
 const a=hullMotion(p1,p0),b=hullMotion(c,old);
 let result=0,touch=false,closest=Infinity,normal=0;
 for(const p of a)for(const q of b){
  const x0=p.a[0]-q.a[0],z0=p.a[1]-q.a[1],x1=p.b[0]-q.b[0],z1=p.b[1]-q.b[1],r=p.r+q.r-.045;
  const d0=Math.hypot(x0,z0),d1=Math.hypot(x1,z1),hit=sweepCircle(x0,z0,x1,z1,r);
  if(d1<r+.08)touch=true;
  if(!hit)continue;
  const dx=x1-x0,dz=z1-z0;
  // Separating overlaps never start a fresh hit; continuous entry is still detected.
  if(d0<r&&x0*dx+z0*dz>=-1e-8)continue;
  const t=hit[0],xx=x0+dx*t,zz=z0+dz*t,len=Math.max(.001,Math.hypot(xx,zz)),nx=xx/len,nz=zz/len;
  const approach=Math.max(0,-(dx*nx+dz*nz)*60),side=Math.abs(nx),rel=Math.abs(speed-c.actualV);
  if(approach<.08&&d1>=d0-.002)continue;
  if(Math.min(heightAt(hit[0]),heightAt(hit[1]))>.05&&side>.60){if(!c.sideSafe){sideTouches++;c.sideSafe=true;}continue;}
  const centerX=(p0.x-old.x)+((p1.x-c.x)-(p0.x-old.x))*t;
  const longitudinalClosing=(old.z-p0.z)*(speed-c.actualV)>0;
  const direct=longitudinalClosing&&side<.62&&Math.abs(centerX)<(c.kind===1||c.kind===2?.95:.60)&&approach>=5&&rel>=7;
  const severity=direct?3:approach>=3.0?2:1;
  if(severity>result||severity===result&&len<closest){result=severity;closest=len;normal=nx;}
 }
 if(!touch&&!result){c.contactHeld=false;c.sideSafe=false;return 0;}
 c.impactNormal=normal||Math.sign(px-c.x)||1;
 if(result===3)return 3;
 if(c.contactHeld)return 0;
 if(result){c.contactHeld=true;return result;}
 return 0;
}
function applyNpcImpact(c,severity){
 const side=c.impactNormal>=0?1:-1,strong=severity===2;
 impactPush=clamp(impactPush+side*(strong?3.1:1.15),-4.5,4.5);vx+=side*(strong?1.15:.45);
 impactSlip=Math.max(impactSlip,strong?.85:.22);shake=Math.max(shake,strong?.55:.18);hitFlash=Math.max(hitFlash,strong?.38:.10);
 if(strong)neigh(.65);
}
function pitContact(h){const hit=sweepBox(prevPlayerX-h.x,prevDistance-h.d,px-h.x,distance-h.d,h.w*.5+.25,h.l*.5);return !!hit&&Math.min(heightAt(hit[0]),heightAt(hit[1]))<.18;}
function npcObstacleContact(c,o){
 const prev=bodyPrevious(c),a=prev.z+prevDistance-o.d,b=c.z+distance-o.d;
 if(!sweepBox(prev.x-o.x,a,c.x-o.x,b,o.w*.5+4,o.l*.5+5))return false;
 const s=bodyShape(c);
 for(const [k,r] of hullSections(c)){const p=bodyPoint(prev.x,prev.z+prevDistance,prev.yaw,k),q=bodyPoint(c.x,c.z+distance,c.yaw,k);if(sweepRoundedBox(p[0]-o.x,p[1]-o.d,q[0]-o.x,q[1]-o.d,o.w*.5,o.l*.5,r))return true;}return false;
}
function npcPitContact(c,h){if(!h.danger)return false;const a=bodyPrevious(c);return !!sweepBox(a.x-h.x,a.z+prevDistance-h.d,c.x-h.x,c.z+distance-h.d,h.w*.5,h.l*.5);}
function npcCrosserContact(c,o,oldX,oldD,w,l){
 const a=bodyPrevious(o),s=bodyShape(o);
 if(!sweepBox(a.x-oldX,a.z+prevDistance-oldD,o.x-c.x,o.z+distance-c.d,w+4,l+5))return false;
 for(const [k,r] of hullSections(o)){let p=bodyPoint(a.x,a.z+prevDistance,a.yaw,k),q=bodyPoint(o.x,o.z+distance,o.yaw,k);if(sweepRoundedBox(p[0]-oldX,p[1]-oldD,q[0]-c.x,q[1]-c.d,w,l,r))return true;}return false;
}
