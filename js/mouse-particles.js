/**
 * 鼠标粒子轨迹
 * 鼠标移动时产生彩色粒子
 */
class MouseParticles {
    constructor(options = {}) {
        this.colors = options.colors || ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4','#45b7d1'];
        this.maxParticles = options.maxParticles || 30;
        this.particles = [];
        this.lastX = 0;
        this.lastY = 0;
        this.enabled = localStorage.getItem('mouse_particles') !== 'false';
    }

    init() {
        if (!this.enabled) return;
        this.bindEvents();
    }

    bindEvents() {
        let throttle = false;
        document.addEventListener('mousemove', (e) => {
            if (throttle) return;
            throttle = true;
            setTimeout(() => throttle = false, 30);

            const dist = Math.hypot(e.clientX - this.lastX, e.clientY - this.lastY);
            if (dist < 15) return;

            this.createParticle(e.clientX, e.clientY);
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        document.addEventListener('click', (e) => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => this.createParticle(e.clientX, e.clientY, true), i * 30);
            }
        });
    }

    createParticle(x, y, isBurst = false) {
        if (this.particles.length >= this.maxParticles) {
            const old = this.particles.shift();
            if (old && old.el) old.el.remove();
        }

        const el = document.createElement('div');
        const size = isBurst ? Math.random() * 6 + 4 : Math.random() * 4 + 2;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        el.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.8;
        `;
        document.body.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const speed = isBurst ? Math.random() * 4 + 2 : Math.random() * 1.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        let opacity = 0.8;
        let posX = x;
        let posY = y;

        const particle = { el, x, y, vx, vy, opacity, life: 1 };
        this.particles.push(particle);

        const animate = () => {
            posX += vx;
            posY += vy;
            opacity -= 0.02;
            if (opacity <= 0) {
                el.remove();
                const idx = this.particles.indexOf(particle);
                if (idx > -1) this.particles.splice(idx, 1);
                return;
            }
            el.style.left = `${posX}px`;
            el.style.top = `${posY}px`;
            el.style.opacity = opacity;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mp = new MouseParticles();
    mp.init();
});
