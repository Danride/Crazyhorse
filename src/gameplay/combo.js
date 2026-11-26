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
let comboCount=0,comboUntil=0,comboVisibleUntil=0,comboPending=[],runScore=0;
const SCORE_VALUES={'БЛИЗКИЙ ОБГОН':10,'БЛИЗКИЙ ПРОЕЗД':10,'ПОДРЕЗАЛ':20,'ЛОВКИЙ МАНЁВР':15,'ПРЫЖОК':20,'КАСАНИЕ В ПРЫЖКЕ':20};
const SCORE_LABELS={'БЛИЗКИЙ ОБГОН':'ОБГОН','БЛИЗКИЙ ПРОЕЗД':'БЛИЗКО','ПОДРЕЗАЛ':'ПОДРЕЗАЛ','ЛОВКИЙ МАНЁВР':'МАНЁВР','ПРЫЖОК':'ПРЫЖОК','КАСАНИЕ В ПРЫЖКЕ':'КАСАНИЕ'};
function updateScoreUI(){$('runScore').textContent=String(runScore);}
function awardScore(label){let points=SCORE_VALUES[label]||0;runScore+=points;updateScoreUI();return points;}
function resetRunScore(){runScore=0;updateScoreUI();}
function shortComboLabel(label,count){return (SCORE_LABELS[label]||label)+(count>1?' · ×'+count:'');}
function npcComboEvent(c,oldX,oldZ,playerX,oldPlayerX,playerSpeed,airborne){
 const tow=c.kind===1||c.kind===2,width=tow?1.38:.98,length=tow?3.6:1.85;
 const dx=playerX-c.x,oldDx=oldPlayerX-oldX,move=playerX-oldPlayerX,rel=playerSpeed-c.actualV;
 if(c.dead||rel<.2)return null;
 // A real cut-in: player has just passed the front collision envelope and steers back into the NPC's path.
 const cut=c.z<=-(bodyShape(c).front+bodyShape(c).r+1.15)&&c.z>=-Math.max(14,Math.min(55,rel*.8+c.actualV*.65))&&Math.abs(oldDx)>width+.28&&Math.abs(dx)<=width+.28&&Math.abs(move)>.008&&Math.sign(move)===-Math.sign(oldDx);
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
 let count=0,label='',points=0;for(let p of comboPending){if(p.target.dead||p.target.scoreAwarded)continue;p.target.scoreAwarded=true;count++;label=p.label;points+=awardScore(label);}comboPending.length=0;
 if(count){comboCount+=count;comboUntil=nowTime+5;comboVisibleUntil=nowTime+(mobile||W<=760?.85:1.4);$('comboAction').textContent=shortComboLabel(label,comboCount);$('comboMultiplier').textContent='+'+points;$('comboMini').classList.add('active');}
 for(const p of npcComboPending){const c=p.c;if(c.dead)continue;
  if(!c.scoreActions)c.scoreActions=new Set();if(c.scoreActions.has(p.label))continue;c.scoreActions.add(p.label);
  let popup=npcComboPopups.find(a=>a.c===c);
  if(!c.comboAward){comboCount++;c.comboAward=comboCount;}comboUntil=nowTime+5;
  if(!popup){const a=c.comboAnchor;popup={c,x:a?.x??null,y:a?.y??null,side:c.x<px?-1:1,detached:false};npcComboPopups.push(popup);}
  popup.label=p.label;popup.count=c.comboAward;popup.points=awardScore(p.label);popup.born=nowTime;popup.until=nowTime+(mobile||W<=760?.95:1.6);
 }
 npcComboPending.length=0;npcComboPopups=npcComboPopups.filter(p=>p.until>nowTime).slice(-4);
}
function riderComboAnchor(c){
 const side=c.x<px?-1:1,p=projectPoint(c.x,c.kind===3?2.05:2.05,c.z);
 if(!p||p.depth>40||p.x<-12||p.x>W+12||p.y<45||p.y>H-25)return null;
 const offset=clamp(16+H*.28/p.depth,24,76);
 // On the inward side of the rider, beside the torso, not over the speech bubble.
 return {x:clamp(p.x-side*offset,35,Math.max(35,W-35)),y:clamp(p.y+6,64,H-28)};
}
function renderNpcCombos(){
 hideNpcCombos();if(state!=='running')return;
 // Save the last actual screen position before a fast pass moves the rider behind the camera.
 for(const c of traffic){if(c.dead||c.z<.4||c.z>40||Math.abs(c.x-px)>5.5)continue;const a=riderComboAnchor(c);if(a)c.comboAnchor=a;}
 let used=0,placed=[];
 const compact=mobile||W<=760;for(const a of npcComboPopups.slice(compact?-2:-4)){if(a.until<=nowTime)continue;
  const c=a.c,p=!c.dead?riderComboAnchor(c):null;
  if(p&&!a.detached){a.x=p.x;a.y=p.y;}
  else if(a.x!==null){a.detached=true;}
  else if(c.comboAnchor){a.x=c.comboAnchor.x;a.y=c.comboAnchor.y;a.detached=true;}
  else {a.x=clamp(W*.5+(c.x<px?-1:1)*W*.28,35,W-35);a.y=H*.55;a.detached=true;}
  let el=npcComboPool[used];if(!el){el=document.createElement('div');el.className='npcCombo';let span=document.createElement('span'),b=document.createElement('b');el.append(span,b);$('npcComboLayer').append(el);npcComboPool.push(el);}
  el.firstChild.textContent=shortComboLabel(a.label,a.count);el.lastChild.textContent='+'+a.points;
  let xx=clamp(a.x,35,Math.max(35,W-35)),yy=clamp(a.y-Math.min(14,(nowTime-a.born)*9),64,H-28);
  for(const r of placed)if(Math.abs(r.x-xx)<(compact?58:78)&&Math.abs(r.y-yy)<(compact?23:42))yy=Math.max(64,r.y-(compact?24:43));
  placed.push({x:xx,y:yy});el.style.left=xx+'px';el.style.top=yy+'px';el.style.opacity=String(Math.min(1,(a.until-nowTime)/.28));el.hidden=false;used++;
 }
}
