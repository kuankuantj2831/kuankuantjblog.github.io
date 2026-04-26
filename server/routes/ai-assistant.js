/**
 * AI智能写作助手路由
 * 功能：生成摘要、续写、润色、改进标题
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

// AI服务配置 - 使用简单的模拟实现（可自行替换为OpenAI/Claude API）
const AI_CONFIG = {
    enabled: process.env.AI_ENABLED === 'true' || false,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
};

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.userId = decoded.userId || decoded.sub;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效或已过期' });
    }
};

/**
 * 模拟AI生成（无API密钥时使用）
 * 实际部署时请替换为真实的OpenAI/Claude API调用
 */
async function mockAIGenerate(prompt, type) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 根据类型返回不同的模拟结果
    const responses = {
        summary: [
            '这篇文章深入浅出地介绍了相关概念，从基础原理到实际应用都做了详细阐述，适合初学者入门阅读。',
            '作者通过丰富的实例和清晰的逻辑，系统地讲解了核心知识点，是一篇不可多得的优质教程。',
            '文章结构清晰，内容详实，既有理论深度又有实践价值，对读者理解和掌握该领域知识有很大帮助。'
        ],
        continuation: [
            '\n\n接下来，我们可以深入探讨更多实际应用场景。在实际项目中，这些理论知识能够帮助我们更好地解决遇到的问题。建议读者结合本文内容，动手实践一下，相信会有更深的体会。',
            '\n\n总的来说，掌握这些技能对于提升个人能力非常重要。希望通过本文的学习，读者能够对该领域有一个全面的认识，并在今后的学习和工作中灵活运用。',
            '\n\n未来，随着技术的不断发展，这一领域还会有更多的创新和突破。保持学习的热情，跟上时代的步伐，相信你一定能够在这个领域取得更大的成就。'
        ],
        polish: [
            '本文内容充实，论述清晰，是一篇非常优秀的技术文章。',
            '文章逻辑严谨，语言流畅，对于理解相关概念非常有帮助。',
            '这是一篇高质量的文章，既有深度又通俗易懂，值得推荐。'
        ],
        title: [
            '深入浅出：从入门到精通的完整指南',
            '一文读懂核心概念与实战技巧',
            '新手必读：零基础快速上手指南',
            '全面解析：原理、应用与最佳实践'
        ],
        tags: [
            '教程,入门,实战,技术分享',
            '学习笔记,经验总结,最佳实践',
            '基础知识,进阶技巧,案例分析'
        ]
    };
    
    const options = responses[type] || responses.summary;
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * 真实的AI API调用（使用OpenAI）
 */
async function callOpenAI(prompt, type) {
    if (!AI_CONFIG.apiKey) {
        return mockAIGenerate(prompt, type);
    }
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的写作助手，擅长生成高质量的中文内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature
            })
        });
        
        if (!response.ok) {
            throw new Error('AI API调用失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('AI API调用失败:', error);
        return mockAIGenerate(prompt, type);
    }
}

/**
 * 生成文章摘要
 * POST /api/ai/summary
 */
router.post('/ai/summary', authenticateToken, async (req, res) => {
    const { content, maxLength = 150 } = req.body;
    
    if (!content || content.length < 50) {
        return res.status(400).json({ message: '文章内容太短，无法生成摘要' });
    }
    
    try {
        const prompt = `请为以下文章生成一段摘要，字数控制在${maxLength}字以内：\n\n${content.substring(0, 2000)}`;
        
        const summary = await callOpenAI(prompt, 'summary');
        
        // 记录使用日志
        await pool.query(
            'INSERT INTO ai_usage_logs (user_id, action, input_length, output_length) VALUES (?, ?, ?, ?)',
            [req.userId, 'summary', content.length, summary.length]
        );
        
        res.json({
            summary: summary,
            length: summary.length
        });
        
    } catch (error) {
        console.error('生成摘要失败:', error);
        res.status(500).json({ message: '生成摘要失败' });
    }
});

