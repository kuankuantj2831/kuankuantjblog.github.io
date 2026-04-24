/**
 * 功能 18: 随机名言警句
 * 每次刷新在控制台输出一条名言
 */
(function() {
    var quotes = [
        '学而不思则罔，思而不学则殆。 —— 孔子',
        '天行健，君子以自强不息。 —— 《周易》',
        '知之者不如好之者，好之者不如乐之者。 —— 孔子',
        '三人行，必有我师焉。 —— 孔子',
        '业精于勤，荒于嬉。 —— 韩愈',
        '读书破万卷，下笔如有神。 —— 杜甫',
        '不积跬步，无以至千里。 —— 荀子',
        '千里之行，始于足下。 —— 老子',
        '生活不止眼前的苟且，还有诗和远方。',
        'Talk is cheap. Show me the code. —— Linus Torvalds',
        'Stay hungry, stay foolish. —— Steve Jobs',
        'The best way to predict the future is to invent it. —— Alan Kay',
        'Code is like humor. When you have to explain it, it\'s bad. —— Cory House'
    ];
    var q = quotes[Math.floor(Math.random() * quotes.length)];
    console.log('%c💡 ' + q, 'color:#667eea;font-size:14px;font-style:italic;padding:10px;');
})();
