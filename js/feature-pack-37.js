import { FeaturePack } from './feature-pack-core.js';

const el = FeaturePack.util.el;

/**
 * ================================================
 * Feature Pack #37: 健康与运动 (181-185)
 * ================================================
 */

// 181. 步数计数器
FeaturePack.register('fp181_step_counter', {
    name: '🚶 步数计数器',
    desc: '模拟显示今日步数',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const steps = Math.floor(3000 + Math.random() * 12000);
        const goal = 10000;
        const percent = Math.min((steps / goal) * 100, 100);
        const widget = el('div', {
            style: 'margin-top:10px; padding:10px; background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%); border-radius:8px;'
        }, [
            el('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;' }, [
                el('span', { style: 'font-size:13px; color:#2e7d32; font-weight:600;' }, '🚶 今日步数'),
                el('span', { style: 'font-size:14px; color:#1b5e20; font-weight:bold;' }, `${steps.toLocaleString()} / ${goal.toLocaleString()}`)
            ]),
            el('div', { style: `width:100%; height:6px; background:#a5d6a7; border-radius:3px; overflow:hidden;` },
                el('div', { style: `width:${percent}%; height:100%; background:#4caf50; border-radius:3px; transition:width 1s ease;` })
            ),
            el('div', { style: 'font-size:11px; color:#388e3c; margin-top:4px; text-align:center;' },
                steps >= goal ? '🎉 目标达成！' : `还差 ${(goal - steps).toLocaleString()} 步`
            )
        ]);
        container.after(widget);
    }
});

// 182. 饮水记录
FeaturePack.register('fp182_water_tracker', {
    name: '💧 饮水记录',
    desc: '记录每日饮水量',
    page: 'profile',
    initFn() {
        const STORAGE_KEY = 'fp_water_tracker';
        let water = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        const goal = 2000;
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const updateDisplay = () => {
            const cups = Math.floor(water / 250);
            const percent = Math.min((water / goal) * 100, 100);
            localStorage.setItem(STORAGE_KEY, water);
            const existing = document.getElementById('water-tracker-widget');
            if (existing) existing.remove();
            const widget = el('div', {
                id: 'water-tracker-widget',
                style: 'margin-top:10px; padding:10px; background:linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%); border-radius:8px;'
            }, [
                el('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;' }, [
                    el('span', { style: 'font-size:13px; color:#1565c0; font-weight:600;' }, '💧 今日饮水'),
                    el('span', { style: 'font-size:14px; color:#0d47a1; font-weight:bold;' }, `${water}ml / ${goal}ml`)
                ]),
                el('div', { style: `width:100%; height:6px; background:#90caf9; border-radius:3px; overflow:hidden;` },
                    el('div', { style: `width:${percent}%; height:100%; background:#2196f3; border-radius:3px;` })
                ),
                el('div', { style: 'display:flex; gap:6px; margin-top:8px; justify-content:center; flex-wrap:wrap;' }, [
                    ...Array.from({ length: Math.min(cups, 8) }, () =>
                        el('span', { style: 'font-size:18px;' }, '💧')
                    ),
                    el('button', {
                        style: 'padding:4px 10px; background:#2196f3; color:#fff; border:none; border-radius:4px; font-size:11px; cursor:pointer;',
                        onclick: () => { water = Math.min(water + 250, 5000); updateDisplay(); }
                    }, '+250ml')
                ]),
                el('div', { style: 'font-size:11px; color:#1976d2; margin-top:4px; text-align:center;' },
                    water >= goal ? '🎉 饮水目标达成！' : `还需 ${goal - water}ml`
                )
            ]);
            container.after(widget);
        };
        updateDisplay();
    }
});

