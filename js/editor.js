
import { supabase } from './supabase-client.js';

// 检查登录状态
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("请先登录后再发布文章！");
        window.location.href = "/index-chinese.html";
    } else {
        console.log("当前用户:", user.email);
    }
}
checkAuth();

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

    // 处理标签
    const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("未登录");

        // 获取作者名 (优先用 profile 中的 username)
        let authorName = user.user_metadata.username || user.email.split('@')[0];

        // 尝试从 profiles 表获取最新用户名
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (profile && profile.username) {
            authorName = profile.username;
        }

        // 写入数据库
        const { data, error } = await supabase
            .from('articles')
            .insert([
                {
                    title: title,
                    category: category,
                    tags: tags, // Supabase 支持数组类型
                    summary: summary,
                    content: content,
                    author_id: user.id,
                    author_name: authorName
                }
            ])
            .select();

        if (error) throw error;

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
