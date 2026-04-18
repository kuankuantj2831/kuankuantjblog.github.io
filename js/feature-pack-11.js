/**
 * 功能包 #11: 编辑器增强 (51-55)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 51. 自动保存提示
FeaturePack.register('fp51_auto_save', {
    name: '自动保存提示', desc: '编辑器自动保存状态',
    page: 'editor',
    initFn() {
        const textarea = document.querySelector('textarea, .editor');
        if (!textarea) return;
        const status = el('span', { fontSize:'12px',color:'#999',marginLeft:'10px' });
        status.textContent = '';
        textarea.parentElement.appendChild(status);
        let timer;
        textarea.addEventListener('input', () => {
            status.textContent = '编辑中...';
            status.style.color = '#f5af19';
            clearTimeout(timer);
            timer = setTimeout(() => {
                util.storage.set('draft_' + Date.now(), textarea.value);
                status.textContent = '✓ 已自动保存';
                status.style.color = '#4ade80';
                setTimeout(() => status.textContent = '', 2000);
            }, 2000);
        });
    }
});

// 52. Markdown快捷工具栏
FeaturePack.register('fp52_md_toolbar', {
    name: 'MD工具栏', desc: '编辑器快捷格式按钮',
    page: 'editor',
    initFn() {
        const textarea = document.querySelector('textarea, .editor');
        if (!textarea) return;
        const toolbar = el('div', { marginBottom:'8px',display:'flex',gap:'4px',flexWrap:'wrap' });
        const actions = [
            { label:'B', tip:'加粗', wrap:['**','**'] },
            { label:'I', tip:'斜体', wrap:['*','*'] },
            { label:'H', tip:'标题', wrap:['## ',''] },
            { label:'```', tip:'代码块', wrap:['\n```\n','\n```\n'] },
            { label:'🔗', tip:'链接', wrap:['[','](url)'] },
            { label:'🖼️', tip:'图片', wrap:['![alt](',')'] },
            { label:'- ', tip:'列表', wrap:['- ',''] },
            { label:'> ', tip:'引用', wrap:['> ',''] },
        ];
        actions.forEach(a => {
            const btn = el('button', {
                width:'32px',height:'32px',border:'1px solid #e0e0e0',borderRadius:'6px',
                background:'white',fontSize:'13px',cursor:'pointer'
            });
            btn.innerHTML = a.label;
            btn.title = a.tip;
            btn.addEventListener('click', () => {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = a.wrap[0] + (selected || a.tip) + a.wrap[1];
                textarea.value = text.substring(0, start) + replacement + text.substring(end);
                textarea.focus();
                textarea.setSelectionRange(start + a.wrap[0].length, start + a.wrap[0].length + (selected || a.tip).length);
            });
            toolbar.appendChild(btn);
        });
        textarea.parentElement.insertBefore(toolbar, textarea);
    }
});

// 53. 实时预览分屏
FeaturePack.register('fp53_live_preview', {
    name: '实时预览', desc: '编辑器实时预览',
    page: 'editor',
    initFn() {
        const textarea = document.querySelector('textarea, .editor');
        if (!textarea) return;
        const preview = el('div', {
            border:'1px solid #e0e0e0',borderRadius:'8px',padding:'16px',
            minHeight:'200px',background:'white',fontSize:'14px',
            lineHeight:'1.8',overflow:'auto'
        });
        preview.innerHTML = '<div style="color:#ccc">预览区域</div>';
        textarea.addEventListener('input', util.debounce(() => {
            preview.innerHTML = simpleMarkdown(textarea.value);
        }, 300));
        textarea.parentElement.appendChild(preview);
    }
});

function simpleMarkdown(text) {
    return text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#667eea">$1</a>')
        .replace(/\n/g, '<br>');
}

// 54. 字数统计实时
FeaturePack.register('fp54_live_word_count', {
    name: '实时字数', desc: '编辑器实时字数统计',
    page: 'editor',
    initFn() {
        const textarea = document.querySelector('textarea, .editor');
        if (!textarea) return;
        const counter = el('div', {
            fontSize:'12px',color:'#999',marginTop:'6px',display:'flex',gap:'15px'
        });
        textarea.parentElement.appendChild(counter);
        textarea.addEventListener('input', () => {
            const text = textarea.value;
            counter.innerHTML = `
                <span>📝 ${text.length} 字符</span>
                <span>📄 ${text.trim().split(/\s+/).filter(Boolean).length} 词</span>
                <span>📋 ${text.split('\n').filter(Boolean).length} 行</span>
            `;
        });
    }
});

// 55. 图片拖拽上传
FeaturePack.register('fp55_drag_upload', {
    name: '拖拽上传', desc: '拖拽图片到编辑器上传',
    page: 'editor',
    initFn() {
        const textarea = document.querySelector('textarea, .editor');
        if (!textarea) return;
        textarea.addEventListener('dragover', (e) => { e.preventDefault(); textarea.style.border = '2px dashed #667eea'; });
        textarea.addEventListener('dragleave', () => { textarea.style.border = ''; });
        textarea.addEventListener('drop', (e) => {
            e.preventDefault(); textarea.style.border = '';
            const files = e.dataTransfer.files;
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const insert = `\n![${file.name}](${ev.target.result})\n`;
                        const pos = textarea.selectionStart;
                        textarea.value = textarea.value.slice(0, pos) + insert + textarea.value.slice(pos);
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }
});
