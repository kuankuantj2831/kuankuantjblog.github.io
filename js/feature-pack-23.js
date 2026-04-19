/**
 * 功能包 #23: 图表与数据可视化 (111-115)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 111. 柱状图渲染
FeaturePack.register('fp111_bar_chart', {
    name: '柱状图', desc: '将表格数据转为柱状图',
    page: 'article',
    initFn() {
        document.querySelectorAll('table[data-chart="bar"]').forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            if (rows.length === 0) return;
            const chart = el('div', { display:'flex',alignItems:'flex-end',gap:'8px',height:'150px',padding:'20px',background:'#f8f9ff',borderRadius:'10px',marginTop:'10px' });
            const values = Array.from(rows).map(r => {
                const cells = r.querySelectorAll('td');
                return { label: cells[0]?.textContent || '', value: parseFloat(cells[1]?.textContent) || 0 };
            });
            const max = Math.max(...values.map(v => v.value));
            values.forEach(v => {
                const bar = el('div', { display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',flex:'1' });
                bar.innerHTML = `<div style="width:100%;background:linear-gradient(180deg,#667eea,#764ba2);border-radius:4px 4px 0 0;transition:height .5s" data-height="${(v.value/max*100)}"></div><div style="font-size:10px;color:#666">${v.label}</div>`;
                chart.appendChild(bar);
                setTimeout(() => bar.querySelector('div').style.height = (v.value/max*100) + 'px', 100);
            });
            table.insertAdjacentElement('afterend', chart);
        });
    }
});

// 112. 饼图渲染
FeaturePack.register('fp112_pie_chart', {
    name: '饼图', desc: '将表格数据转为饼图',
    page: 'article',
    initFn() {
        document.querySelectorAll('table[data-chart="pie"]').forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            const data = Array.from(rows).map(r => {
                const cells = r.querySelectorAll('td');
                return { label: cells[0]?.textContent || '', value: parseFloat(cells[1]?.textContent) || 0 };
            });
            const total = data.reduce((s, d) => s + d.value, 0);
            const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4'];
            let currentAngle = 0;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '200'); svg.setAttribute('height', '200'); svg.setAttribute('viewBox', '0 0 200 200');
            data.forEach((d, i) => {
                const angle = (d.value / total) * 360;
                const rad = Math.PI / 180;
                const x1 = 100 + 80 * Math.cos(currentAngle * rad);
                const y1 = 100 + 80 * Math.sin(currentAngle * rad);
                const x2 = 100 + 80 * Math.cos((currentAngle + angle) * rad);
                const y2 = 100 + 80 * Math.sin((currentAngle + angle) * rad);
                const largeArc = angle > 180 ? 1 : 0;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z`);
                path.setAttribute('fill', colors[i % colors.length]);
                svg.appendChild(path);
                currentAngle += angle;
            });
            const container = el('div', { display:'flex',justifyContent:'center',marginTop:'10px' });
            container.appendChild(svg);
            table.insertAdjacentElement('afterend', container);
        });
    }
});

// 113. 折线图
FeaturePack.register('fp113_line_chart', {
    name: '折线图', desc: '将数据转为折线图',
    page: 'article',
    initFn() {
        document.querySelectorAll('table[data-chart="line"]').forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            const data = Array.from(rows).map(r => parseFloat(r.querySelectorAll('td')[1]?.textContent) || 0);
            if (data.length < 2) return;
            const canvas = el('canvas', { width:'400',height:'150' });
            const ctx = canvas.getContext('2d');
            const max = Math.max(...data);
            const step = canvas.width / (data.length - 1);
            ctx.beginPath();
            ctx.strokeStyle = '#667eea'; ctx.lineWidth = 2;
            data.forEach((v, i) => {
                const x = i * step;
                const y = canvas.height - (v / max) * (canvas.height - 20) - 10;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            data.forEach((v, i) => {
                const x = i * step;
                const y = canvas.height - (v / max) * (canvas.height - 20) - 10;
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#667eea'; ctx.fill();
            });
            const container = el('div', { display:'flex',justifyContent:'center',marginTop:'10px',padding:'15px',background:'#f8f9ff',borderRadius:'10px' });
            container.appendChild(canvas);
            table.insertAdjacentElement('afterend', container);
        });
    }
});

// 114. 进度环
FeaturePack.register('fp114_progress_ring', {
    name: '进度环', desc: '圆形进度指示器',
    initFn() {
        document.querySelectorAll('[data-progress]').forEach(el => {
            const pct = parseInt(el.dataset.progress) || 0;
            const size = 60;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', size); svg.setAttribute('height', size);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', size/2); circle.setAttribute('cy', size/2); circle.setAttribute('r', size/2-5);
            circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#eee'); circle.setAttribute('stroke-width', '6');
            svg.appendChild(circle);
            const prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            prog.setAttribute('cx', size/2); prog.setAttribute('cy', size/2); prog.setAttribute('r', size/2-5);
            prog.setAttribute('fill', 'none'); prog.setAttribute('stroke', '#667eea'); prog.setAttribute('stroke-width', '6');
            prog.setAttribute('stroke-dasharray', `${2*Math.PI*(size/2-5)}`);
            prog.setAttribute('stroke-dashoffset', `${2*Math.PI*(size/2-5)*(1-pct/100)}`);
            prog.setAttribute('stroke-linecap', 'round');
            prog.style.transform = 'rotate(-90deg)'; prog.style.transformOrigin = 'center';
            svg.appendChild(prog);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', size/2); text.setAttribute('y', size/2+5); text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#667eea'); text.setAttribute('font-size', '14'); text.setAttribute('font-weight', 'bold');
            text.textContent = pct + '%';
            svg.appendChild(text);
            el.innerHTML = ''; el.appendChild(svg);
        });
    }
});

// 115. 仪表盘
FeaturePack.register('fp115_dashboard', {
    name: '迷你仪表盘', desc: '显示网站统计仪表盘',
    page: 'index',
    initFn() {
        const div = el('div', {
            display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'15px',
            padding:'20px',maxWidth:'1200px',margin:'0 auto'
        });
        const stats = [
            { icon:'📚', label:'文章', value:util.rand(50,500) },
            { icon:'👁️', label:'访问', value:util.rand(1000,50000) },
            { icon:'👥', label:'用户', value:util.rand(100,5000) },
            { icon:'💬', label:'评论', value:util.rand(50,2000) },
        ];
        div.innerHTML = stats.map(s => `<div style="text-align:center;padding:20px;background:white;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)"><div style="font-size:28px;margin-bottom:4px">${s.icon}</div><div style="font-size:24px;font-weight:700;color:#667eea">${s.value.toLocaleString()}</div><div style="font-size:12px;color:#999">${s.label}</div></div>`).join('');
        const hero = document.querySelector('.hero-section');
        if (hero) hero.insertAdjacentElement('afterend', div);
    }
});
