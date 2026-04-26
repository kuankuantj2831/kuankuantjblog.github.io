/**
 * AI功能增强路由
 * 包含：AI写作助手、内容摘要、智能翻译、回复建议
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// ========== AI写作助手 ==========

// 智能续写
router.post('/ai/continue', authenticateToken, async (req, res) => {
    try {
        const { content, style = 'casual' } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: '请提供内容' });
        }

        // 调用AI服务进行续写
        const continuedContent = await generateAIContent('continue', content, style);
        
        // 记录使用历史
        await pool.query(
            'INSERT INTO ai_writing_history (user_id, action_type, original_content, generated_content) VALUES (?, ?, ?, ?)',
            [req.user.id, 'continue', content, continuedContent]
        );

        res.json({
            original: content,
            continued: continuedContent,
            style: style
        });
    } catch (error) {
        console.error('AI续写错误:', error);
        res.status(500).json({ message: 'AI服务暂时不可用' });
    }
});

// 文章改写
router.post('/ai/rewrite', authenticateToken, async (req, res) => {
    try {
        const { content, tone = 'professional' } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: '请提供内容' });
        }

        const rewrittenContent = await generateAIContent('rewrite', content, tone);
        
        await pool.query(
            'INSERT INTO ai_writing_history (user_id, action_type, original_content, generated_content) VALUES (?, ?, ?, ?)',
            [req.user.id, 'rewrite', content, rewrittenContent]
        );

        res.json({
            original: content,
            rewritten: rewrittenContent,
            tone: tone
        });
    } catch (error) {
        console.error('AI改写错误:', error);
        res.status(500).json({ message: 'AI服务暂时不可用' });
    }
});

// 标题生成
router.post('/ai/generate-titles', authenticateToken, async (req, res) => {
    try {
        const { content, count = 5 } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: '请提供内容' });
        }

        const titles = await generateAITitles(content, count);
        
        await pool.query(
            'INSERT INTO ai_writing_history (user_id, action_type, original_content, generated_content) VALUES (?, ?, ?, ?)',
            [req.user.id, 'title', content, JSON.stringify(titles)]
        );

        res.json({ titles });
    } catch (error) {
        console.error('AI标题生成错误:', error);
        res.status(500).json({ message: 'AI服务暂时不可用' });
    }
});

// ========== AI内容摘要 ==========

// 生成摘要
router.post('/ai/summarize', authenticateToken, async (req, res) => {
    try {
        const { content_type, content_id, content, language = 'zh' } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: '请提供内容' });
        }

        // 检查是否已有缓存
        if (content_type && content_id) {
            const [existing] = await pool.query(
                'SELECT * FROM ai_summaries WHERE content_type = ? AND content_id = ? AND language = ?',
                [content_type, content_id, language]
            );
            
            if (existing.length > 0) {
                return res.json(existing[0]);
            }
        }

        const summary = await generateAISummary(content, language);
        const tldr = await generateAITLDR(content, language);
        const keywords = await generateAIKeywords(content, language);

        // 保存到缓存
        if (content_type && content_id) {
            await pool.query(
                `INSERT INTO ai_summaries (content_type, content_id, summary, tldr, keywords, language)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE summary = ?, tldr = ?, keywords = ?, updated_at = NOW()`,
                [content_type, content_id, summary, tldr, JSON.stringify(keywords), language,
                 summary, tldr, JSON.stringify(keywords)]
            );
        }

        res.json({
            summary,
            tldr,
            keywords,
            language
        });
    } catch (error) {
        console.error('AI摘要错误:', error);
        res.status(500).json({ message: 'AI服务暂时不可用' });
    }
});

// 获取摘要
router.get('/ai/summary/:content_type/:content_id', async (req, res) => {
    try {
        const { content_type, content_id } = req.params;
        const { language = 'zh' } = req.query;

        const [rows] = await pool.query(
            'SELECT * FROM ai_summaries WHERE content_type = ? AND content_id = ? AND language = ?',
            [content_type, content_id, language]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '摘要不存在' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('获取摘要错误:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// ========== AI智能翻译 ==========

// 翻译文本
router.post('/ai/translate', authenticateToken, async (req, res) => {
    try {
        const { text, target_lang, source_lang = 'auto', content_type, content_id } = req.body;
        
        if (!text || !target_lang) {
            return res.status(400).json({ message: '请提供文本和目标语言' });
        }

        const translated = await generateAITranslation(text, target_lang, source_lang);
        
        await pool.query(
            'INSERT INTO ai_translations (user_id, source_text, translated_text, source_lang, target_lang, content_type, content_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, text, translated, source_lang, target_lang, content_type, content_id]
        );

        res.json({
            original: text,
            translated,
            source_lang,
            target_lang
        });
    } catch (error) {
        console.error('AI翻译错误:', error);
        res.status(500).json({ message: '翻译服务暂时不可用' });
    }
});

// 获取支持的语言
router.get('/ai/translate/languages', (req, res) => {
    const languages = [
        { code: 'zh', name: '中文', name_en: 'Chinese' },
        { code: 'en', name: '英语', name_en: 'English' },
        { code: 'ja', name: '日语', name_en: 'Japanese' },
        { code: 'ko', name: '韩语', name_en: 'Korean' },
        { code: 'fr', name: '法语', name_en: 'French' },
        { code: 'de', name: '德语', name_en: 'German' },
        { code: 'es', name: '西班牙语', name_en: 'Spanish' },
        { code: 'ru', name: '俄语', name_en: 'Russian' }
    ];
    
    res.json({ languages });
});

// ========== AI回复建议 ==========

// 生成回复建议
router.post('/ai/reply-suggestions', authenticateToken, async (req, res) => {
    try {
        const { context, tone = 'friendly', count = 3 } = req.body;
        
        if (!context) {
            return res.status(400).json({ message: '请提供上下文' });
        }

        const suggestions = await generateAIReplySuggestions(context, tone, count);

        res.json({ suggestions, tone });
    } catch (error) {
        console.error('AI回复建议错误:', error);
        res.status(500).json({ message: 'AI服务暂时不可用' });
    }
});

// ========== AI写作历史 ==========

// 获取用户的AI使用历史
router.get('/ai/history', authenticateToken, async (req, res) => {
    try {
        const { type, limit = 20, offset = 0 } = req.query;
        
        let query = 'SELECT * FROM ai_writing_history WHERE user_id = ?';
        const params = [req.user.id];
        
        if (type) {
            query += ' AND action_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);
        
        const [count] = await pool.query(
            'SELECT COUNT(*) as total FROM ai_writing_history WHERE user_id = ?' + (type ? ' AND action_type = ?' : ''),
            type ? [req.user.id, type] : [req.user.id]
        );

        res.json({
            history: rows,
            total: count[0].total
        });
    } catch (error) {
        console.error('获取AI历史错误:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// ========== 模拟AI服务调用 (实际项目中应调用OpenAI等API) ==========

async function generateAIContent(type, content, style) {
    // 模拟AI生成，实际应调用OpenAI API
    const mockResponses = {
        continue: content + '\n\n[AI续写内容示例] 这是一个基于上下文的智能续写段落，可以根据前文自动推断语义并生成连贯的后续内容...',
        rewrite: `[${style}风格改写] ` + content.replace(/。/g, '，').slice(0, 100) + '...'
    };
    return mockResponses[type] || content;
}

async function generateAITitles(content, count) {
    const titles = [];
    const keywords = content.slice(0, 50);
    for (let i = 1; i <= count; i++) {
        titles.push(`${keywords}...的${i}种解读方式`);
    }
    return titles;
}

async function generateAISummary(content, language) {
    return `[${language}] ${content.slice(0, 100)}...的核心要点总结：本文讨论了多个重要观点，包括...`;
}

async function generateAITLDR(content, language) {
    return `[${language}] TL;DR: 这是一篇关于${content.slice(0, 30)}的文章。`;
}

async function generateAIKeywords(content, language) {
    return ['关键词1', '关键词2', '关键词3', '关键词4'];
}

async function generateAITranslation(text, targetLang, sourceLang) {
    return `[${targetLang}] ${text}`;
}

async function generateAIReplySuggestions(context, tone, count) {
    const suggestions = {
        friendly: ['太棒了！感谢分享', '这个观点很有意思', '学到了，谢谢'],
        professional: ['感谢您的宝贵意见', '这是一个很好的观点', '同意您的看法'],
        casual: ['哈哈，确实如此', '说得好', '完全同意']
    };
    return suggestions[tone]?.slice(0, count) || suggestions.friendly.slice(0, count);
}

module.exports = router;
