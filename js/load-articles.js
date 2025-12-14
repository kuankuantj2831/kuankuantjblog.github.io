import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBspolmlmt50Skx6cq62_sqsUyYXkglBhg",
    authDomain: "my-blog-b5278.firebaseapp.com",
    projectId: "my-blog-b5278",
    storageBucket: "my-blog-b5278.firebasestorage.app",
    messagingSenderId: "1019644740604",
    appId: "1:1019644740604:web:65a21a4f159d01317d2879",
    measurementId: "G-L1P4HP7F9K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadArticles() {
    const container = document.getElementById('articles-container');
    if (!container) return;

    try {
        // 查询最新的 10 篇文章
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
            return;
        }

        container.innerHTML = ''; // 清空加载提示

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'showcase-card';
            card.onclick = () => window.location.href = `/article.html?id=${doc.id}`;

            // 随机封面图 (如果没有上传图片功能，就用随机图)
            const randomImg = `/images/ocean/ocean.png`; // 暂时用默认图

            card.innerHTML = `
                <img src="${data.coverImage || randomImg}" alt="${data.title}" class="showcase-image">
                <div class="showcase-info">
                    <div class="showcase-title">${data.title}</div>
                    <div class="showcase-meta">
                        <span>📂 ${data.category}</span>
                        <span>👤 ${data.authorName}</span>
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${data.summary}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("加载文章列表失败:", error);
        container.innerHTML = '<div style="color:red; text-align:center;">加载失败，请检查网络或数据库权限</div>';
    }
}

loadArticles();
