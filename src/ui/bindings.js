'use strict';
$('skinPrev').onclick=()=>browseSkin(-1);$('skinNext').onclick=()=>browseSkin(1);
$('skinFilter').value='all';$('skinSort').value='price';
$('skinFilter').onchange=()=>{skinFilter=$('skinFilter').value;renderSkinCatalog();};
$('skinSort').onchange=()=>{skinSort=$('skinSort').value;renderSkinCatalog();};
$('skinAction').onclick=activateCatalogSkin;
$('menuStart').onclick=start;$('menuCustomize').onclick=()=>showMenuPane('skins');$('menuDaily').onclick=()=>showMenuPane('daily');$('dailyBack').onclick=()=>showMenuPane('home');$('menuUpgrades').onclick=()=>showMenuPane('upgrades');$('upgradeBack').onclick=()=>showMenuPane('home');for(const k of upgradeKeys)$('up-'+k+'-buy').onclick=()=>buyUpgrade(k);$('skinBack').onclick=()=>showMenuPane('home');$('menuSound').onclick=toggleSound;$('backMenu').onclick=mainMenu;
$('qualitySelect').value=qualityMode;$('qualitySelect').onchange=()=>{qualityMode=$('qualitySelect').value;saveCommit();quality=qualityMode==='low'?0:qualityMode==='high'?2:mobile?0:2;perfScale=1;resize();clearChunks();};
