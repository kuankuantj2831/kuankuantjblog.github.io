
import { API_BASE_URL } from './api-config.js?v=20260419b';

// 安全解析 localStorage 中的用户数据
function getSafeUser() {
    try {
        let userJson;
        try {
            userJson = localStorage.getItem('user');
        } catch (storageError) {
            console.warn('[Editor] localStorage 访问失败:', storageError);
            return null;
        }
        
        if (!userJson) return null;
        
        try {
            const user = JSON.parse(userJson);
            if (!user || !user.id) return null;
            return user;
        } catch (parseError) {
            console.warn('[Editor] 用户数据解析失败:', parseError);
            try {
                localStorage.removeItem('user');
            } catch (removeError) {
                console.warn('[Editor] 删除失败 user：', removeError);
            }
            return null;
        }
    } catch (e) {
        console.error('[Editor] 获取用户信息失败:', e);
        return null;
    }
}

// 检查登录状态
function checkAuth() {
    try {
        const user = getSafeUser();
        if (!user) {
            alert("请先登录后再发布文章！");
            try {
                window.location.href = "/index-chinese.html";
            } catch (navError) {
                console.warn('[Editor] 跳转登录失败:', navError);
            }
            throw new Error('未登录');
        }
        console.log("[Editor] 当前用户:", user.username || user.email || user.id);
        return user;
    } catch (e) {
        console.error('[Editor] 检查登录状态失败:', e);
        alert("检查登录状态失败，请刷新页面重试！");
        return null;
    }
}

const currentUser = checkAuth();

// 处理发布
try {
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
                const titleEl = document.getElementById('articleTitle');
                const categoryEl = document.getElementById('articleCategory');
                const tagsEl = document.getElementById('articleTags');
                const summaryEl = document.getElementById('articleSummary');
                const contentEl = document.getElementById('articleContent');

                const title = titleEl ? titleEl.value.trim() : '';
                const category = categoryEl ? categoryEl.value.trim() : '';
                const tagsStr = tagsEl ? tagsEl.value.trim() : '';
                const summary = summaryEl ? summaryEl.value.trim() : '';
                const content = contentEl ? contentEl.value.trim() : '';

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
                let tags = [];
                try {
                    tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);
                } catch (tagError) {
                    console.warn('[Editor] 标签处理失败:', tagError);
                }

                const user = getSafeUser();
                if (!user) throw new Error("登录已过期，请重新登录");

                // Get author name (use username from metadata or email)
                let authorName = '匿名';
                try {
                    authorName = user.username || (user.user_metadata && user.user_metadata.username) || (user.email ? user.email.split('@')[0] : '匿名');
                } catch (nameError) {
                    console.warn('[Editor] 获取作者名失败:', nameError);
                }

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
                    let token = null;
                    try {
                        token = localStorage.getItem('token');
                    } catch (tokenError) {
                        console.warn('[Editor] 获取 token 失败:', tokenError);
                    }
                    
                    response = await fetch(`${API_BASE_URL}/articles`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify(articleData)
                    });
                } catch (networkError) {
                    console.error('[Editor] 网络请求失败:', networkError);
                    throw new Error('网络连接失败，请检查网络后重试');
                }

                let data = {};
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.warn('[Editor] 响应解析失败:', parseError);
                    if (!response.ok) {
                        throw new Error(`服务器错误 (${response.status})`);
                    }
                }

                if (!response.ok) {
                    const errorMessage = (data && data.message) ? data.message : '发布失败';
                    throw new Error(errorMessage);
                }

                console.log("[Editor] 文章发布成功");
                alert("🎉 发布成功！");
                try {
                    window.location.href = "/index-chinese.html";
                } catch (navError) {
                    console.warn('[Editor] 跳转首页失败:', navError);
                }

            } catch (error) {
                console.error("[Editor] 发布失败:", error);
                alert("❌ 发布失败: " + (error.message || '未知错误'));
                if (submitBtn) {
                    try {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "🚀 发布文章";
                    } catch (btnError) {
                        console.warn('[Editor] 恢复按钮状态失败:', btnError);
                    }
                }
            }
        });
    } else {
        console.warn('[Editor] 未找到 #articleForm 元素');
    }
} catch (outerError) {
    console.error('[Editor] 初始化编辑器事件失败:', outerError);
}
