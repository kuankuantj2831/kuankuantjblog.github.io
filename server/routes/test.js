const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { sendVerificationEmail } = require('../utils/email');

// Send Test Code
router.post('/send', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: '请输入接收邮箱' });

        console.log(`Test 2FA: Sending to ${email}`);

        // Try to find user "kuankuantj" (admin) to attach the code to
        let [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['kuankuantj']);

        let userId;

        if (users.length === 0) {
            [users] = await pool.query('SELECT * FROM users LIMIT 1');
            if (users.length === 0) {
                return res.status(404).json({ message: '数据库没有用户，无法生成关联验证码。请先注册一个用户。' });
            }
            userId = users[0].id;
        } else {
            userId = users[0].id;
            if (users[0].email !== email) {
                await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
            }
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Use DATE_ADD(NOW(), INTERVAL 10 MINUTE) to ensure expiry is relative to DB time
        await pool.query(
            'INSERT INTO verification_codes (user_id, code, expires_at, type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)',
            [userId, code, 'test_2fa']
        );

        console.log(`Test 2FA: Generated code ${code} for user ${userId}`);

        const sent = await sendVerificationEmail(email, code);

        if (sent) {
            res.json({ success: true, message: `验证码已发送至 ${email}，请查收` });
        } else {
            res.status(500).json({ success: false, message: 'Nodemailer 发送失败' });
        }

    } catch (e) {
        console.error('Test 2FA Error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Verify Test Code
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;

        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const userId = users[0].id;

        // DEBUG Query: Get the record and check times explicitly
        const [rows] = await pool.query(
            `SELECT *, NOW() as db_now, (expires_at > NOW()) as is_valid 
             FROM verification_codes 
             WHERE user_id = ? AND type = ? 
             ORDER BY created_at DESC LIMIT 1`,
            [userId, 'test_2fa']
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: '未找到任何验证码记录，请重新发送' });
        }

        const record = rows[0];
        console.log('Verify Debug Record:', record);

        if (record.code !== code) {
            return res.status(400).json({ success: false, message: `验证码错误` });
        }

        // Check validity based on DB calculation
        if (record.is_valid === 0) {
            return res.status(400).json({
                success: false,
                message: `验证码已过期! (DB Time: ${record.db_now}, Expires: ${record.expires_at})`
            });
        }

        // Success - Delete used code
        await pool.query('DELETE FROM verification_codes WHERE id = ?', [record.id]);

        res.json({ success: true, message: '🎉 验证成功！DB时区校验通过。' });

    } catch (e) {
        console.error('Verify Error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
