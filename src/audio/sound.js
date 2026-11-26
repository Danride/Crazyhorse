'use strict';
let audioOn=true,audio,lastBeat=0,beat=0,lastNeigh=-10;
let hoofBuffer=null,horseVoiceBuffer=null,hoofSource=null,hoofGain=null,horseVoiceSource=null,horseVoiceGain=null,samplesLoading=false;
function initAudio(){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();loadHorseSamples()}catch(e){audioOn=false}}
// Procedural whinny: falling pitch, fluttering harmonics and a breathy tail.
function proceduralNeigh(volume=.65){if(!audioOn||!audio||audio.state==='closed')return;let t=audio.currentTime;if(t-lastNeigh<.65)return;lastNeigh=t;let duration=rand(.85,1.4),gain=audio.createGain(),filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1050;filter.Q.value=.7;filter.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.17*volume,t+.08);gain.gain.setValueAtTime(.12*volume,t+duration*.45);gain.gain.exponentialRampToValueAtTime(.001,t+duration);for(let i=0;i<2;i++){let osc=audio.createOscillator(),mod=audio.createOscillator(),depth=audio.createGain();osc.type=i?'triangle':'sawtooth';let mul=i?2:1;osc.frequency.setValueAtTime(360*mul,t);osc.frequency.exponentialRampToValueAtTime(760*mul,t+.17);osc.frequency.exponentialRampToValueAtTime(210*mul,t+duration);mod.frequency.value=12+i*3;depth.gain.value=35*mul;mod.connect(depth);depth.connect(osc.frequency);osc.connect(filter);mod.start(t);osc.start(t);osc.stop(t+duration+.03);mod.stop(t+duration+.03);}}
function proceduralHoof(){if(!audioOn||!audio||state!=='running'||speed<.3)return;let t=audio.currentTime,interval=Math.max(.08,.36-speed*.012-progress*.06);if(t-lastBeat<interval)return;lastBeat=t;let length=Math.floor(audio.sampleRate*.075),buf=audio.createBuffer(1,length,audio.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<length;i++)arr[i]=(Math.random()*2-1)*Math.exp(-i/(length*.17));let src=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=beat++%2?480:760;g.gain.value=.25;src.connect(f);f.connect(g);g.connect(audio.destination);src.start();}
function toggleSound(){audioOn=!audioOn;if(audioOn)initAudio();else{stopHoofLoop();stopHorseVoice();if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();}syncWalletUI();}$('sound').onclick=toggleSound;

function loadHorseSamples(){
 if(samplesLoading||!audio||typeof HORSE_AUDIO_SAMPLES==='undefined'||typeof audio.decodeAudioData!=='function')return;
 samplesLoading=true;
 for(const [name,data] of Object.entries(HORSE_AUDIO_SAMPLES)){
  try{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
   audio.decodeAudioData(bytes.buffer,buffer=>{if(name==='hooves')hoofBuffer=buffer;else horseVoiceBuffer=buffer;},()=>{});
  }catch(e){}
 }
}
function stopHoofLoop(){if(hoofSource){try{hoofSource.stop();hoofSource.disconnect();hoofGain.disconnect();}catch(e){}hoofSource=null;hoofGain=null;}}
function stopHorseVoice(){if(horseVoiceSource){try{horseVoiceSource.stop();horseVoiceSource.disconnect();horseVoiceGain.disconnect();}catch(e){}horseVoiceSource=null;horseVoiceGain=null;}}
function hoof(){
 if(!audioOn||!audio||audio.state!=='running'||state!=='running'||speed<.3){stopHoofLoop();return;}
 if(!hoofBuffer){proceduralHoof();return;}
 try{if(!hoofSource){hoofSource=audio.createBufferSource();hoofGain=audio.createGain();hoofSource.buffer=hoofBuffer;hoofSource.loop=true;hoofSource.connect(hoofGain);hoofGain.connect(audio.destination);hoofGain.gain.value=.8;hoofSource.start();}
  hoofSource.playbackRate.setTargetAtTime(.90+progress*.65,audio.currentTime,.12);
  hoofGain.gain.setTargetAtTime(jumpY>.05?.06:.8,audio.currentTime,.06);
 }catch(e){stopHoofLoop();proceduralHoof();}
}
function neigh(volume=.65){
 if(!audioOn||!audio||audio.state!=='running')return;
 if(!horseVoiceBuffer){proceduralNeigh(volume);return;}
 const t=audio.currentTime;if(t-lastNeigh<1.6)return;
 stopHorseVoice();try{const src=audio.createBufferSource(),g=audio.createGain();src.buffer=horseVoiceBuffer;g.gain.value=.65*volume;src.connect(g);g.connect(audio.destination);horseVoiceSource=src;horseVoiceGain=g;src.onended=()=>{if(horseVoiceSource===src){horseVoiceSource=null;horseVoiceGain=null;}try{src.disconnect();g.disconnect();}catch(e){}};src.start();lastNeigh=t;}catch(e){stopHorseVoice();proceduralNeigh(volume);}
}
