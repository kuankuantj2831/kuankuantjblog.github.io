/**
 * 本地开发代理服务器
 * 解决本地测试时访问腾讯云SCF的CORS问题
 * 
 * 用法：node proxy.js
 * 然后访问 http://localhost:9000
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const TARGET = '1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
const PORT = 9000;
const STATIC_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API代理请求（以/api开头或特定路径）
    if (pathname.startsWith('/articles') || 
        pathname.startsWith('/auth') || 
        pathname.startsWith('/users') || 
        pathname.startsWith('/comments') || 
        pathname.startsWith('/coins') || 
        pathname.startsWith('/profiles') || 
        pathname.startsWith('/wechat') || 
        pathname.startsWith('/badges') || 
        pathname.startsWith('/shop') || 
        pathname.startsWith('/tasks') || 
        pathname.startsWith('/notifications') || 
        pathname.startsWith('/reading') || 
        pathname.startsWith('/upload') || 
        pathname.startsWith('/messages') || 
        pathname.startsWith('/reputation') || 
        pathname.startsWith('/analytics') || 
        pathname.startsWith('/follow') || 
        pathname.startsWith('/favorite') || 
        pathname.startsWith('/ip-security') || 
        pathname.startsWith('/search') || 
        pathname.startsWith('/tags') || 
        pathname.startsWith('/categories') || 
        pathname.startsWith('/online') || 
        pathname.startsWith('/level') || 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/payments') || 
        pathname.startsWith('/donate')) {
        
        proxyToTencent(req, res, pathname + (parsedUrl.search || ''));
        return;
    }

    // 静态文件服务
    let filePath = path.join(STATIC_DIR, pathname);
    if (pathname === '/') {
        filePath = path.join(STATIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 尝试回退到index.html（SPA支持）
                fs.readFile(path.join(STATIC_DIR, 'index.html'), (err2, content2) => {
                    if (err2) {
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content2);
                    }
                });
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

function proxyToTencent(req, res, targetPath) {
    const options = {
        hostname: TARGET,
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            ...req.headers,
            host: TARGET,
            origin: `https://${TARGET}`,
            referer: `https://${TARGET}/`
        }
    };

    delete options.headers['accept-encoding']; // 避免gzip压缩

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        res.writeHead(502);
        res.end(JSON.stringify({ message: 'Proxy error: ' + err.message }));
    });

    req.pipe(proxyReq);
}

server.listen(PORT, () => {
    console.log(`================================`);
    console.log(`🚀 本地代理服务器已启动`);
    console.log(`📍 访问地址: http://localhost:${PORT}`);
    console.log(`🔄 API代理目标: https://${TARGET}`);
    console.log(`================================`);
    console.log(`按 Ctrl+C 停止服务器`);
});
