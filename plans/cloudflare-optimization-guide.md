# ☁️ Cloudflare 控制台优化配置指南

> 你的域名 `mcock.cn` 已经通过 Cloudflare 代理（IP: 104.21.38.23 / 172.67.218.9）
> 以下是需要在 Cloudflare 控制台中手动配置的优化项

## 📋 登录 Cloudflare

1. 访问 https://dash.cloudflare.com/
2. 登录你的账号
3. 选择域名 `mcock.cn`

---

## ⚡ 必做优化（免费计划可用）

### 1. 开启 Auto Minify（自动压缩）

**路径**: Speed → Optimization → Content Optimization

- [x] JavaScript — 自动压缩 JS 文件
- [x] CSS — 自动压缩 CSS 文件  
- [x] HTML — 自动压缩 HTML 文件

**效果**: 减少 10-20% 的文件体积

---

### 2. 开启 Brotli 压缩

**路径**: Speed → Optimization → Content Optimization

- [x] Brotli — 开启

**效果**: 比 gzip 压缩率高 15-25%，所有现代浏览器都支持

---

### 3. 配置 Browser Cache TTL（浏览器缓存时间）

**路径**: Caching → Configuration

- **Browser Cache TTL**: 设置为 **1 month**（1个月）

**效果**: 用户二次访问时，静态资源直接从浏览器缓存加载，零延迟

---

### 4. 开启 Always Online

**路径**: Caching → Configuration

- [x] Always Online — 开启

**效果**: 当 GitHub Pages 源站宕机时，Cloudflare 会显示缓存的页面版本

---

### 5. 配置 Caching Level

**路径**: Caching → Configuration

- **Caching Level**: 设置为 **Standard**

---

### 6. 开启 Early Hints

**路径**: Speed → Optimization → Content Optimization

- [x] Early Hints — 开启

**效果**: Cloudflare 会在 HTML 响应之前发送 103 Early Hints，让浏览器提前加载 CSS/JS

---

### 7. 开启 HTTP/2 和 HTTP/3

**路径**: Network

- [x] HTTP/2 — 确保开启
- [x] HTTP/3 (with QUIC) — 开启

**效果**: HTTP/2 多路复用减少连接数，HTTP/3 基于 UDP 进一步降低延迟

---

### 8. 开启 0-RTT Connection Resumption

**路径**: Network

- [x] 0-RTT Connection Resumption — 开启

**效果**: 回访用户的 TLS 握手从 1-RTT 降为 0-RTT，节省一个往返时间

---

## 🔧 Page Rules 配置（免费计划有 3 条规则）

**路径**: Rules → Page Rules

### 规则 1：静态资源长期缓存
```
URL: mcock.cn/css/*
设置:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
  - Edge Cache TTL: 1 month
```

### 规则 2：JS 文件长期缓存
```
URL: mcock.cn/js/*
设置:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
  - Edge Cache TTL: 1 month
```

### 规则 3：图片和字体长期缓存
```
URL: mcock.cn/images/*
设置:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
  - Edge Cache TTL: 1 month
```

---

## 🌏 针对中国用户的特别说明

### Cloudflare 在中国的情况

Cloudflare 免费计划**没有中国大陆节点**，但有以下优势：
- **亚太节点**（日本、新加坡、香港）比美国 GitHub Pages 更近
- **Anycast 网络**自动路由到最近的节点
- **缓存**减少回源请求

### 如果需要更好的中国访问速度

考虑以下方案（第三阶段）：
1. **Cloudflare Enterprise**（企业版有中国节点，但价格高）
2. **腾讯云 CDN** 加速静态资源（你已有腾讯云账号）
3. **将大文件迁移到腾讯云 COS**（视频、大图片）

---

## ✅ 配置检查清单

完成以上配置后，可以用以下工具验证：

1. **Cloudflare 缓存状态**: 打开浏览器开发者工具 → Network → 查看响应头中的 `cf-cache-status`
   - `HIT` = 命中 Cloudflare 缓存 ✅
   - `MISS` = 未命中，回源获取
   - `DYNAMIC` = 动态内容，不缓存

2. **压缩验证**: 查看响应头中的 `content-encoding`
   - `br` = Brotli 压缩 ✅
   - `gzip` = gzip 压缩

3. **HTTP 版本**: 查看 Protocol 列
   - `h2` = HTTP/2 ✅
   - `h3` = HTTP/3 ✅

4. **在线测试工具**:
   - https://www.webpagetest.org/ （选择中国节点测试）
   - https://gtmetrix.com/
   - https://pagespeed.web.dev/

---

## 📊 预期效果

| 优化项 | 预期提升 |
|--------|---------|
| Auto Minify | 文件体积减少 10-20% |
| Brotli 压缩 | 传输体积减少 60-80% |
| Browser Cache | 二次访问零延迟 |
| Early Hints | 首次渲染提前 100-200ms |
| HTTP/3 | 连接建立时间减少 30-50% |
| Page Rules 缓存 | 静态资源命中率 >90% |
| **综合效果** | **中国用户访问速度提升 40-60%** |
