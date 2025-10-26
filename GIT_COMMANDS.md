# 🚀 Git 命令快速指南

## 📝 基本更新流程

### 标准三步走：

```bash
# 1. 添加所有修改的文件
git add .

# 2. 提交更改（附带说明）
git commit -m "✨ 添加欢迎页面快捷按钮"

# 3. 推送到 GitHub
git push origin main
```

---

## 🎯 本次更新命令

**完整命令（复制粘贴）：**

```bash
git add .
git commit -m "✨ 添加欢迎页面快捷按钮

- 在主导航菜单添加 Welcome 链接
- 在底部导航栏添加圆形星星按钮
- 添加闪光和波纹动画效果
- 更新 README.md 链接"

git push origin main
```

---

## 💡 如果遇到 Vim 编辑器

如果执行命令后看到 Vim 编辑器（显示 `~` 或 `-- INSERT --`）：

### 退出 Vim：
1. 按 `ESC` 键
2. 输入 `:q!` 
3. 按 `Enter`

### 或者保存并退出：
1. 按 `ESC` 键
2. 输入 `:wq`
3. 按 `Enter`

---

## 📋 常用 Git 命令

### 查看状态
```bash
git status
```

### 查看修改内容
```bash
git diff
```

### 查看提交历史
```bash
git log --oneline
```

### 添加特定文件
```bash
git add index.html
git add css/enhanced-style.css
git add README.md
```

### 查看远程仓库
```bash
git remote -v
```

### 拉取远程更新
```bash
git pull origin main
```

---

## 🔧 解决常见问题

### 问题1：有未提交的更改
```bash
git add .
git commit -m "保存当前更改"
```

### 问题2：需要放弃本地更改
```bash
git reset --hard HEAD
```

### 问题3：推送被拒绝
```bash
# 先拉取
git pull origin main --no-edit

# 再推送
git push origin main
```

### 问题4：强制推送（谨慎使用）
```bash
git push origin main --force
```

---

## 📦 完整工作流程

### 每次更新代码的标准流程：

```bash
# 1. 查看当前状态
git status

# 2. 查看具体修改
git diff

# 3. 添加文件
git add .

# 4. 提交更改
git commit -m "提交说明"

# 5. 推送到远程
git push origin main

# 6. 验证
git log --oneline -3
```

---

## 🎨 提交信息规范

### 常用前缀：

- ✨ `feat:` 新功能
- 🐛 `fix:` 修复 bug
- 📝 `docs:` 文档更新
- 💄 `style:` 样式修改
- ♻️ `refactor:` 重构代码
- 🚀 `deploy:` 部署相关
- 🔧 `chore:` 其他修改

### 示例：
```bash
git commit -m "✨ feat: 添加文件上传功能"
git commit -m "🐛 fix: 修复下载按钮错误"
git commit -m "💄 style: 优化导航栏样式"
git commit -m "📝 docs: 更新 README 文档"
```

---

## 🚨 紧急情况

### 撤销最后一次提交（保留更改）
```bash
git reset --soft HEAD~1
```

### 撤销最后一次提交（丢弃更改）
```bash
git reset --hard HEAD~1
```

### 修改最后一次提交信息
```bash
git commit --amend -m "新的提交信息"
```

### 查看某个文件的修改历史
```bash
git log --follow -p -- 文件名
```

---

## 📊 查看信息

### 查看分支
```bash
git branch -a
```

### 查看远程仓库信息
```bash
git remote show origin
```

### 查看文件修改统计
```bash
git diff --stat
```

---

## 💻 快捷别名（可选）

添加到 `~/.gitconfig`：

```bash
[alias]
    st = status
    co = commit
    br = branch
    pu = push
    pl = pull
    lg = log --oneline --graph --decorate
```

使用：
```bash
git st          # 等同于 git status
git co -m "msg" # 等同于 git commit -m "msg"
git lg          # 美化的 log
```

---

## 🎯 本次任务清单

- [ ] 打开 PowerShell/终端
- [ ] 进入项目目录：`cd C:\Users\asus\Desktop\my-blog`
- [ ] 执行：`git add .`
- [ ] 执行：`git commit -m "✨ 添加欢迎页面快捷按钮"`
- [ ] 执行：`git push origin main`
- [ ] 等待推送完成
- [ ] 访问网站验证：`https://mcock.cn/`

---

## 📞 需要帮助？

如果遇到错误：
1. 复制完整的错误信息
2. 告诉我具体在哪一步出错
3. 我会帮你解决！

---

**记住：先 add，再 commit，最后 push！** 🚀

**更新时间**: 2024-10-26  
**作者**: kuankuantj

