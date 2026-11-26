'use strict';
const bubblePool=[],speechMemory=new Map();
function clearBubbles(){for(let el of bubblePool)el.hidden=true;}
function resetSpeechMemory(){speechMemory.clear();resetSpeechGate();clearBubbles();}
function rememberSpeech(c,urgent=false){if(!c.words)return;let a=speechMemory.get(c);if(!a||a.words!==c.words){a={c,words:c.words,rude:!!c.wordsRude,side:c.x<px?-1:1,last:nowTime,shown:false,urgent};speechMemory.set(c,a);}if(urgent){a.last=nowTime;a.urgent=true;}}
function projectPoint(x,y,z){if(!cameraView)return null;let [cx,cy,yaw,pitch,lx,ly]=cameraView;let dx=x-cx,dy=y-cy,xx=dx*Math.cos(yaw)-z*Math.sin(yaw),zz=dx*Math.sin(yaw)+z*Math.cos(yaw),yy=dy*Math.cos(pitch)+zz*Math.sin(pitch),depth=zz*Math.cos(pitch)-dy*Math.sin(pitch);if(depth<.65)return null;return {x:W*(.5+xx*lx/depth*.5),y:H*(.5-yy*ly/depth*.5),depth};}
function renderBubbles(){
 clearBubbles();if(state!=='running')return;
 const c=speechOwner;if(!c||c.voiceOnly||!c.words||c.wordsUntil<=nowTime){speechMemory.clear();return;}
 // A dead rider's normal line can finish at the edge; an actual crash ghost stays on the road.
 if(c.crashGhost)c.z=c.d-distance;
 for(const k of speechMemory.keys())if(k!==c)speechMemory.delete(k);
 rememberSpeech(c,speechPriority>=3);const m=speechMemory.get(c);
 // rememberSpeech's urgent flag must not renew the linger timer every render.
 if(m.renderedAt===undefined){m.renderedAt=nowTime;m.last=nowTime;}
 const p=!c.dead?projectPoint(c.x-Math.sin(c.yaw||0)*.22,c.kind===3?3.05:2.95,c.z-Math.cos(c.yaw||0)*.22):null;
 const visible=p&&p.depth<Math.min(weatherFar()*.84,230)&&p.x>10&&p.x<W-10&&p.y>75&&p.y<H-25;
 let anchor=p,atEdge=false;
 if(visible){m.shown=true;m.lastVisible=nowTime;m.side=c.x<px?-1:1;}
 else{
  if(!m.shown&&speechPriority<3&&c.z>=10)return;
  if(m.lastVisible!==undefined&&nowTime-m.lastVisible>2.8){endSpeechEarly(c);speechMemory.delete(c);return;}
  if(m.edgeSince===undefined)m.edgeSince=nowTime;
  if(nowTime-m.edgeSince>2.8&&!m.shown){endSpeechEarly(c);speechMemory.delete(c);return;}
  anchor={x:m.side<0?95:W-95,y:H*.52};atEdge=true;
 }
 if(visible)m.edgeSince=undefined;
 let el=bubblePool[0];if(!el){el=document.createElement('div');el.className='speechBubble';let span=document.createElement('span'),tail=document.createElement('i');tail.className='tail';el.append(span,tail);$('speechLayer').append(el);bubblePool.push(el);}
 el.firstChild.textContent=c.words;el.classList.toggle('rude',!!c.wordsRude);el.classList.toggle('speechBehind',atEdge);el.hidden=false;
 const w=el.offsetWidth,h=el.offsetHeight,x=clamp(anchor.x,w/2+8,Math.max(w/2+8,W-w/2-8)),y=clamp(anchor.y,h+8,H-25);
 el.style.left=x+'px';el.style.top=y+'px';el.lastChild.style.left=(w/2+anchor.x-x)+'px';
}
