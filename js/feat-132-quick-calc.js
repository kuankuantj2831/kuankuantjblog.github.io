/** 功能 132: 简易计算器 */
(function(){window.quickCalc=function(expr){try{var result=Function('"use strict";return('+expr.replace(/[^0-9+\-*/().%\s]/g,'')+')')();return result;}catch(e){return NaN;}};})();
