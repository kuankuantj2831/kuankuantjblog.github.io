/**
 * 代码块复制按钮 - 轻量版
 * 为代码块添加复制按钮，不影响页面布局
 */

(function() {
    'use strict';
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // 查找所有代码块
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(function(codeBlock) {
            const pre = codeBlock.parentElement;
            
            // 确保pre有相对定位
            if (getComputedStyle(pre).position === 'static') {
                pre.style.position = 'relative';
            }
            
            // 创建复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerHTML = '📋 复制';
            copyBtn.title = '复制代码';
            
            // 添加样式
            copyBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 4px 12px;
                font-size: 12px;
                color: #666;
                background: rgba(255,255,255,0.9);
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s, background 0.3s;
                z-index: 10;
            `;
            
            // 鼠标悬停时显示按钮
            pre.addEventListener('mouseenter', function() {
                copyBtn.style.opacity = '1';
            });
            
            pre.addEventListener('mouseleave', function() {
                copyBtn.style.opacity = '0';
            });
            
            // 复制功能
            copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const code = codeBlock.textContent || codeBlock.innerText;
                
                navigator.clipboard.writeText(code).then(function() {
                    copyBtn.innerHTML = '✅ 已复制';
                    copyBtn.style.background = '#4caf50';
                    copyBtn.style.color = '#fff';
                    
                    setTimeout(function() {
                        copyBtn.innerHTML = '📋 复制';
                        copyBtn.style.background = 'rgba(255,255,255,0.9)';
                        copyBtn.style.color = '#666';
                    }, 2000);
                }).catch(function() {
                    // 降级方案
                    const textarea = document.createElement('textarea');
                    textarea.value = code;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    copyBtn.innerHTML = '✅ 已复制';
                    setTimeout(function() {
                        copyBtn.innerHTML = '📋 复制';
                    }, 2000);
                });
            });
            
            pre.appendChild(copyBtn);
        });
    }
})();