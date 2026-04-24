/** 功能 118: 随机颜色生成器 */
(function(){window.randomColor=function(){return'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');};window.randomGradient=function(){return'linear-gradient(135deg,'+window.randomColor()+','+window.randomColor()+')';};window.randomPalette=function(n){n=n||5;var colors=[];for(var i=0;i<n;i++)colors.push(window.randomColor());return colors;};})();
