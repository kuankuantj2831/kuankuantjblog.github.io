/**
 * 增强版Markdown编辑器
 * 功能：Markdown工具栏、实时预览、自动保存、版本历史
 */
import { API_BASE_URL } from './api-config.js?v=20260223b';

class MarkdownEditor {
    constructor(options = {}) {
        this.container = options.container;
        this.content = options.content || '';
        this.articleId = options.articleId || null; // null表示新文章
        this.userId = options.userId;
        this.token = options.token;
        this.onSave = options.onSave || (() => {});
        this.onChange = options.onChange || (() => {});
        
        // 配置
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.previewDelay = 300; // 预览更新延迟
        
        // 状态
        this.lastSavedContent = this.content;
        this.lastSavedAt = null;
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.previewTimer = null;
        this.currentMode = 'split'; // split, edit, preview
        
        // 初始化
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
        this.startAutoSave();
        this.restoreDraft();
        this.updatePreview();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="md-editor-wrapper">
                <!-- 工具栏 -->
                <div class="md-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="bold" title="粗体 (Ctrl+B)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="italic" title="斜体 (Ctrl+I)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="4" x2="10" y2="4"></line>
                                <line x1="14" y1="20" x2="5" y2="20"></line>
                                <line x1="15" y1="4" x2="9" y2="20"></line>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="strikethrough" title="删除线">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17.3 19c-1.4 1.4-3.3 2-5.3 2s-4-.6-5.3-2"></path>
                                <path d="M5.7 5c1.4-1.4 3.3-2 5.3-2s4 .6 5.3 2"></path>
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="heading" title="标题">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 12h12"></path>
                                <path d="M6 20V4"></path>
                                <path d="M18 20V4"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="quote" title="引用">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="code" title="代码块">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="inline-code" title="行内代码">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                                <path d="M9 9l6 6"></path>
                                <path d="M15 9l-6 6"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="ul" title="无序列表">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="ol" title="有序列表">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="10" y1="6" x2="21" y2="6"></line>
                                <line x1="10" y1="12" x2="21" y2="12"></line>
                                <line x1="10" y1="18" x2="21" y2="18"></line>
                                <path d="M4 6h1v4"></path>
                                <path d="M4 10h2"></path>
                                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="task" title="任务列表">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="9" y1="6" x2="20" y2="6"></line>
                                <line x1="9" y1="12" x2="20" y2="12"></line>
                                <line x1="9" y1="18" x2="20" y2="18"></line>
                                <polyline points="3 6 4 7 6 5"></polyline>
                                <polyline points="3 12 4 13 6 11"></polyline>
                                <polyline points="3 18 4 19 6 17"></polyline>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="link" title="插入链接">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="image" title="插入图片">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="table" title="插入表格">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="12" y1="3" x2="12" y2="21"></line>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="hr" title="分隔线">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn ${this.currentMode === 'edit' ? 'active' : ''}" data-action="mode-edit" title="仅编辑">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn ${this.currentMode === 'split' ? 'active' : ''}" data-action="mode-split" title="分屏预览">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="12" y1="3" x2="12" y2="21"></line>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn ${this.currentMode === 'preview' ? 'active' : ''}" data-action="mode-preview" title="仅预览">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn ai-btn" data-action="ai-summary" title="AI生成摘要">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn ai-btn" data-action="ai-continue" title="AI续写">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn ai-btn" data-action="ai-polish" title="AI润色">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="undo" title="撤销 (Ctrl+Z)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 7v6h6"></path>
                                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="redo" title="重做 (Ctrl+Y)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 7v6h-6"></path>
                                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="help" title="Markdown语法帮助">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- 编辑器主体 -->
                <div class="md-editor-body mode-${this.currentMode}">
                    <div class="md-editor-pane md-editor-input-pane">
                        <textarea 
                            class="md-textarea" 
                            id="md-textarea"
                            placeholder="# 标题&#10;&#10;开始你的创作...&#10;&#10;支持拖拽图片、粘贴截图"
                        >${this.escapeHtml(this.content)}</textarea>
                        <div class="editor-status">
                            <span class="word-count">0 字</span>
                            <span class="save-status">准备就绪</span>
                        </div>
                    </div>
                    <div class="md-editor-pane md-editor-preview-pane">
                        <div class="md-preview" id="md-preview"></div>
                    </div>
                </div>
                
                <!-- 底部工具栏 -->
                <div class="md-editor-footer">
                    <div class="footer-left">
                        <span class="last-saved">上次保存: 从未</span>
                    </div>
                    <div class="footer-right">
                        <button type="button" class="btn-save-draft" id="btn-save-draft">保存草稿</button>
                        <button type="button" class="btn-versions" id="btn-versions">版本历史</button>
                    </div>
                </div>
            </div>
            
            <!-- 版本历史侧边栏 -->
            <div class="version-sidebar" id="version-sidebar">
                <div class="version-header">
                    <h3>版本历史</h3>
                    <button type="button" class="btn-close-versions" id="btn-close-versions">&times;</button>
                </div>
                <div class="version-list" id="version-list">
                    <div class="version-empty">暂无历史版本</div>
                </div>
            </div>
            
            <!-- 帮助弹窗 -->
            <div class="md-help-modal" id="md-help-modal">
                <div class="md-help-content">
                    <div class="md-help-header">
                        <h3>Markdown 语法帮助</h3>
                        <button type="button" class="btn-close-help" id="btn-close-help">&times;</button>
                    </div>
                    <div class="md-help-body">
                        <table class="md-help-table">
                            <tr><td><code># 标题</code></td><td>一级标题</td></tr>
                            <tr><td><code>## 标题</code></td><td>二级标题</td></tr>
                            <tr><td><code>**粗体**</code></td><td><strong>粗体</strong></td></tr>
                            <tr><td><code>*斜体*</code></td><td><em>斜体</em></td></tr>
                            <tr><td><code>~~删除~~</code></td><td><del>删除线</del></td></tr>
                            <tr><td><code>`代码`</code></td><td>行内代码</td></tr>
                            <tr><td><code>```代码块</code></td><td>代码块</td></tr>
                            <tr><td><code>> 引用</code></td><td>引用块</td></tr>
                            <tr><td><code>- 列表</code></td><td>无序列表</td></tr>
                            <tr><td><code>1. 列表</code></td><td>有序列表</td></tr>
                            <tr><td><code>- [ ] 任务</code></td><td>任务列表</td></tr>
                            <tr><td><code>[链接](url)</code></td><td>超链接</td></tr>
                            <tr><td><code>![图片](url)</code></td><td>图片</td></tr>
                            <tr><td><code>---</code></td><td>分隔线</td></tr>
                            <tr><td><code>|表格|表格|</code></td><td>表格</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        this.injectStyles();
    }
    
    injectStyles() {
        if (document.getElementById('md-editor-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'md-editor-styles';
        styles.textContent = `
            .md-editor-wrapper {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
                background: #fff;
            }
            
            /* 工具栏 */
            .md-toolbar {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .toolbar-group {
                display: flex;
                gap: 2px;
            }
            
            .toolbar-divider {
                width: 1px;
                height: 20px;
                background: #ddd;
                margin: 0 4px;
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border: none;
                background: transparent;
                border-radius: 4px;
                cursor: pointer;
                color: #666;
                transition: all 0.2s;
            }
            
            .toolbar-btn:hover {
                background: #e9ecef;
                color: #333;
            }
            
            .toolbar-btn.active {
                background: #667eea;
                color: #fff;
            }
            
            /* 编辑器主体 */
            .md-editor-body {
                display: flex;
                height: 500px;
            }
            
            .md-editor-body.mode-edit .md-editor-preview-pane {
                display: none;
            }
            
            .md-editor-body.mode-edit .md-editor-input-pane {
                width: 100%;
            }
            
            .md-editor-body.mode-preview .md-editor-input-pane {
                display: none;
            }
            
            .md-editor-body.mode-preview .md-editor-preview-pane {
                width: 100%;
            }
            
            .md-editor-body.mode-split .md-editor-input-pane,
            .md-editor-body.mode-split .md-editor-preview-pane {
                width: 50%;
            }
            
            .md-editor-pane {
                position: relative;
            }
            
            .md-editor-input-pane {
                border-right: 1px solid #e0e0e0;
                display: flex;
                flex-direction: column;
            }
            
            .md-textarea {
                flex: 1;
                width: 100%;
                padding: 16px;
                border: none;
                outline: none;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.8;
                resize: none;
                background: #fafafa;
            }
            
            .editor-status {
                display: flex;
                justify-content: space-between;
                padding: 8px 16px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
            }
            
            .save-status {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .save-status.saving::before {
                content: '';
                width: 12px;
                height: 12px;
                border: 2px solid #667eea;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .save-status.saved::before {
                content: '✓';
                color: #28a745;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .md-editor-preview-pane {
                overflow: auto;
                background: #fff;
            }
            
            .md-preview {
                padding: 16px;
                line-height: 1.8;
            }
            
            .md-preview h1, .md-preview h2, .md-preview h3,
            .md-preview h4, .md-preview h5, .md-preview h6 {
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.25;
            }
            
            .md-preview h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
            .md-preview h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
            .md-preview h3 { font-size: 1.25em; }
            .md-preview h4 { font-size: 1em; }
            .md-preview h5 { font-size: 0.875em; }
            .md-preview h6 { font-size: 0.85em; color: #6a737d; }
            
            .md-preview p { margin-bottom: 16px; }
            
            .md-preview blockquote {
                margin: 0 0 16px;
                padding: 0 16px;
                color: #6a737d;
                border-left: 4px solid #dfe2e5;
            }
            
            .md-preview code {
                padding: 2px 6px;
                background: #f6f8fa;
                border-radius: 3px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 85%;
            }
            
            .md-preview pre {
                margin-bottom: 16px;
                padding: 16px;
                overflow: auto;
                background: #f6f8fa;
                border-radius: 6px;
            }
            
            .md-preview pre code {
                padding: 0;
                background: transparent;
            }
            
            .md-preview ul, .md-preview ol {
                margin-bottom: 16px;
                padding-left: 2em;
            }
            
            .md-preview li + li {
                margin-top: 4px;
            }
            
            .md-preview li > ul, .md-preview li > ol {
                margin-top: 4px;
            }
            
            .md-preview table {
                width: 100%;
                margin-bottom: 16px;
                border-collapse: collapse;
            }
            
            .md-preview table th,
            .md-preview table td {
                padding: 6px 13px;
                border: 1px solid #dfe2e5;
            }
            
            .md-preview table th {
                background: #f6f8fa;
                font-weight: 600;
            }
            
            .md-preview table tr:nth-child(2n) {
                background: #f8f9fa;
            }
            
            .md-preview hr {
                height: 4px;
                padding: 0;
                margin: 24px 0;
                background: #e1e4e8;
                border: 0;
            }
            
            .md-preview img {
                max-width: 100%;
                height: auto;
            }
            
            .md-preview a {
                color: #667eea;
                text-decoration: none;
            }
            
            .md-preview a:hover {
                text-decoration: underline;
            }
            
            /* 任务列表 */
            .md-preview .task-list-item {
                list-style-type: none;
            }
            
            .md-preview .task-list-item input {
                margin-right: 8px;
            }
            
            /* 底部工具栏 */
            .md-editor-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
            }
            
            .last-saved {
                font-size: 12px;
                color: #666;
            }
            
            .btn-save-draft, .btn-versions {
                padding: 6px 12px;
                border: 1px solid #667eea;
                background: #fff;
                color: #667eea;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }
            
            .btn-save-draft:hover, .btn-versions:hover {
                background: #667eea;
                color: #fff;
            }
            
            /* 版本历史侧边栏 */
            .version-sidebar {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background: #fff;
                box-shadow: -2px 0 8px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                z-index: 1000;
                display: flex;
                flex-direction: column;
            }
            
            .version-sidebar.open {
                right: 0;
            }
            
            .version-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .version-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .btn-close-versions {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            
            .version-list {
                flex: 1;
                overflow: auto;
                padding: 16px;
            }
            
            .version-item {
                padding: 12px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .version-item:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            
            .version-item.current {
                border-color: #667eea;
                background: #f0f4ff;
            }
            
            .version-time {
                font-size: 13px;
                color: #333;
                font-weight: 500;
            }
            
            .version-meta {
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }
            
            .version-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            
            .version-btn {
                padding: 4px 8px;
                font-size: 12px;
                border: 1px solid #ddd;
                background: #fff;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .version-btn:hover {
                background: #f0f0f0;
            }
            
            .version-btn-primary {
                border-color: #667eea;
                color: #667eea;
            }
            
            .version-btn-primary:hover {
                background: #667eea;
                color: #fff;
            }
            
            .version-empty {
                text-align: center;
                color: #999;
                padding: 40px 20px;
            }
            
            /* 帮助弹窗 */
            .md-help-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 2000;
                align-items: center;
                justify-content: center;
            }
            
            .md-help-modal.show {
                display: flex;
            }
            
            .md-help-content {
                background: #fff;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow: auto;
            }
            
            .md-help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .md-help-header h3 {
                margin: 0;
            }
            
            .btn-close-help {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            
            .md-help-body {
                padding: 16px;
            }
            
            .md-help-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .md-help-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
            }
            
            .md-help-table td:first-child {
                width: 40%;
                font-family: monospace;
                background: #f6f8fa;
            }
            
            .md-help-table code {
                background: #f6f8fa;
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            /* 拖拽上传提示 */
            .drag-overlay {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(102, 126, 234, 0.1);
                border: 2px dashed #667eea;
                z-index: 100;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #667eea;
            }
            
            .drag-overlay.show {
                display: flex;
            }
        `;
        document.head.appendChild(styles);
    }
    
    bindEvents() {
        const textarea = this.container.querySelector('#md-textarea');
        const toolbar = this.container.querySelector('.md-toolbar');
        
        // 工具栏按钮点击
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            this.handleToolbarAction(action);
        });
        
        // 编辑器内容变化
        textarea.addEventListener('input', () => {
            this.handleInput();
        });
        
        // 键盘快捷键
        textarea.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // 拖拽上传
        this.bindDragAndDrop();
        
        // 粘贴上传
        textarea.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
        
        // 底部按钮
        this.container.querySelector('#btn-save-draft').addEventListener('click', () => {
            this.saveDraft(true);
        });
        
        this.container.querySelector('#btn-versions').addEventListener('click', () => {
            this.openVersionSidebar();
        });
        
        this.container.querySelector('#btn-close-versions').addEventListener('click', () => {
            this.closeVersionSidebar();
        });
        
        this.container.querySelector('#btn-close-help').addEventListener('click', () => {
            this.closeHelpModal();
        });
        
        // 点击遮罩关闭弹窗
        this.container.querySelector('#md-help-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeHelpModal();
            }
        });
    }
    
    handleToolbarAction(action) {
        const textarea = this.container.querySelector('#md-textarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selection = text.substring(start, end);
        
        const actions = {
            bold: () => this.wrapText(textarea, '**', '**', '粗体文本'),
            italic: () => this.wrapText(textarea, '*', '*', '斜体文本'),
            strikethrough: () => this.wrapText(textarea, '~~', '~~', '删除线文本'),
            code: () => this.insertCodeBlock(textarea),
            'inline-code': () => this.wrapText(textarea, '`', '`', 'code'),
            quote: () => this.insertAtLineStart(textarea, '> '),
            ul: () => this.insertAtLineStart(textarea, '- '),
            ol: () => this.insertAtLineStart(textarea, '1. '),
            task: () => this.insertAtLineStart(textarea, '- [ ] '),
            hr: () => this.insertText(textarea, '\n\n---\n\n'),
            link: () => this.insertLink(textarea),
            image: () => this.insertImage(textarea),
            table: () => this.insertTable(textarea),
            heading: () => this.insertHeading(textarea),
            undo: () => document.execCommand('undo'),
            redo: () => document.execCommand('redo'),
            help: () => this.openHelpModal(),
            'mode-edit': () => this.setMode('edit'),
            'mode-split': () => this.setMode('split'),
            'mode-preview': () => this.setMode('preview'),
            'ai-summary': () => this.callAI('summary'),
            'ai-continue': () => this.callAI('continue'),
            'ai-polish': () => this.callAI('polish'),
        };
        
        if (actions[action]) {
            actions[action]();
            textarea.focus();
            this.handleInput();
        }
    }
    
    wrapText(textarea, before, after, placeholder) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selection = text.substring(start, end);
        
        const newText = selection || placeholder;
        const replacement = before + newText + after;
        
        textarea.setRangeText(replacement, start, end, 'select');
        
        // 如果没有选中文本，选中placeholder
        if (!selection) {
            const newStart = start + before.length;
            textarea.setSelectionRange(newStart, newStart + placeholder.length);
        }
    }
    
    insertCodeBlock(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selection = text.substring(start, end);
        
        if (selection) {
            const lines = selection.split('\n');
            if (lines.length > 1) {
                // 多行代码
                const replacement = '```\n' + selection + '\n```';
                textarea.setRangeText(replacement, start, end, 'end');
            } else {
                // 单行代码
                this.wrapText(textarea, '`', '`', '');
            }
        } else {
            const replacement = '```javascript\n// 代码\n```';
            textarea.setRangeText(replacement, start, end, 'select');
            const newStart = start + 3;
            textarea.setSelectionRange(newStart, newStart + 10);
        }
    }
    
    insertAtLineStart(textarea, prefix) {
        const start = textarea.selectionStart;
        const text = textarea.value;
        
        // 找到当前行开始位置
        let lineStart = text.lastIndexOf('\n', start - 1) + 1;
        if (lineStart === -1) lineStart = 0;
        
        // 检查是否已经有前缀
        const currentLine = text.substring(lineStart, start);
        if (currentLine.startsWith(prefix)) {
            // 移除前缀
            textarea.setRangeText('', lineStart, lineStart + prefix.length, 'start');
        } else {
            // 添加前缀
            textarea.setRangeText(prefix, lineStart, lineStart, 'start');
        }
    }
    
    insertText(textarea, text) {
        const start = textarea.selectionStart;
        textarea.setRangeText(text, start, start, 'end');
    }
    
    insertLink(textarea) {
        const url = prompt('请输入链接地址:', 'https://');
        if (url) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selection = text.substring(start, end) || '链接文本';
            const replacement = `[${selection}](${url})`;
            textarea.setRangeText(replacement, start, end, 'end');
        }
    }
    
    insertImage(textarea) {
        const url = prompt('请输入图片地址:', 'https://');
        if (url) {
            const alt = prompt('请输入图片描述:', '图片');
            const replacement = `![${alt}](${url})`;
            this.insertText(textarea, replacement);
        }
    }
    
    insertTable(textarea) {
        const rows = parseInt(prompt('行数:', '3')) || 3;
        const cols = parseInt(prompt('列数:', '3')) || 3;
        
        let table = '\n';
        // 表头
        table += '|' + ' 列 '.repeat(cols) + '|\n';
        // 分隔符
        table += '|' + ' --- '.repeat(cols) + '|\n';
        // 数据行
        for (let i = 0; i < rows - 1; i++) {
            table += '|' + ' 内容 '.repeat(cols) + '|\n';
        }
        table += '\n';
        
        this.insertText(textarea, table);
    }
    
    insertHeading(textarea) {
        const start = textarea.selectionStart;
        const text = textarea.value;
        
        // 找到当前行开始位置
        let lineStart = text.lastIndexOf('\n', start - 1) + 1;
        if (lineStart === -1) lineStart = 0;
        
        // 找到当前行内容
        let lineEnd = text.indexOf('\n', lineStart);
        if (lineEnd === -1) lineEnd = text.length;
        
        const currentLine = text.substring(lineStart, lineEnd);
        
        // 检查当前的标题级别
        const match = currentLine.match(/^(#{0,6})\s*/);
        const currentLevel = match ? match[1].length : 0;
        const newLevel = (currentLevel % 6) + 1;
        
        // 移除现有的#并添加新的
        const content = currentLine.replace(/^#+\s*/, '');
        const replacement = '#'.repeat(newLevel) + ' ' + content;
        
        textarea.setRangeText(replacement, lineStart, lineEnd, 'start');
    }
    
    handleInput() {
        const textarea = this.container.querySelector('#md-textarea');
        const content = textarea.value;
        
        this.content = content;
        this.isDirty = true;
        
        // 更新字数统计
        this.updateWordCount();
        
        // 延迟更新预览
        clearTimeout(this.previewTimer);
        this.previewTimer = setTimeout(() => {
            this.updatePreview();
        }, this.previewDelay);
        
        // 通知外部
        this.onChange(content);
    }
    
    handleKeydown(e) {
        const textarea = e.target;
        
        // Tab键处理
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertText(textarea, '    ');
        }
        
        // 快捷键
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.handleToolbarAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.handleToolbarAction('italic');
                    break;
                case 's':
                    e.preventDefault();
                    this.saveDraft(true);
                    break;
            }
        }
    }
    
    bindDragAndDrop() {
        const textarea = this.container.querySelector('#md-textarea');
        
        // 创建拖拽遮罩
        const overlay = document.createElement('div');
        overlay.className = 'drag-overlay';
        overlay.innerHTML = '松开以上传图片';
        textarea.parentElement.style.position = 'relative';
        textarea.parentElement.appendChild(overlay);
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            textarea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        textarea.addEventListener('dragenter', () => {
            overlay.classList.add('show');
        });
        
        overlay.addEventListener('dragleave', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
            }
        });
        
        textarea.addEventListener('drop', (e) => {
            overlay.classList.remove('show');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }
    
    handlePaste(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                this.uploadImage(blob);
                break;
            }
        }
    }
    
    handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                this.uploadImage(files[i]);
            }
        }
    }
    
    async uploadImage(file) {
        const textarea = this.container.querySelector('#md-textarea');
        const insertPosition = textarea.selectionStart;
        
        // 显示上传中占位符
        const placeholder = `![上传中...]()`;
        textarea.setRangeText(placeholder, insertPosition, insertPosition, 'end');
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch(`${API_BASE_URL}/upload/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('上传失败');
            }
            
            const data = await response.json();
            const imageMarkdown = `![${file.name}](${data.url})`;
            
            // 替换占位符
            const content = textarea.value;
            const newContent = content.replace(placeholder, imageMarkdown);
            textarea.value = newContent;
            
            this.handleInput();
            
        } catch (error) {
            console.error('图片上传失败:', error);
            // 移除占位符
            const content = textarea.value;
            textarea.value = content.replace(placeholder, '');
            alert('图片上传失败，请重试');
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
        const body = this.container.querySelector('.md-editor-body');
        body.className = `md-editor-body mode-${mode}`;
        
        // 更新按钮状态
        this.container.querySelectorAll('.toolbar-btn[data-action^="mode-"]').forEach(btn => {
            btn.classList.remove('active');
        });
        this.container.querySelector(`[data-action="mode-${mode}"]`)?.classList.add('active');
    }
    
    updatePreview() {
        const preview = this.container.querySelector('#md-preview');
        const content = this.content;
        
        // 简单的Markdown解析
        preview.innerHTML = this.parseMarkdown(content);
    }
    
    parseMarkdown(text) {
        if (!text) return '';
        
        let html = text
            // 转义HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // 代码块
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 标题
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 删除线
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // 引用
            .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
            // 任务列表
            .replace(/^- \[ \] (.*$)/gim, '<ul><li class="task-list-item"><input type="checkbox" disabled> $1</li></ul>')
            .replace(/^- \[x\] (.*$)/gim, '<ul><li class="task-list-item"><input type="checkbox" checked disabled> $1</li></ul>')
            // 无序列表
            .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
            // 有序列表
            .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
            // 图片
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" loading="lazy">')
            // 链接
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 分隔线
            .replace(/^---+$/gim, '<hr>')
            // 段落
            .replace(/\n\n/g, '</p><p>')
            // 换行
            .replace(/\n/g, '<br>');
        
        // 包裹段落
        if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && 
            !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
            html = '<p>' + html + '</p>';
        }
        
        // 合并相邻的列表
        html = html.replace(/<\/ul>\s*<ul>/g, '')
                   .replace(/<\/ol>\s*<ol>/g, '')
                   .replace(/<\/blockquote>\s*<blockquote>/g, '<br>');
        
        return html;
    }
    
    updateWordCount() {
        const textarea = this.container.querySelector('#md-textarea');
        const count = textarea.value.length;
        this.container.querySelector('.word-count').textContent = `${count} 字`;
    }
    
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            if (this.isDirty) {
                this.saveDraft(false);
            }
        }, this.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    async saveDraft(showNotification = false) {
        const textarea = this.container.querySelector('#md-textarea');
        const content = textarea.value;
        
        if (content === this.lastSavedContent) return;
        
        // 更新保存状态UI
        this.updateSaveStatus('saving');
        
        try {
            // 保存到localStorage
            const draftKey = `article_draft_${this.articleId || 'new'}`;
            const draftData = {
                content: content,
                title: document.getElementById('articleTitle')?.value || '',
                category: document.getElementById('articleCategory')?.value || '',
                tags: document.getElementById('articleTags')?.value || '',
                summary: document.getElementById('articleSummary')?.value || '',
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(draftKey, JSON.stringify(draftData));
            
            // 如果有文章ID，同时保存到服务器
            if (this.articleId) {
                await this.saveVersionToServer(content, '自动保存');
            }
            
            this.lastSavedContent = content;
            this.lastSavedAt = new Date();
            this.isDirty = false;
            
            this.updateSaveStatus('saved');
            this.updateLastSavedTime();
            
            if (showNotification) {
                this.showToast('草稿已保存');
            }
            
        } catch (error) {
            console.error('保存草稿失败:', error);
            this.updateSaveStatus('error');
            if (showNotification) {
                this.showToast('保存失败，已保存到本地');
            }
        }
    }
    
    async saveVersionToServer(content, changeSummary = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/versions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    content: content,
                    change_summary: changeSummary
                })
            });
            
            if (!response.ok) {
                throw new Error('服务器保存失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('保存版本失败:', error);
            throw error;
        }
    }
    
    restoreDraft() {
        const draftKey = `article_draft_${this.articleId || 'new'}`;
        const draftJson = localStorage.getItem(draftKey);
        
        if (draftJson) {
            try {
                const draft = JSON.parse(draftJson);
                const textarea = this.container.querySelector('#md-textarea');
                
                // 如果有内容且与当前不同，询问是否恢复
                if (draft.content && draft.content !== textarea.value && draft.content !== this.content) {
                    const savedTime = new Date(draft.savedAt).toLocaleString('zh-CN');
                    if (confirm(`检测到未保存的草稿（${savedTime}），是否恢复？`)) {
                        textarea.value = draft.content;
                        this.content = draft.content;
                        
                        // 恢复其他字段
                        if (draft.title && document.getElementById('articleTitle')) {
                            document.getElementById('articleTitle').value = draft.title;
                        }
                        if (draft.category && document.getElementById('articleCategory')) {
                            document.getElementById('articleCategory').value = draft.category;
                        }
                        if (draft.tags && document.getElementById('articleTags')) {
                            document.getElementById('articleTags').value = draft.tags;
                        }
                        if (draft.summary && document.getElementById('articleSummary')) {
                            document.getElementById('articleSummary').value = draft.summary;
                        }
                        
                        this.handleInput();
                        this.showToast('草稿已恢复');
                    }
                }
            } catch (e) {
                console.error('恢复草稿失败:', e);
            }
        }
    }
    
    clearDraft() {
        const draftKey = `article_draft_${this.articleId || 'new'}`;
        localStorage.removeItem(draftKey);
    }
    
    updateSaveStatus(status) {
        const statusEl = this.container.querySelector('.save-status');
        statusEl.className = 'save-status ' + status;
        
        switch (status) {
            case 'saving':
                statusEl.textContent = '保存中...';
                break;
            case 'saved':
                statusEl.textContent = '已保存';
                break;
            case 'error':
                statusEl.textContent = '保存失败';
                break;
            default:
                statusEl.textContent = '准备就绪';
        }
    }
    
    updateLastSavedTime() {
        const timeEl = this.container.querySelector('.last-saved');
        if (this.lastSavedAt) {
            const timeStr = this.lastSavedAt.toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            timeEl.textContent = `上次保存: ${timeStr}`;
        }
    }
    
    async openVersionSidebar() {
        const sidebar = this.container.querySelector('#version-sidebar');
        sidebar.classList.add('open');
        
        // 加载版本历史
        await this.loadVersionHistory();
    }
    
    closeVersionSidebar() {
        const sidebar = this.container.querySelector('#version-sidebar');
        sidebar.classList.remove('open');
    }
    
    async loadVersionHistory() {
        const listEl = this.container.querySelector('#version-list');
        
        if (!this.articleId) {
            listEl.innerHTML = '<div class="version-empty">新文章暂无历史版本</div>';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/versions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('加载失败');
            }
            
            const data = await response.json();
            
            if (!data.versions || data.versions.length === 0) {
                listEl.innerHTML = '<div class="version-empty">暂无历史版本</div>';
                return;
            }
            
            listEl.innerHTML = data.versions.map((version, index) => `
                <div class="version-item ${index === 0 ? 'current' : ''}" data-version-id="${version.id}">
                    <div class="version-time">${new Date(version.created_at).toLocaleString('zh-CN')}</div>
                    <div class="version-meta">版本 ${version.version_number} · ${version.word_count || 0}字</div>
                    ${version.change_summary ? `<div class="version-meta">${version.change_summary}</div>` : ''}
                    <div class="version-actions">
                        <button class="version-btn" data-action="preview">预览</button>
                        <button class="version-btn version-btn-primary" data-action="restore">恢复</button>
                    </div>
                </div>
            `).join('');
            
            // 绑定版本按钮事件
            listEl.querySelectorAll('.version-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const versionItem = btn.closest('.version-item');
                    const versionId = versionItem.dataset.versionId;
                    const action = btn.dataset.action;
                    
                    if (action === 'preview') {
                        this.previewVersion(versionId);
                    } else if (action === 'restore') {
                        this.restoreVersion(versionId);
                    }
                });
            });
            
        } catch (error) {
            console.error('加载版本历史失败:', error);
            listEl.innerHTML = '<div class="version-empty">加载失败，请重试</div>';
        }
    }
    
    async previewVersion(versionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/versions/${versionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('加载失败');
            }
            
            const data = await response.json();
            
            // 在新窗口或弹窗中显示
            const modal = document.createElement('div');
            modal.className = 'version-preview-modal';
            modal.innerHTML = `
                <div class="version-preview-content">
                    <div class="version-preview-header">
                        <h3>版本预览 - ${new Date(data.version.created_at).toLocaleString('zh-CN')}</h3>
                        <button class="btn-close-preview">&times;</button>
                    </div>
                    <div class="version-preview-body">
                        <div class="md-preview">${this.parseMarkdown(data.version.content)}</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-close-preview').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
        } catch (error) {
            console.error('预览版本失败:', error);
            alert('预览失败');
        }
    }
    
    async restoreVersion(versionId) {
        if (!confirm('确定要恢复到这个版本吗？当前内容将被替换。')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/versions/${versionId}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('恢复失败');
            }
            
            const data = await response.json();
            
            // 更新编辑器内容
            const textarea = this.container.querySelector('#md-textarea');
            textarea.value = data.article.content;
            this.content = data.article.content;
            this.handleInput();
            
            this.showToast('已恢复到选定版本');
            this.closeVersionSidebar();
            
        } catch (error) {
            console.error('恢复版本失败:', error);
            alert('恢复失败');
        }
    }
    
    openHelpModal() {
        this.container.querySelector('#md-help-modal').classList.add('show');
    }
    
    closeHelpModal() {
        this.container.querySelector('#md-help-modal').classList.remove('show');
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
            z-index: 3000;
            animation: fadeInUp 0.3s ease;
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
    
    getContent() {
        return this.container.querySelector('#md-textarea').value;
    }
    
    setContent(content) {
        const textarea = this.container.querySelector('#md-textarea');
        textarea.value = content;
        this.content = content;
        this.handleInput();
    }
    
    destroy() {
        this.stopAutoSave();
        clearTimeout(this.previewTimer);
    }
    
    // AI 辅助功能
    async callAI(action) {
        const textarea = this.container.querySelector('#md-textarea');
        const content = textarea.value;
        
        if (!content.trim()) {
            this.showToast('请先输入一些内容');
            return;
        }
        
        // 获取选中的文本
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        // 使用选中的文本或全部内容
        const textToProcess = selectedText || content;
        
        this.showToast('AI 正在处理中...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/ai/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    content: textToProcess,
                    max_length: action === 'summary' ? 200 : 500
                })
            });
            
            if (!response.ok) {
                throw new Error('AI 请求失败');
            }
            
            const data = await response.json();
            
            if (action === 'continue') {
                // 续写：追加到光标位置
                const insertPosition = selectedText ? end : content.length;
                textarea.setRangeText('\n\n' + data.result, insertPosition, insertPosition, 'end');
            } else if (action === 'summary') {
                // 摘要：显示弹窗让用户选择
                this.showAIResultModal('文章摘要', data.result, (result) => {
                    // 将摘要插入到文章开头或替换选中文本
                    if (selectedText) {
                        textarea.setRangeText(result, start, end, 'select');
                    } else {
                        textarea.setRangeText('> **摘要：** ' + result + '\n\n', 0, 0, 'end');
                    }
                });
                return;
            } else if (action === 'polish') {
                // 润色：替换选中文本
                this.showAIResultModal('润色结果', data.result, (result) => {
                    if (selectedText) {
                        textarea.setRangeText(result, start, end, 'select');
                    } else {
                        this.showToast('润色功能需要选中文字');
                    }
                });
                return;
            }
            
            this.handleInput();
            this.showToast('AI 处理完成');
            
        } catch (error) {
            console.error('AI 请求失败:', error);
            this.showToast('AI 服务暂时不可用，请稍后重试');
        }
    }
    
    showAIResultModal(title, content, onConfirm) {
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'ai-modal';
        modal.innerHTML = `
            <div class="ai-modal-overlay">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3>🤖 ${title}</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <div class="ai-result-text">${this.escapeHtml(content)}</div>
                    </div>
                    <div class="ai-modal-footer">
                        <button class="ai-btn-secondary ai-modal-close-btn">取消</button>
                        <button class="ai-btn-primary ai-modal-confirm">使用此结果</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加样式
        if (!document.getElementById('ai-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ai-modal-styles';
            styles.textContent = `
                .ai-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ai-modal-content {
                    background: #fff;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    animation: ai-modal-in 0.3s ease;
                }
                @keyframes ai-modal-in {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .ai-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #eee;
                }
                .ai-modal-header h3 {
                    margin: 0;
                    font-size: 16px;
                    color: #333;
                }
                .ai-modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                }
                .ai-modal-close:hover {
                    color: #333;
                }
                .ai-modal-body {
                    padding: 20px;
                    overflow: auto;
                    max-height: 400px;
                }
                .ai-result-text {
                    line-height: 1.8;
                    color: #333;
                    white-space: pre-wrap;
                }
                .ai-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 20px;
                    border-top: 1px solid #eee;
                }
                .ai-btn-primary {
                    padding: 8px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .ai-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                .ai-btn-secondary {
                    padding: 8px 20px;
                    background: #f5f5f5;
                    color: #666;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .ai-btn-secondary:hover {
                    background: #e8e8e8;
                }
                /* AI 按钮样式 */
                .toolbar-btn.ai-btn {
                    color: #667eea;
                }
                .toolbar-btn.ai-btn:hover {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // 绑定事件
        const closeModal = () => {
            modal.remove();
        };
        
        modal.querySelector('.ai-modal-close').addEventListener('click', closeModal);
        modal.querySelector('.ai-modal-close-btn').addEventListener('click', closeModal);
        modal.querySelector('.ai-modal-confirm').addEventListener('click', () => {
            onConfirm(content);
            closeModal();
            this.handleInput();
        });
        
        modal.querySelector('.ai-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        });
    }
}

export default MarkdownEditor;