// 183. 久坐提醒
FeaturePack.register('fp183_sedentary_alert', {
    name: '⏰ 久坐提醒',
    desc: '定时提醒起身活动',
    page: 'index',
    initFn() {
        const INTERVAL = 45 * 60 * 1000;
        let lastAlert = parseInt(localStorage.getItem('fp_last_sedentary') || '0');
        const now = Date.now();
        if (now - lastAlert < INTERVAL) return;
        setTimeout(() => {
            const tip = [
                '起来活动一下吧！伸个懒腰~',
                '久坐伤身，站起来走走！',
                '该喝水了，顺便活动一下',
                '45分钟到了，起来动动筋骨',
                '保护颈椎，抬头看看远方'
            ][Math.floor(Math.random() * 5)];
            const alert = el('div', {
                style: 'position:fixed; bottom:100px; right:20px; background:linear-gradient(135deg,#ff7043 0%,#f4511e 100%); color:#fff; padding:14px 18px; border-radius:12px; box-shadow:0 8px 30px rgba(244,81,30,0.3); z-index:9998; font-size:13px; max-width:280px; animation:slideInRight 0.4s ease;'
            }, [
                el('div', { style: 'font-weight:600; margin-bottom:4px;' }, '⏰ 久坐提醒'),
                el('div', null, tip),
                el('div', { style: 'margin-top:8px; display:flex; gap:8px;' }, [
                    el('button', {
                        style: 'padding:4px 10px; background:#fff; color:#f4511e; border:none; border-radius:4px; font-size:11px; cursor:pointer;',
                        onclick: function() {
                            localStorage.setItem('fp_last_sedentary', Date.now());
                            this.closest('div').parentElement.remove();
                        }
                    }, '我知道了')
                ])
            ]);
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 30000);
        }, INTERVAL);
    }
});

// 184. 眼保健操提醒
FeaturePack.register('fp184_eye_exercise', {
    name: '👁️ 眼保健操提醒',
    desc: '定时提醒做眼保健操',
    page: 'article',
    initFn() {
        const INTERVAL = 20 * 60 * 1000;
        setTimeout(() => {
            const alert = el('div', {
                style: 'position:fixed; bottom:80px; left:20px; background:linear-gradient(135deg,#66bb6a 0%,#43a047 100%); color:#fff; padding:14px 18px; border-radius:12px; box-shadow:0 8px 30px rgba(67,160,71,0.3); z-index:9998; font-size:13px; max-width:280px; animation:slideInLeft 0.4s ease;'
            }, [
                el('div', { style: 'font-weight:600; margin-bottom:4px;' }, '👁️ 护眼提醒'),
                el('div', null, '用眼20分钟了！远眺20秒，保护视力~'),
                el('div', { style: 'margin-top:8px; font-size:12px; opacity:0.9;' }, '💡 20-20-20法则：每20分钟看20英尺外20秒')
            ]);
            document.body.appendChild(alert);
            setTimeout(() => {
                alert.style.transition = 'opacity 0.5s';
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 500);
            }, 15000);
        }, INTERVAL);
    }
});

// 185. 呼吸训练
FeaturePack.register('fp185_breathing_exercise', {
    name: '🫁 呼吸训练',
    desc: '引导式呼吸放松练习',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        let breathing = false;
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%); border-radius:8px; text-align:center;'
        }, [
            el('div', { style: 'font-size:13px; color:#7b1fa2; font-weight:600; margin-bottom:8px;' }, '🫁 呼吸放松'),
            el('div', {
                id: 'breathing-circle',
                style: 'width:60px; height:60px; margin:0 auto 10px; background:linear-gradient(135deg,#ce93d8,#ab47bc); border-radius:50%; transition:transform 4s ease-in-out; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px;'
            }, '准备'),
            el('div', { id: 'breathing-text', style: 'font-size:12px; color:#6a1b9a; min-height:20px;' }, ''),
            el('button', {
                id: 'breathing-btn',
                style: 'padding:6px 16px; background:#9c27b0; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer; margin-top:8px;',
                onclick: function() {
                    if (breathing) return;
                    breathing = true;
                    const circle = document.getElementById('breathing-circle');
                    const text = document.getElementById('breathing-text');
                    const btn = document.getElementById('breathing-btn');
                    btn.textContent = '呼吸中...';
                    let cycle = 0;
                    const doBreath = () => {
                        if (cycle >= 3) {
                            breathing = false;
                            circle.style.transform = 'scale(1)';
                            circle.textContent = '完成';
                            text.textContent = '✨ 身心放松，感觉好多了';
                            btn.textContent = '再来一次';
                            return;
                        }
                        circle.textContent = '吸气';
                        text.textContent = '深深地吸气... (4秒)';
                        circle.style.transform = 'scale(1.5)';
                        setTimeout(() => {
                            circle.textContent = '保持';
                            text.textContent = '屏住呼吸... (4秒)';
                            setTimeout(() => {
                                circle.textContent = '呼气';
                                text.textContent = '缓慢地呼气... (4秒)';
                                circle.style.transform = 'scale(1)';
                                setTimeout(() => {
                                    cycle++;
                                    doBreath();
                                }, 4000);
                            }, 4000);
                        }, 4000);
                    };
                    doBreath();
                }
            }, '开始呼吸练习')
        ]);
        container.after(widget);
    }
});
