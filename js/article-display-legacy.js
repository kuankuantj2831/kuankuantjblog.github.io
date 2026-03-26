/**
 * 文章显示脚本 - 兼容版本 (Legacy)
 * 用于不支持 ES Module 的老旧浏览器（IE11/旧 Chrome）
 * 不使用 ES Module、不使用 async/await
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ==================== Polyfills ====================

    // Array.prototype.flat polyfill
    if (!Array.prototype.flat) {
        Array.prototype.flat = function(depth) {
            var arr = this;
            depth = depth === undefined ? 1 : parseInt(depth, 10);

            function flatten(array, currentDepth) {
                var result = [];
                for (var i = 0; i < array.length; i++) {
                    if (Array.isArray(array[i]) && currentDepth < depth) {
                        result = result.concat(flatten(array[i], currentDepth + 1));
                    } else {
                        result.push(array[i]);
                    }
                }
                return result;
            }

            return flatten(arr, 0);
        };
    }

    // String.prototype.trimStart polyfill
    if (!String.prototype.trimStart) {
        String.prototype.trimStart = function() {
            return this.replace(/^\s+/, '');
        };
    }

    // String.prototype.trimEnd polyfill
    if (!String.prototype.trimEnd) {
        String.prototype.trimEnd = function() {
            return this.replace(/\s+$/, '');
        };
    }

    // Object.assign polyfill
    if (!Object.assign) {
        Object.assign = function(target) {
            if (target === null || target === undefined) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource !== null && nextSource !== undefined) {
                    for (var key in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, key)) {
                            to[key] = nextSource[key];
                        }
                    }
                }
            }
            return to;
        };
    }

    // Promise polyfill (简化版，仅用于基本支持)
    if (typeof Promise === 'undefined') {
        window.Promise = function(executor) {
            var self = this;
            self.state = 'pending';
            self.value = undefined;
            self.handlers = [];

            function resolve(result) {
                if (self.state === 'pending') {
                    self.state = 'fulfilled';
                    self.value = result;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }

            function reject(error) {
                if (self.state === 'pending') {
                    self.state = 'rejected';
                    self.value = error;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }

            function handle(handler) {
                if (self.state === 'pending') {
                    self.handlers.push(handler);
                } else {
                    if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                        handler.onFulfilled(self.value);
                    }
                    if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                        handler.onRejected(self.value);
                    }
                }
            }

            this.then = function(onFulfilled, onRejected) {
                return new Promise(function(resolve, reject) {
                    handle({
                        onFulfilled: function(result) {
                            try {
                                var returnValue = onFulfilled ? onFulfilled(result) : result;
                                resolve(returnValue);
                            } catch (ex) {
                                reject(ex);
                            }
                        },
                        onRejected: function(error) {
                            try {
                                var returnValue = onRejected ? onRejected(error) : error;
                                reject(returnValue);
                            } catch (ex) {
                                reject(ex);
                            }
                        }
                    });
                });
            };

            executor(resolve, reject);
        };
    }

    // Fetch API polyfill (使用 XMLHttpRequest)
    if (typeof fetch === 'undefined') {
        window.fetch = function(url, options) {
            options = options || {};
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(options.method || 'GET', url, true);

                if (options.headers) {
                    Object.keys(options.headers).forEach(function(key) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    });
                }

                xhr.onload = function() {
                    resolve({
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        json: function() {
                            return new Promise(function(resolveJson) {
                                try {
                                    resolveJson(JSON.parse(xhr.responseText));
                                } catch (e) {
                                    resolveJson(null);
                                }
                            });
                        },
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        }
                    });
                };

                xhr.onerror = function() {
                    reject(new Error('Network request failed'));
                };

                xhr.send(options.body || null);
            });
        };
    }

    // ==================== Configuration ====================

    // API 配置（与 api-config.js 保持一致）
    var API_BASE_URL = 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';

    // ==================== Utility Functions ====================

    // HTML 转义函数（简单的 XSS 防护）
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // URL 参数解析（兼容版本）
    function getUrlParam(name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        var results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // 简单的 Markdown 渲染（简化版）
    function renderMarkdown(content) {
        if (!content) return '';

        var html = content;

        // 转义 HTML 特殊字符
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // 代码块 (```code```)
        html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
            return '<pre><code>' + code.trim() + '</code></pre>';
        });

        // 行内代码 (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 标题 (# 到 ######)
        html = html.replace(/^######\s(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');

        // 粗体 (**text**)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // 斜体 (*text* 或 _text_)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // 删除线 (~~text~~)
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

        // 引用 (> text)
        html = html.replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>');

        // 无序列表 (- text 或 * text)
        html = html.replace(/^(\s*)[-*]\s(.+)$/gm, function(match, indent, text) {
            return '<li>' + text + '</li>';
        });

        // 有序列表 (1. text)
        html = html.replace(/^(\s*)\d+\.\s(.+)$/gm, function(match, indent, text) {
            return '<li>' + text + '</li>';
        });

        // 链接 [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 图片 ![alt](url)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // 水平线 (--- 或 ***)
        html = html.replace(/^(---|\*\*\*)$/gm, '<hr>');

        // 段落（将连续的行包裹在 <p> 中）
        var paragraphs = html.split('\n\n');
        html = paragraphs.map(function(p) {
            p = p.trim();
            if (!p) return '';
            // 如果已经是块级元素，不包裹
            if (p.indexOf('<h') === 0 || p.indexOf('<pre>') === 0 ||
                p.indexOf('<blockquote>') === 0 || p.indexOf('<li>') === 0 ||
                p.indexOf('<hr>') === 0) {
                return p;
            }
            return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('\n');

        return html;
    }

    // 显示轻量提示
    function showToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
                          'background:rgba(0,0,0,0.75);color:#fff;padding:10px 24px;' +
                          'border-radius:8px;font-size:14px;z-index:9999;' +
                          'transition:opacity 0.3s';
        document.body.appendChild(t);
        setTimeout(function() {
            t.style.opacity = '0';
            setTimeout(function() { t.remove(); }, 300);
        }, 2000);
    }

    // 安全获取 DOM 元素
    function safeGetElement(id) {
        var el = document.getElementById(id);
        if (!el && window.console) {
            console.warn('[article-display-legacy] 元素 #' + id + ' 未找到');
        }
        return el;
    }

    // 格式化日期
    function formatDate(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        var hours = ('0' + date.getHours()).slice(-2);
        var minutes = ('0' + date.getMinutes()).slice(-2);

        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
    }

    // ==================== Main Functions ====================

    // 加载文章（使用 Promise）
    function loadArticle() {
        var loadingEl = safeGetElement('loading');

        // 获取 URL 参数中的 id
        var articleId = getUrlParam('id');

        if (!articleId) {
            showToast('文章ID丢失');
            setTimeout(function() {
                window.location.href = '/index-chinese.html';
            }, 1500);
            return;
        }

        // 构建请求 URL
        var requestUrl = API_BASE_URL + '/articles/' + encodeURIComponent(articleId);

        // 发送请求
        fetch(requestUrl)
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('文章不存在或已被删除');
                    }
                    throw new Error('服务器错误 (' + response.status + ')');
                }
                return response.json();
            })
            .then(function(data) {
                // 处理响应结构
                var article = data && data.data ? data.data : data;

                if (!article || !article.title) {
                    throw new Error('文章数据无效');
                }

                // 填充页面
                displayArticle(article, articleId);
            })
            .catch(function(error) {
                console.error('加载失败:', error);
                if (loadingEl) {
                    loadingEl.innerHTML = '❌ ' + escapeHtml(error.message || '加载失败，请检查网络');
                }
            });
    }

    // 显示文章内容
    function displayArticle(article, articleId) {
        // 更新页面标题
        document.title = escapeHtml(article.title) + ' - Hakimi 的猫爬架';

        // 更新 SEO meta 标签
        var articleUrl = window.location.href;
        var summary = (article.summary || article.title || '').substring(0, 160);

        function setMeta(id, attr, val) {
            var el = document.getElementById(id);
            if (el) el.setAttribute(attr, val);
        }

        setMeta('metaDescription', 'content', summary);
        setMeta('ogTitle', 'content', article.title + ' - Hakimi 的猫爬架');
        setMeta('ogDescription', 'content', summary);
        setMeta('ogUrl', 'content', articleUrl);
        setMeta('canonicalUrl', 'href', articleUrl);

        // 获取 DOM 元素
        var titleEl = safeGetElement('artTitle');
        var categoryEl = safeGetElement('artCategory');
        var authorEl = safeGetElement('artAuthor');
        var dateEl = safeGetElement('artDate');
        var bodyEl = safeGetElement('artBody');
        var contentEl = safeGetElement('articleContent');
        var viewsEl = safeGetElement('artViews');
        var loadingEl = safeGetElement('loading');

        // 填充标题
        if (titleEl) titleEl.textContent = article.title || '无标题';

        // 填充分类
        if (categoryEl) categoryEl.textContent = '📂 ' + (article.category || '未分类');

        // 填充作者信息
        if (authorEl) {
            var authorName = article.author_name || '匿名';
            var levelBadge = article.author_level ? '[Lv.' + article.author_level + '] ' : '';
            var titleBadge = article.author_title ? '[' + article.author_title + '] ' : '';
            authorEl.innerHTML = '👤 ' + escapeHtml(levelBadge + titleBadge + authorName);
        }

        // 填充时间
        if (dateEl && article.created_at) {
            dateEl.textContent = '🕒 ' + formatDate(article.created_at);
        }

        // 填充阅读量
        if (viewsEl) {
            viewsEl.textContent = '👁 ' + (article.view_count || 0);
        }

        // 渲染 Markdown 内容
        if (bodyEl) {
            bodyEl.innerHTML = renderMarkdown(article.content || '');
        }

        // 显示内容，隐藏加载
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        // 触发文章加载完成事件
        if (document.createEvent) {
            var event = document.createEvent('Event');
            event.initEvent('article-loaded', true, true);
            document.dispatchEvent(event);
        }

        // 检查文章所有权并显示删除按钮（如果用户已登录且是作者）
        checkOwnership(article, articleId);
    }

    // 检查文章所有权
    function checkOwnership(article, articleId) {
        try {
            var userJson = localStorage.getItem('user');
            if (!userJson) return;

            var user = JSON.parse(userJson);
            if (!user || !user.id || user.id != article.author_id) return;

            var deleteContainer = safeGetElement('deleteBtnContainer');
            var deleteBtn = safeGetElement('deleteArticleBtn');

            if (deleteContainer && deleteBtn) {
                deleteContainer.style.display = 'inline-block';
                deleteBtn.onclick = function() {
                    if (confirm('确定要撤回（删除）这篇文章吗？此操作不可恢复。')) {
                        deleteArticle(articleId);
                    }
                };
            }
        } catch (e) {
            console.error('检查所有权失败:', e);
        }
    }

    // 删除文章
    function deleteArticle(articleId) {
        var token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        fetch(API_BASE_URL + '/articles/' + encodeURIComponent(articleId), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        .then(function(response) {
            if (response.ok) {
                alert('文章已撤回');
                window.location.href = '/index-chinese.html';
            } else {
                return response.json().then(function(data) {
                    throw new Error(data.message || '撤回失败');
                });
            }
        })
        .catch(function(error) {
            console.error('删除失败:', error);
            alert('撤回失败: ' + (error.message || '请检查网络'));
        });
    }

    // ==================== Initialize ====================

    // DOM 加载完成后初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadArticle);
        } else {
            loadArticle();
        }
    }

    // 启动
    init();

})();
