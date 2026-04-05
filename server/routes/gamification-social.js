/**
 * 游戏化社交系统路由
 * 第六轮创新性功能 - Gamified Social System
 * 
 * 功能模块：
 * 4.1 虚拟宠物系统
 * 4.2 社区任务系统
 * 4.3 排行榜竞技
 * 4.4 成就系统2.0
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase客户端
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 宠物配置
const PET_CONFIG = {
    species: {
        cat: {
            name: '猫咪',
            emoji: '🐱',
            growthRate: 1.0,
            foods: ['fish', 'milk', 'cat_food'],
            favoriteFood: 'fish',
            traits: ['curious', 'playful', 'sleepy']
        },
        dog: {
            name: '狗狗',
            emoji: '🐶',
            growthRate: 1.2,
            foods: ['bone', 'meat', 'dog_food'],
            favoriteFood: 'meat',
            traits: ['loyal', 'energetic', 'friendly']
        },
        rabbit: {
            name: '兔子',
            emoji: '🐰',
            growthRate: 0.9,
            foods: ['carrot', 'lettuce', 'hay'],
            favoriteFood: 'carrot',
            traits: ['cute', 'timid', 'fast']
        },
        penguin: {
            name: '企鹅',
            emoji: '🐧',
            growthRate: 1.1,
            foods: ['fish', 'shrimp', 'ice_cream'],
            favoriteFood: 'shrimp',
            traits: ['cool', 'waddling', 'social']
        },
        dragon: {
            name: '小龙',
            emoji: '🐲',
            growthRate: 0.8,
            foods: ['gem', 'gold', 'magic_fruit'],
            favoriteFood: 'magic_fruit',
            traits: ['mythical', 'powerful', 'rare'],
            rare: true
        }
    },
    stages: [
        { name: '蛋', minLevel: 0, emoji: '🥚' },
        { name: '幼崽', minLevel: 5, emoji: null },
        { name: '少年', minLevel: 15, emoji: null },
        { name: '成年', minLevel: 30, emoji: null },
        { name: '进化', minLevel: 50, emoji: '✨' }
    ],
    items: {
        fish: { name: '鲜鱼', price: 10, hunger: 20, happiness: 5, emoji: '🐟' },
        milk: { name: '牛奶', price: 5, hunger: 10, happiness: 3, emoji: '🥛' },
        cat_food: { name: '猫粮', price: 8, hunger: 15, happiness: 4, emoji: '🍲' },
        bone: { name: '骨头', price: 8, hunger: 15, happiness: 10, emoji: '🦴' },
        meat: { name: '鲜肉', price: 15, hunger: 25, happiness: 8, emoji: '🥩' },
        dog_food: { name: '狗粮', price: 8, hunger: 15, happiness: 4, emoji: '🍖' },
        carrot: { name: '胡萝卜', price: 5, hunger: 12, happiness: 6, emoji: '🥕' },
        toy_ball: { name: '玩具球', price: 20, happiness: 15, energy: -5, emoji: '⚽' },
        brush: { name: '毛刷', price: 15, happiness: 10, hygiene: 15, emoji: '🪮' },
        medicine: { name: '宠物药', price: 50, health: 50, emoji: '💊' }
    }
};

// 任务配置
const MISSION_CONFIG = {
    daily: [
        { id: 'login', name: '每日登录', description: '登录平台', reward: 10, type: 'daily' },
        { id: 'read_3', name: '阅读达人', description: '阅读3篇文章', reward: 15, type: 'daily', target: 3 },
        { id: 'like_5', name: '点赞狂人', description: '点赞5次', reward: 10, type: 'daily', target: 5 },
        { id: 'comment_2', name: '评论之星', description: '发表评论2次', reward: 20, type: 'daily', target: 2 },
        { id: 'share_1', name: '分享快乐', description: '分享1篇文章', reward: 15, type: 'daily', target: 1 }
    ],
    weekly: [
        { id: 'write_2', name: '创作者', description: '发布2篇文章', reward: 50, type: 'weekly', target: 2 },
        { id: 'get_likes_20', name: '受欢迎', description: '获得20个赞', reward: 30, type: 'weekly', target: 20 },
        { id: 'feed_pet_7', name: '好主人', description: '连续7天喂养宠物', reward: 40, type: 'weekly', target: 7 }
    ],
    achievement: [
        { id: 'first_article', name: '初出茅庐', description: '发布第一篇文章', reward: 100, type: 'achievement' },
        { id: 'popular_author', name: '人气作者', description: '获得100个赞', reward: 200, type: 'achievement', target: 100 },
        { id: 'expert', name: '专家', description: '获得50个专业徽章', reward: 500, type: 'achievement', target: 50 },
        { id: 'social_butterfly', name: '社交达人', description: '关注100个用户', reward: 300, type: 'achievement', target: 100 }
    ]
};

// 中间件
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== 4.1 虚拟宠物系统 ====================

/**
 * 获取或创建宠物
 * GET /api/gamification/pet
 */
