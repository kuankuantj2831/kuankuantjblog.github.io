#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
全面修复所有剩余的乱码问题
"""

import os
import re
import codecs

def fix_remaining_issues():
    """修复剩余的乱码问题"""
    
    root_dir = r"C:\Users\asus\Desktop\my-blog"
    html_files = []
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".html") and "node_modules" not in root and "test" not in root:
                html_files.append(os.path.join(root, file))
    
    print(f"找到 {len(html_files)} 个 HTML 文件需要检查")
    
    success_count = 0
    
    # 定义更强大的修复规则
    replacements = [
        # 修复常见的乱码字符序列
        (r'闁汇劌瀚亸妤呮偉椤掍胶浠?', '的个人博客'),
        (r'濞戞挴鍋撳☉鎿冧簻閸ㄥ孩绂嶉銈囨そ', '分享技术内容'),
        (r'缂佸顑嗘俊褔寮甸妯峰亾', '文章分享'),
        (r'娴ｅ湱鍩楅柟鏉戠箺', '技术分享'),
        (r'缁侇偄鈹冮幇鈹惧亾', '学习交流'),
        (r'娴ｇ瓔鍟庨悹渚婄磿', '编程'),
        (r'缁€宀勫级閹邦亞鐟㈤悗', '技术相关'),
        (r'娑崇細缁″嫮鎸ч崟顒佺亹', '开发工具'),
        (r'闁汇劌瀚柌婊勭', '前端开发'),
        (r'閸濆嫬瑙﹂悗璇℃娇', '后端开发'),
        (r'閳ь剙鍊搁崹搴㈢', '全栈开发'),
        (r'椤愶絾笑濞戞挴鍋撶紒', '工具'),
        (r'澶婄Ф缁躲劌顕ラ崙', '编程学习'),
        (r'銈囩閻庣懓鍟╃粭', '学习资料'),
        (r'澶娦ч崒姘闁硅翰', '技术教程'),
        (r'鍎荤槐婵嬪矗椤忓啳', '编程知识'),
        (r'绀嬮柣顏嗗枙閻﹀綊', '编程'),
        (r'闁绘凹鍋嗛崺鍥', '首页'),
        (r'濞戞搩浜欏Ч澶愬础', '技术博客'),
        (r'濮橆剦鍚?', '博客'),
        (r'缂傚倹鐗滈埢濂稿', '学习'),
        (r'箮閳ь剟寮?', '分享'),
        (r'婵炴挸鎲￠崹娆', '游戏开发'),
        (r'戞導閸曨剛鐖?', '编程项目'),
        (r'mcock.cn', 'mcock.cn'),
        (r'闁告帒妫旈棅鈺冪磽', 'Hakimi'),
        (r'閺嶎偀鏌ら柟鍨涘亾', '个人博客'),
        (r'闁哄牜鍨埀顑跨劍', '编程'),
        (r'鍫曞箣韫囨氨銈', '开发'),
        (r'繝褎鍔戦埀顑挎祰', '程序员'),
        (r'椤旀洜鎷嬮敍鍕', '开发者'),
        (r'槺闁哄鍔掔粭', '学习'),
        (r'宀€鈧冻缂氱弧', '分享'),
        (r'鍕導閸曨剚鐏愰', '编程'),
        (r'柣銊ュ闁叉粍绂', '开发'),
        (r'嶉崫鍕Е閻?', '分享'),
        
        # 修复其他常见乱码
        (r'閴?', ''),
        (r'鏇村', '更多'),
        (r'鍔熻', '功能'),
        (r'鐨勭', '的猫'),
        (r'鐖', '爬架'),
        (r'灏楃埇鏋额剚', '猫爬架'),
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
    ]
    
    for file_path in html_files:
        try:
            # 读取文件内容
            with codecs.open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查是否包含需要修复的字符
            should_fix = False
            for old_str, new_str in replacements:
                if old_str in content:
                    should_fix = True
                    break
            
            if should_fix:
                # 执行替换
                for old_str, new_str in replacements:
                    content = content.replace(old_str, new_str)
                
                # 保存修复后的内容
                with codecs.open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                success_count += 1
                print(f"修复成功: {os.path.relpath(file_path, root_dir)}")
        
        except Exception as e:
            print(f"修复失败: {os.path.relpath(file_path, root_dir)} - {str(e)}")
    
    print(f"\n修复完成！成功修复了 {success_count} 个文件")
    print(f"剩余未修复的文件: {len(html_files) - success_count} 个")

def main():
    fix_remaining_issues()

if __name__ == "__main__":
    main()