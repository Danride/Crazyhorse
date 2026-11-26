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
function npcComboEvent(c,oldX,oldZ,playerX,oldPlayerX,playerSpeed,airborne){
 const tow=c.kind===1||c.kind===2,width=tow?1.38:.98,length=tow?3.6:1.85;
 const dx=playerX-c.x,oldDx=oldPlayerX-oldX,move=playerX-oldPlayerX,rel=playerSpeed-c.actualV;
 if(c.dead||rel<.2)return null;
 // A real cut-in: player has just passed the front collision envelope and steers back into the NPC's path.
 const cut=c.z<=-length&&c.z>=-Math.max(10,c.actualV*.9)&&Math.abs(oldDx)>width+.12&&Math.abs(dx)<=width+.12&&Math.abs(move)>.01&&Math.sign(move)===-Math.sign(oldDx);
 if(cut&&!c.cutComboDone){c.cutComboDone=true;return "ПОДРЕЗАЛ";}
 // Reward a safe, tight side-by-side pass while the rider is still visible.
 if(!c.nearComboDone&&oldZ>=0&&c.z<=length+.9&&c.z>=-length-.9){
  const side=Math.abs(dx)>=width+.015&&Math.abs(dx)<=width+1.45;
  if(side||(airborne&&c.sideSafe)){c.nearComboDone=true;return airborne&&c.sideSafe?"КАСАНИЕ В ПРЫЖКЕ":"БЛИЗКИЙ ОБГОН";}
 }
 return null;
}
let npcComboPending=[],npcComboPopups=[];const npcComboPool=[];
function resetCombo(){comboCount=0;comboUntil=comboVisibleUntil=0;comboPending=[];npcComboPending=[];npcComboPopups=[];hideNpcCombos();$('comboMini').classList.remove('active');}
function beginComboFrame(){comboPending.length=0;npcComboPending.length=0;if(nowTime>=comboUntil)comboCount=0;if(nowTime>=comboVisibleUntil)$('comboMini').classList.remove('active');}
function trackCombo(target,z,width,length,overTop=false){if(target.dead)return;let label=encounterStep(target,z,px-target.x,width,length,px,Math.max(24,speed*.95),overTop);if(label)comboPending.push({target,label});}
function queueNpcCombo(c,label){npcComboPending.push({c,label});}
function hideNpcCombos(){for(const el of npcComboPool)el.hidden=true;}
function finishComboFrame(){
 let count=0,label='';for(let p of comboPending){if(p.target.dead)continue;count++;label=p.label;}comboPending.length=0;
 if(count){comboCount+=count;comboUntil=nowTime+5;comboVisibleUntil=nowTime+2.6;$('comboAction').textContent=label;$('comboMultiplier').textContent='×'+comboCount;$('comboMini').classList.add('active');}
 for(const p of npcComboPending){const c=p.c;if(c.dead)continue;let popup=npcComboPopups.find(a=>a.c===c);
  if(!c.comboAward){comboCount++;comboUntil=nowTime+5;c.comboAward=comboCount;}
  if(!popup){popup={c,x:null,y:null,side:c.x<px?-1:1};npcComboPopups.push(popup);}
  popup.label=p.label;popup.count=c.comboAward;popup.born=nowTime;popup.until=nowTime+2.3;
 }
 npcComboPending.length=0;npcComboPopups=npcComboPopups.filter(p=>p.until>nowTime).slice(-6);
}
function renderNpcCombos(){
 hideNpcCombos();if(state!=='running')return;
 let used=0,placed=[];
 for(const a of npcComboPopups){if(a.until<=nowTime)continue;
  const c=a.c,side=c.x<px?-1:1;
  let p=projectPoint(c.x,c.kind===3?2.3:2.85,c.z);
  if(p&&p.depth<Math.min(90,weatherFar())&&p.x>=0&&p.x<=W&&p.y>=65&&p.y<H-30){
   a.x=clamp(p.x+side*38,76,Math.max(76,W-76));a.y=clamp(p.y+18,80,H-45);a.side=side;
  }else if(a.x===null){a.x=side<0?84:Math.max(84,W-84);a.y=H*.55;a.side=side;}
  else if(c.z<0||!p){a.x=a.side<0?84:Math.max(84,W-84);}
  let el=npcComboPool[used];if(!el){el=document.createElement('div');el.className='npcCombo';let span=document.createElement('span'),b=document.createElement('b');el.append(span,b);$('npcComboLayer').append(el);npcComboPool.push(el);}
  el.firstChild.textContent=a.label;el.lastChild.textContent='×'+a.count;
  let yy=clamp(a.y-Math.min(16,(nowTime-a.born)*7),80,H-42);
  for(const r of placed)if(Math.abs(r.x-a.x)<155&&Math.abs(r.y-yy)<34)yy=Math.max(76,r.y-36);
  placed.push({x:a.x,y:yy});
  el.style.left=a.x+'px';el.style.top=yy+'px';el.style.opacity=String(Math.min(1,(a.until-nowTime)/.35));el.hidden=false;used++;
 }
}
