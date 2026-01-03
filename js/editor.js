
import { API_BASE_URL } from './api-config.js';

// 检查登录状态
// Check login status
function checkAuth() {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        alert("请先登录后再发布文章！");
        window.location.href = "/index-chinese.html";
        return null;
    }
    const user = JSON.parse(userJson);
    console.log("当前用户:", user.email);
    return user;
}
const currentUser = checkAuth();

// 处理发布
document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('publishBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = "发布中...";

    const title = document.getElementById('articleTitle').value;
    const category = document.getElementById('articleCategory').value;
    const tagsStr = document.getElementById('articleTags').value;
    const summary = document.getElementById('articleSummary').value;
    const content = document.getElementById('articleContent').value;

    // Process tags
    const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);

    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) throw new Error("未登录");
        const user = JSON.parse(userJson);

        // Get author name (use username from metadata or email)
        let authorName = user.username || user.user_metadata?.username || user.email.split('@')[0];

        // Prepare article data
        const articleData = {
            title: title,
            category: category,
            tags: tags.join(','), // Convert array to string if backend expects string, or keep as array if JSON
            summary: summary,
            content: content,
            author_id: user.id,
            author_name: authorName
        };

        const response = await fetch(`${API_BASE_URL}/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token if needed
            },
            body: JSON.stringify(articleData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '发布失败');
        }

        console.log("文章发布成功");
        alert("🎉 发布成功！");
        window.location.href = "/index-chinese.html";

    } catch (error) {
        console.error("发布失败: ", error);
        alert("❌ 发布失败: " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 发布文章";
    }
});
