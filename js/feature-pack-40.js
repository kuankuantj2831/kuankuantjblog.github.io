import { FeaturePack } from './feature-pack-core.js?v=20260418c';

const el = FeaturePack.util.el;

/**
 * ================================================
 * Feature Pack #40: 系统与诊断 (196-200)
 * ================================================
 */

// 196. 性能监控面板
FeaturePack.register('fp196_performance_panel', {
    name: '⚡ 性能监控',
    desc: '显示页面性能指标',
    page: 'index',
    initFn() {
        const panel = el('div', {
            id: 'perf-panel',
            style: 'position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.85); color:#00ff00; padding:10px 14px; border-radius:8px; font-family:monospace; font-size:11px; z-index:9998; max-width:280px; line-height:1.6;'
        });
        document.body.appendChild(panel);
        const update = () => {
            const nav = performance.getEntriesByType('navigation')[0];
            const mem = performance.memory;
            let html = '<div style="color:#0f0; font-weight:bold; margin-bottom:4px;">⚡ 性能监控</div>';
            if (nav) {
                html += `DNS: ${nav.domainLookupEnd - nav.domainLookupStart}ms<br>`;
                html += `TCP: ${nav.connectEnd - nav.connectStart}ms<br>`;
                html += `TTFB: ${nav.responseStart - nav.requestStart}ms<br>`;
                html += `DOM: ${nav.domComplete - nav.domLoading}ms<br>`;
                html += `加载: ${nav.loadEventEnd - nav.startTime}ms<br>`;
            }
            if (mem) {
                html += `内存: ${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB<br>`;
            }
            html += `<div style="margin-top:4px; color:#888; font-size:10px;">点击隐藏</div>`;
            panel.innerHTML = html;
        };
        setTimeout(update, 1000);
        setInterval(update, 5000);
        panel.onclick = () => panel.remove();
    }
});

// 197. 内存检测
FeaturePack.register('fp197_memory_check', {
    name: '🧠 内存检测',
    desc: '检测浏览器内存使用情况',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const mem = performance.memory;
        if (!mem) {
            const widget = el('div', {
                style: 'margin-top:10px; padding:10px; background:linear-gradient(135deg,#ffebee 0%,#ffcdd2 100%); border-radius:8px; text-align:center;'
            }, [
                el('div', { style: 'font-size:13px; color:#c62828; font-weight:600;' }, '🧠 内存检测'),
                el('div', { style: 'font-size:12px; color:#b71c1c; margin-top:4px;' }, '当前浏览器不支持内存API')
            ]);
            container.after(widget);
            return;
        }
        const used = mem.usedJSHeapSize;
        const total = mem.totalJSHeapSize;
        const limit = mem.jsHeapSizeLimit;
        const percent = (used / limit * 100).toFixed(1);
        let color = '#4caf50';
        if (percent > 50) color = '#ff9800';
        if (percent > 75) color = '#f44336';
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#2e7d32; font-weight:600; margin-bottom:6px;' }, '🧠 JavaScript 内存'),
            el('div', { style: 'display:flex; justify-content:space-between; font-size:11px; color:#388e3c; margin-bottom:4px;' }, [
                el('span', null, `已用: ${(used / 1048576).toFixed(1)}MB`),
                el('span', null, `限制: ${(limit / 1048576).toFixed(0)}MB`)
            ]),
            el('div', { style: `width:100%; height:8px; background:#a5d6a7; border-radius:4px; overflow:hidden;` },
                el('div', { style: `width:${percent}%; height:100%; background:${color}; border-radius:4px; transition:width 0.5s;` })
            ),
            el('div', { style: `font-size:12px; font-weight:600; margin-top:4px; text-align:center; color:${color};` }, `${percent}% 已使用`)
        ]);
        container.after(widget);
    }
});

// 198. 电池状态
FeaturePack.register('fp198_battery_status', {
    name: '🔋 电池状态',
    desc: '显示设备电池信息',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const widget = el('div', {
            id: 'battery-widget',
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#e0f2f1 0%,#b2dfdb 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#00695c; font-weight:600; margin-bottom:6px;' }, '🔋 电池状态'),
            el('div', { id: 'battery-info', style: 'font-size:12px; color:#004d40; text-align:center;' }, '正在检测...')
        ]);
        container.after(widget);
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const update = () => {
                    const level = Math.round(battery.level * 100);
                    const charging = battery.charging;
                    const timeText = charging
                        ? (battery.chargingTime !== Infinity ? `充满还需 ${Math.round(battery.chargingTime / 60)} 分钟` : '充电中')
                        : (battery.dischargingTime !== Infinity ? `剩余 ${Math.round(battery.dischargingTime / 60)} 分钟` : '使用中');
                    let color = '#4caf50';
                    if (level < 30) color = '#ff9800';
                    if (level < 15) color = '#f44336';
                    const info = document.getElementById('battery-info');
                    if (info) {
                        info.innerHTML = `
                            <div style="font-size:24px; margin-bottom:4px;">${charging ? '⚡' : '🔋'} ${level}%</div>
                            <div style="width:100%; height:10px; background:#80cbc4; border-radius:5px; overflow:hidden; margin:6px 0;">
                                <div style="width:${level}%; height:100%; background:${color}; border-radius:5px;"></div>
                            </div>
                            <div style="font-size:11px;">${timeText}</div>
                        `;
                    }
                };
                update();
                battery.addEventListener('levelchange', update);
                battery.addEventListener('chargingchange', update);
            });
        } else {
            document.getElementById('battery-info').textContent = '当前设备不支持电池API';
        }
    }
});

