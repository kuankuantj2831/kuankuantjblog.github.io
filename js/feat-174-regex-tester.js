/** 功能 174: 简易正则测试器 */
(function(){window.testRegex=function(pattern,flags,text){try{var re=new RegExp(pattern,flags||'g');var matches=[];var m;while((m=re.exec(text))!==null){matches.push({match:m[0],index:m.index,groups:m.slice(1)});if(!re.global)break;}return{valid:true,matches:matches,count:matches.length};}catch(e){return{valid:false,error:e.message};}};})();
