'use strict';
// Player progression is independent of the existing horse upgrade and coin saves.
const PROGRESSION_KEY='crazy-horse-progression-v1';
const DAILY_METRICS=['meters','coins','passes','score'];
const DAILY_TASKS={
 meters:{label:'Дальний тракт',description:'Проехать 1500 м суммарно',target:1500,xp:100,unit:'м'},
 coins:{label:'Золотая подкова',description:'Собрать 60 монет',target:60,xp:90,unit:''},
 passes:{label:'Лихой всадник',description:'Обогнать 75 участников движения',target:75,xp:110,unit:''},
 score:{label:'Мастер манёвров',description:'Набрать 350 очков',target:350,xp:100,unit:''}
};
function localDay(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function dayTasks(day){const n=Number(day.replaceAll('-',''))||0,rotating=['coins','passes','score'];return ['meters',...rotating.filter((_,i)=>i!==n%3)];}
function cleanProgressNumber(v){return Number.isFinite(Number(v))?Math.max(0,Math.min(1e12,Math.floor(Number(v)))):0;}
function freshDaily(day){return {day,counts:{meters:0,coins:0,passes:0,score:0},claimed:[]};}
function loadProgression(day=localDay()){
 let saved={};try{saved=JSON.parse(localStorage.getItem(PROGRESSION_KEY)||'{}')||{};}catch(e){}
 const validDay=typeof saved.daily?.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(saved.daily.day)&&saved.daily.day>=day;
 const daily=freshDaily(validDay?saved.daily.day:day);
 if(validDay){for(const k of DAILY_METRICS)daily.counts[k]=Math.min(DAILY_TASKS[k].target,cleanProgressNumber(saved.daily.counts?.[k]));daily.claimed=Array.isArray(saved.daily.claimed)?[...new Set(saved.daily.claimed.filter(k=>dayTasks(daily.day).includes(k)&&daily.counts[k]>=DAILY_TASKS[k].target))]:[];}
 return {xp:cleanProgressNumber(saved.xp),daily};
}
let playerProgress=loadProgression(),progressDirty=false,progressSaveError=false,progressLastSave=0,progressMenuCheck=0,runProgressSnapshot=null,runEarnedXp=0,runStartLevel=1;
function levelInfo(xp=playerProgress.xp){
 xp=cleanProgressNumber(xp);
 // XP required for level L -> L+1: 100 + 50*(L-1).
 // Total to enter level L: 25*(L-1)*(L-1)+75*(L-1).
 let n=Math.max(0,Math.floor((-75+Math.sqrt(5625+100*xp))/50));
 const total=k=>25*k*k+75*k;
 while(n>0&&total(n)>xp)n--;while(total(n+1)<=xp)n++;
 const level=n+1,need=100+50*n,within=xp-total(n);
 const rank=level>=50?'Легенда тракта':level>=25?'Мастер поводьев':level>=15?'Рыцарь дороги':level>=10?'Лихой всадник':level>=5?'Опытный наездник':'Конюх-новобранец';
 return {level,need,within,rank};
}
function refreshDaily(day=localDay()){
 // Never reset the same day twice if the local clock is moved backwards.
 if(day<=playerProgress.daily.day)return false;
 playerProgress.daily=freshDaily(day);progressDirty=true;return true;
}
function saveProgression(force=false){
 if(!progressDirty)return true;
 const t=Date.now();if(!force&&t-progressLastSave<2000)return true;
 try{localStorage.setItem(PROGRESSION_KEY,JSON.stringify(playerProgress));progressDirty=false;progressSaveError=false;progressLastSave=t;return true;}
 catch(e){progressSaveError=true;progressLastSave=t;return false;}
}
function currentProgressCounters(){return {meters:Math.floor(distance),coins:coinCount,passes,score:runScore};}
function counterXp(c){return Math.floor(c.meters/10)+Math.floor(c.coins/5)+c.passes+Math.floor(c.score/20);}
function beginProgressRun(){
 runProgressSnapshot={meters:0,coins:0,passes:0,score:0};runEarnedXp=0;runStartLevel=levelInfo().level;
 refreshDaily();saveProgression(true);
}
function recordProgress(force=false){
 refreshDaily();
 if(runProgressSnapshot){
  const next=currentProgressCounters(),prev=runProgressSnapshot;
  for(const k of DAILY_METRICS){const delta=Math.max(0,next[k]-prev[k]);if(delta){const before=playerProgress.daily.counts[k];playerProgress.daily.counts[k]=Math.min(DAILY_TASKS[k].target,before+delta);if(before!==playerProgress.daily.counts[k])progressDirty=true;}}
  const gain=Math.max(0,counterXp(next)-counterXp(prev));if(gain){playerProgress.xp+=gain;runEarnedXp+=gain;progressDirty=true;}
  runProgressSnapshot=next;
 }
 return saveProgression(force);
}
function closeProgressRun(){recordProgress(true);runProgressSnapshot=null;}
function dailyReadyCount(){return dayTasks(playerProgress.daily.day).filter(k=>playerProgress.daily.counts[k]>=DAILY_TASKS[k].target&&!playerProgress.daily.claimed.includes(k)).length;}
function claimDaily(k){
 refreshDaily();
 const task=DAILY_TASKS[k],daily=playerProgress.daily;
 if(state!=='menu'||!task||!dayTasks(daily.day).includes(k)||daily.claimed.includes(k)||daily.counts[k]<task.target)return false;
 const oldXp=playerProgress.xp;daily.claimed.push(k);playerProgress.xp+=task.xp;progressDirty=true;
 if(!saveProgression(true)){daily.claimed.pop();playerProgress.xp=oldXp;progressDirty=true;renderProgression();return false;}
 renderProgression();return true;
}
function renderProgression(){
 const info=levelInfo(),daily=playerProgress.daily;
 $('playerLevel').textContent=info.level;$('playerRank').textContent=info.rank;$('playerXp').textContent=info.within+' / '+info.need+' XP';$('playerXpBar').style.width=(100*info.within/info.need)+'%';
 $('dailyReady').textContent=dailyReadyCount()?String(dailyReadyCount()):'';
 $('dailyDate').textContent=daily.day.split('-').reverse().join('.');
 const host=$('dailyTasks');host.innerHTML='';
 for(const k of dayTasks(daily.day)){
  const task=DAILY_TASKS[k],value=daily.counts[k],claimed=daily.claimed.includes(k),ready=value>=task.target;
  const card=document.createElement('article');card.className='dailyCard'+(claimed?' claimed':'');
  const title=document.createElement('b');title.textContent=task.label;
  const desc=document.createElement('p');desc.textContent=task.description;
  const track=document.createElement('div');track.className='dailyTrack';const bar=document.createElement('i');bar.style.width=(100*value/task.target)+'%';track.append(bar);
  const meta=document.createElement('div');meta.className='dailyMeta';meta.textContent=value+' / '+task.target+(task.unit?' '+task.unit:'')+' · +'+task.xp+' XP';
  const button=document.createElement('button');button.className='dailyClaim';button.textContent=claimed?'Получено':ready?'Забрать '+task.xp+' XP':'В процессе';button.disabled=claimed||!ready;button.onclick=()=>claimDaily(k);
  card.append(title,desc,track,meta,button);host.append(card);
 }
 $('dailyMessage').textContent=progressSaveError?'Не удалось сохранить прогресс. Проверь доступ к хранилищу браузера.':'Задания обновляются в полночь по местному времени.';
}
function progressionMenuTick(){
 const t=Date.now();if(t-progressMenuCheck<1000)return;progressMenuCheck=t;
 if(refreshDaily()){saveProgression(true);renderProgression();}
}
function runProgressSummary(){const lv=levelInfo().level;return ' · Опыт: +'+runEarnedXp+' XP'+(lv>runStartLevel?' · Новый уровень: '+lv:' · Уровень: '+lv);}
addEventListener('pagehide',()=>{recordProgress(true);});
