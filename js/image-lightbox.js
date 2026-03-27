/**
 * 图片灯箱增强 - Image Lightbox Enhancement
 * 支持缩放、拖拽、幻灯片浏览的图片查看器
 */

class ImageLightbox {
    constructor(options = {}) {
        this.options = {
            selector: 'img:not(.no-lightbox):not([data-no-lightbox])',
            gallerySelector: '[data-gallery]',
            enableZoom: true,
            enableDrag: true,
            enableKeyboard: true,
            enableDownload: true,
            enableShare: true,
            showInfo: true,
            loopGallery: true,
            animationDuration: 300,
            ...options
        };
        
        this.currentImage = null;
        this.galleryImages = [];
        this.currentIndex = 0;
        this.isOpen = false;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.init();
    }
    
    init() {
        this.createLightbox();
        this.bindEvents();
        this.processImages();
        this.injectStyles();
        
        console.log('[图片灯箱] 系统已初始化');
    }
    
    /**
     * 创建灯箱DOM
     */
    createLightbox() {
        this.lightbox = document.createElement('div');
        this.lightbox.className = 'image-lightbox';
        this.lightbox.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-container">
                <div class="lightbox-stage">
                    <img class="lightbox-image" src="" alt="">
                    <div class="lightbox-loader">
                        <div class="loader-spinner"></div>
                    </div>
                </div>
                
                <div class="lightbox-toolbar">
                    <div class="toolbar-left">
                        <span class="image-counter">1 / 1</span>
                        <span class="image-info"></span>
                    </div>
                    <div class="toolbar-right">
                        <button class="toolbar-btn zoom-out-btn" title="缩小">-</button>
                        <span class="zoom-level">100%</span>
                        <button class="toolbar-btn zoom-in-btn" title="放大">+</button>
                        <button class="toolbar-btn reset-btn" title="重置">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                            </svg>
                        </button>
                        <button class="toolbar-btn download-btn" title="下载">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <button class="toolbar-btn share-btn" title="分享">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                        </button>
                        <button class="toolbar-btn close-btn" title="关闭 (Esc)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <button class="lightbox-nav prev-btn" title="上一张 (←)">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <button class="lightbox-nav next-btn" title="下一张 (→)">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
                
                <div class="lightbox-thumbnails"></div>
            </div>
            
            <div class="lightbox-hint">
                <span>滚轮缩放</span>
                <span>拖拽移动</span>
                <span>双击还原</span>
            </div>
        `;
        
        document.body.appendChild(this.lightbox);
        
        // 缓存元素引用
        this.overlay = this.lightbox.querySelector('.lightbox-overlay');
        this.container = this.lightbox.querySelector('.lightbox-container');
        this.stage = this.lightbox.querySelector('.lightbox-stage');
        this.image = this.lightbox.querySelector('.lightbox-image');
        this.loader = this.lightbox.querySelector('.lightbox-loader');
        this.counter = this.lightbox.querySelector('.image-counter');
        this.info = this.lightbox.querySelector('.image-info');
        this.zoomLevel = this.lightbox.querySelector('.zoom-level');
        this.thumbnailsContainer = this.lightbox.querySelector('.lightbox-thumbnails');
    }
    
    /**
     * 处理页面图片
     */
    processImages() {
        // 处理画廊
        const galleries = document.querySelectorAll(this.options.gallerySelector);
        
        galleries.forEach(gallery => {
            const images = gallery.querySelectorAll('img');
            const galleryName = gallery.dataset.gallery || 'default';
            
            images.forEach((img, index) => {
                img.dataset.gallery = galleryName;
                img.dataset.index = index;
                img.classList.add('lightbox-trigger');
                
                // 添加点击事件
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openGallery(galleryName, index);
                });
            });
        });
        
        // 处理独立图片
        const standaloneImages = document.querySelectorAll(this.options.selector);
        
        standaloneImages.forEach(img => {
            if (!img.dataset.gallery) {
                img.classList.add('lightbox-trigger');
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openSingle(img);
                });
            }
        });
    }
    
    /**
     * 打开单张图片
     */
    openSingle(img) {
        this.galleryImages = [{
            src: img.src,
            alt: img.alt,
            title: img.title,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
        }];
        this.currentIndex = 0;
        this.open();
    }
    
    /**
     * 打开画廊
     */
    openGallery(galleryName, index) {
        const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
        if (!gallery) return;
        
        const images = gallery.querySelectorAll('img');
        
        this.galleryImages = Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
        }));
        
        this.currentIndex = index;
        this.createThumbnails();
        this.open();
    }
    
    /**
     * 创建缩略图
     */
    createThumbnails() {
        if (this.galleryImages.length <= 1) {
            this.thumbnailsContainer.innerHTML = '';
            return;
        }
        
        this.thumbnailsContainer.innerHTML = this.galleryImages.map((img, index) => `
            <div class="thumbnail ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <img src="${img.src}" alt="">
            </div>
        `).join('');
        
        // 绑定缩略图点击
        this.thumbnailsContainer.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                this.goToImage(parseInt(thumb.dataset.index));
            });
        });
    }
    
    /**
     * 打开灯箱
     */
    open() {
        this.isOpen = true;
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.loadImage();
        this.updateUI();
        
        // 触发打开事件
        window.dispatchEvent(new CustomEvent('lightbox:open', {
            detail: { images: this.galleryImages, index: this.currentIndex }
        }));
    }
    
    /**
     * 关闭灯箱
     */
    close() {
        this.isOpen = false;
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
        
        // 重置状态
        this.resetTransform();
        
        // 触发关闭事件
        window.dispatchEvent(new CustomEvent('lightbox:close'));
    }
    
    /**
     * 加载图片
     */
    loadImage() {
        const imgData = this.galleryImages[this.currentIndex];
        
        this.loader.style.display = 'flex';
        this.image.style.opacity = '0';
        
        const img = new Image();
        img.onload = () => {
            this.image.src = imgData.src;
            this.image.alt = imgData.alt || '';
            this.loader.style.display = 'none';
            this.image.style.opacity = '1';
            
            // 更新图片信息
            imgData.naturalWidth = img.naturalWidth;
            imgData.naturalHeight = img.naturalHeight;
            this.updateInfo();
        };
        
        img.onerror = () => {
            this.loader.style.display = 'none';
            this.image.src = '';
            this.image.alt = '图片加载失败';
        };
        
        img.src = imgData.src;
    }
    
    /**
     * 跳转到指定图片
     */
    goToImage(index) {
        if (index < 0) {
            index = this.options.loopGallery ? this.galleryImages.length - 1 : 0;
        } else if (index >= this.galleryImages.length) {
            index = this.options.loopGallery ? 0 : this.galleryImages.length - 1;
        }
        
        if (index === this.currentIndex) return;
        
        this.currentIndex = index;
        this.resetTransform();
        this.loadImage();
        this.updateUI();
        
        // 更新缩略图
        this.thumbnailsContainer.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === this.currentIndex);
        });
        
        // 滚动缩略图到可视区域
        const activeThumb = this.thumbnailsContainer.querySelector('.thumbnail.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }
    
    /**
     * 上一张
     */
    prev() {
        this.goToImage(this.currentIndex - 1);
    }
    
    /**
     * 下一张
     */
    next() {
        this.goToImage(this.currentIndex + 1);
    }
    
    /**
     * 更新UI
     */
    updateUI() {
        this.counter.textContent = `${this.currentIndex + 1} / ${this.galleryImages.length}`;
        
        // 显示/隐藏导航按钮
        const showNav = this.galleryImages.length > 1;
        this.lightbox.querySelector('.prev-btn').style.display = showNav ? 'flex' : 'none';
        this.lightbox.querySelector('.next-btn').style.display = showNav ? 'flex' : 'none';
    }
    
    /**
     * 更新图片信息
     */
    updateInfo() {
        const img = this.galleryImages[this.currentIndex];
        const infoParts = [];
        
        if (img.title) infoParts.push(img.title);
        if (img.naturalWidth && img.naturalHeight) {
            infoParts.push(`${img.naturalWidth} × ${img.naturalHeight}`);
        }
        
        this.info.textContent = infoParts.join(' • ');
    }
    
    // ========== 缩放和拖拽 ==========
    
    zoomIn() {
        this.scale = Math.min(this.scale * 1.25, 5);
        this.applyTransform();
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale / 1.25, 0.5);
        this.applyTransform();
    }
    
    resetTransform() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }
    
    applyTransform() {
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        this.zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    // ========== 事件绑定 ==========
    
    bindEvents() {
        // 关闭按钮
        this.lightbox.querySelector('.close-btn').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
        
        // 导航按钮
        this.lightbox.querySelector('.prev-btn').addEventListener('click', () => this.prev());
        this.lightbox.querySelector('.next-btn').addEventListener('click', () => this.next());
        
        // 缩放按钮
        this.lightbox.querySelector('.zoom-in-btn').addEventListener('click', () => this.zoomIn());
        this.lightbox.querySelector('.zoom-out-btn').addEventListener('click', () => this.zoomOut());
        this.lightbox.querySelector('.reset-btn').addEventListener('click', () => this.resetTransform());
        
        // 下载按钮
        if (this.options.enableDownload) {
            this.lightbox.querySelector('.download-btn').addEventListener('click', () => this.downloadImage());
        }
        
        // 分享按钮
        if (this.options.enableShare) {
            this.lightbox.querySelector('.share-btn').addEventListener('click', () => this.shareImage());
        }
        
        // 键盘事件
        if (this.options.enableKeyboard) {
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
        
        // 滚轮缩放
        if (this.options.enableZoom) {
            this.stage.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        }
        
        // 拖拽
        if (this.options.enableDrag) {
            this.bindDragEvents();
        }
        
        // 双击重置
        this.stage.addEventListener('dblclick', () => {
            if (this.scale !== 1 || this.translateX !== 0 || this.translateY !== 0) {
                this.resetTransform();
            } else {
                this.scale = 2;
                this.applyTransform();
            }
        });
        
        // 触摸滑动（画廊）
        this.bindTouchEvents();
    }
    
    /**
     * 键盘事件处理
     */
    handleKeyDown(e) {
        if (!this.isOpen) return;
        
        switch (e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
            case '+':
            case '=':
                this.zoomIn();
                break;
            case '-':
                this.zoomOut();
                break;
            case '0':
                this.resetTransform();
                break;
        }
    }
    
    /**
     * 滚轮事件处理
     */
    handleWheel(e) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }
    
    /**
     * 绑定拖拽事件
     */
    bindDragEvents() {
        this.stage.addEventListener('mousedown', (e) => {
            if (this.scale > 1) {
                this.isDragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.stage.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            this.applyTransform();
            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.stage.style.cursor = this.scale > 1 ? 'grab' : 'default';
        });
    }
    
    /**
     * 绑定触摸事件
     */
    bindTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        this.stage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        this.stage.addEventListener('touchend', (e) => {
            if (e.changedTouches.length !== 1) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 快速滑动切换图片
            if (touchDuration < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            }
        }, { passive: true });
    }
    
    /**
     * 下载图片
     */
    downloadImage() {
        const img = this.galleryImages[this.currentIndex];
        
        fetch(img.src)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = img.alt || `image-${this.currentIndex + 1}.jpg`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(() => {
                this.showToast('下载失败', 'error');
            });
    }
    
    /**
     * 分享图片
     */
    shareImage() {
        const img = this.galleryImages[this.currentIndex];
        
        if (navigator.share) {
            navigator.share({
                title: img.title || '图片分享',
                url: img.src
            });
        } else {
            navigator.clipboard.writeText(img.src).then(() => {
                this.showToast('链接已复制');
            });
        }
    }
    
    /**
     * 显示提示
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'lightbox-toast';
        toast.textContent = message;
        
        const colors = {
            success: '#52c41a',
            error: '#ff4d4f'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.success};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 10001;
            animation: lightboxToastIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'lightboxToastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('lightbox-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'lightbox-styles';
        style.textContent = `
            .lightbox-trigger {
                cursor: zoom-in;
                transition: opacity 0.2s;
            }
            
            .lightbox-trigger:hover {
                opacity: 0.9;
            }
            
            .image-lightbox {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .image-lightbox.active {
                opacity: 1;
                visibility: visible;
            }
            
            .lightbox-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
            }
            
            .lightbox-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .lightbox-stage {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }
            
            .lightbox-image {
                max-width: 90%;
                max-height: 80vh;
                object-fit: contain;
                transition: transform 0.3s ease;
                user-select: none;
            }
            
            .lightbox-loader {
                position: absolute;
                display: none;
                align-items: center;
                justify-content: center;
            }
            
            .loader-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: lightboxSpin 1s linear infinite;
            }
            
