#!/usr/bin/env python3
import os
import re
import sys

def check_links():
    """检查 features.html 文件中的所有链接是否指向存在的文件"""
    
    # 读取 features.html 文件
    features_html = 'features.html'
    if not os.path.exists(features_html):
        print("Error: File not found: features.html")
        return
    
    with open(features_html, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找所有 <a href="..."> 链接
    href_pattern = re.compile(r'<a href="([^"]+\.html)"')
    links = href_pattern.findall(content)
    
    print("Found %d HTML links" % len(links))
    print("-" * 50)
    
    broken_links = []
    
    for link in links:
        # 检查链接是否指向存在的文件
        if os.path.exists(link):
            print("OK: %s" % link)
        else:
            print("ERROR: %s - File not found" % link)
            broken_links.append(link)
    
    print("-" * 50)
    
    if broken_links:
        print("WARNING: Found %d broken links" % len(broken_links))
    else:
        print("SUCCESS: All links are valid")
    
    return broken_links

if __name__ == "__main__":
    check_links()