/**
 * 续写文章
 * POST /api/ai/continue
 */
router.post('/ai/continue', authenticateToken, async (req, res) => {
    const { content, style = 'normal', length = 200 } = req.body;
    
    if (!content || content.length < 50) {
        return res.status(400).json({ message: '文章内容太短，无法续写' });
    }
    
    const stylePrompts = {
        normal: '以自然的风格续写',
        academic: '以学术严谨的文风续写',
        casual: '以轻松随意的口吻续写',
        professional: '以专业正式的语气续写'
    };
    
    try {
        const prompt = `请根据以下文章内容${stylePrompts[style] || stylePrompts.normal}，续写约${length}字：\n\n${content.substring(content.length - 1000)}`;
        
        const continuation = await callOpenAI(prompt, 'continuation');
        
        // 记录使用日志
        await pool.query(
            'INSERT INTO ai_usage_logs (user_id, action, input_length, output_length) VALUES (?, ?, ?, ?)',
            [req.userId, 'continue', content.length, continuation.length]
        );
        
        res.json({
            continuation: continuation,
            length: continuation.length
        });
        
    } catch (error) {
        console.error('续写失败:', error);
        res.status(500).json({ message: '续写失败' });
    }
});

/**
 * 润色文章
 * POST /api/ai/polish
 */
router.post('/ai/polish', authenticateToken, async (req, res) => {
    const { content, style = 'improve' } = req.body;
    
    if (!content || content.length < 10) {
        return res.status(400).json({ message: '内容太短，无法润色' });
    }
    
    const stylePrompts = {
        improve: '改进以下内容的表达，使其更加流畅和专业，保持原意不变',
        simplify: '简化以下内容的表达，使其更易懂',
        formal: '将以下内容改写为正式的书面语',
        vivid: '让以下内容的表达更加生动形象'
    };
    
    try {
        const prompt = `${stylePrompts[style] || stylePrompts.improve}：\n\n${content.substring(0, 1500)}`;
        
        const polished = await callOpenAI(prompt, 'polish');
        
        // 记录使用日志
        await pool.query(
            'INSERT INTO ai_usage_logs (user_id, action, input_length, output_length) VALUES (?, ?, ?, ?)',
            [req.userId, 'polish', content.length, polished.length]
        );
        
        res.json({
            polished: polished,
            original: content,
            changes: '润色完成'
        });
        
    } catch (error) {
        console.error('润色失败:', error);
        res.status(500).json({ message: '润色失败' });
    }
});

/**
 * 生成标题建议
 * POST /api/ai/title-suggestions
 */
router.post('/ai/title-suggestions', authenticateToken, async (req, res) => {
    const { content, currentTitle = '' } = req.body;
    
    if (!content || content.length < 50) {
        return res.status(400).json({ message: '文章内容太短' });
    }
    
    try {
        const prompt = `请为以下文章生成5个吸引人的标题建议：\n\n${content.substring(0, 1500)}\n\n${currentTitle ? `当前标题：${currentTitle}` : ''}\n\n要求：\n1. 标题要简洁有力，不超过20字\n2. 能够准确反映文章主题\n3. 有吸引力，能够吸引读者点击\n4. 请直接列出标题，每行一个，不要带序号`;
        
        const result = await callOpenAI(prompt, 'title');
        
        // 解析标题（按行分割）
        const titles = result.split('\n')
            .map(t => t.trim())
            .filter(t => t && !t.match(/^\d+[.．]/)) // 移除序号
            .map(t => t.replace(/^[\-•·]\s*/, '')) // 移除列表符号
            .slice(0, 5);
        
        // 如果AI返回的结果不够，补充模拟标题
        while (titles.length < 5) {
            const mockTitles = [
                '深入浅出：从入门到精通的完整指南',
                '一文读懂核心概念与实战技巧',
                '新手必读：零基础快速上手指南',
                '全面解析：原理、应用与最佳实践',
                '实战干货：经验总结与技巧分享'
            ];
            titles.push(mockTitles[titles.length]);
        }
        
        // 记录使用日志
        await pool.query(
            'INSERT INTO ai_usage_logs (user_id, action, input_length, output_length) VALUES (?, ?, ?, ?)',
            [req.userId, 'title', content.length, result.length]
        );
        
        res.json({
            suggestions: titles,
            count: titles.length
        });
        
    } catch (error) {
        console.error('生成标题失败:', error);
        res.status(500).json({ message: '生成标题失败' });
    }
});

