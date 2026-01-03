
import { API_BASE_URL } from './api-config.js';

async function loadArticle() {
    // 获取 URL 参数中的 id
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        alert("文章ID丢失");
        window.location.href = "/index-chinese.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Handle response structure (direct object or { data: ... })
        const article = data.data || data;

        if (article) {
            // 填充页面
            document.title = article.title + " - 天机阁";
            document.getElementById('artTitle').textContent = article.title;
            document.getElementById('artCategory').textContent = "📂 " + (article.category || '未分类');
            document.getElementById('artAuthor').textContent = "👤 " + (article.author_name || '匿名');

            // 格式化时间
            if (article.created_at) {
                const date = new Date(article.created_at);
                document.getElementById('artDate').textContent = "🕒 " + date.toLocaleDateString() + " " + date.toLocaleTimeString();
            }

            // 简单的 Markdown 渲染
            document.getElementById('artBody').innerHTML = (article.content || '')
                .replace(/</g, "&lt;").replace(/>/g, "&gt;") // 防XSS
                .replace(/\n/g, "<br>"); // 换行

            // 显示内容，隐藏加载
            document.getElementById('loading').style.display = 'none';
            document.getElementById('articleContent').style.display = 'block';

            // Check ownership
            const userJson = localStorage.getItem('user');
            let currentUser = null;
            if (userJson) {
                currentUser = JSON.parse(userJson);
                // Note: article.author_id might be string or number, ensure comparison works
                if (currentUser.id == article.author_id) {
                    const deleteContainer = document.getElementById('deleteBtnContainer');
                    const deleteBtn = document.getElementById('deleteArticleBtn');

                    if (deleteContainer && deleteBtn) {
                        deleteContainer.style.display = 'inline-block';
                        deleteBtn.onclick = async () => {
                            if (confirm('确定要撤回（删除）这篇文章吗？此操作不可恢复。')) {
                                try {
                                    const delResponse = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ userId: currentUser.id })
                                    });

                                    if (delResponse.ok) {
                                        alert('文章已撤回');
                                        window.location.href = '/index-chinese.html';
                                    } else {
                                        const errData = await delResponse.json();
                                        alert('撤回失败: ' + (errData.message || '未知错误'));
                                    }
                                } catch (e) {
                                    console.error('Delete error:', e);
                                    alert('撤回失败，请检查网络');
                                }
                            }
                        };
                    }
                }
            }

            // Initialize Interactions (Likes & Comments)
            initInteractions(articleId, currentUser);

        } else {
            document.getElementById('loading').innerHTML = "❌ 文章不存在";
        }
    } catch (error) {
        console.error("加载失败:", error);
        document.getElementById('loading').innerHTML = "❌ 加载失败，请检查网络";
    }
}

// --- Interaction Functions ---

async function initInteractions(articleId, currentUser) {
    // 1. Likes
    await loadLikes(articleId, currentUser);
    document.getElementById('likeBtn').onclick = () => toggleLike(articleId, currentUser);

    // 2. Comments
    await loadComments(articleId, currentUser);

    const submitBtn = document.getElementById('submitCommentBtn');
    const loginPrompt = document.getElementById('loginToComment');
    const commentForm = document.getElementById('commentFormContainer');

    if (currentUser) {
        loginPrompt.style.display = 'none';
        commentForm.style.display = 'block';
        submitBtn.onclick = () => submitComment(articleId, currentUser);
    } else {
        loginPrompt.style.display = 'block';
        commentForm.style.display = 'none';
    }
}

async function loadLikes(articleId, currentUser) {
    try {
        let url = `${API_BASE_URL}/articles/${articleId}/like`;
        if (currentUser) {
            url += `?userId=${currentUser.id}`;
        }
        const res = await fetch(url);
        const data = await res.json();

        document.getElementById('likeCount').textContent = data.count;
        const likeBtn = document.getElementById('likeBtn');
        const likeIcon = document.getElementById('likeIcon');

        if (data.liked) {
            likeBtn.style.background = '#ff4d4f';
            likeBtn.style.color = 'white';
            likeIcon.textContent = '❤️';
        } else {
            likeBtn.style.background = 'white';
            likeBtn.style.color = '#ff4d4f';
            likeIcon.textContent = '🤍';
        }
    } catch (e) {
        console.error('Load likes error:', e);
    }
}

async function toggleLike(articleId, currentUser) {
    if (!currentUser) {
        alert('请先登录');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });

        if (res.ok) {
            loadLikes(articleId, currentUser); // Reload to update UI
        } else {
            alert('操作失败');
        }
    } catch (e) {
        console.error('Toggle like error:', e);
    }
}

async function loadComments(articleId, currentUser) {
    try {
        const res = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`);
        const comments = await res.json();
        const list = document.getElementById('commentsList');
        list.innerHTML = '';

        if (comments.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#999;">暂无评论，快来抢沙发吧！</p>';
            return;
        }

        comments.forEach(comment => {
            const div = document.createElement('div');
            div.style.borderBottom = '1px solid #eee';
            div.style.padding = '15px 0';

            const date = new Date(comment.created_at).toLocaleString();
            const isAuthor = currentUser && currentUser.id == comment.user_id;

            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <span style="font-weight:bold;color:#333;">${comment.user_name || '匿名用户'}</span>
                    <span style="font-size:12px;color:#999;">${date}</span>
                </div>
                <div style="color:#666;line-height:1.6;">${comment.content}</div>
                ${isAuthor ? `<button onclick="deleteComment(${comment.id}, ${articleId}, ${currentUser.id})" style="color:red;background:none;border:none;cursor:pointer;font-size:12px;margin-top:5px;">删除</button>` : ''}
            `;
            list.appendChild(div);
        });
    } catch (e) {
        console.error('Load comments error:', e);
    }
}

// Expose deleteComment to global scope so onclick works
window.deleteComment = async (commentId, articleId, userId) => {
    if (!confirm('确定删除这条评论吗？')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (res.ok) {
            // Reload comments. We need to fetch current user again or pass it. 
            // Since we are in global scope, let's just reload page or re-fetch.
            // Re-fetching is better but we need access to loadComments.
            // For simplicity, let's reload the comments part if we can, or just reload page.
            // Actually, we can just call loadComments if we have access to it.
            // Since loadComments is in module scope, we can't call it from window.
            // Workaround: Reload page
            window.location.reload();
        } else {
            alert('删除失败');
        }
    } catch (e) {
        console.error('Delete comment error:', e);
    }
};

async function submitComment(articleId, currentUser) {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                userName: currentUser.username,
                content
            })
        });

        if (res.ok) {
            input.value = '';
            loadComments(articleId, currentUser);
        } else {
            alert('评论失败');
        }
    } catch (e) {
        console.error('Submit comment error:', e);
    }
}

loadArticle();
