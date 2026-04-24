/**
 * 功能 44: 文本高亮搜索
 * Ctrl+F 增强：高亮所有匹配文本
 */
(function() {
    window.highlightText = function(keyword) {
        // 先清除旧高亮
        document.querySelectorAll('.text-highlight').forEach(function(el) {
            el.outerHTML = el.textContent;
        });
        if (!keyword) return;
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var nodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                nodes.push(walker.currentNode);
            }
        }
        nodes.forEach(function(node) {
            var parent = node.parentNode;
            if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;
            var regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            var span = document.createElement('span');
            span.innerHTML = node.textContent.replace(regex, '<mark class="text-highlight" style="background:#feca57;padding:1px 3px;border-radius:3px;">$1</mark>');
            parent.replaceChild(span, node);
        });
    };
})();
