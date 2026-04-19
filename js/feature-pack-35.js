/**
 * 功能包 #35: 颜色与主题 (171-175)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 171. 拾色器
FeaturePack.register('fp171_color_picker', {
    name: '拾色器', desc: '页面上提取颜色',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1380px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#e74c3c',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🎨';
        btn.title = '拾色器';
        btn.addEventListener('click', () => {
            const input = el('input', {}, { type:'color' });
            input.addEventListener('change', () => {
                navigator.clipboard.writeText(input.value);
                alert(`🎨 颜色：${input.value}\n已复制到剪贴板`);
            });
            input.click();
        });
        document.body.appendChild(btn);
    }
});

// 172. 灰度模式
FeaturePack.register('fp172_grayscale', {
    name: '灰度模式', desc: '页面黑白显示',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1430px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#7f8c8d',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '◐';
        btn.title = '灰度模式';
        let on = false;
        btn.addEventListener('click', () => {
            on = !on;
            document.documentElement.style.filter = on ? 'grayscale(100%)' : '';
            btn.innerHTML = on ? '◑' : '◐';
        });
        document.body.appendChild(btn);
    }
});

// 173. 反色模式
FeaturePack.register('fp173_invert', {
    name: '反色模式', desc: '页面颜色反转',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1480px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#2c3e50',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '◑';
        btn.title = '反色模式';
        let on = false;
        btn.addEventListener('click', () => {
            on = !on;
            document.documentElement.style.filter = on ? 'invert(100%)' : '';
            btn.innerHTML = on ? '◐' : '◑';
        });
        document.body.appendChild(btn);
    }
});

// 174. 色盲模式
FeaturePack.register('fp174_colorblind', {
    name: '色盲模式', desc: '模拟色盲效果',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1530px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#d35400',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '👁️';
        btn.title = '色盲模拟';
        let on = false;
        btn.addEventListener('click', () => {
            on = !on;
            document.documentElement.style.filter = on ? 'url(#fp_colorblind)' : '';
            if (on && !document.getElementById('fp_colorblind_filter')) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.display = 'none';
                svg.innerHTML = `<filter id="fp_colorblind"><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0"/></filter>`;
                document.body.appendChild(svg);
            }
            btn.innerHTML = on ? '🙈' : '👁️';
        });
        document.body.appendChild(btn);
    }
});

// 175. 页面颜色统计
FeaturePack.register('fp175_color_stats', {
    name: '颜色统计', desc: '统计页面使用颜色',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1580px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#9b59b6',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📊';
        btn.title = '颜色统计';
        btn.addEventListener('click', () => {
            const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#feca57'];
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:300px">
                    <h3 style="margin:0 0 15px">🎨 页面颜色</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:8px">
                        ${colors.map(c => `<div style="width:40px;height:40px;border-radius:8px;background:${c};box-shadow:0 2px 8px rgba(0,0,0,0.1)"></div>`).join('')}
                    </div>
                    <button id="fp_cs_close" style="margin-top:15px;width:100%;padding:10px;border:none;border-radius:8px;background:#f5f5f5;cursor:pointer">关闭</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_cs_close').addEventListener('click', () => modal.remove());
        });
        document.body.appendChild(btn);
    }
});
