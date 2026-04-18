/**
 * 功能包 #3: 交互增强 (11-15)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 11. 页面可见性提醒
FeaturePack.register('fp11_page_visibility', {
    name: '页面可见性提醒', desc: '切换标签页时改变标题',
    initFn() {
        const orig = document.title;
        document.addEventListener('visibilitychange', () => {
            document.title = document.hidden ? '👋 快回来看看~ | ' + orig : orig;
        });
    }
});

// 12. 键盘快捷键
FeaturePack.register('fp12_keyboard_shortcuts', {
    name: '键盘快捷键', desc: '支持多种快捷键操作',
    initFn() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // / 搜索
            if (e.key === '/' && !e.ctrlKey) { e.preventDefault(); document.getElementById('searchInput')?.focus(); }
            // G 回顶部
            if (e.key === 'g' || e.key === 'G') window.scrollTo({top:0,behavior:'smooth'});
            // H 首页
            if (e.key === 'h' || e.key === 'H') location.href = '/';
            // R 刷新
            if (e.key === 'r' || e.key === 'R') location.reload();
            // Esc 关闭弹窗
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal, .dropdown').forEach(m => m.style.display = 'none');
            }
        });
    }
});

// 13. 链接预览
FeaturePack.register('fp13_link_preview', {
    name: '链接预览', desc: '鼠标悬停链接显示预览卡片',
    initFn() {
        const preview = el('div', {
            position:'fixed',display:'none',background:'white',borderRadius:'8px',
            padding:'12px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',zIndex:'99999',
            maxWidth:'280px',fontSize:'13px',pointerEvents:'none'
        });
        document.body.appendChild(preview);
        document.addEventListener('mouseover', (e) => {
            const a = e.target.closest('a');
            if (!a || !a.href || a.href.startsWith('javascript:')) return;
            preview.style.display = 'block';
            preview.innerHTML = `<div style="font-weight:600;color:#333;margin-bottom:4px;">${a.textContent.slice(0,50)}</div><div style="color:#667eea;font-size:11px;word-break:break-all;">${a.href.slice(0,60)}</div>`;
        });
        document.addEventListener('mousemove', (e) => {
            if (preview.style.display === 'block') {
                preview.style.left = (e.clientX + 15) + 'px';
                preview.style.top = (e.clientY + 15) + 'px';
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a')) preview.style.display = 'none';
        });
    }
});

// 14. 代码块增强（运行按钮）
FeaturePack.register('fp14_code_runner', {
    name: '代码运行器', desc: 'JS代码块添加运行按钮',
    page: 'article',
    initFn() {
        document.querySelectorAll('pre code.language-javascript, pre code.language-js').forEach(code => {
            const pre = code.parentElement;
            const btn = el('button', {
                position:'absolute',top:'8px',right:'8px',padding:'4px 12px',
                background:'#667eea',color:'white',border:'none',borderRadius:'4px',
                fontSize:'11px',cursor:'pointer',zIndex:'2'
            });
            btn.textContent = '▶ 运行';
            pre.style.position = 'relative';
            pre.appendChild(btn);
            btn.addEventListener('click', () => {
                try {
                    const src = code.textContent;
                    const fn = new Function(src);
                    fn();
                    btn.textContent = '✓ 已运行';
                    setTimeout(() => btn.textContent = '▶ 运行', 2000);
                } catch (err) {
                    alert('运行错误: ' + err.message);
                }
            });
        });
    }
});

// 15. 字数统计
FeaturePack.register('fp15_word_count', {
    name: '字数统计', desc: '文章页显示字数和段落数',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const stats = el('div', {
            marginTop:'15px',padding:'10px 15px',background:'#f8f9ff',borderRadius:'8px',
            fontSize:'12px',color:'#666',display:'flex',gap:'20px',flexWrap:'wrap'
        });
        const text = content.textContent;
        const chars = text.length;
        const words = text.trim().split(/\s+/).length;
        const paras = content.querySelectorAll('p').length;
        stats.innerHTML = `
            <span>📝 ${chars} 字符</span>
            <span>📄 ${words} 词</span>
            <span>📋 ${paras} 段落</span>
        `;
        content.insertAdjacentElement('afterend', stats);
    }
});
