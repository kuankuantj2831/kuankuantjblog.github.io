/** 功能 173: 简易JSON格式化 */
(function(){window.formatJSON=function(str,indent){indent=indent||2;try{return JSON.stringify(JSON.parse(str),null,indent);}catch(e){return'Invalid JSON: '+e.message;}};window.minifyJSON=function(str){try{return JSON.stringify(JSON.parse(str));}catch(e){return str;}};})();
