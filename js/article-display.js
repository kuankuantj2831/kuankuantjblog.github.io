
import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml, renderTitleBadge, renderLevelBadge } from './utils.js';
import { renderMarkdown } from './markdown.js';

// 轻量提示（替代 alert）
function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 24px',
        borderRadius: '8px', fontSize: '14px', zIndex: '9999', transition: 'opacity 0.3s'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
}

// 安全获取 DOM 元素
function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`[article-display] 元素 #${id} 未找到`);
    return el;
}

// 安全解析 localStorage 中的用户数据
function getSafeUser() {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;
        const user = JSON.parse(userJson);
        if (!user || !user.id) return null;
        return user;
    } catch (e) {
        console.error('解析用户数据失败:', e);
        localStorage.removeItem('user');
        return null;
    }
}

async function loadArticle() {
    const loadingEl = safeGetElement('loading');

    // 获取 URL 参数中的 id
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        showToast("文章ID丢失");
        setTimeout(() => { window.location.href = "/index-chinese.html"; }, 1500);
        return;
    }

    try {
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}`);
        } catch (networkError) {
            throw new Error('网络连接失败，请检查网络后重试');
        }

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('文章不存在或已被删除');
            }
            throw new Error(`服务器错误 (${response.status})`);
        }

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error('服务器返回了无效的数据格式');
        }

        // Handle response structure (direct object or { data: ... })
        const article = data.data || data;

        if (article && article.title) {
            // 填充页面
            document.title = escapeHtml(article.title) + " - Hakimi 的猫爬架";

            // 动态更新 SEO meta 标签
            const articleUrl = window.location.href;
            const summary = (article.summary || article.title || '').substring(0, 160);
            const setMeta = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
            setMeta('metaDescription', 'content', summary);
            setMeta('ogTitle', 'content', article.title + ' - Hakimi 的猫爬架');
            setMeta('ogDescription', 'content', summary);
            setMeta('ogUrl', 'content', articleUrl);
            setMeta('canonicalUrl', 'href', articleUrl);

            const titleEl = safeGetElement('artTitle');
            const categoryEl = safeGetElement('artCategory');
            const authorEl = safeGetElement('artAuthor');
            const dateEl = safeGetElement('artDate');
            const bodyEl = safeGetElement('artBody');
            const contentEl = safeGetElement('articleContent');

            if (titleEl) titleEl.textContent = article.title || '无标题';
            if (categoryEl) categoryEl.textContent = "📂 " + (article.category || '未分类');
            if (authorEl) {
                const titleBadge = renderTitleBadge(article.author_title);
                const levelBadge = renderLevelBadge(article.author_level);
                authorEl.innerHTML = "👤 " + levelBadge + titleBadge + escapeHtml(article.author_name || '匿名');
            }

            // 显示阅读量
            const viewsEl = safeGetElement('artViews');
            if (viewsEl) viewsEl.textContent = '👁 ' + (article.view_count || 0);

            // 格式化时间
            if (article.created_at && dateEl) {
                try {
                    const date = new Date(article.created_at);
                    if (!isNaN(date.getTime())) {
                        dateEl.textContent = "🕒 " + date.toLocaleDateString() + " " + date.toLocaleTimeString();
                    }
                } catch (dateError) {
                    console.warn('日期格式化失败:', dateError);
                }
            }

            // Markdown 渲染（安全，已内置 XSS 防护）
            if (bodyEl) {
                bodyEl.innerHTML = renderMarkdown(article.content || '');
            }

            // 显示内容，隐藏加载
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';

            // 通知文章已加载（用于目录生成和代码高亮）
            document.dispatchEvent(new Event('article-loaded'));

            // Check ownership
            const currentUser = getSafeUser();
            if (currentUser && currentUser.id == article.author_id) {
                const deleteContainer = safeGetElement('deleteBtnContainer');
                const deleteBtn = safeGetElement('deleteArticleBtn');

                if (deleteContainer && deleteBtn) {
                    deleteContainer.style.display = 'inline-block';
                    deleteBtn.onclick = async () => {
                        if (confirm('确定要撤回（删除）这篇文章吗？此操作不可恢复。')) {
                            try {
                                const token = localStorage.getItem('token');
                                const delResponse = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    }
                                });

                                if (delResponse.ok) {
                                    alert('文章已撤回');
                                    window.location.href = '/index-chinese.html';
                                } else {
                                    let errMsg = '未知错误';
                                    try {
                                        const errData = await delResponse.json();
                                        errMsg = errData.message || errMsg;
                                    } catch (_) { /* 忽略解析错误 */ }
                                    alert('撤回失败: ' + errMsg);
                                }
                            } catch (e) {
                                console.error('Delete error:', e);
                                alert('撤回失败，请检查网络');
                            }
                        }
                    };
                }
            }

            // Initialize Interactions (Likes & Comments)
            try {
                await initInteractions(articleId, currentUser);
            } catch (interactionError) {
                console.error('初始化互动功能失败:', interactionError);
            }

        } else {
            if (loadingEl) loadingEl.innerHTML = "❌ 文章不存在";
        }
    } catch (error) {
        console.error("加载失败:", error);
        if (loadingEl) loadingEl.innerHTML = `❌ ${escapeHtml(error.message || '加载失败，请检查网络')}`;
    }
}

// --- Interaction Functions ---

async function initInteractions(articleId, currentUser) {
    // 先绑定所有按钮事件（不依赖网络请求）
    const likeBtn = safeGetElement('likeBtn');
    if (likeBtn) {
        likeBtn.onclick = () => toggleLike(articleId, currentUser);
    }

    const coinBtn = safeGetElement('coinBtn');
    if (coinBtn) {
        coinBtn.onclick = () => showCoinModal(articleId, currentUser);
        console.log('[initInteractions] 投币按钮已绑定');
    }

    const favoriteBtn = safeGetElement('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.onclick = () => toggleFavorite(articleId, currentUser);
    }

    initCoinModal(articleId, currentUser);

    const submitBtn = safeGetElement('submitCommentBtn');
    const loginPrompt = safeGetElement('loginToComment');
    const commentForm = safeGetElement('commentFormContainer');

    if (currentUser) {
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (commentForm) commentForm.style.display = 'block';
        if (submitBtn) submitBtn.onclick = () => submitComment(articleId, currentUser);
    } else {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (commentForm) commentForm.style.display = 'none';
    }

    // 异步加载数据（不阻塞按钮绑定）
    // 1. Likes
    try {
        await loadLikes(articleId, currentUser);
    } catch (e) {
        console.error('加载点赞失败:', e);
    }

    // 2. Coins (投币数)
    try {
        await loadArticleCoins(articleId);
    } catch (e) {
        console.error('加载投币数失败:', e);
    }

    // 3. Favorites (收藏)
    try {
        await loadFavorites(articleId, currentUser);
    } catch (e) {
        console.error('加载收藏失败:', e);
    }

    // 4. Comments
    try {
        await loadComments(articleId, currentUser);
    } catch (e) {
        console.error('加载评论失败:', e);
    }
}

// --- Coin (投币) Functions ---

let selectedCoinAmount = 1;

async function loadArticleCoins(articleId) {
    try {
        const res = await fetch(`${API_BASE_URL}/coins/article/${encodeURIComponent(articleId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const coinCountEl = safeGetElement('coinCount');
        if (coinCountEl) coinCountEl.textContent = data.total_coins || 0;
    } catch (e) {
        console.error('Load article coins error:', e);
    }
}

