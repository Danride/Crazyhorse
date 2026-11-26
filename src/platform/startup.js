'use strict';
let startupLoaded=0,startupError='',startupReady=false,startupBridge='Проверка окружения…';
function startupPaint(){
 const p=document.getElementById('startupScreen');if(!p)return;
 const t=document.getElementById('startupText'),v=document.getElementById('startupBridge'),retry=document.getElementById('startupRetry');
 if(t)t.textContent=startupError||'Загрузка игры · '+startupLoaded+' скриптов';
 if(v)v.textContent=startupBridge;
 if(retry)retry.hidden=!startupError;
 if(startupReady&&!startupError)p.hidden=true;
}
function startupFail(msg){if(!startupError)startupError=String(msg).slice(0,350);startupPaint();}
function startupGameReady(){if(startupReady)return;startupReady=true;startupPaint();}
function startupBridgeStatus(msg){startupBridge=msg;startupPaint();}
addEventListener('error',e=>{
 const target=e.target;
 if(target?.tagName==='SCRIPT'){startupFail('Не загружен файл: '+(target.getAttribute('src')||'script'));return;}
 if(e.message)startupFail('Ошибка игры: '+e.message+(e.filename?' ('+e.filename.split('/').pop()+':'+e.lineno+')':''));
},true);
addEventListener('load',e=>{if(e.target?.tagName==='SCRIPT'){startupLoaded++;startupPaint();}},true);
document.addEventListener('DOMContentLoaded',startupPaint);
