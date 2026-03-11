
import { API_BASE_URL } from './api-config.js?v=20260223b';

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

// 检查登录状态
function checkAuth() {
    const user = getSafeUser();
    if (!user) {
        alert("请先登录后再发布文章！");
        window.location.href = "/index-chinese.html";
        return null;
    }
    console.log("当前用户:", user.username || user.email || user.id);
    return user;
}

const currentUser = checkAuth();

// 处理发布
const articleForm = document.getElementById('articleForm');
if (articleForm) {
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('publishBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "发布中...";
        }

        try {
            const title = (document.getElementById('articleTitle')?.value || '').trim();
            const category = (document.getElementById('articleCategory')?.value || '').trim();
            const tagsStr = (document.getElementById('articleTags')?.value || '').trim();
            const summary = (document.getElementById('articleSummary')?.value || '').trim();
            const content = (document.getElementById('articleContent')?.value || '').trim();

            // 前端验证
            if (!title) {
                throw new Error('请输入文章标题');
            }
            if (!content) {
                throw new Error('请输入文章内容');
            }
            if (title.length > 255) {
                throw new Error('标题不能超过255个字符');
            }

            // Process tags
            const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);

            const user = getSafeUser();
            if (!user) throw new Error("登录已过期，请重新登录");

            // Get author name (use username from metadata or email)
            let authorName = user.username || user.user_metadata?.username || (user.email ? user.email.split('@')[0] : '匿名');

            // Prepare article data
            const articleData = {
                title,
                category,
                tags: tags.join(','),
                summary,
                content,
                author_id: user.id,
                author_name: authorName
            };

            let response;
            try {
                const token = localStorage.getItem('token');
                response = await fetch(`${API_BASE_URL}/articles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(articleData)
                });
            } catch (networkError) {
                throw new Error('网络连接失败，请检查网络后重试');
            }

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                if (response.ok) {
                    // 响应成功但无法解析 JSON，仍视为成功
                    data = {};
                } else {
                    throw new Error(`服务器错误 (${response.status})`);
                }
            }

            if (!response.ok) {
                throw new Error(data.message || '发布失败');
            }

            console.log("文章发布成功");
            alert("🎉 发布成功！");
            window.location.href = "/index-chinese.html";

        } catch (error) {
            console.error("发布失败:", error);
            alert("❌ 发布失败: " + (error.message || '未知错误'));
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "🚀 发布文章";
            }
        }
    });
} else {
    console.warn('[editor] 未找到 #articleForm 元素');
}
