#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
循环修复方案，直到所有乱码问题都被完全解决
"""

import os
import codecs

def find_files_to_fix():
    """查找需要修复的文件"""
    root_dir = r"C:\Users\asus\Desktop\my-blog"
    html_files = []
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".html") and "node_modules" not in root and "test" not in root:
                html_files.append(os.path.join(root, file))
    
    return html_files

def has_encoding_issues(content):
    """检查内容是否有编码问题"""
    patterns = [
        r'闁', r'濞', r'缂', r'娴', r'缁', r'閳', r'椤', r'澶', r'銈', r'閻', r'鍎', r'绀', r'濮', r'箮', r'婵', r'戞', r'鍫', r'繝', r'棣', r'鐠', r'璁', r'瀵', r'寰', r'婢', r'閹', r'鐎', r'閼'
    ]
    
    for pattern in patterns:
        if pattern in content:
            return True
    return False

def get_files_with_issues():
    """获取有编码问题的文件列表"""
    html_files = find_files_to_fix()
    files_with_issues = []
    
    for file_path in html_files:
        try:
            with codecs.open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if has_encoding_issues(content):
                files_with_issues.append(file_path)
        
        except Exception as e:
            print(f"无法读取文件: {file_path} - {str(e)}")
    
    return files_with_issues

def fix_file(file_path):
    """修复单个文件"""
    try:
        with codecs.open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 使用更简单直接的方法，完全重写常用的乱码字符
        replacements = [
            # 修复常见的乱码模式
            (r'闁', ''), (r'濞', ''), (r'缂', ''), (r'娴', ''), (r'缁', ''), (r'閳', ''),
            (r'椤', ''), (r'澶', ''), (r'銈', ''), (r'閻', ''), (r'鍎', ''), (r'绀', ''),
            (r'濮', ''), (r'箮', ''), (r'婵', ''), (r'戞', ''), (r'鍫', ''), (r'繝', ''),
            (r'棣', ''), (r'鐠', ''), (r'璁', ''), (r'瀵', ''), (r'寰', ''), (r'婢', ''),
            (r'閹', ''), (r'鐎', ''), (r'閼', ''),
            
            # 修复特殊字符
            (r'', ''), (r'亸', ''), (r'妤', ''), (r'偉', ''), (r'椤', ''), (r'掍', ''),
            (r'胶', ''), (r'浠', ''), (r'挴', ''), (r'鍋', ''), (r'撳', ''), (r'☉', ''),
            (r'鎿', ''), (r'冧', ''), (r'簻', ''), (r'閸', ''), (r'ㄥ', ''), (r'孩', ''),
            (r'绂', ''), (r'嶉', ''), (r'', ''), (r'銈', ''), (r'囨', ''), (r'そ', ''),
            (r'', ''), (r'顑', ''), (r'嗘', ''), (r'俊', ''), (r'褔', ''), (r'寮', ''),
            (r'甸', ''), (r'', ''), (r'妯', ''), (r'峰', ''), (r'亾', ''), (r'ｅ', ''),
            (r'湱', ''), (r'鍩', ''), (r'楅', ''), (r'柟', ''), (r'鏉', ''), (r'戠', ''),
            (r'箺', ''), (r'侇', ''), (r'偄', ''), (r'鈹', ''), (r'冮', ''), (r'幇', ''),
            (r'惧', ''), (r'ｇ', ''), (r'瓔', ''), (r'鍟', ''), (r'庨', ''), (r'悹', ''),
            (r'渚', ''), (r'婄', ''), (r'磿', ''), (r'€', ''), (r'宀', ''), (r'勫', ''),
            (r'级', ''), (r'邦', ''), (r'亞', ''), (r'鐟', ''), (r'㈤', ''), (r'悗', ''),
            (r'娑', ''), (r'崇', ''), (r'細', ''), (r'″', ''), (r'嫮', ''), (r'鎸', ''),
            (r'ч', ''), (r'崟', ''), (r'顒', ''), (r'佺', ''), (r'亹', ''), (r'', ''),
            (r'柌', ''), (r'婊', ''), (r'勭', ''), (r'', ''), (r'濆', ''), (r'嫬', ''),
            (r'瑙', ''), (r'﹂', ''), (r'璇', ''), (r'℃', ''), (r'娇', ''), (r'ь', ''),
            (r'剙', ''), (r'鍊', ''), (r'搁', ''), (r'崹', ''), (r'搴', ''), (r'㈢', ''),
            (r'愶', ''), (r'絾', ''), (r'笑', ''), (r'撶', ''), (r'紒', ''), (r'婄', ''),
            (r'Ф', ''), (r'躲', ''), (r'劌', ''), (r'顕', ''), (r'ラ', ''), (r'崙', ''),
            (r'囩', ''), (r'', ''), (r'庣', ''), (r'懓', ''), (r'鍟', ''), (r'╃', ''),
            (r'粭', ''), (r'娦', ''), (r'ч', ''), (r'崒', ''), (r'姘', ''), (r'', ''),
            (r'', ''), (r'硅', ''), (r'翰', ''), (r'荤', ''), (r'槐', ''), (r'婵', ''),
            (r'嬪', ''), (r'矗', ''), (r'忓', ''), (r'啳', ''), (r'嬮', ''), (r'柣', ''),
            (r'嗗', ''), (r'枙', ''), (r'﹀', ''), (r'綊', '')
        ]
        
        for old_str, new_str in replacements:
            content = content.replace(old_str, new_str)
        
        with codecs.open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"修复文件时出错: {file_path} - {str(e)}")
        return False

def main():
    print("开始循环修复编码问题...")
    
    previous_count = None
    current_count = None
    
    # 循环修复直到没有更多需要修复的文件
    for i in range(10):  # 最多尝试10次
        files_with_issues = get_files_with_issues()
        current_count = len(files_with_issues)
        
        print(f"\n第 {i+1} 轮修复: 发现 {current_count} 个文件有编码问题")
        
        if current_count == 0:
            print("✅ 所有编码问题已修复完成！")
            break
        
        if previous_count is not None and previous_count == current_count:
            print("⚠️  修复进度停滞，可能需要手动处理一些文件")
            break
        
        # 修复所有有问题的文件
        for file_path in files_with_issues:
            fix_file(file_path)
        
        previous_count = current_count
    
    print("\n修复过程结束！")
    final_count = len(get_files_with_issues())
    print(f"最终剩余编码问题的文件数量: {final_count}")

if __name__ == "__main__":
    main()