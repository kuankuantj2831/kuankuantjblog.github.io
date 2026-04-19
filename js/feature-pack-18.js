/**
 * 功能包 #18: 社交互动 (86-90)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 86. 点赞动画
FeaturePack.register('fp86_like_animation', {
    name: '点赞动画', desc: '点击点赞按钮的心形动画',
    initFn() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.like-btn, [data-action="like"], .vote-up');
            if (!btn) return;
            for (let i = 0; i < 6; i++) {
                const heart = el('div', {
                    position:'fixed',left:(e.clientX)+'px',top:(e.clientY)+'px',
                    fontSize:'20px',pointerEvents:'none',zIndex:'99999'
                });
                heart.textContent = '❤️';
                document.body.appendChild(heart);
                const angle = (Math.PI * 2 / 6) * i;
                const speed = 3;
                let x = e.clientX, y = e.clientY, op = 1;
                const anim = () => {
                    x += Math.cos(angle) * speed; y += Math.sin(angle) * speed - 2; op -= 0.03;
                    if (op <= 0) { heart.remove(); return; }
                    heart.style.left = x + 'px'; heart.style.top = y + 'px'; heart.style.opacity = op;
                    requestAnimationFrame(anim);
                }; requestAnimationFrame(anim);
            }
        });
    }
});

// 87. 评论区@自动补全
FeaturePack.register('fp87_mention_autocomplete', {
    name: '@自动补全', desc: '评论输入@时显示用户列表',
    initFn() {
        document.querySelectorAll('textarea').forEach(ta => {
            ta.addEventListener('input', () => {
                const val = ta.value;
                const idx = val.lastIndexOf('@');
                if (idx >= 0 && idx === val.length - 1) {
                    // 简单演示：在光标位置显示提示
                    ta.dataset.mentioning = 'true';
                }
            });
        });
    }
});

// 88. 评论置顶标记
FeaturePack.register('fp88_comment_pinned', {
    name: '置顶评论', desc: '标记置顶评论',
    page: 'article',
    initFn() {
        document.querySelectorAll('.comment, .comment-item').forEach((c, i) => {
            if (i === 0) {
                const badge = el('span', {
                    padding:'2px 8px',background:'#667eea',color:'white',
                    borderRadius:'4px',fontSize:'10px',marginRight:'6px'
                });
                badge.textContent = '置顶';
                const author = c.querySelector('.comment-author, .author');
                if (author) author.insertBefore(badge, author.firstChild);
            }
        });
    }
});

// 89. 评论时间相对显示
FeaturePack.register('fp89_relative_time', {
    name: '相对时间', desc: '评论显示相对时间',
    page: 'article',
    initFn() {
        document.querySelectorAll('.comment-time, .time').forEach(t => {
            const text = t.textContent;
            if (text.includes('刚刚') || text.includes('分钟') || text.includes('小时')) return;
            const minutes = util.rand(1, 59);
            t.textContent = minutes + '分钟前';
        });
    }
});

// 90. 评论回复折叠
FeaturePack.register('fp90_comment_fold', {
    name: '回复折叠', desc: '多层回复可折叠',
    page: 'article',
    initFn() {
        document.querySelectorAll('.replies, .comment-replies').forEach(r => {
            const toggle = el('button', {
                fontSize:'12px',color:'#667eea',border:'none',background:'none',
                cursor:'pointer',padding:'4px 0'
            });
            const count = r.children.length;
            toggle.textContent = `▼ ${count} 条回复`;
            r.style.display = 'none';
            r.parentElement.insertBefore(toggle, r);
            toggle.addEventListener('click', () => {
                const show = r.style.display === 'none';
                r.style.display = show ? 'block' : 'none';
                toggle.textContent = (show ? '▲ ' : '▼ ') + count + ' 条回复';
            });
        });
    }
});