function showCoinModal(articleId, currentUser) {
    if (!currentUser || !currentUser.id) {
        alert('请先登录后再投币');
        return;
    }

    const modal = safeGetElement('coinModal');
    if (!modal) return;

    modal.style.display = 'flex';
    selectedCoinAmount = 1;

    // 高亮默认选中的金额按钮
    document.querySelectorAll('.coin-amount-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.amount === '1');
    });

    // 加载用户余额
    loadUserBalance(currentUser);
}

async function loadUserBalance(currentUser) {
    const balanceEl = safeGetElement('coinModalBalance');
    if (!balanceEl) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            balanceEl.textContent = '请先登录';
            return;
        }

        const res = await fetch(`${API_BASE_URL}/coins/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        balanceEl.textContent = `我的余额：${data.balance || 0} 🪙`;
    } catch (e) {
        console.error('Load balance error:', e);
        balanceEl.textContent = '余额加载失败';
    }
}

function initCoinModal(articleId, currentUser) {
    // 金额选择按钮
    document.querySelectorAll('.coin-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCoinAmount = parseInt(btn.dataset.amount);
            document.querySelectorAll('.coin-amount-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // 确认投币
    const confirmBtn = safeGetElement('coinConfirmBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => donateCoin(articleId, currentUser);
    }

    // 取消按钮
    const cancelBtn = safeGetElement('coinCancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = closeCoinModal;
    }

    // 点击遮罩关闭
    const modal = safeGetElement('coinModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCoinModal();
        });
    }
}

function closeCoinModal() {
    const modal = safeGetElement('coinModal');
    if (modal) modal.style.display = 'none';
}

async function donateCoin(articleId, currentUser) {
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }

    const confirmBtn = safeGetElement('coinConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '投币中...';
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('登录已过期，请重新登录');
            return;
        }

        const res = await fetch(`${API_BASE_URL}/coins/donate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                article_id: parseInt(articleId),
                amount: selectedCoinAmount
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || '投币失败');
        }

        // 投币成功
        closeCoinModal();

        // 更新投币数显示
        await loadArticleCoins(articleId);

        // 投币成功动画
        const coinBtn = safeGetElement('coinBtn');
        if (coinBtn) {
            coinBtn.classList.add('coin-success-anim');
            setTimeout(() => coinBtn.classList.remove('coin-success-anim'), 600);
        }

        // 显示成功提示
        showCoinToast(`投币成功！-${selectedCoinAmount} 🪙`);

    } catch (e) {
        console.error('Donate error:', e);
        alert(e.message || '投币失败，请重试');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '确认投币';
        }
    }
}

