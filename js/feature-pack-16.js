/**
 * 功能包 #16: 表单增强 (76-80)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 76. 密码强度指示器
FeaturePack.register('fp76_password_strength', {
    name: '密码强度', desc: '注册页密码强度指示',
    page: 'index',
    initFn() {
        const input = document.querySelector('input[type="password"], #password');
        if (!input) return;
        const bar = el('div', { height:'4px',background:'#eee',borderRadius:'2px',marginTop:'6px',overflow:'hidden' });
        const fill = el('div', { height:'100%',width:'0%',background:'#ff4757',borderRadius:'2px',transition:'all .3s' });
        const label = el('div', { fontSize:'11px',color:'#999',marginTop:'4px' });
        bar.appendChild(fill);
        input.parentElement.appendChild(bar);
        input.parentElement.appendChild(label);
        input.addEventListener('input', () => {
            const v = input.value;
            let score = 0;
            if (v.length >= 6) score++;
            if (v.length >= 10) score++;
            if (/[A-Z]/.test(v)) score++;
            if (/[0-9]/.test(v)) score++;
            if (/[^A-Za-z0-9]/.test(v)) score++;
            const pct = Math.min(score / 5 * 100, 100);
            fill.style.width = pct + '%';
            const colors = ['#ff4757','#ff6348','#ffa502','#2ed573','#1e90ff'];
            const texts = ['太弱','较弱','一般','较强','很强'];
            fill.style.background = colors[Math.min(score, 4)];
            label.textContent = texts[Math.min(score, 4)];
        });
    }
});

// 77. 表单自动填充提示
FeaturePack.register('fp77_form_autofill', {
    name: '自动填充', desc: '记住表单输入历史',
    initFn() {
        document.querySelectorAll('form').forEach(form => {
            const inputs = form.querySelectorAll('input:not([type="password"])');
            inputs.forEach(input => {
                const key = 'autofill_' + (input.name || input.id || input.placeholder);
                const saved = util.storage.get(key);
                if (saved) input.value = saved;
                input.addEventListener('blur', () => { if (input.value) util.storage.set(key, input.value); });
            });
        });
    }
});

// 78. 输入字符计数器
FeaturePack.register('fp78_char_counter', {
    name: '字符计数', desc: '输入框实时字符计数',
    initFn() {
        document.querySelectorAll('textarea, input[maxlength]').forEach(input => {
            const max = input.maxLength || input.getAttribute('maxlength') || 500;
            const counter = el('div', { fontSize:'11px',color:'#999',textAlign:'right',marginTop:'4px' });
            input.parentElement.appendChild(counter);
            input.addEventListener('input', () => {
                const len = input.value.length;
                counter.textContent = `${len}/${max}`;
                counter.style.color = len > max * 0.9 ? '#ff4757' : '#999';
            });
        });
    }
});

// 79. 验证码倒计时
FeaturePack.register('fp79_captcha_countdown', {
    name: '验证码倒计时', desc: '发送验证码后倒计时',
    initFn() {
        document.querySelectorAll('button[type="button"]').forEach(btn => {
            if (btn.textContent.includes('验证码') || btn.textContent.includes('code')) {
                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    let sec = 60;
                    btn.disabled = true;
                    const original = btn.textContent;
                    btn.textContent = `${sec}s`;
                    const timer = setInterval(() => {
                        sec--;
                        btn.textContent = `${sec}s`;
                        if (sec <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = original; }
                    }, 1000);
                });
            }
        });
    }
});

// 80. 智能表单验证
FeaturePack.register('fp80_smart_validate', {
    name: '智能验证', desc: '实时表单验证提示',
    initFn() {
        const rules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^1[3-9]\d{9}$/,
            url: /^https?:\/\/.+/
        };
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', () => {
                const type = input.type;
                const val = input.value.trim();
                if (!val) return;
                let valid = true;
                if (type === 'email' && !rules.email.test(val)) valid = false;
                if (input.name?.includes('phone') && !rules.phone.test(val)) valid = false;
                input.style.borderColor = valid ? '#4ade80' : '#ff4757';
            });
        });
    }
});
