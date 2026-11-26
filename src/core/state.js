'use strict';
const START_SPEED=80/3.6, MAX_SPEED=350/3.6, SPEECH_SECONDS=5, MAX_SPEED_PCT=350/80*100;
function speedPercentAt(meters){return 100+Math.min(MAX_SPEED_PCT-100,Math.max(0,Math.floor(meters/10)));}
// Gameplay tuning: keep the existing traffic variation and steering limits.
const TRAFFIC_MULTIPLIER=2.0, CITY_TRAFFIC_MULTIPLIER=1.25*.75, CITY_TRAFFIC_REDUCTION=.75;
let prevJumpY=0,prevPlayerX=0,prevDistance=0,prevPlayerYaw=0,impactSlip=0,impactPush=0;
let distance=0, speed=START_SPEED, px=laneX(2), vx=0, nitro=100, health=100, passes=0, traffic=[], state='ready', invuln=0, hitFlash=0, steer=0, boost=false, shake=0, msgTime=0, best=0, wallet=0, progress=0, pace=1, nowTime=0, obstacles=[], particles=[], nextObstacle=0, spawnClock=0, rearClock=0, jumpY=0, jumpV=0, jumpHeld=false, jumps=0, dodged=0, crashes=0, playerYaw=0, gallopLock=false, introLeft=0, lossReason="",eventClock=10,eventLeft=0,eventName="",neighClock=4,sideTouches=0, coins=[], nextCoin=45, coinCount=0;let holes=[],fallingTrees=[],crossers=[],eventHouses=[],brokenFences=[],speechLeft=0;let crashTalk=[],lastCrashLine="",crashLine="";let recordSaved=0;try{best=Math.max(0,Math.round((Number(localStorage.getItem('voxel-kings-road-rabid-best'))||0)*1000));recordSaved=best;wallet=Math.max(0,Number(localStorage.getItem('kings-road-wallet'))||0);}catch(e){}$('best').textContent=best;
