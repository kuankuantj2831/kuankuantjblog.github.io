/**
 * Apple 风格丝滑动画系统 - 核心控制库
 * 包含：滚动触发、磁吸按钮、涟漪、视差、页面过渡、文字动画
 */
(function () {
  'use strict';

  const AppleAnimations = {
    options: {
      scrollThreshold: 0.15,
      scrollRootMargin: '0px 0px -50px 0px',
      magneticStrength: 0.3,
      parallaxStrength: 0.5,
      reducedMotion: false
    },

    init() {
      this.detectReducedMotion();
      this.initScrollAnimations();
      this.initMagneticButtons();
      this.initRippleEffect();
      this.initParallax();
      this.initNavScroll();
      this.initSmoothScroll();
      this.initPageTransition();
      this.initScrollProgress();
      this.initSpotlight();
      this.initCharReveal();
      this.initAccordion();
      this.initCountUp();
      console.log('[AppleAnimations] 🍎 丝滑动画系统已启动');
    },

    detectReducedMotion() {
      this.options.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.options.reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      }
    },

    // ===== 1. 滚动触发动画 =====
    initScrollAnimations() {
      if (this.options.reducedMotion) {
        document.querySelectorAll('[data-animate]').forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            // 可选：只触发一次动画
            if (entry.target.dataset.once !== 'false') {
              observer.unobserve(entry.target);
            }
          } else if (entry.target.dataset.once === 'false') {
            entry.target.classList.remove('animated');
          }
        });
      }, {
        threshold: this.options.scrollThreshold,
        rootMargin: this.options.scrollRootMargin
      });

      document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    },

    // ===== 2. 磁吸按钮 =====
    initMagneticButtons() {
      if (this.options.reducedMotion || window.matchMedia('(hover: none)').matches) return;

      document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate(${x * this.options.magneticStrength}px, ${y * this.options.magneticStrength}px)`;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
        });
      });
    },

    // ===== 3. 涟漪效果 =====
    initRippleEffect() {
      document.querySelectorAll('.ripple, button, .btn, [data-ripple]').forEach(el => {
        if (el.dataset.ripple === 'false') return;
        el.addEventListener('click', (e) => {
          const ripple = document.createElement('span');
          ripple.className = 'ripple-effect';
          const rect = el.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
          ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
          el.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });
    },

    // ===== 4. 视差效果 =====
    initParallax() {
      if (this.options.reducedMotion) return;

      const parallaxElements = document.querySelectorAll('[data-parallax]');
      if (!parallaxElements.length) return;

      let ticking = false;
      const updateParallax = () => {
        parallaxElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const speed = parseFloat(el.dataset.parallax) || this.options.parallaxStrength;
          const scrollY = window.scrollY;
          const offset = (scrollY - rect.top + window.innerHeight) * speed * 0.1;
          el.style.transform = `translateY(${offset}px)`;
        });
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    },

    // ===== 5. 导航栏滚动 =====
    initNavScroll() {
      const navs = document.querySelectorAll('.nav-glass');
      if (!navs.length) return;

      let lastScroll = 0;
      let ticking = false;

      const updateNav = () => {
        const currentScroll = window.scrollY;
        navs.forEach(nav => {
          nav.classList.toggle('scrolled', currentScroll > 50);
        });
        lastScroll = currentScroll;
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateNav);
          ticking = true;
        }
      }, { passive: true });
    },

    // ===== 6. 平滑滚动锚点 =====
    initSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({
              behavior: this.options.reducedMotion ? 'auto' : 'smooth',
              block: 'start'
            });
          }
        });
      });
    },

    // ===== 7. 页面过渡 =====
    initPageTransition() {
      const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript"]):not([target="_blank"])');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          const url = link.getAttribute('href');
          if (!url || url.startsWith('http') && !url.includes(location.hostname)) return;

          e.preventDefault();
          const overlay = document.querySelector('.page-transition-overlay') || this.createTransitionOverlay();
          overlay.classList.add('active');

          setTimeout(() => {
            window.location.href = url;
          }, 400);
        });
      });
    },

    createTransitionOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'page-transition-overlay';
      document.body.appendChild(overlay);
      return overlay;
    },

    // ===== 8. 滚动进度条 =====
    initScrollProgress() {
      if (document.querySelector('.scroll-progress')) return;
      const bar = document.createElement('div');
      bar.className = 'scroll-progress';
      bar.style.width = '0%';
      document.body.appendChild(bar);

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = progress + '%';
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    // ===== 9. 聚光灯效果 =====
    initSpotlight() {
      if (window.matchMedia('(hover: none)').matches) return;

      document.querySelectorAll('.spotlight').forEach(el => {
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          el.style.setProperty('--spotlight-x', x + 'px');
          el.style.setProperty('--spotlight-y', y + 'px');
          if (el.querySelector('::before')) {
            el.style.cssText += `--spotlight-x:${x}px;--spotlight-y:${y}px;`;
          }
        });
      });

      // 用 JS 动态设置 spotlight 位置
      const style = document.createElement('style');
      style.textContent = `
        .spotlight::before {
          left: var(--spotlight-x, 50%) !important;
          top: var(--spotlight-y, 50%) !important;
        }
      `;
      document.head.appendChild(style);
    },

    // ===== 10. 逐字动画 =====
    initCharReveal() {
      if (this.options.reducedMotion) return;

      document.querySelectorAll('[data-char-reveal]').forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';
        text.split('').forEach((char, i) => {
          const span = document.createElement('span');
          span.className = 'char-animate';
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.animationDelay = `${i * 0.03}s`;
          el.appendChild(span);
        });
      });
    },

    // ===== 11. 手风琴 =====
    initAccordion() {
      document.querySelectorAll('[data-accordion]').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const target = document.querySelector(trigger.dataset.accordion);
          if (!target) return;

          const isOpen = target.classList.contains('open');
          // 关闭同组其他
          const group = trigger.dataset.accordionGroup;
          if (group) {
            document.querySelectorAll(`[data-accordion-group="${group}"]`).forEach(t => {
              const other = document.querySelector(t.dataset.accordion);
              if (other && other !== target) {
                other.classList.remove('open');
                other.style.maxHeight = '0';
              }
            });
          }

          if (isOpen) {
            target.classList.remove('open');
            target.style.maxHeight = '0';
          } else {
            target.classList.add('open');
            target.style.maxHeight = target.scrollHeight + 'px';
          }
        });
      });
    },

    // ===== 12. 数字递增动画 =====
    initCountUp() {
      if (this.options.reducedMotion) {
        document.querySelectorAll('[data-count-up]').forEach(el => {
          el.textContent = el.dataset.countUp;
        });
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCountUp(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('[data-count-up]').forEach(el => observer.observe(el));
    },

    animateCountUp(el) {
      const target = parseFloat(el.dataset.countUp);
      const duration = parseInt(el.dataset.duration) || 2000;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals) || 0;
      const startTime = performance.now();

      const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = eased * target;
        el.textContent = prefix + current.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    },

    // ===== 13. 浮动元素随机延迟 =====
    initFloatStagger() {
      document.querySelectorAll('.float-anim').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.3}s`;
      });
    },

    // ===== 14. 图片懒加载 + 淡入 =====
    initLazyImageFade() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('animated');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      document.querySelectorAll('img[data-src], img[data-animate="fade"]').forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(img);
      });
    },

    // ===== 15. 鼠标跟随光效 =====
    initCursorGlow() {
      if (window.matchMedia('(hover: none)').matches || this.options.reducedMotion) return;

      const glow = document.createElement('div');
      glow.className = 'cursor-glow';
      glow.style.cssText = `
        position: fixed;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%);
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: opacity 0.3s ease;
        opacity: 0;
      `;
      document.body.appendChild(glow);

      let ticking = false;
      document.addEventListener('mousemove', (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
            glow.style.opacity = '1';
            ticking = false;
          });
          ticking = true;
        }
      });

      document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
      });
    }
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppleAnimations.init());
  } else {
    AppleAnimations.init();
  }

  // 暴露全局
  window.AppleAnimations = AppleAnimations;
})();