/**
 * 生成标签建议
 * POST /api/ai/tags-suggestions
 */
router.post('/ai/tags-suggestions', authenticateToken, async (req, res) => {
    const { content, title = '' } = req.body;
    
    if (!content || content.length < 50) {
        return res.status(400).json({ message: '文章内容太短' });
    }
    
    try {
        const prompt = `请为以下文章生成5-8个相关的标签，用逗号分隔：\n\n标题：${title || '无'}\n\n${content.substring(0, 1000)}\n\n要求：\n1. 标签要准确反映文章主题\n2. 包含技术领域、应用场景等维度\n3. 只输出标签，用逗号分隔`;
        
        const result = await callOpenAI(prompt, 'tags');
        
        // 解析标签
        const tags = result.split(/[,，]/)
            .map(t => t.trim())
            .filter(t => t && t.length <= 20)
            .slice(0, 8);
        
        // 记录使用日志
        await pool.query(
            'INSERT INTO ai_usage_logs (user_id, action, input_length, output_length) VALUES (?, ?, ?, ?)',
            [req.userId, 'tags', content.length, result.length]
        );
        
        res.json({
            suggestions: tags,
            count: tags.length
        });
        
    } catch (error) {
        console.error('生成标签失败:', error);
        res.status(500).json({ message: '生成标签失败' });
    }
});

/**
 * 智能纠错
 * POST /api/ai/proofread
 */
router.post('/ai/proofread', authenticateToken, async (req, res) => {
    const { content } = req.body;
    
    if (!content || content.length < 10) {
        return res.status(400).json({ message: '内容太短' });
    }
    
    try {
        // 简单的错别字检测（实际可以使用更复杂的NLP服务）
        const commonErrors = [
            { pattern: /的(?=\s*[\u4e00-\u9fa5]{2})/g, type: '可能的错别字', suggest: '检查"的/地/得"用法' },
            { pattern: /地(?=\s*[\u4e00-\u9fa5]{2})/g, type: '可能的错别字', suggest: '检查"的/地/得"用法' },
            { pattern: /[，,]\s*[，,]/g, type: '标点错误', suggest: '删除多余的逗号' },
            { pattern: /[。。]/g, type: '标点错误', suggest: '删除多余的句号' },
            { pattern: /\s{2,}/g, type: '格式问题', suggest: '删除多余的空格' }
        ];
        
        const issues = [];
        commonErrors.forEach(({ pattern, type, suggest }) => {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    type: type,
                    count: matches.length,
                    suggest: suggest
                });
            }
        });
        
        res.json({
            issues: issues,
            issueCount: issues.length,
            message: issues.length === 0 ? '未发现明显错误' : `发现${issues.length}处可能需要修改`
        });
        
    } catch (error) {
        console.error('智能纠错失败:', error);
        res.status(500).json({ message: '智能纠错失败' });
    }
});

/**
 * 获取AI使用统计
 * GET /api/ai/stats
 */
router.get('/ai/stats', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                action,
                COUNT(*) as count,
                SUM(input_length) as total_input,
                SUM(output_length) as total_output
             FROM ai_usage_logs 
             WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY action`,
            [req.userId]
        );
        
        res.json({
            stats: rows,
            period: '30天'
        });
        
    } catch (error) {
        console.error('获取AI统计失败:', error);
        res.status(500).json({ message: '获取统计失败' });
    }
});

module.exports = router;
