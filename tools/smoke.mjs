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
assert.equal(run('state'),'menu');assert.equal(run('skinNames.length'),15);
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