router.get('/pet', async (req, res) => {
    try {
        const userId = req.user.id;

        let { data: pet, error } = await supabase
            .from('user_pets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!pet) {
            // 用户还没有宠物，返回可选种类
            return res.json({
                success: true,
                data: {
                    hasPet: false,
                    availableSpecies: Object.entries(PET_CONFIG.species).map(([key, s]) => ({
                        id: key,
                        name: s.name,
                        emoji: s.emoji,
                        traits: s.traits,
                        rare: s.rare || false
                    }))
                }
            });
        }

        // 计算属性衰减
        pet = await updatePetStatus(pet);

        res.json({
            success: true,
            data: {
                hasPet: true,
                pet: formatPetData(pet)
            }
        });
    } catch (error) {
        console.error('Get Pet Error:', error);
        res.status(500).json({ error: '获取宠物信息失败' });
    }
});

/**
 * 领养宠物
 * POST /api/gamification/pet/adopt
 */
router.post('/pet/adopt', [
    body('species').isIn(Object.keys(PET_CONFIG.species)),
    body('name').trim().isLength({ min: 1, max: 20 }),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { species, name } = req.body;

        // 检查是否已有宠物
        const { data: existing } = await supabase
            .from('user_pets')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existing) {
            return res.status(400).json({ error: '您已经有一只宠物了' });
        }

        // 检查稀有宠物条件
        const speciesConfig = PET_CONFIG.species[species];
        if (speciesConfig.rare) {
            const { data: user } = await supabase
                .from('users')
                .select('coins, level')
                .eq('id', userId)
                .single();
            
            if (user.level < 20) {
                return res.status(403).json({ error: '需要达到20级才能领养稀有宠物' });
            }
        }

        const pet = {
            id: uuidv4(),
            user_id: userId,
            name,
            species,
            level: 0,
            exp: 0,
            stage: 0,
            hunger: 80,
            happiness: 80,
            health: 100,
            hygiene: 80,
            energy: 100,
            created_at: new Date(),
            last_fed: new Date(),
            last_played: new Date(),
            total_fed: 0,
            total_played: 0,
            accessories: [],
            skills: []
        };

        await supabase.from('user_pets').insert(pet);

        // 发放成就
        await checkAndAwardAchievement(userId, 'pet_owner');

        res.json({
            success: true,
            data: {
                message: `恭喜你领养了${speciesConfig.name} ${name}！`,
                pet: formatPetData(pet)
            }
        });
    } catch (error) {
        res.status(500).json({ error: '领养宠物失败' });
    }
});

/**
 * 喂养宠物
 * POST /api/gamification/pet/feed
 */
