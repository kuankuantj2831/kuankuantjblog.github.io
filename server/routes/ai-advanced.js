/**
 * AI大模型深度集成路由
 * 第六轮创新性功能 - AI Large Model Integration
 * 
 * 功能模块：
 * 2.1 智能客服机器人
 * 2.2 内容自动生成
 * 2.3 智能代码审查
 * 2.4 多模态AI理解
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// AI服务提供商配置
const AI_PROVIDERS = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3', 'whisper-1']
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra']
    },
    deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        models: ['deepseek-chat', 'deepseek-coder']
    },
    siliconflow: {
        baseUrl: 'https://api.siliconflow.cn/v1',
        models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-R1', 'Pro/deepseek-ai/DeepSeek-R1']
    }
};

// AI请求限流
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 20, // 每用户最多20次请求
    message: { error: 'AI服务调用过于频繁，请稍后再试' }
});

// 中间件：验证请求
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== 2.1 智能客服机器人 ====================

/**
 * 智能客服对话
 * POST /api/ai/chat
 */
router.post('/chat', aiLimiter, [
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('消息长度1-2000字符'),
    body('sessionId').optional().isString(),
    body('context').optional().isArray(),
    validateRequest
], async (req, res) => {
    try {
        const { message, sessionId = `session_${Date.now()}`, context = [], provider = 'siliconflow' } = req.body;
        
        // 构建系统提示词
        const systemPrompt = `你是 "Hakimi 的猫爬架" 博客平台的AI助手，一个友好、专业的智能客服。

平台功能：
- 博客文章发布、阅读、评论
- 用户等级系统和积分奖励
- NFT铸造和代币经济
- 实时协作编辑
- 游戏化社交功能

回复原则：
1. 使用中文回复，语气友好亲切
2. 回答要简洁明了，避免冗长
3. 遇到技术问题提供具体解决步骤
4. 不清楚的问题诚实告知，不要编造
5. 适当使用emoji增加亲和力

当前时间：${new Date().toLocaleString('zh-CN')}`;

        // 构建消息历史
        const messages = [
            { role: 'system', content: systemPrompt },
            ...context.slice(-10), // 保留最近10条上下文
            { role: 'user', content: message }
        ];

        // 调用AI模型
        const response = await callAIProvider(provider, messages, {
            temperature: 0.7,
            max_tokens: 2000
        });

        res.json({
            success: true,
            data: {
                reply: response.content,
                sessionId,
                suggestions: generateSuggestions(message, response.content),
                usedTokens: response.usage?.total_tokens || 0
            }
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: 'AI服务暂时不可用', details: error.message });
    }
});

/**
 * 流式对话 (SSE)
 * GET /api/ai/chat/stream
 */