// 199. 网络诊断
FeaturePack.register('fp199_network_diag', {
    name: '🌐 网络诊断',
    desc: '检测网络连接状态',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const online = navigator.onLine;
        let html = '';
        if (connection) {
            const types = {
                'slow-2g': '慢速2G', '2g': '2G', '3g': '3G', '4g': '4G',
                'bluetooth': '蓝牙', 'cellular': '蜂窝网络', 'ethernet': '以太网',
                'mixed': '混合', 'none': '无网络', 'other': '其他', 'unknown': '未知', 'wifi': 'Wi-Fi'
            };
            html = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px;">
                    <div style="background:rgba(255,255,255,0.5); padding:6px; border-radius:4px; text-align:center;">
                        <div style="color:#666;">类型</div>
                        <div style="font-weight:600; color:#1565c0;">${types[connection.effectiveType] || connection.effectiveType || '未知'}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.5); padding:6px; border-radius:4px; text-align:center;">
                        <div style="color:#666;">下行速度</div>
                        <div style="font-weight:600; color:#1565c0;">${connection.downlink || '?'} Mbps</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.5); padding:6px; border-radius:4px; text-align:center;">
                        <div style="color:#666;">往返延迟</div>
                        <div style="font-weight:600; color:#1565c0;">${connection.rtt || '?'} ms</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.5); padding:6px; border-radius:4px; text-align:center;">
                        <div style="color:#666;">数据节省</div>
                        <div style="font-weight:600; color:#1565c0;">${connection.saveData ? '已开启' : '未开启'}</div>
                    </div>
                </div>
            `;
        } else {
            html = `<div style="text-align:center; font-size:12px; color:#1565c0;">${online ? '🟢 网络连接正常' : '🔴 网络已断开'}</div>`;
        }
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#1565c0; font-weight:600; margin-bottom:8px; text-align:center;' }, `🌐 网络诊断 ${online ? '✅' : '❌'}`),
            el('div', { innerHTML: html })
        ]);
        container.after(widget);
    }
});

// 200. 浏览器指纹
FeaturePack.register('fp200_browser_fingerprint', {
    name: '🔐 浏览器指纹',
    desc: '显示浏览器唯一标识信息',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const fp = {
            ua: navigator.userAgent.slice(0, 40) + '...',
            platform: navigator.platform,
            cores: navigator.hardwareConcurrency || '?',
            mem: navigator.deviceMemory || '?',
            lang: navigator.language,
            cookie: navigator.cookieEnabled ? '✅' : '❌',
            touch: ('ontouchstart' in window) ? '✅' : '❌',
            dpr: window.devicePixelRatio,
            screen: `${screen.width}x${screen.height}`,
            color: screen.colorDepth + 'bit'
        };
        // Simple hash
        const hash = btoa(JSON.stringify(fp)).slice(0, 16);
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#7b1fa2; font-weight:600; margin-bottom:6px; text-align:center;' }, '🔐 浏览器指纹'),
            el('div', { style: 'font-size:11px; color:#6a1b9a; background:rgba(255,255,255,0.6); padding:6px; border-radius:4px; text-align:center; font-family:monospace; margin-bottom:8px; word-break:break-all;' }, `ID: ${hash}`),
            el('div', { style: 'display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:10px;' }, [
                ['平台', fp.platform], ['CPU核心', fp.cores + '核'],
                ['内存', fp.mem + 'GB'], ['语言', fp.lang],
                ['Cookie', fp.cookie], ['触屏', fp.touch],
                ['DPR', fp.dpr + 'x'], ['分辨率', fp.screen],
                ['色深', fp.color]
            ].map(([k, v]) =>
                el('div', { style: 'display:flex; justify-content:space-between; padding:3px 6px; background:rgba(255,255,255,0.4); border-radius:3px;' }, [
                    el('span', { style: 'color:#8e24aa;' }, k),
                    el('span', { style: 'font-weight:600; color:#4a148c;' }, v)
                ])
            ))
        ]);
        container.after(widget);
    }
});
