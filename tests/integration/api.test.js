/**
 * API 集成测试
 */

const request = require('supertest');
const app = require('../../server/app');

// 测试数据
const testUser = {
    email: 'test@example.com',
    password: 'Test123456',
    username: 'testuser'
};

let authToken;
let testArticleId;

describe('API 集成测试', () => {
    // 在所有测试前执行
    beforeAll(async () => {
        // 登录获取token
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        authToken = res.body.token;
    });

    // 在所有测试后执行
    afterAll(async () => {
        // 清理测试数据
        if (testArticleId) {
            await request(app)
                .delete(`/articles/${testArticleId}`)
                .set('Authorization', `Bearer ${authToken}`);
        }
    });

    describe('认证模块', () => {
        test('POST /auth/login - 正常登录', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
        });

        test('POST /auth/login - 错误密码', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('message');
        });

        test('POST /auth/login - 用户不存在', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('文章模块', () => {
        test('POST /articles - 创建文章', async () => {
            const res = await request(app)
                .post('/articles')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: '测试文章',
                    content: '这是测试内容',
                    category: '技术',
                    tags: ['test', 'api']
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            testArticleId = res.body.id;
        });

        test('GET /articles - 获取文章列表', async () => {
            const res = await request(app)
                .get('/articles?page=1&limit=10');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('articles');
            expect(Array.isArray(res.body.articles)).toBe(true);
        });

        test('GET /articles/:id - 获取文章详情', async () => {
            const res = await request(app)
                .get(`/articles/${testArticleId}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', testArticleId);
        });

        test('PUT /articles/:id - 更新文章', async () => {
            const res = await request(app)
                .put(`/articles/${testArticleId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: '更新后的标题'
                });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('更新后的标题');
        });
    });

    describe('用户模块', () => {
        test('GET /profiles/me - 获取当前用户信息', async () => {
            const res = await request(app)
                .get('/profiles/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', testUser.email);
        });

        test('PUT /profiles/me - 更新用户信息', async () => {
            const res = await request(app)
                .put('/profiles/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    nickname: '新昵称',
                    bio: '个人简介'
                });

            expect(res.status).toBe(200);
            expect(res.body.nickname).toBe('新昵称');
        });
    });

    describe('搜索模块', () => {
        test('GET /search - 搜索文章', async () => {
            const res = await request(app)
                .get('/search?q=测试');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('results');
        });
    });
});
