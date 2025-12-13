# 后端服务器搭建指南

## 📋 目录
- [技术选型](#技术选型)
- [方案一：Node.js + Express + MongoDB](#方案一nodejs--express--mongodb)
- [方案二：Python Flask + SQLite](#方案二python-flask--sqlite)
- [数据库设计](#数据库设计)
- [API接口设计](#api接口设计)
- [安全建议](#安全建议)
- [部署方案](#部署方案)

---

## 技术选型

### 推荐方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Node.js + Express** | 性能好、生态丰富、与前端同语言 | 需要学习异步编程 | 高并发、实时应用 |
| **Python Flask** | 简单易学、代码简洁 | 性能相对较低 | 快速开发、中小型项目 |
| **PHP + Laravel** | 成熟稳定、虚拟主机支持好 | 相对传统 | 传统Web应用 |

---

## 方案一：Node.js + Express + MongoDB

### 1. 环境准备

```bash
# 安装 Node.js (访问 https://nodejs.org 下载)
node --version  # 检查版本

# 安装 MongoDB (访问 https://www.mongodb.com/try/download/community)
mongod --version  # 检查版本
```

### 2. 创建项目

```bash
# 创建项目目录
mkdir blog-backend
cd blog-backend

# 初始化项目
npm init -y

# 安装依赖
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

### 3. 项目结构

```
blog-backend/
├── server.js           # 入口文件
├── .env               # 环境变量
├── config/
│   └── db.js          # 数据库配置
├── models/
│   └── User.js        # 用户模型
├── routes/
│   └── auth.js        # 认证路由
├── middleware/
│   └── auth.js        # 认证中间件
└── package.json
```

### 4. 核心代码

#### server.js
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 连接成功'))
.catch(err => console.error('❌ MongoDB 连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
```

#### models/User.js
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

#### routes/auth.js
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否存在
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
```

#### .env
```
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=your-super-secret-key-change-this
PORT=5000
```

### 5. 运行服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

---

## 方案二：Python Flask + SQLite

### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 安装依赖
pip install flask flask-sqlalchemy flask-bcrypt flask-jwt-extended flask-cors
```

### 2. 项目结构

```
blog-backend/
├── app.py             # 入口文件
├── config.py          # 配置文件
├── models.py          # 数据模型
├── routes.py          # 路由
└── requirements.txt   # 依赖列表
```

### 3. 核心代码

#### app.py
```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)

from routes import *

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
```

#### models.py
```python
from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'
```

#### routes.py
```python
from flask import request, jsonify
from app import app, db, bcrypt
from models import User
from flask_jwt_extended import create_access_token

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # 检查用户是否存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已被注册'}), 400
    
    # 加密密码
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # 创建用户
    user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': '注册成功'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # 查找用户
    user = User.query.filter(
        (User.username == data['username']) | (User.email == data['username'])
    ).first()
    
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'message': '用户名或密码错误'}), 400
    
    # 生成 token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200
```

---

## 数据库设计

### 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT/ObjectId | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| email | VARCHAR(100) | 邮箱（唯一） |
| password | VARCHAR(255) | 加密后的密码 |
| avatar | VARCHAR(255) | 头像URL（可选） |
| created_at | DATETIME | 注册时间 |
| updated_at | DATETIME | 更新时间 |

---

## API接口设计

### 1. 注册接口

**请求**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**响应**
```json
{
  "message": "注册成功"
}
```

### 2. 登录接口

**请求**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

## 安全建议

### 1. 密码安全
- ✅ 使用 bcrypt 加密密码
- ✅ 密码最少6个字符
- ✅ 不要在日志中记录密码

### 2. JWT安全
- ✅ 使用强密钥
- ✅ 设置合理的过期时间
- ✅ 在 HTTPS 下传输

### 3. 输入验证
- ✅ 验证所有用户输入
- ✅ 防止 SQL 注入
- ✅ 防止 XSS 攻击

### 4. CORS配置
```javascript
// 生产环境应限制来源
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

---

## 部署方案

### 1. 本地测试
```bash
# Node.js
npm run dev

# Python
python app.py
```

### 2. 云服务器部署

#### 使用 Heroku
```bash
# 安装 Heroku CLI
heroku login
heroku create your-app-name
git push heroku main
```

#### 使用 Vercel (Node.js)
```bash
npm i -g vercel
vercel
```

#### 使用 PythonAnywhere (Python)
1. 上传代码到 PythonAnywhere
2. 配置 WSGI 文件
3. 重启 Web 应用

### 3. 数据库部署

- **MongoDB Atlas**: 免费云数据库
- **ElephantSQL**: PostgreSQL 云服务
- **PlanetScale**: MySQL 云服务

---

## 前端集成

### 修改 auth.js

```javascript
// 将 LocalStorage 改为 API 调用
async handleRegister() {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });
  
  const data = await response.json();
  // 处理响应...
}
```

---

## 下一步

1. ✅ 选择技术栈（Node.js 或 Python）
2. ✅ 搭建本地开发环境
3. ✅ 实现基础API
4. ✅ 测试API接口
5. ✅ 集成到前端
6. ✅ 部署到云服务器

---

## 常见问题

**Q: 我应该选择哪个方案？**
A: 如果你熟悉JavaScript，选Node.js；如果想快速开发，选Python Flask。

**Q: 数据库用什么？**
A: 小项目用SQLite，大项目用MongoDB或PostgreSQL。

**Q: 如何保证安全？**
A: 使用HTTPS、JWT、密码加密，验证所有输入。

**Q: 部署到哪里？**
A: Heroku、Vercel、Railway都是不错的免费选择。
