/** 功能 193: 简易地理位置 */
(function(){window.getLocation=function(){return new Promise(function(resolve,reject){if(!navigator.geolocation)return reject('不支持地理位置');navigator.geolocation.getCurrentPosition(function(pos){resolve({lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy});},function(err){reject(err.message);},{enableHighAccuracy:true,timeout:10000});});};})();
