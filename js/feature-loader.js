/**
 * 功能加载器 - 精简版
 * 只加载不干扰页面视觉的核心功能，其余按需禁用
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';

// 只加载核心功能包（UI增强1-5、阅读增强6-10、性能11-15）
import './feature-pack-1.js?v=20260419a';
import './feature-pack-2.js?v=20260419a';
import './feature-pack-3.js?v=20260419a';

// 不再批量加载所有60个功能包，避免页面信息过载
// 如需恢复某个功能包，在此添加 import 即可

document.addEventListener('DOMContentLoaded', () => {
    // 默认禁用所有功能，只启用白名单内的
    const allowedFeatures = [
        'fp01_online_counter',
        'fp02_read_progress',
        'fp10_code_copy',
        'fp11_dark_toggle',
        'fp12_skeleton',
        'fp14_smooth_anchor',
        'fp17_live_clock',
        'fp28_word_count',
        'fp31_visit_counter',
        'fp47_time_greeting',
        'fp49_load_time',
        'fp60_console_logo',
        'fp78_theme_persist',
        'fp81_scroll_spy',
        'fp082_img_load_stats'
    ];

    Object.keys(FeaturePack.registry).forEach(id => {
        if (allowedFeatures.includes(id)) {
            FeaturePack.enabled.add(id);
        }
    });

    FeaturePack.initEnabled();
    console.log(`[FeaturePack] 已加载 ${FeaturePack.enabled.size} 个精选功能`);
});
