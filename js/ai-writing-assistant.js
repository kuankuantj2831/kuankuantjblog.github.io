/**
 * AI智能写作助手
 * 功能：生成摘要、续写、润色、生成标题、生成标签
 */
import { API_BASE_URL } from './api-config.js?v=20260419b';

class AIWritingAssistant {
    constructor(options = {}) {
        this.editor = options.editor;
        this.token = options.token;
        this.container = null;
        this.isProcessing = false;
    }

    // 初始化并添加到编辑器
    init() {
        this.createUIButton();
    }

    createUIButton() {
        // 在编辑器工具栏添加AI按钮
        const toolbar = document.querySelector('.md-toolbar');
        if (!toolbar) return;

        const aiBtn = document.createElement('button');
        aiBtn.type = 'button';
        aiBtn.className = 'toolbar-btn ai-btn';
        aiBtn.title = 'AI写作助手';
        aiBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
        `;
        aiBtn.style.cssText = 'color: #667eea; position: relative;';

        // 添加分隔线和AI按钮组
        const aiGroup = document.createElement('div');
        aiGroup.className = 'toolbar-group ai-toolbar-group';
        aiGroup.innerHTML = `
            <div class="toolbar-divider"></div>
            <button type="button" class="toolbar-btn" data-ai-action="summary" title="生成摘要">
                <span style="font-size: 11px;">摘要</span>
            </button>
            <button type="button" class="toolbar-btn" data-ai-action="continue" title="续写文章">
                <span style="font-size: 11px;">续写</span>
            </button>
            <button type="button" class="toolbar-btn" data-ai-action="polish" title="润色文字">
                <span style="font-size: 11px;">润色</span>
            </button>
            <button type="button" class="toolbar-btn" data-ai-action="title" title="生成标题">
                <span style="font-size: 11px;">标题</span>
            </button>
            <button type="button" class="toolbar-btn" data-ai-action="tags" title="生成标签">
                <span style="font-size: 11px;">标签</span>
            </button>
        `;

        toolbar.appendChild(aiGroup);

        // 绑定AI按钮事件
        aiGroup.querySelectorAll('[data-ai-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.aiAction;
                this.handleAIAction(action);
            });
        });

        // 创建AI结果面板
        this.createResultPanel();
    }

    createResultPanel() {
        const panel = document.createElement('div');
        panel.id = 'ai-result-panel';
        panel.className = 'ai-result-panel';
        panel.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-height: 80vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 3000;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        panel.innerHTML = `
            <div class="ai-panel-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            ">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                    <span style="margin-right: 8px;">🤖</span>AI写作助手
                </h3>
                <button type="button" class="ai-panel-close" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    line-height: 1;
                ">&times;</button>
            </div>
            <div class="ai-panel-body" style="padding: 20px; max-height: 60vh; overflow: auto;">
                <div class="ai-loading" style="text-align: center; padding: 40px; display: none;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid #f3f3f3;
                        border-top-color: #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <p style="color: #666; margin: 0;">AI正在思考中...</p>
                </div>
                <div class="ai-content" style="display: none;">
                    <div class="ai-result-text" style="
                        background: #f8f9fa;
                        padding: 16px;
                        border-radius: 8px;
                        line-height: 1.8;
                        margin-bottom: 16px;
                        white-space: pre-wrap;
                    "></div>
                    <div class="ai-actions" style="display: flex; gap: 10px;">
                        <button type="button" class="ai-btn-insert" style="
                            flex: 1;
                            padding: 10px;
                            background: #667eea;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">插入内容</button>
                        <button type="button" class="ai-btn-copy" style="
                            padding: 10px 20px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">复制</button>
                        <button type="button" class="ai-btn-regenerate" style="
                            padding: 10px 20px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">重新生成</button>
                    </div>
                </div>
                <div class="ai-title-suggestions" style="display: none;">
                    <div class="ai-titles-list" style="margin-bottom: 16px;"></div>
                    <button type="button" class="ai-btn-regenerate" style="
                        width: 100%;
                        padding: 10px;
                        background: #f0f0f0;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">重新生成</button>
                </div>
                <div class="ai-tags-suggestions" style="display: none;">
                    <div class="ai-tags-list" style="margin-bottom: 16px;"></div>
                    <button type="button" class="ai-btn-regenerate" style="
                        width: 100%;
                        padding: 10px;
                        background: #f0f0f0;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">重新生成</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 绑定关闭事件
        panel.querySelector('.ai-panel-close').addEventListener('click', () => {
            this.hidePanel();
        });

        // 点击遮罩关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hidePanel();
            }
        });

        // 绑定操作按钮事件
        panel.querySelector('.ai-btn-insert').addEventListener('click', () => {
            this.insertResult();
        });

        panel.querySelector('.ai-btn-copy').addEventListener('click', () => {
            this.copyResult();
        });

        panel.querySelectorAll('.ai-btn-regenerate').forEach(btn => {
            btn.addEventListener('click', () => {
                this.regenerate();
            });
        });

        this.panel = panel;
        this.currentAction = null;
        this.currentResult = null;

        // 添加动画样式
        if (!document.getElementById('ai-animations')) {
            const style = document.createElement('style');
            style.id = 'ai-animations';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .ai-result-panel.show {
                    display: block !important;
                    animation: fadeIn 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async handleAIAction(action) {
        const textarea = document.getElementById('md-textarea');
        const content = textarea.value;
        const title = document.getElementById('articleTitle')?.value || '';

        // 检查内容长度
        const minLength = action === 'polish' ? 10 : 50;
        if (content.length < minLength) {
            alert(action === 'polish' ? '内容太短，无法润色' : '文章内容太短，请至少输入50字');
            return;
        }

        this.currentAction = action;
        this.showPanel(action);

        try {
            await this.callAIAPI(action, content, title);
        } catch (error) {
            console.error('AI调用失败:', error);
            this.showError('AI服务暂时不可用，请稍后再试');
        }
    }

    async callAIAPI(action, content, title) {
        this.showLoading();

        const endpoints = {
            summary: '/ai/summary',
            continue: '/ai/continue',
            polish: '/ai/polish',
            title: '/ai/title-suggestions',
            tags: '/ai/tags-suggestions'
        };

        const body = {
            summary: { content, maxLength: 150 },
            continue: { content, style: 'normal', length: 200 },
            polish: { content, style: 'improve' },
            title: { content, currentTitle: title },
            tags: { content, title }
        };

        const response = await fetch(`${API_BASE_URL}${endpoints[action]}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(body[action])
        });

        if (!response.ok) {
            throw new Error('API调用失败');
        }

        const data = await response.json();
        this.currentResult = data;

        // 根据不同动作显示结果
        switch (action) {
            case 'summary':
                this.showTextResult(data.summary, '摘要生成成功');
                break;
            case 'continue':
                this.showTextResult(data.continuation, '续写完成');
                break;
            case 'polish':
                this.showTextResult(data.polished, '润色完成');
                break;
            case 'title':
                this.showTitleSuggestions(data.suggestions);
                break;
            case 'tags':
                this.showTagSuggestions(data.suggestions);
                break;
        }
    }

    showPanel(action) {
        this.panel.classList.add('show');

        // 重置显示状态
        this.panel.querySelector('.ai-loading').style.display = 'none';
        this.panel.querySelector('.ai-content').style.display = 'none';
        this.panel.querySelector('.ai-title-suggestions').style.display = 'none';
        this.panel.querySelector('.ai-tags-suggestions').style.display = 'none';
    }

    hidePanel() {
        this.panel.classList.remove('show');
    }

    showLoading() {
        this.panel.querySelector('.ai-loading').style.display = 'block';
        this.panel.querySelector('.ai-content').style.display = 'none';
        this.panel.querySelector('.ai-title-suggestions').style.display = 'none';
        this.panel.querySelector('.ai-tags-suggestions').style.display = 'none';
    }

    showTextResult(text, label) {
        this.panel.querySelector('.ai-loading').style.display = 'none';
        this.panel.querySelector('.ai-content').style.display = 'block';

        const resultDiv = this.panel.querySelector('.ai-result-text');
        resultDiv.innerHTML = `<div style="color: #667eea; font-size: 12px; margin-bottom: 8px;">${label}</div>${this.escapeHtml(text)}`;
    }

    showTitleSuggestions(titles) {
        this.panel.querySelector('.ai-loading').style.display = 'none';
        this.panel.querySelector('.ai-title-suggestions').style.display = 'block';

        const listDiv = this.panel.querySelector('.ai-titles-list');
        listDiv.innerHTML = titles.map((title, index) => `
            <div class="ai-title-item" style="
                padding: 12px;
                margin-bottom: 8px;
                background: #f8f9fa;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            " data-title="${this.escapeHtml(title)}">
                <span style="flex: 1;">${this.escapeHtml(title)}</span>
                <button type="button" class="ai-use-title" style="
                    padding: 4px 12px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                ">使用</button>
            </div>
        `).join('');

        // 绑定使用标题事件
        listDiv.querySelectorAll('.ai-use-title').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                document.getElementById('articleTitle').value = titles[index];
                this.hidePanel();
                this.showToast('标题已更新');
            });
        });
    }

    showTagSuggestions(tags) {
        this.panel.querySelector('.ai-loading').style.display = 'none';
        this.panel.querySelector('.ai-tags-suggestions').style.display = 'block';

        const listDiv = this.panel.querySelector('.ai-tags-list');
        const currentTags = document.getElementById('articleTags')?.value || '';
        const currentTagList = currentTags.split(/[,，]/).map(t => t.trim()).filter(t => t);

        listDiv.innerHTML = `
            <div style="margin-bottom: 12px; color: #666; font-size: 13px;">
                点击标签添加，灰色标签已添加
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${tags.map(tag => {
                    const isAdded = currentTagList.includes(tag);
                    return `
                        <span class="ai-tag-item ${isAdded ? 'added' : ''}" style="
                            display: inline-block;
                            padding: 6px 12px;
                            background: ${isAdded ? '#e9ecef' : '#667eea'};
                            color: ${isAdded ? '#666' : 'white'};
                            border-radius: 16px;
                            font-size: 13px;
                            cursor: ${isAdded ? 'default' : 'pointer'};
                            transition: all 0.2s;
                        " data-tag="${this.escapeHtml(tag)}">
                            ${this.escapeHtml(tag)}
                        </span>
                    `;
                }).join('')}
            </div>
        `;

        // 绑定标签点击事件
        listDiv.querySelectorAll('.ai-tag-item:not(.added)').forEach(span => {
            span.addEventListener('click', () => {
                const tag = span.dataset.tag;
                const input = document.getElementById('articleTags');
                const current = input.value.trim();
                input.value = current ? `${current}, ${tag}` : tag;
                span.style.background = '#e9ecef';
                span.style.color = '#666';
                span.style.cursor = 'default';
                span.classList.add('added');
            });
        });
    }

    showError(message) {
        this.panel.querySelector('.ai-loading').style.display = 'none';
        this.panel.querySelector('.ai-content').style.display = 'block';
        this.panel.querySelector('.ai-result-text').innerHTML = `
            <div style="color: #dc3545; text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 10px;">😔</div>
                ${message}
            </div>
        `;
    }

    insertResult() {
        if (!this.currentResult) return;

        const textarea = document.getElementById('md-textarea');
        let textToInsert = '';

        switch (this.currentAction) {
            case 'summary':
                textToInsert = this.currentResult.summary;
                break;
            case 'continue':
                textToInsert = this.currentResult.continuation;
                break;
            case 'polish':
                textToInsert = this.currentResult.polished;
                break;
        }

        if (textToInsert) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            if (this.currentAction === 'polish' && start !== end) {
                // 润色模式：替换选中的文本
                textarea.setRangeText(textToInsert, start, end, 'end');
            } else {
                // 其他模式：在光标位置插入
                textarea.setRangeText(textToInsert, start, start, 'end');
            }

            // 触发input事件更新编辑器
            textarea.dispatchEvent(new Event('input'));
            this.hidePanel();
            this.showToast('内容已插入');
        }
    }

    copyResult() {
        if (!this.currentResult) return;

        let textToCopy = '';
        switch (this.currentAction) {
            case 'summary':
                textToCopy = this.currentResult.summary;
                break;
            case 'continue':
                textToCopy = this.currentResult.continuation;
                break;
            case 'polish':
                textToCopy = this.currentResult.polished;
                break;
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showToast('已复制到剪贴板');
            });
        }
    }

    async regenerate() {
        const textarea = document.getElementById('md-textarea');
        const content = textarea.value;
        const title = document.getElementById('articleTitle')?.value || '';

        try {
            await this.callAIAPI(this.currentAction, content, title);
        } catch (error) {
            this.showError('重新生成失败，请稍后再试');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 4000;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default AIWritingAssistant;
