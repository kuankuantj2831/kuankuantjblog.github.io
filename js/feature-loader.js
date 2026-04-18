/**
 * 功能加载器 - 加载所有200个功能
 */
import FeaturePack from './feature-pack-core.js';

// 导入所有40个功能包
import './feature-pack-1.js';
import './feature-pack-2.js';
import './feature-pack-3.js';
import './feature-pack-4.js';
import './feature-pack-5.js';
import './feature-pack-6.js';
import './feature-pack-7.js';
import './feature-pack-8.js';
import './feature-pack-9.js';
import './feature-pack-10.js';
import './feature-pack-11.js';
import './feature-pack-12.js';
import './feature-pack-13.js';
import './feature-pack-14.js';
import './feature-pack-15.js';
import './feature-pack-16.js';
import './feature-pack-17.js';
import './feature-pack-18.js';
import './feature-pack-19.js';
import './feature-pack-20.js';
import './feature-pack-21.js';
import './feature-pack-22.js';
import './feature-pack-23.js';
import './feature-pack-24.js';
import './feature-pack-25.js';
import './feature-pack-26.js';
import './feature-pack-27.js';
import './feature-pack-28.js';
import './feature-pack-29.js';
import './feature-pack-30.js';
import './feature-pack-31.js';
import './feature-pack-32.js';
import './feature-pack-33.js';
import './feature-pack-34.js';
import './feature-pack-35.js';
import './feature-pack-36.js';
import './feature-pack-37.js';
import './feature-pack-38.js';
import './feature-pack-39.js';
import './feature-pack-40.js';

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
