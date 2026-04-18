/**
 * 打字机标题效果
 * 首页标题逐字打出
 */
class TypewriterTitle {
    constructor(options = {}) {
        this.selector = options.selector || '#heroTitle';
        this.subtitleSelector = options.subtitleSelector || '#heroSub';
        this.speed = options.speed || 100;
        this.cursor = options.cursor !== false;
        this.deleted = false;
    }

    init() {
        const el = document.querySelector(this.selector);
        if (!el) return;

        this.originalText = el.textContent;
        el.textContent = '';
        el.style.minHeight = '1.2em';

        if (this.cursor) {
            this.cursorEl = document.createElement('span');
            this.cursorEl.textContent = '|';
            this.cursorEl.style.cssText = 'animation: blink 1s infinite;';
            const style = document.createElement('style');
            style.textContent = '@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}';
            document.head.appendChild(style);
        }

        this.typeText(el, this.originalText, 0, () => {
            if (this.subtitleSelector) {
                const sub = document.querySelector(this.subtitleSelector);
                if (sub) {
                    const subText = sub.textContent;
                    sub.textContent = '';
                    setTimeout(() => this.typeText(sub, subText, 0), 500);
                }
            }
        });
    }

    typeText(el, text, index, callback) {
        if (index <= text.length) {
            el.textContent = text.substring(0, index);
            if (this.cursor && this.cursorEl) {
                el.appendChild(this.cursorEl);
            }
            setTimeout(() => this.typeText(el, text, index + 1, callback), this.speed);
        } else if (callback) {
            callback();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tw = new TypewriterTitle();
    tw.init();
});
export default TypewriterTitle;
