'use strict';
function setSkin(i){
 if(!ownsSkin(i))return false;
 selectedSkin=i;previewSkin=i;if(typeof saveCommit==='function')saveCommit();
 $('previewName').textContent=skinNames[i];return true;
}
function previewChoice(i){
 if(!isActiveSkin(i))return;
 previewSkin=i;$('previewName').textContent=skinNames[i];renderSkinCatalog();
}
function browseSkin(delta){
 const ids=$('mainMenu').dataset.pane==='skins'?catalogIds():[...ownedSkins].sort((a,b)=>a-b);
 if(!ids.length)return;
 const i=ids[(Math.max(0,ids.indexOf(previewSkin))+delta+ids.length)%ids.length];
 if($('mainMenu').dataset.pane==='skins')previewChoice(i);else setSkin(i);
}
function catalogIds(){
 let ids=ACTIVE_SKIN_IDS.filter(i=>skinFilter==='all'||(skinFilter==='owned'?ownsSkin(i):!ownsSkin(i)));
 if(skinSort==='price')ids.sort((a,b)=>skinPrices[a]-skinPrices[b]);else if(skinSort==='rare')ids.sort((a,b)=>skinRarity[b]-skinRarity[a]||skinPrices[b]-skinPrices[a]);
 return ids;
}
// Static low-poly 3D thumbnail renderer: geometry, face lighting and orthographic camera.
// Cached after first catalog visit; no extra WebGL contexts or animation loops.
const skinThumbnailCache=new Map();
function skinCardArt(i){
 if(!isActiveSkin(i))return '';
 if(skinThumbnailCache.has(i))return skinThumbnailCache.get(i);
 const coat=skinSwatches[i],mane=['#191719','#66646a','#542a1b','#35241d','#573124','#141822','#d2c8bc','#523728','#55565a',null,'#eaa03a','#2e1823','#3d5331','#d8b7e5','#2e214c'][i],hoof=i===10?'#f9b743':i===14?'#bc7aef':'#302a29';
 const faces=[],cam=[.62,.45,1],len=Math.hypot(...cam),forward=cam.map(v=>v/len),h=Math.hypot(cam[0],cam[2]),right=[cam[2]/h,0,-cam[0]/h],up=[-forward[1]*right[2]*-1,0,0];
 // up = forward cross right, right-handed camera basis.
 up[0]=forward[1]*right[2];up[1]=forward[2]*right[0]-forward[0]*right[2];up[2]=-forward[1]*right[0];
 const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
 const project=v=>[dot(v,right),-dot(v,up)],light=[-.32,.82,.47];
 function shadeColor(c,k){const v=parseInt(c.slice(1),16);return '#'+[v>>16&255,v>>8&255,v&255].map(n=>Math.max(0,Math.min(255,Math.round(n*k))).toString(16).padStart(2,'0')).join('');}
 function block(x,y,z,w,h,d,c,rot=0){
  const co=Math.cos(rot),si=Math.sin(rot);
  const pts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2*co-b*h/2*si,y+a*w/2*si+b*h/2*co,z+e*d/2]);
  const sides=[[[0,3,2,1],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,4,7,3],[-1,0,0]],[[1,2,6,5],[1,0,0]],[[0,1,5,4],[0,-1,0]],[[3,7,6,2],[0,1,0]]];
  for(const [ids,n] of sides){const normal=[n[0]*co-n[1]*si,n[0]*si+n[1]*co,n[2]];if(dot(normal,forward)<=.00001)continue;const vs=ids.map(j=>pts[j]),depth=vs.reduce((s,v)=>s+dot(v,forward),0)/4;faces.push({p:vs.map(project),depth,color:shadeColor(c,.68+.34*Math.max(0,dot(normal,light)))});}
 }
 // A close-up bust: neck, cheek, jaw, muzzle, ears and mane, no torso or legs.
 block(-.12,.66,0,.98,1.30,1.03,coat,-.27);
 block(.10,1.29,0,.79,1.11,.86,coat,-.42);
 block(.41,1.89,0,.91,.80,.87,coat,-.18);
 block(.82,1.64,0,.77,.63,.74,coat,-.43);
 block(1.13,1.35,0,.62,.49,.68,i===6?'#b7b2ae':i===10?'#6c2a15':shadeColor(coat,.76),-.24);
 block(.95,1.13,0,.48,.20,.63,shadeColor(coat,.65),-.20);
 for(const z of [-.30,.30]){
  block(.14,2.38,z,.25,.66,.23,coat,.12);
  block(.20,2.46,z>0?.408:-.408,.13,.43,.018,shadeColor(coat,.60),.12);
  block(.52,1.99,z>0?.445:-.445,.20,.20,.032,i===10?'#ffd27a':i===14?'#df9aff':'#1d1719');
  block(.57,2.04,z>0?.464:-.464,.055,.055,.012,'#f3e5d7');
  block(1.34,1.43,z>0?.348:-.348,.12,.10,.024,'#302221',-.2);
 }
 block(-.45,1.09,0,.23,1.27,.85,mane,-.27);
 block(-.28,1.80,0,.25,.91,.78,mane,-.36);
 block(.22,2.29,0,.48,.24,.68,mane,-.12);
 block(.52,2.13,0,.28,.40,.45,mane,-.46);
 // Distinct coat and fantasy features, limited to head and neck.
 if(i===2||i===4||i===6){block(.76,2.04,0,.035,.43,.24,i===6?'#f2ede5':'#e3c9a1',-.18);}
 if(i===5){block(.50,2.22,0,.42,.12,.74,'#4e5964',-.18);block(-.25,.84,.523,.40,.36,.025,'#4e5964',-.27);}
 if(i===7){for(const z of [-.525,.525])block(-.24,.63,z,.53,.70,.025,'#eee0ca',-.27);block(.73,2.03,0,.035,.44,.28,'#eee0ca',-.18);}
 if(i===8){for(const z of [-.525,.525])for(const [x,y,a] of [[-.36,.36,.18],[-.10,.64,.20],[-.38,.98,.14],[.13,.91,.17]])block(x,y,z,a,a,.025,'#c9c6c0');}
 if(i===10){for(let j=0;j<5;j++)block(-.54+j*.10,.97+j*.29,0,.35,.68-j*.045,.70,j%2?'#ffbe44':'#e64c1d',-.35);}
 if(i===11){for(const z of [-.34,.34])block(.01,2.70,z,.20,.72,.20,'#38212c',.36);block(.10,1.01,.525,.38,.16,.03,'#a84443',-.27);}
 if(i===12){for(let j=0;j<4;j++)block(-.47+j*.08,.69+j*.39,0,.37,.31,.91,j%2?'#90a959':'#536a3b',j*.09);block(.28,2.40,0,.25,.21,.56,'#789851');}
 if(i===13){block(.63,2.66,0,.17,.89,.17,'#edcf83',-.42);block(.48,2.30,0,.32,.13,.48,'#d7a8df');}
 if(i===14){block(.56,2.22,0,.38,.10,.72,'#b67aec',-.18);for(const z of [-.525,.525])block(-.11,.66,z,.50,.10,.025,'#9b69cf',-.27);}
 const all=faces.flatMap(f=>f.p),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(118/(maxX-minX),81/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const svg='<svg viewBox="0 0 140 100" aria-hidden="true"><ellipse cx="65" cy="94" rx="32" ry="4" fill="#160d0840"/>'+faces.sort((a,b)=>a.depth-b.depth).map(f=>'<polygon points="'+f.p.map(([x,y])=>((x-cx)*scale+70).toFixed(2)+','+((y-cy)*scale+51).toFixed(2)).join(' ')+'" fill="'+f.color+'" stroke="'+f.color+'" stroke-width=".28" stroke-linejoin="round"/>').join('')+'</svg>';
 skinThumbnailCache.set(i,svg);return svg;
}
function formatSkinPrice(n){return Number(n).toLocaleString('ru-RU');}
function renderSkinCatalog(){
 const ids=catalogIds(),scroll=$('skinButtons').scrollTop||0;
 $('skinButtons').innerHTML=ids.map(i=>'<button type="button" class="horseListing rarity-'+skinRarity[i]+(i===previewSkin?' active':'')+'" data-skin="'+i+'" aria-pressed="'+(i===previewSkin)+'"><div class="horseArt">'+skinCardArt(i)+'<span class="horseRarity">'+rarityNames[skinRarity[i]]+'</span></div><div class="horseListingBody"><b>'+skinNames[i]+'</b><span class="horsePrice">'+(ownsSkin(i)?(i===selectedSkin?'Выбран':i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+formatSkinPrice(skinPrices[i]))+'</span></div></button>').join('')||'<p class="catalogEmpty">В этой категории пока нет лошадей.</p>';
 $('skinButtons').scrollTop=scroll;
 document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>previewChoice(Number(b.dataset.skin)));
 const i=previewSkin,owned=ownsSkin(i),action=$('skinAction');
 $('catalogCount').textContent=ownedSkins.size+' / '+ACTIVE_SKIN_IDS.length;
 $('skinDetailName').textContent=skinNames[i];$('skinDetailRarity').textContent=rarityNames[skinRarity[i]];
 $('skinDetailPrice').textContent=owned?(i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+formatSkinPrice(skinPrices[i])+' монет';
 action.textContent=i===selectedSkin?'ВЫБРАНО':owned?'ОСЕДЛАТЬ':wallet<skinPrices[i]?'НЕ ХВАТАЕТ '+formatSkinPrice(skinPrices[i]-wallet):'КУПИТЬ · '+formatSkinPrice(skinPrices[i])+' ◆';
 action.disabled=i===selectedSkin||(!owned&&wallet<skinPrices[i]);
}
function activateCatalogSkin(){
 const i=previewSkin;if(i===selectedSkin||saveLoading)return false;
 if(!ownsSkin(i)&&!purchaseSkin(i)){$('skinMessage').textContent='Покупка не выполнена.';return false;}
 setSkin(i);syncWalletUI();renderSkinCatalog();$('skinMessage').textContent='Лошадь готова к заезду.';return true;
}
function showMenuPane(name){$('mainMenu').dataset.pane=name;$('menuHome').classList.toggle('menuHidden',name!=='home');$('menuDailyPane').classList.toggle('menuHidden',name!=='daily');if(name==='daily'||name==='home'){refreshDaily();saveProgression(true);renderProgression();}$('menuSkins').classList.toggle('menuHidden',name!=='skins');$('menuUpgradePane').classList.toggle('menuHidden',name!=='upgrades');if(name==='skins'){previewSkin=selectedSkin;$('previewName').textContent=skinNames[previewSkin];$('skinMessage').textContent='';renderSkinCatalog();}else{previewSkin=selectedSkin;$('previewName').textContent=skinNames[selectedSkin];}if(name==='upgrades'){$('upgradeMessage').textContent='';renderUpgrades();}vkUpdateNavigation();}
function mainMenu(){if(reviveBusy)return;releaseAllControls();$('reviveOffer').hidden=true;if(state==='running'||state==='paused'||state==='over'){closeProgressRun();saveBest();}if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();state='menu';updatePassWarning();$('game').classList.add('menuMode');resize();$('mainMenu').classList.remove('hidden');$('overlay').classList.add('hidden');showMenuPane('home');$('menuBest').textContent=best;stopHoofLoop();stopHorseVoice();setSkin(selectedSkin);syncWalletUI();clearBubbles();resetSpeechMemory();}
function leaveMenu(){$('mainMenu').classList.add('hidden');$('game').classList.remove('menuMode');resize();lastBiome=-1;}
