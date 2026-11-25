'use strict';
// v2.1.0: subtle speed-dependent radial motion blur, preserving the central view.
let motionBlur=null, motionBlurFailed=false;
function initMotionBlur(){
 let p=null,b=null,t=null,vert=null,frag=null;
 try{
  vert=shader(gl.VERTEX_SHADER,`attribute vec2 aScreen;varying vec2 uv;void main(){uv=aScreen*.5+.5;gl_Position=vec4(aScreen,0.,1.);}`);
  frag=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D scene;uniform vec2 invSize;uniform float strength;uniform float detail;
  vec4 sampleScene(vec2 at){vec4 c=texture2D(scene,at);return vec4(c.rgb*c.a,c.a);}
  void main(){vec2 d=uv-vec2(.5,.60);float edge=smoothstep(.18,.48,abs(d.x));
   vec4 c=sampleScene(uv);if(edge>.005){vec2 pixelDir=vec2(d.x,d.y*invSize.x/invSize.y);vec2 delta=normalize(pixelDir+vec2(.0001))*invSize*strength*edge;
    if(detail>.5){c=c*.40+(sampleScene(uv-delta*.5)+sampleScene(uv+delta*.5))*.20+(sampleScene(uv-delta)+sampleScene(uv+delta))*.10;}
    else{c=c*.50+(sampleScene(uv-delta*.75)+sampleScene(uv+delta*.75))*.25;}}
   gl_FragColor=vec4(c.rgb/max(c.a,.001),c.a);
  }`);
  p=gl.createProgram();gl.attachShader(p,vert);gl.attachShader(p,frag);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  motionBlur={p,b,t,w:0,h:0,a:gl.getAttribLocation(p,'aScreen'),scene:gl.getUniformLocation(p,'scene'),size:gl.getUniformLocation(p,'invSize'),strength:gl.getUniformLocation(p,'strength'),detail:gl.getUniformLocation(p,'detail')};
 }catch(e){motionBlurFailed=true;if(p)gl.deleteProgram(p);if(b)gl.deleteBuffer(b);if(t)gl.deleteTexture(t);console.warn('Motion blur disabled:',e);}
 finally{if(vert)gl.deleteShader(vert);if(frag)gl.deleteShader(frag);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);}
}
function applyMotionBlur(){
 if(state!=='running'||motionBlurFailed||speed<1)return;
 if(!motionBlur)initMotionBlur();if(!motionBlur)return;
 const m=motionBlur,w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;if(w<2||h<2)return;
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.t);
 const resized=m.w!==w||m.h!==h;
 if(resized){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);if(gl.getError()!==gl.NO_ERROR){motionBlurFailed=true;return;}m.w=w;m.h=h;}
 gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,w,h);
 if(resized&&gl.getError()!==gl.NO_ERROR){motionBlurFailed=true;return;}
 gl.useProgram(m.p);gl.disable(gl.DEPTH_TEST);gl.disableVertexAttribArray(ap);gl.disableVertexAttribArray(ac);gl.disableVertexAttribArray(aNext);
 gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.enableVertexAttribArray(m.a);gl.vertexAttribPointer(m.a,2,gl.FLOAT,false,0,0);
 gl.uniform1i(m.scene,0);gl.uniform2f(m.size,1/w,1/h);
 let amount=(2.0+clamp((speed-START_SPEED)/(MAX_SPEED-START_SPEED),0,1)*3.2+Math.abs(steer)*.65)*dpr;
 gl.uniform1f(m.strength,amount*(quality===0?.78:1));gl.uniform1f(m.detail,quality===2&&!mobile?1:0);
 gl.drawArrays(gl.TRIANGLES,0,3);
 gl.disableVertexAttribArray(m.a);gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.enableVertexAttribArray(ap);gl.enableVertexAttribArray(ac);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(ac,3,gl.FLOAT,false,24,12);
}
