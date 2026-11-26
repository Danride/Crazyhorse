'use strict';
const bubblePool=[],speechMemory=new Map();
function clearBubbles(){for(let el of bubblePool)el.hidden=true;}
function resetSpeechMemory(){speechMemory.clear();clearBubbles();}
function rememberSpeech(c,urgent=false){if(!c.words)return;let a=speechMemory.get(c);if(!a||a.words!==c.words){a={c,words:c.words,rude:!!c.wordsRude,side:c.x<px?-1:1,last:nowTime,shown:false,urgent};speechMemory.set(c,a);}if(urgent){a.last=nowTime;a.urgent=true;}}
function projectPoint(x,y,z){if(!cameraView)return null;let [cx,cy,yaw,pitch,lx,ly]=cameraView;let dx=x-cx,dy=y-cy,xx=dx*Math.cos(yaw)-z*Math.sin(yaw),zz=dx*Math.sin(yaw)+z*Math.cos(yaw),yy=dy*Math.cos(pitch)+zz*Math.sin(pitch),depth=zz*Math.cos(pitch)-dy*Math.sin(pitch);if(depth<.65)return null;return {x:W*(.5+xx*lx/depth*.5),y:H*(.5-yy*ly/depth*.5),depth};}
function renderBubbles(){
 clearBubbles();if(state!=='running')return;
 const ghosts=crashTalk.filter(g=>g.until>nowTime).map(g=>({x:g.x,z:g.d-distance,yaw:0,kind:0,words:g.words,wordsUntil:g.until,wordsRude:true}));
 const candidates=[],live=new Set();
 for(const c of traffic.concat(ghosts)){
  if(c.dead||!c.words||c.wordsUntil<=nowTime)continue;
  const p=projectPoint(c.x-Math.sin(c.yaw)*.22,c.kind===3?3.05:2.95,c.z-Math.cos(c.yaw)*.22);
  if(p&&p.depth<Math.min(weatherFar()*.84,230)&&p.x>10&&p.x<W-10&&p.y>75&&p.y<H-25){candidates.push({c,p,words:c.words,rude:!!c.wordsRude,edge:false});live.add(c);}
 }
 for(const [c,a] of speechMemory){
  if(nowTime-a.last>2.8||(!a.shown&&!a.urgent)){speechMemory.delete(c);continue;}
  if(!live.has(c)&&(c.z<10||c.dead||!traffic.includes(c)))candidates.push({c,p:{x:a.side<0?95:W-95,y:H*.52,depth:999},words:a.words,rude:a.rude,edge:true});
 }
 candidates.sort((a,b)=>Number(b.rude)-Number(a.rude)||Number(b.edge)-Number(a.edge)||a.p.depth-b.p.depth);
 let placed=[],edges=0;const hasEdge=candidates.some(a=>a.edge);
 for(const a of candidates){if(placed.length>=4)break;if(a.edge&&edges>=2)continue;if(!a.edge&&hasEdge&&edges===0&&placed.length>=3)continue;
  const {c,p}=a;let el=bubblePool[placed.length];if(!el){el=document.createElement('div');el.className='speechBubble';let span=document.createElement('span'),tail=document.createElement('i');tail.className='tail';el.append(span,tail);$('speechLayer').append(el);bubblePool.push(el);}
  el.firstChild.textContent=a.words;el.classList.toggle('rude',a.rude);el.classList.toggle('speechBehind',a.edge);el.hidden=false;
  let w=el.offsetWidth,h=el.offsetHeight,x=clamp(p.x,w/2+8,W-w/2-8),y=a.edge?p.y+edges*64:p.y;
  el.style.left=x+'px';el.style.top=y+'px';el.lastChild.style.left=(w/2+p.x-x)+'px';
  let r={l:x-w/2,r:x+w/2,t:y-h,b:y};if(r.t<5||placed.some(o=>r.l<o.r+8&&r.r>o.l-8&&r.t<o.b+8&&r.b>o.t-8)){el.hidden=true;continue;}
  placed.push(r);if(a.edge)edges++;else if(!ghosts.includes(c)){rememberSpeech(c);const m=speechMemory.get(c);m.last=nowTime;m.shown=true;m.side=c.x<px?-1:1;}
 }
}
