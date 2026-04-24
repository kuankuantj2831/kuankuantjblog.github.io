/**
 * 功能 84: 页面内容变化监听
 */
(function(){var observer=new MutationObserver(function(mutations){var added=0,removed=0;mutations.forEach(function(m){added+=m.addedNodes.length;removed+=m.removedNodes.length;});if(added>10||removed>10)console.log('[DOM变化] +'+added+' -'+removed+'节点');});observer.observe(document.body,{childList:true,subtree:true});})();