router.post('/pet/feed', [
    body('itemId').isString(),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const item = PET_CONFIG.items[itemId];
        if (!item) {
            return res.status(400).json({ error: '物品不存在' });
        }

        // 检查用户库存
        const { data: inventory } = await supabase
            .from('user_inventory')
            .select('quantity')
            .eq('user_id', userId)
            .eq('item_id', itemId)
            .single();

        if (!inventory || inventory.quantity < 1) {
            return res.status(400).json({ error: '物品不足，请去商店购买' });
        }

        // 获取宠物
        let { data: pet } = await supabase
            .from('user_pets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!pet) {
            return res.status(404).json({ error: '您还没有宠物' });
        }

        // 更新宠物状态
        const speciesConfig = PET_CONFIG.species[pet.species];
        const isFavorite = speciesConfig.favoriteFood === itemId;
        const bonus = isFavorite ? 1.5 : 1;

        pet.hunger = Math.min(100, pet.hunger + (item.hunger || 0) * bonus);
        pet.happiness = Math.min(100, pet.happiness + (item.happiness || 0) * bonus);
        pet.health = Math.min(100, pet.health + (item.health || 0));
        pet.energy = Math.max(0, pet.energy + (item.energy || 0));
        pet.last_fed = new Date();
        pet.total_fed += 1;

        // 获得经验
        const expGain = Math.floor(5 * bonus);
        pet.exp += expGain;

        // 检查升级
        const levelResult = checkLevelUp(pet);
        pet = levelResult.pet;

        // 保存宠物状态
        await supabase.from('user_pets').update(pet).eq('id', pet.id);

        // 扣除物品
        await supabase.from('user_inventory')
            .update({ quantity: inventory.quantity - 1 })
            .eq('user_id', userId)
            .eq('item_id', itemId);

        res.json({
            success: true,
            data: {
                message: isFavorite ? `${pet.name}超爱吃这个！获得1.5倍加成！` : `${pet.name}吃饱了！`,
                pet: formatPetData(pet),
                expGain,
                levelUp: levelResult.leveledUp,
                newStage: levelResult.newStage
            }
        });
    } catch (error) {
        res.status(500).json({ error: '喂养失败' });
    }
});

/**
 * 与宠物互动
 * POST /api/gamification/pet/interact
 */
router.post('/pet/interact', [
    body('action').isIn(['play', 'clean', 'train', 'pet']),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { action } = req.body;

        let { data: pet } = await supabase
            .from('user_pets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!pet) {
            return res.status(404).json({ error: '您还没有宠物' });
        }

        const actionEffects = {
            play: { happiness: 15, energy: -10, exp: 10 },
            clean: { hygiene: 30, happiness: 5, exp: 5 },
            train: { exp: 20, energy: -15, hunger: -10 },
            pet: { happiness: 10, exp: 2 }
        };

        const effect = actionEffects[action];
        
        pet.happiness = Math.min(100, pet.happiness + (effect.happiness || 0));
        pet.hygiene = Math.min(100, pet.hygiene + (effect.hygiene || 0));
        pet.energy = Math.max(0, pet.energy + (effect.energy || 0));
        pet.hunger = Math.max(0, pet.hunger + (effect.hunger || 0));
        pet.exp += effect.exp;

        if (action === 'play') {
            pet.last_played = new Date();
            pet.total_played += 1;
        }

        // 检查升级
        const levelResult = checkLevelUp(pet);
        pet = levelResult.pet;

        await supabase.from('user_pets').update(pet).eq('id', pet.id);

        const actionMessages = {
            play: `您和${pet.name}玩得非常开心！`,
            clean: `您给${pet.name}洗了个澡，现在香喷喷的！`,
            train: `${pet.name}很努力地在训练！`,
            pet: `${pet.name}舒服地眯起了眼睛~`
        };

        res.json({
            success: true,
            data: {
                message: actionMessages[action],
                pet: formatPetData(pet),
                expGain: effect.exp,
                levelUp: levelResult.leveledUp,
                newStage: levelResult.newStage
            }
        });
    } catch (error) {
        res.status(500).json({ error: '互动失败' });
    }
});

/**
 * 获取宠物商店
 * GET /api/gamification/pet/shop
 */
router.get('/pet/shop', async (req, res) => {
    try {
        const items = Object.entries(PET_CONFIG.items).map(([id, item]) => ({
            id,
            ...item
        }));

        res.json({
            success: true,
            data: { items }
        });
    } catch (error) {
        res.status(500).json({ error: '获取商店失败' });
    }
});

/**
 * 购买物品
 * POST /api/gamification/pet/shop/buy
 */
