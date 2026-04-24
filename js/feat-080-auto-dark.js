/**
 * 功能 80: 自动检测系统暗色模式
 */
(function(){if(!localStorage.getItem('theme')){var dark=window.matchMedia('(prefers-color-scheme:dark)').matches;if(dark)document.documentElement.setAttribute('data-theme','dark');window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){if(!localStorage.getItem('theme'))document.documentElement.setAttribute('data-theme',e.matches?'dark':'light');});}})();
