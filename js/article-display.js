import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        const docRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // 填充页面
            document.title = data.title + " - 天机阁";
            document.getElementById('artTitle').textContent = data.title;
            document.getElementById('artCategory').textContent = "📂 " + data.category;
            document.getElementById('artAuthor').textContent = "👤 " + data.authorName;

            // 格式化时间
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                document.getElementById('artDate').textContent = "🕒 " + date.toLocaleDateString() + " " + date.toLocaleTimeString();
            }

            // 简单的 Markdown 渲染 (如果需要更强功能可以引入 marked.js)
            // 这里暂时直接显示，或者做简单的换行处理
            document.getElementById('artBody').innerHTML = data.content
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
