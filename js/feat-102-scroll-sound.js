/**
 * 功能 102: 页面滚动音效
 */
(function(){var audioCtx=null;var lastScroll=0;window.addEventListener('scroll',function(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var dy=Math.abs(window.scrollY-lastScroll);if(dy>100){var osc=audioCtx.createOscillator();var gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.frequency.value=200+Math.min(dy,500);gain.gain.value=0.02;osc.start();osc.stop(audioCtx.currentTime+0.05);lastScroll=window.scrollY;}},{passive:true});})();
