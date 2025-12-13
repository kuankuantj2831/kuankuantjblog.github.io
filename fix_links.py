# -*- coding: utf-8 -*-
import shutil

# 先恢复备份
shutil.copy('index-chinese.html.backup', 'index-chinese.html')

# 读取文件
with open('index-chinese.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复个人中心和设置链接
content = content.replace(
    '<a href="#" class="user-dropdown-item">👤 个人中心</a>',
    '<a href="/profile.html" class="user-dropdown-item">👤 个人中心</a>'
)
content = content.replace(
    '<a href="#" class="user-dropdown-item">⚙️ 设置</a>',
    '<a href="/profile.html" class="user-dropdown-item">⚙️ 设置</a>'
)

# 写回文件
with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - Links fixed!")
