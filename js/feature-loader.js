/**
 * 功能加载器 - 加载所有200个功能
 */
import FeaturePack from './feature-pack-core.js?v=20260418b';

// 导入所有40个功能包
import './feature-pack-1.js?v=20260418b';
import './feature-pack-2.js?v=20260418b';
import './feature-pack-3.js?v=20260418b';
import './feature-pack-4.js?v=20260418b';
import './feature-pack-5.js?v=20260418b';
import './feature-pack-6.js?v=20260418b';
import './feature-pack-7.js?v=20260418b';
import './feature-pack-8.js?v=20260418b';
import './feature-pack-9.js?v=20260418b';
import './feature-pack-10.js?v=20260418b';
import './feature-pack-11.js?v=20260418b';
import './feature-pack-12.js?v=20260418b';
import './feature-pack-13.js?v=20260418b';
import './feature-pack-14.js?v=20260418b';
import './feature-pack-15.js?v=20260418b';
import './feature-pack-16.js?v=20260418b';
import './feature-pack-17.js?v=20260418b';
import './feature-pack-18.js?v=20260418b';
import './feature-pack-19.js?v=20260418b';
import './feature-pack-20.js?v=20260418b';
import './feature-pack-21.js?v=20260418b';
import './feature-pack-22.js?v=20260418b';
import './feature-pack-23.js?v=20260418b';
import './feature-pack-24.js?v=20260418b';
import './feature-pack-25.js?v=20260418b';
import './feature-pack-26.js?v=20260418b';
import './feature-pack-27.js?v=20260418b';
import './feature-pack-28.js?v=20260418b';
import './feature-pack-29.js?v=20260418b';
import './feature-pack-30.js?v=20260418b';
import './feature-pack-31.js?v=20260418b';
import './feature-pack-32.js?v=20260418b';
import './feature-pack-33.js?v=20260418b';
import './feature-pack-34.js?v=20260418b';
import './feature-pack-35.js?v=20260418b';
import './feature-pack-36.js?v=20260418b';
import './feature-pack-37.js?v=20260418b';
import './feature-pack-38.js?v=20260418b';
import './feature-pack-39.js?v=20260418b';
import './feature-pack-40.js?v=20260418b';

// DOM就绪后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 默认启用所有功能
    Object.keys(FeaturePack.registry).forEach(id => {
        if (localStorage.getItem(`fp_${id}`) === null) {
            FeaturePack.enabled.add(id);
        }
    });
    FeaturePack.initAll();
    console.log(`[FeaturePack] 已加载 ${Object.keys(FeaturePack.registry).length} 个功能`);
});
