
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
            try {
                this.currentUser = JSON.parse(userJson);
                console.log('✅ 用户已登录:', this.currentUser.email);
            } catch (e) {
                console.error('Json parse error', e);
                localStorage.removeItem('user');
                window.location.href = '/index-chinese.html';
                return;
            }
            this.loadUserData();
        } else {
            console.log('❌ 未登录，跳转到首页');
            window.location.href = '/index-chinese.html';
        }

        this.bindEvents();
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

        const toggle2fa = document.getElementById('toggle2fa');
        if (toggle2fa) {
            toggle2fa.addEventListener('change', (e) => {
                this.toggle2FA(e.target.checked);
            });
        }

        // Hide avatar upload for now as requested/implied by previous code
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) avatarInput.style.display = 'none';
    }

    async loadUserData() {
        try {
            console.log('📥 开始加载用户数据...');

            // Initial UI update from local storage (fast)
            this.updateUI();

            // Fetch profile from backend to get latest username etc
            // Note: /profiles/:id currently returns public info found in 'profiles' table.
            // It might not contain is_2fa_enabled. 
            // The is_2fa_enabled is in 'users' table and usually comes from login response.
            // So we rely on this.currentUser (from localStorage) for 2FA status for now.
            const response = await fetch(`${API_BASE_URL}/profiles/${this.currentUser.id}`);

            if (response.ok) {
                const data = await response.json();
                this.userData = data.data || data;
                console.log('✅ 找到用户数据:', this.userData);

                // Update specific fields that might have changed
                if (this.userData.username) {
                    this.currentUser.username = this.userData.username;
                    // Update local storage to keep it fresh
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                }
            } else {
                console.log('⚠️ 用户文档不存在或获取失败');
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

        const displayName = this.currentUser.username || this.currentUser.email.split('@')[0];
        const nameEl = document.getElementById('profileName');
        const nameInput = document.getElementById('displayName');

        if (nameEl) nameEl.textContent = displayName;
        if (nameInput) nameInput.value = displayName;

        // Update Avatar
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            if (this.currentUser.avatar_url) {
                avatarEl.innerHTML = `<img src="${this.currentUser.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                avatarEl.textContent = displayName.charAt(0).toUpperCase();
            }
        }

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = this.currentUser.email;

        const dateEl = document.getElementById('profileDate');
        if (dateEl && this.currentUser.created_at) {
            const createdDate = new Date(this.currentUser.created_at);
            dateEl.textContent = `注册时间：${createdDate.toLocaleDateString('zh-CN')}`;

            const days = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysEl = document.getElementById('statDays');
            if (daysEl) daysEl.textContent = days;
        }

        // Update 2FA Toggle
        const toggle2fa = document.getElementById('toggle2fa');
        if (toggle2fa) {
            // Force boolean conversion
            const isEnabled = !!this.currentUser.is_2fa_enabled;
            // Only update if different to avoid triggering change event loops if any
            if (toggle2fa.checked !== isEnabled) {
                toggle2fa.checked = isEnabled;
            }
            console.log('UI: 2FA Toggle set to', isEnabled);
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

            // Update local state
            this.currentUser.username = displayName;
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            this.showMessage('infoSuccessMsg', '信息更新成功！');
            this.updateUI();
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
        } catch (error) {
            console.error('❌ 修改密码失败:', error);
            this.showMessage('passwordErrorMsg', '修改失败：' + error.message);
        }
    }

    async toggle2FA(enabled) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('未授权');

            console.log('Sending toggle request:', enabled);

            const response = await fetch(`${API_BASE_URL}/auth/user/2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enable: enabled })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '操作失败');
            }

            // Update local state
            this.currentUser.is_2fa_enabled = enabled ? 1 : 0; // Ensure logic consistency (DB might return 1/0)
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            console.log(`2FA locally updated to: ${this.currentUser.is_2fa_enabled}`);

        } catch (error) {
            console.error('Toggle 2FA error:', error);
            document.getElementById('toggle2fa').checked = !enabled; // Revert switch
            alert('操作失败，请重试: ' + error.message);
        }
    }

    showMessage(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 3000);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
    console.log('⚡ 个人中心已加载');
});
