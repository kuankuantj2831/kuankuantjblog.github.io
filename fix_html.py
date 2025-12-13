# -*- coding: utf-8 -*-
with open('index-chinese.html.backup', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改个人中心链接
content = content.replace(
    '<a href="#" class="user-dropdown-item">👤 个人中心</a>',
    '<a href="/profile.html" class="user-dropdown-item">👤 个人中心</a>'
)

with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML文件已修复！")
