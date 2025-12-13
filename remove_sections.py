# -*- coding: utf-8 -*-
with open('index-chinese.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 删除公告卡片section（包括注释）
import re

# 删除从"<!-- 公告卡片 -->"到"</section>"的整个部分
pattern1 = r'\s*<!-- 公告卡片 -->.*?</section>\s*'
content = re.sub(pattern1, '\n', content, flags=re.DOTALL)

# 删除提示横幅
pattern2 = r'\s*<!-- 提示横幅 -->.*?</div>\s*</div>\s*'
content = re.sub(pattern2, '\n', content, flags=re.DOTALL)

with open('index-chinese.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 公告卡片和提示横幅已删除！")
