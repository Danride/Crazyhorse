'use strict';
// A single versioned snapshot keeps wallet, inventory, and upgrades consistent.
// Local journal + VK cloud, reconciled against the last confirmed common revision.
const SAVE_CLOUD_KEY='crazy_horse_save_v2',SAVE_PREFIX='crazy-horse-save-v2:',SAVE_LEGACY_OWNER='crazy-horse-legacy-owner';
let saveCloudHistory=[],saveCloudBase=null,saveBaseKnown=false,savePendingPush=null,saveConflictRemote=null,saveConflict=false,saveSyncMessage='',saveSyncQueued=false;
let saveLoading=false,saveLocalKey=SAVE_PREFIX+'browser',saveCurrent=null,saveCloudRead=false,saveCloudBusy=false,savePullBusy=false,saveCloudSent='',saveNextTry=0,saveNextPush=0,saveGateUntil=0,saveLastTick=0,saveLocalOK=true;
function saveAccount(){
 const s=(window.location?.search||'')+'&'+(window.location?.hash||'');const m=s.match(/(?:^|[?&#])vk_user_id=(\d+)(?:&|$)/);
 return m?'vk-'+m[1]:vkEnvironment()?'vk-local':'browser';
}
function saveInt(n,max=1e12){return typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;}
function saveDecode(raw,preserveDay=false){
 try{const x=typeof raw==='string'?JSON.parse(raw):raw;if(!x||x.version!==2||!Number.isSafeInteger(x.stamp)||x.stamp<0||!x.data||typeof x.data!=='object')return null;
 const d=x.data;if(!Number.isFinite(d.wallet)||!Number.isFinite(d.best)||!d.levels||!Array.isArray(d.owned)||!d.progress||!Number.isFinite(d.progress.xp))return null;
 const owned=[...new Set([FREE_SKIN,...d.owned.filter(isActiveSkin)])].sort((a,b)=>a-b);
 const day=typeof d.progress.daily?.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.progress.daily.day)&&(preserveDay||d.progress.daily.day>=localDay())?d.progress.daily.day:localDay();
 const daily=freshDaily(day);if(day===d.progress.daily?.day){for(const k of DAILY_METRICS)daily.counts[k]=Math.min(DAILY_TASKS[k].target,saveInt(d.progress.daily.counts?.[k]));daily.claimed=Array.isArray(d.progress.daily.claimed)?[...new Set(d.progress.daily.claimed.filter(k=>dayTasks(day).includes(k)&&daily.counts[k]>=DAILY_TASKS[k].target))]:[];}
 const levels={};for(const k of upgradeKeys)levels[k]=saveInt(d.levels[k],5);
 return {version:2,stamp:x.stamp,...(typeof x.syncId==='string'&&/^[a-z0-9-]{1,80}$/.test(x.syncId)?{syncId:x.syncId}:{}),...(Array.isArray(x.syncParents)?{syncParents:[...new Set(x.syncParents.filter(k=>typeof k==='string'&&/^[a-z0-9-]{1,80}$/.test(k)))].slice(0,20)}:{}),data:{wallet:saveInt(d.wallet),best:saveInt(d.best),levels,owned,selected:owned.includes(d.selected)?d.selected:FREE_SKIN,progress:{xp:saveInt(d.progress.xp),daily},revive:normalizeReviveDaily(d.revive,preserveDay&&typeof d.revive?.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.revive.day)?d.revive.day:localDay()),insurance:saveInt(d.insurance,1000000),quality:['auto','low','high'].includes(d.quality)?d.quality:'auto'}};
 }catch(e){return null;}
}
function saveCapture(){return {wallet:saveInt(wallet),best:saveInt(best),levels:{...horseLevels},owned:[...ownedSkins].filter(isActiveSkin).sort((a,b)=>a-b),selected:ownsSkin(selectedSkin)?selectedSkin:FREE_SKIN,progress:JSON.parse(JSON.stringify(playerProgress)),revive:normalizeReviveDaily(reviveDaily),insurance:saveInt(insuranceCount,1000000),quality:qualityMode};}
function saveApply(s){
 const d=s.data;wallet=d.wallet;best=recordSaved=d.best;horseLevels={...d.levels};ownedSkins=new Set(d.owned);selectedSkin=previewSkin=d.selected;playerProgress=JSON.parse(JSON.stringify(d.progress));if(playerProgress.daily.day<localDay())playerProgress.daily=freshDaily(localDay());reviveDaily=normalizeReviveDaily(d.revive);insuranceCount=saveInt(d.insurance,1000000);updateInsuranceHUD();progressDirty=false;runProgressSnapshot=null;qualityMode=d.quality;quality=qualityMode==='low'||(qualityMode==='auto'&&mobile)?0:2;
 if(vkGameReady){syncWalletUI();$('best').textContent=best;$('menuBest').textContent=best;$('previewName').textContent=skinNames[selectedSkin];$('qualitySelect').value=qualityMode;renderProgression();renderUpgrades();if($('mainMenu').dataset.pane==='skins')renderSkinCatalog();resize();clearChunks();}
}
function saveWriteLocal(s){
 if(!saveLocalKey){saveLocalOK=false;return false;}
 try{localStorage.setItem(saveLocalKey,JSON.stringify({...s,syncLocal:{known:saveBaseKnown,base:saveCloudBase,history:saveCloudHistory,pending:savePendingPush,conflict:saveConflict,remote:saveConflictRemote}}));saveLocalOK=true;return true;}catch(e){saveLocalOK=false;return false;}
}
function saveSetGate(on){saveLoading=on;const b=$('menuStart');if(b)b.disabled=on;}
function saveSyncStatus(message){saveSyncMessage=message;const el=$('saveSyncStatus'),result=$('saveSyncResult'),actions=$('saveSyncActions');if(el){el.textContent=message;el.hidden=!vkEnvironment();}if(result){result.textContent=message;result.hidden=!vkEnvironment();}if(actions)actions.hidden=!saveConflict;const details=$('saveSyncDetails');if(details){const describe=x=>x?'Монеты '+x.data.wallet+' · XP '+x.data.progress.xp+' · страховки '+x.data.insurance+' · скины '+x.data.owned.length+' · рекорд '+x.data.best+' м':'нет копии';details.textContent=saveConflict?'Устройство: '+describe(saveCurrent)+' / Облако: '+describe(saveConflictRemote):'';}const useCloud=$('saveUseCloud');if(useCloud)useCloud.disabled=!saveConflictRemote;}
function saveArchive(local,remote,reason){if(!saveLocalKey)return false;try{const key=saveLocalKey+':recovery';let history=[];try{const old=JSON.parse(localStorage.getItem(key)||'[]');history=Array.isArray(old)?old:old?[old]:[];}catch(e){}localStorage.setItem(key,JSON.stringify([{local,remote,reason,at:Date.now()},...history].slice(0,5)));return true;}catch(e){return false;}}
function saveRevKey(s){if(!s)return null;if(s.syncId)return s.syncId;let h=2166136261;for(const c of JSON.stringify(s.data))h=Math.imul(h^c.charCodeAt(0),16777619);return 'legacy-'+s.stamp.toString(36)+'-'+(h>>>0).toString(36);}
function saveDescends(s,ancestor){return !!s&&!!ancestor&&(saveSame(s,ancestor)||(s.syncParents||[]).includes(saveRevKey(ancestor)));}
function saveRevision(data,stamp=0,parents=[saveCloudBase,savePendingPush]){const chain=[...new Set(parents.filter(Boolean).flatMap(p=>[saveRevKey(p),...(p.syncParents||[])]))].slice(0,20);return {version:2,stamp:Math.max(Date.now(),stamp+1),syncId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2),syncParents:chain,data};}
function saveSame(a,b){if(!a||!b)return a===b;return a.syncId&&b.syncId?a.syncId===b.syncId:a.stamp===b.stamp&&JSON.stringify(a.data)===JSON.stringify(b.data);}
function saveDataSame(a,b){return !!a&&!!b&&JSON.stringify(a.data)===JSON.stringify(b.data);}
function saveInitLocal(){
 const account=saveAccount();saveLocalKey=account==='vk-local'?null:SAVE_PREFIX+account;
 let saved=null,owner=null;try{const raw=saveLocalKey?JSON.parse(localStorage.getItem(saveLocalKey)||'null'):null;saved=saveDecode(raw,true);owner=localStorage.getItem(SAVE_LEGACY_OWNER);if(saved&&raw.syncLocal){const m=raw.syncLocal;saveCloudBase=saveDecode(m.base,true);saveBaseKnown=m.known===true&&(m.base===null||!!saveCloudBase);savePendingPush=saveDecode(m.pending,true);saveConflict=m.conflict===true;saveConflictRemote=saveDecode(m.remote,true);saveCloudHistory=Array.isArray(m.history)?m.history.map(x=>saveDecode(x,true)).filter(Boolean).slice(0,6):[];}}catch(e){}
 if(saved){saveApply(saved);saveCurrent=saved;}
 else{
  // Old saves had no account scope. Migrate once, then never copy them to another account.
  if(account==='vk-local'||owner&&owner!==account){wallet=best=recordSaved=0;horseLevels={turn:0,jump:0,stability:0};ownedSkins=new Set([FREE_SKIN]);selectedSkin=previewSkin=FREE_SKIN;playerProgress={xp:0,daily:freshDaily(localDay())};reviveDaily=normalizeReviveDaily(null);insuranceCount=0;updateInsuranceHUD();qualityMode='auto';quality=mobile?0:2;}
  saveCurrent={version:2,stamp:0,data:saveCapture()};
 }
 try{if(!owner&&account!=='vk-local')localStorage.setItem(SAVE_LEGACY_OWNER,account);}catch(e){}
 saveWriteLocal(saveCurrent);
 if(vkEnvironment()){saveGateUntil=Date.now()+6500;saveSetGate(true);saveSyncStatus(saveConflict?'Конфликт сохранений · выбери версию в меню':'Подключение к облаку VK…');}else saveSyncStatus('');
}
function saveCommit(){
 if(!saveCurrent)return false;
 const data=saveCapture(),same=JSON.stringify(data)===JSON.stringify(saveCurrent.data);
 const next=same?saveCurrent:saveRevision(data,saveCurrent.stamp);
 if(same&&saveLocalOK)return true;
 const ok=saveWriteLocal(next);
 if(ok||saveCloudRead){saveCurrent=next;return true;}
 return false;
}
function saveTimed(method,args){return new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);};const timer=setTimeout(()=>finish(null),4500);vkCall(method,args).then(finish,()=>finish(null));});}