            .lightbox-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
            }
            
            .toolbar-left {
                display: flex;
                align-items: center;
                gap: 16px;
                color: white;
                font-size: 14px;
            }
            
            .image-counter {
                font-weight: 500;
            }
            
            .image-info {
                opacity: 0.8;
            }
            
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255,255,255,0.1);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .toolbar-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .toolbar-btn svg {
                stroke: currentColor;
            }
            
            .zoom-level {
                min-width: 50px;
                text-align: center;
                color: white;
                font-size: 13px;
            }
            
            .lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 50px;
                border: none;
                background: rgba(255,255,255,0.1);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                z-index: 10;
            }
            
            .lightbox-nav:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .lightbox-nav.prev-btn {
                left: 20px;
            }
            
            .lightbox-nav.next-btn {
                right: 20px;
            }
            
            .lightbox-nav svg {
                stroke: currentColor;
            }
            
            .lightbox-thumbnails {
                display: flex;
                gap: 8px;
                padding: 12px 20px;
                background: rgba(0, 0, 0, 0.5);
                overflow-x: auto;
                scrollbar-width: none;
            }
            
            .lightbox-thumbnails::-webkit-scrollbar {
                display: none;
            }
            
            .thumbnail {
                flex-shrink: 0;
                width: 60px;
                height: 60px;
                border-radius: 6px;
                overflow: hidden;
                cursor: pointer;
                opacity: 0.6;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            
            .thumbnail:hover {
                opacity: 0.9;
            }
            
            .thumbnail.active {
                opacity: 1;
                border-color: #667eea;
            }
            
            .thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .lightbox-hint {
                position: absolute;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 20px;
                color: rgba(255,255,255,0.6);
                font-size: 12px;
                pointer-events: none;
            }
            
            .lightbox-hint span {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .lightbox-hint span::before {
                content: '';
                width: 4px;
                height: 4px;
                background: currentColor;
                border-radius: 50%;
            }
            
            @keyframes lightboxSpin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes lightboxToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            @keyframes lightboxToastOut {
                to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
            
            @media (max-width: 768px) {
                .lightbox-nav {
                    width: 40px;
                    height: 40px;
                }
                
                .lightbox-nav.prev-btn {
                    left: 10px;
                }
                
                .lightbox-nav.next-btn {
                    right: 10px;
                }
                
                .toolbar-left .image-info {
                    display: none;
                }
                
                .lightbox-hint {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageLightbox = new ImageLightbox();
    });
} else {
    window.imageLightbox = new ImageLightbox();
}

export default ImageLightbox;