router.get('/chat/stream', async (req, res) => {
    const { message, sessionId, provider = 'siliconflow' } = req.query;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const systemPrompt = `你是博客平台的AI助手，请简洁友好地回答用户问题。`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ];

        // 模拟流式响应
        const response = await callAIProvider(provider, messages, { stream: true });
        
        // 分批发送
        const chunks = response.content.split('');
        for (const chunk of chunks) {
            res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
            await new Promise(r => setTimeout(r, 20));
        }
        
        res.write(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`);
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * 常见问题智能回复
 * POST /api/ai/faq
 */
router.post('/faq', async (req, res) => {
    const { question } = req.body;
    
    // 预设FAQ知识库
    const faqDatabase = {
        '如何发布文章': {
            answer: '点击顶部导航栏的"写文章"按钮，进入编辑器即可创作。支持Markdown格式和富文本编辑。',
            link: '/editor.html'
        },
        '如何获得积分': {
            answer: '每日签到、发布文章、获得点赞评论都可以赚取积分。连续签到还有额外奖励哦！',
            link: '/coins.html'
        },
        'NFT是什么': {
            answer: 'NFT（非同质化代币）是区块链上的独特数字资产。您可以将文章铸造为NFT，获得永久数字所有权证明。',
            link: '/nft-guide.html'
        },
        '如何连接钱包': {
            answer: '在个人设置页面点击"连接钱包"，支持MetaMask等主流钱包。连接后可进行NFT铸造和代币交易。',
            link: '/profile.html'
        }
    };

    // 语义匹配
    const matched = Object.entries(faqDatabase).find(([q]) => 
        question.includes(q) || similarity(question, q) > 0.6
    );

    if (matched) {
        res.json({ success: true, data: matched[1], matched: true });
    } else {
        // 未匹配到，走AI生成
        const aiResponse = await callAIProvider('siliconflow', [
            { role: 'system', content: '回答用户关于博客平台的问题' },
            { role: 'user', content: question }
        ]);
        res.json({ success: true, data: { answer: aiResponse.content }, matched: false });
    }
});

// ==================== 2.2 内容自动生成 ====================

/**
 * 文章标题生成
 * POST /api/ai/generate/title
 */
router.post('/generate/title', aiLimiter, [
    body('content').trim().isLength({ min: 10 }).withMessage('内容至少需要10个字符'),
    validateRequest
], async (req, res) => {
    try {
        const { content, count = 5 } = req.body;
        
        const prompt = `根据以下内容生成${count}个吸引人的文章标题：

内容摘要：${content.substring(0, 1000)}

要求：
1. 标题要简洁有力，不超过20字
2. 要有吸引力，能引起读者兴趣
3. 符合中文阅读习惯
4. 提供多种风格：专业型、趣味型、悬念型

请直接返回标题列表，每行一个：`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ], { temperature: 0.8 });

        const titles = response.content.split('\n')
            .map(t => t.replace(/^\d+\.\s*/, '').trim())
            .filter(t => t.length > 0);

        res.json({ success: true, data: { titles: titles.slice(0, count) } });
    } catch (error) {
        res.status(500).json({ error: '生成失败', details: error.message });
    }
});

/**
 * 文章摘要生成
 * POST /api/ai/generate/summary
 */
router.post('/generate/summary', aiLimiter, [
    body('content').trim().isLength({ min: 100 }).withMessage('内容至少需要100个字符'),
    validateRequest
], async (req, res) => {
    try {
        const { content, maxLength = 200 } = req.body;
        
        const prompt = `请为以下文章生成摘要，限制在${maxLength}字以内：

${content.substring(0, 3000)}

要求：
1. 突出核心观点和关键信息
2. 语言流畅，逻辑清晰
3. 不包含"本文"、"作者"等词，直接陈述要点`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ], { max_tokens: 500 });

        res.json({ success: true, data: { summary: response.content.trim() } });
    } catch (error) {
        res.status(500).json({ error: '生成失败', details: error.message });
    }
});

/**
 * 文章内容续写
 * POST /api/ai/generate/continue
 */
router.post('/generate/continue', aiLimiter, [
    body('content').trim().isLength({ min: 50 }).withMessage('内容至少需要50个字符'),
    body('tone').optional().isIn(['professional', 'casual', 'humorous', 'academic']),
    validateRequest
], async (req, res) => {
    try {
        const { content, tone = 'professional', wordCount = 300 } = req.body;
        
        const toneMap = {
            professional: '专业严谨',
            casual: '轻松随意',
            humorous: '幽默风趣',
            academic: '学术规范'
        };

        const prompt = `请根据以下内容续写文章，续写约${wordCount}字：

已写内容：
${content.substring(-500)}

要求：
1. 语气风格：${toneMap[tone]}
2. 保持与上文的一致性
3. 自然过渡，不生硬
4. 丰富内容，添加具体细节或例子

续写内容：`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ], { temperature: 0.7, max_tokens: 2000 });

        res.json({ success: true, data: { continuation: response.content.trim() } });
    } catch (error) {
        res.status(500).json({ error: '续写失败', details: error.message });
    }
});

/**
 * SEO优化建议
 * POST /api/ai/generate/seo
 */
router.post('/generate/seo', aiLimiter, [
    body('title').trim().isLength({ min: 1 }),
    body('content').optional().isString(),
    validateRequest
], async (req, res) => {
    try {
        const { title, content = '' } = req.body;
        
        const prompt = `请为以下文章提供SEO优化建议：

标题：${title}
内容预览：${content.substring(0, 500)}

请提供以下建议：
1. 优化后的标题（3个备选）
2. 推荐的关键词（5-8个）
3. Meta描述建议（150字以内）
4. 内容结构优化建议
5. 内链/外链建议`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ]);

        res.json({ success: true, data: { suggestions: response.content.trim() } });
    } catch (error) {
        res.status(500).json({ error: '分析失败', details: error.message });
    }
});

/**
 * 智能标签推荐
 * POST /api/ai/generate/tags
 */
router.post('/generate/tags', aiLimiter, [
    body('content').trim().isLength({ min: 50 }),
    validateRequest
], async (req, res) => {
    try {
        const { content, existingTags = [] } = req.body;
        
        const prompt = `请为以下内容推荐合适的标签：

内容：${content.substring(0, 1500)}

已有标签：${existingTags.join(', ')}

要求：
1. 推荐5-10个相关标签
2. 包含热门标签和长尾标签
3. 格式：#标签名
4. 返回标签列表即可`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ]);

        const tags = response.content.match(/#[\u4e00-\u9fa5\w]+/g) || [];
        
        res.json({ success: true, data: { 
            tags: tags.map(t => t.replace('#', '')),
            categories: suggestCategories(content)
        }});
    } catch (error) {
        res.status(500).json({ error: '推荐失败', details: error.message });
    }
});

// ==================== 2.3 智能代码审查 ====================

/**
 * 代码审查
 * POST /api/ai/code/review
 */
router.post('/code/review', aiLimiter, [
    body('code').trim().isLength({ min: 10 }),
    body('language').optional().isString(),
    validateRequest
], async (req, res) => {
    try {
        const { code, language = 'auto' } = req.body;
        
        const prompt = `请对以下代码进行专业审查：

${language !== 'auto' ? `语言：${language}` : ''}
\`\`\`
${code}
\`\`\`

请从以下方面分析：
1. 代码质量（可读性、可维护性）
2. 潜在Bug和安全问题
3. 性能优化建议
4. 最佳实践建议
5. 重构建议

请以结构化格式返回：`;

        const response = await callAIProvider('siliconflow', [
            { role: 'system', content: '你是一位资深代码审查专家，擅长发现代码问题和提供改进建议。' },
            { role: 'user', content: prompt }
        ]);

        // 解析审查结果
        const review = parseCodeReview(response.content);

        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ error: '审查失败', details: error.message });
    }
});

