/** 功能 121: 通知权限请求 */
(function(){window.requestNotifyPermission=function(){if(!('Notification' in window))return Promise.reject('不支持');if(Notification.permission==='granted')return Promise.resolve('已授权');return Notification.requestPermission();};window.sendNotification=function(title,body){if(Notification.permission==='granted')new Notification(title,{body:body,icon:'/favicon.ico'});};})();
