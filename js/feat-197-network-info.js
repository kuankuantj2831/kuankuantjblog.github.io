/** 功能 197: 简易网络信息 */
(function(){window.getNetworkInfo=function(){var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(!c)return{type:'unknown'};return{type:c.effectiveType||c.type||'unknown',downlink:c.downlink,rtt:c.rtt,saveData:c.saveData};};})();