function showCoinToast(message) {
    // 创建临时 toast 提示
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #f7971e, #ffd200); color:white; padding:12px 24px; border-radius:25px; font-size:16px; font-weight:bold; z-index:2000; box-shadow:0 4px 15px rgba(247,151,30,0.4); animation:fadeInUp 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

async function loadLikes(articleId, currentUser) {
    try {
        let url = `${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/like`;
        if (currentUser && currentUser.id) {
            url += `?userId=${encodeURIComponent(currentUser.id)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const likeCountEl = safeGetElement('likeCount');
        const likeBtn = safeGetElement('likeBtn');
        const likeIcon = safeGetElement('likeIcon');

        if (likeCountEl) likeCountEl.textContent = data.count || 0;

        if (likeBtn && likeIcon) {
            if (data.liked) {
                likeBtn.style.background = '#ff4d4f';
                likeBtn.style.color = 'white';
                likeIcon.textContent = '❤️';
            } else {
                likeBtn.style.background = 'white';
                likeBtn.style.color = '#ff4d4f';
                likeIcon.textContent = '🤍';
            }
        }
    } catch (e) {
        console.error('Load likes error:', e);
    }
}

async function toggleLike(articleId, currentUser) {
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: currentUser.id })
        });

        if (res.ok) {
            await loadLikes(articleId, currentUser); // Reload to update UI
        } else {
            let errMsg = '操作失败';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (_) { /* 忽略 */ }
            alert(errMsg);
        }
    } catch (e) {
        console.error('Toggle like error:', e);
        alert('网络错误，请重试');
    }
}

// --- Favorites (收藏) Functions ---

async function loadFavorites(articleId, currentUser) {
    try {
        let url = `${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/favorite`;
        if (currentUser && currentUser.id) {
            url += `?userId=${encodeURIComponent(currentUser.id)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const favoriteCountEl = safeGetElement('favoriteCount');
        const favoriteBtn = safeGetElement('favoriteBtn');

        if (favoriteCountEl) favoriteCountEl.textContent = data.count || 0;

        if (favoriteBtn) {
            if (data.favorited) {
                favoriteBtn.style.background = '#faad14';
                favoriteBtn.style.color = 'white';
                favoriteBtn.innerHTML = '★ 已收藏 <span id="favoriteCount">' + (data.count || 0) + '</span>';
            } else {
                favoriteBtn.style.background = 'white';
                favoriteBtn.style.color = '#faad14';
                favoriteBtn.innerHTML = '☆ 收藏 <span id="favoriteCount">' + (data.count || 0) + '</span>';
            }
        }
    } catch (e) {
        console.error('Load favorites error:', e);
    }
}

async function toggleFavorite(articleId, currentUser) {
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: currentUser.id })
        });

        if (res.ok) {
            const data = await res.json();
            showToast(data.favorited ? '已收藏 ⭐' : '已取消收藏');
            await loadFavorites(articleId, currentUser);
        } else {
            let errMsg = '操作失败';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (_) { /* 忽略 */ }
            alert(errMsg);
        }
    } catch (e) {
        console.error('Toggle favorite error:', e);
        alert('网络错误，请重试');
    }
}

