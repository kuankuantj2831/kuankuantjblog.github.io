# Cloudflare 终极优化清单 (mcock.cn)

这份清单汇总了所有值得开启的 Cloudflare 免费功能，旨在提升您博客的速度、安全性和易用性。请登录 Cloudflare 控制台，按顺序逐一配置。

---

## 1. 🔒 SSL/TLS (安全传输)
*这是基础中的基础，确保网站安全且不报错。*

*   **SSL/TLS 模式**
    *   **位置**: SSL/TLS -> 概述 (Overview)
    *   **设置**: 选择 **Full (Strict)**
    *   *作用*: 配合 GitHub Pages 的证书，防止重定向循环。

*   **始终使用 HTTPS (Always Use HTTPS)**
    *   **位置**: SSL/TLS -> 边缘证书 (Edge Certificates)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 强制所有 `http` 访问自动跳转到安全的 `https`。

*   **自动 HTTPS 重写 (Automatic HTTPS Rewrites)**
    *   **位置**: SSL/TLS -> 边缘证书 (Edge Certificates)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 自动将页面内不安全的 http 图片/链接替换为 https，防止浏览器报"不安全"警告。

---

## 2. 🚀 速度优化 (Speed)
*让您的博客在全球范围内秒开。*

*   **自动压缩 (Auto Minify)**
    *   **位置**: 速度 (Speed) -> 优化 (Optimization) -> Content Optimization
    *   **设置**: 勾选 ✅ **HTML** | ✅ **CSS** | ✅ **JS**
    *   *作用*: 自动去除代码中的空格和注释，减小文件体积。

*   **Brotli 压缩**
    *   **位置**: 速度 (Speed) -> 优化 (Optimization) -> Content Optimization
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 比标准 Gzip 压缩效率更高，传输更快。

*   **Rocket Loader™ (火箭加载)**
    *   **位置**: 速度 (Speed) -> 优化 (Optimization) -> Content Optimization
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 优先加载网页内容（文本/图片），最后加载 JS 脚本，显著提升首屏显示速度。

---

## 3. 🛡️ 安全防护 (Security)
*拦截恶意爬虫和 AI 抓取。*

*   **阻止 AI 爬虫 (Block AI Scrapers)**
    *   **位置**: 安全性 (Security) -> 机器人 (Bots)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 一键拦截 ChatGPT, Claude 等 AI 抓取您的内容。

*   **浏览器完整性检查 (Browser Integrity Check)**
    *   **位置**: 安全性 (Security) -> 设置 (Settings)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 拦截那些伪装拙劣的恶意爬虫和脚本。

*   **安全级别 (Security Level)**
    *   **位置**: 安全性 (Security) -> 设置 (Settings)
    *   **设置**: 选择 **Medium (中)**
    *   *作用*: 平衡防护与用户体验，既拦截攻击又不误伤正常访客。

---

## 4. 🌐 网络 (Network)
*优化连接协议。*

*   **HTTP/3 (QUIC)**
    *   **位置**: 网络 (Network)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 使用最新的网络协议，连接速度更快，抗丢包能力更强。

*   **0-RTT 连接恢复**
    *   **位置**: 网络 (Network)
    *   **设置**: ✅ **开启 (On)**
    *   *作用*: 允许回头客更快地恢复连接。

---

## 5. 📊 数据统计 (Analytics)
*了解您的访客。*

*   **Web Analytics**
    *   **位置**: 左侧主菜单 -> Analytics & Logs -> Web Analytics
    *   **操作**: 点击 "Set up" (如果还没设置)，按照提示添加站点。
    *   *作用*: 免费、隐私友好的流量统计，无需在网页里加代码（Cloudflare 自动注入），可以看到真实访问量。

---

### ✅ 完成！
配置完以上选项后，您的博客 `mcock.cn` 就已经达到了企业级的优化标准！
