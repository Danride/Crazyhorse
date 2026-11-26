'use strict';
function encounterStep(target,z,dx,width,length,playerX,lookAhead,overTop=false){
 if(target.comboDone)return null;
 let t=target.comboTrack;
 if(!t){if(z<-(length+2)||z>lookAhead||Math.abs(dx)>width+3.2)return null;t=target.comboTrack={x:playerX,threat:false,near:false,jumped:false,dodged:false};}
 if(z>lookAhead+8){target.comboTrack=null;return null;}
 if(z>0&&z<=lookAhead&&Math.abs(dx)<=width+.55){if(!t.threat)t.x=playerX;t.threat=true;}
 if(z<=length+2&&z>=-length-2){
  if(Math.abs(dx)<=width+1.55)t.near=true;
  if(overTop&&Math.abs(dx)<=width+.1)t.jumped=true;
  if(t.threat&&Math.abs(playerX-t.x)>=.55&&Math.abs(dx)>=width-.12)t.dodged=true;
 }
 if(z>=-length-1.1)return null;
 target.comboDone=true;target.comboTrack=null;
 if(t.jumped)return "ПРЫЖОК";
 if(t.dodged)return "ЛОВКИЙ МАНЁВР";
 if(t.near)return "БЛИЗКИЙ ПРОЕЗД";
 return null;
}
let comboCount=0,comboUntil=0,comboVisibleUntil=0,comboPending=[];
function resetCombo(){comboCount=0;comboUntil=comboVisibleUntil=0;comboPending=[];$('comboMini').classList.remove('active');}
function beginComboFrame(){comboPending.length=0;if(nowTime>=comboUntil)comboCount=0;if(nowTime>=comboVisibleUntil)$('comboMini').classList.remove('active');}
function trackCombo(target,z,width,length,overTop=false){if(target.dead)return;let label=encounterStep(target,z,px-target.x,width,length,px,Math.max(24,speed*.95),overTop);if(label)comboPending.push({target,label});}
function finishComboFrame(){let count=0,label='';for(let p of comboPending){if(p.target.dead)continue;count++;label=p.label;}comboPending.length=0;if(!count)return;comboCount+=count;comboUntil=nowTime+5;comboVisibleUntil=nowTime+2.6;$('comboAction').textContent=label;$('comboMultiplier').textContent='×'+comboCount;$('comboMini').classList.add('active');}
