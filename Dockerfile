# ============================================
# Hakimi Blog - Docker 容器化配置
# 支持多阶段构建，优化镜像大小
# ============================================

# 阶段1: 构建前端静态资源
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制前端源码
COPY . .

# 构建前端（如果有构建步骤）
# RUN npm run build

# 阶段2: 构建后端服务
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制后端依赖文件
COPY server/package*.json ./
RUN npm ci --only=production

# 复制后端源码
COPY server/ ./

# 阶段3: 生产镜像
FROM node:18-alpine AS production

# 安装必要的系统工具
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 从构建阶段复制文件
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend ./frontend

# 设置工作目录为后端
WORKDIR /app/server

# 创建日志目录
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 9000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9000/api/health || exit 1

# 启动命令
CMD ["node", "app.js"]

# ============================================
# 阶段4: 开发镜像
# ============================================
FROM node:18-alpine AS development

WORKDIR /app

# 安装开发依赖
RUN apk add --no-cache \
    git \
    curl \
    vim \
    && rm -rf /var/cache/apk/*

# 安装nodemon用于热重载
RUN npm install -g nodemon

# 复制所有文件
COPY . .

# 安装所有依赖（包括开发依赖）
RUN cd server && npm install

WORKDIR /app/server

EXPOSE 9000

CMD ["nodemon", "--watch", ".", "--ext", "js,json", "app.js"]
