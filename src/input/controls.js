'use strict';
$('start').onclick=start;$('pause').onclick=()=>state==='running'?pause():state==='paused'?start():null;$('cleanPause').onclick=$('pause').onclick;
const touchPointers=new Map(),keyboardKeys=new Set();
function updateControlKey(k){if(keyboardKeys.has(k)||[...touchPointers.values()].some(p=>p.key===k))keys.add(k);else keys.delete(k);}
function releaseTouchPointer(id){
 const p=touchPointers.get(id);if(!p)return;touchPointers.delete(id);updateControlKey(p.key);
 if(![...touchPointers.values()].some(q=>q.button===p.button))p.button.classList.remove('active');
}
function releaseAllControls(){
 for(const p of touchPointers.values())p.button.classList.remove('active');
 touchPointers.clear();keyboardKeys.clear();keys.clear();jumpQueued=false;jumpHeld=false;
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