router.post('/pet/shop/buy', [
    body('itemId').isString(),
    body('quantity').isInt({ min: 1, max: 99 }),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, quantity } = req.body;

        const item = PET_CONFIG.items[itemId];
        if (!item) {
            return res.status(400).json({ error: '物品不存在' });
        }

        const totalPrice = item.price * quantity;

        // 检查余额
        const { data: user } = await supabase
            .from('users')
            .select('coins')
            .eq('id', userId)
            .single();

        if (user.coins < totalPrice) {
            return res.status(400).json({ error: '积分不足' });
        }

        // 扣除积分
        await supabase.rpc('deduct_user_coins', {
            user_id: userId,
            amount: totalPrice
        });

        // 添加物品到库存
        const { data: existing } = await supabase
            .from('user_inventory')
            .select('quantity')
            .eq('user_id', userId)
            .eq('item_id', itemId)
            .single();

        if (existing) {
            await supabase.from('user_inventory')
                .update({ quantity: existing.quantity + quantity })
                .eq('user_id', userId)
                .eq('item_id', itemId);
        } else {
            await supabase.from('user_inventory').insert({
                user_id: userId,
                item_id: itemId,
                quantity
            });
        }

        res.json({
            success: true,
            data: {
                message: `成功购买 ${item.name} x${quantity}`,
                item: { id: itemId, ...item },
                quantity,
                spent: totalPrice
            }
        });
    } catch (error) {
        res.status(500).json({ error: '购买失败' });
    }
});

// ==================== 4.2 社区任务系统 ====================

/**
 * 获取任务列表
 * GET /api/gamification/missions
 */
router.get('/missions', async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取用户任务进度
        const { data: userMissions } = await supabase
            .from('user_missions')
            .select('*')
            .eq('user_id', userId);

        const userMissionsMap = new Map(userMissions?.map(m => [m.mission_id, m]) || []);

        // 组装任务列表
        const missions = {
            daily: MISSION_CONFIG.daily.map(m => ({
                ...m,
                progress: userMissionsMap.get(m.id)?.progress || 0,
                completed: userMissionsMap.get(m.id)?.completed || false,
                completedAt: userMissionsMap.get(m.id)?.completed_at
            })),
            weekly: MISSION_CONFIG.weekly.map(m => ({
                ...m,
                progress: userMissionsMap.get(m.id)?.progress || 0,
                completed: userMissionsMap.get(m.id)?.completed || false,
                completedAt: userMissionsMap.get(m.id)?.completed_at
            })),
            achievement: MISSION_CONFIG.achievement.map(m => ({
                ...m,
                progress: userMissionsMap.get(m.id)?.progress || 0,
                completed: userMissionsMap.get(m.id)?.completed || false,
                completedAt: userMissionsMap.get(m.id)?.completed_at
            }))
        };

        res.json({
            success: true,
            data: { missions }
        });
    } catch (error) {
        res.status(500).json({ error: '获取任务失败' });
    }
});

/**
 * 领取任务奖励
 * POST /api/gamification/missions/:missionId/claim
 */
router.post('/missions/:missionId/claim', async (req, res) => {
    try {
        const userId = req.user.id;
        const { missionId } = req.params;

        // 查找任务配置
        let mission = [...MISSION_CONFIG.daily, ...MISSION_CONFIG.weekly, ...MISSION_CONFIG.achievement]
            .find(m => m.id === missionId);

        if (!mission) {
            return res.status(404).json({ error: '任务不存在' });
        }

        // 检查是否已完成且未领取
        const { data: userMission } = await supabase
            .from('user_missions')
            .select('*')
            .eq('user_id', userId)
            .eq('mission_id', missionId)
            .single();

        if (!userMission || !userMission.completed || userMission.claimed) {
            return res.status(400).json({ error: '任务未完成或已领取' });
        }

        // 发放奖励
        await supabase.rpc('add_user_coins', {
            user_id: userId,
            amount: mission.reward
        });

        // 标记已领取
        await supabase.from('user_missions')
            .update({ claimed: true, claimed_at: new Date() })
            .eq('id', userMission.id);

        res.json({
            success: true,
            data: {
                message: `领取成功！获得 ${mission.reward} 积分`,
                reward: mission.reward
            }
        });
    } catch (error) {
        res.status(500).json({ error: '领取失败' });
    }
});

