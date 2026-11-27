'use strict';
const coinGold=col('f9cb36'),coinDark=col('b7750c'),coinFace=col('f5df65'),coinLogo=col('996007');
// A faceted circular coin, with a pixel-art horse head on both faces.
const horseStamp=['000110100','000111100','001111110','011111111','011110111','001111100','000111000','001110000','011110000'];
function drawCoinDetailed(c){let z=c.d-distance;if(c.dead||z<-8||z>Math.min(145,weatherFar()+10))return;let y=c.y+Math.sin(nowTime*4.2+c.spin)*.09,x=c.x,spin=nowTime*3.3+c.spin;placeModel(x,z,spin,()=>{let r=.35,ri=.292,h=.060,N=16;for(let i=0;i<N;i++){let a=i*2*Math.PI/N,b=(i+1)*2*Math.PI/N,ax=Math.cos(a),ay=Math.sin(a),bx=Math.cos(b),by=Math.sin(b),p=(u,v,r,zz)=>[x+u*r,y+v*r,z+zz];quad(p(ax,ay,r,-h),p(bx,by,r,-h),p(bx,by,r,h),p(ax,ay,r,h),shade(coinDark,.88+.22*Math.sin(a+.5)));for(let side of [-1,1]){quad(p(ax,ay,r,side*h),p(bx,by,r,side*h),p(bx,by,ri,side*(h+.014)),p(ax,ay,ri,side*(h+.014)),coinGold);vertex([x,y,z+side*(h+.014)],coinFace);vertex(p(ax,ay,ri,side*(h+.014)),coinFace);vertex(p(bx,by,ri,side*(h+.014)),coinFace);}}let u=.050;for(let j=0;j<horseStamp.length;j++)for(let i=0;i<9;i++)if(horseStamp[j][i]==='1'){for(let side of [-1,1]){let xx=x+(i-4)*u*side,yy=y+(4-j)*u,zz=z+side*(h+.018);quad([xx-u/2,yy-u/2,zz],[xx+u/2,yy-u/2,zz],[xx+u/2,yy+u/2,zz],[xx-u/2,yy+u/2,zz],coinLogo);}}});}
// Use the original stamped coin up close; far coins share a cheap eight-sided silhouette.
function drawCoin(c){
 if(c.insurance){drawInsurance(c);return;}
 let z=c.d-distance;if(c.dead||z<-8||z>Math.min(155,weatherFar()+10))return;
 if(z<28&&quality>0){drawCoinDetailed(c);return;}
 let x=c.x,y=c.y+Math.sin(nowTime*4.2+c.spin)*.09,spin=nowTime*3.3+c.spin;
 placeModel(x,z,spin,()=>{let r=.35,h=.06,N=10;for(let i=0;i<N;i++){let a=i*Math.PI*2/N,b=(i+1)*Math.PI*2/N,ax=x+Math.cos(a)*r,ay=y+Math.sin(a)*r,bx=x+Math.cos(b)*r,by=y+Math.sin(b)*r;
 quad([ax,ay,z-h],[bx,by,z-h],[bx,by,z+h],[ax,ay,z+h],coinDark);
 for(let side of [-1,1]){let zz=z+side*h;vertex([x,y,zz],coinFace);vertex([ax,ay,zz],coinGold);vertex([bx,by,zz],coinGold);}}
 if(z<45){for(let side of [-1,1]){let zz=z+side*(h+.014);quad([x-.10,y-.17,zz],[x+.10,y-.17,zz],[x+.10,y+.17,zz],[x-.10,y+.17,zz],coinLogo);}}});
}
function coinSafe(x,d){return !obstacles.some(o=>Math.abs(o.d-d)<o.l*.5+1.8&&Math.abs(o.x-x)<o.w*.5+1.0)&&!holes.some(h=>h.danger&&Math.abs(h.d-d)<h.l*.5+1.8&&Math.abs(h.x-x)<h.w*.5+1.0);}
function spawnCoinLine(start,count,x,step,lift=0,endX=x,allowInsurance=false){
 const slots=[];
 for(let i=0;i<count;i++){let t=i/Math.max(1,count-1),xx=clamp(x+(endX-x)*t,-edge+1,edge-1),d=start+i*step;if(!coinSafe(xx,d))continue;slots.push({x:xx,d,y:.82+lift,spin:rand(0,6.28),dead:false});}
 if(allowInsurance&&slots.length&&Math.random()<INSURANCE_CHANCE)slots[Math.floor(Math.random()*slots.length)].insurance=true;
 coins.push(...slots);
}
function bestCoinLane(d,count,step,preferred){let lanes=[0,1,2,3,4,5].map(laneX);if(preferred===0)lanes.unshift(0);let best=lanes[0],score=-Infinity;for(let x of lanes){let good=0;for(let i=0;i<count;i++)if(coinSafe(x,d+i*step))good++;let value=good*4+(x===preferred?1.5:0)+rand(0,.9);if(value>score){score=value;best=x;}}return best;}
function coinWorld(){
 while(nextCoin<distance+430){let d=nextCoin,count=Math.floor(rand(12,17)),step=2.5,preferred=d<20?0:laneX(Math.floor(rand(0,6))),x=bestCoinLane(d,count,step,preferred);
 spawnCoinLine(d,count,x,step,0,x,true);
 if(Math.random()<.32){let other=x<0?x+laneW:x-laneW;other=clamp(other,-edge+1,edge-1);if(Math.abs(other-x)>2)spawnCoinLine(d+5,count-4,other,step);}
 nextCoin+=count*step+rand(5,10);
 }
 coins=coins.filter(c=>!c.dead&&c.d>distance-25&&c.d<distance+520&&coinSafe(c.x,c.d));
}
function coinSweep(c,oldD,newD,oldX,newX,oldY,newY){
 const step=newD-oldD;
 if(c.d<oldD-1.25||c.d>newD+1.25)return false;
 const t=step>0?Math.max(0,Math.min(1,(c.d-oldD)/step)):0;
 return Math.abs(c.x-(oldX+(newX-oldX)*t))<1.02&&Math.abs(c.y-(.8+oldY+(newY-oldY)*t))<.95;
}
function syncWalletUI(){if($('menuCoins'))$('menuCoins').textContent=wallet;if($('sound'))$('sound').textContent='ЗВУК: '+(audioOn?'ВКЛ':'ВЫКЛ');if($('menuSound'))$('menuSound').textContent='ЗВУК';}function collectCoin(c){if(c.dead)return;if(c.insurance){collectInsurance(c);return;}c.dead=true;coinCount++;wallet++;saveCommit();syncWalletUI();coinChime();}
function coinChime(){if(!audioOn||!audio||audio.state!=='running')return;try{let t=audio.currentTime,g=audio.createGain(),o=audio.createOscillator();o.type='sine';o.frequency.setValueAtTime(950,t);o.frequency.setValueAtTime(1450,t+.045);g.gain.setValueAtTime(.10,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.14);}catch(e){}}
