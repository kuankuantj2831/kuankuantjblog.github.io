# 🎮 Feature Pack 功能系统指南

本文档详细说明博客网站中通过 **Feature Pack 架构** 实现的全部 **200 个功能模块** 的用法与配置方式。

---

## 📑 目录

- [架构概述](#架构概述)
- [核心原理](#核心原理)
- [快速启用](#快速启用)
- [功能开关控制](#功能开关控制)
- [第 1 批：基础交互 (1-100)](#第-1-批基础交互-1-100)
- [第 2 批：扩展功能 (101-200)](#第-2-批扩展功能-101-200)
- [页面映射说明](#页面映射说明)
- [高级配置](#高级配置)
- [故障排查](#故障排查)

---

## 架构概述

Feature Pack 是一套模块化前端功能管理系统，通过统一的注册器将 200 个独立功能封装为可插拔模块。

### 核心文件

| 文件 | 作用 |
|------|------|
| [`js/feature-pack-core.js`](js/feature-pack-core.js) | 核心管理器：注册、启用、页面检测 |
| [`js/feature-loader.js`](js/feature-loader.js) | 加载器：导入全部 40 个功能包 |
| [`js/feature-pack-1.js`](js/feature-pack-1.js) ~ [`js/feature-pack-40.js`](js/feature-pack-40.js) | 功能包：每包含 5 个功能 |

### 工作流程

```
HTML 页面加载 → feature-loader.js 导入 → core.js 注册 → 按页面过滤 → 初始化功能
```

---

## 核心原理

### 注册机制

每个功能通过 `FeaturePack.register(id, config)` 注册：

```javascript
FeaturePack.register('fp001_xxx', {
    name: '功能名称',
    desc: '功能描述',
    page: 'index',     // 生效页面：index / article / profile / coins / editor / games / admin / other
    initFn() {         // 初始化逻辑
        // DOM 操作、事件绑定等
    }
});
```

### 页面自动检测

系统根据当前 URL 自动判断页面类型：

| 页面类型 | 匹配 URL |
|---------|---------|
| `index` | 首页 `/index.html`、`/index-chinese.html` |
| `article` | 文章页 `/article.html`、文章详情页 |
| `profile` | 个人中心 `/profile.html` |
| `coins` | 猫币系统 `/coins.html` |
| `editor` | 编辑器 `/editor.html` |
| `games` | 游戏中心 `/games.html` |
| `admin` | 管理后台 `/管理/` |
| `other` | 其他所有页面 |

### 存储键名规则

每个功能在 LocalStorage 中的开关键名为：

```
fp_功能ID
```

例如：`fp181_step_counter`、`fp196_performance_panel`

---

## 快速启用

### 方式一：全局引入（推荐）

在需要启用 Feature Pack 系统的页面底部添加：

```html
<script type="module" src="js/feature-loader.js"></script>
```

这会自动加载全部 200 个功能，并根据当前页面类型智能过滤初始化。

### 方式二：按需引入特定包

如果只想要某一批功能，可以只引入对应的功能包：

```html
<script type="module">
    import { FeaturePack } from './js/feature-pack-core.js';
    import './js/feature-pack-37.js';  // 只加载健康与运动功能
    FeaturePack.initAll();
</script>
```

### 方式三：在现有页面中启用

系统已在以下页面引入：
- `index.html`
- `index-chinese.html`
- `article.html`
- `profile.html`
- `coins.html`

---

## 功能开关控制

### 通过 LocalStorage 单独开关

在浏览器控制台执行：

```javascript
// 关闭某个功能（以步数计数器为例）
localStorage.setItem('fp181_step_counter', 'false');

// 重新开启
localStorage.setItem('fp181_step_counter', 'true');

// 删除设置（恢复默认启用）
localStorage.removeItem('fp181_step_counter');
```

### 批量开关

```javascript
// 关闭所有 health 相关功能
Object.keys(localStorage)
    .filter(k => k.startsWith('fp181') || k.startsWith('fp182') || k.startsWith('fp183'))
    .forEach(k => localStorage.setItem(k, 'false'));

// 关闭第 37 包全部功能 (181-185)
['fp181_step_counter', 'fp182_water_tracker', 'fp183_sedentary_alert',
 'fp184_eye_exercise', 'fp185_breathing_exercise']
    .forEach(id => localStorage.setItem(id, 'false'));
```

### 查看已注册的所有功能

```javascript
// 在控制台查看
console.table(Object.entries(FeaturePack.registry).map(([id, f]) => ({
    ID: id, 名称: f.name, 页面: f.page
})));
```

---

## 第 1 批：基础交互 (1-100)

分布在 [`js/feature-pack-1.js`](js/feature-pack-1.js) 至 [`js/feature-pack-20.js`](js/feature-pack-20.js)。

| 包 | 功能ID | 名称 | 页面 | 用法说明 |
|----|--------|------|------|---------|
| 1 | fp001-fp005 | 回到顶部、滚动进度、阅读时间、阅读进度、章节导航 | article | 自动生效，无需配置 |
| 1 | fp006-fp010 | 代码复制、图片灯箱、搜索高亮、表格排序、打印优化 | article | 点击代码块复制按钮、点击图片放大 |
| 2 | fp011-fp015 | 字数统计、标签云、相关文章、面包屑、分享按钮 | article | 自动渲染在文章底部 |
| 2 | fp016-fp020 | 快捷键、自动保存、草稿恢复、导出PDF、全屏阅读 | editor/article | `Ctrl+S` 保存、`F11` 全屏 |
| 3-4 | fp021-fp040 | 评论表情、评论排序、实时预览、@提及、评论投票等 | article | 评论区域自动增强 |
| 5-10 | fp041-fp080 | 通知系统、站内信、用户关注、动态流、私信等 | profile/index | 个人中心自动显示 |
| 11-20 | fp081-fp100 | 文章收藏、阅读历史、夜间模式、字体调整、行高等 | all | 工具栏按钮控制 |

---

## 第 2 批：扩展功能 (101-200)

分布在 [`js/feature-pack-21.js`](js/feature-pack-21.js) 至 [`js/feature-pack-40.js`](js/feature-pack-40.js)。

### #21 AI 与智能 (101-105)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp101 | 🤖 AI 文章摘要 | article | 自动分析文章生成摘要卡片，显示在文章顶部 |
| fp102 | 🏷️ 智能标签推荐 | article/editor | 根据内容推荐相关标签，点击快速添加 |
| fp103 | 📊 阅读难度分析 | article | 显示文章可读性分数（如"适合高中生阅读"） |
| fp104 | ☁️ 关键词云 | article | 文章关键词可视化云图 |
| fp105 | 🔗 相似文章推荐 | article | 基于内容相似度推荐相关文章 |

**配置项**：
```javascript
// 调整摘要长度（字符数）
localStorage.setItem('fp101_summary_length', '200');

// 关闭关键词云动画
localStorage.setItem('fp104_cloud_anim', 'false');
```

---

### #22 音频与视频 (106-110)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp106 | 🎵 背景音乐播放器 | index | 右下角迷你播放器，支持播放/暂停/切歌 |
| fp107 | 🎬 视频弹窗预览 | article | 鼠标悬停视频链接显示预览浮窗 |
| fp108 | 🎤 语音搜索 | index | 点击搜索框麦克风图标进行语音输入 |
| fp109 | 🌊 音频可视化 | index | 播放音频时显示频谱动画 |
| fp110 | 🎧 播客播放器 | article | 文章内嵌播客播放器 |

**配置项**：
```javascript
// 设置默认音量 (0-1)
localStorage.setItem('fp106_volume', '0.5');

// 禁用自动播放
localStorage.setItem('fp106_autoplay', 'false');
```

---

### #23 图表与数据可视化 (111-115)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp111 | 📊 文章数据柱状图 | profile | 显示用户发文量统计柱状图 |
| fp112 | 🥧 分类饼图 | profile | 文章分类占比饼图 |
| fp113 | 📈 阅读量折线图 | profile | 近30天阅读量趋势 |
| fp114 | ⭕ 技能进度环 | profile | 用户技能掌握度环形进度条 |
| fp115 | 🎛️ 数据仪表盘 | admin | 管理后台综合数据仪表板 |

---

### #24 日历与时间 (116-120)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp116 | 📅 迷你日历 | profile | 显示签到日历，点击日期查看详情 |
| fp117 | 🌍 世界时钟 | index | 显示多个时区当前时间 |
| fp118 | ⏳ 倒计时组件 | coins | 活动倒计时卡片 |
| fp119 | ⏱️ 计时器 | games | 游戏计时器，支持开始/暂停/重置 |
| fp120 | 🍅 番茄钟 | profile | 25分钟工作+5分钟休息循环 |

**配置项**：
```javascript
// 番茄钟工作时长（分钟）
localStorage.setItem('fp120_work_time', '25');

// 番茄钟休息时长（分钟）
localStorage.setItem('fp120_break_time', '5');

// 世界时钟显示的时区
localStorage.setItem('fp117_timezones', 'Asia/Shanghai,America/New_York,Europe/London');
```

---

### #25 游戏与娱乐 (121-125)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp121 | 🎯 猜数字游戏 | games | 1-100猜数字，系统提示大小 |
| fp122 | ✊ 石头剪刀布 | games | 与AI对战，记录胜率 |
| fp123 | 🔮 每日运势 | profile | 每日随机运势签 |
| fp124 | 🎲 摇骰子 | games | 投掷1-6点骰子 |
| fp125 | 🎋 幸运抽签 | profile | 抽取今日幸运签文 |

---

### #26 地图与位置 (126-130)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp126 | 📍 IP 位置显示 | profile | 显示当前IP归属地 |
| fp127 | 🌤️ 天气小部件 | index | 显示当地天气和温度 |
| fp128 | 🗺️ 坐标显示 | profile | 显示经纬度坐标（基于IP） |
| fp129 | 📏 距离计算器 | profile | 计算两地之间距离 |
| fp130 | 🕐 时区转换器 | profile | 时间跨时区转换 |

---

### #27 文件与下载 (131-135)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp131 | 📥 下载进度条 | article | 文件下载显示实时进度 |
| fp132 | 📤 拖拽上传 | editor | 拖拽文件到编辑器上传 |
| fp133 | 📄 文件图标识别 | drive | 根据扩展名显示对应图标 |
| fp134 | 💾 文件大小显示 | drive | 自动转换字节为 KB/MB/GB |
| fp135 | 📦 批量下载 | drive | 多选文件打包下载 |

---

### #28 邮件与通讯 (136-140)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp136 | ✉️ 快速邮件 | profile | 一键打开邮件客户端 |
| fp137 | 📝 联系表单 | profile | 站内联系表单 |
| fp138 | 💬 在线客服 | index | 右下角客服聊天入口 |
| fp139 | 📮 意见反馈 | index | 用户反馈弹窗 |
| fp140 | 📰 订阅电子报 | index | 邮箱订阅每周精选 |

---

### #29 投票与问卷 (141-145)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp141 | 👍 文章投票 | article | 对文章进行赞同/反对投票 |
| fp142 | 😊 满意度调查 | article | 阅读后弹出满意度评价 |
| fp143 | 📊 多选投票 | article | 文章内嵌多选投票 |
| fp144 | ⭐ 星级评分 | article | 1-5星文章评分 |
| fp145 | 📋 问卷弹窗 | index | 随机弹出用户调研问卷 |

---

### #30 相册与画廊 (146-150)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp146 | 🦴 图片加载骨架 | gallery | 图片加载前显示骨架屏 |
| fp147 | 🔄 图片对比 | gallery | 滑动对比两张图片 |
| fp148 | 🏷️ 图片水印 | gallery | 上传自动添加水印 |
| fp149 | 🗜️ 图片压缩 | editor | 上传前自动压缩图片 |
| fp150 | 🖼️ 画廊模式 | gallery | 全屏画廊浏览模式 |

---

### #31 天气与时钟 (151-155)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp151 | ⏰ 实时时钟 | index | 顶部或侧边栏实时时钟 |
| fp152 | 📅 日期显示 | index | 农历/公历日期显示 |
| fp153 | 🌾 节气提示 | index | 当前节气及下一个节气 |
| fp154 | 🌅 日出日落 | index | 当地日出日落时间 |
| fp155 | 🌙 月相显示 | index | 当前月相图示 |

---

### #32 任务与待办 (156-160)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp156 | ✅ 待办事项 | profile | 添加/完成/删除待办 |
| fp157 | 🍅 番茄统计 | profile | 番茄钟使用统计 |
| fp158 | 📈 习惯追踪 | profile | 每日习惯打卡记录 |
| fp159 | 🎯 目标进度 | profile | 设定目标并跟踪进度 |
| fp160 | ⏰ 事件倒计时 | profile | 自定义事件倒计时 |

**配置项**：
```javascript
// 添加待办事项（通过localStorage存储）
const todos = JSON.parse(localStorage.getItem('fp156_todos') || '[]');
todos.push({ text: '写文章', done: false, time: Date.now() });
localStorage.setItem('fp156_todos', JSON.stringify(todos));

// 设置目标
localStorage.setItem('fp159_goal', JSON.stringify({
    title: '写100篇文章',
    target: 100,
    current: 23
}));
```

---

### #33 RSS 与订阅 (161-165)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp161 | 📡 RSS 订阅 | index | 生成RSS订阅链接 |
| fp162 | 📧 邮件订阅弹窗 | index | 首次访问弹出订阅邀请 |
| fp163 | 🔔 更新推送 | index | 新文章浏览器推送通知 |
| fp164 | 🌐 Web Push | index | 订阅Web Push通知 |
| fp165 | 📋 订阅管理 | profile | 管理所有订阅状态 |

---

### #34 数学与公式 (166-170)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp166 | 🧮 计算器 | coins | 页面内嵌科学计算器 |
| fp167 | 📐 单位转换 | coins | 长度/重量/温度等单位换算 |
| fp168 | 🎲 随机数生成 | coins | 生成指定范围随机数 |
| fp169 | 🔐 密码生成器 | profile | 生成安全随机密码 |
| fp170 | ⚖️ BMI 计算 | profile | 身高体重计算BMI指数 |

**配置项**：
```javascript
// 密码长度
localStorage.setItem('fp169_pwd_length', '16');

// 密码包含符号
localStorage.setItem('fp169_pwd_symbols', 'true');
```

---

### #35 颜色与主题 (171-175)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp171 | 🎨 拾色器 | editor | 选取颜色并复制HEX值 |
| fp172 | ⚫ 灰度模式 | all | 一键切换黑白灰度显示 |
| fp173 | 🔄 反色模式 | all | 颜色反转显示 |
| fp174 | 👁️ 色盲模式 | all | 红绿色盲友好配色 |
| fp175 | 📊 颜色统计 | article | 分析文章主色调 |

---

### #36 随机与抽奖 (176-180)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp176 | 💬 随机名言 | index | 首页显示随机名言 |
| fp177 | 🎨 随机背景 | index | 每次刷新随机背景色/图 |
| fp178 | 🏆 每日挑战 | profile | 每日随机小挑战任务 |
| fp179 | 🎰 迷你抽奖 | coins | 消耗猫币抽奖小奖品 |
| fp180 | 🖼️ 随机壁纸 | index | Bing每日壁纸或随机图片 |

---

### #37 健康与运动 (181-185)

| ID | 名称 | 页面 | 用法 | 配置 |
|----|------|------|------|------|
| fp181 | 🚶 步数计数器 | profile | 显示今日步数和目标进度 | 目标步数默认10000 |
| fp182 | 💧 饮水记录 | profile | 点击+250ml记录饮水，显示进度 | 目标默认2000ml |
| fp183 | ⏰ 久坐提醒 | index | 每45分钟弹出活动提醒 | 间隔不可调（45分钟固定） |
| fp184 | 👁️ 眼保健操提醒 | article | 每20分钟提醒远眺 | 符合20-20-20法则 |
| fp185 | 🫁 呼吸训练 | profile | 4秒吸气-4秒保持-4秒呼气循环 | 点击"开始呼吸练习"启动 |

**配置项**：
```javascript
// 修改饮水目标
localStorage.setItem('fp182_goal', '2500');

// 重置今日饮水记录
localStorage.setItem('fp_water_tracker', '0');
```

---

### #38 金融与记账 (186-190)

| ID | 名称 | 页面 | 用法 | 配置 |
|----|------|------|------|------|
| fp186 | 💰 支出记录 | profile | 点击分类按钮快速记账 | 数据存于`fp_expenses` |
| fp187 | 📊 预算规划 | profile | 显示本月支出与预算对比 | 预算默认¥3000 |
| fp188 | 💱 汇率换算 | coins | 点击币种输入金额换算 | 汇率硬编码，需手动更新 |
| fp189 | 🧮 分期计算器 | coins | 输入金额/期数/利率计算月供 | 等额本息算法 |
| fp190 | 💡 理财小贴士 | profile | 每日轮换显示理财建议 | 共10条循环 |

**配置项**：
```javascript
// 设置月度预算
localStorage.setItem('fp_budget_limit', '5000');

// 查看所有支出记录
console.table(JSON.parse(localStorage.getItem('fp_expenses') || '[]'));
```

---

### #39 翻译与语言 (191-195)

| ID | 名称 | 页面 | 用法 |
|----|------|------|------|
| fp191 | 🌐 划词翻译 | article | 选中文字自动弹出翻译浮窗 |
| fp192 | 🔍 语言检测 | profile | 输入文字自动检测语言类型 |
| fp193 | 📝 拼音转换 | profile | 输入汉字显示拼音（常用字） |
| fp194 | 📻 摩斯电码 | profile | 文字与摩斯电码双向转换 |
| fp195 | ⠃⠗ 盲文转换 | profile | 英文字母/数字转盲文 |

**配置项**：
```javascript
// 划词翻译自动弹出（默认启用）
localStorage.setItem('fp191_auto_popup', 'true');
```

---

### #40 系统与诊断 (196-200)

| ID | 名称 | 页面 | 用法 | 说明 |
|----|------|------|------|------|
| fp196 | ⚡ 性能监控 | index | 左下角显示加载性能指标 | 点击面板关闭 |
| fp197 | 🧠 内存检测 | profile | 显示JS堆内存使用情况 | 仅Chrome支持 |
| fp198 | 🔋 电池状态 | profile | 显示电量、充电状态、剩余时间 | 需设备支持Battery API |
| fp199 | 🌐 网络诊断 | profile | 显示网络类型、速度、延迟 | 使用Network Information API |
| fp200 | 🔐 浏览器指纹 | profile | 显示设备指纹及硬件信息 | 基于浏览器特性哈希 |

**配置项**：
```javascript
// 性能面板更新间隔（毫秒）
localStorage.setItem('fp196_update_interval', '5000');

// 禁用性能面板自动刷新
localStorage.setItem('fp196_auto_refresh', 'false');
```

---

## 页面映射说明

不同功能仅在特定页面生效，这是为了减少不必要的DOM查询和性能开销。

### 如何查看当前页面类型

在浏览器控制台执行：

```javascript
FeaturePack.detectPage();
// 返回: "index" / "article" / "profile" / "coins" / "editor" / "games" / "admin" / "other"
```

### 跨页面功能

以下功能在 `all`（所有页面）生效：
- 夜间模式切换
- 字体大小调整
- 键盘快捷键
- 滚动效果

### 让功能在更多页面生效

如需修改某功能的生效页面，编辑对应功能包文件，修改 `page` 属性：

```javascript
// 原配置
page: 'profile'

// 改为多页面
page: ['profile', 'index', 'coins']

// 或全部页面
page: 'all'
```

---

## 高级配置

### 自定义功能面板

Feature Pack 系统默认在页面右下角注入一个设置按钮（齿轮图标），点击可开关功能。

如需完全禁用此按钮：

```javascript
localStorage.setItem('fp_panel_disabled', 'true');
```

### 开发新功能

参考以下模板创建自定义功能：

```javascript
// 在任意 feature-pack-*.js 文件中添加
FeaturePack.register('fp_custom_myfeature', {
    name: '🌟 我的自定义功能',
    desc: '这是一个示例功能',
    page: 'index',  // 或 'all' / ['index', 'profile']
    initFn() {
        // 你的逻辑代码
        const div = document.createElement('div');
        div.textContent = 'Hello Feature Pack!';
        document.body.appendChild(div);
    }
});
```

### 功能依赖

如需某个功能在另一个功能之后加载，使用 `deps`：

```javascript
FeaturePack.register('fp_custom_b', {
    name: '功能B',
    deps: ['fp_custom_a'],  // 确保A先初始化
    initFn() {
        // B的逻辑
    }
});
```

---

## 故障排查

### 功能没有显示

1. **检查页面类型是否匹配**
   ```javascript
   console.log(FeaturePack.detectPage());
   ```

2. **检查功能是否被禁用**
   ```javascript
   console.log(localStorage.getItem('fp功能ID')); // 应为 null 或 'true'
   ```

3. **检查功能是否已注册**
   ```javascript
   console.log(FeaturePack.registry['fp功能ID']);
   ```

4. **检查控制台错误**
   按 `F12` → Console 查看是否有报错

### 页面卡顿

大量功能同时初始化可能导致卡顿。建议：

```javascript
// 关闭不常用功能
['fp196_performance_panel', 'fp183_sedentary_alert', 'fp184_eye_exercise']
    .forEach(id => localStorage.setItem(id, 'false'));
```

### 清除所有功能设置

```javascript
// 清除所有 Feature Pack 相关的 localStorage
Object.keys(localStorage)
    .filter(k => k.startsWith('fp'))
    .forEach(k => localStorage.removeItem(k));

// 刷新页面后所有功能恢复默认启用
location.reload();
```

---

## 功能统计

| 批次 | 功能包 | 功能数量 | 文件 |
|------|--------|---------|------|
| 第1批 | #1-#20 | 100 | `feature-pack-1.js` ~ `feature-pack-20.js` |
| 第2批 | #21-#40 | 100 | `feature-pack-21.js` ~ `feature-pack-40.js` |
| **合计** | **40包** | **200** | |

---

## 更新日志

- **2026-04-18**: 完成第2批100个功能（101-200），涵盖AI、音视频、图表、日历、游戏、地图、文件、邮件、投票、相册、天气、任务、RSS、数学、颜色、随机、健康、金融、翻译、系统诊断共20个分类。
- **2026-04-17**: 完成第1批100个功能（1-100），涵盖阅读增强、评论系统、社交互动、个人中心等核心功能。
