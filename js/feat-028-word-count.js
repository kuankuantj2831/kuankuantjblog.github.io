/**
 * 功能 28: 文章字数统计
 * 自动统计文章内容的字数和预计阅读时间
 */
(function() {
    function init() {
        var article = document.querySelector('article, .article-content, .post-content');
        if (!article) return;
        var text = article.textContent || '';
        var chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        var english = (text.match(/[a-zA-Z]+/g) || []).length;
        var total = chinese + english;
        var minutes = Math.max(1, Math.ceil(total / 400));
        var badge = document.createElement('div');
        Object.assign(badge.style, {
            display: 'inline-flex', gap: '12px', padding: '6px 16px', margin: '10px 0',
            background: 'rgba(102,126,234,0.08)', borderRadius: '20px', fontSize: '12px', color: '#667eea'
        });
        badge.innerHTML = '📝 ' + total + ' 字 &nbsp;|&nbsp; ⏱ 约 ' + minutes + ' 分钟';
        var header = article.querySelector('h1, .article-header, .post-title');
        if (header) header.parentNode.insertBefore(badge, header.nextSibling);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
