/**
 * 打字机效果 - Typing Effect
 * 标题和文字打字机动画效果
 */

class TypingEffect {
    constructor(options = {}) {
        this.options = {
            selector: '[data-typing]',
            speed: 100,
            delay: 0,
            cursor: '|',
            loop: false,
            loopDelay: 2000,
            ...options
        };
        
        this.elements = [];
        this.currentElement = 0;
        
        this.init();
    }
    
    init() {
        this.elements = document.querySelectorAll(this.options.selector);
        if (this.elements.length === 0) return;
        
        this.elements.forEach(el => {
            this.setupElement(el);
        });
        
        this.injectStyles();
        console.log('[打字机效果] 系统已初始化');
    }
    
    setupElement(element) {
        const text = element.textContent;
        element.textContent = '';
        element.dataset.text = text;
        element.classList.add('typing-text');
        
        // 创建光标
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.textContent = this.options.cursor;
        element.appendChild(cursor);
        
        // 延迟后开始打字
        setTimeout(() => {
            this.typeText(element, text);
        }, this.options.delay);
    }
    
    typeText(element, text, index = 0) {
        if (index < text.length) {
            const cursor = element.querySelector('.typing-cursor');
            const char = document.createTextNode(text.charAt(index));
            element.insertBefore(char, cursor);
            
            setTimeout(() => {
                this.typeText(element, text, index + 1);
            }, this.options.speed);
        } else {
            // 打字完成
            element.classList.add('typing-complete');
            
            if (this.options.loop) {
                setTimeout(() => {
                    this.deleteText(element, text);
                }, this.options.loopDelay);
            }
        }
    }
    
    deleteText(element, text) {
        const cursor = element.querySelector('.typing-cursor');
        
        if (element.childNodes.length > 1) {
            element.removeChild(element.childNodes[element.childNodes.length - 2]);
            
            setTimeout(() => {
                this.deleteText(element, text);
            }, this.options.speed / 2);
        } else {
            // 删除完成，重新开始
            setTimeout(() => {
                element.classList.remove('typing-complete');
                this.typeText(element, text);
            }, 500);
        }
    }
    
    injectStyles() {
        if (document.getElementById('typing-effect-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'typing-effect-styles';
        style.textContent = `
            .typing-text {
                display: inline-block;
            }
            
            .typing-cursor {
                display: inline-block;
                animation: typingCursor 1s infinite;
                margin-left: 2px;
            }
            
            .typing-complete .typing-cursor {
                animation: typingBlink 1s infinite;
            }
            
            @keyframes typingCursor {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            
            @keyframes typingBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.typingEffect = new TypingEffect();
    });
} else {
    window.typingEffect = new TypingEffect();
}

export default TypingEffect;
