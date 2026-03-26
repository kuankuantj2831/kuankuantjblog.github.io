/**
 * 迷你音乐播放器
 * 支持播放/暂停、上一首/下一首、音量控制
 */

(function() {
    'use strict';

    // 音乐列表 - 使用免费背景音乐
    const playlist = [
        {
            title: '夏日微风',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 372
        },
        {
            title: '静谧时光',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            duration: 424
        },
        {
            title: '星空漫步',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            duration: 392
        },
        {
            title: '清晨咖啡',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
            duration: 361
        },
        {
            title: '雨后彩虹',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            duration: 318
        }
    ];

    // 播放器状态
    let state = {
        isPlaying: false,
        currentIndex: 0,
        volume: 0.5,
        currentTime: 0,
        duration: 0
    };

    // 音频元素
    let audio = null;

    // 初始化
    function init() {
        createPlayerHTML();
        createPlayerCSS();
        initAudio();
        bindEvents();
        loadState();
    }

    // 创建播放器HTML
    function createPlayerHTML() {
        const playerHTML = `
            <div id="musicPlayer" class="music-player">
                <div class="music-player-inner">
                    <div class="music-info">
                        <div class="music-icon">🎵</div>
                        <div class="music-details">
                            <div class="music-title" id="musicTitle">加载中...</div>
                            <div class="music-artist" id="musicArtist">-</div>
                        </div>
                    </div>
                    <div class="music-controls">
                        <button class="music-btn" id="prevBtn" title="上一首">⏮</button>
                        <button class="music-btn music-play-btn" id="playBtn" title="播放/暂停">▶</button>
                        <button class="music-btn" id="nextBtn" title="下一首">⏭</button>
                    </div>
                    <div class="music-volume">
                        <span class="volume-icon" id="volumeIcon">🔊</span>
                        <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="50">
                    </div>
                    <button class="music-btn music-close-btn" id="closePlayerBtn" title="关闭">✕</button>
                </div>
                <button class="music-show-btn" id="showPlayerBtn" title="显示播放器" style="display:none;">🎵</button>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = playerHTML;
        document.body.appendChild(div.firstElementChild);
    }

    // 创建播放器CSS
    function createPlayerCSS() {
        if (document.getElementById('musicPlayerStyle')) return;

        const css = `
            .music-player {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 9998;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
                transition: transform 0.3s ease;
            }

            .music-player.hidden {
                transform: translateY(100%);
            }

            .music-player-inner {
                max-width: 1200px;
                margin: 0 auto;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .music-info {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }

            .music-icon {
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                animation: musicPulse 2s infinite;
            }

            @keyframes musicPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            .music-player.playing .music-icon {
                animation: musicPulse 0.8s infinite;
            }

            .music-details {
                min-width: 0;
                overflow: hidden;
            }

            .music-title {
                color: white;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .music-artist {
                color: rgba(255,255,255,0.7);
                font-size: 12px;
                margin-top: 2px;
            }

            .music-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .music-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255,255,255,0.15);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }

            .music-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .music-play-btn {
                width: 44px;
                height: 44px;
                font-size: 18px;
                background: rgba(255,255,255,0.25);
            }

            .music-volume {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .volume-icon {
                font-size: 16px;
                color: white;
            }

            .volume-slider {
                width: 80px;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
                outline: none;
                cursor: pointer;
            }

            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 14px;
                height: 14px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
            }

            .volume-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }

            .music-close-btn {
                width: 28px;
                height: 28px;
                font-size: 12px;
                opacity: 0.7;
            }

            .music-close-btn:hover {
                opacity: 1;
            }

            .music-show-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                border: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                z-index: 9998;
                transition: all 0.3s;
            }

            .music-show-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
            }

            @media (max-width: 768px) {
                .music-player-inner {
                    padding: 10px 15px;
                    gap: 12px;
                }

                .music-info {
                    flex: 0 1 auto;
                }

                .music-details {
                    max-width: 100px;
                }

                .volume-slider {
                    width: 60px;
                }

                .music-btn {
                    width: 32px;
                    height: 32px;
                    font-size: 12px;
                }

                .music-play-btn {
                    width: 38px;
                    height: 38px;
                    font-size: 16px;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = 'musicPlayerStyle';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // 初始化音频
    function initAudio() {
        audio = new Audio();
        audio.volume = state.volume;

        // 加载第一首
        loadTrack(state.currentIndex);

        // 音频事件
        audio.addEventListener('ended', nextTrack);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', () => {
            state.duration = audio.duration;
        });
        audio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e);
            showToast('音乐加载失败，自动切换到下一首');
            setTimeout(nextTrack, 1000);
        });
    }

    // 加载曲目
    function loadTrack(index) {
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;

        state.currentIndex = index;
        const track = playlist[index];

        audio.src = track.url;
        audio.load();

        document.getElementById('musicTitle').textContent = track.title;
        document.getElementById('musicArtist').textContent = track.artist;

        saveState();
    }

    // 播放/暂停
    function togglePlay() {
        if (state.isPlaying) {
            audio.pause();
            state.isPlaying = false;
            document.getElementById('playBtn').textContent = '▶';
            document.getElementById('musicPlayer').classList.remove('playing');
        } else {
            audio.play().then(() => {
                state.isPlaying = true;
                document.getElementById('playBtn').textContent = '⏸';
                document.getElementById('musicPlayer').classList.add('playing');
            }).catch(e => {
                console.error('播放失败:', e);
                showToast('音乐播放失败，请重试');
            });
        }
        saveState();
    }

    // 上一首
    function prevTrack() {
        loadTrack(state.currentIndex - 1);
        if (state.isPlaying) {
            audio.play().catch(() => {});
        }
    }

    // 下一首
    function nextTrack() {
        loadTrack(state.currentIndex + 1);
        if (state.isPlaying) {
            audio.play().catch(() => {});
        }
    }

    // 更新进度
    function updateProgress() {
        state.currentTime = audio.currentTime;
    }

    // 设置音量
    function setVolume(value) {
        state.volume = value / 100;
        audio.volume = state.volume;

        // 更新音量图标
        const icon = document.getElementById('volumeIcon');
        if (state.volume === 0) {
            icon.textContent = '🔇';
        } else if (state.volume < 0.5) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '🔊';
        }

        saveState();
    }

    // 显示播放器
    function showPlayer() {
        document.getElementById('musicPlayer').classList.remove('hidden');
        document.getElementById('showPlayerBtn').style.display = 'none';
    }

    // 隐藏播放器
    function hidePlayer() {
        document.getElementById('musicPlayer').classList.add('hidden');
        document.getElementById('showPlayerBtn').style.display = 'block';
    }

    // 绑定事件
    function bindEvents() {
        document.getElementById('playBtn').addEventListener('click', togglePlay);
        document.getElementById('prevBtn').addEventListener('click', prevTrack);
        document.getElementById('nextBtn').addEventListener('click', nextTrack);
        document.getElementById('closePlayerBtn').addEventListener('click', hidePlayer);
        document.getElementById('showPlayerBtn').addEventListener('click', showPlayer);

        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            setVolume(e.target.value);
        });
    }

    // 保存状态
    function saveState() {
        try {
            localStorage.setItem('musicPlayerState', JSON.stringify({
                currentIndex: state.currentIndex,
                volume: state.volume,
                isPlaying: false // 页面刷新时不自动播放
            }));
        } catch (e) {
            console.warn('保存播放器状态失败:', e);
        }
    }

    // 加载状态
    function loadState() {
        try {
            const saved = localStorage.getItem('musicPlayerState');
            if (saved) {
                const savedState = JSON.parse(saved);
                state.currentIndex = savedState.currentIndex || 0;
                state.volume = savedState.volume !== undefined ? savedState.volume : 0.5;

                // 应用保存的状态
                loadTrack(state.currentIndex);
                document.getElementById('volumeSlider').value = state.volume * 100;
                setVolume(state.volume * 100);
            }
        } catch (e) {
            console.warn('加载播放器状态失败:', e);
        }
    }

    // 轻量提示
    function showToast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 24px',
            borderRadius: '8px', fontSize: '14px', zIndex: '10000', transition: 'opacity 0.3s'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
    }

    // 公共API
    window.MusicPlayer = {
        play: () => { if (!state.isPlaying) togglePlay(); },
        pause: () => { if (state.isPlaying) togglePlay(); },
        next: nextTrack,
        prev: prevTrack,
        setVolume: setVolume,
        show: showPlayer,
        hide: hidePlayer,
        getState: () => ({ ...state }),
        setTrack: (index) => { loadTrack(index); }
    };

    // DOM就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
