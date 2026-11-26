'use strict';
let startupLoaded=0,startupTotal=0,startupStage='Подготовка страницы',startupError='',startupReady=false,startupBridge='Проверка окружения…',startupLastStep=Date.now(),startupSlow=false;
function startupPaint(){
 const p=document.getElementById('startupScreen');if(!p)return;
 const t=document.getElementById('startupText'),v=document.getElementById('startupBridge'),retry=document.getElementById('startupRetry');
 if(t)t.textContent=startupError||(startupSlow?'Долгая загрузка · ':'Загрузка · ')+(startupTotal?startupLoaded+'/'+startupTotal+' · ':'')+startupStage;
 if(v)v.textContent=startupBridge;
 if(retry)retry.hidden=!(startupError||startupSlow);
 if(startupReady)p.hidden=true;
}
function startupStep(stage,loaded,total){if(startupReady)return;startupStage=stage;startupLoaded=loaded;startupTotal=total;startupLastStep=Date.now();startupSlow=false;startupPaint();}
function startupFail(msg){if(startupReady)return;if(!startupError)startupError=String(msg).slice(0,350);startupPaint();}
function startupGameReady(){if(startupReady)return;startupReady=true;startupError='';startupStage='Меню готово';startupPaint();}
function startupBridgeStatus(msg){startupBridge=msg;startupPaint();}
addEventListener('error',e=>{
 const target=e.target;
 if(target?.tagName==='SCRIPT'){startupFail('Не загружен файл: '+(target.getAttribute('src')||'script'));return;}
 if(e.message)startupFail('Ошибка игры: '+e.message+(e.filename?' ('+e.filename.split(/[?#]/)[0].split('/').pop().slice(0,100)+':'+e.lineno+')':''));
},true);
addEventListener('unhandledrejection',e=>startupFail('Ошибка запуска: '+(e.reason?.message||String(e.reason))));
document.addEventListener('DOMContentLoaded',startupPaint);
if(typeof setInterval==='function'){const startupWatch=setInterval(()=>{if(startupReady||startupError){clearInterval(startupWatch);return;}if(Date.now()-startupLastStep>15000){startupSlow=true;startupPaint();}},1000);}
