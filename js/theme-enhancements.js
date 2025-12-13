/**
 * 主题增强脚本 - Theme Enhancements
 * 为博客添加交互功能和动态效果
 */

(function() {
  'use strict';

  // ==================== 工具函数 ====================
  
  /**
   * 添加淡入动画
   */
  function addFadeInAnimation() {
    const articles = document.querySelectorAll('.article');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    articles.forEach(article => {
      article.style.opacity = '0';
      article.style.transform = 'translateY(30px)';
      article.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(article);
    });
  }

  /**
   * 平滑滚动
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * 返回顶部按钮增强
   */
  function enhanceBackToTop() {
    const totopBtn = document.querySelector('.totop');
    if (!totopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        totopBtn.style.opacity = '1';
        totopBtn.style.visibility = 'visible';
      } else {
        totopBtn.style.opacity = '0';
        totopBtn.style.visibility = 'hidden';
      }
    });

    totopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * 导航栏滚动效果
   */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      } else {
        navbar.style.boxShadow = 'none';
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
      }
      
      lastScroll = currentScroll;
    });
  }

  /**
   * 图片懒加载增强
   */
  function enhanceLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * 搜索高亮功能
   */
  function initSearchHighlight() {
    const searchInput = document.querySelector('#local-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const articles = document.querySelectorAll('.article');

      articles.forEach(article => {
        const title = article.querySelector('.article-title');
        const content = article.querySelector('.article-entry');
        
        if (!title) return;

        const titleText = title.textContent.toLowerCase();
        const contentText = content ? content.textContent.toLowerCase() : '';

        if (titleText.includes(searchTerm) || contentText.includes(searchTerm)) {
          article.style.display = '';
          article.style.animation = 'fadeIn 0.3s ease';
        } else {
          article.style.display = searchTerm ? 'none' : '';
        }
      });
    });
  }

  /**
   * 添加阅读进度条
   */
  function addReadingProgress() {
    // 检查是否在文章页面
    const articleContent = document.querySelector('.article-entry');
    if (!articleContent) return;

    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      z-index: 9999;
      transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    // 更新进度
    window.addEventListener('scroll', () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      progressBar.style.width = scrollPercent + '%';
    });
  }

  /**
   * 代码块复制功能
   */
  function addCodeCopyButton() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      
      // 创建复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.innerHTML = '<i class="fe fe-copy"></i> 复制';
      copyBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 12px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.85em;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      pre.style.position = 'relative';
      pre.appendChild(copyBtn);
      
      // 悬停显示按钮
      pre.addEventListener('mouseenter', () => {
        copyBtn.style.opacity = '1';
      });
      
      pre.addEventListener('mouseleave', () => {
        copyBtn.style.opacity = '0';
      });
      
      // 复制功能
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          copyBtn.innerHTML = '<i class="fe fe-check"></i> 已复制';
          copyBtn.style.background = '#4caf50';
          copyBtn.style.color = 'white';
          
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fe fe-copy"></i> 复制';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.9)';
            copyBtn.style.color = '';
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      });
    });
  }

  /**
   * 添加文章卡片悬停效果音效（可选）
   */
  function addHoverEffects() {
    const articles = document.querySelectorAll('.article');
    
    articles.forEach(article => {
      article.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });
  }

  /**
   * 外部链接添加图标
   */
  function markExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        // 添加外部链接图标
        if (!link.querySelector('.external-icon')) {
          const icon = document.createElement('i');
          icon.className = 'fe fe-link-external external-icon';
          icon.style.cssText = 'margin-left: 4px; font-size: 0.85em; opacity: 0.6;';
          link.appendChild(icon);
        }
      }
    });
  }

  /**
   * 添加图片查看器
   */
  function initImageViewer() {
    const images = document.querySelectorAll('.article-entry img');
    
    images.forEach(img => {
      img.style.cursor = 'zoom-in';
      
      img.addEventListener('click', function() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
          animation: fadeIn 0.3s ease;
        `;
        
        // 创建大图
        const bigImg = document.createElement('img');
        bigImg.src = this.src;
        bigImg.style.cssText = `
          max-width: 90%;
          max-height: 90%;
          border-radius: 10px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
          animation: zoomIn 0.3s ease;
        `;
        
        overlay.appendChild(bigImg);
        document.body.appendChild(overlay);
        
        // 点击关闭
        overlay.addEventListener('click', () => {
          overlay.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => overlay.remove(), 300);
        });
      });
    });
  }

  /**
   * 添加CSS动画
   */
  function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes zoomIn {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 初始化所有功能
   */
  function init() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🎨 主题增强脚本已加载');

    // 执行所有初始化函数
    addAnimationStyles();
    addFadeInAnimation();
    initSmoothScroll();
    enhanceBackToTop();
    initNavbarScroll();
    enhanceLazyLoad();
    initSearchHighlight();
    addReadingProgress();
    addCodeCopyButton();
    addHoverEffects();
    markExternalLinks();
    initImageViewer();
  }

  // 启动
  init();

})();
