/**
 * 功能 12: 页面加载骨架屏
 * 在内容加载前显示骨架屏占位动画
 */
(function() {
    var style = document.createElement('style');
    style.textContent = '@keyframes skeletonShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.skeleton-block{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:skeletonShimmer 1.5s infinite;border-radius:8px;margin-bottom:12px}.skeleton-line{height:16px}.skeleton-title{height:28px;width:60%}.skeleton-avatar{width:48px;height:48px;border-radius:50%}';
    document.head.appendChild(style);
    window.createSkeleton = function(container, count) {
        count = count || 3;
        for (var i = 0; i < count; i++) {
            var card = document.createElement('div');
            card.style.cssText = 'padding:20px;background:#fff;border-radius:12px;margin-bottom:16px;';
            card.innerHTML = '<div class="skeleton-block skeleton-title"></div><div class="skeleton-block skeleton-line" style="width:90%"></div><div class="skeleton-block skeleton-line" style="width:75%"></div><div class="skeleton-block skeleton-line" style="width:85%"></div>';
            container.appendChild(card);
        }
    };
    window.removeSkeleton = function(container) {
        container.querySelectorAll('.skeleton-block').forEach(function(el) {
            el.parentElement.remove();
        });
    };
})();
