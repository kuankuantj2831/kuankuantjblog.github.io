/**
 * PWA 安装引导弹窗
 * 检测设备类型，引导用户将网站添加到主屏幕
 */
(function () {
    const STORAGE_KEY = 'pwa-install-dismissed';
    const SHOW_DELAY = 3000;
    const DISMISS_DAYS = 7;

    // 已经是 standalone 模式（已安装）则不显示
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;

    // 用户已关闭过且未过期
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DAYS * 86400000) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    if (!isIOS && !isAndroid) return; // 仅移动端显示

    // Android: 拦截 beforeinstallprompt
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
    });

    setTimeout(() => {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">🐱</div>
                <div class="pwa-banner-text">
                    <strong>安装「猫爬架」App</strong>
                    <span>${isIOS
                        ? '点击下方 <b>分享按钮 ⬆️</b>，选择「添加到主屏幕」'
                        : '添加到主屏幕，获得 App 般的体验'}</span>
                </div>
                <button class="pwa-banner-close" aria-label="关闭">&times;</button>
            </div>
            ${isIOS ? `<div class="pwa-ios-steps">
                <div class="pwa-step"><span class="pwa-step-num">1</span> 点击 Safari 底部 <b>⬆️ 分享</b></div>
                <div class="pwa-step"><span class="pwa-step-num">2</span> 滑动找到 <b>添加到主屏幕</b></div>
                <div class="pwa-step"><span class="pwa-step-num">3</span> 点击右上角 <b>添加</b></div>
            </div>` : `<button class="pwa-android-install">立即安装</button>`}
        `;

        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-banner{position:fixed;bottom:0;left:0;right:0;background:#fff;box-shadow:0 -4px 20px rgba(0,0,0,.15);z-index:10000;padding:16px;border-radius:16px 16px 0 0;animation:pwa-slide-up .4s ease;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
            @keyframes pwa-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
            .pwa-banner-content{display:flex;align-items:center;gap:12px;}
            .pwa-banner-icon{font-size:36px;flex-shrink:0;}
            .pwa-banner-text{flex:1;}
            .pwa-banner-text strong{display:block;font-size:15px;color:#333;margin-bottom:2px;}
            .pwa-banner-text span{font-size:13px;color:#888;line-height:1.4;}
            .pwa-banner-text b{color:#667eea;}
            .pwa-banner-close{background:none;border:none;font-size:22px;color:#ccc;cursor:pointer;padding:4px 8px;flex-shrink:0;}
            .pwa-ios-steps{display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;}
            .pwa-step{flex:1;text-align:center;font-size:12px;color:#666;line-height:1.5;}
            .pwa-step b{color:#667eea;}
            .pwa-step-num{display:inline-flex;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:11px;font-weight:700;align-items:center;justify-content:center;margin-right:4px;}
            .pwa-android-install{display:block;width:100%;margin-top:12px;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;}
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // 关闭按钮
        banner.querySelector('.pwa-banner-close').addEventListener('click', () => {
            banner.style.animation = 'pwa-slide-up .3s ease reverse';
            setTimeout(() => banner.remove(), 300);
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        });

        // Android 安装按钮
        const installBtn = banner.querySelector('.pwa-android-install');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') banner.remove();
                    deferredPrompt = null;
                } else {
                    // 回退：显示手动步骤
                    installBtn.textContent = '请点击浏览器菜单 ⋮ → 添加到主屏幕';
                    installBtn.style.background = '#f0f0f0';
                    installBtn.style.color = '#666';
                }
            });
        }
    }, SHOW_DELAY);
})();
