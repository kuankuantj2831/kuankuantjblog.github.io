
import { supabase } from './supabase-client.js';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        // 监听登录状态
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                this.currentUser = session.user;
                console.log('✅ 用户已登录:', this.currentUser.email);
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

            // 从 profiles 表获取数据
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (profile) {
                this.userData = profile;
                console.log('✅ 找到用户数据:', this.userData);
            } else {
                console.log('⚠️ 用户文档不存在，创建新文档...');
                // 如果 profile 不存在，尝试创建
                const newProfile = {
                    id: this.currentUser.id,
                    username: this.currentUser.user_metadata.username || this.currentUser.email.split('@')[0],
                    avatar_url: ''
                };

                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([newProfile]);

                if (!insertError) {
                    this.userData = newProfile;
                } else {
                    console.error('❌ 创建用户文档失败:', insertError);
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
            // 如果没有 userData，尝试用 currentUser 的 metadata
            this.userData = {
                username: this.currentUser.user_metadata.username || this.currentUser.email.split('@')[0]
            };
        }

        const displayName = this.userData.username || this.currentUser.email.split('@')[0];
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
        // profiles 表目前没有 bio 字段，如果需要可以加，或者暂时忽略
        if (bioInput) bioInput.value = '';

        const dateEl = document.getElementById('profileDate');
        if (dateEl && this.currentUser.created_at) {
            const createdDate = new Date(this.currentUser.created_at);
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
            // const bio = document.getElementById('bio').value.trim(); // 暂不支持 bio

            if (!displayName) {
                this.showMessage('infoErrorMsg', '用户名不能为空');
                return;
            }

            console.log('💾 更新用户信息:', { displayName });

            // 更新 profiles 表
            const { error } = await supabase
                .from('profiles')
                .update({ username: displayName })
                .eq('id', this.currentUser.id);

            if (error) throw error;

            // 更新 Auth metadata (可选，为了保持一致性)
            await supabase.auth.updateUser({
                data: { username: displayName }
            });

            this.userData.username = displayName;

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
            // Supabase 修改密码不需要旧密码（只要已登录）
            // const currentPassword = document.getElementById('currentPassword').value; 
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!newPassword || !confirmPassword) {
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

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            this.showMessage('passwordSuccessMsg', '密码修改成功！');
            document.getElementById('changePasswordForm').reset();
            console.log('✅ 密码修改成功');
        } catch (error) {
            console.error('❌ 修改密码失败:', error);
            this.showMessage('passwordErrorMsg', '修改失败：' + error.message);
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
    window.profileManager = new ProfileManager();
    console.log('⚡ Supabase个人中心已加载');
});
