# -*- coding: utf-8 -*-
with open('index-chinese.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到并修改第46-47行的链接
for i in range(len(lines)):
    if '👤 个人中心' in lines[i] and 'href="#"' in lines[i]:
        lines[i] = lines[i].replace('href="#"', 'href="/profile.html"')
        print(f"Fixed line {i+1}: Personal Center")
    elif '⚙️ 设置' in lines[i] and 'href="#"' in lines[i]:
        lines[i] = lines[i].replace('href="#"', 'href="/profile.html"')
        print(f"Fixed line {i+1}: Settings")

with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done! Links updated successfully.")
