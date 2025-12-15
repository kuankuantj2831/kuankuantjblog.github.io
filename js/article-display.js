
import { supabase } from './supabase-client.js';

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
        const { data: article, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error) throw error;

        if (article) {
            // 填充页面
            document.title = article.title + " - 天机阁";
            document.getElementById('artTitle').textContent = article.title;
            document.getElementById('artCategory').textContent = "📂 " + article.category;
            document.getElementById('artAuthor').textContent = "👤 " + (article.author_name || '匿名');

            // 格式化时间
            if (article.created_at) {
                const date = new Date(article.created_at);
                document.getElementById('artDate').textContent = "🕒 " + date.toLocaleDateString() + " " + date.toLocaleTimeString();
            }

            // 简单的 Markdown 渲染
            document.getElementById('artBody').innerHTML = article.content
                .replace(/</g, "&lt;").replace(/>/g, "&gt;") // 防XSS
                .replace(/\n/g, "<br>"); // 换行

            // 显示内容，隐藏加载
            document.getElementById('loading').style.display = 'none';
            document.getElementById('articleContent').style.display = 'block';
        } else {
            document.getElementById('loading').innerHTML = "❌ 文章不存在";
        }
    } catch (error) {
        console.error("加载失败:", error);
        document.getElementById('loading').innerHTML = "❌ 加载失败，请检查网络";
    }
}

loadArticle();
