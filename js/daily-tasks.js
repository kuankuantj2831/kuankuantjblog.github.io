/**
 * 每日挑战/任务系统前端模块
 * 结合硬币系统，每天生成任务，完成获奖励
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class DailyTasks {
    constructor() {
        this.tasks = [];
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
    }

    bindEvents() {
        // 任务完成按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('task-complete-btn')) {
                const taskId = e.target.dataset.taskId;
                this.completeTask(taskId);
            }
        });
    }

    async loadTasks() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/tasks/daily`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('加载任务失败');

            const data = await response.json();
            this.tasks = data.tasks || [];
            this.renderTasks();
        } catch (error) {
            console.error('加载每日任务失败:', error);
        }
    }

    renderTasks() {
        const container = document.getElementById('dailyTasksContainer');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = '<p>今日任务已完成！明天再来吧~</p>';
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-info">
                    <h4>${escapeHtml(task.title)}</h4>
                    <p>${escapeHtml(task.description)}</p>
                    <div class="task-reward">奖励: ${task.reward} ⭐</div>
                </div>
                ${!task.completed ? `<button class="task-complete-btn" data-task-id="${task.id}">完成任务</button>` : '<span class="task-done">✅ 已完成</span>'}
            </div>
        `).join('');
    }

    async completeTask(taskId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/tasks/complete/${taskId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('完成任务失败');

            const result = await response.json();
            alert(`任务完成！获得 ${result.reward} 硬币`);

            // 刷新任务列表和硬币余额
            this.loadTasks();
            if (window.coinsApp) window.coinsApp.loadBalance();
        } catch (error) {
            console.error('完成任务失败:', error);
            alert('完成任务失败，请重试');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.dailyTasks = new DailyTasks();
});</content>
<parameter name="filePath">c:\Users\asus\Desktop\my-blog\js\daily-tasks.js