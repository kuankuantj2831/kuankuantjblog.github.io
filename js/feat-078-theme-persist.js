/**
 * 功能 78: 自动保存主题偏好
 */
(function(){var saved=localStorage.getItem('theme');if(saved)document.documentElement.setAttribute('data-theme',saved);new MutationObserver(function(){var t=document.documentElement.getAttribute('data-theme');if(t)localStorage.setItem('theme',t);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});})();
