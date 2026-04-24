/** 功能 196: 简易电池状态 */
(function(){window.getBattery=function(){if(!navigator.getBattery)return Promise.reject('不支持');return navigator.getBattery().then(function(b){return{level:Math.round(b.level*100),charging:b.charging,chargingTime:b.chargingTime,dischargingTime:b.dischargingTime};});};})();
