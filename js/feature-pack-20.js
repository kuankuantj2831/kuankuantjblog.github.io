/**
 * 功能包 #20: 高级功能 (96-100)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 96. 全屏模式
FeaturePack.register('fp96_fullscreen', {
    name: '全屏模式', desc: '文章页全屏阅读',
    page: 'article',
    initFn() {
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        btn.innerHTML = '⛶ 全屏';
        btn.addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});

// 97. 页面性能监控
FeaturePack.register('fp97_performance', {
    name: '性能监控', desc: '控制台显示加载性能',
    initFn() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const dns = timing.domainLookupEnd - timing.domainLookupStart;
                const tcp = timing.connectEnd - timing.connectStart;
                console.log('%c📊 页面性能', 'font-size:16px;font-weight:bold;color:#667eea');
                console.log(`⏱️ 总加载时间: ${loadTime}ms`);
                console.log(`🌐 DNS解析: ${dns}ms`);
                console.log(`🔗 TCP连接: ${tcp}ms`);
            }, 0);
        });
    }
});

// 98. 离线检测
FeaturePack.register('fp98_offline_detect', {
    name: '离线检测', desc: '网络断开提示',
    initFn() {
        const showStatus = (online) => {
            const existing = document.getElementById('fp_net_status');
            if (existing) existing.remove();
            const bar = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',zIndex:'99999',
                padding:'8px',textAlign:'center',fontSize:'13px',
                background: online ? '#4ade80' : '#ff4757', color:'white'
            });
            bar.id = 'fp_net_status';
            bar.textContent = online ? '🌐 网络已恢复' : '⚠️ 网络已断开，请检查连接';
            document.body.appendChild(bar);
            if (online) setTimeout(() => bar.remove(), 3000);
        };
        window.addEventListener('online', () => showStatus(true));
        window.addEventListener('offline', () => showStatus(false));
    }
});

// 99. 浏览器兼容性提示
FeaturePack.register('fp99_browser_compat', {
    name: '浏览器兼容', desc: '旧浏览器提示升级',
    initFn() {
        const ua = navigator.userAgent;
        if (ua.includes('MSIE') || ua.includes('Trident')) {
            const bar = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',background:'#ff6b6b',
                color:'white',padding:'10px',textAlign:'center',fontSize:'13px',zIndex:'99999'
            });
            bar.innerHTML = '⚠️ 您的浏览器版本过旧，建议升级以获得最佳体验';
            document.body.appendChild(bar);
        }
    }
});

// 100. 功能开关面板
FeaturePack.register('fp100_feature_panel', {
    name: '功能面板', desc: '统一管理所有100个功能开关',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'20px',right:'20px',width:'48px',height:'48px',
            borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#667eea,#764ba2)',
            color:'white',fontSize:'20px',cursor:'pointer',zIndex:'999',
            boxShadow:'0 4px 20px rgba(102,126,234,0.4)',transition:'all .3s'
        });
        btn.innerHTML = '⚙️';
        btn.title = '功能面板';
        document.body.appendChild(btn);
        btn.addEventListener('click', () => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            const features = Object.values(FeaturePack.registry);
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:400px;max-height:70vh;overflow:auto">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
                        <h3 style="margin:0">⚙️ 功能面板 (${features.length}/100)</h3>
                        <span id="fp_panel_close" style="cursor:pointer;font-size:20px;color:#999">✕</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px">
                        ${features.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8f9ff;border-radius:8px">
                            <div><div style="font-size:13px;font-weight:500">${f.name}</div><div style="font-size:11px;color:#999">${f.desc}</div></div>
                            <input type="checkbox" data-fid="${f.id}" ${FeaturePack.enabled.has(f.id)?'checked':''} style="cursor:pointer">
                        </div>`).join('')}
                    </div>
                    <div style="margin-top:15px;display:flex;gap:10px;justify-content:center">
                        <button id="fp_enable_all" style="padding:8px 20px;border:none;border-radius:20px;background:#4ade80;color:white;cursor:pointer;font-size:13px">全部开启</button>
                        <button id="fp_disable_all" style="padding:8px 20px;border:none;border-radius:20px;background:#ff4757;color:white;cursor:pointer;font-size:13px">全部关闭</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_panel_close').addEventListener('click', () => modal.remove());
            modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', () => FeaturePack.toggle(cb.dataset.fid));
            });
            modal.querySelector('#fp_enable_all').addEventListener('click', () => {
                Object.keys(FeaturePack.registry).forEach(id => { FeaturePack.enabled.add(id); localStorage.setItem(`fp_${id}`, 'true'); });
                modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
            });
            modal.querySelector('#fp_disable_all').addEventListener('click', () => {
                Object.keys(FeaturePack.registry).forEach(id => { FeaturePack.enabled.delete(id); localStorage.setItem(`fp_${id}`, 'false'); });
                modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        });
    }
});
