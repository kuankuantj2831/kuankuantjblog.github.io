import { FeaturePack } from './feature-pack-core.js';

const el = FeaturePack.util.el;

/**
 * ================================================
 * Feature Pack #38: 金融与记账 (186-190)
 * ================================================
 */

// 186. 支出记录
FeaturePack.register('fp186_expense_tracker', {
    name: '💰 支出记录',
    desc: '简单的支出记账功能',
    page: 'profile',
    initFn() {
        const STORAGE_KEY = 'fp_expenses';
        let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#fff3e0 0%,#ffe0b2 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#e65100; font-weight:600; margin-bottom:8px;' }, '💰 支出记录'),
            el('div', { style: 'font-size:20px; color:#bf360c; font-weight:bold; text-align:center; margin-bottom:8px;' }, `¥${total.toFixed(2)}`),
            el('div', { style: 'font-size:11px; color:#ef6c00; text-align:center; margin-bottom:8px;' }, `共 ${expenses.length} 笔支出`),
            el('div', { style: 'display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap; justify-content:center;' }, [
                ['🍔', '餐饮', 30], ['🚌', '交通', 10], ['🛒', '购物', 50],
                ['🎮', '娱乐', 20], ['💊', '医疗', 40], ['📚', '学习', 25]
            ].map(([icon, name, amount]) =>
                el('button', {
                    style: 'padding:4px 8px; background:#ff9800; color:#fff; border:none; border-radius:4px; font-size:11px; cursor:pointer;',
                    onclick: () => {
                        expenses.push({ name, amount, date: new Date().toLocaleDateString('zh-CN'), icon });
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses.slice(-20)));
                        location.reload();
                    }
                }, `${icon} ${name} ¥${amount}`)
            )),
            expenses.slice(-3).reverse().map(e =>
                el('div', { style: 'font-size:11px; color:#e65100; padding:3px 0; border-bottom:1px dashed #ffcc80;' },
                    `${e.icon} ${e.name} ¥${e.amount.toFixed(2)} · ${e.date}`
                )
            )
        ]);
        container.after(widget);
    }
});

