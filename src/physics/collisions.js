'use strict';
function npcCollision(a,b){let dx=b.x-a.x,dz=b.z-a.z;let ar=a.kind===1||a.kind===2,br=b.kind===1||b.kind===2;if(Math.abs(dx)>4||Math.abs(dz)>6)return false; // oriented bodies, sampled along the longitudinal axis
 let al=ar?2.7:1.15,bl=br?2.7:1.15,aw=ar?.8:.42,bw=br?.8:.42;
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){let ax=a.x+Math.sin(a.yaw)*al*i,az=a.z+Math.cos(a.yaw)*al*i,bx=b.x+Math.sin(b.yaw)*bl*j,bz=b.z+Math.cos(b.yaw)*bl*j;if(Math.hypot(ax-bx,az-bz)<aw+bw+.13)return true;}return false;}
function resolveNPCs(){for(let i=0;i<traffic.length;i++){let a=traffic[i];if(a.dead)continue;for(let j=i+1;j<traffic.length;j++){let b=traffic[j];if(b.dead)continue;if(npcCollision(a,b)){killNPC(a);killNPC(b);if(Math.abs(a.z)<55)neigh(.7);break;}}}}
// 0 = clear, 1 = over the top / landed, 2 = side or frontal impact.
function surfaceContact(dx,dz,oldDx,oldDz,halfW,halfL,top,sideW,sideL){
 if(Math.abs(dx)>=halfW+sideW||Math.abs(dz)>=halfL+sideL)return 0;
 if(jumpV<=0&&prevJumpY>=top-.015&&jumpY<=top){
   let dy=prevJumpY-jumpY,t=dy>1e-6?clamp((prevJumpY-top)/dy,0,1):1;
   let atX=oldDx+(dx-oldDx)*t,atZ=oldDz+(dz-oldDz)*t;
   if(Math.abs(atX)<=halfW+.30&&Math.abs(atZ)<=halfL+.55){
     jumpY=top+.025;jumpV=1.9;shake=Math.max(shake,.11);return 1;
   }
 }
 if(jumpY>=top-.015)return 1;
 return 2;
}
function obstacleContact(o){let dx=px-o.x,dz=distance-o.d;return surfaceContact(dx,dz,prevPlayerX-o.x,prevDistance-o.d,o.w*.5,o.l*.5,o.h,.43,.85);}
function playerContact(c){let tow=c.kind===1||c.kind===2,dx=c.x-px,dz=c.z,gap=tow?3.6:1.85,width=tow?1.38:.98;if(Math.abs(dz)>=gap||Math.abs(dx)>=width){c.sideSafe=false;return false;}let side=Math.abs(dx)>(tow?.82:.54);if(jumpY>.05&&side){if(!c.sideSafe){sideTouches++;notice('КАСАНИЕ В ПРЫЖКЕ · СПАСЁН');c.sideSafe=true;}return false;}return true;}