/**
 * 代码解释
 * POST /api/ai/code/explain
 */
router.post('/code/explain', aiLimiter, [
    body('code').trim().isLength({ min: 1 }),
    validateRequest
], async (req, res) => {
    try {
        const { code, detail = 'normal' } = req.body;
        
        const detailMap = {
            simple: '用简单语言解释这段代码的功能',
            normal: '详细解释代码逻辑和执行流程',
            deep: '深入分析代码原理，包括算法复杂度和设计模式'
        };

        const prompt = `${detailMap[detail]}：

\`\`\`
${code}
\`\`\`

要求：
1. 逐行或分块解释
2. 解释关键函数和变量
3. 说明输入输出
4. 添加注释示例`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ]);

        res.json({ success: true, data: { explanation: response.content.trim() } });
    } catch (error) {
        res.status(500).json({ error: '解释失败', details: error.message });
    }
});

/**
 * 代码转换
 * POST /api/ai/code/convert
 */
router.post('/code/convert', aiLimiter, [
    body('code').trim().isLength({ min: 1 }),
    body('from').isString(),
    body('to').isString(),
    validateRequest
], async (req, res) => {
    try {
        const { code, from, to } = req.body;
        
        const prompt = `请将以下${from}代码转换为${to}代码：

${from}代码：
\`\`\`
${code}
\`\`\`

要求：
1. 保持功能一致
2. 使用目标语言的最佳实践
3. 添加必要的注释
4. 处理语言差异（如语法特性）

转换后的${to}代码：`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ]);

        // 提取代码块
        const codeMatch = response.content.match(/```[\w]*\n?([\s\S]*?)```/);
        const convertedCode = codeMatch ? codeMatch[1].trim() : response.content.trim();

        res.json({ success: true, data: { 
            convertedCode,
            from,
            to,
            notes: extractConversionNotes(response.content)
        }});
    } catch (error) {
        res.status(500).json({ error: '转换失败', details: error.message });
    }
});

/**
 * 代码优化
 * POST /api/ai/code/optimize
 */
