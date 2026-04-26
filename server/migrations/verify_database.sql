-- ============================================
-- 数据库功能验证脚本
-- 用于验证服务器各项功能是否正常运行
-- ============================================

-- 1. 验证基本连接和数据库信息
SELECT 
    '数据库连接正常' as status,
    DATABASE() as current_database,
    NOW() as server_time,
    VERSION() as mysql_version;

-- 2. 验证核心表是否存在并统计记录数
SELECT 
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables 
WHERE table_schema = DATABASE()
ORDER BY table_name;

-- 3. 验证用户系统
SELECT 
    '用户系统' as feature,
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_this_week,
    COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_this_week
FROM users;

-- 4. 验证文章系统
SELECT 
    '文章系统' as feature,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_articles_this_week
FROM articles;

-- 5. 验证问答悬赏系统 (Q&A)
SELECT 
    '问答悬赏系统' as feature,
    (SELECT COUNT(*) FROM qna_questions) as total_questions,
    (SELECT COUNT(*) FROM qna_answers) as total_answers,
    (SELECT COUNT(*) FROM qna_questions WHERE status = 'open' AND bounty_amount > 0) as open_bounty_questions;

-- 6. 验证话题圈子系统 (Groups)
SELECT 
    '话题圈子系统' as feature,
    (SELECT COUNT(*) FROM `groups`) as total_groups,
    (SELECT COUNT(*) FROM group_members) as total_members,
    (SELECT COUNT(*) FROM group_posts) as total_posts;

-- 7. 验证代币系统
SELECT 
    '代币系统' as feature,
    COUNT(*) as total_users_with_coins,
    SUM(balance) as total_coins_in_system,
    AVG(balance) as avg_balance_per_user
FROM user_coins;

-- 8. 验证评论系统
SELECT 
    '评论系统' as feature,
    COUNT(*) as total_comments,
    COUNT(DISTINCT article_id) as articles_with_comments
FROM comments;

-- 9. 验证数据库连接池状态（需要 PROCESS 权限）
-- 查看当前连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- 10. 验证最近的数据库错误日志（需要适当权限）
-- SHOW ENGINE INNODB STATUS;

-- 11. 测试写入功能（可选，会创建测试数据）
-- 取消注释以下代码进行写入测试：
/*
-- 测试写入
INSERT INTO test_connection (test_time, status) 
VALUES (NOW(), 'OK') 
ON DUPLICATE KEY UPDATE test_time = NOW();

-- 验证写入
SELECT * FROM test_connection ORDER BY test_time DESC LIMIT 1;
*/

-- ============================================
-- API 端点验证（通过外部工具或 curl 测试）
-- ============================================
-- 请在命令行执行以下测试：

-- 测试 1: 基础连通性
-- curl -I https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com/

-- 测试 2: CORS 预检请求
-- curl -X OPTIONS -H "Origin: https://mcock.cn" \
--   -H "Access-Control-Request-Method: GET" \
--   https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com/groups

-- 测试 3: GET 请求
-- curl -H "Origin: https://mcock.cn" \
--   https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com/groups

-- 测试 4: 检查响应头是否包含 CORS 相关头
-- curl -I -H "Origin: https://mcock.cn" \
--   https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com/groups \
--   | grep -i "access-control"
