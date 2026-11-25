'use strict';
function varyDensity(dt){densityClock-=dt;if(densityClock<=0){densityGoal=pick([rand(.08,.23),rand(.35,.58),rand(.78,1)]);densityClock=rand(7,17);}trafficDensity+=(densityGoal-trafficDensity)*(1-Math.exp(-dt*.48));}
