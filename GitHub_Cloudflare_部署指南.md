# GitHub Pages + Cloudflare 部署指南

## 第一步：上传代码到 GitHub

我已经为您准备了一个自动脚本，可以一键将所有更改上传到 GitHub。

请在终端运行：
```powershell
python push_to_github.py
```

## 第二步：Cloudflare DNS 设置

代码上传成功后，请前往 Cloudflare 控制台，进入您的 `mcock.cn` 域名设置，点击左侧的 **DNS**。

添加以下 **2条** 记录：

| 类型 (Type) | 名称 (Name) | 内容 (Content) | 代理状态 (Proxy Status) |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` (或者 `mcock.cn`) | `kuankuantj2831.github.io` | ✅ 已代理 (Proxied) |
| **CNAME** | `www` | `kuankuantj2831.github.io` | ✅ 已代理 (Proxied) |

*注意：如果 Cloudflare 提示不能在根域名(@)使用 CNAME，它通常会自动通过 "CNAME Flattening" 功能支持，直接添加即可。*

## 第三步：GitHub Pages 设置

1.  打开您的 GitHub 仓库页面：[kuankuantjblog.github.io](https://github.com/kuankuantj2831/kuankuantjblog.github.io)
2.  点击顶部的 **Settings** (设置)。
3.  在左侧菜单找到 **Pages**。
4.  **Build and deployment**: Source 选择 `Deploy from a branch`，Branch 选择 `main` (或 `master`) / `/root`。
5.  **Custom domain**:
    *   输入 `mcock.cn`
    *   点击 **Save**。
    *   勾选 **Enforce HTTPS** (如果 Cloudflare 配置正确，这里稍后会自动生效)。

## 第四步：Cloudflare SSL 设置 (重要)

为了防止重定向循环，请在 Cloudflare 设置 SSL 模式：

1.  点击 Cloudflare 左侧菜单的 **SSL/TLS**。
2.  将模式设置为 **Full (Strict)** 或 **Full**。
    *   **推荐 Full (Strict)**：因为 GitHub Pages 自带 SSL 证书，这样最安全。
    *   **绝对不要**选 Flexible，否则会导致 "重定向次数过多" 错误。

---

## 🎉 完成！

等待几分钟 DNS 生效后，访问 `https://mcock.cn` 应该就能看到您的中国风博客了！
