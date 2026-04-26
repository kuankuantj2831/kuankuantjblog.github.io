/**
 * JWT工具函数
 */

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'secret') {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
};

module.exports = {
    getJwtSecret
};
