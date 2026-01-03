
import { API_BASE_URL } from './api-config.js';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        // Check login status from localStorage
        const userJson = localStorage.getItem('user');
        if (userJson) {
            this.currentUser = JSON.parse(userJson);
            console.log('✅ 用户已登录:', this.currentUser.email);
            this.loadUserData();
        } else {
            console.log('❌ 未登录，跳转到首页');
            window.location.href = '/index-chinese.html';
        }

        this.bindEvents();
        this.hideAvatarUpload(); // Hide avatar upload
    }

    async loadUserData() {
        try {
            console.log('📥 开始加载用户数据...');

            const emailEl = document.getElementById('profileEmail');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
            }

            // Fetch profile from backend
            const response = await fetch(`${API_BASE_URL}/profiles/${this.currentUser.id}`);

            if (response.ok) {
                const data = await response.json();
                // Handle response structure (direct object or { data: ... })
                this.userData = data.data || data;
                console.log('✅ 找到用户数据:', this.userData);
            } else {
                console.log('⚠️ 用户文档不存在或获取失败');
                // Fallback to basic user info
                this.userData = {
                    id: this.currentUser.id,
                    username: this.currentUser.username || this.currentUser.email.split('@')[0],
                    avatar_url: ''
                };
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

            if (!displayName) {
                this.showMessage('infoErrorMsg', '用户名不能为空');
                return;
            }

            console.log('💾 更新用户信息:', { displayName });

            // Update profile via API
            const response = await fetch(`${API_BASE_URL}/profiles/${this.currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username: displayName })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '更新失败');
            }

            this.userData.username = displayName;

            // Update local storage user data as well
            this.currentUser.username = displayName;
            localStorage.setItem('user', JSON.stringify(this.currentUser));

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

            const response = await fetch(`${API_BASE_URL}/auth/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    password: newPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '修改失败');
            }

            this.showMessage('passwordSuccessMsg', '密码修改成功！');
            document.getElementById('changePasswordForm').reset();
            console.log('✅ 密码修改成功');
        } catch (error) {
            console.error('❌ 修改密码失败:', error);
            this.showMessage('passwordErrorMsg', '修改失败：' + error.message);
        }
        this.showMessage('passwordSuccessMsg', '密码修改成功！');
        document.getElementById('changePasswordForm').reset();
        console.log('✅ 密码修改成功');
    } catch(error) {
        console.error('❌ 修改密码失败:', error);
        this.showMessage('passwordErrorMsg', '修改失败：' + error.message);
    }
}

    async toggle2FA(enabled) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/user/2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ enable: enabled })
        });

        if (!response.ok) {
            throw new Error('操作失败');
        }

        this.currentUser.is_2fa_enabled = enabled;
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        console.log(`2FA ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Toggle 2FA error:', error);
        document.getElementById('toggle2fa').checked = !enabled; // Revert switch
        alert('操作失败，请重试');
    }
}

bindEvents() {
    // ... existing events ...
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

    const toggle2fa = document.getElementById('toggle2fa');
    if (toggle2fa) {
        toggle2fa.addEventListener('change', (e) => {
            this.toggle2FA(e.target.checked);
        });
    }
}

    async loadUserData() {
    try {
        // ... existing load logic ...

        // Update 2FA toggle state
        const toggle2fa = document.getElementById('toggle2fa');
        if (toggle2fa) {
            // We should get the latest status from API, but for now use local or currentUser
            // Ideally, /profiles/:id should return is_2fa_enabled
            // If not, we might need to rely on what's in currentUser from login
            toggle2fa.checked = !!this.currentUser.is_2fa_enabled;
        }

        // ... rest of loadUserData ...


        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            window.profileManager = new ProfileManager();
            console.log('⚡ Supabase个人中心已加载');
        });
