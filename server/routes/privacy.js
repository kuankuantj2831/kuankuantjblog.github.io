/**
 * 隐私设置与数据保护路由
 * Privacy Settings & Data Protection Routes
 */
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// 认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// 1. 获取用户隐私设置
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [rows] = await pool.execute(
            'SELECT * FROM user_privacy_settings WHERE user_id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            // 创建默认设置
            await pool.execute(
                'INSERT INTO user_privacy_settings (user_id) VALUES (?)',
                [userId]
            );
            
            const [newSettings] = await pool.execute(
                'SELECT * FROM user_privacy_settings WHERE user_id = ?',
                [userId]
            );
            
            return res.json({
                success: true,
                data: newSettings[0]
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Get privacy settings error:', error);
        res.status(500).json({ message: 'Failed to get privacy settings' });
    }
});

// 2. 更新隐私设置
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            profileVisibility,
            showOnlineStatus,
            showLastSeen,
            allowSearchByEmail,
            allowTagging,
            dataRetentionDays,
            autoDeleteInactive
        } = req.body;
        
        const updates = [];
        const values = [];
        
        if (profileVisibility !== undefined) {
            updates.push('profile_visibility = ?');
            values.push(profileVisibility);
        }
        if (showOnlineStatus !== undefined) {
            updates.push('show_online_status = ?');
            values.push(showOnlineStatus);
        }
        if (showLastSeen !== undefined) {
            updates.push('show_last_seen = ?');
            values.push(showLastSeen);
        }
        if (allowSearchByEmail !== undefined) {
            updates.push('allow_search_by_email = ?');
            values.push(allowSearchByEmail);
        }
        if (allowTagging !== undefined) {
            updates.push('allow_tagging = ?');
            values.push(allowTagging);
        }
        if (dataRetentionDays !== undefined) {
            updates.push('data_retention_days = ?');
            values.push(dataRetentionDays);
        }
        if (autoDeleteInactive !== undefined) {
            updates.push('auto_delete_inactive = ?');
            values.push(autoDeleteInactive);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(userId);
        
        await pool.execute(
            `UPDATE user_privacy_settings SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );
        
        res.json({
            success: true,
            message: 'Privacy settings updated'
        });
    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({ message: 'Failed to update privacy settings' });
    }
});

// 3. GDPR 数据导出请求
router.post('/export-data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 检查是否已经请求过
        const [existing] = await pool.execute(
            'SELECT gdpr_export_requested, gdpr_export_completed_at FROM user_privacy_settings WHERE user_id = ?',
            [userId]
        );
        
        if (existing.length > 0 && existing[0].gdpr_export_requested && !existing[0].gdpr_export_completed_at) {
            return res.status(400).json({ message: 'Export already requested, please wait' });
        }
        
        // 标记导出请求
        await pool.execute(
            `UPDATE user_privacy_settings 
             SET gdpr_export_requested = TRUE, gdpr_export_completed_at = NULL 
             WHERE user_id = ?`,
            [userId]
        );
        
        // 异步导出数据（实际项目中应该使用队列）
        exportUserData(userId);
        
        res.json({
            success: true,
            message: 'Data export requested. You will receive an email when ready.'
        });
    } catch (error) {
        console.error('Export data request error:', error);
        res.status(500).json({ message: 'Failed to request data export' });
    }
});

// 4. GDPR 数据删除请求
router.post('/delete-data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, reason } = req.body;
        
        // 验证密码
        const [users] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(password, users[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        
        // 标记删除请求（30天后执行）
        await pool.execute(
            `UPDATE user_privacy_settings 
             SET gdpr_deletion_requested = TRUE, gdpr_deletion_scheduled_at = DATE_ADD(NOW(), INTERVAL 30 DAY) 
             WHERE user_id = ?`,
            [userId]
        );
        
        // 记录删除请求
        await pool.execute(
            `INSERT INTO security_audit_logs (user_id, action, category, details, status) 
             VALUES (?, 'GDPR_DELETION_REQUESTED', 'data', ?, 'success')`,
            [userId, JSON.stringify({ reason, scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })]
        );
        
        res.json({
            success: true,
            message: 'Account deletion scheduled. Your account will be deleted in 30 days. You can cancel this within 30 days.'
        });
    } catch (error) {
        console.error('Delete data request error:', error);
        res.status(500).json({ message: 'Failed to request data deletion' });
    }
});

// 5. 取消数据删除请求
router.post('/cancel-deletion', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        await pool.execute(
            `UPDATE user_privacy_settings 
             SET gdpr_deletion_requested = FALSE, gdpr_deletion_scheduled_at = NULL 
             WHERE user_id = ?`,
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Account deletion cancelled'
        });
    } catch (error) {
        console.error('Cancel deletion error:', error);
        res.status(500).json({ message: 'Failed to cancel deletion' });
    }
});

// 6. 获取用户数据概览（用于导出）
router.get('/data-overview', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 统计各类数据
        const stats = await Promise.all([
            pool.execute('SELECT COUNT(*) as count FROM articles WHERE author_id = ?', [userId]),
            pool.execute('SELECT COUNT(*) as count FROM comments WHERE author_id = ?', [userId]),
            pool.execute('SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?', [userId]),
            pool.execute('SELECT COUNT(*) as count FROM security_audit_logs WHERE user_id = ?', [userId]),
            pool.execute('SELECT COUNT(*) as count FROM encrypted_messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]),
            pool.execute('SELECT balance FROM user_coins WHERE user_id = ?', [userId])
        ]);
        
        res.json({
            success: true,
            data: {
                articles: stats[0][0][0].count,
                comments: stats[1][0][0].count,
                sessions: stats[2][0][0].count,
                securityLogs: stats[3][0][0].count,
                messages: stats[4][0][0].count,
                coins: stats[5][0][0]?.balance || 0
            }
        });
    } catch (error) {
        console.error('Get data overview error:', error);
        res.status(500).json({ message: 'Failed to get data overview' });
    }
});

// 7. 异步导出用户数据
async function exportUserData(userId) {
    try {
        // 收集用户所有数据
        const data = {
            profile: null,
            articles: [],
            comments: [],
            sessions: [],
            securityLogs: [],
            privacySettings: null
        };
        
        // 获取用户信息
        const [users] = await pool.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (users.length > 0) data.profile = users[0];
        
        // 获取文章
        const [articles] = await pool.execute(
            'SELECT * FROM articles WHERE author_id = ?',
            [userId]
        );
        data.articles = articles;
        
        // 获取评论
        const [comments] = await pool.execute(
            'SELECT * FROM comments WHERE author_id = ?',
            [userId]
        );
        data.comments = comments;
        
        // 获取隐私设置
        const [privacy] = await pool.execute(
            'SELECT * FROM user_privacy_settings WHERE user_id = ?',
            [userId]
        );
        if (privacy.length > 0) data.privacySettings = privacy[0];
        
        // 标记导出完成
        await pool.execute(
            `UPDATE user_privacy_settings 
             SET gdpr_export_completed_at = NOW() 
             WHERE user_id = ?`,
            [userId]
        );
        
        // TODO: 发送邮件通知用户下载数据
        console.log(`User ${userId} data export completed`);
        
    } catch (err) {
        console.error('Export user data error:', err);
    }
}

// 8. 隐私模式切换
router.post('/privacy-mode', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { enabled } = req.body;
        
        // 隐私模式可以存储在会话或临时存储中
        // 这里我们使用一个临时标志
        await pool.execute(
            `INSERT INTO security_audit_logs (user_id, action, category, details, status) 
             VALUES (?, ?, 'privacy', ?, 'success')`,
            [userId, enabled ? 'PRIVACY_MODE_ENABLED' : 'PRIVACY_MODE_DISABLED', JSON.stringify({ enabled })]
        );
        
        res.json({
            success: true,
            message: enabled ? 'Privacy mode enabled' : 'Privacy mode disabled',
            data: { privacyMode: enabled }
        });
    } catch (error) {
        console.error('Privacy mode toggle error:', error);
        res.status(500).json({ message: 'Failed to toggle privacy mode' });
    }
});

// 9. 获取数据保留政策
router.get('/retention-policy', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                inactiveAccountDays: 365,
                deletedDataRetentionDays: 30,
                securityLogRetentionDays: 90,
                sessionRetentionDays: 30,
                backupRetentionDays: 90,
                description: '我们遵循 GDPR 和行业标准的数据保留政策。不活跃账户数据将在1年后匿名化，删除的数据将保留30天后永久删除。'
            }
        });
    } catch (error) {
        console.error('Get retention policy error:', error);
        res.status(500).json({ message: 'Failed to get retention policy' });
    }
});

module.exports = router;
