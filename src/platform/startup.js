'use strict';
let startupLoaded=0,startupTotal=0,startupStage='Подготовка страницы',startupError='',startupReady=false,startupBridge='Проверка окружения…',startupLastStep=Date.now(),startupSlow=false;
function startupPaint(){
 const p=document.getElementById('startupScreen');if(!p)return;
 const bar=document.getElementById('startupProgress'),track=document.getElementById('startupTrack'),retry=document.getElementById('startupRetry');
 const value=startupReady?100:startupTotal?Math.min(96,Math.round(startupLoaded/startupTotal*96)):3;
 if(bar)bar.style.width=value+'%';
 if(track)track.setAttribute('aria-valuenow',String(value));
 if(retry)retry.hidden=startupReady||!(startupError||startupSlow);
 if(startupReady)p.hidden=true;
}
function startupStep(stage,loaded,total){if(startupReady)return;startupStage=stage;startupLoaded=loaded;startupTotal=total;startupLastStep=Date.now();startupSlow=false;startupPaint();}
function startupFail(msg){if(startupReady)return;if(!startupError){startupError=String(msg).slice(0,350);console.error('[Crazy Horse startup]',startupStage,startupError);}startupPaint();}
function startupGameReady(){if(startupReady)return;startupReady=true;startupError='';startupStage='Меню готово';startupPaint();}
function startupBridgeStatus(msg){startupBridge=msg;console.info('[Crazy Horse VK]',msg);startupPaint();}
addEventListener('error',e=>{
 const target=e.target;
 if(target?.tagName==='SCRIPT'){startupFail('Не загружен файл: '+(target.getAttribute('src')||'script'));return;}
 if(e.message)startupFail('Ошибка игры: '+e.message+(e.filename?' ('+e.filename.split(/[?#]/)[0].split('/').pop().slice(0,100)+':'+e.lineno+')':''));
},true);
addEventListener('unhandledrejection',e=>startupFail('Ошибка запуска: '+(e.reason?.message||String(e.reason))));
document.addEventListener('DOMContentLoaded',startupPaint);
if(typeof setInterval==='function'){const startupWatch=setInterval(()=>{if(startupReady||startupError){clearInterval(startupWatch);return;}if(!startupSlow&&Date.now()-startupLastStep>15000){startupSlow=true;console.warn('[Crazy Horse startup] Slow loading:',startupStage,startupLoaded+'/'+startupTotal);startupPaint();}},1000);}
