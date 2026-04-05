/**
 * 问答悬赏系统 API 路由
 * Q&A Bounty System - 类似知乎付费问答
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// JWT 验证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未提供访问令牌' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(403).json({ error: '令牌无效或已过期' });
    }
};

// ========== 问答相关 API ==========

/**
 * 创建问题（带悬赏）
 * POST /qna/questions
 */
router.post('/questions', authenticateToken, async (req, res) => {
    try {
        const { title, content, tags, bountyAmount, bountyDuration, allowMultipleAnswers } = req.body;

        // 验证参数
        if (!title || !content || !bountyAmount) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        if (bountyAmount < 10) {
            return res.status(400).json({ error: '悬赏金额至少为10金币' });
        }

        // 检查用户余额
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('coins')
            .eq('id', req.userId)
            .single();

        if (userError || !userData || userData.coins < bountyAmount) {
            return res.status(400).json({ error: '金币余额不足' });
        }

        // 扣除悬赏金币（冻结）
        const { error: deductError } = await supabase.rpc('freeze_coins', {
            user_id: req.userId,
            amount: bountyAmount
        });

        if (deductError) {
            return res.status(500).json({ error: '扣除金币失败' });
        }

        // 创建问题
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (bountyDuration || 7));

        const { data: question, error } = await supabase
            .from('qna_questions')
            .insert({
                author_id: req.userId,
                title,
                content,
                tags: tags || [],
                bounty_amount: bountyAmount,
                bounty_expires_at: expiryDate.toISOString(),
                allow_multiple_answers: allowMultipleAnswers || false,
                status: 'open',
                view_count: 0,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            // 回滚金币
            await supabase.rpc('unfreeze_coins', {
                user_id: req.userId,
                amount: bountyAmount
            });
            throw error;
        }

        res.status(201).json({
            success: true,
            data: question,
            message: '问题创建成功'
        });
    } catch (error) {
        console.error('创建问题失败:', error);
        res.status(500).json({ error: '创建问题失败' });
    }
});

/**
 * 获取问题列表
 * GET /qna/questions
 */
