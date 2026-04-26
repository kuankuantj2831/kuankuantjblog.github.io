/**
 * GitHub OAuth 登录路由
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// GitHub OAuth 配置
const GITHUB_CONFIG = {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'https://mcock.cn/auth/github/callback'
};

/**
 * GitHub OAuth 回调处理
 * POST /auth/github/callback
 */
router.post('/callback', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: '缺少授权码'
            });
        }

        // 1. 使用 code 换取 access_token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CONFIG.clientId,
                client_secret: GITHUB_CONFIG.clientSecret,
                code: code,
                redirect_uri: GITHUB_CONFIG.redirectUri
            },
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const { access_token, error, error_description } = tokenResponse.data;

        if (error) {
            return res.status(400).json({
                success: false,
                message: error_description || 'GitHub 授权失败'
            });
        }

        // 2. 获取 GitHub 用户信息
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'User-Agent': 'Hakimi-Blog'
            }
        });

        const githubUser = userResponse.data;

        // 3. 获取用户邮箱
        let email = githubUser.email;
        if (!email) {
            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'User-Agent': 'Hakimi-Blog'
                }
            });
            
            // 找到主要的邮箱
            const primaryEmail = emailResponse.data.find(e => e.primary);
            if (primaryEmail) {
                email = primaryEmail.email;
            } else if (emailResponse.data.length > 0) {
                email = emailResponse.data[0].email;
            }
        }

        // 4. 查找或创建用户
        const user = await findOrCreateUser({
            githubId: githubUser.id,
            username: githubUser.login,
            nickname: githubUser.name || githubUser.login,
            email: email,
            avatar: githubUser.avatar_url,
            bio: githubUser.bio
        });

        // 5. 生成 JWT
        const token = generateJWT(user);

        // 6. 返回登录结果
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    email: user.email,
                    avatar: user.avatar,
                    loginType: 'github'
                }
            }
        });

    } catch (error) {
        console.error('GitHub OAuth Error:', error);
        res.status(500).json({
            success: false,
            message: 'GitHub 登录失败: ' + (error.message || '未知错误')
        });
    }
});

/**
 * 查找或创建用户
 */
async function findOrCreateUser(githubData) {
    const connection = await pool.getConnection();
    
    try {
        // 使用 openid 字段存储 GitHub ID
        // 查找是否已存在该 GitHub 用户
        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE openid = ? AND login_type = ?',
            [githubData.githubId.toString(), 'github']
        );

        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            
            // 更新用户信息
            await connection.execute(
                `UPDATE users SET
                    nickname = ?,
                    email = ?,
                    avatar = ?,
                    updated_at = NOW()
                WHERE id = ?`,
                [githubData.nickname, githubData.email, githubData.avatar, user.id]
            );

            return {
                id: user.id,
                username: user.username,
                nickname: githubData.nickname,
                email: githubData.email,
                avatar: githubData.avatar
            };
        }

        // 创建新用户
        const userId = 'github_' + githubData.githubId;
        const username = await generateUniqueUsername(githubData.username);

        await connection.execute(
            `INSERT INTO users (
                id, username, nickname, email, avatar,
                openid, login_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'github', NOW(), NOW())`,
            [
                userId,
                username,
                githubData.nickname,
                githubData.email,
                githubData.avatar,
                githubData.githubId.toString()
            ]
        );

        return {
            id: userId,
            username: username,
            nickname: githubData.nickname,
            email: githubData.email,
            avatar: githubData.avatar
        };

    } finally {
        connection.release();
    }
}

/**
 * 生成唯一用户名
 */
async function generateUniqueUsername(baseUsername) {
    let username = baseUsername;
    let suffix = 1;
    
    const connection = await pool.getConnection();
    
    try {
        while (true) {
            const [users] = await connection.execute(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );
            
            if (users.length === 0) {
                return username;
            }
            
            username = `${baseUsername}_${suffix}`;
            suffix++;
        }
    } finally {
        connection.release();
    }
}

/**
 * 生成 JWT
 */
function generateJWT(user) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            loginType: 'github'
        },
        secret,
        { expiresIn: '7d' }
    );
}

module.exports = router;
