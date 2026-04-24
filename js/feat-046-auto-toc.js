/**
 * 功能 46: 自动目录生成
 * 为文章页面自动生成目录导航
 */
(function() {
    function init() {
        var article = document.querySelector('article, .article-content, .post-content');
        if (!article) return;
        var headings = article.querySelectorAll('h2, h3, h4');
        if (headings.length < 3) return;

        var toc = document.createElement('div');
        Object.assign(toc.style, {
            position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)',
            maxHeight: '60vh', overflowY: 'auto', padding: '16px', background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: '9990',
            fontSize: '12px', maxWidth: '200px', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.05)', display: 'none'
        });
        if (window.innerWidth > 1200) toc.style.display = 'block';

        var title = document.createElement('div');
        title.textContent = '📑 目录';
        title.style.cssText = 'font-weight:700;margin-bottom:10px;color:#667eea;';
        toc.appendChild(title);

        headings.forEach(function(h, i) {
            h.id = h.id || 'heading-' + i;
            var link = document.createElement('a');
            link.href = '#' + h.id;
            link.textContent = h.textContent;
            var indent = (parseInt(h.tagName[1]) - 2) * 12;
            link.style.cssText = 'display:block;padding:4px 0;color:#666;text-decoration:none;padding-left:' + indent + 'px;transition:color 0.2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            link.addEventListener('mouseenter', function() { link.style.color = '#667eea'; });
            link.addEventListener('mouseleave', function() { link.style.color = '#666'; });
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById(h.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            toc.appendChild(link);
        });
        document.body.appendChild(toc);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
