#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
使用 Python 修复 HTML 文件编码问题的脚本
"""

import os
import re
import codecs

def fix_encoding(file_path):
    """修复单个文件的编码问题"""
    try:
        # 尝试使用不同的编码读取文件
        encodings = ['utf-8', 'gbk', 'gb18030', 'utf-16']
        
        content = None
        used_encoding = None
        
        for encoding in encodings:
            try:
                with codecs.open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                used_encoding = encoding
                break
            except:
                continue
        
        if content is None:
            print("无法读取文件: " + file_path)
            return False
        
        # 定义常见的乱码字符替换规则
        replacements = [
            # 常见的乱码字符序列
            (r'閴\?', ''),
            (r'鏇村', '更多'),
            (r'鍔熻', '功能'),
            (r'鐨勭', '的猫'),
            (r'鐖', '爬架'),
            (r'灏楃埇鏋额剚', '猫爬架'),
            (r'鏇村', '更多'),
            (r'鏇村', '更多'),
            (r'鍔熻鍏橀', '功能'),
            (r'閸栧搫鐓?', '区域'),
            (r'閸斻劎鏁鹃', '动画'),
            (r'棣冃?', '📌'),
            (r'棣冩憫', '📝'),
            (r'棣冩尠', '👥'),
            (r'棣冩憥', '🗺️'),
            (r'鐠侊紕鐣婚', '计算'),
            (r'璁＄畻鍣?', '计算器'),
            (r'瀵板懎濮欐禍瀣', '待办'),
            (r'寰呭姙浜嬮', '待办事项'),
            (r'缁楁棁顔囧', '笔记'),
            (r'婢垛晜鐨甸', '天气'),
            (r'澶╂皵鏌ヨ', '天气查询'),
            (r'缂堟槒鐦у', '翻译'),
            (r'閹绘劒绶甸', '提供'),
            (r'閹恒垻鍌?', '探索'),
            (r'閹绘劒绶靛', '提供'),
            (r'閹绘劒绶甸幍', '提供'),
            (r'閹绘劒绶甸梹', '提供'),
            (r'閹绘劒绶电€', '提供'),
            (r'閹绘劒绶甸崥', '提供'),
            (r'閹绘劒绶甸崺', '提供'),
            (r'閹绘劒绶甸崚', '提供'),
            (r'閹绘劒绶甸崐', '提供'),
            (r'閹绘劒绶甸幍', '提供'),
            (r'閹绘劒绶甸梹', '提供'),
            (r'閹绘劒绶电€', '提供'),
            (r'閹绘劒绶甸崥', '提供'),
            (r'閹绘劒绶甸崺', '提供'),
            (r'閹绘劒绶甸崚', '提供'),
            (r'閹绘劒绶甸崐', '提供'),
            (r'閺€顖涘瘮', '支持'),
            (r'閺€顖涘瘮婢', '支持'),
            (r'閺€顖涘瘮婢舵', '支持'),
            (r'閺€顖涘瘮婢舵氨', '支持'),
            (r'閼奉亜濮╂', '自动'),
            (r'閼奉亜濮╂穱', '自动保存'),
            (r'閼藉顭堢', '草稿'),
            (r'閼藉顭堢粻', '草稿管理'),
            (r'鐎圭偞妞傛', '实时'),
            (r'鐎圭偞妞傛径', '实时查询'),
            (r'鐎圭偞妞傞懕', '实时聊天'),
            (r'鐎圭偞妞傞懕濠傘', '实时聊天'),
            (r'鐎规碍妞傞', '定时'),
            (r'鐎规碍妞傞崣', '定时发布'),
            (r'鐎靛本鏋冮', '文档'),
            (r'鐎靛本鏋冮張', '文档编辑器'),
            (r'鐎靛棛鐖滈', '密码'),
            (r'鐎靛棛鐖滈悽', '密码生成'),
            (r'鐎靛棛鐖滈悽鐔稿', '密码生成器'),
            (r'娴滃瞼娣', '二维'),
            (r'娴滃瞼娣惍', '二维码'),
            (r'娴滃瞼娣惍浣', '二维码生成'),
            (r'娴滃瞼娣惍浣烘', '二维码生成器'),
            (r'閺傚洦婀扮€', '文本'),
            (r'閺傚洦婀扮€佃', '文本'),
            (r'閺傚洦婀扮€佃', '文本'),
            (r'閺傚洦婀扮€佃鐦', '文本'),
            (r'閺傚洦婀扮€佃鐦?', '文本'),
            (r'JSON閺嶇', 'JSON'),
            (r'JSON閺嶇厧', 'JSON格式'),
            (r'SON閺嶇厧', 'JSON格式'),
            (r'閺嶇厧绱￠', '格式化'),
            (r'SON閺佺増', '数据'),
            (r'閺佺増宓?', '数据'),
            (r'鐠囶厽纭堕', '语法'),
            (r'鐠囶叀鈻堥', '语言'),
            (r'鐠囶叀鈻堥惃', '语言'),
            (r'鐠囶叀鈻堥惃鍕', '语言'),
            (r'閹诡澀绗夐', '颜色'),
            (r'閹诡澀绗夐崥', '颜色'),
            (r'妫版粏澹婇', '颜色'),
            (r'妫版粏澹婇柅', '颜色'),
            (r'妫版粏澹婇柅澶嬪', '颜色'),
            (r'妫版粏澹婇柅澶嬪', '颜色'),
            (r'閸楁洑缍呮', '单位'),
            (r'閸楁洑缍呮潪', '单位转换'),
            (r'閸楁洑缍呴', '单位转换'),
            (r'閸楁洑缍呴惃', '单位转换'),
            (r'Base64缂傛', 'Base64'),
            (r'Base64缂傛牜', 'Base64编码'),
            (r'缂傛牜鐖滅', '编码'),
            (r'缂傛牞绶', '编辑'),
            (r'娴狅絿鐖滄', '代码'),
            (r'娴狅絿鐖滄', '代码高亮'),
            (r'鐎圭偞妞傛０', '实时'),
            (r'鐎圭偞妞傛０鍕', '实时预览'),
            (r'閼奉亜濮╂穱', '自动保存'),
            (r'閸ュ墽澧栨稉', '图片'),
            (r'閸ュ墽澧栨稉濠佺', '图片上传'),
            (r'閺傚洣娆㈤', '文件'),
            (r'閺傚洣娆㈤梽', '文件'),
            (r'閺嶅洨顒风', '标签'),
            (r'閺嶅洨顒风粻', '标签管理'),
            (r'閸掑棛琚', '分类'),
            (r'閸掑棛琚', '分类管理'),
            (r'濞戝牊浼呯', '消息'),
            (r'濞戝牊浼呯化', '消息系统'),
            (r'鐠囧嫯顔戠', '评论'),
            (r'鐠囧嫯顔戠化', '评论系统'),
            (r'缁€鎯у隘', '社区'),
            (r'缁€鎯у隘閸', '社区'),
            (r'閸旂姴鍙嗛', '加入'),
            (r'閸旂姴鍙嗛崪', '加入社区'),
        ]
        
        # 执行替换
        for old_str, new_str in replacements:
            content = re.sub(old_str, new_str, content)
        
        # 保存修复后的内容
        with codecs.open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("修复成功: " + file_path)
        return True
        
    except Exception as e:
        print("修复失败: " + file_path + " - " + str(e))
        return False

def main():
    # 遍历所有 HTML 文件
    root_dir = r"C:\Users\asus\Desktop\my-blog"
    html_files = []
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".html") and "node_modules" not in root and "test" not in root:
                html_files.append(os.path.join(root, file))
    
    print("找到 " + str(len(html_files)) + " 个 HTML 文件需要检查")
    
    success_count = 0
    for file_path in html_files:
        if fix_encoding(file_path):
            success_count += 1
    
    print("\n修复完成！成功修复了 " + str(success_count) + " 个文件")
    print("剩余未修复的文件: " + str(len(html_files) - success_count) + " 个")

if __name__ == "__main__":
    main()