'use strict';
const BIOMES=[
{name:'ДЕРЕВНЯ',road:'bba17d',ground:'829b55',fog:'c9c9a9',sky:['669fc0','e1e4ca']},
{name:'ГОРОД',road:'a69c8c',ground:'aaa08b',fog:'c9c3b5',sky:['70a9cb','e5e3d2']},
{name:'ЛЕС',road:'a4916c',ground:'516c3c',fog:'a9bba1',sky:['699ab0','c6d8b7']},
{name:'ПШЕНИЧНЫЕ ПОЛЯ',road:'c1a781',ground:'bf9f4e',fog:'e0cfa4',sky:['6faacb','eee4c4']}];
let biomeOffset=0,lastBiome=-1,biomeRoute=[],routeSeed=1,routeBag=[];
function routeRandom(){routeSeed=(Math.imul(routeSeed,1664525)+1013904223)>>>0;return routeSeed/4294967296;}
function appendBiome(){
 const prev=biomeRoute[biomeRoute.length-1],start=prev?prev.end:0;
 let kind=biomeOffset;
 if(prev){if(!routeBag.length)routeBag=[0,1,2,3];const choices=routeBag.filter(k=>k!==prev.kind);kind=choices[Math.floor(routeRandom()*choices.length)];routeBag.splice(routeBag.indexOf(kind),1);}
 const length=500+20*Math.floor(routeRandom()*126),segment={index:biomeRoute.length,start,end:start+length,length,kind,previous:prev?prev.kind:kind};
 biomeRoute.push(segment);return segment;
}
function resetBiomeRoute(first=0,seed=Math.floor(Math.random()*4294967296)){routeSeed=seed>>>0;biomeRoute=[];biomeOffset=first>=0&&first<4?first|0:Math.floor(routeRandom()*4);routeBag=[0,1,2,3].filter(k=>k!==biomeOffset);lastBiome=-1;appendBiome();}
function biomeSegment(i){if(!biomeRoute.length)resetBiomeRoute(biomeOffset,1);while(biomeRoute.length<=i)appendBiome();return biomeRoute[i];}
function biomeAt(d){d=Math.max(0,d);if(!biomeRoute.length)resetBiomeRoute(biomeOffset,1);while(biomeRoute[biomeRoute.length-1].end<=d)appendBiome();let a=0,z=biomeRoute.length-1;while(a<z){let m=(a+z)>>1;if(d<biomeRoute[m].end)z=m;else a=m+1;}return biomeRoute[a];}
function biomeIndex(d){return biomeAt(d).kind;}
function blend(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function biomeColor(d,key){let r=biomeAt(d),i=r.kind,t=clamp((Math.max(0,d)-r.start)/85,0,1);return r.index>0&&t<1?blend(col(BIOMES[r.previous][key]),col(BIOMES[i][key]),t):col(BIOMES[i][key]);}
