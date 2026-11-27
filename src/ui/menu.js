'use strict';
function setSkin(i){
 if(!ownsSkin(i))return false;
 selectedSkin=i;previewSkin=i;try{localStorage.setItem('kings-road-skin-v2',String(i));}catch(e){}
 $('previewName').textContent=skinNames[i];return true;
}
function previewChoice(i){
 if(!Number.isInteger(i)||i<0||i>=skinNames.length)return;
 previewSkin=i;$('previewName').textContent=skinNames[i];renderSkinCatalog();
}
function browseSkin(delta){
 const ids=$('mainMenu').dataset.pane==='skins'?catalogIds():[...ownedSkins].sort((a,b)=>a-b);
 if(!ids.length)return;
 const i=ids[(Math.max(0,ids.indexOf(previewSkin))+delta+ids.length)%ids.length];
 if($('mainMenu').dataset.pane==='skins')previewChoice(i);else setSkin(i);
}
function catalogIds(){
 let ids=skinNames.map((_,i)=>i).filter(i=>skinFilter==='all'||(skinFilter==='owned'?ownsSkin(i):!ownsSkin(i)));
 if(skinSort==='price')ids.sort((a,b)=>skinPrices[a]-skinPrices[b]);else if(skinSort==='rare')ids.sort((a,b)=>skinRarity[b]-skinRarity[a]||skinPrices[b]-skinPrices[a]);
 return ids;
}
// Static low-poly 3D thumbnail renderer: geometry, face lighting and orthographic camera.
// Cached after first catalog visit; no extra WebGL contexts or animation loops.
const skinThumbnailCache=new Map();
function skinCardArt(i){
 if(skinThumbnailCache.has(i))return skinThumbnailCache.get(i);
 const coat=skinSwatches[i],mane=['#191719','#66646a','#542a1b','#35241d','#573124','#141822','#d2c8bc','#523728','#55565a','#28282a','#eaa03a','#2e1823','#3d5331','#d8b7e5','#2e214c'][i],hoof=i===10?'#f9b743':i===14?'#bc7aef':'#302a29';
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
 // Four separately modeled legs, hooves, barrel, chest, rump, neck, head, ears, mane, and tail.
 for(const x of [-.83,.77])for(const z of [-.38,.38]){
  block(x,.73,z,.32,1.13,.30,coat,x<0?-.045:.025);
  block(x,.17,z,.37,.31,.35,hoof);
 }
 block(-.91,1.48,0,.68,.85,.98,coat);
 block(-.03,1.53,0,1.67,.88,1.02,coat);
 block(.78,1.55,0,.66,1.0,.90,coat);
 block(1.0,2.13,0,.58,1.13,.65,coat,-.38);
 block(.67,2.18,0,.18,1.06,.53,mane,-.38);
 block(1.40,2.64,0,.76,.53,.62,coat,-.12);
 block(1.76,2.48,0,.46,.38,.53,i===6?'#b7b2ae':i===10?'#6c2a15':shadeColor(coat,.78),-.10);
 for(const z of [-.22,.22]){block(1.14,2.98,z,.17,.42,.18,coat,-.12);block(1.37,2.70,z>0?.322:-.322,.13,.12,.028,i===10?'#ffde82':i===14?'#e1a6ff':'#21191a');}
 block(1.10,2.89,0,.39,.18,.51,mane);
 block(-1.28,1.20,0,.30,.87,.36,mane,-.36);
 block(-1.43,.83,0,.26,.56,.28,mane,-.14);
 // Coat markings are shallow colored volumes; no textures or external assets.
 if(i===7){for(const z of [-.517,.517]){block(-.49,1.62,z,.61,.58,.018,'#eee0ca');block(.57,1.39,z,.36,.38,.018,'#eee0ca');}}
 if(i===8){for(const z of [-.518,.518])for(const [x,y,a] of [[-.62,1.63,.19],[-.20,1.76,.17],[.18,1.47,.21],[.48,1.79,.16],[-.38,1.30,.16]])block(x,y,z,a,a,.02,'#c9c6c0');}
 if(i===9){for(const z of [-.519,.519])for(const x of [-.69,-.39,-.08,.24,.55])block(x,1.54,z,.105,.76,.022,'#343238',-.14);for(const x of [-.83,.77])for(const z of [-.38,.38]){block(x,.56,z,.337,.13,.317,'#343238');block(x,.93,z,.337,.13,.317,'#343238');}}
 if(i===5){block(.08,1.96,0,1.38,.075,.82,'#4e5964');}
 if(i===10){for(let j=0;j<4;j++)block(.57+j*.10,2.03+j*.23,0,.24,.50-j*.04,.40,j%2?'#ffbe44':'#e64c1d',-.28);block(-1.46,1.03,0,.34,.80,.36,'#ff912b',-.3);}
 if(i===11){for(const z of [-.28,.28])block(1.12,3.10,z,.17,.47,.17,'#37212d',.33);block(.22,1.99,0,.65,.11,.48,'#812f3b');}
 if(i===12){for(let j=0;j<4;j++)block(-.77+j*.36,2.02+(.08*(j%2)),0,.38,.26,.66,j%2?'#90a959':'#536a3b',j*.09);block(-1.31,1.20,0,.38,.76,.43,'#547443',-.32);}
 if(i===13){block(1.52,3.10,0,.13,.63,.13,'#edcf83',-.42);block(1.65,2.94,0,.17,.12,.17,'#e6bb68');}
 if(i===14){block(.12,1.99,0,.96,.08,.72,'#b67aec');for(const z of [-.52,.52])block(.12,1.61,z,.72,.10,.018,'#9b69cf',-.22);}
 const all=faces.flatMap(f=>f.p),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(116/(maxX-minX),73/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const svg='<svg viewBox="0 0 140 100" aria-hidden="true"><ellipse cx="70" cy="90" rx="45" ry="5" fill="#160d0840"/>'+faces.sort((a,b)=>a.depth-b.depth).map(f=>'<polygon points="'+f.p.map(([x,y])=>((x-cx)*scale+70).toFixed(2)+','+((y-cy)*scale+51).toFixed(2)).join(' ')+'" fill="'+f.color+'" stroke="'+f.color+'" stroke-width=".28" stroke-linejoin="round"/>').join('')+'</svg>';
 skinThumbnailCache.set(i,svg);return svg;
}
function formatSkinPrice(n){return Number(n).toLocaleString('ru-RU');}
function renderSkinCatalog(){
 const ids=catalogIds();
 $('skinButtons').innerHTML=ids.map(i=>'<button type="button" class="horseListing rarity-'+skinRarity[i]+(i===previewSkin?' active':'')+'" data-skin="'+i+'" aria-pressed="'+(i===previewSkin)+'"><div class="horseArt">'+skinCardArt(i)+'<span class="horseRarity">'+rarityNames[skinRarity[i]]+'</span></div><div class="horseListingBody"><b>'+skinNames[i]+'</b><span class="horsePrice">'+(ownsSkin(i)?(i===selectedSkin?'Выбран':i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+formatSkinPrice(skinPrices[i]))+'</span></div></button>').join('')||'<p class="catalogEmpty">В этой категории пока нет лошадей.</p>';
 document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>previewChoice(Number(b.dataset.skin)));
 const i=previewSkin,owned=ownsSkin(i),action=$('skinAction');
 $('catalogCount').textContent=ownedSkins.size+' / '+skinNames.length;
 $('skinDetailName').textContent=skinNames[i];$('skinDetailRarity').textContent=rarityNames[skinRarity[i]];
 $('skinDetailPrice').textContent=owned?(i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+formatSkinPrice(skinPrices[i])+' монет';
 action.textContent=i===selectedSkin?'ВЫБРАНО':owned?'ОСЕДЛАТЬ':wallet<skinPrices[i]?'НЕ ХВАТАЕТ '+formatSkinPrice(skinPrices[i]-wallet):'КУПИТЬ · '+formatSkinPrice(skinPrices[i])+' ◆';
 action.disabled=i===selectedSkin||(!owned&&wallet<skinPrices[i]);
}
function activateCatalogSkin(){
 const i=previewSkin;if(i===selectedSkin)return false;
 if(!ownsSkin(i)&&!purchaseSkin(i)){$('skinMessage').textContent='Покупка не выполнена.';return false;}
 setSkin(i);syncWalletUI();renderSkinCatalog();$('skinMessage').textContent='Лошадь готова к заезду.';return true;
}
function showMenuPane(name){$('mainMenu').dataset.pane=name;$('menuHome').classList.toggle('menuHidden',name!=='home');$('menuDailyPane').classList.toggle('menuHidden',name!=='daily');if(name==='daily'||name==='home'){refreshDaily();saveProgression(true);renderProgression();}$('menuSkins').classList.toggle('menuHidden',name!=='skins');$('menuUpgradePane').classList.toggle('menuHidden',name!=='upgrades');if(name==='skins'){previewSkin=selectedSkin;$('previewName').textContent=skinNames[previewSkin];$('skinMessage').textContent='';renderSkinCatalog();}else{previewSkin=selectedSkin;$('previewName').textContent=skinNames[selectedSkin];}if(name==='upgrades'){$('upgradeMessage').textContent='';renderUpgrades();}vkUpdateNavigation();}
function mainMenu(){releaseAllControls();if(state==='running'||state==='paused'||state==='over'){closeProgressRun();saveBest();}if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();state='menu';updatePassWarning();$('game').classList.add('menuMode');resize();$('mainMenu').classList.remove('hidden');$('overlay').classList.add('hidden');showMenuPane('home');$('menuBest').textContent=best;stopHoofLoop();stopHorseVoice();setSkin(selectedSkin);syncWalletUI();clearBubbles();resetSpeechMemory();}
function leaveMenu(){$('mainMenu').classList.add('hidden');$('game').classList.remove('menuMode');resize();lastBiome=-1;}
