'use strict';
let selectedSkin=0,menuAngle=.4,trafficDensity=.5,densityGoal=.5,densityClock=0,speechClock=0,lastOrdinary='',lastRude='',cameraView=null;
function migrateHorseSelection(value){let i=Number(value);if(!Number.isInteger(i)||i<0||i>17||i===10||i===11||i===17)return 0;return i>=12?i-2:i;}
try{let saved=localStorage.getItem('kings-road-skin-v2');selectedSkin=saved===null||saved===undefined?migrateHorseSelection(localStorage.getItem('kings-road-skin')):clamp(Number(saved)||0,0,14)|0;}catch(e){}
const skinNames=["Вороной","Серый","Рыжий","Гнедой","Каштановый","Обсидиановый","Снежный","Пегий","В яблоках","Зебра","Огненный","Демонический","Лесной","Единорог","Пустотный"];const skinSwatches=["#272727","#a0a0a0","#9b250d","#a66b37","#a45e35","#252a33","#e7e1d5","#bd8f63","#90908d","#d3d0c9","#eb6424","#6c262b","#65823e","#e9ddec","#5b3c83"];
