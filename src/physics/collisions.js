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
function bodyShape(c){const tow=c.kind===1||c.kind===2;return tow?{r:.92,back:-1.65,front:2.65}:c.kind===3?{r:.53,back:-.82,front:.98}:{r:.47,back:-.85,front:.95};}
function bodyPoint(x,z,yaw,k){return [x+Math.sin(yaw)*k,z+Math.cos(yaw)*k];}
function bodyPrevious(c){return {x:c.stepX??c.x,z:c.stepZ??c.z,yaw:c.stepYaw??c.yaw??0};}
function bodySamples(c){let s=bodyShape(c),count=Math.ceil((s.front-s.back)/(s.r*.85)),ks=[];for(let i=0;i<=count;i++)ks.push(s.back+(s.front-s.back)*i/count);return ks;}
function npcCollision(a,b){
 const pa=bodyPrevious(a),pb=bodyPrevious(b),sa=bodyShape(a),sb=bodyShape(b);
 const r=sa.r+sb.r+.035;
 if(!sweepBox(pa.x-pb.x,pa.z-pb.z,a.x-b.x,a.z-b.z,7,8))return false;
 // Several overlapping body sections cover the horse and the cart/harness rather than empty corners.
 const as=bodySamples(a).map(k=>[bodyPoint(pa.x,pa.z,pa.yaw,k),bodyPoint(a.x,a.z,a.yaw,k)]);
 const bs=bodySamples(b).map(k=>[bodyPoint(pb.x,pb.z,pb.yaw,k),bodyPoint(b.x,b.z,b.yaw,k)]);
 for(const [a0,a1] of as)for(const [b0,b1] of bs)if(sweepCircle(a0[0]-b0[0],a0[1]-b0[1],a1[0]-b1[0],a1[1]-b1[1],r))return true;return false;
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
function playerContact(c){
 const prev=bodyPrevious(c),tow=c.kind===1||c.kind===2,shape=bodyShape(c),r=shape.r+.46;
 const a=localRelative(prevPlayerX-prev.x,-prev.z,prev.yaw),b=localRelative(px-c.x,-c.z,c.yaw);
 const mid=(shape.front+shape.back)*.5,half=(shape.front-shape.back)*.5;
 const hit=sweepRoundedBox(a[0],a[1]-mid,b[0],b[1]-mid,0,half,r);
 // A rounded capsule with zero core width needs the central strip as well.
 const contact=mergeContact(hit,sweepBox(a[0],a[1]-mid,b[0],b[1]-mid,r,half));
 if(!contact){c.sideSafe=false;return false;}
 const [enter,exit]=contact,x0=a[0]+(b[0]-a[0])*enter,x1=a[0]+(b[0]-a[0])*exit,sideMin=x0*x1<=0?0:Math.min(Math.abs(x0),Math.abs(x1));
 if(Math.min(heightAt(enter),heightAt(exit))>.05&&sideMin>(tow?.82:.54)){if(!c.sideSafe){sideTouches++;notice('КАСАНИЕ В ПРЫЖКЕ · СПАСЁН');c.sideSafe=true;}return false;}return true;
}
function pitContact(h){const hit=sweepBox(prevPlayerX-h.x,prevDistance-h.d,px-h.x,distance-h.d,h.w*.5+.25,h.l*.5);return !!hit&&Math.min(heightAt(hit[0]),heightAt(hit[1]))<.18;}
function npcObstacleContact(c,o){
 const prev=bodyPrevious(c),a=prev.z+prevDistance-o.d,b=c.z+distance-o.d;
 if(!sweepBox(prev.x-o.x,a,c.x-o.x,b,o.w*.5+4,o.l*.5+5))return false;
 const s=bodyShape(c);
 for(const k of bodySamples(c)){const p=bodyPoint(prev.x,prev.z+prevDistance,prev.yaw,k),q=bodyPoint(c.x,c.z+distance,c.yaw,k);if(sweepRoundedBox(p[0]-o.x,p[1]-o.d,q[0]-o.x,q[1]-o.d,o.w*.5,o.l*.5,s.r))return true;}return false;
}
function npcPitContact(c,h){if(!h.danger)return false;const a=bodyPrevious(c);return !!sweepBox(a.x-h.x,a.z+prevDistance-h.d,c.x-h.x,c.z+distance-h.d,h.w*.5,h.l*.5);}
function npcCrosserContact(c,o,oldX,oldD,w,l){
 const a=bodyPrevious(o),s=bodyShape(o);
 if(!sweepBox(a.x-oldX,a.z+prevDistance-oldD,o.x-c.x,o.z+distance-c.d,w+4,l+5))return false;
 for(const k of bodySamples(o)){let p=bodyPoint(a.x,a.z+prevDistance,a.yaw,k),q=bodyPoint(o.x,o.z+distance,o.yaw,k);if(sweepRoundedBox(p[0]-oldX,p[1]-oldD,q[0]-c.x,q[1]-c.d,w,l,s.r))return true;}return false;
}
