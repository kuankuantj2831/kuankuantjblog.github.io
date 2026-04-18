/**
 * 每日一题系统
 * 每天一道编程/技术相关题目，答对奖励硬币和经验
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';

class DailyQuiz {
    constructor(options = {}) {
        this.containerId = options.containerId || 'dailyQuizContainer';
        this.token = localStorage.getItem('token');
        this.questions = this.getQuestions();
        this.todayQuestion = null;
        this.answered = false;
    }

    getQuestions() {
        return [
            {
                id: 1,
                question: 'JavaScript 中，以下哪个表达式会返回 true？',
                options: ['0 == "0"', '0 === "0"', 'null == undefined', 'NaN == NaN'],
                correct: 0,
                explanation: '0 == "0" 会进行类型转换后比较，结果为 true。0 === "0" 严格相等为 false。null == undefined 也是 true（这是唯一一个两者相等的情况）。NaN 与任何值都不相等，包括它自己。',
                difficulty: 'easy',
                category: 'JavaScript',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 2,
                question: 'CSS 中，哪个属性可以创建 Flex 容器？',
                options: ['display: block', 'display: flex', 'position: flex', 'flex: display'],
                correct: 1,
                explanation: 'display: flex 是创建 Flex 容器的正确方式。',
                difficulty: 'easy',
                category: 'CSS',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 3,
                question: '在 React 中，useEffect 的第二个参数是什么？',
                options: ['回调函数', '依赖数组', '清理函数', '初始值'],
                correct: 1,
                explanation: 'useEffect 的第二个参数是依赖数组（dependency array），用于控制 effect 的执行时机。',
                difficulty: 'easy',
                category: 'React',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 4,
                question: 'HTTP 状态码 404 表示什么？',
                options: ['服务器内部错误', '请求成功', '未授权', '未找到资源'],
                correct: 3,
                explanation: '404 Not Found 表示服务器找不到请求的资源。',
                difficulty: 'easy',
                category: 'HTTP',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 5,
                question: 'Git 中，哪个命令可以将暂存区的文件提交到本地仓库？',
                options: ['git add', 'git push', 'git commit', 'git pull'],
                correct: 2,
                explanation: 'git commit 将暂存区的更改提交到本地仓库。git add 是添加到暂存区，git push 是推送到远程仓库。',
                difficulty: 'easy',
                category: 'Git',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 6,
                question: '以下哪个不是 JavaScript 的基本数据类型？',
                options: ['Number', 'String', 'Array', 'Boolean'],
                correct: 2,
                explanation: 'Array 是对象类型，不是基本数据类型。JavaScript 的基本数据类型包括：Number、String、Boolean、Null、Undefined、Symbol、BigInt。',
                difficulty: 'medium',
                category: 'JavaScript',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 7,
                question: 'CSS 选择器中，#header 选择的是什么？',
                options: ['class 为 header 的元素', 'id 为 header 的元素', '标签为 header 的元素', 'name 为 header 的元素'],
                correct: 1,
                explanation: '# 符号表示 id 选择器，#header 会选择 id="header" 的元素。',
                difficulty: 'easy',
                category: 'CSS',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 8,
                question: 'Node.js 中，哪个模块用于处理文件系统操作？',
                options: ['http', 'fs', 'path', 'url'],
                correct: 1,
                explanation: 'fs (File System) 模块用于文件系统操作，如读写文件、创建目录等。',
                difficulty: 'easy',
                category: 'Node.js',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 9,
                question: '以下哪个不是 CSS 的定位属性值？',
                options: ['static', 'relative', 'absolute', 'center'],
                correct: 3,
                explanation: 'CSS 的定位属性值包括：static、relative、absolute、fixed、sticky。没有 center。',
                difficulty: 'easy',
                category: 'CSS',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 10,
                question: '在 SQL 中，哪个关键字用于对结果进行排序？',
                options: ['GROUP BY', 'ORDER BY', 'SORT BY', 'FILTER BY'],
                correct: 1,
                explanation: 'ORDER BY 用于对查询结果进行排序。GROUP BY 用于分组，SORT BY 和 FILTER BY 不是标准 SQL 关键字。',
                difficulty: 'easy',
                category: 'SQL',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 11,
                question: 'JavaScript 中，Promise 的三种状态是什么？',
                options: ['pending、resolved、rejected', 'pending、fulfilled、rejected', 'loading、success、error', 'wait、done、fail'],
                correct: 1,
                explanation: 'Promise 有三种状态：pending（进行中）、fulfilled（已成功）、rejected（已失败）。',
                difficulty: 'medium',
                category: 'JavaScript',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 12,
                question: 'HTML5 中，哪个标签用于定义文档的导航链接？',
                options: ['<header>', '<nav>', '<section>', '<aside>'],
                correct: 1,
                explanation: '<nav> 标签用于定义导航链接的部分。',
                difficulty: 'easy',
                category: 'HTML',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 13,
                question: '以下哪个方法可以删除数组的最后一个元素？',
                options: ['shift()', 'pop()', 'push()', 'unshift()'],
                correct: 1,
                explanation: 'pop() 删除数组最后一个元素。shift() 删除第一个元素，push() 在末尾添加元素，unshift() 在开头添加元素。',
                difficulty: 'easy',
                category: 'JavaScript',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 14,
                question: 'Docker 中，哪个命令用于查看正在运行的容器？',
                options: ['docker ps', 'docker list', 'docker show', 'docker running'],
                correct: 0,
                explanation: 'docker ps 查看正在运行的容器。docker ps -a 查看所有容器（包括已停止的）。',
                difficulty: 'medium',
                category: 'Docker',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 15,
                question: '在 Python 中，列表推导式的语法是什么？',
                options: ['{x for x in list}', '[x for x in list]', '(x for x in list)', '<x for x in list>'],
                correct: 1,
                explanation: '[x for x in list] 是列表推导式的正确语法。{...} 是集合推导式，(...) 是生成器表达式。',
                difficulty: 'easy',
                category: 'Python',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 16,
                question: 'TCP 和 UDP 的主要区别是什么？',
                options: ['TCP 更快', 'UDP 更可靠', 'TCP 是面向连接的', '没有区别'],
                correct: 2,
                explanation: 'TCP 是面向连接的、可靠的传输协议；UDP 是无连接的、不可靠的但传输效率更高的协议。',
                difficulty: 'medium',
                category: 'Network',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 17,
                question: 'JavaScript 中，哪个方法可以阻止事件冒泡？',
                options: ['event.preventDefault()', 'event.stopPropagation()', 'event.stop()', 'event.cancel()'],
                correct: 1,
                explanation: 'event.stopPropagation() 阻止事件冒泡。event.preventDefault() 阻止默认行为。',
                difficulty: 'medium',
                category: 'JavaScript',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 18,
                question: 'Linux 中，哪个命令用于查看当前目录下的文件？',
                options: ['cd', 'ls', 'pwd', 'cat'],
                correct: 1,
                explanation: 'ls (list) 用于列出目录内容。cd 是切换目录，pwd 显示当前路径，cat 查看文件内容。',
                difficulty: 'easy',
                category: 'Linux',
                reward: { coins: 10, exp: 20 }
            },
            {
                id: 19,
                question: 'Vue.js 中，v-if 和 v-show 的区别是什么？',
                options: ['没有区别', 'v-if 是条件渲染，v-show 是 CSS 切换', 'v-show 是条件渲染，v-if 是 CSS 切换', 'v-if 更快'],
                correct: 1,
                explanation: 'v-if 是真正的条件渲染（切换时组件会销毁/重建），v-show 只是通过 CSS display 属性切换可见性。',
                difficulty: 'medium',
                category: 'Vue',
                reward: { coins: 15, exp: 30 }
            },
            {
                id: 20,
                question: '数据库中，ACID 代表什么？',
                options: ['增删改查', '原子性、一致性、隔离性、持久性', '自动化、并发、独立、分布式', '可用性、一致性、隔离性、持久性'],
                correct: 1,
                explanation: 'ACID 是数据库事务的四个特性：Atomicity（原子性）、Consistency（一致性）、Isolation（隔离性）、Durability（持久性）。',
                difficulty: 'medium',
                category: 'Database',
                reward: { coins: 15, exp: 30 }
            }
        ];
    }

    getTodayQuestion() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('quiz_date');
        const savedQuestionId = localStorage.getItem('quiz_question_id');
        const savedAnswered = localStorage.getItem('quiz_answered') === 'true';

        if (savedDate === today && savedQuestionId) {
            this.todayQuestion = this.questions.find(q => q.id === parseInt(savedQuestionId));
            this.answered = savedAnswered;
        } else {
            // 随机选择一题
            const randomIndex = Math.floor(Math.random() * this.questions.length);
            this.todayQuestion = this.questions[randomIndex];
            this.answered = false;
            localStorage.setItem('quiz_date', today);
            localStorage.setItem('quiz_question_id', this.todayQuestion.id.toString());
            localStorage.setItem('quiz_answered', 'false');
            localStorage.removeItem('quiz_selected');
        }

        return this.todayQuestion;
    }

    init() {
        this.getTodayQuestion();
        this.render();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container || !this.todayQuestion) return;

        const q = this.todayQuestion;
        const difficultyLabel = {
            easy: { text: '简单', color: '#52c41a' },
            medium: { text: '中等', color: '#faad14' },
            hard: { text: '困难', color: '#f5222d' }
        }[q.difficulty];

        const savedSelected = localStorage.getItem('quiz_selected');
        const selectedIndex = savedSelected ? parseInt(savedSelected) : -1;

        container.innerHTML = `
            <div class="daily-quiz-wrapper" style="
                background:linear-gradient(135deg,#667eea15,#764ba215);
                border-radius:16px;padding:24px;border:1px solid #667eea20;
            ">
                <div class="quiz-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:24px;">🧩</span>
                        <div>
                            <h4 style="margin:0;font-size:16px;">每日一题</h4>
                            <p style="margin:2px 0 0;font-size:12px;color:#999;">答对赢取硬币和经验</p>
                        </div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <span style="padding:2px 8px;border-radius:10px;background:${difficultyLabel.color}15;color:${difficultyLabel.color};font-size:11px;">${difficultyLabel.text}</span>
                        <span style="padding:2px 8px;border-radius:10px;background:#667eea15;color:#667eea;font-size:11px;">${q.category}</span>
                    </div>
                </div>

                <div class="quiz-question" style="
                    background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;
                    font-size:15px;line-height:1.6;color:#333;
                ">
                    ${q.question}
                </div>

                <div class="quiz-options" style="display:flex;flex-direction:column;gap:10px;">
                    ${q.options.map((opt, i) => {
                        let style = 'background:#fff;border:2px solid #eee;';
                        let cursor = 'pointer';
                        if (this.answered) {
                            if (i === q.correct) {
                                style = 'background:#f6ffed;border:2px solid #52c41a;';
                            } else if (i === selectedIndex && i !== q.correct) {
                                style = 'background:#fff1f0;border:2px solid #f5222d;';
                            } else {
                                style = 'background:#f5f5f5;border:2px solid #e8e8e8;opacity:0.6;';
                            }
                            cursor = 'default';
                        } else if (i === selectedIndex) {
                            style = 'background:#e6f7ff;border:2px solid #1890ff;';
                        }
                        return `
                            <div class="quiz-option" data-index="${i}" style="
                                padding:12px 16px;border-radius:10px;cursor:${cursor};transition:all 0.2s;
                                font-size:14px;display:flex;align-items:center;gap:10px;
                                ${style}
                            " ${this.answered ? '' : 'onclick="window.dailyQuiz.selectOption(' + i + ')"'}>
                                <span style="
                                    width:28px;height:28px;border-radius:50%;display:flex;
                                    align-items:center;justify-content:center;font-size:12px;font-weight:bold;
                                    ${this.answered && i === q.correct ? 'background:#52c41a;color:#fff;' : 
                                      this.answered && i === selectedIndex && i !== q.correct ? 'background:#f5222d;color:#fff;' :
                                      i === selectedIndex ? 'background:#1890ff;color:#fff;' : 'background:#f5f5f5;color:#999;'}
                                ">${String.fromCharCode(65 + i)}</span>
                                <span>${opt}</span>
                                ${this.answered && i === q.correct ? '<span style="margin-left:auto;color:#52c41a;font-size:18px;">✓</span>' : ''}
                                ${this.answered && i === selectedIndex && i !== q.correct ? '<span style="margin-left:auto;color:#f5222d;font-size:18px;">✗</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                ${!this.answered ? `
                    <button id="quizSubmitBtn" style="
                        width:100%;margin-top:16px;padding:12px;border:none;border-radius:10px;
                        background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;
                        font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;
                    " ${selectedIndex === -1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>确认答案</button>
                ` : `
                    <div style="margin-top:16px;padding:12px;border-radius:10px;background:#f6ffed;border:1px solid #b7eb8f;">
                        <p style="margin:0 0 8px;font-weight:600;color:#389e0d;">
                            ${selectedIndex === q.correct ? '🎉 回答正确！' : '😅 回答错误'}
                        </p>
                        <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">${q.explanation}</p>
                        ${selectedIndex === q.correct ? `
                            <p style="margin:8px 0 0;font-size:13px;color:#f5af19;">
                                奖励: +${q.reward.coins} 硬币, +${q.reward.exp} 经验
                            </p>
                        ` : ''}
                    </div>
                `}

                <div class="quiz-streak" style="margin-top:16px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#999;">
                        🔥 连续答对 <strong style="color:#ff4757;">${this.getStreak()}</strong> 天
                    </p>
                </div>
            </div>
        `;

        if (!this.answered) {
            const submitBtn = document.getElementById('quizSubmitBtn');
            if (submitBtn && selectedIndex !== -1) {
                submitBtn.addEventListener('click', () => this.submitAnswer());
            }
        }
    }

    selectOption(index) {
        if (this.answered) return;
        localStorage.setItem('quiz_selected', index.toString());
        this.render();

        // 重新绑定提交按钮事件
        const submitBtn = document.getElementById('quizSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }
    }

    async submitAnswer() {
        if (this.answered) return;

        const selectedIndex = parseInt(localStorage.getItem('quiz_selected') || '-1');
        if (selectedIndex === -1) return;

        const isCorrect = selectedIndex === this.todayQuestion.correct;
        this.answered = true;
        localStorage.setItem('quiz_answered', 'true');

        if (isCorrect) {
            // 更新连续答对天数
            const streak = this.getStreak();
            localStorage.setItem('quiz_streak', (streak + 1).toString());
            localStorage.setItem('quiz_streak_date', new Date().toDateString());

            // 发放奖励（实际应该调用后端API）
            this.grantReward(this.todayQuestion.reward);
        } else {
            // 答错重置连续天数
            localStorage.setItem('quiz_streak', '0');
        }

        this.render();
    }

    getStreak() {
        const streakDate = localStorage.getItem('quiz_streak_date');
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // 如果上次记录不是昨天或今天，重置连续天数
        if (streakDate !== today && streakDate !== yesterday) {
            localStorage.setItem('quiz_streak', '0');
            return 0;
        }

        return parseInt(localStorage.getItem('quiz_streak') || '0');
    }

    async grantReward(reward) {
        try {
            if (!this.token) return;

            // 调用后端 API 发放奖励
            const response = await fetch(`${API_BASE_URL}/coins/quiz-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    coins: reward.coins,
                    exp: reward.exp,
                    questionId: this.todayQuestion.id
                })
            });

            if (response.ok) {
                // 刷新硬币和经验显示
                if (window.coinsApp) window.coinsApp.loadBalance();
                if (window.gamificationApp) window.gamificationApp.loadLevelInfo();
            }
        } catch (error) {
            console.error('发放奖励失败:', error);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.dailyQuiz = new DailyQuiz();
});

export default DailyQuiz;
