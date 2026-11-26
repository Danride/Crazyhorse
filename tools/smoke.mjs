// Headless logic smoke test; GL/DOM calls are stubs, not real rendering.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,runInContext} from 'node:vm';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const scripts=[...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
let next=1;const gl=new Proxy({drawingBufferWidth:800,drawingBufferHeight:600,getError:()=>0,NO_ERROR:0,getShaderParameter:()=>true,getProgramParameter:()=>true},{get(o,k){if(k in o)return o[k];return typeof k==='string'&&k===k.toUpperCase()?(o[k]=next++):()=>({});}});
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});
const elems=new Map();
function element(id=''){let classes=new Set();return {id,value:'0',children:[],dataset:{},style:{setProperty(){}},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){if(v??!classes.has(k))classes.add(k);else classes.delete(k);}},addEventListener(){},setAttribute(){},append(...items){this.children.push(...items);},get firstChild(){return this.children[0]},get lastChild(){return this.children.at(-1)},offsetWidth:130,offsetHeight:40,getContext:t=>t==='webgl'?gl:ctx,getBoundingClientRect:()=>({left:200,top:80,right:600,bottom:410,width:400,height:330})};}
const get=id=>{if(!elems.has(id))elems.set(id,element(id));return elems.get(id)};
const storage=new Map();let seed=202610;
const math=Object.create(Math);math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
const vm=createContext({document:{getElementById:get,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element()},window:{},innerWidth:800,innerHeight:600,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},atob,console,Math:math,setTimeout,clearTimeout});
for(const p of scripts)runInContext(read(p),vm,{filename:p});
const run=s=>runInContext(s,vm);
assert.equal(run('state'),'menu');
assert.deepEqual(Array.from(run('[0,9,10,1000,2499,2500,6000].map(speedPercentAt)')),[100,100,101,200,349,350,350]);
assert.equal(run('Math.round(START_SPEED*3.6)'),100);
assert.equal(run('Math.round(MAX_SPEED*3.6)'),350);assert.equal(run('skinNames.length'),15);
assert.equal(run('TRAFFIC_MULTIPLIER'),2);
assert(run('!!sweepBox(0,-5,0,5,1,1)'));
assert(run('(()=>{resetSpeechGate();let a={},b={};let ok=requestNpcSpeech(a,"A",false,0)&&!requestNpcSpeech(b,"B",false,0)&&!requestNpcSpeech(b,"B",true,4);resetSpeechGate();return ok;})()'));
assert.equal(run('sweepBox(2,-5,2,5,1,1)'),null);
assert(run('!!sweepCircle(0,-5,0,5,1)'));
assert.equal(run('sweepCircle(1.1,-5,1.1,5,1)'),null);
assert.equal(run('Math.round(overtakeSpeed(MAX_SPEED)*3.6)'),400);
assert.equal(run('Math.round(overtakeSpeed(START_SPEED)*3.6)'),150);
assert.equal(run('npcComboEvent({kind:0,z:2,x:0,actualV:10},0,3,1.6,1.6,30,false)'), 'БЛИЗКИЙ ОБГОН');
assert.equal(run('npcComboEvent({kind:0,z:-4,x:0,actualV:10},0,-3,1.05,1.4,30,false)'), 'ПОДРЕЗАЛ');
assert(run('horseStats({turn:5,jump:5,stability:5},1).jump**2/23>1.85'));
assert(run('horseStats({turn:0,jump:0,stability:0},1).grip<.42'));
assert.equal(run('upgradePrice("turn")'),100);
assert.equal(run('buyUpgrade("turn")'),false);
run('wallet=100;');assert.equal(run('buyUpgrade("turn")'),true);assert.equal(run('wallet'),0);assert.equal(run('horseLevels.turn'),1);run('horseLevels.turn=0;');
assert(run('Array.from({length:16},(_,i)=>planRoadSegment(i)).every(rows=>rows.length>0&&patternRouteExists(rows))'));
assert(run('biomeRoute.every((r,i)=>r.length>=500&&r.length<=3000&&(!i||r.kind!==biomeRoute[i-1].kind)&&(!i||r.start===biomeRoute[i-1].end))'));
assert.equal(run('coinSweep({d:1.6,x:0,y:.82},0,3,0,0,0,0)'),true);
assert.equal(run('coinSweep({d:1.6,x:4,y:.82},0,3,0,0,0,0)'),false);
assert.equal(run('newHorseData.models.length'),11);
assert.equal(run('skinSwatches.length'),15);
assert.equal(run('skinNames.includes("Королевский")||skinNames.includes("Рыцарский")||skinNames.includes("Грибной")'),false);
assert.deepEqual(Array.from(run('[0,9,10,11,12,13,14,15,16,17].map(migrateHorseSelection)')),[0,9,0,0,10,11,12,13,14,0]);
for(let i=0;i<15;i++){run('setSkin('+i+'); renderPreview()');assert.equal(run('selectedSkin'),i);}
for(let b=0;b<4;b++){
 run("quality=0; $('menuBiome').value='"+b+"'; start(); advanceIntro(2);");
 assert.equal(run('biomeIndex(distance)'),b);
 run('for(let i=0;i<180&&state==="running";i++){update(1/60);if(i%60===0)render();}');
 assert(run('distance')>0);assert(run('Number.isFinite(px)&&Number.isFinite(speed)'));
 console.log('zone',b,'distance',run('Math.round(distance)'),'state',run('state'));
 run('mainMenu()');
}
console.log('OK: 15 skins, menu and all 4 zones (mock WebGL).');
