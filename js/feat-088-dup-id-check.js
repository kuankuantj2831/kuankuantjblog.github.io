/**
 * 功能 88: 自动检测重复ID
 */
(function(){window.addEventListener('load',function(){var ids={};document.querySelectorAll('[id]').forEach(function(el){if(ids[el.id])console.warn('[重复ID] #'+el.id);ids[el.id]=true;});});})();
