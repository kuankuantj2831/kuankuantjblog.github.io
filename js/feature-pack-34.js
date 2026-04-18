/**
 * 功能包 #34: 数学与公式 (166-170)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 166. 计算器
FeaturePack.register('fp166_calculator', {
    name: '计算器', desc: '迷你计算器',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1130px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#34495e',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🧮';
        btn.title = '计算器';
        btn.addEventListener('click', () => {
            const expr = prompt('🧮 计算器\n输入算式（如：2+3*4）：');
            if (!expr) return;
            try {
                const result = Function('"use strict"; return (' + expr + ')')();
                alert(`${expr} = ${result}`);
            } catch (e) { alert('计算错误'); }
        });
        document.body.appendChild(btn);
    }
});

// 167. 单位转换器
FeaturePack.register('fp167_unit_converter', {
    name: '单位转换', desc: '常用单位转换',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1180px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#16a085',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📐';
        btn.title = '单位转换';
        btn.addEventListener('click', () => {
            const val = parseFloat(prompt('输入数值（米）：'));
            if (isNaN(val)) return;
            alert(`📐 单位转换\n${val} 米 = ${(val*3.28084).toFixed(2)} 英尺\n${val} 米 = ${(val/1000).toFixed(2)} 公里`);
        });
        document.body.appendChild(btn);
    }
});

// 168. 随机数生成器
FeaturePack.register('fp168_random_gen', {
    name: '随机数', desc: '生成随机数',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1230px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#8e44ad',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🎲';
        btn.title = '随机数';
        btn.addEventListener('click', () => {
            const min = parseInt(prompt('最小值：') || '1');
            const max = parseInt(prompt('最大值：') || '100');
            alert(`🎲 随机数：${util.rand(min, max)}`);
        });
        document.body.appendChild(btn);
    }
});

// 169. 密码生成器
FeaturePack.register('fp169_password_gen', {
    name: '密码生成', desc: '生成强密码',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1280px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#c0392b',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🔐';
        btn.title = '密码生成';
        btn.addEventListener('click', () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            let pwd = '';
            for (let i = 0; i < 16; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
            alert(`🔐 生成的密码：${pwd}\n\n已复制到剪贴板（演示）`);
        });
        document.body.appendChild(btn);
    }
});

// 170. BMI计算器
FeaturePack.register('fp170_bmi_calc', {
    name: 'BMI计算', desc: '身体质量指数计算',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1330px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#27ae60',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '⚖️';
        btn.title = 'BMI计算';
        btn.addEventListener('click', () => {
            const h = parseFloat(prompt('身高（cm）：'));
            const w = parseFloat(prompt('体重（kg）：'));
            if (!h || !w) return;
            const bmi = (w / ((h/100) ** 2)).toFixed(1);
            let status;
            if (bmi < 18.5) status = '偏瘦';
            else if (bmi < 24) status = '正常';
            else if (bmi < 28) status = '偏胖';
            else status = '肥胖';
            alert(`⚖️ BMI：${bmi}\n状态：${status}`);
        });
        document.body.appendChild(btn);
    }
});
