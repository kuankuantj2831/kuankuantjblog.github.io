# Cloudflare 配置指南 (mcock.cn)

这是为您准备的 Cloudflare 配置详细步骤。使用 Cloudflare 可以提供免费的 SSL 证书（HTTPS）、CDN 加速和安全防护。

## 第一阶段：在 Cloudflare 添加站点

1.  **注册/登录**：访问 [Cloudflare官网](https://www.cloudflare.com/zh-cn/) 并登录账号。
2.  **添加站点**：
    *   点击右上角的 **"添加站点" (Add a site)**。
    *   输入您的域名：`mcock.cn`。
    *   点击 **"继续" (Continue)**。
3.  **选择套餐**：
    *   向下滚动，选择底部的 **"Free" (免费版)** 套餐。
    *   点击 **"继续" (Continue)**。
4.  **DNS 记录审查**：
    *   Cloudflare 会自动扫描您现有的 DNS 记录。
    *   如果您的博客还没有部署（目前还在本地），这里可以先直接点击 **"继续" (Continue)**。
    *   *注意：稍后我们需要回来这里配置 GitHub Pages 或 Vercel 的记录。*

## 第二阶段：修改域名服务器 (Nameservers)

这是最关键的一步。您需要去购买域名的地方（域名注册商）修改设置。

1.  **获取 Cloudflare 的 Nameservers**：
    *   Cloudflare 会给您两个地址，通常长这样：
        *   `xxxx.ns.cloudflare.com`
        *   `xxxx.ns.cloudflare.com`
    *   **复制这两个地址**。

2.  **前往域名注册商**（例如：阿里云、腾讯云、GoDaddy等）：
    *   登录您购买 `mcock.cn` 的平台。
    *   找到 **"域名管理"** 或 **"DNS 修改"**。
    *   找到 **"修改 DNS 服务器"** 或 **"修改 Nameservers"**（注意：不是修改解析记录，是修改服务器）。
    *   选择 **"自定义 DNS"**。
    *   **删除**旧的 DNS 地址。
    *   **填入** 刚才复制的两个 Cloudflare 地址。
    *   保存设置。

3.  **回到 Cloudflare**：
    *   点击 **"完成，检查名称服务器" (Done, check nameservers)**。
    *   点击 **"开始使用" (Get started)** 完成向导（推荐全部开启：自动 HTTPS 重写、始终使用 HTTPS、Brotli 压缩）。

## 第三阶段：等待生效

*   修改 Nameservers 通常需要 **几分钟到 24 小时** 才能在全球生效。
*   Cloudflare 会发邮件通知您状态已激活。

---

## ❓ 关键问题：您的博客托管在哪里？

为了让访问 `mcock.cn` 能看到您的博客，我们需要知道您打算把博客代码放在哪里运行。

目前您的博客还在**本地电脑**上。要让别人访问，推荐以下两种免费方案：

### 方案 A：GitHub Pages (推荐)
*   **优点**：完全免费，稳定，适合静态博客。
*   **操作**：将代码上传到 GitHub 仓库，开启 Pages 服务。

### 方案 B：Vercel
*   **优点**：速度快，部署简单，支持更多功能。
*   **操作**：关联 GitHub 仓库即可自动部署。

**您想使用哪种方式部署博客？** 告诉我您的选择，我会教您如何在 Cloudflare 设置对应的 DNS 记录。
