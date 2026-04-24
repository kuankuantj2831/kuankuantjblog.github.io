/** 功能 167: 简易骰子 */
(function(){window.rollDice=function(sides,count){sides=sides||6;count=count||1;var results=[];for(var i=0;i<count;i++)results.push(Math.floor(Math.random()*sides)+1);return count===1?results[0]:results;};})();
