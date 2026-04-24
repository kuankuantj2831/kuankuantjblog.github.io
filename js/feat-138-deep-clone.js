/** 功能 138: 深拷贝工具 */
(function(){window.deepClone=function(obj){if(obj===null||typeof obj!=='object')return obj;if(obj instanceof Date)return new Date(obj);if(obj instanceof Array)return obj.map(function(item){return window.deepClone(item);});var clone={};Object.keys(obj).forEach(function(key){clone[key]=window.deepClone(obj[key]);});return clone;};})();
