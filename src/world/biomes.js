'use strict';
const BIOMES=[
{name:'ДЕРЕВНЯ',road:'bba17d',ground:'829b55',fog:'c9c9a9',sky:['669fc0','e1e4ca']},
{name:'ГОРОД',road:'a69c8c',ground:'aaa08b',fog:'c9c3b5',sky:['70a9cb','e5e3d2']},
{name:'ЛЕС',road:'a4916c',ground:'516c3c',fog:'a9bba1',sky:['699ab0','c6d8b7']},
{name:'ПШЕНИЧНЫЕ ПОЛЯ',road:'c1a781',ground:'bf9f4e',fog:'e0cfa4',sky:['6faacb','eee4c4']}];
let biomeOffset=0,lastBiome=-1;const BIOME_LEN=560;
function biomeIndex(d){return ((Math.floor(Math.max(0,d)/BIOME_LEN)+biomeOffset)%4+4)%4;}

function blend(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function biomeColor(d,key){let i=biomeIndex(d),f=Math.max(0,d)%BIOME_LEN,t=clamp(f/85,0,1);return d>=BIOME_LEN&&t<1?blend(col(BIOMES[(i+3)%4][key]),col(BIOMES[i][key]),t):col(BIOMES[i][key]);}
