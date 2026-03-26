#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量为 HTML 文件添加 emoji 替换脚本
在 Windows 7 中显示文字，在 Windows 11/现代系统中显示 emoji
"""

import os
import re

# 定义 emoji 替换规则
EMOJI_MAP = {
    '🐱': '猫',
    '🏠': '首页',
    '🎮': '游戏',
    '☁️': '云',
    '☀️': '太阳',
    '❤️': '爱心',
    '🎯': '关于',
    '💬': '消息',
    '🔔': '通知',
    '👤': '用户',
    '📝': '编辑',
    '⬆️': '升级',
    '🖼️': '图片',
    '✍️': '写作',
    '⚙️': '设置',
    '🚪': '退出',
    '💡': '提示',
    '⚡': '经验',
    '🚀': '发布',
    '🎖️': '等级',
    '💪': '加油',
    '🔒': '锁定',
    '📜': '协议',
    '↑': '上',
    '↓': '下',
    '↩️': '撤销',
    '❓': '帮助',
    '🔄': '刷新',
    '▶️': '开始',
    '⏱️': '时间',
    '🎨': '创意',
    '💻': '电脑',
    '📚': '学习',
    '🛡️': '盾牌',
    '✈️': '飞机',
    '⭐': '星星',
    '🕹️': '手柄',
    '📧': '邮箱',
    '📱': '手机',
    '📑': '目录',
    '📦': '压缩',
    '📄': '文件',
    '📙': 'PPT',
    '🔧': '工具',
    '🪙': '硬币',
    '💰': '金币',
    '✅': '完成',
    '🛠️': '工具',
    '💫': '星光',
    '🔍': '搜索',
    '📖': '书籍',
    '🏷️': '标签',
    '🗑️': '删除',
}

# 需要处理的文件列表
FILES_TO_PROCESS = [
    '404.html',
    'about.html',
    'article.html',
    'coins.html',
    'drive.html',
    'editor.html',
    'entertainment.html',
    'gallery.html',
    'games.html',
    'index-chinese.html',
    'level-guide.html',
    'offline.html',
    'messages.html',
    'privacy.html',
    'profile.html',
    'tags.html',
    'terms.html',
    'test-email.html',
    'welcome.html',
    '管理/index.html',
    'games/snake/index.html',
    'games/2048/index.html',
    'tanchishe/index.html',
    'xidengyouxi/index.html',
]

# JavaScript 代码模板 - 用于检测 Win7 并替换 emoji
JS_TEMPLATE = '''
<!-- Win7 Emoji 兼容性处理 -->
<script>
(function() {
    // 检测是否为 Windows 7
    function isWindows7() {
        var ua = navigator.userAgent;
        return ua.indexOf('Windows NT 6.1') !== -1 || 
               ua.indexOf('Windows 7') !== -1;
    }
    
    // Emoji 替换映射表
    var emojiMap = {MAP_PLACEHOLDER};
    
    // 替换页面中的 emoji
    function replaceEmojis() {
        if (!isWindows7()) return;
        
        // 替换文本节点
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        var node;
        while (node = walker.nextNode()) {
            var text = node.textContent;
            var hasEmoji = false;
            for (var emoji in emojiMap) {
                if (text.indexOf(emoji) !== -1) {
                    text = text.split(emoji).join(emojiMap[emoji]);
                    hasEmoji = true;
                }
            }
            if (hasEmoji) {
                node.textContent = text;
            }
        }
        
        // 替换属性中的 emoji（如 title, alt 等）
        var elements = document.querySelectorAll('*');
        var attrs = ['title', 'alt', 'placeholder', 'value'];
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            for (var j = 0; j < attrs.length; j++) {
                var attr = attrs[j];
                if (el.hasAttribute(attr)) {
                    var val = el.getAttribute(attr);
                    var hasEmoji = false;
                    for (var emoji in emojiMap) {
                        if (val.indexOf(emoji) !== -1) {
                            val = val.split(emoji).join(emojiMap[emoji]);
                            hasEmoji = true;
                        }
                    }
                    if (hasEmoji) {
                        el.setAttribute(attr, val);
                    }
                }
            }
        }
    }
    
    // DOM 加载完成后执行替换
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceEmojis);
    } else {
        replaceEmojis();
    }
})();
</script>
'''


def generate_js_code():
    """生成 JavaScript 映射表代码"""
    map_items = []
    for emoji, text in EMOJI_MAP.items():
        # 处理特殊字符转义
        safe_text = text.replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"')
        map_items.append(f'        "{emoji}": "{safe_text}"')
    
    map_code = '{\n' + ',\n'.join(map_items) + '\n    }'
    return JS_TEMPLATE.replace('{MAP_PLACEHOLDER}', map_code)


def process_file(file_path, js_code):
    """处理单个 HTML 文件"""
    try:
        if not os.path.exists(file_path):
            print(f"[WARN] 文件不存在: {file_path}")
            return False

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查是否已经添加过该脚本
        if 'Win7 Emoji 兼容性处理' in content:
            print(f"[SKIP] 已处理过: {file_path}")
            return False

        # 检查文件是否包含 emoji
        has_emoji = any(emoji in content for emoji in EMOJI_MAP.keys())
        if not has_emoji:
            print(f"[SKIP] 无 emoji: {file_path}")
            return False

        # 在 </body> 或 </html> 前插入脚本
        if '</body>' in content:
            content = content.replace('</body>', js_code + '\n</body>')
        elif '</html>' in content:
            content = content.replace('</html>', js_code + '\n</html>')
        else:
            # 如果没有 body 或 html 结束标签，追加到文件末尾
            content += js_code

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"[OK] 已添加 Win7 兼容脚本: {file_path}")
        return True

    except Exception as e:
        print(f"[ERROR] 处理失败 {file_path}: {str(e)}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("开始为 HTML 文件添加 Win7 Emoji 兼容性处理")
    print("=" * 60)

    js_code = generate_js_code()
    processed_count = 0
    modified_count = 0

    for file_path in FILES_TO_PROCESS:
        processed_count += 1
        if process_file(file_path, js_code):
            modified_count += 1

    print()
    print("=" * 60)
    print(f"处理完成: 共 {processed_count} 个文件, {modified_count} 个文件已修改")
    print("=" * 60)


if __name__ == '__main__':
    main()
