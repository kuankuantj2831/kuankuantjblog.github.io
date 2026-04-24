/**
 * 功能 34: 自动检测并高亮当前导航项
 * 根据当前URL自动高亮对应的导航链接
 */
(function() {
    function init(){
        var path=location.pathname;
        document.querySelectorAll('nav a, .nav-links a, .nav-link').forEach(function(a){
            var href=a.getAttribute('href');
            if(!href)return;
            if(href===path||path.endsWith(href)||
               (href.includes('index')&&(path==='/'||path.endsWith('/')))){
                a.classList.add('active');
                a.style.fontWeight='700';
            }
        });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
    else init();
})();
