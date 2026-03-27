/**
 * 文章投票系统
 * 用户可以对文章进行投票评分
 */

class ArticleVote {
    constructor(articleId, options = {}) {
        this.articleId = articleId;
        this.apiUrl = options.apiUrl || '/api/votes';
        this.containerId = options.containerId || 'voteSection';
        
        this.userVote = null;
        this.totalVotes = 0;
        this.averageScore = 0;
        this.voteDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    /**
     * 初始化投票组件
     */
    async init() {
        await this.loadVoteData();
        this.createUI();
        this.bindEvents();
    }

    /**
     * 加载投票数据
     */
    async loadVoteData() {
        try {
            const { API_BASE_URL } = await import('./api-config.js?v=20260223b');
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/votes`);
            
            if (response.ok) {
                const data = await response.json();
                this.totalVotes = data.totalVotes || 0;
                this.averageScore = data.averageScore || 0;
                this.voteDistribution = data.distribution || this.voteDistribution;
                this.userVote = data.userVote || null;
            }
        } catch (error) {
            console.error('[ArticleVote] 加载投票数据失败:', error);
        }
    }

    /**
     * 创建UI
     */
    createUI() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="vote-section">
                <div class="vote-header">
                    <h4>📊 文章评分</h4>
                    <div class="vote-stats">
                        <span class="average-score">${this.averageScore.toFixed(1)}</span>
                        <div class="stars-display">${this.renderStars(this.averageScore)}</div>
                        <span class="vote-count">(${this.totalVotes}人评分)</span>
                    </div>
                </div>
                
                <div class="vote-stars-input">
                    <span class="vote-label">你的评分：</span>
                    <div class="stars-input" id="starsInput">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <button class="star-btn ${this.userVote >= i ? 'active' : ''}" 
                                    data-score="${i}" title="${i}星">
                                ★
                            </button>
                        `).join('')}
                    </div>
                    <span class="vote-text" id="voteText">${this.getVoteText(this.userVote)}</span>
                </div>

                <div class="vote-distribution">
                    ${[5, 4, 3, 2, 1].map(score => {
                        const count = this.voteDistribution[score] || 0;
                        const percentage = this.totalVotes > 0 
                            ? (count / this.totalVotes * 100).toFixed(0) 
                            : 0;
                        return `
                            <div class="distribution-bar">
                                <span class="bar-label">${score}星</span>
                                <div class="bar-track">
                                    <div class="bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="bar-count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <style>
                .vote-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                }
                .vote-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #eee;
                }
                .vote-header h4 {
                    margin: 0;
                    font-size: 16px;
                    color: #333;
                }
                .vote-stats {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .average-score {
                    font-size: 28px;
                    font-weight: 700;
                    color: #ff9800;
                }
                .stars-display {
                    color: #ff9800;
                    font-size: 18px;
                }
                .vote-count {
                    font-size: 13px;
                    color: #999;
                }
                .vote-stars-input {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .vote-label {
                    font-size: 14px;
                    color: #666;
                }
                .stars-input {
                    display: flex;
                    gap: 4px;
                }
                .star-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #ddd;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0 2px;
                }
                .star-btn:hover,
                .star-btn.active {
                    color: #ff9800;
                    transform: scale(1.1);
                }
                .star-btn:hover ~ .star-btn {
                    color: #ddd;
                }
                .vote-text {
                    font-size: 13px;
                    color: #667eea;
                    min-width: 60px;
                }
                .vote-distribution {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .distribution-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .bar-label {
                    width: 30px;
                    font-size: 12px;
                    color: #666;
                }
                .bar-track {
                    flex: 1;
                    height: 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff9800, #ffc107);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .bar-count {
                    width: 30px;
                    text-align: right;
                    font-size: 12px;
                    color: #999;
                }
            </style>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const stars = container.querySelectorAll('.star-btn');
        
        stars.forEach((star, index) => {
            // 鼠标悬停效果
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i <= index);
                });
                this.updateVoteText(index + 1);
            });

            // 点击投票
            star.addEventListener('click', () => {
                this.submitVote(index + 1);
            });
        });

        // 鼠标离开恢复
        const starsContainer = container.querySelector('.stars-input');
        starsContainer.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < (this.userVote || 0));
            });
            this.updateVoteText(this.userVote);
        });
    }

    /**
     * 提交投票
     */
    async submitVote(score) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录后再评分');
            return;
        }

        try {
            const { API_BASE_URL } = await import('./api-config.js?v=20260223b');
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/votes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score })
            });

            if (response.ok) {
                this.userVote = score;
                await this.loadVoteData();
                this.createUI();
                this.bindEvents();
                this.showToast('评分成功！');
            } else {
                const error = await response.json();
                alert(error.message || '评分失败');
            }
        } catch (error) {
            console.error('[ArticleVote] 提交投票失败:', error);
            alert('评分失败，请稍后重试');
        }
    }

    /**
     * 渲染星星
     */
    renderStars(score) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                stars += '★';
            } else if (i - 0.5 <= score) {
                stars += '☆';
            } else {
                stars += '☆';
            }
        }
        return stars;
    }

    /**
     * 获取评分文字
     */
    getVoteText(score) {
        const texts = {
            5: '力荐',
            4: '推荐',
            3: '一般',
            2: '较差',
            1: '很差',
            null: '未评分'
        };
        return texts[score] || '未评分';
    }

    /**
     * 更新评分文字
     */
    updateVoteText(score) {
        const textEl = document.getElementById('voteText');
        if (textEl) {
            textEl.textContent = this.getVoteText(score);
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

export { ArticleVote };
export default ArticleVote;
