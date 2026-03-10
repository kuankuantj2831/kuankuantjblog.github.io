/**
 * CDN 多源回退加载器 v2
 * 主 CDN 挂掉时自动切换备用 CDN，支持 JS 和 CSS
 * 源优先级：BootCDN(国内) > jsdelivr > npmmirror > unpkg > cdnjs
 * 
 * 用法：在 <head> 中引入此脚本，然后用 cdnLoad() 加载资源
 * <script src="/js/cdn-fallback.js"></script>
 * <script>
 *   cdnLoad('jquery@2.0.3/dist/jquery.min.js', 'js', {defer:true});
 *   cdnLoad('@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css', 'css');
 * </script>
 */
(function () {
    'use strict';

    // jsdelivr npm / unpkg / npmmirror 共用同一路径格式
    var NPM_CDNS = [
        'https://cdn.jsdelivr.net/npm/',
        'https://registry.npmmirror.com/',
        'https://unpkg.com/'
    ];

    // BootCDN + cdnjs 路径格式相同（/ajax/libs/库名/版本/文件）
    var ALTCDN_MAP = {
        'jquery@2.0.3/dist/jquery.min.js': [
            'https://cdn.bootcdn.net/ajax/libs/jquery/2.0.3/jquery.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js'
        ],
        '@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js': [
            'https://cdn.bootcdn.net/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js'
        ],
        '@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css': [
            'https://cdn.bootcdn.net/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css'
        ],
        'vanilla-lazyload@17.8.8/dist/lazyload.min.js': [
            'https://cdn.bootcdn.net/ajax/libs/vanilla-lazyload/17.8.8/lazyload.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/17.8.8/lazyload.min.js'
        ],
        'tocbot@4.25.0/dist/tocbot.min.js': [
            'https://cdn.bootcdn.net/ajax/libs/tocbot/4.25.0/tocbot.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.25.0/tocbot.min.js'
        ],
        'justifiedGallery@3.8.1/dist/js/jquery.justifiedGallery.min.js': [
            'https://cdn.bootcdn.net/ajax/libs/justifiedGallery/3.8.1/js/jquery.justifiedGallery.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/justifiedGallery/3.8.1/js/jquery.justifiedGallery.min.js'
        ]
    };

    function buildUrls(npmPath) {
        var urls = [];
        // BootCDN 优先（国内最快）
        if (ALTCDN_MAP[npmPath]) urls.push(ALTCDN_MAP[npmPath][0]);
        // 然后 jsdelivr / npmmirror / unpkg
        for (var i = 0; i < NPM_CDNS.length; i++) {
            urls.push(NPM_CDNS[i] + npmPath);
        }
        // 最后 cdnjs 兜底
        if (ALTCDN_MAP[npmPath] && ALTCDN_MAP[npmPath][1]) urls.push(ALTCDN_MAP[npmPath][1]);
        return urls;
    }

    function tryLoad(urls, idx, type, opts) {
        if (idx >= urls.length) {
            console.error('[CDN] 全部失败:', urls[0]);
            return;
        }
        var url = urls[idx];
        var el;
        if (type === 'css') {
            el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = url;
        } else {
            el = document.createElement('script');
            el.src = url;
            if (opts.defer) el.defer = true;
        }
        el.onerror = function () {
            console.warn('[CDN] 失败，切换备用:', url);
            if (el.parentNode) el.parentNode.removeChild(el);
            tryLoad(urls, idx + 1, type, opts);
        };
        if (opts.onload) el.onload = opts.onload;
        document.head.appendChild(el);
    }

    window.cdnLoad = function (npmPath, type, opts) {
        tryLoad(buildUrls(npmPath), 0, type || 'js', opts || {});
    };
})();
