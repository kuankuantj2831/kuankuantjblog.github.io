/** 功能 186: 简易文件大小格式化 */
(function(){window.formatFileSize=function(bytes){if(bytes===0)return'0 B';var k=1024;var sizes=['B','KB','MB','GB','TB'];var i=Math.floor(Math.log(bytes)/Math.log(k));return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i];};})();