/**
 * 更新任务进度（内部使用）
 * POST /api/gamification/missions/progress
 */
router.post('/missions/progress', [
    body('missionId').isString(),
    body('increment').isInt(),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { missionId, increment = 1 } = req.body;

        const mission = [...MISSION_CONFIG.daily, ...MISSION_CONFIG.weekly, ...MISSION_CONFIG.achievement]
            .find(m => m.id === missionId);

        if (!mission) {
            return res.status(404).json({ error: '任务不存在' });
        }

        const result = await updateMissionProgress(userId, mission, increment);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: '更新进度失败' });
    }
});

// ==================== 4.3 排行榜竞技 ====================

/**
 * 获取排行榜
 * GET /api/gamification/leaderboard/:type
 */
router.get('/leaderboard/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { period = 'weekly', page = 1, limit = 20 } = req.query;

        let data = [];

        switch (type) {
            case 'level':
                const { data: levelData } = await supabase
                    .from('users')
                    .select('id, username, avatar_url, level, exp')
                    .order('level', { ascending: false })
                    .order('exp', { ascending: false })
                    .limit(limit);
                data = levelData;
                break;

            case 'coins':
                const { data: coinData } = await supabase
                    .from('users')
                    .select('id, username, avatar_url, coins')
                    .order('coins', { ascending: false })
                    .limit(limit);
                data = coinData;
                break;

            case 'articles':
                const { data: articleData } = await supabase.rpc('get_article_leaderboard', {
                    limit_count: limit
                });
                data = articleData;
                break;

            case 'likes':
                const { data: likeData } = await supabase.rpc('get_like_leaderboard', {
                    limit_count: limit
                });
                data = likeData;
                break;

            case 'pet':
                const { data: petData } = await supabase
                    .from('user_pets')
                    .select(`
                        id,
                        name,
                        species,
                        level,
                        users:user_id (id, username, avatar_url)
                    `)
                    .order('level', { ascending: false })
                    .limit(limit);
                data = petData.map(p => ({
                    id: p.id,
                    name: p.name,
                    species: p.species,
                    level: p.level,
                    user: p.users
                }));
                break;

            case 'streak':
                const { data: streakData } = await supabase
                    .from('users')
                    .select('id, username, avatar_url, checkin_streak')
                    .order('checkin_streak', { ascending: false })
                    .limit(limit);
                data = streakData;
                break;
        }

        // 获取当前用户排名
        const userId = req.user?.id;
        let userRank = null;
        if (userId) {
            userRank = await getUserRank(userId, type);
        }

        res.json({
            success: true,
            data: {
                type,
                period,
                list: data.map((item, index) => ({
                    rank: index + 1,
                    ...item
                })),
                userRank
            }
        });
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: '获取排行榜失败' });
    }
});

/**
 * 获取竞技挑战
 * GET /api/gamification/challenges
 */
router.get('/challenges', async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取当前进行中的挑战
        const { data: activeChallenges } = await supabase
            .from('challenges')
            .select(`
                *,
                challenger:challenger_id (id, username, avatar_url),
                opponent:opponent_id (id, username, avatar_url)
            `)
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .eq('status', 'active');

        // 获取可发起的挑战类型
        const challengeTypes = [
            { id: 'article_count', name: '文章数量挑战', description: '一周内发布文章数量', metric: 'articles' },
            { id: 'like_count', name: '获赞数量挑战', description: '一周内获得点赞数', metric: 'likes' },
            { id: 'reading_time', name: '阅读时长挑战', description: '一周内累计阅读时间', metric: 'minutes' },
            { id: 'checkin_streak', name: '签到连胜挑战', description: '连续签到天数', metric: 'days' }
        ];

        res.json({
            success: true,
            data: {
                active: activeChallenges,
                availableTypes: challengeTypes
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取挑战失败' });
    }
});

/**
 * 发起挑战
 * POST /api/gamification/challenges
 */
router.post('/challenges', [
    body('opponentId').isInt(),
    body('type').isString(),
    body('duration').isIn([3, 7, 14]), // 天数
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { opponentId, type, duration = 7 } = req.body;

        if (opponentId === userId) {
            return res.status(400).json({ error: '不能挑战自己' });
        }

        const challenge = {
            id: uuidv4(),
            challenger_id: userId,
            opponent_id: opponentId,
            type,
            duration,
            status: 'pending',
            created_at: new Date(),
            end_at: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        };

        await supabase.from('challenges').insert(challenge);

        // 发送通知
        await supabase.from('notifications').insert({
            user_id: opponentId,
            type: 'challenge_request',
            title: '新的挑战！',
            content: `${req.user.username} 向你发起了挑战！`,
            data: { challengeId: challenge.id }
        });

        res.json({
            success: true,
            data: { challenge }
        });
    } catch (error) {
        res.status(500).json({ error: '发起挑战失败' });
    }
});