async function loadComments(articleId, currentUser) {
    const list = safeGetElement('commentsList');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const comments = await res.json();
        list.innerHTML = '';

        if (!Array.isArray(comments) || comments.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#999;">暂无评论，快来抢沙发吧！</p>';
            return;
        }

        // 构建评论树
        const topLevel = [];
        const childrenMap = {};
        comments.forEach(c => {
            if (!c) return;
            if (c.parent_id) {
                if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
                childrenMap[c.parent_id].push(c);
            } else {
                topLevel.push(c);
            }
        });

        topLevel.forEach(comment => {
            const el = buildCommentEl(comment, currentUser, articleId, childrenMap);
            list.appendChild(el);
        });
    } catch (e) {
        console.error('Load comments error:', e);
        list.innerHTML = '<p style="text-align:center;color:#999;">评论加载失败</p>';
    }
}

function buildCommentEl(comment, currentUser, articleId, childrenMap) {
    const div = document.createElement('div');
    div.className = 'comment-item';

    let dateStr = '';
    try {
        dateStr = comment.created_at ? new Date(comment.created_at).toLocaleString() : '';
    } catch (_) { dateStr = ''; }

    const isAuthor = currentUser && currentUser.id && currentUser.id == comment.user_id;
    const safeName = escapeHtml(comment.user_name || '匿名用户');
    const safeContent = escapeHtml(comment.content || '').replace(/\n/g, '<br>');
    const cLevelBadge = renderLevelBadge(comment.user_level);
    const cTitleBadge = renderTitleBadge(comment.user_title);
    const cId = parseInt(comment.id);

    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-weight:bold;color:#333;">${cLevelBadge}${cTitleBadge}${safeName}</span>
            <span style="font-size:12px;color:#999;">${escapeHtml(dateStr)}</span>
        </div>
        <div style="color:#666;line-height:1.6;">${safeContent}</div>
        <div>
            ${currentUser ? `<button class="reply-btn" data-cid="${cId}" data-name="${safeName}">回复</button>` : ''}
            ${isAuthor ? `<button onclick="deleteComment(${cId}, ${parseInt(articleId)}, ${parseInt(currentUser.id)})" style="color:red;background:none;border:none;cursor:pointer;font-size:12px;margin-top:5px;">删除</button>` : ''}
        </div>
        ${currentUser ? `<div class="reply-form" id="replyForm-${cId}">
            <div class="reply-to-hint">回复 @${safeName}</div>
            <textarea placeholder="写下你的回复..." maxlength="2000"></textarea>
            <button class="reply-submit-btn" data-cid="${cId}" data-article="${articleId}">发布回复</button>
        </div>` : ''}
    `;

    // 回复按钮事件
    const replyBtn = div.querySelector(':scope > div > .reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', () => {
            const form = div.querySelector(`:scope > .reply-form`);
            if (form) form.style.display = form.style.display === 'none' || !form.style.display ? 'block' : 'none';
        });
    }

    // 发布回复事件
    const replyForm = div.querySelector(':scope > .reply-form');
    const submitReplyBtn = replyForm ? replyForm.querySelector('.reply-submit-btn') : null;
    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', async () => {
            const textarea = replyForm.querySelector('textarea');
            const content = textarea ? textarea.value.trim() : '';
            if (!content) { alert('请输入回复内容'); return; }
            if (content.length > 2000) { alert('回复内容不能超过2000字'); return; }
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ content, parentId: cId })
                });
                if (res.ok) {
                    await loadComments(articleId, currentUser);
                } else {
                    let errMsg = '回复失败';
                    try { const d = await res.json(); errMsg = d.message || errMsg; } catch (_) {}
                    alert(errMsg);
                }
            } catch (e) {
                console.error('Reply error:', e);
                alert('网络错误，请重试');
            }
        });
    }

    // 渲染子评论
    const children = childrenMap[comment.id];
    if (children && children.length > 0) {
        const repliesDiv = document.createElement('div');
        repliesDiv.className = 'comment-replies';
        children.forEach(child => {
            repliesDiv.appendChild(buildCommentEl(child, currentUser, articleId, childrenMap));
        });
        div.appendChild(repliesDiv);
    }

    return div;
}

// Expose deleteComment to global scope so onclick works
window.deleteComment = async (commentId, articleId, userId) => {
    if (!confirm('确定删除这条评论吗？')) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/comments/${encodeURIComponent(commentId)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            window.location.reload();
        } else {
            let errMsg = '删除失败';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (_) { /* 忽略 */ }
            alert(errMsg);
        }
    } catch (e) {
        console.error('Delete comment error:', e);
        alert('网络错误，请重试');
    }
};

async function submitComment(articleId, currentUser) {
    const input = safeGetElement('commentInput');
    if (!input) return;

    const content = input.value.trim();
    if (!content) {
        alert('请输入评论内容');
        return;
    }

    if (content.length > 2000) {
        alert('评论内容不能超过2000字');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content
            })
        });

        if (res.ok) {
            input.value = '';
            await loadComments(articleId, currentUser);
        } else {
            let errMsg = '评论失败';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (_) { /* 忽略 */ }
            alert(errMsg);
        }
    } catch (e) {
        console.error('Submit comment error:', e);
        alert('网络错误，请重试');
    }
}

// ==================== 分享功能 ====================

function initShare() {
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const closeShareBtn = document.getElementById('closeShareBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    if (!shareBtn || !shareModal) return;

    let qrGenerated = false;

    shareBtn.addEventListener('click', () => {
        shareModal.style.display = 'flex';

        // 设置文章标题
        const titleEl = document.getElementById('artTitle');
        const shareTitleEl = document.getElementById('shareArticleTitle');
        if (titleEl && shareTitleEl) {
            shareTitleEl.textContent = titleEl.textContent;
        }

        // 生成二维码（只生成一次）
        if (!qrGenerated) {
            const qrContainer = document.getElementById('shareQrCode');
            if (qrContainer) {
                qrContainer.innerHTML = '';
                const url = window.location.href;

                if (typeof QRCode !== 'undefined') {
                    // 使用 qrcodejs 库
                    try {
                        new QRCode(qrContainer, {
                            text: url,
                            width: 200,
                            height: 200,
                            colorDark: '#333333',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M
                        });
                        qrGenerated = true;
                    } catch (e) {
                        console.warn('QRCode lib error, using fallback:', e);
                    }
                }

                // Fallback: 使用在线 API 生成二维码
                if (!qrGenerated) {
                    const img = document.createElement('img');
                    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                    img.alt = '文章二维码';
                    img.style.cssText = 'width:200px;height:200px;border-radius:8px;';
                    qrContainer.appendChild(img);
                    qrGenerated = true;
                }
            }
        }
    });

    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    }

    // 点击遮罩关闭
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });

    // 复制链接
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                copyLinkBtn.textContent = '✅ 已复制';
                setTimeout(() => { copyLinkBtn.textContent = '📋 复制链接'; }, 2000);
            } catch (e) {
                // fallback
                const input = document.createElement('input');
                input.value = window.location.href;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                copyLinkBtn.textContent = '✅ 已复制';
                setTimeout(() => { copyLinkBtn.textContent = '📋 复制链接'; }, 2000);
            }
        });
    }
}

// 页面加载后初始化分享
document.addEventListener('DOMContentLoaded', initShare);

loadArticle();
