'use strict';
// One shared speaking slot for all ordinary, emotional, social and crash dialogue.
let speechOwner=null,speechPriority=0,speechNextAt=0,speechStartedAt=-100;
function resetSpeechGate(){speechOwner=null;speechPriority=0;speechNextAt=0;speechStartedAt=-100;}
function speechAllowed(priority){
 if(speechOwner&&speechOwner.wordsUntil>nowTime)return priority>=3&&priority>speechPriority&&nowTime-speechStartedAt>=1.25;
 return nowTime>=speechNextAt;
}
function requestNpcSpeech(c,line,rude=false,priority=0){
 if(!c||c.dead||!line||!speechAllowed(priority))return false;
 if(speechOwner&&speechOwner!==c){speechOwner.wordsUntil=nowTime;if(typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking){try{speechSynthesis.cancel();}catch(e){}}}
 speechOwner=c;speechPriority=priority;speechStartedAt=nowTime;
 c.words=line;c.wordsRude=rude;c.wordsStarted=nowTime;c.wordsUntil=nowTime+SPEECH_SECONDS;
 speechNextAt=c.wordsUntil+.9;return true;
}
function endSpeechEarly(c){if(speechOwner===c){c.wordsUntil=nowTime;speechNextAt=nowTime+.9;speechOwner=null;speechPriority=0;}}

function phraseFrom(pool,last){let line=pick(pool);while(line===last)line=pick(pool);return line;}
const EMOTIONS={calm:{speed:.92,turn:.85,interval:1.6,wander:.45,safety:1.45,brake:1.25},joy:{speed:1.13,turn:1.1,interval:1.05,wander:.9,safety:1.05,brake:1},angry:{speed:1.21,turn:1.3,interval:.72,wander:1.1,safety:.9,brake:1},panic:{speed:.78,turn:1.55,interval:.52,wander:.55,safety:1.65,brake:1.7}};
const MOOD_LINES={calm:['Не спеши, конь.','Тихо едем, далеко будем.','Хороший денёк для дороги.','Пусть весь мир подождёт.'],joy:['Ух, красота!','Гуляй, моя кляча!','Сегодня даже жопа не болит!','Эге-гей! Бесплатный ветер!','Вот это жизнь!'],angry:['Да разъедетесь вы уже?!','Кто поставил это говно посреди дороги?!','Всем с дороги, у меня дела!','Сколько можно плестись?!','Да чтоб вас кони покусали!'],panic:['ААА! КОНЬ, НЕ ТУДА!','Святые подковы, помогите!','Держите меня семеро!','Мама, я передумал!','Куда бежать?!','Блядь, только не дерево!']};
function setEmotion(c,e,duration){if(c.emotion!==e){c.emotion=e;if(c.emotionCooldown<=0&&(!c.words||c.wordsUntil<=nowTime)&&Math.abs(c.z)<60&&(e==='panic'||e==='angry'||Math.random()<.35)){if(requestNpcSpeech(c,pick(MOOD_LINES[e]),e==='panic'||e==='angry',e==='panic'?2:1))c.emotionCooldown=5;}}c.emotionClock=duration;}
function say(c,rude=false){const priority=rude?3:0;if(!c||c.dead||(!rude&&c.words&&c.wordsUntil>nowTime)||!speechAllowed(priority))return false;let pool=rude?RUDE_LINES:(c.emotion&&Math.random()<.40?MOOD_LINES[c.emotion]:NORMAL_LINES);let line=phraseFrom(pool,rude?lastRude:lastOrdinary);if(!requestNpcSpeech(c,line,rude,priority))return false;if(rude)lastRude=line;else lastOrdinary=line;return true;}
function ordinaryTalk(dt){speechClock-=dt;if(speechClock>0)return;speechClock=rand(1.4,2.6);if(!speechAllowed(0))return;let speakers=traffic.filter(c=>!c.dead&&!c.rude&&(c.kind===0||c.kind===3)&&c.z>9&&c.z<Math.min(230,weatherFar()*.82)&&Math.abs(c.x-px)<11&&(!c.words||c.wordsUntil<nowTime)).map(c=>({c,t:c.z/Math.max(2,speed-c.actualV)})).filter(o=>o.t>.65&&o.t<5).sort((a,b)=>Math.abs(a.t-2.8)-Math.abs(b.t-2.8));if(speakers.length)say(speakers[0].c);}
