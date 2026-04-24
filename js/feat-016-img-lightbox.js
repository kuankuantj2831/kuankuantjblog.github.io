/**
 * 功能 16: 图片点击放大预览
 * 点击文章中的图片全屏预览
 */
(function() {
    var overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.85)', zIndex: '999999',
        display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        backdropFilter: 'blur(10px)', transition: 'opacity 0.3s', opacity: '0'
    });
    var img = document.createElement('img');
    Object.assign(img.style, {
        maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain',
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', transform: 'scale(0.8)'
    });
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function() {
        img.style.transform = 'scale(0.8)';
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.style.display = 'none'; }, 300);
    });

    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('article, .article-content, .resource-scroll')) {
            img.src = e.target.src;
            overlay.style.display = 'flex';
            requestAnimationFrame(function() {
                overlay.style.opacity = '1';
                img.style.transform = 'scale(1)';
            });
        }
    });
})();
