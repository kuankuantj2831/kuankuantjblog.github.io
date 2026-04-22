/**
 * AI 智能助手模块
 * 集成 AI API，提供文章摘要、标签生成、标题优化等功能
 */

class AIAssistant {
    constructor(apiKey, apiUrl) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl || 'https://api.openai.com/v1/chat/completions';
        this.cache = new Map();
        this.cacheTime = 24 * 60 * 60 * 1000; // 24小时缓存
    }

    /**
     * 生成文章摘要
     */
    async generateSummary(content, maxLength = 150) {
        try {
            // 验证输入
            if (!content || typeof content !== 'string') {
                return '';
            }

            const cacheKey = `summary_${this.hash(content)}`;
            const cached = this.getCache(cacheKey);
            if (cached) return cached;

            // 截断过长的内容
            const truncatedContent = content.substring(0, 3000);
            
            const prompt = `请为以下文章生成一个${maxLength}字以内的摘要，要求简洁明了：

${truncatedContent}

摘要：`;

            try {
                const result = await this.callAI(prompt, 200);
                const summary = result.trim();
                this.setCache(cacheKey, summary);
                return summary;
            } catch (error) {
                console.error('[AIAssistant] 生成摘要失败:', error);
                return this.fallbackSummary(content, maxLength);
            }
        } catch (outerError) {
            console.error('[AIAssistant] 生成摘要过程异常:', outerError);
            return this.fallbackSummary(content || '', maxLength);
        }
    }

    /**
     * 生成文章标签
     */
    async generateTags(content, title, count = 5) {
        const cacheKey = `tags_${this.hash(title + content.substring(0, 500))}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const prompt = `请为以下文章生成${count}个标签，用逗号分隔：

标题：${title}
内容：${content.substring(0, 1000)}

标签：`;

        try {
            const result = await this.callAI(prompt, 100);
            const tags = result.split(/[,，]/).map(t => t.trim()).filter(t => t);
            this.setCache(cacheKey, tags);
            return tags.slice(0, count);
        } catch (error) {
            console.error('生成标签失败:', error);
            return this.fallbackTags(content, title, count);
        }
    }

    /**
     * 优化文章标题
     */
    async optimizeTitle(currentTitle, content) {
        const cacheKey = `title_${this.hash(currentTitle)}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const prompt = `请优化以下文章标题，使其更吸引人、更有传播力。提供3个选项：

原标题：${currentTitle}
内容概要：${content.substring(0, 500)}

优化后的标题选项：
1. 
2. 
3. `;

        try {
            const result = await this.callAI(prompt, 150);
            const titles = result.split('\n')
                .filter(line => line.match(/^\d+\./))
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(t => t);
            
            this.setCache(cacheKey, titles);
            return titles;
        } catch (error) {
            console.error('优化标题失败:', error);
            return [currentTitle];
        }
    }

    /**
     * 智能续写文章
     */
    async continueWriting(content, style = 'normal') {
        const prompt = `请根据以下内容续写文章，保持${style === 'professional' ? '专业严谨' : '通俗易懂'}的风格：

${content}

续写内容（约200字）：`;

        try {
            return await this.callAI(prompt, 300);
        } catch (error) {
            console.error('续写文章失败:', error);
            return '';
        }
    }

    /**
     * 润色文章
     */
    async polishContent(content) {
        const prompt = `请润色以下文章，改进语言表达，使其更加流畅易读：

${content}

润色后的文章：`;

        try {
            return await this.callAI(prompt, content.length + 500);
        } catch (error) {
            console.error('润色文章失败:', error);
            return content;
        }
    }

    /**
     * 生成文章大纲
     */
    async generateOutline(title) {
        const cacheKey = `outline_${this.hash(title)}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const prompt = `请为"${title}"生成一个详细的文章大纲，包括3-5个主要章节：

大纲：`;

        try {
            const result = await this.callAI(prompt, 300);
            const outline = result.split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-•]\s*/, '').trim());
            this.setCache(cacheKey, outline);
            return outline;
        } catch (error) {
            console.error('生成大纲失败:', error);
            return ['引言', '主要内容', '总结'];
        }
    }

    /**
     * 调用 AI API
     */
    async callAI(prompt, maxTokens = 200) {
        try {
            // 验证 API 配置
            if (!this.apiUrl || !this.apiKey) {
                throw new Error('API URL 或 Key 未配置');
            }

            // 构建请求
            const requestBody = {
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7
            };

            // 发送请求
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            // 检查响应状态
            if (!response.ok) {
                let errorMessage = `API 错误: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (parseError) {
                    // 忽略解析错误
                }
                throw new Error(errorMessage);
            }

            // 解析响应数据
            const data = await response.json();

            // 验证响应结构
            if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                throw new Error('API 响应格式无效: 缺少 choices 数据');
            }

            if (!data.choices[0].message || !data.choices[0].message.content) {
                throw new Error('API 响应格式无效: 缺少消息内容');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('[AIAssistant] AI 调用失败:', error);
            throw error;
        }
    }

    /**
     * 本地摘要生成（降级方案）
     */
    fallbackSummary(content, maxLength) {
        try {
            // 验证输入
            if (!content || typeof content !== 'string') {
                return '';
            }
            
            // 简单的摘要算法
            const sentences = content.match(/[^。！？.!?]+[。！？.!?]+/g) || [];
            let summary = '';
            
            for (const sentence of sentences.slice(0, 3)) {
                if ((summary + sentence).length <= maxLength) {
                    summary += sentence;
                } else {
                    break;
                }
            }
            
            return summary || content.substring(0, Math.min(maxLength, content.length)) + '...';
        } catch (error) {
            console.warn('[AIAssistant] 本地摘要生成失败:', error);
            try {
                return (content || '').substring(0, Math.min(maxLength, (content || '').length)) + '...';
            } catch (e) {
                return '';
            }
        }
    }

    /**
     * 本地标签生成（降级方案）
     */
    fallbackTags(content, title, count) {
        try {
            // 验证输入
            if (typeof content !== 'string') content = '';
            if (typeof title !== 'string') title = '';
            if (typeof count !== 'number' || count <= 0) count = 5;

            const commonTags = {
                '编程': ['编程', '代码', '开发', '技术'],
                '教程': ['教程', '学习', '入门', '指南'],
                '游戏': ['游戏', '娱乐', '攻略', '评测'],
                '设计': ['设计', 'UI', 'UX', '创意'],
                '工具': ['工具', '软件', '效率', '推荐']
            };

            const text = (title + ' ' + content).toLowerCase();
            const tags = [];

            for (const [keyword, tagList] of Object.entries(commonTags)) {
                if (text.includes(keyword.toLowerCase())) {
                    tags.push(...tagList);
                }
            }

            // 提取高频词作为标签
            const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
            const wordCount = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });

            const topWords = Object.entries(wordCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, count)
                .map(([word]) => word);

            return [...new Set([...tags, ...topWords])].slice(0, count);
        } catch (error) {
            console.warn('[AIAssistant] 本地标签生成失败:', error);
            return ['技术', '分享'];
        }
    }

    /**
     * 缓存相关
     */
    getCache(key) {
        try {
            if (!key) return null;
            const cached = this.cache.get(key);
            if (!cached) return null;
            if (Date.now() > cached.expiry) {
                try {
                    this.cache.delete(key);
                } catch (e) {
                    console.warn('[AIAssistant] 删除过期缓存失败:', e);
                }
                return null;
            }
            return cached.data;
        } catch (error) {
            console.warn('[AIAssistant] 读取缓存失败:', error);
            return null;
        }
    }

    setCache(key, data) {
        try {
            if (!key) return;
            this.cache.set(key, {
                data,
                expiry: Date.now() + this.cacheTime
            });
        } catch (error) {
            console.warn('[AIAssistant] 设置缓存失败:', error);
        }
    }

    hash(str) {
        try {
            if (!str || typeof str !== 'string') return 'default_hash';
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        } catch (error) {
            console.warn('[AIAssistant] 哈希计算失败:', error);
            return 'fallback_hash_' + Date.now();
        }
    }
}

// 安全的 localStorage 访问
function safeGetLocalStorage(key, defaultValue = '') {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch (e) {
        console.warn('[AIAssistant] localStorage 读取失败:', e);
        return defaultValue;
    }
}

// 创建单例
const aiAssistant = new AIAssistant(
    safeGetLocalStorage('ai_api_key', ''),
    safeGetLocalStorage('ai_api_url', '')
);

// 导出
export { AIAssistant, aiAssistant };
export default aiAssistant;
