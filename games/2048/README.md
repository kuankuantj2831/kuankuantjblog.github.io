# 2048 游戏

使用 HTML、CSS 和 JavaScript 构建的经典 2048 益智游戏。

## Features

- **现代简洁的 UI**：渐变色彩、平滑动画和响应式设计。
- **键盘与触摸控制**：使用方向键或在触控设备上滑动。
- **分数跟踪**：当前分数和最高分保存在本地存储中。
- **游戏状态**：达到 2048 时判定胜利，无步可走时游戏结束。
- **撤销功能**：可撤销上一步操作（最多 10 步）。
- **游戏规则说明**：内置新手引导。
- **完全响应式**：适配桌面、平板和手机。

## 如何游玩

1. 在任何现代浏览器中打开 `index.html`。
2. 使用**方向键**（↑、↓、←、→）或**滑动**（触屏设备）移动方块。
3. 当两个相同数字的方块相触时，它们会合并为它们的和。
4. 每次移动后，一个随机空单元格中会出现新方块（2 或 4）。
5. 尝试合成 **2048** 方块来赢得游戏！
6. 当无法继续移动时，游戏结束。

## 控制按钮

- **新游戏** – 开始一局新游戏。
- **撤销** – 撤销上一步移动。
- **游戏规则** – 显示/隐藏游戏说明。

## 项目结构

```
2048/
├── index.html          # 主 HTML 结构
├── style.css           # 样式与动画
├── script.js           # 游戏逻辑与交互
└── README.md           # 本文件
```

## 安装与运行

无需构建工具。只需克隆或下载项目，然后在浏览器中打开 `index.html`。

```bash
git clone <repository-url>
cd 2048
start index.html   # Windows 系统
# 或
open index.html    # macOS 系统
# 或
xdg-open index.html # Linux 系统
```

## 使用的技术

- HTML5
- CSS3（Flexbox、Grid、渐变、过渡）
- 原生 JavaScript (ES6)
- 本地存储用于保存最高分
- Google 字体 (Inter)
- Font Awesome 图标

## 许可

本项目仅供教育及个人使用。2048 游戏最初由 Gabriele Cirulli 创建。

## 致谢

- 灵感来自原版 [2048 游戏](https://play2048.co/)
- 图标来自 [Font Awesome](https://fontawesome.com/)
- 字体来自 [Google Fonts](https://fonts.google.com/)

祝你游戏愉快！ 🎮