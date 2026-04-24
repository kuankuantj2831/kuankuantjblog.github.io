/**
 * 功能 5: 页面可见性检测 - 切换标签页时改变标题
 * 用户离开页面时显示挽留文案，回来时显示欢迎
 */
(function() {
    var originalTitle = document.title;
    var leaveMessages = ['别走啊~ 😢', '想你了...💕', '快回来看看~', '页面在等你 🥺'];
    var backMessages = ['欢迎回来! 🎉', '你回来啦~ ❤️', '继续探索吧! 🚀'];

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            document.title = leaveMessages[Math.floor(Math.random() * leaveMessages.length)];
        } else {
            var msg = backMessages[Math.floor(Math.random() * backMessages.length)];
            document.title = msg;
            setTimeout(function() {
                document.title = originalTitle;
            }, 2000);
        }
    });
})();
