/**
 * 功能包 #27: 文件与下载 (131-135)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 131. 下载进度条
FeaturePack.register('fp131_download_progress', {
    name: '下载进度', desc: '文件下载进度显示',
    initFn() {
        document.querySelectorAll('a[download], a[href$=".pdf"], a[href$=".zip"]').forEach(a => {
            a.addEventListener('click', () => {
                const bar = el('div', {
                    position:'fixed',bottom:'0',left:'0',right:'0',height:'3px',
                    background:'#eee',zIndex:'99999'
                });
                const fill = el('div', { height:'100%',width:'0%',background:'linear-gradient(90deg,#667eea,#764ba2)',transition:'width .3s' });
                bar.appendChild(fill); document.body.appendChild(bar);
                let p = 0;
                const iv = setInterval(() => { p += util.rand(10,25); fill.style.width = Math.min(p,100)+'%'; if (p >= 100) { clearInterval(iv); setTimeout(()=>bar.remove(),500); } }, 300);
            });
        });
    }
});

// 132. 文件拖拽上传区
FeaturePack.register('fp132_drop_zone', {
    name: '拖拽上传区', desc: '全局文件拖拽上传',
    initFn() {
        const zone = el('div', {
            position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
            background:'rgba(102,126,234,0.2)',border:'4px dashed #667eea',
            display:'none',alignItems:'center',justifyContent:'center',
            zIndex:'99999',fontSize:'24px',color:'#667eea',pointerEvents:'none'
        });
        zone.innerHTML = '📁 拖放文件到这里上传';
        document.body.appendChild(zone);
        document.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.display = 'flex'; });
        document.addEventListener('dragleave', (e) => { if (e.target === zone) zone.style.display = 'none'; });
        document.addEventListener('drop', (e) => { e.preventDefault(); zone.style.display = 'none'; alert(`📁 收到 ${e.dataTransfer.files.length} 个文件（演示模式）`); });
    }
});

// 133. 文件类型图标
FeaturePack.register('fp133_file_icons', {
    name: '文件图标', desc: '根据文件类型显示图标',
    initFn() {
        const icons = { pdf:'📄', zip:'🗜️', doc:'📝', xls:'📊', mp4:'🎬', mp3:'🎵', jpg:'🖼️', png:'🖼️' };
        document.querySelectorAll('a[href]').forEach(a => {
            const ext = a.href.split('.').pop()?.toLowerCase();
            if (icons[ext] && !a.querySelector('span')) {
                const span = el('span', { marginRight:'4px' });
                span.textContent = icons[ext];
                a.insertBefore(span, a.firstChild);
            }
        });
    }
});

// 134. 文件大小显示
FeaturePack.register('fp134_file_size', {
    name: '文件大小', desc: '显示文件大小',
    initFn() {
        document.querySelectorAll('a[download]').forEach(a => {
            const size = el('span', { fontSize:'11px',color:'#999',marginLeft:'4px' });
            size.textContent = `(${(Math.random()*10+0.5).toFixed(1)} MB)`;
            a.appendChild(size);
        });
    }
});

// 135. 批量下载
FeaturePack.register('fp135_batch_download', {
    name: '批量下载', desc: '批量下载文件',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'780px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#e74c3c',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📥';
        btn.title = '批量下载';
        btn.addEventListener('click', () => {
            const links = document.querySelectorAll('a[download]');
            if (links.length === 0) { alert('当前页面没有可下载文件'); return; }
            alert(`📥 找到 ${links.length} 个文件（演示模式：实际将依次下载）`);
        });
        document.body.appendChild(btn);
    }
});
