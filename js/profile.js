
import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.favoritesPage = 1;
        this.favoritesTotal = 0;
        this.viewingUserId = null;  // 正在查看的用户ID（null=自己）
        this.isOwnProfile = true;   // 是否查看自己的主页
        this.init();
    }

    init() {
        // 检查 URL 是否指定了要查看的用户
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('id');

        // Check login status from localStorage
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                this.currentUser = JSON.parse(userJson);
                console.log('✅ 用户已登录:', this.currentUser.email);
            } catch (e) {
                console.error('Json parse error', e);
                localStorage.removeItem('user');
            }
        }

        if (viewId) {
            this.viewingUserId = parseInt(viewId);
            this.isOwnProfile = this.currentUser && this.currentUser.id === this.viewingUserId;
        } else {
            // 没有 id 参数，查看自己的主页，需要登录
            if (!this.currentUser) {
                console.log('❌ 未登录，跳转到首页');
                window.location.href = '/index-chinese.html';
                return;
            }
            this.viewingUserId = this.currentUser.id;
            this.isOwnProfile = true;
        }

        // 非自己的主页时隐藏编辑功能
        if (!this.isOwnProfile) {
            this.hideEditControls();
        }

        this.loadUserData();
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

        // 头像上传
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.uploadAvatar(e.target.files[0]);
                }
            });
        }
    }

    hideEditControls() {
        // 查看他人主页时隐藏所有编辑功能
        const selectors = [
            '#profileInfoForm',      // 修改用户名表单
            '#changePasswordForm',   // 修改密码表单
            '#avatarInput',          // 头像上传
            '.avatar-upload-btn',    // 头像上传按钮
            '.toggle-2fa-section',   // 2FA 开关区域
        ];
        selectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.style.display = 'none';
        });
        // 隐藏 2FA toggle 的父容器
        const toggle2fa = document.getElementById('toggle2fa');
        if (toggle2fa) {
            const parent = toggle2fa.closest('.setting-item') || toggle2fa.parentElement;
            if (parent) parent.style.display = 'none';
        }
    }

    async loadUserData() {
        try {
            console.log('📥 开始加载用户数据...');

            const targetId = this.viewingUserId;

            // 查看自己的主页时，先用本地缓存快速渲染
            if (this.isOwnProfile && this.currentUser) {
                this.updateUI();
            }

            let response;
            try {
                response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(targetId)}`);
            } catch (networkError) {
                console.warn('⚠️ 网络连接失败:', networkError.message);
                if (this.isOwnProfile) return; // 自己的主页用缓存
                const nameEl = document.getElementById('profileName');
                if (nameEl) nameEl.textContent = '加载失败，请刷新重试';
                return;
            }

            if (response.ok) {
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.warn('⚠️ 服务器返回数据格式异常');
                    return;
                }

                this.userData = data.data || data;
                console.log('✅ 找到用户数据:', this.userData);

                if (this.isOwnProfile && this.currentUser) {
                    // 同步到本地缓存
                    if (this.userData.username) {
                        this.currentUser.username = this.userData.username;
                    }
                    if (this.userData.is_2fa_enabled !== undefined) {
                        this.currentUser.is_2fa_enabled = this.userData.is_2fa_enabled;
                    }
                    if (this.userData.avatar_url !== undefined) {
                        this.currentUser.avatar_url = this.userData.avatar_url;
                    }
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                }
            } else {
                console.log('⚠️ 用户文档不存在或获取失败 (HTTP ' + response.status + ')');
                const nameEl = document.getElementById('profileName');
                if (nameEl) nameEl.textContent = '用户不存在';
                return;
            }

            this.updateUI();
            this.loadFavorites();
        } catch (error) {
            console.error('❌ 加载用户数据失败:', error);
            const nameEl = document.getElementById('profileName');
            if (nameEl) {
                nameEl.textContent = '加载失败，请刷新重试';
            }
        }
    }

    updateUI() {
        console.log('🎨 更新UI...');

        // 确定数据来源：查看他人时用 userData，查看自己时优先 currentUser
        const user = this.isOwnProfile ? (this.currentUser || this.userData) : this.userData;
        if (!user) return;

        const displayName = user.username || (user.email ? user.email.split('@')[0] : '用户');
        const nameEl = document.getElementById('profileName');
        const nameInput = document.getElementById('displayName');

        if (nameEl) nameEl.textContent = displayName;
        if (nameInput) nameInput.value = displayName;

        // 等级展示
        const levelData = this.userData && this.userData.levelInfo;
        const levelBar = document.getElementById('profileLevelBar');
        if (levelBar && levelData) {
            levelBar.style.display = '';
            const badge = document.getElementById('profileLevelBadge');
            const expEl = document.getElementById('profileLevelExp');
            const progEl = document.getElementById('profileLevelProgress');
            const lvClass = 'level-' + Math.min(levelData.level, 5);
            if (badge) { badge.className = 'user-level-badge ' + lvClass; badge.textContent = 'Lv' + levelData.level; }
            if (expEl) expEl.textContent = levelData.nextExp ? `${levelData.exp} / ${levelData.nextExp} EXP` : `${levelData.exp} EXP (MAX)`;
            if (progEl) progEl.style.width = Math.round(levelData.progress * 100) + '%';
        }

        // Update Avatar
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            if (user.avatar_url) {
                avatarEl.textContent = '';
                const img = document.createElement('img');
                img.src = user.avatar_url;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
                avatarEl.appendChild(img);
            } else {
                avatarEl.textContent = displayName.charAt(0).toUpperCase();
            }
        }

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = user.email || '';

        const dateEl = document.getElementById('profileDate');
        if (dateEl && user.created_at) {
            const createdDate = new Date(user.created_at);
            dateEl.textContent = `注册时间：${createdDate.toLocaleDateString('zh-CN')}`;

            const days = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
            const daysEl = document.getElementById('statDays');
            if (daysEl) daysEl.textContent = days;
        }

        // Update 2FA Toggle (only for own profile)
        if (this.isOwnProfile) {
            const toggle2fa = document.getElementById('toggle2fa');
            if (toggle2fa) {
                const isEnabled = !!user.is_2fa_enabled;
                if (toggle2fa.checked !== isEnabled) {
                    toggle2fa.checked = isEnabled;
                }
                console.log('UI: 2FA Toggle set to', isEnabled);
            }
        }

        console.log('✅ UI更新完成');
    }

    async uploadAvatar(file) {
        // 前端校验：文件大小
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过 2MB');
            return;
        }
        // 前端校验：MIME type
        if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
            alert('只支持 JPG/PNG/GIF/WebP 格式');
            return;
        }
        // 前端校验：读取文件头魔法字节验证真实类型
        try {
            const header = await file.slice(0, 12).arrayBuffer();
            const bytes = new Uint8Array(header);
            const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
            const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
            const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
            const isWEBP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
                        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
            if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
                alert('文件内容不是有效的图片格式');
                return;
            }
        } catch (_) { /* 读取失败则交给后端校验 */ }

        const avatarEl = document.getElementById('profileAvatar');
        const uploadBtn = document.querySelector('.avatar-upload-btn');
        const originalBtnText = uploadBtn ? uploadBtn.textContent : '';

        try {
            if (uploadBtn) uploadBtn.textContent = '⏳';

            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(this.currentUser.id)}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || '上传失败');
            }

            const result = await response.json();
            const avatarUrl = result.avatar_url;

            // 更新本地状态
            this.currentUser.avatar_url = avatarUrl;
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            // 更新头像显示
            if (avatarEl) {
                avatarEl.textContent = '';
                const img = document.createElement('img');
                img.src = avatarUrl;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
                avatarEl.appendChild(img);
            }

            if (uploadBtn) uploadBtn.textContent = '✅';
            setTimeout(() => { if (uploadBtn) uploadBtn.textContent = '📷'; }, 1500);
        } catch (error) {
            console.error('❌ 头像上传失败:', error);
            alert('头像上传失败：' + error.message);
            if (uploadBtn) uploadBtn.textContent = originalBtnText || '📷';
        }

        // 清空 input 以便重复选择同一文件
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) avatarInput.value = '';
    }

    async updateUserInfo() {
        try {
            const displayNameEl = document.getElementById('displayName');
            const displayName = displayNameEl ? displayNameEl.value.trim() : '';

            if (!displayName) {
                this.showMessage('infoErrorMsg', '用户名不能为空');
                return;
            }

            if (displayName.length > 50) {
                this.showMessage('infoErrorMsg', '用户名不能超过50个字符');
                return;
            }

            console.log('💾 更新用户信息:', { displayName });

            let response;
            try {
                const token = localStorage.getItem('token');
                response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(this.currentUser.id)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username: displayName })
                });
            } catch (networkError) {
                throw new Error('网络连接失败，请检查网络后重试');
            }

            if (!response.ok) {
                let errMsg = '更新失败';
                try {
                    const data = await response.json();
                    errMsg = data.message || errMsg;
                } catch (_) { /* 忽略解析错误 */ }
                throw new Error(errMsg);
            }

            // Update local state
            this.currentUser.username = displayName;
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            this.showMessage('infoSuccessMsg', '信息更新成功！');
            this.updateUI();
        } catch (error) {
            console.error('❌ 更新用户信息失败:', error);
            this.showMessage('infoErrorMsg', '更新失败：' + (error.message || '未知错误'));
        }
    }

    async changePassword() {
        try {
            const newPasswordEl = document.getElementById('newPassword');
            const confirmPasswordEl = document.getElementById('confirmPassword');
            const newPassword = newPasswordEl ? newPasswordEl.value : '';
            const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';

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

            let response;
            try {
                const token = localStorage.getItem('token');
                response = await fetch(`${API_BASE_URL}/auth/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        password: newPassword
                    })
                });
            } catch (networkError) {
                throw new Error('网络连接失败，请检查网络后重试');
            }

            if (!response.ok) {
                let errMsg = '修改失败';
                try {
                    const data = await response.json();
                    errMsg = data.message || errMsg;
                } catch (_) { /* 忽略解析错误 */ }
                throw new Error(errMsg);
            }

            this.showMessage('passwordSuccessMsg', '密码修改成功！');
            const passwordForm = document.getElementById('changePasswordForm');
            if (passwordForm) passwordForm.reset();
        } catch (error) {
            console.error('❌ 修改密码失败:', error);
            this.showMessage('passwordErrorMsg', '修改失败：' + (error.message || '未知错误'));
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

    async loadFavorites(append = false) {
        const listEl = document.getElementById('favoritesList');
        const loadMoreEl = document.getElementById('favoritesLoadMore');
        if (!listEl) return;

        if (!this.viewingUserId) {
            listEl.innerHTML = '<p style="text-align:center;color:#999;">请先登录</p>';
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/favorites?userId=${encodeURIComponent(this.viewingUserId)}&page=${this.favoritesPage}&limit=5`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            this.favoritesTotal = data.pagination.total;

            // 更新统计数字
            const statEl = document.getElementById('statFavorites');
            if (statEl) statEl.textContent = this.favoritesTotal;

            if (!append) listEl.innerHTML = '';

            if (data.articles.length === 0 && !append) {
                listEl.innerHTML = '<p style="text-align:center;color:#999;">还没有收藏文章，去看看有什么好文章吧~</p>';
                if (loadMoreEl) loadMoreEl.style.display = 'none';
                return;
            }

            data.articles.forEach(article => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:12px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background 0.2s;';
                item.onmouseenter = () => item.style.background = '#f9f9f9';
                item.onmouseleave = () => item.style.background = 'transparent';

                const title = escapeHtml(article.title || '无标题');
                const summary = escapeHtml((article.summary || '').substring(0, 80));
                const date = article.favorited_at ? new Date(article.favorited_at).toLocaleDateString('zh-CN') : '';
                const category = article.category ? `<span style="background:#e6f7ff;color:#1890ff;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px;">${escapeHtml(article.category)}</span>` : '';

                item.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:15px;font-weight:500;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${title}${category}
                            </div>
                            ${summary ? `<div style="font-size:13px;color:#999;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${summary}</div>` : ''}
                        </div>
                        <div style="font-size:12px;color:#bbb;margin-left:12px;white-space:nowrap;">${date}</div>
                    </div>
                `;
                item.onclick = () => { window.location.href = `/article.html?id=${article.id}`; };
                listEl.appendChild(item);
            });

            // 显示/隐藏加载更多按钮
            if (loadMoreEl) {
                const loaded = this.favoritesPage * 5;
                loadMoreEl.style.display = loaded < this.favoritesTotal ? 'block' : 'none';
            }
        } catch (e) {
            console.error('加载收藏失败:', e);
            if (!append) listEl.innerHTML = '<p style="text-align:center;color:#999;">加载失败，请刷新重试</p>';
        }
    }

    loadMoreFavorites() {
        this.favoritesPage++;
        this.loadFavorites(true);
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
