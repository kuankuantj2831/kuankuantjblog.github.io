import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml, formatTime } from './utils.js';

const NOTIF_ICONS = {
    like: '❤️', comment: '💬', reply: '↩️', coin: '🪙',
    system: '📢', follow: '👤', favorite: '⭐'
};

let notifDropdownOpen = false;

export function initNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const bell = document.getElementById('notificationBell');
    if (!bell) return;
    bell.style.display = '';

    // 点击铃铛切换下拉
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    // 全部已读
    const readAllBtn = document.getElementById('notifReadAll');
    if (readAllBtn) {
        readAllBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await markAllRead();
        });
    }

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (notifDropdownOpen && !bell.contains(e.target)) {
            closeDropdown();
        }
    });

    // 加载未读数
    loadNotifCount();
    // 每60秒刷新
    setInterval(loadNotifCount, 60000);
}

async function loadNotifCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const badge = document.getElementById('notifBadge');
        if (badge) {
            const count = data.notifications || 0;
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        console.log('加载通知数失败:', e.message);
    }
}

function toggleDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    if (notifDropdownOpen) {
        closeDropdown();
    } else {
        dd.style.display = 'block';
        notifDropdownOpen = true;
        loadNotifications();
    }
}

function closeDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.style.display = 'none';
    notifDropdownOpen = false;
}

async function loadNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">加载中...</p>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/messages/notifications?page=1&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('加载失败');
        const data = await res.json();
        const notifications = data.notifications || data.data || [];

        if (!notifications.length) {
            list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">暂无通知</p>';
            return;
        }

        list.innerHTML = '';
        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notif-item' + (n.is_read ? '' : ' unread');
            const icon = NOTIF_ICONS[n.type] || '📌';
            const timeStr = n.created_at ? formatTime(n.created_at) : '';
            item.innerHTML = `
                <div class="notif-icon">${icon}</div>
                <div class="notif-text">
                    <div>${escapeHtml(n.content || n.message || '')}</div>
                    <div class="notif-time">${escapeHtml(timeStr)}</div>
                </div>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                markRead(n.id);
                item.classList.remove('unread');
                if (n.link) window.location.href = n.link;
            });
            list.appendChild(item);
        });
    } catch (e) {
        list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">加载失败</p>';
    }
}

async function markRead(id) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/messages/notifications/${encodeURIComponent(id)}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifCount();
    } catch (_) { /* ignore */ }
}

async function markAllRead() {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/messages/notifications/read-all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifCount();
        loadNotifications();
    } catch (_) { /* ignore */ }
}
