/**
 * 阅读打卡挑战系统
 * 连续阅读文章打卡，完成7天挑战获得额外奖励
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';

class ReadingChallenge {
    constructor(options = {}) {
        this.containerId = options.containerId || 'readingChallengeContainer';
        this.token = localStorage.getItem('token');
        this.challengeDays = 7; // 7天挑战
        this.rewards = {
            daily: { coins: 5, exp: 10 },
            streak3: { coins: 20, exp: 50 },
            streak7: { coins: 100, exp: 200, badge: 'reading_master' }
        };
    }

    init() {
        this.render();
        this.trackReading();
    }

    getReadingData() {
        const data = localStorage.getItem('reading_challenge_data');
        if (data) return JSON.parse(data);
        return {
            streak: 0,
            totalRead: 0,
            lastReadDate: null,
            history: [],
            claimedRewards: []
        };
    }

    saveReadingData(data) {
        localStorage.setItem('reading_challenge_data', JSON.stringify(data));
    }

    checkIn() {
        const today = new Date().toDateString();
        const data = this.getReadingData();

        if (data.lastReadDate === today) {
            return { success: true, alreadyChecked: true, message: '今日已打卡' };
        }

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (data.lastReadDate === yesterday) {
            data.streak += 1;
        } else {
            data.streak = 1; // 断签重置
        }

        data.totalRead += 1;
        data.lastReadDate = today;
        data.history.push({ date: today, articles: 1 });

        // 限制历史记录长度
        if (data.history.length > 30) {
            data.history = data.history.slice(-30);
        }

        this.saveReadingData(data);

        // 发放每日奖励
        this.grantReward(this.rewards.daily);

        // 检查里程碑奖励
        const milestones = [];
        if (data.streak === 3 && !data.claimedRewards.includes('streak3')) {
            data.claimedRewards.push('streak3');
            this.grantReward(this.rewards.streak3);
            milestones.push('连续3天！获得额外奖励');
        }
        if (data.streak === 7 && !data.claimedRewards.includes('streak7')) {
            data.claimedRewards.push('streak7');
            this.grantReward(this.rewards.streak7);
            milestones.push('🎉 7天挑战完成！获得阅读大师徽章');
        }

        this.saveReadingData(data);
        this.render();

        return {
            success: true,
            streak: data.streak,
            milestones,
            message: `打卡成功！连续 ${data.streak} 天`
        };
    }

    async grantReward(reward) {
        try {
            if (!this.token) return;
            await fetch(`${API_BASE_URL}/reading/reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(reward)
            });
        } catch (e) {}
    }

    trackReading() {
        // 监听文章阅读事件
        document.addEventListener('articleRead', () => {
            const result = this.checkIn();
            if (!result.alreadyChecked && result.success) {
                this.showCheckinToast(result);
            }
        });

        // 如果没有自定义事件，也可以通过滚动深度检测
        this.detectArticleReading();
    }

    detectArticleReading() {
        // 如果在文章页面，检测用户是否阅读了足够的内容
        if (!document.querySelector('.article-content, .post-content, article')) return;

        let hasTriggered = false;
        const checkScroll = () => {
            if (hasTriggered) return;
            const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
            if (scrollPercent > 0.5) {
                hasTriggered = true;
                const result = this.checkIn();
                if (!result.alreadyChecked && result.success) {
                    this.showCheckinToast(result);
                }
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
    }

    showCheckinToast(result) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed;top:80px;right:20px;z-index:9999;
            background:linear-gradient(135deg,#667eea,#764ba2);
            color:#fff;padding:16px 20px;border-radius:12px;
            box-shadow:0 8px 30px rgba(102,126,234,0.4);
            font-size:14px;max-width:280px;animation:slideInRight 0.5s ease;
        `;
        toast.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:28px;">📖</span>
                <div>
                    <div style="font-weight:600;margin-bottom:4px;">${result.message}</div>
                    ${result.milestones.map(m => `<div style="font-size:12px;opacity:0.9;margin-top:4px;">${m}</div>`).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    getWeekDates() {
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push({
                date: d.toDateString(),
                dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
                dayNum: d.getDate(),
                isToday: i === 0
            });
        }
        return dates;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const data = this.getReadingData();
        const weekDates = this.getWeekDates();
        const today = new Date().toDateString();
        const isCheckedToday = data.lastReadDate === today;

        container.innerHTML = `
            <div class="reading-challenge-wrapper" style="
                background:linear-gradient(135deg,#1a1a2e,#16213e);
                border-radius:16px;padding:24px;color:#fff;
            ">
                <div class="challenge-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div>
                        <h4 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px;">
                            📚 阅读打卡挑战
                        </h4>
                        <p style="margin:4px 0 0;font-size:13px;color:#8892b0;">
                            连续阅读 ${this.challengeDays} 天，赢取阅读大师徽章
                        </p>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:32px;font-weight:800;color:#f5af19;">${data.streak}</div>
                        <div style="font-size:11px;color:#8892b0;">连续天数</div>
                    </div>
                </div>

                <!-- 7天进度条 -->
                <div class="challenge-progress" style="margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        ${weekDates.map((d, i) => {
                            const isRead = data.history.some(h => h.date === d.date);
                            const isFuture = !d.isToday && new Date(d.date) > new Date();
                            return `
                                <div style="text-align:center;flex:1;">
                                    <div style="
                                        width:36px;height:36px;border-radius:50%;margin:0 auto 4px;
                                        display:flex;align-items:center;justify-content:center;
                                        font-size:14px;font-weight:bold;
                                        ${isRead ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;box-shadow:0 2px 8px rgba(102,126,234,0.4);' :
                                          d.isToday && !isCheckedToday ? 'background:#f5af1920;color:#f5af19;border:2px dashed #f5af19;' :
                                          isFuture ? 'background:#ffffff10;color:#555;' :
                                          'background:#ffffff10;color:#8892b0;border:1px solid #ffffff15;'}
                                    ">
                                        ${isRead ? '✓' : d.dayNum}
                                    </div>
                                    <div style="font-size:11px;color:#8892b0;">${d.dayName}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="height:4px;background:#ffffff10;border-radius:2px;overflow:hidden;">
                        <div style="
                            height:100%;background:linear-gradient(90deg,#667eea,#764ba2);
                            border-radius:2px;transition:width 0.5s ease;
                            width:${Math.min(100, (data.streak / this.challengeDays) * 100)}%;
                        "></div>
                    </div>
                </div>

                <!-- 今日状态 -->
                ${d.isToday && !isCheckedToday ? `
                    <div style="
                        background:#f5af1915;border:1px solid #f5af1930;
                        border-radius:10px;padding:12px;text-align:center;
                    ">
                        <p style="margin:0 0 8px;font-size:13px;color:#f5af19;">
                            🎯 今日尚未打卡，阅读一篇文章即可完成
                        </p>
                        <button onclick="window.readingChallenge.manualCheckin()" style="
                            padding:8px 20px;border:none;border-radius:20px;
                            background:linear-gradient(135deg,#f5af19,#f12711);
                            color:#fff;font-size:13px;font-weight:600;cursor:pointer;
                        ">模拟打卡</button>
                    </div>
                ` : isCheckedToday ? `
                    <div style="
                        background:#52c41a15;border:1px solid #52c41a30;
                        border-radius:10px;padding:12px;text-align:center;
                    ">
                        <p style="margin:0;font-size:13px;color:#52c41a;">
                            ✅ 今日已打卡！连续 ${data.streak} 天，继续保持！
                        </p>
                    </div>
                ` : ''}

                <!-- 里程碑奖励 -->
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <div style="
                        flex:1;min-width:80px;text-align:center;padding:10px;
                        background:#ffffff08;border-radius:10px;
                        ${data.streak >= 3 ? 'border:1px solid #f5af1930;' : ''}
                    ">
                        <div style="font-size:20px;">🥉</div>
                        <div style="font-size:11px;color:#8892b0;margin-top:4px;">3天</div>
                        <div style="font-size:11px;color:#f5af19;">+20币</div>
                        ${data.claimedRewards.includes('streak3') ? '<div style="font-size:10px;color:#52c41a;">✓ 已领取</div>' : ''}
                    </div>
                    <div style="
                        flex:1;min-width:80px;text-align:center;padding:10px;
                        background:#ffffff08;border-radius:10px;
                        ${data.streak >= 7 ? 'border:1px solid #f5af1930;' : ''}
                    ">
                        <div style="font-size:20px;">🥇</div>
                        <div style="font-size:11px;color:#8892b0;margin-top:4px;">7天</div>
                        <div style="font-size:11px;color:#f5af19;">+100币 +徽章</div>
                        ${data.claimedRewards.includes('streak7') ? '<div style="font-size:10px;color:#52c41a;">✓ 已领取</div>' : ''}
                    </div>
                </div>

                <div style="margin-top:16px;text-align:center;font-size:12px;color:#8892b0;">
                    累计阅读 ${data.totalRead} 篇文章
                </div>
            </div>

            <style>
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            </style>
        `;
    }

    manualCheckin() {
        const result = this.checkIn();
        this.showCheckinToast(result);
        this.render();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.readingChallenge = new ReadingChallenge();
});

export default ReadingChallenge;
