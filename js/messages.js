import { API_BASE_URL } from './api-config.js';
import { escapeHtml, formatTime } from './utils.js';

let currentUser = null;
let currentChatUserId = null;
let chatRefreshTimer = null;

// --- 初始化 ---
function init() {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        window.location.href = '/index-chinese.html';
        return;
    }
    try {
        currentUser = JSON.parse(userJson);
    } catch (e) {
        localStorage.removeItem('user');
        window.location.href = '/index-chinese.html';
        return;
    }

    loadConversations();
    loadNotifications();
    loadUnreadCounts();
    bindEvents();
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- 标签切换 ---
window.switchTab = function (tab) {
    document.querySelectorAll('.messages-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.messages-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(tab === 'chat' ? 'chatPanel' : 'notificationsPanel').classList.add('active');

    if (tab === 'chat') {
        closeChatView();
    }
};

// --- 会话列表 ---
async function loadConversations() {
    const listEl = document.getElementById('conversationList');
    if (!listEl) { console.warn('[Messages] conversationList not found'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const conversations = await res.json();

        if (!conversations.length) {
            listEl.innerHTML = `<div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">还没有消息，搜索用户发起对话吧</div>
            </div>`;
            return;
        }

        // 查询在线状态
        let onlineMap = {};
        try {
            const ids = conversations.map(c => c.user_id).join(',');
            const onRes = await fetch(`${API_BASE_URL}/online/status?userIds=${ids}`);
            if (onRes.ok) onlineMap = (await onRes.json()).online || {};
        } catch (e) { /* ignore */ }

        listEl.innerHTML = conversations.map(conv => {
            const avatarContent = conv.avatar_url
                ? `<img src="${escapeAttr(conv.avatar_url)}" alt="">`
                : escapeHtml(conv.username.charAt(0).toUpperCase());
            const timeStr = formatTime(conv.last_time);
            const preview = escapeHtml((conv.last_message || '').substring(0, 40));
            const unreadHtml = conv.unread_count > 0
                ? `<div class="conversation-unread">${conv.unread_count}</div>`
                : '';
            const onlineDot = onlineMap[conv.user_id]
                ? `<span class="online-dot" title="在线"></span>`
                : `<span class="offline-dot" title="离线"></span>`;

            return `<div class="conversation-item" onclick="openChat(${conv.user_id}, '${escapeAttr(conv.username)}')">
                <div class="conversation-avatar">${avatarContent}${onlineDot}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${escapeHtml(conv.username)}</div>
                    <div class="conversation-preview">${preview}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${timeStr}</div>
                    ${unreadHtml}
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('加载会话失败:', e);
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">加载失败，请刷新重试</div>
        </div>`;
    }
}

// --- 聊天视图 ---
window.openChat = async function (userId, username) {
    currentChatUserId = userId;
    const chatUserName = document.getElementById('chatUserName');
    if (chatUserName) chatUserName.textContent = username;

    // 隐藏空状态，显示聊天界面
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';
    const chatHeader = document.getElementById('chatHeader');
    if (chatHeader) chatHeader.style.display = 'flex';
    const messagesList = document.getElementById('messagesList');
    if (messagesList) messagesList.style.display = 'block';
    const chatInputArea = document.getElementById('chatInputArea');
    if (chatInputArea) chatInputArea.style.display = 'block';

    await loadChatMessages(userId);

    // 自动刷新聊天（页面不可见时暂停）
    if (chatRefreshTimer) clearInterval(chatRefreshTimer);
    chatRefreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible') loadChatMessages(userId);
    }, 5000);

    // 聚焦输入框
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
};

window.closeChatView = function () {
    currentChatUserId = null;
    if (chatRefreshTimer) {
        clearInterval(chatRefreshTimer);
        chatRefreshTimer = null;
    }

    // 显示空状态，隐藏聊天界面
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'flex';
    const chatHeader = document.getElementById('chatHeader');
    if (chatHeader) chatHeader.style.display = 'none';
    const messagesList = document.getElementById('messagesList');
    if (messagesList) messagesList.style.display = 'none';
    const chatInputArea = document.getElementById('chatInputArea');
    if (chatInputArea) chatInputArea.style.display = 'none';

    // 刷新会话列表和未读数
    loadConversations();
    loadUnreadCounts();
};

async function loadChatMessages(userId) {
    const container = document.getElementById('messagesList');
    if (!container) { console.warn('[Messages] messagesList not found'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/messages/conversation/${userId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const messages = await res.json();

        const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

        container.innerHTML = messages.map(msg => {
            const isSent = msg.sender_id === currentUser.id;
            const timeStr = formatTime(msg.created_at);
            return `<div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                ${escapeHtml(msg.content)}
                <div class="chat-bubble-time">${timeStr}</div>
            </div>`;
        }).join('');

        if (!messages.length) {
            container.innerHTML = `<div class="empty-state" style="padding:40px;">
                <div class="empty-state-icon">👋</div>
                <div class="empty-state-text">开始聊天吧</div>
            </div>`;
        }

        // 保持滚动位置或滚到底部
        if (wasAtBottom || container.dataset.firstLoad !== 'done') {
            container.scrollTop = container.scrollHeight;
            container.dataset.firstLoad = 'done';
        }
    } catch (e) {
        console.error('加载聊天记录失败:', e);
    }
}

// --- 发送消息 ---
window.sendMessage = async function () {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const content = input.value.trim();
    if (!content || !currentChatUserId) return;

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ receiverId: currentChatUserId, content })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || '发送失败');
        }

        input.value = '';
        await loadChatMessages(currentChatUserId);
    } catch (e) {
        console.error('发送失败:', e);
        alert(e.message || '发送失败，请重试');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
};

