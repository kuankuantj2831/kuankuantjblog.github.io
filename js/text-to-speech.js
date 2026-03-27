/**
 * 语音朗读 - Text to Speech
 * 将文章转换为语音朗读，支持多种设置
 */

class TextToSpeech {
    constructor(options = {}) {
        this.options = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            voice: null,
            autoScroll: true,
            highlightWords: true,
            ...options
        };
        
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.voices = [];
        this.currentWordIndex = 0;
        this.words = [];
        
        this.init();
    }
    
    init() {
        if (!this.synth) {
            console.warn('[语音朗读] 浏览器不支持语音合成');
            return;
        }
        
        this.loadVoices();
        this.createUI();
        this.bindEvents();
        this.injectStyles();
        
        console.log('[语音朗读] 系统已初始化');
    }
    
    /**
     * 加载语音列表
     */
    loadVoices() {
        this.voices = this.synth.getVoices();
        
        if (this.voices.length === 0) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
                this.populateVoiceSelect();
            };
        } else {
            this.populateVoiceSelect();
        }
    }
    
    /**
     * 填充语音选择器
     */
    populateVoiceSelect() {
        const select = document.getElementById('tts-voice-select');
        if (!select) return;
        
        select.innerHTML = '';
        
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            
            // 优先选择中文语音
            if (voice.lang.startsWith('zh')) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    }
    
    /**
     * 创建UI
     */
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'tts-panel';
        panel.className = 'tts-panel';
        panel.innerHTML = `
            <div class="tts-header">
                <span class="tts-icon">🔊</span>
                <span class="tts-title">语音朗读</span>
                <button class="tts-close">×</button>
            </div>
            <div class="tts-controls">
                <button class="tts-btn play-btn" title="播放/暂停">
                    <svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <svg class="pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                </button>
                <button class="tts-btn stop-btn" title="停止">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12"></rect>
                    </svg>
                </button>
            </div>
            <div class="tts-settings">
                <div class="setting-item">
                    <label>语速</label>
                    <input type="range" id="tts-rate" min="0.5" max="2" step="0.1" value="1">
                    <span class="setting-value">1.0x</span>
                </div>
                <div class="setting-item">
                    <label>音调</label>
                    <input type="range" id="tts-pitch" min="0.5" max="2" step="0.1" value="1">
                    <span class="setting-value">1.0</span>
                </div>
                <div class="setting-item">
                    <label>音量</label>
                    <input type="range" id="tts-volume" min="0" max="1" step="0.1" value="1">
                    <span class="setting-value">100%</span>
                </div>
                <div class="setting-item voice-select">
                    <label>语音</label>
                    <select id="tts-voice-select"></select>
                </div>
            </div>
            <div class="tts-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <span class="progress-text">0%</span>
            </div>
        `;
        
        // 插入到文章页面
        const article = document.querySelector('article, .article-content');
        if (article) {
            article.insertBefore(panel, article.firstChild);
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 播放/暂停
        document.querySelector('.play-btn').addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });
        
        // 停止
        document.querySelector('.stop-btn').addEventListener('click', () => {
            this.stop();
        });
        
        // 关闭
        document.querySelector('.tts-close').addEventListener('click', () => {
            this.stop();
            document.getElementById('tts-panel').style.display = 'none';
        });
        
        // 设置滑块
        const rateSlider = document.getElementById('tts-rate');
        rateSlider.addEventListener('input', (e) => {
            this.options.rate = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = this.options.rate.toFixed(1) + 'x';
        });
        
        const pitchSlider = document.getElementById('tts-pitch');
        pitchSlider.addEventListener('input', (e) => {
            this.options.pitch = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = this.options.pitch.toFixed(1);
        });
        
        const volumeSlider = document.getElementById('tts-volume');
        volumeSlider.addEventListener('input', (e) => {
            this.options.volume = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = Math.round(this.options.volume * 100) + '%';
        });
    }
    
    /**
     * 播放
     */
    play() {
        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.isPlaying = true;
            this.updateUI();
            return;
        }
        
        const article = document.querySelector('article, .article-content');
        if (!article) return;
        
        const text = article.textContent;
        this.words = text.split(/\s+/);
        
        this.utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语音
        const voiceSelect = document.getElementById('tts-voice-select');
        if (voiceSelect && this.voices[voiceSelect.value]) {
            this.utterance.voice = this.voices[voiceSelect.value];
        }
        
        // 设置参数
        this.utterance.rate = this.options.rate;
        this.utterance.pitch = this.options.pitch;
        this.utterance.volume = this.options.volume;
        
        // 绑定事件
        this.utterance.onstart = () => {
            this.isPlaying = true;
            this.updateUI();
        };
        
        this.utterance.onend = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentWordIndex = 0;
            this.updateUI();
        };
        
        this.utterance.onboundary = (e) => {
            this.updateProgress(e.charIndex / text.length);
        };
        
        this.synth.speak(this.utterance);
    }
    
    /**
     * 暂停
     */
    pause() {
        this.synth.pause();
        this.isPaused = true;
        this.isPlaying = false;
        this.updateUI();
    }
    
    /**
     * 停止
     */
    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentWordIndex = 0;
        this.updateUI();
        this.updateProgress(0);
    }
    
    /**
     * 更新UI
     */
    updateUI() {
        const playBtn = document.querySelector('.play-btn');
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        
        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playBtn.classList.add('playing');
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playBtn.classList.remove('playing');
        }
    }
    
    /**
     * 更新进度
     */
    updateProgress(percentage) {
        const fill = document.querySelector('.progress-fill');
        const text = document.querySelector('.progress-text');
        
        if (fill) fill.style.width = (percentage * 100) + '%';
        if (text) text.textContent = Math.round(percentage * 100) + '%';
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('tts-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tts-styles';
        style.textContent = `
            .tts-panel {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            }
            
            .tts-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .tts-icon {
                font-size: 1.3em;
            }
            
            .tts-title {
                font-weight: 600;
                flex: 1;
            }
            
            .tts-close {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                color: #999;
            }
            
            .tts-controls {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .tts-btn {
                width: 44px;
                height: 44px;
                border: none;
                border-radius: 50%;
                background: #667eea;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .tts-btn:hover {
                background: #5a6fd6;
                transform: scale(1.05);
            }
            
            .play-btn {
                width: 56px;
                height: 56px;
            }
            
            .tts-settings {
                display: grid;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .setting-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .setting-item label {
                min-width: 50px;
                font-size: 0.9em;
                color: #666;
            }
            
            .setting-item input[type="range"] {
                flex: 1;
            }
            
            .setting-value {
                min-width: 50px;
                text-align: right;
                font-size: 0.85em;
                color: #888;
            }
            
            .voice-select select {
                flex: 1;
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid #ddd;
            }
            
            .tts-progress {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .progress-bar {
                flex: 1;
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                width: 0%;
                transition: width 0.1s linear;
            }
            
            .progress-text {
                font-size: 0.85em;
                color: #888;
                min-width: 40px;
            }
            
            @media (prefers-color-scheme: dark) {
                .tts-panel {
                    background: rgba(40, 40, 40, 0.95);
                }
                
                .tts-title {
                    color: #fff;
                }
                
                .voice-select select {
                    background: #3d3d3d;
                    border-color: #555;
                    color: #fff;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.textToSpeech = new TextToSpeech();
    });
} else {
    window.textToSpeech = new TextToSpeech();
}

export default TextToSpeech;
