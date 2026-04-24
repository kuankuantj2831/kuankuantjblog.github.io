/**
 * 功能 39: 文本朗读（TTS）
 * 选中文字后可以朗读
 */
(function() {
    window.readAloud = function(text) {
        if (!text) text = window.getSelection().toString();
        if (!text) { alert('请先选中要朗读的文字'); return; }
        if (!window.speechSynthesis) { alert('浏览器不支持语音合成'); return; }
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };
    window.stopReading = function() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
})();
