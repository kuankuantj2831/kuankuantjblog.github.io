/**
 * 彩带特效 - Confetti Effect
 * 庆祝、互动彩带动画效果
 */

class ConfettiEffect {
    constructor(options = {}) {
        this.options = {
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
            shapes: ['square', 'circle'],
            gravity: 0.8,
            drag: 0.95,
            terminalVelocity: 6,
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.injectStyles();
        
        // 自动触发事件监听
        this.bindAutoTriggers();
        
        console.log('[彩带特效] 系统已初始化');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'confetti-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 99999;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        document.body.appendChild(this.canvas);
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindAutoTriggers() {
        // 阅读完成触发
        window.addEventListener('reading:complete', () => {
            this.explode({
                origin: { x: 0.5, y: 0.3 },
                particleCount: 150
            });
        });
        
        // 签到成功触发
        window.addEventListener('checkin:success', () => {
            this.explode({
                origin: { x: 0.5, y: 0.5 },
                particleCount: 200
            });
        });
    }
    
    createParticle(x, y) {
        const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
        const shape = this.options.shapes[Math.floor(Math.random() * this.options.shapes.length)];
        
        return {
            x,
            y,
            color,
            shape,
            size: Math.random() * 8 + 4,
            vx: (Math.random() - 0.5) * this.options.spread,
            vy: (Math.random() - 1) * this.options.spread * 0.8 - 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        };
    }
    
    explode(customOptions = {}) {
        const options = { ...this.options, ...customOptions };
        const x = options.origin.x * this.canvas.width;
        const y = options.origin.y * this.canvas.height;
        
        for (let i = 0; i < options.particleCount; i++) {
            this.particles.push(this.createParticle(x, y));
        }
        
        if (!this.isActive) {
            this.startAnimation();
        }
    }
    
    startAnimation() {
        this.isActive = true;
        this.animate();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => {
            // 更新位置
            particle.vx *= this.options.drag;
            particle.vy = Math.min(particle.vy + this.options.gravity, this.options.terminalVelocity);
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            
            // 淡出
            particle.opacity -= 0.005;
            
            if (particle.opacity <= 0) return false;
            
            // 绘制
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate((particle.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            
            if (particle.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            }
            
            this.ctx.restore();
            
            return true;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.isActive = false;
        }
    }
    
    injectStyles() {
        if (document.getElementById('confetti-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.confettiEffect = new ConfettiEffect();
    });
} else {
    window.confettiEffect = new ConfettiEffect();
}

export default ConfettiEffect;
