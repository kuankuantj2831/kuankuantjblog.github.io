import { FeaturePack } from './feature-pack-core.js';

const el = FeaturePack.util.el;

/**
 * ================================================
 * Feature Pack #39: 翻译与语言 (191-195)
 * ================================================
 */

// 191. 划词翻译
FeaturePack.register('fp191_text_translate', {
    name: '🌐 划词翻译',
    desc: '选中文字显示翻译按钮',
    page: 'article',
    initFn() {
        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (!text || text.length < 2 || text.length > 100) {
                const existing = document.getElementById('fp-translate-popup');
                if (existing) existing.remove();
                return;
            }
            const existing = document.getElementById('fp-translate-popup');
            if (existing) existing.remove();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const isEnglish = /^[a-zA-Z\s]+$/.test(text);
            const isChinese = /[\u4e00-\u9fa5]/.test(text);
            let translated = '';
            if (isEnglish) {
                const dict = {
                    'hello': '你好', 'world': '世界', 'love': '爱', 'time': '时间',
                    'money': '金钱', 'friend': '朋友', 'family': '家庭', 'work': '工作',
                    'happy': '快乐', 'sad': '悲伤', 'good': '好', 'bad': '坏'
                };
                const lower = text.toLowerCase();
                translated = dict[lower] || `[${text}] (模拟翻译：需要API支持)`;
            } else if (isChinese) {
                translated = `[${text}] (模拟翻译：Chinese text)`;
            } else {
                translated = `[${text}] (自动检测中...)`;
            }
            const popup = el('div', {
                id: 'fp-translate-popup',
                style: `position:fixed; top:${rect.bottom + 5 + window.scrollY}px; left:${Math.min(rect.left + window.scrollX, window.innerWidth - 280)}px; background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:10px; box-shadow:0 4px 20px rgba(0,0,0,0.15); z-index:9999; max-width:280px; font-size:13px;`
            }, [
                el('div', { style: 'font-size:11px; color:#2196f3; font-weight:600; margin-bottom:4px;' }, '🌐 翻译'),
                el('div', { style: 'color:#333; margin-bottom:4px; word-break:break-all;' }, text),
                el('div', { style: 'color:#666; font-size:12px; border-top:1px solid #eee; padding-top:4px;' }, translated),
                el('button', {
                    style: 'position:absolute; top:4px; right:4px; background:none; border:none; font-size:14px; cursor:pointer; color:#999;',
                    onclick: () => popup.remove()
                }, '✕')
            ]);
            document.body.appendChild(popup);
        });
    }
});

// 192. 语言检测
FeaturePack.register('fp192_language_detect', {
    name: '🔍 语言检测',
    desc: '检测文本语言类型',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#f5f5f5 0%,#eeeeee 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#424242; font-weight:600; margin-bottom:8px;' }, '🔍 语言检测器'),
            el('input', {
                id: 'lang-detect-input',
                placeholder: '输入文字检测语言...',
                style: 'width:100%; padding:8px; border:1px solid #bdbdbd; border-radius:6px; font-size:12px; box-sizing:border-box; margin-bottom:8px;',
                oninput: function() {
                    const text = this.value;
                    const result = document.getElementById('lang-detect-result');
                    if (!text) { result.textContent = ''; return; }
                    let lang = '未知';
                    let emoji = '❓';
                    if (/^[\u4e00-\u9fa5]+$/.test(text)) { lang = '中文'; emoji = '🇨🇳'; }
                    else if (/^[a-zA-Z\s.,!?]+$/.test(text)) { lang = '英文'; emoji = '🇬🇧'; }
                    else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) { lang = '日文'; emoji = '🇯🇵'; }
                    else if (/[\uAC00-\uD7AF]/.test(text)) { lang = '韩文'; emoji = '🇰🇷'; }
                    else if (/[а-яА-ЯёЁ]/.test(text)) { lang = '俄文'; emoji = '🇷🇺'; }
                    else if (/[\u0600-\u06FF]/.test(text)) { lang = '阿拉伯文'; emoji = '🇸🇦'; }
                    else if (/[äöüß]/.test(text)) { lang = '德文'; emoji = '🇩🇪'; }
                    else if (text.length > 0) { lang = '混合/其他'; emoji = '🌍'; }
                    result.innerHTML = `<span style="font-size:20px;">${emoji}</span> <strong style="color:#1565c0;">${lang}</strong>`;
                }
            }),
            el('div', { id: 'lang-detect-result', style: 'font-size:14px; text-align:center; min-height:24px;' })
        ]);
        container.after(widget);
    }
});

