/**
 * 功能加载器 - 精简版
 * 只加载不干扰页面视觉的核心功能
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';

import './feature-pack-1.js?v=20260419a';
import './feature-pack-2.js?v=20260419a';
import './feature-pack-3.js?v=20260419a';

document.addEventListener('DOMContentLoaded', () => {
    const allowedFeatures = [
        'fp10_code_copy',
        'fp11_dark_toggle',
        'fp12_skeleton',
        'fp14_smooth_anchor',
        'fp60_console_logo',
        'fp78_theme_persist'
    ];

    Object.keys(FeaturePack.registry).forEach(id => {
        if (allowedFeatures.includes(id)) {
            FeaturePack.enabled.add(id);
        }
    });

    FeaturePack.initEnabled();
    console.log(`[FeaturePack] 已加载 ${FeaturePack.enabled.size} 个精选功能`);
});
