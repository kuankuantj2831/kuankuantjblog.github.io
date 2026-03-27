/**
 * 鼠标特效 - Mouse Effect
 * 跟随鼠标的炫酷特效，如粒子、波纹等
 */

class MouseEffect {
    constructor(options = {}) {
        this.options = {
            type: 'trail', // trail, ripple, particle
            color: '#667eea',
            size: 8,
            fadeSpeed: 0.95,
            maxParticles: 20,
            ...options
        };
        
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.isActive = true;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.bindEvents();
        this.animate();
        this.injectStyles();
        
        console.log('[鼠标特效] 系统已初始化');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'mouse-effect-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        document.body.appendChild(this.canvas);
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindEvents() {
        let lastX = 0;
        let lastY = 0;
        let throttle = false;
        
        document.addEventListener('mousemove', (e) => {
            if (throttle) return;
            
            const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
            if (dist > 10) {
                this.createParticle(e.clientX, e.clientY);
                lastX = e.clientX;
                lastY = e.clientY;
                
                throttle = true;
                setTimeout(() => throttle = false, 30);
            }
        });
        
        // 点击特效
        document.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY);
        });
    }
    
    createParticle(x, y) {
        if (this.particles.length >= this.options.maxParticles) return;
        
        this.particles.push({
            x,
            y,
            size: this.options.size,
            color: this.options.color,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            alpha: 1,
            life: 1
        });
    }
    
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'mouse-ripple';
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${this.options.color};
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.5;
            pointer-events: none;
            z-index: 9999;
            animation: rippleExpand 0.6s ease-out forwards;
        `;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha *= this.options.fadeSpeed;
            p.life -= 0.02;
            
            if (p.life <= 0 || p.alpha < 0.01) return false;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fill();
            
            return true;
        });
        
        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
    
    injectStyles() {
        if (document.getElementById('mouse-effect-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mouse-effect-styles';
        style.textContent = `
            .mouse-effect-canvas {
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 9998;
            }
            
            @keyframes rippleExpand {
                to {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mouseEffect = new MouseEffect();
    });
} else {
    window.mouseEffect = new MouseEffect();
}

export default MouseEffect;
