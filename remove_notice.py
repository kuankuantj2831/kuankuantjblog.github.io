# -*- coding: utf-8 -*-
with open('index-chinese.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 删除第64-107行（Python索引从0开始，所以是63-106）
new_lines = lines[:63] + lines[107:]

with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ 公告卡片已删除！")
