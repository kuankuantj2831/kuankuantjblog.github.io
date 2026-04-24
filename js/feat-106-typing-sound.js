/**
 * 功能 106: 打字音效
 */
(function(){var audioCtx=null;document.addEventListener('keydown',function(e){if(e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'&&!e.target.isContentEditable)return;if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var osc=audioCtx.createOscillator();var gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.frequency.value=800+Math.random()*400;gain.gain.value=0.015;osc.start();osc.stop(audioCtx.currentTime+0.03);});})();
