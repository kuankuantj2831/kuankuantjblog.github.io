// 个人中心页面逻辑（无Storage版本）
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                console.log('✅ 用户已登录:', user.email);
                this.loadUserData();
            } else {
                console.log('❌ 未登录，跳转到首页');
                window.location.href = '/index-chinese.html';
            }
        });

        this.bindEvents();
        this.hideAvatarUpload(); // 隐藏头像上传功能
    }

    hideAvatarUpload() {
        // 隐藏头像上传按钮
        const uploadBtn = document.querySelector('.avatar-upload-btn');
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
        }
        console.log('ℹ️ 头像上传功能已禁用（需要升级Firebase计划）');
    }

    bindEvents() {
        const infoForm = document.getElementById('profileInfoForm');
        if (infoForm) {
            infoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUserInfo();
            });
        }

        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }
    }

    async loadUserData() {
        try {
            console.log('📥 开始加载用户数据...');

            const emailEl = document.getElementById('profileEmail');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
            }

            const userDocRef = doc(db, 'users', this.currentUser.uid);
            console.log('🔍 查询Firestore文档:', `users/${this.currentUser.uid}`);

            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                this.userData = userDoc.data();
                console.log('✅ 找到用户数据:', this.userData);
            } else {
                console.log('⚠️ 用户文档不存在，创建新文档...');
                this.userData = {
                    email: this.currentUser.email,
                    displayName: this.currentUser.email.split('@')[0],
                    bio: '',
                    photoURL: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                try {
                    await setDoc(userDocRef, this.userData);
                    console.log('✅ 用户文档创建成功');
                } catch (setDocError) {
                    console.error('❌ 创建用户文档失败:', setDocError);
                    if (setDocError.code === 'permission-denied') {
                        alert('⚠️ Firebase权限错误！\n\n请确认已配置Firestore规则。');
                    }
                }
            }

            this.updateUI();
        } catch (error) {
            console.error('❌ 加载用户数据失败:', error);
            const nameEl = document.getElementById('profileName');
            if (nameEl) {
                nameEl.textContent = '加载失败';
            }
        }
    }

    updateUI() {
        console.log('🎨 更新UI...');

        if (!this.userData) {
            console.error('❌ userData为空，无法更新UI');
            return;
        }

        const displayName = this.userData.displayName || this.currentUser.email.split('@')[0];
        const nameEl = document.getElementById('profileName');
        const nameInput = document.getElementById('displayName');

        if (nameEl) nameEl.textContent = displayName;
        if (nameInput) nameInput.value = displayName;

        // 更新头像（只显示首字母，不支持图片）
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            avatarEl.textContent = displayName.charAt(0).toUpperCase();
        }

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = this.currentUser.email;

        const bioInput = document.getElementById('bio');
        if (bioInput) bioInput.value = this.userData.bio || '';

        const dateEl = document.getElementById('profileDate');
        if (dateEl && this.userData.createdAt) {
            const createdDate = new Date(this.userData.createdAt);
            dateEl.textContent = `注册时间：${createdDate.toLocaleDateString('zh-CN')}`;

            const days = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysEl = document.getElementById('statDays');
            if (daysEl) daysEl.textContent = days;
        }

        console.log('✅ UI更新完成');
    }

    async updateUserInfo() {
        try {
            const displayName = document.getElementById('displayName').value.trim();
            const bio = document.getElementById('bio').value.trim();

            if (!displayName) {
                this.showMessage('infoErrorMsg', '用户名不能为空');
                return;
            }

            console.log('💾 更新用户信息:', { displayName, bio });

            await updateDoc(doc(db, 'users', this.currentUser.uid), {
                displayName,
                bio,
                updatedAt: new Date().toISOString()
            });

            await updateProfile(this.currentUser, {
                displayName
            });

            this.userData.displayName = displayName;
            this.userData.bio = bio;

            this.showMessage('infoSuccessMsg', '信息更新成功！');
            this.updateUI();
            console.log('✅ 用户信息更新成功');
        } catch (error) {
            console.error('❌ 更新用户信息失败:', error);
            this.showMessage('infoErrorMsg', '更新失败：' + error.message);
        }
    }

    async changePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showMessage('passwordErrorMsg', '请填写完整信息');
                return;
            }

            if (newPassword.length < 6) {
                this.showMessage('passwordErrorMsg', '新密码至少6个字符');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showMessage('passwordErrorMsg', '两次密码不一致');
                return;
            }

            console.log('🔒 修改密码...');

            const credential = EmailAuthProvider.credential(
                this.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(this.currentUser, credential);
            await updatePassword(this.currentUser, newPassword);

            this.showMessage('passwordSuccessMsg', '密码修改成功！');
            document.getElementById('changePasswordForm').reset();
            console.log('✅ 密码修改成功');
        } catch (error) {
            console.error('❌ 修改密码失败:', error);
            let message = '修改失败';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = '当前密码错误';
            } else if (error.code === 'auth/weak-password') {
                message = '新密码强度太弱';
            }
            this.showMessage('passwordErrorMsg', message);
        }
    }

    showMessage(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            if (message) {
                el.textContent = message;
            }
            el.classList.add('show');
            setTimeout(() => {
                el.classList.remove('show');
            }, 3000);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 个人中心页面加载中...');
    console.log('ℹ️ 头像上传功能已禁用（需要Firebase Blaze计划）');
    window.profileManager = new ProfileManager();
});