// --- 搜索用户 ---
let searchTimer = null;

function bindEvents() {
    const searchInput = document.getElementById('searchUserInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => searchUsers(searchInput.value), 300);
        });
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

async function searchUsers(keyword) {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;
    if (!keyword || keyword.trim().length < 1) {
        resultsEl.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/messages/users/search?q=${encodeURIComponent(keyword)}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();

        if (!users.length) {
            resultsEl.innerHTML = '<div style="padding:12px 20px;color:#999;font-size:13px;">未找到用户</div>';
            return;
        }

        resultsEl.innerHTML = users.map(u => {
            const avatarContent = u.avatar_url
                ? `<img src="${escapeAttr(u.avatar_url)}" alt="">`
                : escapeHtml(u.username.charAt(0).toUpperCase());
            return `<div class="search-result-item" onclick="openChat(${u.id}, '${escapeAttr(u.username)}')">
                <div class="search-result-avatar">${avatarContent}</div>
                <span>${escapeHtml(u.username)}</span>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('搜索用户失败:', e);
    }
}

// --- 通知 ---
async function loadNotifications() {
    const listEl = document.getElementById('notificationList');
    if (!listEl) { console.warn('[Messages] notificationList not found'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/messages/notifications`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.notifications.length) {
            listEl.innerHTML = `<div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <div class="empty-state-text">暂无通知</div>
            </div>`;
            return;
        }

        const iconMap = {
            comment: '💬',
            like: '❤️',
            favorite: '⭐',
            system: '📢',
            article: '📝'
        };

        listEl.innerHTML = data.notifications.map(n => {
            const icon = iconMap[n.type] || '📢';
            const timeStr = formatTime(n.created_at);
            const unreadClass = n.is_read ? '' : ' unread';

            return `<div class="notification-item${unreadClass}" id="notif-${n.id}" onclick="markNotifRead(${n.id})">
                <div class="notification-icon">${icon}</div>
                <div class="notification-body">
                    <div class="notification-title">${escapeHtml(n.title)}</div>
                    ${n.content ? `<div class="notification-text">${escapeHtml(n.content)}</div>` : ''}
                    <div class="notification-time">${timeStr}</div>
                </div>
                <div class="notification-actions">
                    <button class="notification-delete" onclick="event.stopPropagation();deleteNotif(${n.id})" title="删除">✕</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('加载通知失败:', e);
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">加载失败，请刷新重试</div>
        </div>`;
    }
}

window.markNotifRead = async function (id) {
    try {
        await fetch(`${API_BASE_URL}/messages/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const el = document.getElementById(`notif-${id}`);
        if (el) el.classList.remove('unread');
        loadUnreadCounts();
    } catch (e) {
        console.error(e);
    }
};

window.markAllRead = async function () {
    try {
        await fetch(`${API_BASE_URL}/messages/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        document.querySelectorAll('.notification-item.unread').forEach(el => el.classList.remove('unread'));
        loadUnreadCounts();
    } catch (e) {
        console.error(e);
        alert('操作失败');
    }
};

window.deleteNotif = async function (id) {
    try {
        await fetch(`${API_BASE_URL}/messages/notifications/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const el = document.getElementById(`notif-${id}`);
        if (el) el.remove();

        // 检查是否为空
        const list = document.getElementById('notificationList');
        if (!list.querySelector('.notification-item')) {
            list.innerHTML = `<div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <div class="empty-state-text">暂无通知</div>
            </div>`;
        }
        loadUnreadCounts();
    } catch (e) {
        console.error(e);
    }
};

// --- 未读数 ---
async function loadUnreadCounts() {
    try {
        const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();

        const chatBadge = document.getElementById('chatBadge');
        const notifBadge = document.getElementById('notifBadge');

        if (chatBadge) {
            chatBadge.textContent = data.messages > 0 ? data.messages : '';
            chatBadge.dataset.count = data.messages;
        }
        if (notifBadge) {
            notifBadge.textContent = data.notifications > 0 ? data.notifications : '';
            notifBadge.dataset.count = data.notifications;
        }
    } catch (e) {
        console.error('获取未读数失败:', e);
    }
}

// --- 工具函数 ---
function escapeAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// --- 启动 ---
document.addEventListener('DOMContentLoaded', init);
