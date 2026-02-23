const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendVerificationEmail = async (to, code, subject = '【Hakimi 的猫爬架】登录验证码') => {
    const isReset = subject.includes('重置');
    const title = isReset ? '密码重置验证' : 'Hakimi 的猫爬架安全验证';
    const actionText = isReset ? '重置密码操作' : '登录操作';

    const mailOptions = {
        from: '"Hakimi 的猫爬架" <mcockserver@163.com>',
        to: to,
        subject: subject,
        text: `您的验证码是：${code}。有效期5分钟，请勿泄露给他人。`,
        html: `<div style="padding: 20px; background-color: #f0f2f5; font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #1890ff; text-align: center;">${title}</h2>
                <p style="font-size: 16px; color: #333;">亲爱的用户：</p>
                <p style="font-size: 16px; color: #333;">您正在进行${actionText}，本次验证码为：</p>
                <div style="background-color: #f6f8fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1890ff; margin: 20px 0;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #666;">验证码有效期为 10 分钟。如果您没有进行此操作，请忽略此邮件。</p>
            </div>
        </div>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail };
