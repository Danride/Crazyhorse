'use strict';
const uModel=gl.getUniformLocation(prog,'model'),uMix=gl.getUniformLocation(prog,'animMix'),uMesh=gl.getUniformLocation(prog,'meshMode'),uNeck=gl.getUniformLocation(prog,'neckTurn'),uFog=gl.getUniformLocation(prog,'fogColor'),aNext=gl.getAttribLocation(prog,'aNext');
function decode64(s){let a=atob(s),b=new Uint8Array(a.length);for(let i=0;i<a.length;i++)b[i]=a.charCodeAt(i);return b;}
function staticBuffer(target,data){let b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;}
