/** 功能 141: 简易模板引擎 */
(function(){window.template=function(tpl,data){return tpl.replace(/\{\{(\w+)\}\}/g,function(m,key){return data[key]!==undefined?data[key]:'';});};})();
