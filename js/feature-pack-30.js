/**
 * 功能包 #30: 相册与画廊 (146-150)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 146. 图片懒加载提示
FeaturePack.register('fp146_img_loading', {
    name: '图片加载提示', desc: '图片加载时显示骨架屏',
    initFn() {
        document.querySelectorAll('img').forEach(img => {
            if (img.complete) return;
            const skeleton = el('div', {
                position:'absolute',top:'0',left:'0',right:'0',bottom:'0',
                background:'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                backgroundSize:'200% 100%',animation:'fpShimmer 1.5s infinite'
            });
            const s = document.createElement('style');
            s.textContent = '@keyframes fpShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
            document.head.appendChild(s);
            if (img.parentElement.style.position !== 'absolute') img.parentElement.style.position = 'relative';
            img.parentElement.appendChild(skeleton);
            img.addEventListener('load', () => skeleton.remove());
            img.addEventListener('error', () => skeleton.remove());
        });
    }
});

// 147. 图片对比
FeaturePack.register('fp147_img_compare', {
    name: '图片对比', desc: '前后对比滑块',
    page: 'article',
    initFn() {
        document.querySelectorAll('[data-compare]').forEach(container => {
            container.style.position = 'relative';
            const slider = el('div', {
                position:'absolute',top:'0',bottom:'0',width:'4px',background:'white',
                cursor:'ew-resize',zIndex:'2',left:'50%'
            });
            container.appendChild(slider);
            let dragging = false;
            slider.addEventListener('mousedown', () => dragging = true);
            document.addEventListener('mouseup', () => dragging = false);
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                const rect = container.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                slider.style.left = Math.max(0, Math.min(100, x)) + '%';
            });
        });
    }
});

// 148. 图片水印
FeaturePack.register('fp148_watermark', {
    name: '图片水印', desc: '自动添加图片水印',
    initFn() {
        const watermark = el('div', {
            position:'fixed',bottom:'10px',right:'10px',fontSize:'40px',
            color:'rgba(0,0,0,0.03)',pointerEvents:'none',zIndex:'9999',
            transform:'rotate(-30deg)',userSelect:'none'
        });
        watermark.textContent = 'HAKIMI';
        document.body.appendChild(watermark);
    }
});

// 149. 图片压缩提示
FeaturePack.register('fp149_img_compress', {
    name: '图片压缩', desc: '上传前提示压缩',
    initFn() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => {
                const files = input.files;
                for (const f of files) {
                    if (f.size > 1024 * 1024) {
                        alert(`📸 ${f.name} 超过 1MB，建议压缩后上传`);
                    }
                }
            });
        });
    }
});

// 150. 画廊模式
FeaturePack.register('fp150_gallery_mode', {
    name: '画廊模式', desc: '图片网格画廊',
    page: 'article',
    initFn() {
        const imgs = document.querySelectorAll('.article-content img, .post-content img');
        if (imgs.length < 3) return;
        const gallery = el('div', {
            display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginTop:'15px'
        });
        imgs.forEach(img => {
            const wrap = el('div', { overflow:'hidden',borderRadius:'8px',cursor:'pointer' });
            wrap.innerHTML = `<img src="${img.src}" style="width:100%;height:120px;object-fit:cover;transition:transform .3s" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform=''">`;
            gallery.appendChild(wrap);
        });
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.appendChild(gallery);
    }
});
