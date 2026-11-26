'use strict';
// VK is optional: the existing offline HTML never waits for a network request.
const VK_BRIDGE_URL='https://unpkg.com/@vkontakte/vk-bridge@2.15.0/dist/browser.min.js';
let vkClient=null,vkReady=false,vkGameReady=false,vkHidden=false,vkSwipeState=null,vkLoadStarted=false;
let vkInsets={top:0,right:0,bottom:0,left:0};
function vkLaunchDetected(search=window.location?.search||''){return /(?:^|[?&])vk_app_id=\d+(?:&|$)/.test(search)&&/(?:^|[?&])vk_platform=[^&]+/.test(search);}
function vkApplyInsets(insets){
 if(!insets||typeof insets!=='object')return;
 for(const side of ['top','right','bottom','left']){const v=Number(insets[side]);if(Number.isFinite(v))vkInsets[side]=Math.max(0,Math.min(200,v));}
 const root=document.documentElement;if(root?.style)for(const side of Object.keys(vkInsets))root.style.setProperty('--vk-inset-'+side,vkInsets[side]+'px');
}
function vkCall(method,params){
 if(!vkClient)return Promise.resolve(null);
 try{if(method!=='VKWebAppInit'&&typeof vkClient.supports==='function'&&!vkClient.supports(method))return Promise.resolve(null);
  return Promise.resolve(vkClient.send(method,params)).catch(()=>null);
 }catch(e){return Promise.resolve(null);}
}
function vkHandleEvent(event){
 const {type,data}=event?.detail||{};
 if(type==='VKWebAppUpdateConfig'||type==='VKWebAppGetConfigResult')vkApplyInsets(data?.insets);
 if(type==='VKWebAppViewHide'){
  vkHidden=true;if(vkGameReady){releaseAllControls();if(state==='running')pause();recordProgress(true);stopHoofLoop();stopHorseVoice();if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();}
 }
 if(type==='VKWebAppViewRestore'){vkHidden=false;if(vkGameReady){resize();vkUpdateNavigation();}}
}
function vkUpdateNavigation(){
 if(!vkReady||!vkGameReady)return;
 const isHome=state==='menu'&&$('mainMenu').dataset.pane==='home';
 if(isHome===vkSwipeState)return;vkSwipeState=isHome;
 vkCall('VKWebAppSetSwipeSettings',{history:isHome});
}
async function vkConnect(client){
 if(!client||typeof client.send!=='function'||typeof client.subscribe!=='function'||vkClient)return false;
 vkClient=client;try{client.subscribe(vkHandleEvent);}catch(e){vkClient=null;return false;}
 const result=await vkCall('VKWebAppInit');
 if(!result||result.result!==true){try{client.unsubscribe?.(vkHandleEvent);}catch(e){}vkClient=null;return false;}
 vkReady=true;document.documentElement?.classList?.add('vk-connected');
 vkCall('VKWebAppSetViewSettings',{status_bar_style:'light',action_bar_color:'#302219',navigation_bar_color:'#21160f'});
 const config=await vkCall('VKWebAppGetConfig');if(config?.insets)vkApplyInsets(config.insets);vkUpdateNavigation();return true;
}
function vkBoot(){
 if(vkLoadStarted||!vkLaunchDetected())return;vkLoadStarted=true;
 document.documentElement?.classList?.add('vk-embedded');
 if(window.vkBridge){void vkConnect(window.vkBridge);return;}
 const script=document.createElement('script');script.src=VK_BRIDGE_URL;script.async=true;script.onload=()=>{void vkConnect(window.vkBridge);};
 script.onerror=()=>{vkLoadStarted=false;};document.head.append(script);
}
vkBoot();
