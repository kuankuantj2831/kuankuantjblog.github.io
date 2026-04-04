/**
 * k6 性能测试脚本
 * 负载测试和压测
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// 测试配置
export const options = {
    stages: [
        { duration: '2m', target: 100 },  // 逐步增加到100用户
        { duration: '5m', target: 100 },  // 保持100用户5分钟
        { duration: '2m', target: 200 },  // 增加到200用户
        { duration: '5m', target: 200 },  // 保持200用户5分钟
        { duration: '2m', target: 0 },    // 逐步减少
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95%的请求响应时间<500ms
        http_req_failed: ['rate<0.01'],     // 错误率<1%
        errors: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://mcock.cn';

export function setup() {
    console.log(`Starting load test against ${BASE_URL}`);
    return { baseUrl: BASE_URL };
}

export default function (data) {
    const baseUrl = data.baseUrl;

    group('首页访问', () => {
        const response = http.get(`${baseUrl}/`);
        const success = check(response, {
            '首页状态码为200': (r) => r.status === 200,
            '首页响应时间<500ms': (r) => r.timings.duration < 500,
        });
        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
    });

    sleep(1);

    group('文章列表', () => {
        const response = http.get(`${baseUrl}/api/articles?page=1&limit=10`);
        const success = check(response, {
            '文章列表状态码为200': (r) => r.status === 200,
            '文章列表响应时间<300ms': (r) => r.timings.duration < 300,
        });
        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
    });

    sleep(1);

    group('搜索功能', () => {
        const searchTerms = ['javascript', 'python', 'react', 'vue', 'node'];
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const response = http.get(`${baseUrl}/api/search?q=${term}`);
        const success = check(response, {
            '搜索状态码为200': (r) => r.status === 200,
            '搜索响应时间<400ms': (r) => r.timings.duration < 400,
        });
        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
    });

    sleep(2);
}

export function teardown(data) {
    console.log('Load test completed');
}
