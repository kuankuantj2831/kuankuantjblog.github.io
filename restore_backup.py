# -*- coding: utf-8 -*-
# 恢复备份文件
import shutil

shutil.copy('index-chinese.html.backup', 'index-chinese.html')
print("✅ 已从备份恢复！")