// 187. 预算设置
FeaturePack.register('fp187_budget_planner', {
    name: '📊 预算规划',
    desc: '月度预算跟踪',
    page: 'profile',
    initFn() {
        const STORAGE_KEY = 'fp_budget';
        const budget = parseFloat(localStorage.getItem(`${STORAGE_KEY}_limit`) || '3000');
        const expenses = JSON.parse(localStorage.getItem('fp_expenses') || '[]');
        const monthTotal = expenses.filter(e => {
            const d = new Date(e.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((s, e) => s + e.amount, 0);
        const percent = Math.min((monthTotal / budget) * 100, 100);
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        let color = '#4caf50';
        if (percent > 50) color = '#ff9800';
        if (percent > 80) color = '#f44336';
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#c2185b; font-weight:600; margin-bottom:6px;' }, '📊 本月预算'),
            el('div', { style: 'display:flex; justify-content:space-between; font-size:12px; color:#880e4f; margin-bottom:4px;' }, [
                el('span', null, `已用 ¥${monthTotal.toFixed(2)}`),
                el('span', null, `预算 ¥${budget.toFixed(2)}`)
            ]),
            el('div', { style: `width:100%; height:10px; background:#f48fb1; border-radius:5px; overflow:hidden;` },
                el('div', { style: `width:${percent}%; height:100%; background:${color}; border-radius:5px; transition:width 0.5s;` })
            ),
            el('div', { style: `font-size:12px; font-weight:600; margin-top:6px; text-align:center; color:${color};` },
                percent >= 100 ? '⚠️ 预算已超支！' : `剩余 ¥${(budget - monthTotal).toFixed(2)} (${(100 - percent).toFixed(0)}%)`
            ),
            el('div', { style: 'margin-top:8px; display:flex; gap:6px; justify-content:center;' }, [
                [2000, 3000, 5000].map(b =>
                    el('button', {
                        style: 'padding:3px 8px; background:#e91e63; color:#fff; border:none; border-radius:4px; font-size:11px; cursor:pointer;',
                        onclick: () => {
                            localStorage.setItem(`${STORAGE_KEY}_limit`, b);
                            location.reload();
                        }
                    }, `¥${b}`)
                )
            ])
        ]);
        container.after(widget);
    }
});

// 188. 汇率换算
FeaturePack.register('fp188_currency_converter', {
    name: '💱 汇率换算',
    desc: '简单汇率换算工具',
    page: 'coins',
    initFn() {
        const rates = { USD: 7.25, EUR: 7.85, JPY: 0.048, GBP: 9.12, HKD: 0.93, KRW: 0.0054 };
        const container = document.getElementById('mainContent');
        if (!container) return;
        const widget = el('div', {
            style: 'margin:20px auto; padding:16px; background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.08); max-width:400px;'
        }, [
            el('div', { style: 'font-size:14px; font-weight:600; color:#333; margin-bottom:12px; text-align:center;' }, '💱 汇率换算 (以人民币为基准)'),
            el('div', { style: 'display:grid; grid-template-columns:1fr 1fr; gap:8px;' },
                Object.entries(rates).map(([currency, rate]) =>
                    el('div', {
                        style: 'padding:8px; background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-radius:6px; text-align:center; cursor:pointer; transition:transform 0.2s;',
                        onmouseenter: function() { this.style.transform = 'scale(1.05)'; },
                        onmouseleave: function() { this.style.transform = 'scale(1)'; },
                        onclick: () => {
                            const amount = prompt(`输入${currency}金额：`, '100');
                            if (amount) {
                                const cny = (parseFloat(amount) * rate).toFixed(2);
                                alert(`${amount} ${currency} = ${cny} CNY`);
                            }
                        }
                    }, [
                        el('div', { style: 'font-size:16px; font-weight:bold; color:#2e7d32;' }, currency),
                        el('div', { style: 'font-size:11px; color:#388e3c;' }, `1${currency} = ${rate}CNY`)
                    ])
                )
            ),
            el('div', { style: 'font-size:11px; color:#999; text-align:center; margin-top:10px;' }, '💡 点击币种进行换算 · 汇率仅供参考')
        ]);
        container.appendChild(widget);
    }
});

// 189. 分期计算器
FeaturePack.register('fp189_installment_calc', {
    name: '🧮 分期计算器',
    desc: '计算分期付款详情',
    page: 'coins',
    initFn() {
        const container = document.getElementById('mainContent');
        if (!container) return;
        const widget = el('div', {
            style: 'margin:20px auto; padding:16px; background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.08); max-width:400px;'
        }, [
            el('div', { style: 'font-size:14px; font-weight:600; color:#333; margin-bottom:12px; text-align:center;' }, '🧮 分期计算器'),
            el('div', { style: 'margin-bottom:8px;' }, [
                el('label', { style: 'font-size:12px; color:#666; display:block; margin-bottom:4px;' }, '总金额 (元)'),
                el('input', { id: 'install-amount', type: 'number', value: '3000', style: 'width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;' })
            ]),
            el('div', { style: 'margin-bottom:8px;' }, [
                el('label', { style: 'font-size:12px; color:#666; display:block; margin-bottom:4px;' }, '分期数 (月)'),
                el('input', { id: 'install-months', type: 'number', value: '12', style: 'width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;' })
            ]),
            el('div', { style: 'margin-bottom:12px;' }, [
                el('label', { style: 'font-size:12px; color:#666; display:block; margin-bottom:4px;' }, '年利率 (%)'),
                el('input', { id: 'install-rate', type: 'number', value: '0', step: '0.1', style: 'width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;' })
            ]),
            el('button', {
                style: 'width:100%; padding:10px; background:#2196f3; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; font-weight:600;',
                onclick: () => {
                    const amount = parseFloat(document.getElementById('install-amount').value) || 0;
                    const months = parseInt(document.getElementById('install-months').value) || 1;
                    const rate = parseFloat(document.getElementById('install-rate').value) || 0;
                    const monthlyRate = rate / 100 / 12;
                    let monthlyPay;
                    if (monthlyRate === 0) {
                        monthlyPay = amount / months;
                    } else {
                        monthlyPay = amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
                    }
                    const totalPay = monthlyPay * months;
                    const interest = totalPay - amount;
                    const result = document.getElementById('install-result');
                    result.innerHTML = `
                        <div style="background:#e3f2fd; padding:12px; border-radius:8px; margin-top:10px;">
                            <div style="font-size:13px; color:#1565c0; margin-bottom:4px;">每月还款：<strong>¥${monthlyPay.toFixed(2)}</strong></div>
                            <div style="font-size:12px; color:#1976d2;">还款总额：¥${totalPay.toFixed(2)}</div>
                            <div style="font-size:12px; color:#1976d2;">利息总额：¥${interest.toFixed(2)}</div>
                        </div>
                    `;
                }
            }, '计算'),
            el('div', { id: 'install-result' })
        ]);
        container.appendChild(widget);
    }
});

// 190. 理财小贴士
FeaturePack.register('fp190_finance_tips', {
    name: '💡 理财小贴士',
    desc: '每日理财小知识',
    page: 'profile',
    initFn() {
        const tips = [
            '💰 先储蓄再消费，每月发工资先存20%',
            '📈 不要把所有鸡蛋放在一个篮子里',
            '⏰ 复利是世界第八大奇迹，越早开始越好',
            '📚 投资自己是最稳赚不赔的投资',
            '🏠 紧急备用金应覆盖3-6个月的生活开支',
            '💳 信用卡按时还款，避免逾期影响征信',
            '🎯 设定明确的财务目标，分阶段实现',
            '📊 定期复盘收支情况，优化消费习惯',
            '🛡️ 保险是风险管理工具，不是投资产品',
            '🌱 小额定投胜过一次性大额投资'
        ];
        const dayIndex = new Date().getDate() % tips.length;
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const widget = el('div', {
            style: 'margin-top:10px; padding:10px; background:linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:12px; color:#00838f; font-weight:600; margin-bottom:4px;' }, '💡 理财小贴士'),
            el('div', { style: 'font-size:12px; color:#006064; line-height:1.5;' }, tips[dayIndex]),
            el('div', { style: 'font-size:10px; color:#00acc1; text-align:right; margin-top:4px;' }, `第 ${dayIndex + 1}/${tips.length} 条`)
        ]);
        container.after(widget);
    }
});
