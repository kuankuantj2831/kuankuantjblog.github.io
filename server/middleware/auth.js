const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'secret') {
        console.error('FATAL: JWT_SECRET is not set or is using default value!');
        throw new Error('Server configuration error');
    }
    return secret;
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const secret = getJwtSecret();
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();
        });
    } catch (e) {
        return res.status(500).json({ message: 'Server configuration error' });
    }
};

const isAdmin = (req, res, next) => {
    // Ideally, we should check the DB to be sure, but for now let's rely on the token (if we add role to it)
    // OR fetch user from DB. Fetching from DB is safer.
    const { pool } = require('../db');

    pool.query('SELECT role FROM users WHERE id = ?', [req.userId])
        .then(([rows]) => {
            if (rows.length === 0 || rows[0].role !== 'admin') {
                return res.status(403).json({ message: 'Require Admin Role' });
            }
            next();
        })
        .catch(err => {
            console.error('Role check error:', err);
            res.status(500).json({ message: 'Server error' });
        });
};

module.exports = { verifyToken, isAdmin };
