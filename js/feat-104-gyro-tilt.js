/**
 * 功能 104: 页面倾斜效果（陀螺仪）
 */
(function(){if(!window.DeviceOrientationEvent)return;var wrapper=document.querySelector('.chinese-style-wrapper,main,body');window.addEventListener('deviceorientation',function(e){if(e.gamma===null)return;var x=Math.max(-15,Math.min(15,e.gamma));var y=Math.max(-15,Math.min(15,e.beta-45));wrapper.style.transform='perspective(1000px) rotateY('+x*0.3+'deg) rotateX('+(-y*0.3)+'deg)';wrapper.style.transition='transform 0.1s ease-out';});})();