// ==================== 4.4 成就系统2.0 ====================

/**
 * 获取成就列表
 * GET /api/gamification/achievements
 */
router.get('/achievements', async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取所有成就
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*');

        // 获取用户已解锁成就
        const { data: userAchievements } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId);

        const unlockedMap = new Map(userAchievements?.map(a => [a.achievement_id, a]) || []);

        // 分类
        const categories = ['beginner', 'intermediate', 'advanced', 'expert', 'legendary'];
        const achievementsByCategory = {};

        categories.forEach(cat => {
            achievementsByCategory[cat] = allAchievements
                ?.filter(a => a.category === cat)
                .map(a => ({
                    ...a,
                    unlocked: unlockedMap.has(a.id),
                    unlockedAt: unlockedMap.get(a.id)?.unlocked_at,
                    progress: unlockedMap.get(a.id)?.progress || 0
                })) || [];
        });

        // 统计
        const total = allAchievements?.length || 0;
        const unlocked = userAchievements?.length || 0;

        res.json({
            success: true,
            data: {
                total,
                unlocked,
                progress: Math.round((unlocked / total) * 100),
                categories: achievementsByCategory
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取成就失败' });
    }
});

/**
 * 获取用户成就展示
 * GET /api/gamification/achievements/showcase
 */
router.get('/achievements/showcase', async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: showcase } = await supabase
            .from('user_achievement_showcase')
            .select(`
                *,
                achievement:achievement_id (*)
            `)
            .eq('user_id', userId)
            .order('position', { ascending: true });

        res.json({
            success: true,
            data: { showcase: showcase || [] }
        });
    } catch (error) {
        res.status(500).json({ error: '获取展示失败' });
    }
});

/**
 * 设置展示成就
 * POST /api/gamification/achievements/showcase
 */
router.post('/achievements/showcase', [
    body('achievementIds').isArray({ min: 1, max: 6 }),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { achievementIds } = req.body;

        // 验证成就已解锁
        const { data: unlocked } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId)
            .in('achievement_id', achievementIds);

        const unlockedIds = new Set(unlocked?.map(a => a.achievement_id) || []);
        
        if (!achievementIds.every(id => unlockedIds.has(id))) {
            return res.status(403).json({ error: '只能展示已解锁的成就' });
        }

        // 清除旧展示
        await supabase.from('user_achievement_showcase')
            .delete()
            .eq('user_id', userId);

        // 添加新展示
        const showcaseItems = achievementIds.map((id, index) => ({
            user_id: userId,
            achievement_id: id,
            position: index + 1
        }));

        await supabase.from('user_achievement_showcase').insert(showcaseItems);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '设置展示失败' });
    }
});

// ==================== 辅助函数 ====================

/**
 * 格式化宠物数据
 */
