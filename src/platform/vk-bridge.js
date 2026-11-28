'use strict';
// Local vendored SDK is loaded in the head, before any large game resources.
let vkClient=null,vkReady=false,vkGameReady=false,vkHidden=false,vkSwipeState=null,vkLoadStarted=false;
let vkInsets={top:0,right:0,bottom:0,left:0};
function vkLaunchDetected(search=window.location?.search||''){
 return /(?:^|[?&#])vk_app_id=\d+(?:&|$)/.test(search)||/(?:^|[?&#])vk_platform=[^&]+/.test(search);
}
function vkEnvironment(){
 if(vkLaunchDetected()||vkLaunchDetected(window.location?.hash||''))return true;
 if(window.AndroidBridge||window.webkit?.messageHandlers?.VKWebAppClose||window.ReactNativeWebView)return true;
 try{return window.parent!==window&&/^https:\/\/([a-z0-9-]+\.)*(vk\.com|vk\.ru|vk-apps\.com)(?:\/|$)/i.test(document.referrer||'');}catch(e){return false;}
}
function vkApplyInsets(insets){
 if(!insets||typeof insets!=='object')return;
 for(const side of ['top','right','bottom','left']){const v=Number(insets[side]);if(Number.isFinite(v))vkInsets[side]=Math.max(0,Math.min(200,v));}
 const root=document.documentElement;if(root?.style)for(const side of Object.keys(vkInsets))root.style.setProperty('--vk-inset-'+side,vkInsets[side]+'px');
}
function vkStatus(msg){if(typeof startupBridgeStatus==='function')startupBridgeStatus(msg);}
function vkCall(method,params={}){
 if(!vkClient)return Promise.resolve(null);
 try{return Promise.resolve(vkClient.send(method,params)).catch(()=>null);}catch(e){return Promise.resolve(null);}
}
function vkHandleEvent(event){
 const {type,data}=event?.detail||{};
 if(type==='VKWebAppUpdateConfig'||type==='VKWebAppGetConfigResult')vkApplyInsets(data?.insets);
 if(type==='VKWebAppViewHide'){
  vkHidden=vkGameReady&&(state==='running'||state==='intro');if(vkGameReady){releaseAllControls();if(state==='running')pause();recordProgress(true);if(typeof saveFlush==='function')saveFlush();stopHoofLoop();stopHorseVoice();if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();}
 }
 if(type==='VKWebAppViewRestore'){vkHidden=false;if(vkGameReady){resize();vkUpdateNavigation();if(typeof saveRefresh==='function')saveRefresh();}}
}
function vkUpdateNavigation(){
 if(!vkReady||!vkGameReady)return;
 const isHome=state==='menu'&&$('mainMenu').dataset.pane==='home';
 if(isHome===vkSwipeState)return;vkSwipeState=isHome;
 vkCall('VKWebAppSetSwipeSettings',{history:isHome});
}
async function vkConnect(client){
 if(!client||typeof client.send!=='function'||typeof client.subscribe!=='function'||vkClient)return false;
 vkClient=client;try{client.subscribe(vkHandleEvent);}catch(e){vkClient=null;vkStatus('VK Bridge: ошибка подписки');return false;}
 vkStatus('VK Bridge: отправлен VKWebAppInit');
 const timer=setTimeout(()=>{if(!vkReady)vkStatus('VK Bridge: клиент не ответил на VKWebAppInit');},8000);
 const result=await vkCall('VKWebAppInit',{});
 clearTimeout(timer);
 if(!result||result.result!==true){vkStatus('VK Bridge: ошибка инициализации');try{client.unsubscribe?.(vkHandleEvent);}catch(e){}vkClient=null;return false;}
 vkReady=true;vkStatus('VK Bridge: подключён');document.documentElement?.classList?.add('vk-connected');
 vkCall('VKWebAppSetViewSettings',{status_bar_style:'light',action_bar_color:'#302219',navigation_bar_color:'#21160f'});
 vkUpdateNavigation();vkCall('VKWebAppGetConfig').then(config=>{if(config?.insets)vkApplyInsets(config.insets);});return true;
}
function vkBoot(){
 if(vkLoadStarted)return;
 if(!vkEnvironment()){vkStatus('Браузерный режим');return;}
 vkLoadStarted=true;document.documentElement?.classList?.add('vk-embedded');
 if(window.vkBridge){void vkConnect(window.vkBridge);return;}
 vkStatus('VK Bridge: локальный SDK не загружен');
}
vkBoot();
