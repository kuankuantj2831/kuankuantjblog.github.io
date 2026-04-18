/**
 * 复制版权提示
 * 复制内容时自动添加版权信息
 */
class CopyNotice {
    constructor(options = {}) {
        this.siteName = options.siteName || 'Hakimi 的猫爬架';
        this.siteUrl = options.siteUrl || window.location.origin;
        this.minLength = options.minLength || 30;
        this.noticeText = options.noticeText || '转载请注明来源：';
    }

    init() {
        document.addEventListener('copy', (e) => this.handleCopy(e));
    }

    handleCopy(e) {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length < this.minLength) return;

        const copied = `${text}\n\n---\n${this.noticeText}${this.siteName}\n${window.location.href}`;

        e.clipboardData.setData('text/plain', copied);
        e.preventDefault();
        this.showToast();
    }

    showToast() {
        let toast = document.getElementById('copyToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copyToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 24px;
                border-radius: 25px;
                font-size: 13px;
                z-index: 99999;
                opacity: 0;
                transition: all 0.3s;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = '📋 已复制，已自动添加版权信息';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cn = new CopyNotice();
    cn.init();
});
export default CopyNotice;
