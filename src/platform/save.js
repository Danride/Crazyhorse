'use strict';
// A single versioned snapshot keeps wallet, inventory, and upgrades consistent.
// Local first, VK user storage as a backup. Never sum balances across devices.
const SAVE_CLOUD_KEY='crazy_horse_save_v2',SAVE_PREFIX='crazy-horse-save-v2:',SAVE_LEGACY_OWNER='crazy-horse-legacy-owner';
let saveLoading=false,saveLocalKey=SAVE_PREFIX+'browser',saveCurrent=null,saveCloudRead=false,saveCloudBusy=false,savePullBusy=false,saveCloudSent='',saveNextTry=0,saveNextPush=0,saveGateUntil=0,saveLastTick=0,saveLocalOK=true;
function saveAccount(){
 const s=(window.location?.search||'')+'&'+(window.location?.hash||'');const m=s.match(/(?:^|[?&#])vk_user_id=(\d+)(?:&|$)/);
 return m?'vk-'+m[1]:vkEnvironment()?'vk-local':'browser';
}
function saveInt(n,max=1e12){return typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;}
function saveDecode(raw){
 try{const x=typeof raw==='string'?JSON.parse(raw):raw;if(!x||x.version!==2||!Number.isSafeInteger(x.stamp)||x.stamp<0||!x.data||typeof x.data!=='object')return null;
 const d=x.data;if(!Number.isFinite(d.wallet)||!Number.isFinite(d.best)||!d.levels||!Array.isArray(d.owned)||!d.progress||!Number.isFinite(d.progress.xp))return null;
 const owned=[...new Set([FREE_SKIN,...d.owned.filter(i=>Number.isInteger(i)&&i>=0&&i<skinNames.length)])].sort((a,b)=>a-b);
 const day=typeof d.progress.daily?.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.progress.daily.day)&&d.progress.daily.day>=localDay()?d.progress.daily.day:localDay();
 const daily=freshDaily(day);if(day===d.progress.daily?.day){for(const k of DAILY_METRICS)daily.counts[k]=Math.min(DAILY_TASKS[k].target,saveInt(d.progress.daily.counts?.[k]));daily.claimed=Array.isArray(d.progress.daily.claimed)?[...new Set(d.progress.daily.claimed.filter(k=>dayTasks(day).includes(k)&&daily.counts[k]>=DAILY_TASKS[k].target))]:[];}
 const levels={};for(const k of upgradeKeys)levels[k]=saveInt(d.levels[k],5);
 return {version:2,stamp:x.stamp,data:{wallet:saveInt(d.wallet),best:saveInt(d.best),levels,owned,selected:owned.includes(d.selected)?d.selected:FREE_SKIN,progress:{xp:saveInt(d.progress.xp),daily},quality:['auto','low','high'].includes(d.quality)?d.quality:'auto'}};
 }catch(e){return null;}
}
function saveCapture(){return {wallet:saveInt(wallet),best:saveInt(best),levels:{...horseLevels},owned:[...ownedSkins].sort((a,b)=>a-b),selected:ownedSkins.has(selectedSkin)?selectedSkin:FREE_SKIN,progress:JSON.parse(JSON.stringify(playerProgress)),quality:qualityMode};}
function saveApply(s){
 const d=s.data;wallet=d.wallet;best=recordSaved=d.best;horseLevels={...d.levels};ownedSkins=new Set(d.owned);selectedSkin=previewSkin=d.selected;playerProgress=JSON.parse(JSON.stringify(d.progress));progressDirty=false;runProgressSnapshot=null;qualityMode=d.quality;quality=qualityMode==='low'||(qualityMode==='auto'&&mobile)?0:2;
 if(vkGameReady){syncWalletUI();$('best').textContent=best;$('menuBest').textContent=best;$('previewName').textContent=skinNames[selectedSkin];$('qualitySelect').value=qualityMode;renderProgression();renderUpgrades();if($('mainMenu').dataset.pane==='skins')renderSkinCatalog();resize();clearChunks();}
}
function saveWriteLocal(s){
 try{localStorage.setItem(saveLocalKey,JSON.stringify(s));saveLocalOK=true;return true;}catch(e){saveLocalOK=false;return false;}
}
function saveSetGate(on){saveLoading=on;const b=$('menuStart');if(b)b.disabled=on;}
function saveInitLocal(){
 const account=saveAccount();saveLocalKey=SAVE_PREFIX+account;
 let saved=null,owner=null;try{saved=saveDecode(localStorage.getItem(saveLocalKey));owner=localStorage.getItem(SAVE_LEGACY_OWNER);}catch(e){}
 if(saved){saveApply(saved);saveCurrent=saved;}
 else{
  // Old saves had no account scope. Migrate once, then never copy them to another account.
  if(owner&&owner!==account){wallet=best=recordSaved=0;horseLevels={turn:0,jump:0,stability:0};ownedSkins=new Set([FREE_SKIN]);selectedSkin=previewSkin=FREE_SKIN;playerProgress={xp:0,daily:freshDaily(localDay())};qualityMode='auto';quality=mobile?0:2;}
  saveCurrent={version:2,stamp:0,data:saveCapture()};
 }
 try{if(!owner)localStorage.setItem(SAVE_LEGACY_OWNER,account);}catch(e){}
 saveWriteLocal(saveCurrent);
 if(vkEnvironment()){saveGateUntil=Date.now()+6500;saveSetGate(true);}
}
function saveCommit(){
 if(!saveCurrent)return false;
 const data=saveCapture(),same=JSON.stringify(data)===JSON.stringify(saveCurrent.data);
 const next=same?saveCurrent:{version:2,stamp:Math.max(Date.now(),saveCurrent.stamp+1),data};
 const ok=saveWriteLocal(next);
 if(ok||saveCloudRead){saveCurrent=next;return true;}
 return false;
}
function saveTimed(method,args){return new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);};const timer=setTimeout(()=>finish(null),4500);vkCall(method,args).then(finish,()=>finish(null));});}
async function savePull(){
 if(savePullBusy||saveCloudRead||!vkReady||state!=='menu')return false;
 savePullBusy=true;saveSetGate(true);
 try{
  const result=await saveTimed('VKWebAppStorageGet',{keys:[SAVE_CLOUD_KEY]});
  const item=result?.keys?.find(k=>k.key===SAVE_CLOUD_KEY);
  if(!item||typeof item.value!=='string')return false;
  const remote=item.value?saveDecode(item.value):null;
  if(item.value&&!remote){console.warn('[Crazy Horse save] Invalid VK backup; not overwritten');return false;}
  if(state!=='menu')return false;
  if(remote&&remote.stamp>=saveCurrent.stamp){saveApply(remote);saveCurrent=remote;saveWriteLocal(remote);}
  saveCloudRead=true;saveCloudSent=remote?JSON.stringify(remote):'';saveCommit();return true;
 }finally{savePullBusy=false;saveSetGate(false);saveNextTry=Date.now()+12000;}
}
async function savePush(force=false){
 if(!saveCloudRead||!vkReady||saveCloudBusy||!saveCurrent)return false;
 const raw=JSON.stringify(saveCurrent);if(raw===saveCloudSent||(!force&&Date.now()<saveNextPush))return false;
 saveCloudBusy=true;saveNextPush=Date.now()+5000;
 try{const r=await saveTimed('VKWebAppStorageSet',{key:SAVE_CLOUD_KEY,value:raw});if(r?.result===true){saveCloudSent=raw;return true;}console.warn('[Crazy Horse save] VK backup not confirmed');return false;}
 finally{saveCloudBusy=false;}
}
function saveTick(){
 const t=Date.now();if(t-saveLastTick<500)return;saveLastTick=t;
 if(saveLoading&&!savePullBusy&&t>=saveGateUntil)saveSetGate(false);
 if(vkReady&&!saveCloudRead&&!savePullBusy&&state==='menu'&&t>=saveNextTry)void savePull();
 if(saveCurrent){saveCommit();if(saveCloudRead)void savePush();}
}
function saveFlush(){if(!saveCurrent)return;saveCommit();void savePush(true);}
addEventListener('pagehide',()=>{if(saveCurrent){recordProgress(true);saveFlush();}});
