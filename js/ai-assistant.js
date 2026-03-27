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
        const cacheKey = `summary_${this.hash(content)}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const prompt = `请为以下文章生成一个${maxLength}字以内的摘要，要求简洁明了：

${content.substring(0, 3000)}

摘要：`;

        try {
            const result = await this.callAI(prompt, 200);
            const summary = result.trim();
            this.setCache(cacheKey, summary);
            return summary;
        } catch (error) {
            console.error('生成摘要失败:', error);
            return this.fallbackSummary(content, maxLength);
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
        // 这里替换为你朋友的 API
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API 错误: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * 本地摘要生成（降级方案）
     */
    fallbackSummary(content, maxLength) {
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
        
        return summary || content.substring(0, maxLength) + '...';
    }

    /**
     * 本地标签生成（降级方案）
     */
    fallbackTags(content, title, count) {
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
    }

    /**
     * 缓存相关
     */
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.cacheTime
        });
    }

    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
}

// 创建单例
const aiAssistant = new AIAssistant(
    localStorage.getItem('ai_api_key') || '',
    localStorage.getItem('ai_api_url') || ''
);

// 导出
export { AIAssistant, aiAssistant };
export default aiAssistant;
