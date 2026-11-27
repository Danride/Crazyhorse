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
// Lightweight hand-authored heraldic coat illustrations; actual mesh displayed in previewFrame.
function skinCardArt(i){
 const c=skinSwatches[i],mane=i===6||i===13?'#c9b9ac':i===10?'#f1b04e':i===12?'#425d37':i===14?'#382655':'#392c25';
 const accent=i===10?'<path d="M37 33 32 17 42 23 48 10 54 28 62 25 61 39Z" fill="#ffb24c"/>':i===13?'<path d="M100 18 105 3 109 22Z" fill="#edce82"/>':i===11?'<path d="M91 22 86 5 99 18M105 20 119 7 115 24" fill="#342025"/>':i===12?'<path d="M29 36 18 26 37 25 44 14 51 35" fill="#7da357"/>':'';
 const coat=i===7?'<path d="M46 39 61 35 73 47 62 57 43 54Z M88 28 100 24 110 40 95 39Z" fill="#f3e8d0"/>':i===9?'<path d="M36 40 49 56M49 36 64 56M64 35 77 51M85 34 99 44M92 24 108 34" stroke="#33312f" stroke-width="5"/>':i===8?'<g fill="#e1dcd0" opacity=".8"><circle cx="49" cy="45" r="5"/><circle cx="64" cy="42" r="4"/><circle cx="74" cy="51" r="4"/><circle cx="55" cy="54" r="3"/></g>':'';
 return '<svg viewBox="0 0 140 92" aria-hidden="true"><ellipse cx="70" cy="79" rx="49" ry="5" fill="#160d0850"/><path d="M35 42 20 34 14 62 23 66 34 49" fill="'+mane+'"/><path d="M41 49H51L46 77H35ZM67 49H77L81 77H70Z" fill="'+mane+'"/><path d="M32 36H75L83 25 91 15 100 16 109 20 117 30 113 40 98 41 92 56 85 61 85 78H74L71 58H48L48 78H37L35 57 29 49Z" fill="'+c+'" stroke="#2b201a" stroke-width="1.5"/><path d="M77 36 84 19 90 14 96 16 86 40 82 48 75 43Z" fill="'+mane+'"/><path d="M91 16 91 8 98 16M102 19 107 11 109 22" fill="'+c+'" stroke="#33241a" stroke-width="1.3"/>'+coat+accent+'<path d="M41 78H49M74 78H85" stroke="#33251c" stroke-width="3"/><rect x="104" y="25" width="3" height="3" fill="#1d1714"/><path d="M110 36H115" stroke="#403029" stroke-width="1.5"/></svg>';
}
function renderSkinCatalog(){
 const ids=catalogIds();
 $('skinButtons').innerHTML=ids.map(i=>'<button type="button" class="horseListing rarity-'+skinRarity[i]+(i===previewSkin?' active':'')+'" data-skin="'+i+'" aria-pressed="'+(i===previewSkin)+'"><div class="horseArt">'+skinCardArt(i)+'<span class="horseRarity">'+rarityNames[skinRarity[i]]+'</span></div><div class="horseListingBody"><b>'+skinNames[i]+'</b><span class="horsePrice">'+(ownsSkin(i)?(i===selectedSkin?'Выбран':i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+skinPrices[i])+'</span></div></button>').join('')||'<p class="catalogEmpty">В этой категории пока нет лошадей.</p>';
 document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>previewChoice(Number(b.dataset.skin)));
 const i=previewSkin,owned=ownsSkin(i),action=$('skinAction');
 $('catalogCount').textContent=ownedSkins.size+' / '+skinNames.length;
 $('skinDetailName').textContent=skinNames[i];$('skinDetailRarity').textContent=rarityNames[skinRarity[i]];
 $('skinDetailPrice').textContent=owned?(i===FREE_SKIN?'Бесплатно':'В конюшне'):'◆ '+skinPrices[i]+' монет';
 action.textContent=i===selectedSkin?'ВЫБРАНО':owned?'ОСЕДЛАТЬ':wallet<skinPrices[i]?'НЕ ХВАТАЕТ '+(skinPrices[i]-wallet):'КУПИТЬ · '+skinPrices[i]+' ◆';
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
