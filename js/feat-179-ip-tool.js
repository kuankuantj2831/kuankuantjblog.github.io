/** 功能 179: 简易IP地址工具 */
(function(){window.getPublicIP=function(){return fetch('https://api.ipify.org?format=json').then(function(r){return r.json();}).then(function(d){return d.ip;});};window.isValidIP=function(ip){return/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)&&ip.split('.').every(function(n){return parseInt(n)>=0&&parseInt(n)<=255;});};})();
