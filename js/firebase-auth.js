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

// 初始化Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, query, collection, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 用户认证系统
class FirebaseAuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // 监听登录状态
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 获取用户详细信息（包括头像）
                let photoURL = user.photoURL;
                let displayName = user.displayName || user.email.split('@')[0];

                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (data.photoURL) photoURL = data.photoURL;
                        if (data.displayName) displayName = data.displayName;
                    }
                } catch (error) {
                    console.error("获取用户数据失败:", error);
                }

                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    username: displayName,
                    photoURL: photoURL
                };
                this.updateUI();
            } else {
                this.currentUser = null;
                this.updateUI();
            }
        });

        this.bindEvents();
    }

    bindEvents() {
        // 登录按钮
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // 注册按钮
        const registerBtn = document.querySelector('.register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        // 关闭按钮
        document.querySelectorAll('.auth-modal-close, .auth-modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    this.closeModals();
                }
            });
        });

        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 切换按钮
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    showLoginModal() {
        this.closeModals();
        const modal = document.getElementById('loginModal');
        if (modal) {
            setTimeout(() => modal.classList.add('active'), 100);
        }
    }

    showRegisterModal() {
        this.closeModals();
        const modal = document.getElementById('registerModal');
        if (modal) {
            setTimeout(() => modal.classList.add('active'), 100);
        }
    }

    closeModals() {
        document.querySelectorAll('.auth-modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
            el.classList.remove('show');
        });
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // 验证
        if (!username || !email || !password || !confirmPassword) {
            this.showError('registerError', '请填写完整信息');
            return;
        }

        if (username.length < 3) {
            this.showError('registerError', '用户名至少3个字符');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', '密码至少6个字符');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('registerError', '两次密码不一致');
            return;
        }

        try {
            // 检查用户名是否已被使用
            const usernamesRef = collection(db, 'usernames');
            const q = query(usernamesRef, where('username', '==', username.toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                this.showError('registerError', '用户名已被使用');
                return;
            }

            // Firebase注册
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 保存用户名映射
            await setDoc(doc(db, 'usernames', username.toLowerCase()), {
                email: email,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            // 保存用户信息
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                displayName: username,
                bio: '',
                photoURL: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            this.showSuccess('registerSuccess', '注册成功！');

            setTimeout(() => {
                this.closeModals();
                document.getElementById('registerForm').reset();
            }, 1500);
        } catch (error) {
            console.error('注册错误:', error);
            let message = '注册失败';
            if (error.code === 'auth/email-already-in-use') {
                message = '邮箱已被注册';
            } else if (error.code === 'auth/invalid-email') {
                message = '邮箱格式不正确';
            } else if (error.code === 'auth/weak-password') {
                message = '密码强度太弱';
            }
            this.showError('registerError', message);
        }
    }

    async handleLogin() {
        const input = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!input || !password) {
            this.showError('loginError', '请填写完整信息');
            return;
        }

        try {
            let email = input;

            // 判断输入的是用户名还是邮箱
            if (!input.includes('@')) {
                // 输入的是用户名，需要查找对应的邮箱
                console.log('🔍 查找用户名:', input);
                const usernameDoc = await getDoc(doc(db, 'usernames', input.toLowerCase()));

                if (!usernameDoc.exists()) {
                    this.showError('loginError', '用户名或密码错误');
                    return;
                }

                email = usernameDoc.data().email;
                console.log('✅ 找到邮箱:', email);
            }

            // Firebase登录
            await signInWithEmailAndPassword(auth, email, password);
            this.showSuccess('loginSuccess', '登录成功！');

            setTimeout(() => {
                this.closeModals();
                document.getElementById('loginForm').reset();
            }, 1000);
        } catch (error) {
            console.error('登录错误:', error);
            let message = '登录失败';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = '用户名/邮箱或密码错误';
            } else if (error.code === 'auth/invalid-email') {
                message = '邮箱格式不正确';
            }
            this.showError('loginError', message);
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('退出错误:', error);
            alert('退出失败');
        }
    }

    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');
        const userMenu = document.querySelector('.user-menu');

        if (this.currentUser) {
            // 已登录
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'inline-block';
                const avatar = userMenu.querySelector('.user-avatar');
                const userName = userMenu.querySelector('.user-dropdown-name');
                const userEmail = userMenu.querySelector('.user-dropdown-email');

                if (avatar) {
                    if (this.currentUser.photoURL) {
                        avatar.innerHTML = `<img src="${this.currentUser.photoURL}" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                    } else {
                        avatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
                    }
                }
                if (userName) userName.textContent = this.currentUser.username;
                if (userEmail) userEmail.textContent = this.currentUser.email;
            }
        } else {
            // 未登录
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 3000);
        }
    }

    showSuccess(elementId, message) {
        const successEl = document.getElementById(elementId);
        if (successEl) {
            successEl.textContent = message;
            successEl.classList.add('show');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseAuthSystem = new FirebaseAuthSystem();
    console.log('🔥 Firebase认证系统已加载（支持用户名/邮箱登录）');
});
