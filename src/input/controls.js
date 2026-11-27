'use strict';
$('start').onclick=start;$('pause').onclick=()=>state==='running'?pause():state==='paused'?start():null;$('cleanPause').onclick=$('pause').onclick;
const touchPointers=new Map(),keyboardKeys=new Set();
let steeringPointer=null,stickOriginX=0,stickOriginY=0,stickRadius=44,stickValue=0;
let stickDrawX=0,stickDrawY=0,stickDrawDX=0,stickDrawDY=0;
function stickResponse(raw){const dead=.12,a=Math.min(1,Math.abs(raw));return a<=dead?0:Math.sign(raw)*Math.pow((a-dead)/(1-dead),1.25);}
function paintStick(active){
 const el=$('mobileStick'),knob=$('stickKnob');if(!el||!knob)return;
 el.classList.toggle('held',active);
 if(active){el.style.left=stickDrawX+'px';el.style.top=stickDrawY+'px';el.style.bottom='auto';}
 else{el.style.left='';el.style.top='';el.style.bottom='';}
 knob.style.transform='translate('+stickDrawDX+'px,'+stickDrawDY+'px)';
}
function beginDrag(id,x,y=0){
 if(state!=='running'||steeringPointer!==null)return false;
 const rect=$('steerZone').getBoundingClientRect();
 stickRadius=clamp(Math.min(rect.width,rect.height)*.23,32,49);
 // The stick floats to the initial touch, keeping the visible ring within the usable half.
 const margin=stickRadius+8;
 stickDrawX=clamp(x-rect.left,Math.min(margin,rect.width/2),Math.max(rect.width/2,rect.width-margin));
 stickDrawY=clamp(y-rect.top,Math.min(margin,rect.height/2),Math.max(rect.height/2,rect.height-margin));
 steeringPointer=id;stickOriginX=x;stickOriginY=y;stickValue=0;stickDrawDX=stickDrawDY=0;
 $('mobileStick').style.setProperty('--stick-radius',stickRadius+'px');paintStick(true);return true;
}
function moveDrag(id,x,y=stickOriginY){
 if(id!==steeringPointer)return false;
 const dx=x-stickOriginX,dy=y-stickOriginY;
 // Only horizontal intent controls reins; vertical drift cannot reduce full steering.
 stickValue=stickResponse(dx/stickRadius);
 stickDrawDX=clamp(dx,-stickRadius,stickRadius);stickDrawDY=clamp(dy,-stickRadius*.22,stickRadius*.22);
 paintStick(true);return true;
}
function finishDrag(id){
 if(id!==steeringPointer)return false;
 steeringPointer=null;stickValue=0;stickDrawDX=stickDrawDY=0;paintStick(false);return true;
}
function dragSteeringDirection(){return steeringPointer===null?0:stickValue;}
function updateControlKey(k){if(keyboardKeys.has(k)||[...touchPointers.values()].some(p=>p.key===k))keys.add(k);else keys.delete(k);}
function releaseTouchPointer(id){
 const p=touchPointers.get(id);if(!p)return;touchPointers.delete(id);updateControlKey(p.key);
 if(![...touchPointers.values()].some(q=>q.button===p.button))p.button.classList.remove('active');
}
function releaseAllControls(){
 for(const p of touchPointers.values())p.button.classList.remove('active');
 touchPointers.clear();keyboardKeys.clear();keys.clear();if(steeringPointer!==null)finishDrag(steeringPointer);jumpQueued=false;jumpHeld=false;
}
function pressTouchPointer(id,k,button){
 if(state!=='running')return false;
 if(touchPointers.has(id))releaseTouchPointer(id);
 touchPointers.set(id,{key:k,button});updateControlKey(k);button.classList.add('active');
 if(k==='Space')jumpQueued=true;return true;
}
addEventListener('keydown',e=>{
 if(state==='menu'&&(e.target?.tagName==='SELECT'||e.target?.tagName==='BUTTON'))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter','Escape','KeyW','KeyA','KeyS','KeyD','KeyR','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(state==='running'&&['ArrowLeft','ArrowRight','KeyA','KeyD','Space'].includes(e.code)){keyboardKeys.add(e.code);updateControlKey(e.code);if(e.code==='Space')jumpQueued=true;}
 if(e.code==='Enter'&&state!=='running')start();
 if(e.code==='Escape'){if(state==='running')pause();else if(state==='paused')start();else if(state==='menu')showMenuPane('home');}
 if(e.code==='KeyR'&&state!=='menu'){releaseAllControls();state='ready';start();}
});
addEventListener('keyup',e=>{keyboardKeys.delete(e.code);updateControlKey(e.code);});
function suspendControls(){releaseAllControls();if(state==='running')pause();recordProgress(true);saveFlush();stopHoofLoop();stopHorseVoice();}
addEventListener('blur',suspendControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendControls();});
document.querySelectorAll('[data-key]').forEach(b=>{
 const k=b.dataset.key;
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(pressTouchPointer(e.pointerId,k,b)){try{b.setPointerCapture(e.pointerId);}catch(err){}}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>releaseTouchPointer(e.pointerId));
 b.addEventListener('contextmenu',e=>e.preventDefault());
});
addEventListener('pointerup',e=>releaseTouchPointer(e.pointerId));addEventListener('pointercancel',e=>releaseTouchPointer(e.pointerId));

// Floating analog stick on the left; jump is independent on the right.
const steerZone=$('steerZone'),jumpZone=$('jumpZone');
function isTouchInput(e){return e.pointerType==='touch'||e.pointerType==='pen';}
steerZone.addEventListener('pointerdown',e=>{if(!isTouchInput(e)||!beginDrag(e.pointerId,e.clientX,e.clientY))return;e.preventDefault();try{steerZone.setPointerCapture(e.pointerId);}catch(err){}});
steerZone.addEventListener('pointermove',e=>{if(moveDrag(e.pointerId,e.clientX,e.clientY))e.preventDefault();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])steerZone.addEventListener(event,e=>finishDrag(e.pointerId));
jumpZone.addEventListener('pointerdown',e=>{if(state!=='running'||!isTouchInput(e))return;e.preventDefault();jumpQueued=true;});
for(const zone of [steerZone,jumpZone])zone.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerup',e=>finishDrag(e.pointerId));addEventListener('pointercancel',e=>finishDrag(e.pointerId));
addEventListener('resize',()=>{if(steeringPointer!==null)finishDrag(steeringPointer);});
