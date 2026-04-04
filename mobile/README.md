# Hakimi Blog 移动端应用

本目录包含博客平台的移动端原生应用代码，支持多平台发布。

## 目录结构

```
mobile/
├── README.md                 # 本文件
├── react-native/            # React Native 应用
├── flutter/                 # Flutter 应用
├── weapp/                   # 微信小程序
└── quickapp/               # 快应用
```

## 平台支持

### 1. React Native (iOS/Android)
- 技术栈: React Native 0.72+
- 支持平台: iOS 12+, Android 5.0+
- 特性: 热更新、推送通知、离线阅读

### 2. Flutter (iOS/Android/Web)
- 技术栈: Flutter 3.10+
- 支持平台: iOS 11+, Android 5.0+, Web
- 特性: 高性能、精美UI、跨平台一致体验

### 3. 微信小程序
- 技术栈: 微信原生开发 + Taro/uni-app
- 支持: 微信客户端 8.0+
- 特性: 社交分享、微信支付、订阅消息

### 4. 快应用
- 技术栈: 快应用标准
- 支持: 华为、小米、OPPO、vivo等
- 特性: 免安装、即点即用、系统级入口

## 开发规范

### API 接口
所有移动端应用共享同一套 RESTful API:
- 基础地址: `https://api.mcock.cn/v1`
- 认证方式: JWT Token
- 文档: `/api/docs`

### 代码规范
- 使用 ESLint/Prettier 统一代码风格
- 组件化开发，复用业务逻辑
- 统一的错误处理和日志上报

## 发布流程

1. 开发环境测试
2. 测试环境验证
3. 生产环境发布
4. 应用商店审核
5. 灰度发布
6. 全量发布

## 联系方式

开发团队: dev@mcock.cn
