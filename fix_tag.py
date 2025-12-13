# -*- coding: utf-8 -*-
with open('index-chinese.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 将"陪神"替换为"原神"
content = content.replace('陪神', '原神')

with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已将'陪神'修改为'原神'！")