// Merge deltas only when the devices share a known, confirmed ancestor.
function saveMergeProgress(base,local,remote){
 if(!base||!local||!remote)return null;
 const b=base.data,l=local.data,r=remote.data;
 if(![l,r].every(x=>b.owned.every(i=>x.owned.includes(i))&&upgradeKeys.every(k=>x.levels[k]>=b.levels[k])))return null;
 const owned=[...new Set([...l.owned,...r.owned])].sort((a,b)=>a-b),levels={};
 let wallet=l.wallet+r.wallet-b.wallet;
 for(const i of l.owned)if(!b.owned.includes(i)&&r.owned.includes(i))wallet+=skinPrices[i];
 for(const k of upgradeKeys){
  levels[k]=Math.max(l.levels[k],r.levels[k]);
  for(let i=b.levels[k];i<Math.min(l.levels[k],r.levels[k]);i++)wallet+=upgradeCosts[i];
 }
 const insurance=l.insurance+r.insurance-b.insurance;
 const day=[b.progress.daily.day,l.progress.daily.day,r.progress.daily.day].sort().at(-1),daily=freshDaily(day);
 const bd=b.progress.daily,ld=l.progress.daily,rd=r.progress.daily;
 let xp=l.progress.xp+r.progress.xp-b.progress.xp;
 if(ld.day===rd.day){
  for(const k of ld.claimed)if(rd.claimed.includes(k)&&!(bd.day===ld.day&&bd.claimed.includes(k)))xp-=DAILY_TASKS[k].xp;
 }else if(ld.day===bd.day||rd.day===bd.day){
  // If one branch has advanced to another day, old daily claims are no longer
  // fully represented. A new claim on the old branch is ambiguous.
  const old=ld.day===bd.day?ld:rd;
  if(old.claimed.some(k=>!bd.claimed.includes(k)))return null;
 }
 for(const k of DAILY_METRICS){
  const before=bd.day===day?bd.counts[k]:0;
  const left=ld.day===day?ld.counts[k]:before,right=rd.day===day?rd.counts[k]:before;
  daily.counts[k]=Math.min(DAILY_TASKS[k].target,Math.max(0,left+right-before));
 }
 daily.claimed=[...new Set([...(bd.day===day?bd.claimed:[]),...(ld.day===day?ld.claimed:[]),...(rd.day===day?rd.claimed:[])])].sort();
 const reviveDay=[b.revive.day,l.revive.day,r.revive.day].sort().at(-1);
 const prior=b.revive.day===reviveDay?b.revive.used:0;
 const used=(l.revive.day===reviveDay?l.revive.used:prior)+(r.revive.day===reviveDay?r.revive.used:prior)-prior;
 if(!Number.isSafeInteger(wallet)||wallet<0||wallet>1e12||!Number.isSafeInteger(insurance)||insurance<0||insurance>1000000||!Number.isSafeInteger(xp)||xp<0||xp>1e12||used<0||used>REVIVE_DAILY_LIMIT)return null;
 const preference=k=>l[k]===b[k]?r[k]:r[k]===b[k]?l[k]:local.stamp>=remote.stamp?l[k]:r[k];
 const selected=preference('selected');
 return {version:2,stamp:Math.max(local.stamp,remote.stamp)+1,data:{wallet,best:Math.max(l.best,r.best),levels,owned,selected:owned.includes(selected)?selected:FREE_SKIN,progress:{xp,daily},revive:{day:reviveDay,used},insurance,quality:preference('quality')}};
}
async function saveReadRemote(){
 const response=await saveTimed('VKWebAppStorageGet',{keys:[SAVE_CLOUD_KEY]});
 const item=response?.keys?.find(k=>k.key===SAVE_CLOUD_KEY);
 if(!item||typeof item.value!=='string')return {ok:false};
 const remote=item.value?saveDecode(item.value,true):null;
 if(item.value&&!remote)return {ok:false,invalid:true};
 return {ok:true,remote};
}
function saveSafeApply(){return state==='menu'||(state==='over'&&!reviveBusy);}
function saveRememberBase(remote){
 if(saveCloudBase&&!saveSame(saveCloudBase,remote)){saveCloudHistory=[saveCloudBase,...saveCloudHistory.filter(x=>!saveSame(x,saveCloudBase))].slice(0,6);}
 saveCloudBase=remote;saveBaseKnown=true;savePendingPush=null;
 saveCloudSent=remote?JSON.stringify(remote):'';
 if(saveCurrent)saveWriteLocal(saveCurrent);
}
function saveAdopt(remote){
 saveCurrent=remote;saveRememberBase(remote);saveApply(remote);saveCommit();
}
function saveFlagConflict(remote,message){
 saveConflict=true;saveConflictRemote=remote;
 saveArchive(saveCurrent,remote,message);saveWriteLocal(saveCurrent);
 saveSetGate(true);saveSyncStatus(message+' · выбери версию в меню');
 return false;
}
async function saveSync(force=false){
 if(!vkReady||!saveCurrent||savePullBusy||saveCloudBusy){if(force)saveSyncQueued=true;return false;}
 if(!force&&Date.now()<saveNextTry)return false;
 savePullBusy=saveCloudBusy=true;saveSyncQueued=false;saveNextTry=Date.now()+8000;
 try{
  saveCommit();
  const response=await saveReadRemote();
  if(!response.ok){saveSyncStatus(response.invalid?'Облачное сохранение повреждено · запись остановлена':'Нет связи с VK · прогресс пока на устройстве');return false;}
  const remote=response.remote;saveCloudRead=true;
  if(saveConflict){
   saveConflictRemote=remote;saveWriteLocal(saveCurrent);saveSetGate(true);saveSyncStatus('Конфликт сохранений · выбери версию в меню');return false;
  }
  // Recover a write that reached VK even if the acknowledgement was lost.
  if(savePendingPush&&saveDescends(remote,savePendingPush))saveRememberBase(savePendingPush);
  if(!saveBaseKnown){
   if(!saveSafeApply()&&remote&&!saveDataSame(saveCurrent,remote)){saveSyncStatus('Облако найдено · сверка после заезда');return false;}
   if(remote){
    if(saveDataSame(saveCurrent,remote)||saveCurrent.stamp===0){
     if(!saveDataSame(saveCurrent,remote))saveArchive(saveCurrent,remote,'initial cloud import');
     saveAdopt(remote);
    }else{
     // Old versions did not store their ancestor. Different legacy snapshots
     // cannot be safely added. Keep both and ask rather than lose purchases.
     return saveFlagConflict(remote,'Разные старые сохранения');
    }
   }else saveRememberBase(null);
  }else if(!saveSame(remote,saveCloudBase)){
   if(!saveSafeApply()){saveSyncStatus('Прогресс изменён на другом устройстве · сверка после заезда');return false;}
   if(!remote)return saveFlagConflict(null,'Облачная копия отсутствует');
   const direct=saveDescends(remote,saveCloudBase);
   const common=direct?saveCloudBase:[remote,...saveCloudHistory].find(x=>saveDescends(saveCloudBase,x)&&saveDescends(remote,x));
   const clean=saveSame(saveCurrent,saveCloudBase)||saveDataSame(saveCurrent,saveCloudBase);
   if(!common){
    // An idle device may have been offline longer than the bounded ancestry list.
    // It has no unsent changes; the current cloud is authoritative, but keep a recovery copy.
    if(clean&&saveCloudBase&&remote.stamp>=saveCloudBase.stamp){saveArchive(saveCurrent,remote,'refresh idle device');saveAdopt(remote);}
    else return saveFlagConflict(remote,'Не найдено общее подтверждённое сохранение');
   }
   else if(direct&&clean)saveAdopt(remote);
   else{
    const merged=saveMergeProgress(common,saveCurrent,remote);
    if(!merged)return saveFlagConflict(remote,'Одновременные изменения не удалось безопасно объединить');
    const next=saveRevision(merged.data,merged.stamp,[remote,saveCurrent,saveCloudBase]);
    saveArchive(saveCurrent,remote,'before automatic merge');
    saveCurrent=next;saveRememberBase(remote);saveApply(next);saveCommit();
   }
  }
  // All changes are now based on the cloud revision just read.
  if(saveSame(saveCurrent,saveCloudBase)||saveDataSame(saveCurrent,saveCloudBase)){
   if(saveCloudBase&&!saveSame(saveCurrent,saveCloudBase)){saveCurrent=saveCloudBase;saveWriteLocal(saveCurrent);}
   saveSyncStatus('Облако VK · синхронизировано');return true;
  }
  if(!saveCurrent.syncId||(saveCloudBase&&!saveDescends(saveCurrent,saveCloudBase)))saveCurrent=saveRevision(saveCurrent.data,saveCurrent.stamp,[saveCloudBase,savePendingPush,saveCurrent]);
  const candidate=saveCurrent;
  savePendingPush=candidate;saveWriteLocal(saveCurrent);
  const sent=await saveTimed('VKWebAppStorageSet',{key:SAVE_CLOUD_KEY,value:JSON.stringify(candidate)});
  if(sent?.result!==true){saveSyncStatus('Отправка не подтверждена · повторим');return false;}
  const verified=await saveReadRemote();
  if(!verified.ok||!saveSame(verified.remote,candidate)){
   saveSyncStatus('Запись не подтверждена облаком · повторная сверка');return false;
  }
  saveRememberBase(candidate);
  saveSyncStatus(saveSame(saveCurrent,candidate)?'Облако VK · синхронизировано':'Облако VK · есть новые изменения');
  return true;
 }finally{
  savePullBusy=saveCloudBusy=false;
  if(!saveConflict&&(saveCloudRead||Date.now()>=saveGateUntil))saveSetGate(false);
  if(saveSyncQueued){saveNextTry=0;saveSyncQueued=false;}
 }
}
function savePull(){return saveSync(false);}
function savePush(force=false){return saveSync(force);}
async function saveResolveConflict(choice){
 if(!saveConflict||!vkReady||saveCloudBusy||state!=='menu'||!['cloud','local'].includes(choice))return false;
 if(typeof window.confirm==='function'&&!window.confirm(choice==='cloud'?'Использовать облачную версию? Локальная останется резервной копией на этом устройстве.':'Использовать локальную версию? Она заменит облачную; прежняя останется резервной копией на этом устройстве.'))return false;
 savePullBusy=saveCloudBusy=true;
 try{
  const fresh=await saveReadRemote();
  if(!fresh.ok){saveSyncStatus('Не удалось проверить облако · попробуй снова');return false;}
  if(!saveSame(fresh.remote,saveConflictRemote)){saveConflictRemote=fresh.remote;saveWriteLocal(saveCurrent);saveSyncStatus('Облако снова изменилось · проверь выбор');return false;}
  if(choice==='cloud'&&!fresh.remote){saveSyncStatus('Облачной копии нет · можно оставить локальную');return false;}
  if(!saveArchive(saveCurrent,fresh.remote,'manual resolution')){saveSyncStatus('Не удалось создать резервную копию · выбор отменён');return false;}
  saveConflict=false;saveConflictRemote=null;
  if(choice==='cloud')saveAdopt(fresh.remote);
  else{saveCurrent=saveRevision(saveCapture(),Math.max(saveCurrent.stamp,fresh.remote?.stamp||0),[fresh.remote,saveCurrent]);saveRememberBase(fresh.remote);}
  saveWriteLocal(saveCurrent);saveSetGate(false);saveSyncStatus('Версия выбрана · синхронизация…');saveNextTry=0;
  return true;
 }finally{savePullBusy=saveCloudBusy=false;if(!saveConflict)void saveSync(true);}
}
function saveTick(){
 const t=Date.now();if(t-saveLastTick<500)return;saveLastTick=t;
 if(saveLoading&&!saveConflict&&!savePullBusy&&t>=saveGateUntil)saveSetGate(false);
 if(saveCurrent)saveCommit();
 if(vkReady&&!savePullBusy&&t>=saveNextTry)void saveSync();
}
function saveFlush(){if(!saveCurrent)return;saveCommit();if(vkReady)void saveSync(true);}
function saveRefresh(){if(!vkEnvironment())return;saveNextTry=0;if(vkReady&&state==='menu'&&!saveConflict){saveGateUntil=Date.now()+6500;saveSetGate(true);}if(vkReady&&!savePullBusy)void saveSync(true);else if(savePullBusy)saveSyncQueued=true;}
$('saveUseCloud')?.addEventListener('click',()=>void saveResolveConflict('cloud'));
$('saveUseLocal')?.addEventListener('click',()=>void saveResolveConflict('local'));
addEventListener('focus',saveRefresh);
addEventListener('pagehide',()=>{if(saveCurrent){recordProgress(true);saveFlush();}});
