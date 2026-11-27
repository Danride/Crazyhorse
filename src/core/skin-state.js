'use strict';
const FREE_SKIN=3,SKIN_OWNED_KEY='crazy-horse-owned-skins-v1';
let selectedSkin=FREE_SKIN,menuAngle=.4,speechClock=0,lastOrdinary='',lastRude='',cameraView=null;
function migrateHorseSelection(value){let i=Number(value);if(!Number.isInteger(i)||i<0||i>17||i===10||i===11||i===17)return 0;return i===9?FREE_SKIN:i>=12?i-2:i;}
try{let saved=localStorage.getItem('kings-road-skin-v2');selectedSkin=saved===null||saved===undefined?migrateHorseSelection(localStorage.getItem('kings-road-skin')):clamp(Number(saved)||0,0,14)|0;}catch(e){}
const skinNames=["Вороной","Серый","Рыжий","Гнедой","Каштановый","Обсидиановый","Снежный","Пегий","В яблоках",null,"Огненный","Демонический","Лесной","Единорог","Пустотный"];const skinSwatches=["#272727","#a0a0a0","#9b250d","#a66b37","#a45e35","#252a33","#e7e1d5","#bd8f63","#90908d",null,"#eb6424","#6c262b","#65823e","#e9ddec","#5b3c83"];

const skinPrices=[2000,2500,3000,0,4000,7500,6500,5000,6000,null,15000,19000,12000,22000,25000];
const skinRarity=[0,0,0,0,0,1,1,1,1,null,2,3,2,3,3];
const rarityNames=['Обычный','Редкий','Эпический','Легендарный'];
// ID 9 is retired; preserve all other saved IDs.
const ACTIVE_SKIN_IDS=skinNames.flatMap((name,i)=>name===null?[]:[i]);
function isActiveSkin(i){return Number.isInteger(i)&&i>=0&&i<skinNames.length&&skinNames[i]!==null;}
let ownedSkins=new Set([FREE_SKIN]);
try{const saved=JSON.parse(localStorage.getItem(SKIN_OWNED_KEY)||'[]');if(Array.isArray(saved))for(const i of saved)if(isActiveSkin(i))ownedSkins.add(i);}catch(e){}
if(!ownedSkins.has(selectedSkin))selectedSkin=FREE_SKIN;
let previewSkin=selectedSkin,skinFilter='all',skinSort='price';
function ownsSkin(i){return isActiveSkin(i)&&ownedSkins.has(i);}
function purchaseSkin(i){
 if(state!=='menu'||saveLoading||!isActiveSkin(i)||ownsSkin(i)||wallet<skinPrices[i])return false;
 const oldWallet=wallet,oldOwned=[...ownedSkins];wallet-=skinPrices[i];ownedSkins.add(i);
 if(!saveCommit()){wallet=oldWallet;ownedSkins=new Set(oldOwned);return false;}
 return true;
}
