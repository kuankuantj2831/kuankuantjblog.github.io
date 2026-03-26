/**
 * 浏览器检测脚本 - 用于检测浏览器是否支持 ES Module
 * 通过检测 'noModule' 属性来判断浏览器对 ES Module 的支持情况
 */
(function() {
    'use strict';

    // 创建检测结果对象
    window.BrowserDetect = {
        // 检测是否支持 ES Module (使用 noModule 属性检测法)
        // 原理：如果浏览器支持 ES Module，则 script 元素会有 'noModule' 属性
        // 如果不支持，则 noModule 属性不存在或为 undefined
        supportsESModule: (function() {
            var script = document.createElement('script');
            return 'noModule' in script;
        })(),

        // 检测 Promise 支持
        supportsPromise: typeof Promise !== 'undefined',

        // 检测 Fetch API 支持
        supportsFetch: typeof fetch !== 'undefined',

        // 检测 localStorage 支持
        supportsLocalStorage: (function() {
            try {
                var test = '__test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        })(),

        // 获取浏览器信息
        getBrowserInfo: function() {
            var ua = navigator.userAgent;
            var browser = {
                name: 'Unknown',
                version: 'Unknown',
                isIE: false,
                isEdge: false,
                isChrome: false,
                isFirefox: false,
                isSafari: false
            };

            // 检测 IE
            if (ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1) {
                browser.isIE = true;
                browser.name = 'Internet Explorer';
                var match = ua.match(/(?:MSIE |rv:)(\d+\.?\d*)/);
                browser.version = match ? match[1] : 'Unknown';
            }
            // 检测 Edge Legacy
            else if (ua.indexOf('Edge/') > -1) {
                browser.isEdge = true;
                browser.name = 'Edge Legacy';
                var edgeMatch = ua.match(/Edge\/(\d+\.?\d*)/);
                browser.version = edgeMatch ? edgeMatch[1] : 'Unknown';
            }
            // 检测 Chrome
            else if (ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1) {
                browser.isChrome = true;
                browser.name = 'Chrome';
                var chromeMatch = ua.match(/Chrome\/(\d+\.?\d*)/);
                browser.version = chromeMatch ? chromeMatch[1] : 'Unknown';
            }
            // 检测 Firefox
            else if (ua.indexOf('Firefox/') > -1) {
                browser.isFirefox = true;
                browser.name = 'Firefox';
                var ffMatch = ua.match(/Firefox\/(\d+\.?\d*)/);
                browser.version = ffMatch ? ffMatch[1] : 'Unknown';
            }
            // 检测 Safari
            else if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) {
                browser.isSafari = true;
                browser.name = 'Safari';
                var sfMatch = ua.match(/Version\/(\d+\.?\d*)/);
                browser.version = sfMatch ? sfMatch[1] : 'Unknown';
            }
            // 检测 Edge Chromium
            else if (ua.indexOf('Edg/') > -1) {
                browser.isEdge = true;
                browser.name = 'Edge';
                var edgMatch = ua.match(/Edg\/(\d+\.?\d*)/);
                browser.version = edgMatch ? edgMatch[1] : 'Unknown';
            }

            return browser;
        },

        // 判断是否需要使用兼容模式
        needLegacyMode: function() {
            return !this.supportsESModule || !this.supportsPromise;
        }
    };

    // 在控制台输出检测结果（调试用）
    if (window.console && console.log) {
        console.log('[BrowserDetect] ES Module支持: ' + window.BrowserDetect.supportsESModule);
        console.log('[BrowserDetect] Promise支持: ' + window.BrowserDetect.supportsPromise);
        console.log('[BrowserDetect] Fetch支持: ' + window.BrowserDetect.supportsFetch);
        console.log('[BrowserDetect] 浏览器: ', window.BrowserDetect.getBrowserInfo());
        console.log('[BrowserDetect] 需要兼容模式: ' + window.BrowserDetect.needLegacyMode());
    }
})();