function formatPetData(pet) {
    const speciesConfig = PET_CONFIG.species[pet.species];
    const stage = PET_CONFIG.stages.find(s => pet.level >= s.minLevel) || PET_CONFIG.stages[0];
    const nextStage = PET_CONFIG.stages.find(s => pet.level < s.minLevel);
    
    const expForNextLevel = calculateExpForLevel(pet.level + 1);
    const expForCurrentLevel = calculateExpForLevel(pet.level);
    const levelProgress = ((pet.exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100;

    return {
        id: pet.id,
        name: pet.name,
        species: {
            id: pet.species,
            name: speciesConfig.name,
            emoji: stage.emoji || speciesConfig.emoji,
            traits: speciesConfig.traits
        },
        level: pet.level,
        stage: stage.name,
        nextStage: nextStage?.name,
        exp: pet.exp,
        expForNextLevel,
        levelProgress: Math.round(levelProgress),
        stats: {
            hunger: pet.hunger,
            happiness: pet.happiness,
            health: pet.health,
            hygiene: pet.hygiene,
            energy: pet.energy
        },
        totalFed: pet.total_fed,
        totalPlayed: pet.total_played,
        createdAt: pet.created_at,
        status: getPetStatus(pet)
    };
}

/**
 * 计算升级所需经验
 */
function calculateExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * 检查升级
 */
function checkLevelUp(pet) {
    let leveledUp = false;
    let newStage = false;
    const oldLevel = pet.level;

    while (pet.exp >= calculateExpForLevel(pet.level + 1)) {
        pet.level++;
        leveledUp = true;
    }

    // 检查是否进入新阶段
    const oldStage = PET_CONFIG.stages.findIndex(s => oldLevel >= s.minLevel);
    const newStageIndex = PET_CONFIG.stages.findIndex(s => pet.level >= s.minLevel);
    newStage = newStageIndex > oldStage;

    return { pet, leveledUp, newStage };
}

/**
 * 获取宠物状态
 */
function getPetStatus(pet) {
    if (pet.health < 30) return 'sick';
    if (pet.hunger < 20) return 'hungry';
    if (pet.happiness < 20) return 'sad';
    if (pet.energy < 10) return 'tired';
    if (pet.happiness > 80 && pet.hunger > 70) return 'happy';
    return 'normal';
}

/**
 * 更新宠物状态（随时间衰减）
 */
async function updatePetStatus(pet) {
    const now = new Date();
    const lastUpdate = new Date(pet.last_fed);
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursPassed > 1) {
        pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2);
        pet.happiness = Math.max(0, pet.happiness - hoursPassed * 1);
        pet.hygiene = Math.max(0, pet.hygiene - hoursPassed * 0.5);
        pet.energy = Math.min(100, pet.energy + hoursPassed * 5);

        await supabase.from('user_pets').update({
            hunger: pet.hunger,
            happiness: pet.happiness,
            hygiene: pet.hygiene,
            energy: pet.energy
        }).eq('id', pet.id);
    }

    return pet;
}

/**
 * 更新任务进度
 */
async function updateMissionProgress(userId, mission, increment = 1) {
    const { data: existing } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();

    let completed = false;

    if (existing) {
        // 检查是否需要重置（每日/每周任务）
        const needsReset = mission.type === 'daily' && 
            new Date(existing.updated_at).toDateString() !== new Date().toDateString();
        
        const newProgress = needsReset ? increment : existing.progress + increment;
        completed = mission.target && newProgress >= mission.target;

        await supabase.from('user_missions').update({
            progress: newProgress,
            completed: completed || existing.completed,
            completed_at: completed && !existing.completed ? new Date() : existing.completed_at,
            updated_at: new Date()
        }).eq('id', existing.id);

        return { progress: newProgress, completed, newlyCompleted: completed && !existing.completed };
    } else {
        completed = mission.target && increment >= mission.target;

        await supabase.from('user_missions').insert({
            user_id: userId,
            mission_id: mission.id,
            progress: increment,
            completed,
            completed_at: completed ? new Date() : null
        });

        return { progress: increment, completed, newlyCompleted: completed };
    }
}

/**
 * 检查并发放成就
 */
async function checkAndAwardAchievement(userId, achievementId) {
    const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

    if (existing) return;

    await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date()
    });

    // 获取成就信息
    const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

    if (achievement?.reward_coins) {
        await supabase.rpc('add_user_coins', {
            user_id: userId,
            amount: achievement.reward_coins
        });
    }
}

/**
 * 获取用户排名
 */
async function getUserRank(userId, type) {
    // 这里应该使用数据库查询获取实际排名
    return { rank: null, value: null };
}

module.exports = router;
