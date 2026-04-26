/**
 * 安全审计日志路由
 * Security Audit Logs Routes
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

// 管理员权限检查
const requireAdmin = async (req, res, next) => {
    try {
        const [rows] = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0 || rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Failed to check admin status' });
    }
};

// 1. 记录安全事件（内部使用）
async function logSecurityEvent(userId, action, category, details, status = 'success', riskLevel = 'low', req) {
    try {
        const ip = req?.ip || req?.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req?.headers['user-agent'] || 'unknown';
        
        await pool.execute(
            `INSERT INTO security_audit_logs 
            (user_id, action, category, ip_address, user_agent, details, status, risk_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, category, ip, userAgent, JSON.stringify(details), status, riskLevel]
        );
    } catch (err) {
        console.error('Failed to log security event:', err);
    }
}

// 2. 获取当前用户的安全审计日志
router.get('/my-logs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, category, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM security_audit_logs WHERE user_id = ?';
        const params = [userId];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [logs] = await pool.execute(query, params);
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM security_audit_logs WHERE user_id = ?';
        const countParams = [userId];
        
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        
        const [countResult] = await pool.execute(countQuery, countParams);
        
        res.json({
            success: true,
            data: {
                logs: logs.map(log => ({
                    ...log,
                    details: log.details ? JSON.parse(log.details) : null
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get my security logs error:', error);
        res.status(500).json({ message: 'Failed to get security logs' });
    }
});

// 3. 获取安全概览统计
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取最近7天的安全统计
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_events,
                COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_events,
                COUNT(CASE WHEN risk_level IN ('high', 'critical') THEN 1 END) as high_risk_events,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as events_24h
            FROM security_audit_logs 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [userId]
        );
        
        // 获取最近的安全事件
        const [recentEvents] = await pool.execute(
            `SELECT action, category, status, risk_level, created_at 
            FROM security_audit_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5`,
            [userId]
        );
        
        // 获取登录统计
        const [loginStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_logins,
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_logins
            FROM security_audit_logs 
            WHERE user_id = ? AND action LIKE '%LOGIN%' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [userId]
        );
        
        res.json({
            success: true,
            data: {
                stats: stats[0],
                recentEvents,
                loginStats: loginStats[0]
            }
        });
    } catch (error) {
        console.error('Get security overview error:', error);
        res.status(500).json({ message: 'Failed to get security overview' });
    }
});

// 4. 管理员：获取所有安全审计日志
router.get('/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, userId, category, riskLevel, status, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM security_audit_logs WHERE 1=1';
        const params = [];
        
        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (riskLevel) {
            query += ' AND risk_level = ?';
            params.push(riskLevel);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (startDate) {
            query += ' AND created_at >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND created_at <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [logs] = await pool.execute(query, params);
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM security_audit_logs WHERE 1=1';
        const countParams = [];
        
        if (userId) {
            countQuery += ' AND user_id = ?';
            countParams.push(userId);
        }
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        if (riskLevel) {
            countQuery += ' AND risk_level = ?';
            countParams.push(riskLevel);
        }
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (startDate) {
            countQuery += ' AND created_at >= ?';
            countParams.push(startDate);
        }
        if (endDate) {
            countQuery += ' AND created_at <= ?';
            countParams.push(endDate);
        }
        
        const [countResult] = await pool.execute(countQuery, countParams);
        
        res.json({
            success: true,
            data: {
                logs: logs.map(log => ({
                    ...log,
                    details: log.details ? JSON.parse(log.details) : null
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get admin security logs error:', error);
        res.status(500).json({ message: 'Failed to get security logs' });
    }
});

// 5. 管理员：获取安全统计报表
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        // 总体统计
        const [overallStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT user_id) as affected_users,
                COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_events,
                COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_events,
                COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_events
            FROM security_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [parseInt(days)]
        );
        
        // 按类别统计
        const [categoryStats] = await pool.execute(
            `SELECT 
                category,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'failure' THEN 1 END) as failures
            FROM security_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY category`,
            [parseInt(days)]
        );
        
        // 按风险等级统计
        const [riskStats] = await pool.execute(
            `SELECT 
                risk_level,
                COUNT(*) as count
            FROM security_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY risk_level`,
            [parseInt(days)]
        );
        
        // 最近的高风险事件
        const [highRiskEvents] = await pool.execute(
            `SELECT sal.*, u.username 
            FROM security_audit_logs sal
            LEFT JOIN users u ON sal.user_id = u.id
            WHERE sal.risk_level IN ('high', 'critical')
            AND sal.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY sal.created_at DESC
            LIMIT 10`,
            [parseInt(days)]
        );
        
        res.json({
            success: true,
            data: {
                overall: overallStats[0],
                byCategory: categoryStats,
                byRiskLevel: riskStats,
                highRiskEvents: highRiskEvents.map(e => ({
                    ...e,
                    details: e.details ? JSON.parse(e.details) : null
                }))
            }
        });
    } catch (error) {
        console.error('Get security statistics error:', error);
        res.status(500).json({ message: 'Failed to get security statistics' });
    }
});

// 6. 创建安全告警
router.post('/admin/alerts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, alertType, severity, title, description, details } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO security_alerts 
            (user_id, alert_type, severity, title, description, details) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, alertType, severity, title, description, JSON.stringify(details)]
        );
        
        await logSecurityEvent(userId, 'SECURITY_ALERT_CREATED', 'security', 
            { alertId: result.insertId, severity }, 'success', severity, req);
        
        res.json({
            success: true,
            message: 'Security alert created',
            data: { alertId: result.insertId }
        });
    } catch (error) {
        console.error('Create security alert error:', error);
        res.status(500).json({ message: 'Failed to create security alert' });
    }
});

// 7. 获取安全告警列表
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, isResolved } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM security_alerts WHERE user_id = ?';
        const params = [userId];
        
        if (isResolved !== undefined) {
            query += ' AND is_resolved = ?';
            params.push(isResolved === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [alerts] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: {
                alerts: alerts.map(alert => ({
                    ...alert,
                    details: alert.details ? JSON.parse(alert.details) : null
                }))
            }
        });
    } catch (error) {
        console.error('Get security alerts error:', error);
        res.status(500).json({ message: 'Failed to get security alerts' });
    }
});

// 8. 标记告警为已解决
router.patch('/alerts/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute(
            `UPDATE security_alerts 
             SET is_resolved = TRUE, resolved_at = NOW(), resolved_by = ? 
             WHERE id = ?`,
            [req.user.id, id]
        );
        
        res.json({
            success: true,
            message: 'Alert resolved'
        });
    } catch (error) {
        console.error('Resolve security alert error:', error);
        res.status(500).json({ message: 'Failed to resolve alert' });
    }
});

// 9. 检测可疑活动（自动安全检查）
async function detectSuspiciousActivity(userId, action, req) {
    try {
        // 检查短时间内多次登录失败
        if (action.includes('LOGIN') && action.includes('FAILURE')) {
            const [recentFailures] = await pool.execute(
                `SELECT COUNT(*) as count 
                FROM security_audit_logs 
                WHERE user_id = ? 
                AND action LIKE '%LOGIN%' 
                AND status = 'failure'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
                [userId]
            );
            
            if (recentFailures[0].count >= 5) {
                // 创建安全告警
                await pool.execute(
                    `INSERT INTO security_alerts 
                    (user_id, alert_type, severity, title, description) 
                    VALUES (?, 'MULTIPLE_LOGIN_FAILURES', 'high', '多次登录失败', '检测到短时间内多次登录失败，可能存在暴力破解攻击')`,
                    [userId]
                );
            }
        }
        
        // 检查异地登录
        const [recentLogins] = await pool.execute(
            `SELECT DISTINCT ip_address 
            FROM security_audit_logs 
            WHERE user_id = ? 
            AND action = 'LOGIN_SUCCESS'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userId]
        );
        
        if (recentLogins.length > 3) {
            await pool.execute(
                `INSERT INTO security_alerts 
                (user_id, alert_type, severity, title, description) 
                VALUES (?, 'MULTIPLE_IP_LOGIN', 'medium', '多IP登录', '检测到从多个不同IP地址登录')`,
                [userId]
            );
        }
    } catch (err) {
        console.error('Detect suspicious activity error:', err);
    }
}

module.exports = { router, logSecurityEvent, detectSuspiciousActivity };
