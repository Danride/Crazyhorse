'use strict';
// A single rewarded continuation consumes one daily allowance only on confirmed success.
const REVIVE_DAILY_LIMIT=3;
let reviveDaily={day:'',used:0},reviveBusy=false,reviveMessage='',reviveUiClock=0,reviveIntro=false;
function normalizeReviveDaily(raw,day=localDay()){
 const valid=typeof raw?.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.day)&&raw.day>=day;
 return valid?{day:raw.day,used:Math.max(0,Math.min(REVIVE_DAILY_LIMIT,Math.floor(Number(raw.used)||0)))}:{day,used:0};
}
function mergeReviveDaily(a,b,day=localDay()){
 a=normalizeReviveDaily(a,day);b=normalizeReviveDaily(b,day);
 return a.day===b.day?{day:a.day,used:Math.max(a.used,b.used)}:a.day>b.day?a:b;
}
function reviveRemaining(){reviveDaily=normalizeReviveDaily(reviveDaily);return REVIVE_DAILY_LIMIT-reviveDaily.used;}
function reviveAvailable(){return vkReady&&!saveLoading&&(saveLocalOK||saveCloudRead)&&reviveRemaining()>0;}
function renderReviveOffer(){
 const end=state==='over',host=$('reviveOffer'),btn=$('reviveAd'),left=reviveRemaining();
 host.hidden=!end;
 if(!end)return;
 $('reviveCount').textContent='Сегодня осталось: '+left+' из '+REVIVE_DAILY_LIMIT;
 btn.disabled=reviveBusy||!reviveAvailable();
 btn.textContent=reviveBusy?'Проверяем рекламу…':left===0?'Лимит на сегодня исчерпан':'▶  Продолжить за рекламу';
 $('reviveStatus').textContent=reviveMessage||(!vkReady?'Доступно в VK при подключении рекламы.':!saveLocalOK&&!saveCloudRead?'Хранилище недоступно.':'');
 $('start').disabled=reviveBusy;$('backMenu').disabled=reviveBusy;
}
function reviveTick(){
 if(state!=='over')return;
 const t=Date.now();if(t-reviveUiClock<500)return;reviveUiClock=t;renderReviveOffer();
}
function rewardCall(method,ms){
 return new Promise(resolve=>{let settled=false;const finish=v=>{if(settled)return;settled=true;clearTimeout(timer);resolve(v);};
 const timer=setTimeout(()=>finish(null),ms);
 try{vkCall(method,{ad_format:'reward'}).then(finish,()=>finish(null));}catch(e){finish(null);}
 });
}
function resumeRewardedRun(){
 if(state!=='over')return false;
 releaseAllControls();resetSpeechMemory();stopHoofLoop();stopHorseVoice();
 health=100;invuln=3;hitFlash=0;shake=0;impactSlip=impactPush=0;vx=0;steer=0;jumpY=jumpV=prevJumpY=0;prevPlayerX=px;prevDistance=distance;prevPlayerYaw=playerYaw;
 // closeProgressRun() ran at death. Rebase the snapshot, never grant old XP or tasks twice.
 runProgressSnapshot=currentProgressCounters();lossReason='';crashLine='';vkHidden=false;
 state='intro';reviveIntro=true;introLeft=1.65;
 $('overlay').dataset.kind='revive';$('mode').textContent='ВТОРОЙ ШАНС';$('heading').textContent='Снова в седле!';$('description').textContent='3 секунды защиты после старта';$('resultStats').hidden=true;$('reviveOffer').hidden=true;
 $('start').textContent='ПРИГОТОВЬСЯ…';$('start').disabled=true;$('backMenu').style.display='none';
 $('overlay').classList.remove('hidden');if(audioOn)initAudio();updateHUD();return true;
}
async function requestRewardedRevive(){
 if(state!=='over'||reviveBusy||!reviveAvailable())return false;
 reviveBusy=true;reviveMessage='';renderReviveOffer();
 let resumed=false;
 try{
  const available=await rewardCall('VKWebAppCheckNativeAds',6500);
  if(available?.result!==true){reviveMessage='Реклама пока недоступна. Попробуй позже.';return false;}
  const result=await rewardCall('VKWebAppShowNativeAds',90000);
  if(result?.result!==true){reviveMessage='Просмотр не подтверждён. Попытка не списана.';return false;}
  reviveDaily=normalizeReviveDaily(reviveDaily);if(reviveDaily.used>=REVIVE_DAILY_LIMIT)return false;
  const previous={...reviveDaily};reviveDaily.used++;
  if(!saveCommit()){reviveDaily=previous;reviveMessage='Не удалось сохранить продолжение.';return false;}
  saveFlush();resumed=resumeRewardedRun();return resumed;
 }finally{reviveBusy=false;if(!resumed)renderReviveOffer();}
}
$('reviveAd').onclick=requestRewardedRevive;
