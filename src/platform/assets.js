'use strict';
// Large models are optional for startup: load only when visible, with bounded parallelism.
const LAZY_GAME_ASSETS=["assets/horses/base-01.js","assets/horses/base-02.js","assets/horses/base-03.js","assets/horses/base-04.js","assets/horses/packed-01.js","assets/horses/packed-04.js","assets/horses/packed-05.js","assets/horses/packed-06.js","assets/horses/packed-07.js","assets/horses/packed-08.js","assets/props/barrel-data.js","assets/props/prop-data.js"];
const assetRequests=new Map(),assetRetries=new Map(),assetQueue=[];
let assetActive=0;
function pumpGameAssets(){
 const limit=mobile?2:3;
 assetQueue.sort((a,b)=>b.priority-a.priority);
 while(assetActive<limit&&assetQueue.length){
  const job=assetQueue.shift();assetActive++;
  const script=document.createElement('script');script.async=true;script.dataset.lazyGameAsset='1';script.src=job.path+'?asset=3';
  let released=false;const release=()=>{if(!released){released=true;assetActive--;}};
  const timer=setTimeout(()=>{if(!job.done)finish(false);},30000);
  const finish=ok=>{if(job.done)return;clearTimeout(timer);release();job.done=true;if(!ok){assetRequests.delete(job.path);assetRetries.set(job.path,Date.now()+10000);script.remove?.();console.warn('[Crazy Horse] Optional asset failed:',job.path);}job.resolve(ok);pumpGameAssets();};
  script.onload=()=>finish(true);script.onerror=()=>finish(false);
  try{document.head.appendChild(script);}catch(e){finish(false);}
 }
}
function loadGameAsset(path,priority=0){
 if(!LAZY_GAME_ASSETS.includes(path)||!document.head?.appendChild)return Promise.resolve(false);
 const current=assetRequests.get(path);if(current){current.priority=Math.max(current.priority,priority);return current.promise;}
 if(Date.now()<(assetRetries.get(path)||0))return Promise.resolve(false);
 let resolve;const promise=new Promise(r=>resolve=r),job={path,priority,promise,resolve,done:false};
 assetRequests.set(path,job);assetQueue.push(job);pumpGameAssets();return promise;
}
function warmGameAssets(){
 horseAssetReady(selectedSkin);
 if(!horseData[FREE_SKIN])void loadGameAsset('assets/horses/base-04.js',10);
}
