'use strict';
const laneW=3.05, edge=laneW*3, laneX=i=>(i-2.5)*laneW, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), rand=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.random()*a.length|0];
let verts=new Float32Array(900000), n=0;const palette={road:[.24,.28,.31],road2:[.255,.292,.32],grass:[.37,.58,.37],grass2:[.39,.60,.38],line:[.85,.87,.76],yellow:[.91,.73,.34],rail:[.58,.65,.63],dark:[.09,.13,.16],glass:[.17,.29,.33],glass2:[.30,.49,.54],red:[.95,.18,.14],white:[.94,.95,.81],bark:[.38,.29,.21]};
function col(s){return [parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255]}function shade(c,m){return [c[0]*m,c[1]*m,c[2]*m]}
function roadCenter(d){return 0}
function roadSlope(d){return 0}
let rawModel=false, curveOrigin=0;
function vertex(p,c){if(n+6>=verts.length){let v=new Float32Array(verts.length*2);v.set(verts);verts=v}verts[n++]=p[0]+(rawModel?0:roadCenter(distance+p[2])-curveOrigin);verts[n++]=p[1];verts[n++]=p[2];verts[n++]=c[0];verts[n++]=c[1];verts[n++]=c[2]}
function rotateRange(from,x,z,yaw){let co=Math.cos(yaw),si=Math.sin(yaw);for(let i=from;i<n;i+=6){let xx=verts[i]-x,zz=verts[i+2]-z;verts[i]=x+xx*co+zz*si;verts[i+2]=z-xx*si+zz*co;}}
function placeModel(x,z,yaw,draw){let from=n;rawModel=true;draw();rawModel=false;rotateRange(from,x,z,yaw);let offset=roadCenter(distance+z)-curveOrigin;for(let i=from;i<n;i+=6)verts[i]+=offset;}
function quad(a,b,c,d,color){vertex(a,color);vertex(b,color);vertex(c,color);vertex(a,color);vertex(c,color);vertex(d,color)}
function flat(x1,x2,z1,z2,y,c){let k=1;for(let i=0;i<k;i++){let a=z1+(z2-z1)*i/k,b=z1+(z2-z1)*(i+1)/k;quad([x1,y,a],[x1,y,b],[x2,y,b],[x2,y,a],c)}}
function box(x,y,z,w,h,l,c){let a=x-w/2,b=x+w/2,d=z-l/2,e=z+l/2,t=y+h;let p=[ [a,y,d],[b,y,d],[b,t,d],[a,t,d],[a,y,e],[b,y,e],[b,t,e],[a,t,e] ];quad(p[0],p[1],p[2],p[3],shade(c,.78));quad(p[5],p[4],p[7],p[6],shade(c,.69));quad(p[4],p[0],p[3],p[7],shade(c,.88));quad(p[1],p[5],p[6],p[2],shade(c,.62));quad(p[3],p[2],p[6],p[7],c);quad(p[4],p[5],p[1],p[0],shade(c,.52))}
function hash(i){let a=Math.sin(i*127.1+311.7)*43758.5453;return a-Math.floor(a)}
