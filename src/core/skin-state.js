'use strict';
let selectedSkin=0,menuAngle=.4,trafficDensity=.5,densityGoal=.5,densityClock=0,speechClock=0,lastOrdinary='',lastRude='',cameraView=null;
try{selectedSkin=clamp(Number(localStorage.getItem('kings-road-skin'))||0,0,17)|0;}catch(e){}
const skinNames=["Вороной", "Серый", "Рыжий", "Гнедой", "Каштановый", "Обсидиановый", "Снежный", "Пегий", "В яблоках", "Зебра", "Королевский", "Рыцарский", "Огненный", "Демонический", "Лесной", "Единорог", "Пустотный", "Грибной"];const skinSwatches=["#272727", "#a0a0a0", "#9b250d", "#a66b37", "#a45e35", "#252a33", "#e7e1d5", "#bd8f63", "#90908d", "#d3d0c9", "#a44732", "#8c98a8", "#eb6424", "#6c262b", "#65823e", "#e9ddec", "#5b3c83", "#a96346"];
