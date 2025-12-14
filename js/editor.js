import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase配置
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
const auth = getAuth(app);
const db = getFirestore(app);

// 检查登录状态
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("请先登录后再发布文章！");
        window.location.href = "/index-chinese.html";
    } else {
        console.log("当前用户:", user.email);
    }
});

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
        const user = auth.currentUser;
        if (!user) throw new Error("未登录");

        // 写入数据库
        const docRef = await addDoc(collection(db, "articles"), {
            title: title,
            category: category,
            tags: tags,
            summary: summary,
            content: content,
            authorId: user.uid,
            authorName: user.displayName || user.email.split('@')[0], // 优先用用户名，没有则用邮箱前缀
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            views: 0
        });

        console.log("文章发布成功，ID: ", docRef.id);
        alert("🎉 发布成功！");
        window.location.href = "/index-chinese.html"; // 或者跳转到文章详情页

    } catch (error) {
        console.error("发布失败: ", error);
        alert("❌ 发布失败: " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 发布文章";
    }
});
