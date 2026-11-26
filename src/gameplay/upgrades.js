'use strict';
const upgradeCosts=[100,250,500,1000,2000],upgradeKeys=['turn','jump','stability'];
function horseStats(levels,rain=0){
 const turn=levels.turn||0,jump=levels.jump||0,stability=levels.stability||0;
 return {turn:.72+.10*turn,lateral:.78+.07*turn,jump:5.35+.43*jump,grip:1-rain*(.75-.10*stability),release:1-rain*(.50-.08*stability)};
}
let horseLevels={turn:0,jump:0,stability:0};
try{const raw=JSON.parse(localStorage.getItem('kings-road-upgrades')||'{}');for(const k of upgradeKeys)horseLevels[k]=clamp(Math.floor(Number(raw[k])||0),0,5);}catch(e){}
function upgradePrice(k){return upgradeCosts[horseLevels[k]]??null;}
function buyUpgrade(k){
 if(state!=='menu'||!upgradeKeys.includes(k))return false;
 const cost=upgradePrice(k);if(cost===null||wallet<cost)return false;
 const oldWallet=wallet,oldLevels={...horseLevels};wallet-=cost;horseLevels[k]++;
 try{localStorage.setItem('kings-road-wallet',String(wallet));localStorage.setItem('kings-road-upgrades',JSON.stringify(horseLevels));}catch(e){wallet=oldWallet;horseLevels=oldLevels;try{localStorage.setItem('kings-road-wallet',String(wallet));}catch(_){}$('upgradeMessage').textContent='Не удалось сохранить покупку.';return false;}
 syncWalletUI();renderUpgrades();$('upgradeMessage').textContent='Улучшение куплено.';return true;
}
function renderUpgrades(){
 const stats=horseStats(horseLevels,1),height=stats.jump*stats.jump/23;
 const values={turn:Math.round(stats.turn/.72*100)+'% реакции',jump:height.toFixed(2)+' м',stability:Math.round(stats.grip*100)+'% сцепления в дождь'};
 for(const k of upgradeKeys){const lv=horseLevels[k],cost=upgradePrice(k);$('up-'+k+'-level').textContent=lv+' / 5';$('up-'+k+'-value').textContent=values[k];$('up-'+k+'-bar').style.width=(lv*20)+'%';const b=$('up-'+k+'-buy');b.textContent=cost===null?'МАКСИМУМ':'Купить · '+cost+' монет';b.disabled=cost===null||wallet<cost;}
}
