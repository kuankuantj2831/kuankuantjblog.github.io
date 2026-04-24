/** 功能 133: Base64编解码工具 */
(function(){window.base64={encode:function(s){return btoa(unescape(encodeURIComponent(s)));},decode:function(s){try{return decodeURIComponent(escape(atob(s)));}catch(e){return null;}},encodeFile:function(file,cb){var r=new FileReader();r.onload=function(){cb(r.result);};r.readAsDataURL(file);}};})();
