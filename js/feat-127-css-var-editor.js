/** 功能 127: CSS变量实时编辑器 */
(function(){window.editCSSVar=function(name,value){document.documentElement.style.setProperty(name,value);};window.getCSSVars=function(){var vars={};var styles=getComputedStyle(document.documentElement);for(var i=0;i<styles.length;i++){if(styles[i].startsWith('--'))vars[styles[i]]=styles.getPropertyValue(styles[i]).trim();}return vars;};})();
