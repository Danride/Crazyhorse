'use strict';
$('start').onclick=start;$('pause').onclick=()=>state==='running'?pause():state==='paused'?start():null;$('cleanPause').onclick=$('pause').onclick;
const touchPointers=new Map(),keyboardKeys=new Set();
let steeringPointer=null,steeringTarget=0,steeringLastX=0;
function beginDrag(id,x){if(state!=='running'||steeringPointer!==null)return false;steeringPointer=id;steeringLastX=x;steeringTarget=px;return true;}
function moveDrag(id,x){if(id!==steeringPointer)return false;const dx=x-steeringLastX;steeringLastX=x;steeringTarget=clamp(steeringTarget+dx*(2*(edge-.75)/Math.max(100,W*.43)),-edge+.75,edge-.75);return true;}
function finishDrag(id){if(id!==steeringPointer)return false;steeringPointer=null;steeringTarget=px;return true;}
function dragSteeringDirection(maxV){if(steeringPointer===null)return 0;const error=steeringTarget-px;if(Math.abs(error)<.035&&Math.abs(vx)<.12)return 0;return clamp(error*4.8/Math.max(.1,maxV),-1,1);}
function updateControlKey(k){if(keyboardKeys.has(k)||[...touchPointers.values()].some(p=>p.key===k))keys.add(k);else keys.delete(k);}
function releaseTouchPointer(id){
 const p=touchPointers.get(id);if(!p)return;touchPointers.delete(id);updateControlKey(p.key);
 if(![...touchPointers.values()].some(q=>q.button===p.button))p.button.classList.remove('active');
}
function releaseAllControls(){
 for(const p of touchPointers.values())p.button.classList.remove('active');
 touchPointers.clear();keyboardKeys.clear();keys.clear();steeringPointer=null;steeringTarget=px;jumpQueued=false;jumpHeld=false;
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
function suspendControls(){releaseAllControls();if(state==='running')pause();recordProgress(true);stopHoofLoop();stopHorseVoice();}
addEventListener('blur',suspendControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendControls();});
document.querySelectorAll('[data-key]').forEach(b=>{
 const k=b.dataset.key;
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(pressTouchPointer(e.pointerId,k,b)){try{b.setPointerCapture(e.pointerId);}catch(err){}}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>releaseTouchPointer(e.pointerId));
 b.addEventListener('contextmenu',e=>e.preventDefault());
});
addEventListener('pointerup',e=>releaseTouchPointer(e.pointerId));addEventListener('pointercancel',e=>releaseTouchPointer(e.pointerId));

// Invisible full-height zones. Pointer capture keeps a left drag active even if it crosses the centre.
const steerZone=$('steerZone'),jumpZone=$('jumpZone');
function isTouchInput(e){return e.pointerType==='touch'||e.pointerType==='pen';}
steerZone.addEventListener('pointerdown',e=>{if(!isTouchInput(e)||!beginDrag(e.pointerId,e.clientX))return;e.preventDefault();try{steerZone.setPointerCapture(e.pointerId);}catch(err){}});
steerZone.addEventListener('pointermove',e=>{if(moveDrag(e.pointerId,e.clientX))e.preventDefault();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])steerZone.addEventListener(event,e=>finishDrag(e.pointerId));
jumpZone.addEventListener('pointerdown',e=>{if(state!=='running'||!isTouchInput(e))return;e.preventDefault();jumpQueued=true;});
for(const zone of [steerZone,jumpZone])zone.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerup',e=>finishDrag(e.pointerId));addEventListener('pointercancel',e=>finishDrag(e.pointerId));
