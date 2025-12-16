
import { supabase } from './supabase-client.js';

async function loadArticles() {
    const container = document.getElementById('articles-container');
    if (!container) return;

    try {
        console.log('Starting to load articles...');

        if (!supabase) {
            console.error('Supabase client is not initialized.');
            throw new Error('Supabase client missing');
        }
        // 查询最新的 10 篇文章
        const { data: articles, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        console.log('Articles loaded:', articles, 'Error:', error);

        if (error) throw error;

        if (!articles || articles.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
            return;
        }

        container.innerHTML = ''; // 清空加载提示

        articles.forEach((article) => {
            const card = document.createElement('div');
            card.className = 'showcase-card';
            card.onclick = () => window.location.href = `/article.html?id=${article.id}`;

            // 随机封面图 (如果没有上传图片功能，就用随机图)
            const randomImg = `/images/ocean/ocean.png`; // 暂时用默认图

            card.innerHTML = `
                <img src="${article.cover_image || randomImg}" alt="${article.title}" class="showcase-image">
                <div class="showcase-info">
                    <div class="showcase-title">${article.title}</div>
                    <div class="showcase-meta">
                        <span>📂 ${article.category}</span>
                        <span>👤 ${article.author_name || '匿名'}</span>
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${article.summary || ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("加载文章列表失败:", error);
        container.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${error.message || error}<br>请检查网络或数据库权限</div>`;
    }
}

loadArticles();
