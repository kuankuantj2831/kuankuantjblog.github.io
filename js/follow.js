/**
 * 关注用户功能模块
 * 处理用户关注、取消关注、关注列表等操作
 */

// 关注数据存储键
const FOLLOW_KEY = 'follow_data';
const FOLLOWED_USERS_KEY = 'followed_users';

function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str || typeof str !== 'string') return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 获取当前用户的关注数据
 */
function getFollowData() {
    try {
        const data = localStorage.getItem(FOLLOW_KEY);
        return data ? JSON.parse(data) : { following: [], followers: [] };
    } catch (e) {
        console.error('获取关注数据失败:', e);
        return { following: [], followers: [] };
    }
}

/**
 * 保存关注数据
 */
function saveFollowData(data) {
    try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('保存关注数据失败:', e);
    }
}

/**
 * 获取已关注的用户列表
 */
function getFollowedUsers() {
    try {
        const data = localStorage.getItem(FOLLOWED_USERS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('获取已关注用户列表失败:', e);
        return [];
    }
}

/**
 * 保存已关注的用户列表
 */
function saveFollowedUsers(users) {
    try {
        localStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('保存已关注用户列表失败:', e);
    }
}

/**
 * 检查是否已关注某个用户
 * @param {string} userId - 用户ID
 */
function isFollowing(userId) {
    const followed = getFollowedUsers();
    return followed.some(u => u.id === userId);
}

/**
 * 关注用户
 * @param {string} userId - 用户ID
 * @param {string} userName - 用户名
 * @param {string} userAvatar - 用户头像（可选）
 */
function followUser(userId, userName, userAvatar = '') {
    if (!userId) {
        showToast('用户信息不完整');
        return false;
    }

    if (isFollowing(userId)) {
        showToast('您已经关注过该用户了');
        return false;
    }

    const followed = getFollowedUsers();
    followed.push({
        id: userId,
        name: userName,
        avatar: userAvatar,
        followTime: new Date().toISOString()
    });
    saveFollowedUsers(followed);

    // 触发关注事件
    window.dispatchEvent(new CustomEvent('userFollowed', {
        detail: { userId, userName, action: 'follow' }
    }));

    showToast(`已关注 ${userName || '该用户'}`);
    updateFollowButtonUI(userId, true);
    return true;
}

/**
 * 取消关注用户
 * @param {string} userId - 用户ID
 */
function unfollowUser(userId) {
    if (!userId) return false;

    let followed = getFollowedUsers();
    const user = followed.find(u => u.id === userId);
    followed = followed.filter(u => u.id !== userId);
    saveFollowedUsers(followed);

    // 触发取消关注事件
    window.dispatchEvent(new CustomEvent('userFollowed', {
        detail: { userId, userName: user?.name, action: 'unfollow' }
    }));

    showToast('已取消关注');
    updateFollowButtonUI(userId, false);
    return true;
}

/**
 * 切换关注状态
 * @param {string} userId - 用户ID
 * @param {string} userName - 用户名
 * @param {string} userAvatar - 用户头像（可选）
 */
function toggleFollow(userId, userName, userAvatar = '') {
    if (!getCurrentUser()) {
        showLoginPrompt();
        return false;
    }

    // 不能关注自己
    const currentUser = getCurrentUser();
    if (currentUser.id === userId) {
        showToast('不能关注自己哦');
        return false;
    }

    if (isFollowing(userId)) {
        return unfollowUser(userId);
    } else {
        return followUser(userId, userName, userAvatar);
    }
}

/**
 * 获取当前登录用户
 */
function getCurrentUser() {
    try {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        return null;
    }
}

/**
 * 显示登录提示
 */
function showLoginPrompt() {
    if (confirm('请先登录后再关注用户')) {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
        } else {
            window.location.href = '/index-chinese.html';
        }
    }
}

/**
 * 轻量提示
 */
function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 24px',
        borderRadius: '8px', fontSize: '14px', zIndex: '9999', transition: 'opacity 0.3s'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
}

/**
 * 更新关注按钮UI
 * @param {string} userId - 用户ID
 * @param {boolean} following - 是否已关注
 */
function updateFollowButtonUI(userId, following) {
    const buttons = document.querySelectorAll(`[data-follow-user="${userId}"]`);
    buttons.forEach(btn => {
        btn.textContent = following ? '✓ 已关注' : '+ 关注';
        btn.classList.toggle('following', following);
        btn.classList.toggle('not-following', !following);
    });
}

/**
 * 创建关注按钮
 * @param {string} userId - 用户ID
 * @param {string} userName - 用户名
 * @param {string} userAvatar - 用户头像
 * @param {string} className - 额外CSS类名
 */
function createFollowButton(userId, userName, userAvatar = '', className = '') {
    const following = isFollowing(userId);
    const btn = document.createElement('button');
    btn.className = `follow-btn ${following ? 'following' : 'not-following'} ${className}`;
    btn.setAttribute('data-follow-user', userId);
    btn.textContent = following ? '✓ 已关注' : '+ 关注';
    btn.onclick = () => toggleFollow(userId, userName, userAvatar);
    return btn;
}

/**
 * 渲染关注列表
 * @param {string} containerId - 容器元素ID
 */
function renderFollowList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const followed = getFollowedUsers();

    if (followed.length === 0) {
        container.innerHTML = `
            <div class="empty-follow-list">
                <p>您还没有关注任何用户</p>
                <a href="/index-chinese.html" class="explore-link">去发现有趣的作者</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="follow-list">
            <div class="follow-count">共关注 ${followed.length} 位用户</div>
            ${followed.map(user => `
                <div class="follow-item" data-user-id="${escapeAttr(user.id)}">
                    <div class="follow-avatar">${user.avatar ? escapeHtml(user.avatar) : (user.name && user.name.charAt(0) ? escapeHtml(user.name.charAt(0).toUpperCase()) : 'U')}</div>
                    <div class="follow-info">
                        <div class="follow-name">${escapeHtml(user.name || '匿名用户')}</div>
                        <div class="follow-time">关注于 ${new Date(user.followTime).toLocaleDateString()}</div>
                    </div>
                    <button class="follow-btn-small following" onclick="unfollowUser('${escapeAttr(user.id)}'); renderFollowList('${escapeAttr(containerId)}');">
                        已关注
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 初始化页面上的所有关注按钮
 */
function initFollowButtons() {
    document.querySelectorAll('[data-follow-init]').forEach(btn => {
        const userId = btn.getAttribute('data-follow-user');
        const userName = btn.getAttribute('data-follow-name');
        const userAvatar = btn.getAttribute('data-follow-avatar') || '';

        if (userId) {
            btn.onclick = () => toggleFollow(userId, userName, userAvatar);
            updateFollowButtonUI(userId, isFollowing(userId));
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initFollowButtons);

// 导出公共API
window.Follow = {
    follow: followUser,
    unfollow: unfollowUser,
    toggle: toggleFollow,
    isFollowing: isFollowing,
    getFollowedUsers: getFollowedUsers,
    createButton: createFollowButton,
    renderList: renderFollowList,
    updateUI: updateFollowButtonUI
};
