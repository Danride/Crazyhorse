import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
let html=read('index.html');
html=html.replace(/<link rel="stylesheet" href="([^"\n]+)">/g,(_,p)=>'<style>\n'+read(p.split('?')[0])+'\n</style>');
const lazy=JSON.parse(read('src/platform/assets.js').match(/const LAZY_GAME_ASSETS=(\[[^\n]+\]);/)[1]);
// Standalone HTML stays fully offline: embed optional assets immediately before the main script.
html=html.replace(/<script src="src\/main\.js[^"\n]*"><\/script>/,m=>lazy.map(p=>'<script>\n'+read(p)+'\n</script>').join('\n')+'\n'+m);
html=html.replace(/<script src="([^"\n]+)"><\/script>/g,(_,p)=>'<script>\n'+read(p.split('?')[0])+'\n</script>');
if(existsSync(resolve(root,'assets/npc/police-horse.json')))html=html.replace('</head>','<script>window.POLICE_HORSE_ASSET='+read('assets/npc/police-horse.json')+';</script></head>');
mkdirSync(resolve(root,'dist'),{recursive:true});
const out=resolve(root,'dist/Crazy-Horse-v3.7.9.html');writeFileSync(out,html);console.log(out);
