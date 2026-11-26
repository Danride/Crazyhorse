'use strict';
function shout(c){if(c.shouted||!speechAllowed(3)||!say(c,true))return;c.shouted=true;if(audioOn&&typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined'){try{if(!speechSynthesis.speaking){let u=new SpeechSynthesisUtterance(c.words);u.lang='ru-RU';u.rate=1.25;u.pitch=.85;u.volume=.8;speechSynthesis.speak(u);}}catch(e){}}}
