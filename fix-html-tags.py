#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
修复HTML标签问题
"""

import codecs

def main():
    file_path = r"C:\Users\asus\Desktop\my-blog\features.html"
    
    try:
        # 读取文件内容
        with codecs.open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复缺少闭合标签的链接
        replacements = [
            (r'⏰倒计时/a>', '⏰倒计时</a>'),
            (r'📏单位转换/a>', '📏单位转换</a>'),
            (r'🔒密码生成/a>', '🔒密码生成</a>'),
            (r'📱二维码生成/a>', '📱二维码生成</a>'),
        ]
        
        # 执行替换
        for old_str, new_str in replacements:
            content = content.replace(old_str, new_str)
        
        # 保存修复后的内容
        with codecs.open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("HTML标签修复完成")
        
    except Exception as e:
        print("修复失败: " + str(e))

if __name__ == "__main__":
    main()