router.post('/code/optimize', aiLimiter, [
    body('code').trim().isLength({ min: 1 }),
    body('goal').optional().isIn(['performance', 'readability', 'memory', 'all']),
    validateRequest
], async (req, res) => {
    try {
        const { code, goal = 'all' } = req.body;
        
        const goalMap = {
            performance: '优化执行性能',
            readability: '提高可读性',
            memory: '优化内存使用',
            all: '全面优化（性能、可读性、内存）'
        };

        const prompt = `请对以下代码进行${goalMap[goal]}：

\`\`\`
${code}
\`\`\`

要求：
1. 提供优化后的完整代码
2. 列出具体优化点
3. 预估性能提升
4. 说明适用场景`;

        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: prompt }
        ]);

        res.json({ success: true, data: { 
            optimizedCode: extractCodeBlock(response.content),
            explanation: response.content
        }});
    } catch (error) {
        res.status(500).json({ error: '优化失败', details: error.message });
    }
});

// ==================== 2.4 多模态AI理解 ====================

/**
 * 图像描述生成
 * POST /api/ai/vision/describe
 */
router.post('/vision/describe', aiLimiter, [
    body('imageUrl').isURL(),
    validateRequest
], async (req, res) => {
    try {
        const { imageUrl, detail = 'normal' } = req.body;
        
        // 这里集成多模态模型（如GPT-4V、Gemini Pro Vision）
        const response = await callMultimodalAI('vision', {
            image: imageUrl,
            prompt: detail === 'detailed' 
                ? '详细描述这张图片的所有细节，包括主体、背景、色彩、氛围等'
                : '简要描述这张图片的内容'
        });

        res.json({ success: true, data: {
            description: response.description,
            tags: response.tags || [],
            colors: response.colors || [],
            objects: response.objects || []
        }});
    } catch (error) {
        res.status(500).json({ error: '图像分析失败', details: error.message });
    }
});

/**
 * OCR文字识别
 * POST /api/ai/vision/ocr
 */
router.post('/vision/ocr', aiLimiter, [
    body('imageUrl').isURL(),
    validateRequest
], async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        // 模拟OCR功能
        const response = await callMultimodalAI('ocr', { image: imageUrl });

        res.json({ success: true, data: {
            text: response.text,
            blocks: response.blocks || [], // 分块识别结果
            confidence: response.confidence || 0
        }});
    } catch (error) {
        res.status(500).json({ error: 'OCR识别失败', details: error.message });
    }
});

/**
 * 图像生成 (Text to Image)
 * POST /api/ai/image/generate
 */
router.post('/image/generate', aiLimiter, [
    body('prompt').trim().isLength({ min: 1, max: 1000 }),
    validateRequest
], async (req, res) => {
    try {
        const { prompt, size = '1024x1024', style = 'vivid' } = req.body;
        
        // 优化提示词
        const enhancedPrompt = await enhanceImagePrompt(prompt);
        
        // 调用图像生成API
        const imageUrl = await generateImage(enhancedPrompt, { size, style });

        res.json({ success: true, data: {
            imageUrl,
            prompt: enhancedPrompt,
            originalPrompt: prompt,
            size,
            style
        }});
    } catch (error) {
        res.status(500).json({ error: '图像生成失败', details: error.message });
    }
});

/**
 * 语音转文字
 * POST /api/ai/audio/transcribe
 */
router.post('/audio/transcribe', aiLimiter, async (req, res) => {
    try {
        // 处理音频文件上传和转录
        const { audioUrl, language = 'zh' } = req.body;
        
        const transcript = await transcribeAudio(audioUrl, language);

        res.json({ success: true, data: {
            text: transcript.text,
            segments: transcript.segments || [],
            language: transcript.language
        }});
    } catch (error) {
        res.status(500).json({ error: '转录失败', details: error.message });
    }
});

/**
 * 文字转语音
 * POST /api/ai/audio/synthesize
 */
router.post('/audio/synthesize', aiLimiter, [
    body('text').trim().isLength({ min: 1, max: 5000 }),
    validateRequest
], async (req, res) => {
    try {
        const { text, voice = 'alloy', speed = 1.0 } = req.body;
        
        const audioUrl = await synthesizeSpeech(text, { voice, speed });

        res.json({ success: true, data: { audioUrl, duration: text.length * 0.3 } });
    } catch (error) {
        res.status(500).json({ error: '语音合成失败', details: error.message });
    }
});