// 193. 拼音转换
FeaturePack.register('fp193_pinyin_convert', {
    name: '📝 拼音转换',
    desc: '汉字转拼音',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const simplePinyin = {
            '你': 'nǐ', '好': 'hǎo', '世': 'shì', '界': 'jiè', '爱': 'ài', '中': 'zhōng', '国': 'guó',
            '人': 'rén', '天': 'tiān', '地': 'dì', '大': 'dà', '小': 'xiǎo', '明': 'míng', '白': 'bái',
            '学': 'xué', '生': 'shēng', '老': 'lǎo', '师': 'shī', '朋': 'péng', '友': 'yǒu', '家': 'jiā',
            '快': 'kuài', '乐': 'lè', '幸': 'xìng', '福': 'fú', '美': 'měi', '丽': 'lì', '帅': 'shuài',
            '文': 'wén', '章': 'zhāng', '网': 'wǎng', '站': 'zhàn', '博': 'bó', '客': 'kè', '的': 'de'
        };
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#c2185b; font-weight:600; margin-bottom:8px;' }, '📝 拼音转换器'),
            el('input', {
                placeholder: '输入汉字...',
                style: 'width:100%; padding:8px; border:1px solid #f48fb1; border-radius:6px; font-size:12px; box-sizing:border-box; margin-bottom:8px;',
                oninput: function() {
                    const text = this.value;
                    const result = document.getElementById('pinyin-result');
                    if (!text) { result.textContent = ''; return; }
                    let pinyin = '';
                    for (const char of text) {
                        pinyin += (simplePinyin[char] || char) + ' ';
                    }
                    result.textContent = pinyin.trim();
                }
            }),
            el('div', { id: 'pinyin-result', style: 'font-size:13px; color:#880e4f; background:#fff; padding:8px; border-radius:4px; min-height:20px; word-break:break-all;' }),
            el('div', { style: 'font-size:10px; color:#ec407a; margin-top:6px; text-align:center;' }, '💡 支持常用汉字，复杂字需联网API')
        ]);
        container.after(widget);
    }
});

// 194. 摩斯电码
FeaturePack.register('fp194_morse_code', {
    name: '📻 摩斯电码',
    desc: '文本与摩斯电码互转',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const morseMap = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', ' ': '/'
        };
        const reverseMap = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#283593; font-weight:600; margin-bottom:8px;' }, '📻 摩斯电码'),
            el('input', {
                placeholder: '输入文字或摩斯电码...',
                style: 'width:100%; padding:8px; border:1px solid #9fa8da; border-radius:6px; font-size:12px; box-sizing:border-box; margin-bottom:8px;',
                oninput: function() {
                    const text = this.value.trim();
                    const result = document.getElementById('morse-result');
                    if (!text) { result.textContent = ''; return; }
                    if (text.includes('.') || text.includes('-')) {
                        // decode
                        const decoded = text.split(' ').map(c => reverseMap[c] || c).join('');
                        result.textContent = `解码: ${decoded}`;
                    } else {
                        // encode
                        const encoded = text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
                        result.textContent = `编码: ${encoded}`;
                    }
                }
            }),
            el('div', { id: 'morse-result', style: 'font-size:13px; color:#1a237e; background:#fff; padding:8px; border-radius:4px; min-height:20px; font-family:monospace; word-break:break-all;' }),
            el('div', { style: 'font-size:10px; color:#5c6bc0; margin-top:6px; text-align:center;' }, '💡 输入纯字母数字自动编码，输入.和-自动解码')
        ]);
        container.after(widget);
    }
});

// 195. 盲文转换
FeaturePack.register('fp195_braille_convert', {
    name: '⠃⠗ 盲文转换',
    desc: '文字与盲文互转',
    page: 'profile',
    initFn() {
        const container = document.querySelector('.user-card-stats');
        if (!container) return;
        const brailleMap = {
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓',
            'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏',
            'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
            'y': '⠽', 'z': '⠵', ' ': ' ', '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
            '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚'
        };
        const widget = el('div', {
            style: 'margin-top:10px; padding:12px; background:linear-gradient(135deg,#fff8e1 0%,#ffecb3 100%); border-radius:8px;'
        }, [
            el('div', { style: 'font-size:13px; color:#f57f17; font-weight:600; margin-bottom:8px;' }, '⠃⠗ 盲文转换器'),
            el('input', {
                placeholder: '输入文字...',
                style: 'width:100%; padding:8px; border:1px solid #ffd54f; border-radius:6px; font-size:12px; box-sizing:border-box; margin-bottom:8px;',
                oninput: function() {
                    const text = this.value;
                    const result = document.getElementById('braille-result');
                    if (!text) { result.textContent = ''; return; }
                    const braille = text.toLowerCase().split('').map(c => brailleMap[c] || '⣿').join('');
                    result.textContent = braille;
                }
            }),
            el('div', { id: 'braille-result', style: 'font-size:18px; color:#e65100; background:#fff; padding:12px; border-radius:4px; min-height:30px; text-align:center; letter-spacing:4px;' }),
            el('div', { style: 'font-size:10px; color:#ff8f00; margin-top:6px; text-align:center;' }, '💡 支持英文字母和数字的盲文转换')
        ]);
        container.after(widget);
    }
});