router.get('/questions', async (req, res) => {
    try {
        const { 
            status = 'open', 
            tag, 
            sort = 'newest',
            page = 1, 
            limit = 20,
            search
        } = req.query;

        let query = supabase
            .from('qna_questions')
            .select(`
                *,
                author:users(id, username, avatar, level),
                answers:qna_answers(count),
                accepted_answer:qna_answers!qna_questions_accepted_answer_id_fkey(id)
            `, { count: 'exact' });

        // 过滤条件
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        if (tag) {
            query = query.contains('tags', [tag]);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // 排序
        switch (sort) {
            case 'bounty':
                query = query.order('bounty_amount', { ascending: false });
                break;
            case 'popular':
                query = query.order('view_count', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        // 分页
        const from = (page - 1) * limit;
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data.map(q => ({
                ...q,
                answer_count: q.answers?.[0]?.count || 0
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取问题列表失败:', error);
        res.status(500).json({ error: '获取问题列表失败' });
    }
});

/**
 * 获取问题详情
 * GET /qna/questions/:id
 */
router.get('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 增加浏览量
        await supabase.rpc('increment_question_views', { question_id: id });

        const { data: question, error } = await supabase
            .from('qna_questions')
            .select(`
                *,
                author:users(id, username, avatar, level, bio),
                answers:qna_answers(
                    *,
                    author:users(id, username, avatar, level),
                    votes:qna_votes(count)
                ),
                accepted_answer:qna_answers!qna_questions_accepted_answer_id_fkey(
                    *,
                    author:users(id, username, avatar)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !question) {
            return res.status(404).json({ error: '问题不存在' });
        }

        // 处理答案排序（按得票数）
        if (question.answers) {
            question.answers.sort((a, b) => {
                const aVotes = a.votes?.[0]?.count || 0;
                const bVotes = b.votes?.[0]?.count || 0;
                return bVotes - aVotes;
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        console.error('获取问题详情失败:', error);
        res.status(500).json({ error: '获取问题详情失败' });
    }
});

/**
 * 提交答案
 * POST /qna/questions/:id/answers
 */
router.post('/questions/:id/answers', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length < 10) {
            return res.status(400).json({ error: '答案内容至少10个字符' });
        }

        // 检查问题状态
        const { data: question, error: qError } = await supabase
            .from('qna_questions')
            .select('status, author_id, allow_multiple_answers')
            .eq('id', id)
            .single();

        if (qError || !question) {
            return res.status(404).json({ error: '问题不存在' });
        }

        if (question.status !== 'open') {
            return res.status(400).json({ error: '问题已关闭，无法回答' });
        }

        if (question.author_id === req.userId) {
            return res.status(400).json({ error: '不能回答自己的问题' });
        }

        // 检查是否已回答
        if (!question.allow_multiple_answers) {
            const { data: existingAnswer } = await supabase
                .from('qna_answers')
                .select('id')
                .eq('question_id', id)
                .eq('author_id', req.userId)
                .single();

            if (existingAnswer) {
                return res.status(400).json({ error: '您已回答过该问题' });
            }
        }

        // 创建答案
        const { data: answer, error } = await supabase
            .from('qna_answers')
            .insert({
                question_id: id,
                author_id: req.userId,
                content,
                vote_count: 0,
                is_accepted: false,
                created_at: new Date().toISOString()
            })
            .select('*, author:users(id, username, avatar, level)')
            .single();

        if (error) throw error;

        // 通知问题作者
        await supabase.from('notifications').insert({
            user_id: question.author_id,
            type: 'new_answer',
            title: '您的问题有新回答',
            content: `${req.username} 回答了您的问题`,
            data: { question_id: id, answer_id: answer.id },
            created_at: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            data: answer,
            message: '回答提交成功'
        });
    } catch (error) {
        console.error('提交答案失败:', error);
        res.status(500).json({ error: '提交答案失败' });
    }
});

/**
 * 采纳答案（发放悬赏）
 * POST /qna/questions/:id/accept/:answerId
 */
router.post('/questions/:questionId/accept/:answerId', authenticateToken, async (req, res) => {
    try {
        const { questionId, answerId } = req.params;

        // 获取问题信息
        const { data: question, error: qError } = await supabase
            .from('qna_questions')
            .select('author_id, status, bounty_amount, accepted_answer_id')
            .eq('id', questionId)
            .single();

        if (qError || !question) {
            return res.status(404).json({ error: '问题不存在' });
        }

        if (question.author_id !== req.userId) {
            return res.status(403).json({ error: '只有问题作者可以采纳答案' });
        }

        if (question.accepted_answer_id) {
            return res.status(400).json({ error: '已有采纳的答案' });
        }

        // 获取答案信息
        const { data: answer, error: aError } = await supabase
            .from('qna_answers')
            .select('author_id')
            .eq('id', answerId)
            .eq('question_id', questionId)
            .single();

        if (aError || !answer) {
            return res.status(404).json({ error: '答案不存在' });
        }

        // 发放悬赏
        const { error: transferError } = await supabase.rpc('transfer_bounty', {
            from_user_id: req.userId,
            to_user_id: answer.author_id,
            amount: question.bounty_amount,
            question_id: questionId,
            answer_id: answerId
        });

        if (transferError) {
            return res.status(500).json({ error: '发放悬赏失败' });
        }

        // 更新问题和答案状态
        await Promise.all([
            supabase
                .from('qna_questions')
                .update({ 
                    status: 'resolved', 
                    accepted_answer_id: answerId,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', questionId),
            supabase
                .from('qna_answers')
                .update({ is_accepted: true })
                .eq('id', answerId)
        ]);

        // 通知答案作者
        await supabase.from('notifications').insert({
            user_id: answer.author_id,
            type: 'answer_accepted',
            title: '您的回答被采纳',
            content: `您获得了 ${question.bounty_amount} 金币悬赏奖励！`,
            data: { question_id: questionId, answer_id: answerId },
            created_at: new Date().toISOString()
        });

        res.json({
            success: true,
            message: '答案采纳成功，悬赏已发放',
            data: {
                bountyAmount: question.bounty_amount
            }
        });
    } catch (error) {
        console.error('采纳答案失败:', error);
        res.status(500).json({ error: '采纳答案失败' });
    }
});

/**
 * 投票（赞同/反对）
 * POST /qna/answers/:id/vote
 */
router.post('/answers/:id/vote', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'up' 或 'down'

        if (!['up', 'down'].includes(type)) {
            return res.status(400).json({ error: '投票类型无效' });
        }

        // 检查是否已投票
        const { data: existingVote } = await supabase
            .from('qna_votes')
            .select('id, type')
            .eq('answer_id', id)
            .eq('user_id', req.userId)
            .single();

        if (existingVote) {
            if (existingVote.type === type) {
                // 取消投票
                await supabase.from('qna_votes').delete().eq('id', existingVote.id);
                await supabase.rpc('update_answer_votes', { answer_id: id });
                return res.json({ success: true, message: '已取消投票', voted: false });
            } else {
                // 修改投票
                await supabase
                    .from('qna_votes')
                    .update({ type })
                    .eq('id', existingVote.id);
            }
        } else {
            // 新增投票
            await supabase.from('qna_votes').insert({
                answer_id: id,
                user_id: req.userId,
                type
            });
        }

        // 更新答案投票数
        await supabase.rpc('update_answer_votes', { answer_id: id });

        res.json({
            success: true,
            message: '投票成功',
            voted: true,
            type
        });
    } catch (error) {
        console.error('投票失败:', error);
        res.status(500).json({ error: '投票失败' });
    }
});

/**
 * 获取我的问答统计
 * GET /qna/my-stats
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        // 提问统计
        const { data: questionStats } = await supabase
            .from('qna_questions')
            .select('status', { count: 'exact' })
            .eq('author_id', req.userId);

        // 回答统计
        const { data: answerStats } = await supabase
            .from('qna_answers')
            .select('is_accepted', { count: 'exact' })
            .eq('author_id', req.userId);

        // 获得的赞同数
        const { data: votesData } = await supabase
            .from('qna_answers')
            .select('vote_count')
            .eq('author_id', req.userId);

        const totalVotes = votesData?.reduce((sum, a) => sum + (a.vote_count || 0), 0) || 0;

        res.json({
            success: true,
            data: {
                questions: {
                    total: questionStats?.length || 0,
                    open: questionStats?.filter(q => q.status === 'open').length || 0,
                    resolved: questionStats?.filter(q => q.status === 'resolved').length || 0
                },
                answers: {
                    total: answerStats?.length || 0,
                    accepted: answerStats?.filter(a => a.is_accepted).length || 0
                },
                reputation: {
                    votes: totalVotes,
                    score: Math.floor(totalVotes * 10 + (answerStats?.filter(a => a.is_accepted).length || 0) * 50)
                }
            }
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ error: '获取统计失败' });
    }
});

module.exports = router;
