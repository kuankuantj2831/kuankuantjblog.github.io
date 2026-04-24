/**
 * 功能 47: 随机问候语
 * 根据时间段显示不同的问候语
 */
(function() {
    var hour = new Date().getHours();
    var greeting, emoji;
    if (hour < 6) { greeting = '夜深了，注意休息'; emoji = '🌙'; }
    else if (hour < 9) { greeting = '早上好，新的一天开始了'; emoji = '🌅'; }
    else if (hour < 12) { greeting = '上午好，精力充沛'; emoji = '☀️'; }
    else if (hour < 14) { greeting = '中午好，记得吃饭'; emoji = '🍱'; }
    else if (hour < 17) { greeting = '下午好，继续加油'; emoji = '💪'; }
    else if (hour < 19) { greeting = '傍晚好，辛苦了一天'; emoji = '🌇'; }
    else if (hour < 22) { greeting = '晚上好，放松一下'; emoji = '🌃'; }
    else { greeting = '夜深了，早点休息'; emoji = '😴'; }
    console.log('%c' + emoji + ' ' + greeting, 'color:#667eea;font-size:16px;font-weight:bold;padding:10px;');
})();