// ==================== 辅助函数 ====================

/**
 * 调用AI服务提供商
 */
async function callAIProvider(provider, messages, options = {}) {
    const config = AI_PROVIDERS[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (!apiKey) throw new Error(`API key not configured for ${provider}`);

    const model = options.model || config.models[0];
    
    // 构建请求体
    const requestBody = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        stream: options.stream ?? false
    };

    // 发送请求
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API Error: ${error}`);
    }

    const data = await response.json();
    return {
        content: data.choices[0].message.content,
        usage: data.usage
    };
}

/**
 * 调用多模态AI
 */
async function callMultimodalAI(task, params) {
    // 这里集成实际的多模态API
    // 返回模拟数据
    const mockResponses = {
        vision: {
            description: '这是一张美丽的自然风景照片，展示了一片青山绿水...',
            tags: ['自然', '风景', '山水', '旅游'],
            colors: ['#2E7D32', '#1976D2', '#FFFFFF'],
            objects: ['mountain', 'water', 'sky']
        },
        ocr: {
            text: '识别的文字内容...',
            blocks: [],
            confidence: 0.95
        }
    };
    
    return mockResponses[task] || {};
}

/**
 * 生成图像
 */
async function generateImage(prompt, options) {
    // 集成DALL-E、Midjourney API或Stable Diffusion
    // 返回模拟URL
    return `https://picsum.photos/seed/${Date.now()}/${options.size.replace('x', '/')}`;
}

/**
 * 音频转录
 */
async function transcribeAudio(audioUrl, language) {
    // 集成Whisper API
    return { text: '转录的文本内容...', segments: [], language };
}

/**
 * 语音合成
 */
async function synthesizeSpeech(text, options) {
    // 集成TTS API
    return `https://example.com/audio/${Date.now()}.mp3`;
}

/**
 * 优化图像生成提示词
 */
async function enhanceImagePrompt(prompt) {
    const enhancePrompt = `优化以下图像生成提示词，使其更具体、更有画面感：

原提示词：${prompt}

优化要求：
1. 添加风格描述（写实、动漫、油画等）
2. 添加光影效果描述
3. 添加质量修饰词（4K、 masterpiece等）
4. 保持原意的同时丰富细节

优化后的提示词：`;

    try {
        const response = await callAIProvider('siliconflow', [
            { role: 'user', content: enhancePrompt }
        ], { max_tokens: 500 });
        return response.content.trim();
    } catch {
        return prompt;
    }
}

/**
 * 生成智能建议
 */
function generateSuggestions(userMessage, aiReply) {
    // 基于对话内容生成后续问题建议
    const commonSuggestions = [
        '能详细说明一下吗？',
        '还有其他相关功能吗？',
        '如何开始使用这个功能？'
    ];
    return commonSuggestions.slice(0, 3);
}

/**
 * 计算文本相似度
 */
function similarity(s1, s2) {
    // 简单的Jaccard相似度
    const set1 = new Set(s1.split(''));
    const set2 = new Set(s2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

/**
 * 建议文章分类
 */
function suggestCategories(content) {
    const categories = [];
    const keywords = {
        '技术': ['代码', '编程', '开发', '算法', '框架'],
        '生活': ['日常', '心情', '旅行', '美食'],
        '学习': ['教程', '笔记', '知识', '学习'],
        '创作': ['小说', '故事', '诗歌', '散文']
    };
    
    for (const [cat, words] of Object.entries(keywords)) {
        if (words.some(w => content.includes(w))) {
            categories.push(cat);
        }
    }
    
    return categories;
}

/**
 * 解析代码审查结果
 */
function parseCodeReview(content) {
    return {
        overall: content,
        score: Math.floor(Math.random() * 30) + 70, // 模拟评分
        issues: [],
        suggestions: []
    };
}

/**
 * 提取代码块
 */
function extractCodeBlock(content) {
    const match = content.match(/```[\w]*\n?([\s\S]*?)```/);
    return match ? match[1].trim() : content;
}

/**
 * 提取转换说明
 */
function extractConversionNotes(content) {
    const notes = content.replace(/```[\w]*\n?[\s\S]*?```/g, '').trim();
    return notes;
}

module.exports = router;
