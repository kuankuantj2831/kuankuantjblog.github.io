/**
 * 迷你音乐播放器 v2
 * 支持播放/暂停、上一首/下一首、音量控制、音乐选择列表、付费解锁系统
 */

(function() {
    'use strict';

    // 音乐分类常量
    const TRACK_TYPE = {
        FREE: 'free',      // 免费音乐
        PAID: 'paid',      // 付费音乐
        VIP: 'vip'         // 会员专属
    };

    // 扩展音乐列表 - 包含免费、付费和VIP音乐
    const playlist = [
        // 免费音乐
        {
            id: 1,
            title: '夏日微风',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 372,
            type: TRACK_TYPE.FREE,
            price: 0,
            cover: 'https://picsum.photos/seed/music1/100/100'
        },
        {
            id: 2,
            title: '静谧时光',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            duration: 424,
            type: TRACK_TYPE.FREE,
            price: 0,
            cover: 'https://picsum.photos/seed/music2/100/100'
        },
        {
            id: 3,
            title: '星空漫步',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            duration: 392,
            type: TRACK_TYPE.FREE,
            price: 0,
            cover: 'https://picsum.photos/seed/music3/100/100'
        },
        // 付费音乐
        {
            id: 4,
            title: '雨后彩虹',
            artist: '轻音乐',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            duration: 318,
            type: TRACK_TYPE.PAID,
            price: 10,
            cover: 'https://picsum.photos/seed/music4/100/100'
        },
        {
            id: 5,
            title: '山间清泉',
            artist: '自然之声',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
            duration: 452,
            type: TRACK_TYPE.PAID,
            price: 15,
            cover: 'https://picsum.photos/seed/music5/100/100'
        },
        {
            id: 6,
            title: '梦幻森林',
            artist: '自然之声',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
            duration: 389,
            type: TRACK_TYPE.PAID,
            price: 20,
            cover: 'https://picsum.photos/seed/music6/100/100'
        },
        // VIP音乐
        {
            id: 7,
            title: '深海秘境',
            artist: '治愈系',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
            duration: 525,
            type: TRACK_TYPE.VIP,
            price: 0,
            cover: 'https://picsum.photos/seed/music7/100/100'
        },
        {
            id: 8,
            title: '云端之上',
            artist: '治愈系',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3',
            duration: 478,
            type: TRACK_TYPE.VIP,
            price: 0,
            cover: 'https://picsum.photos/seed/music8/100/100'
        }
    ];

    // 播放器状态
    let state = {
        isPlaying: false,
        currentIndex: 0,
        volume: 0.5,
        currentTime: 0,
        duration: 0,
        isListOpen: false,
        filter: 'all' // all, free, paid, vip
    };

    // 音频元素
    let audio = null;

    // 解锁记录存储键
    const UNLOCKED_TRACKS_KEY = 'unlocked_tracks';
    const COINS_KEY = 'coins_balance';

    // 初始化
    function init() {
        createPlayerHTML();
        createPlayerCSS();
        createPlaylistModal();
        initAudio();
        bindEvents();
        loadState();
    }

    // 创建播放器HTML
    function createPlayerHTML() {
        const playerHTML = `
            <div id="musicPlayer" class="music-player">
                <div class="music-player-inner">
                    <div class="music-info" id="musicInfo" title="点击打开音乐列表">
                        <div class="music-icon">🎵</div>
                        <div class="music-details">
                            <div class="music-title" id="musicTitle">加载中...</div>
                            <div class="music-artist" id="musicArtist">-</div>
                        </div>
                        <div class="music-list-hint">📋</div>
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

    // 创建音乐列表弹窗
    function createPlaylistModal() {
        const modalHTML = `
            <div id="playlistModal" class="playlist-modal">
                <div class="playlist-modal-overlay"></div>
                <div class="playlist-modal-content">
                    <div class="playlist-modal-header">
                        <h3>🎵 音乐列表</h3>
                        <div class="playlist-coins">
                            <span class="coin-icon">🪙</span>
                            <span id="playlistCoinBalance">0</span>
                        </div>
                        <button class="playlist-close-btn" id="closePlaylistBtn">✕</button>
                    </div>
                    <div class="playlist-filter-tabs">
                        <button class="filter-tab active" data-filter="all">全部</button>
                        <button class="filter-tab" data-filter="free">免费</button>
                        <button class="filter-tab" data-filter="paid">付费</button>
                        <button class="filter-tab" data-filter="vip">VIP</button>
                    </div>
                    <div class="playlist-modal-body">
                        <ul class="playlist-tracks" id="playlistTracks"></ul>
                    </div>
                    <div class="playlist-modal-footer">
                        <p>💡 提示：点击歌曲即可播放，付费歌曲需解锁</p>
                    </div>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);

        // 渲染播放列表
        renderPlaylist();
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
                cursor: pointer;
                padding: 8px;
                border-radius: 12px;
                transition: all 0.3s;
                position: relative;
            }

            .music-info:hover {
                background: rgba(255,255,255,0.1);
            }

            .music-list-hint {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 14px;
            }

            .music-info:hover .music-list-hint {
                opacity: 0.8;
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
                flex: 1;
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

            /* 播放列表弹窗样式 */
            .playlist-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .playlist-modal.active {
                display: flex;
            }

            .playlist-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
            }

            .playlist-modal-content {
                position: relative;
                background: white;
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: modalSlideIn 0.3s ease;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .playlist-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
            }

            .playlist-modal-header h3 {
                margin: 0;
                font-size: 18px;
                color: #333;
            }

            .playlist-coins {
                display: flex;
                align-items: center;
                gap: 4px;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 14px;
            }

            .coin-icon {
                font-size: 16px;
            }

            .playlist-close-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: #f5f5f5;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                transition: all 0.3s;
            }

            .playlist-close-btn:hover {
                background: #eee;
                color: #333;
            }

            .playlist-filter-tabs {
                display: flex;
                gap: 8px;
                padding: 12px 24px;
                border-bottom: 1px solid #eee;
                overflow-x: auto;
            }

            .filter-tab {
                padding: 8px 16px;
                border: none;
                background: #f5f5f5;
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                color: #666;
                transition: all 0.3s;
                white-space: nowrap;
            }

            .filter-tab:hover {
                background: #eee;
            }

            .filter-tab.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .playlist-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            .playlist-tracks {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .playlist-track-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 8px;
            }

            .playlist-track-item:hover {
                background: #f8f9fa;
            }

            .playlist-track-item.active {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                border: 1px solid rgba(102, 126, 234, 0.3);
            }

            .playlist-track-item.locked {
                opacity: 0.7;
            }

            .playlist-track-item.vip-track {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 165, 0, 0.05) 100%);
            }

            .track-cover {
                width: 48px;
                height: 48px;
                border-radius: 8px;
                object-fit: cover;
                background: #eee;
            }

            .track-info {
                flex: 1;
                min-width: 0;
            }

            .track-title {
                font-size: 14px;
                font-weight: 500;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .track-artist {
                font-size: 12px;
                color: #999;
                margin-top: 2px;
            }

            .track-tags {
                display: flex;
                gap: 4px;
                margin-top: 4px;
            }

            .track-tag {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
            }

            .track-tag.free {
                background: #e8f5e9;
                color: #4caf50;
            }

            .track-tag.paid {
                background: #fff3e0;
                color: #ff9800;
            }

            .track-tag.vip {
                background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
                color: #fff;
            }

            .track-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .track-duration {
                font-size: 12px;
                color: #999;
            }

            .track-lock-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #ff9800;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .track-vip-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .track-unlocked-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #4caf50;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .unlock-btn {
                padding: 6px 12px;
                border: none;
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                color: white;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.3s;
                white-space: nowrap;
            }

            .unlock-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
            }

            .unlock-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .playlist-modal-footer {
                padding: 12px 24px;
                border-top: 1px solid #eee;
                text-align: center;
            }

            .playlist-modal-footer p {
                margin: 0;
                font-size: 12px;
                color: #999;
            }

            /* 解锁确认弹窗 */
            .unlock-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .unlock-modal.active {
                display: flex;
            }

            .unlock-modal-content {
                background: white;
                border-radius: 20px;
                padding: 32px;
                text-align: center;
                max-width: 320px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: modalSlideIn 0.3s ease;
            }

            .unlock-modal-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 28px;
            }

            .unlock-modal-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .unlock-modal-desc {
                font-size: 14px;
                color: #666;
                margin-bottom: 20px;
            }

            .unlock-modal-price {
                font-size: 24px;
                font-weight: 700;
                color: #ff9800;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .unlock-modal-buttons {
                display: flex;
                gap: 12px;
            }

            .unlock-modal-btn {
                flex: 1;
                padding: 12px 20px;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .unlock-modal-btn.cancel {
                background: #f5f5f5;
                color: #666;
            }

            .unlock-modal-btn.confirm {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .unlock-modal-btn:hover {
                transform: translateY(-2px);
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

                .music-list-hint {
                    display: none;
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

                .playlist-modal-content {
                    width: 95%;
                    max-height: 85vh;
                }

                .playlist-modal-header {
                    padding: 16px 20px;
                }

                .playlist-filter-tabs {
                    padding: 10px 16px;
                }

                .playlist-modal-body {
                    padding: 12px;
                }

                .track-cover {
                    width: 40px;
                    height: 40px;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = 'musicPlayerStyle';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // 获取用户硬币余额
    function getCoinBalance() {
        try {
            const balance = localStorage.getItem(COINS_KEY);
            return balance ? parseInt(balance, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    // 设置用户硬币余额
    function setCoinBalance(balance) {
        try {
            localStorage.setItem(COINS_KEY, balance.toString());
        } catch (e) {
            console.warn('保存硬币余额失败:', e);
        }
    }

    // 获取已解锁的音乐列表
    function getUnlockedTracks() {
        try {
            const unlocked = localStorage.getItem(UNLOCKED_TRACKS_KEY);
            return unlocked ? JSON.parse(unlocked) : [];
        } catch (e) {
            return [];
        }
    }

    // 保存已解锁的音乐
    function saveUnlockedTrack(trackId) {
        try {
            const unlocked = getUnlockedTracks();
            if (!unlocked.includes(trackId)) {
                unlocked.push(trackId);
                localStorage.setItem(UNLOCKED_TRACKS_KEY, JSON.stringify(unlocked));
            }
        } catch (e) {
            console.warn('保存解锁记录失败:', e);
        }
    }

    // 检查音乐是否已解锁
    function isTrackUnlocked(track) {
        if (track.type === TRACK_TYPE.FREE) return true;
        const unlocked = getUnlockedTracks();
        return unlocked.includes(track.id);
    }

    // 检查是否是VIP用户（简化实现，实际应从用户系统获取）
    function isVIPUser() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.isVip || user.vipLevel > 0 || false;
            }
        } catch (e) {
            console.warn('检查VIP状态失败:', e);
        }
        return false;
    }

    // 格式化时长
    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 渲染播放列表
    function renderPlaylist() {
        const container = document.getElementById('playlistTracks');
        const coinBalance = getCoinBalance();
        document.getElementById('playlistCoinBalance').textContent = coinBalance;

        // 过滤音乐
        let filteredTracks = playlist;
        if (state.filter !== 'all') {
            filteredTracks = playlist.filter(track => track.type === state.filter);
        }

        container.innerHTML = filteredTracks.map(track => {
            const isUnlocked = isTrackUnlocked(track);
            const isCurrent = track.id === playlist[state.currentIndex].id;
            const isVip = isVIPUser();

            let statusHtml = '';
            let lockHtml = '';

            if (track.type === TRACK_TYPE.VIP) {
                if (isVip) {
                    statusHtml = '<span class="track-tag vip">VIP</span>';
                    lockHtml = '<div class="track-vip-icon">👑</div>';
                } else {
                    statusHtml = '<span class="track-tag vip">VIP专属</span>';
                    lockHtml = '<div class="track-vip-icon">🔒</div>';
                }
            } else if (track.type === TRACK_TYPE.PAID) {
                if (isUnlocked) {
                    statusHtml = '<span class="track-tag paid">已解锁</span>';
                    lockHtml = '<div class="track-unlocked-icon">✓</div>';
                } else {
                    statusHtml = `<span class="track-tag paid">${track.price} 🪙</span>`;
                    lockHtml = `<button class="unlock-btn" data-track-id="${track.id}" data-price="${track.price}">
                        <span>🔓</span>
                        <span>${track.price}</span>
                    </button>`;
                }
            } else {
                statusHtml = '<span class="track-tag free">免费</span>';
            }

            const lockedClass = (track.type === TRACK_TYPE.PAID && !isUnlocked) || 
                               (track.type === TRACK_TYPE.VIP && !isVip) ? 'locked' : '';
            const vipClass = track.type === TRACK_TYPE.VIP ? 'vip-track' : '';
            const activeClass = isCurrent ? 'active' : '';

            return `
                <li class="playlist-track-item ${lockedClass} ${vipClass} ${activeClass}" 
                    data-track-id="${track.id}"
                    data-locked="${(track.type === TRACK_TYPE.PAID && !isUnlocked) || (track.type === TRACK_TYPE.VIP && !isVip)}">
                    <img class="track-cover" src="${track.cover}" alt="${track.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23eee%22 width=%2248%22 height=%2248%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22>🎵</text></svg>'">
                    <div class="track-info">
                        <div class="track-title">
                            ${track.title}
                            ${isCurrent ? '<span>▶</span>' : ''}
                        </div>
                        <div class="track-artist">${track.artist}</div>
                        <div class="track-tags">${statusHtml}</div>
                    </div>
                    <div class="track-status">
                        <span class="track-duration">${formatDuration(track.duration)}</span>
                        ${lockHtml}
                    </div>
                </li>
            `;
        }).join('');

        // 绑定点击事件
        container.querySelectorAll('.playlist-track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 如果点击的是解锁按钮，不触发播放
                if (e.target.closest('.unlock-btn')) return;

                const trackId = parseInt(item.dataset.trackId);
                const isLocked = item.dataset.locked === 'true';

                if (isLocked) {
                    const track = playlist.find(t => t.id === trackId);
                    if (track.type === TRACK_TYPE.VIP) {
                        showToast('🌟 该音乐为VIP专属，请先升级VIP');
                    } else {
                        showToast('🔒 该音乐需要解锁后才能播放');
                    }
                    return;
                }

                const trackIndex = playlist.findIndex(t => t.id === trackId);
                if (trackIndex !== -1) {
                    loadTrack(trackIndex);
                    if (!state.isPlaying) {
                        togglePlay();
                    }
                    renderPlaylist(); // 重新渲染以更新高亮
                }
            });
        });

        // 绑定解锁按钮事件
        container.querySelectorAll('.unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = parseInt(btn.dataset.trackId);
                const price = parseInt(btn.dataset.price);
                showUnlockConfirm(trackId, price);
            });
        });
    }

    // 显示解锁确认弹窗
    function showUnlockConfirm(trackId, price) {
        const track = playlist.find(t => t.id === trackId);
        if (!track) return;

        const coinBalance = getCoinBalance();

        // 检查是否已有弹窗
        let modal = document.getElementById('unlockConfirmModal');
        if (modal) {
            modal.remove();
        }

        modal = document.createElement('div');
        modal.id = 'unlockConfirmModal';
        modal.className = 'unlock-modal';
        modal.innerHTML = `
            <div class="playlist-modal-overlay"></div>
            <div class="unlock-modal-content">
                <div class="unlock-modal-icon">🔓</div>
                <div class="unlock-modal-title">解锁音乐</div>
                <div class="unlock-modal-desc">确定要解锁 "${track.title}" 吗？</div>
                <div class="unlock-modal-price">
                    <span>🪙</span>
                    <span>${price}</span>
                </div>
                <div class="unlock-modal-buttons">
                    <button class="unlock-modal-btn cancel" id="cancelUnlock">取消</button>
                    <button class="unlock-modal-btn confirm" id="confirmUnlock" ${coinBalance < price ? 'disabled' : ''}>
                        ${coinBalance < price ? '硬币不足' : '确认解锁'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示弹窗
        setTimeout(() => modal.classList.add('active'), 10);

        // 绑定事件
        modal.querySelector('.playlist-modal-overlay').addEventListener('click', hideUnlockConfirm);
        document.getElementById('cancelUnlock').addEventListener('click', hideUnlockConfirm);
        document.getElementById('confirmUnlock').addEventListener('click', () => {
            if (coinBalance >= price) {
                purchaseTrack(trackId);
            }
            hideUnlockConfirm();
        });
    }

    // 隐藏解锁确认弹窗
    function hideUnlockConfirm() {
        const modal = document.getElementById('unlockConfirmModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 购买音乐（解锁）
    function purchaseTrack(trackId) {
        const track = playlist.find(t => t.id === trackId);
        if (!track) {
            showToast('❌ 音乐不存在');
            return false;
        }

        if (track.type !== TRACK_TYPE.PAID) {
            showToast('❌ 该音乐无需解锁');
            return false;
        }

        if (isTrackUnlocked(track)) {
            showToast('✅ 您已拥有该音乐');
            return true;
        }

        const coinBalance = getCoinBalance();
        if (coinBalance < track.price) {
            showToast(`❌ 硬币不足，需要 ${track.price} 🪙`);
            return false;
        }

        // 扣除硬币
        setCoinBalance(coinBalance - track.price);

        // 保存解锁记录
        saveUnlockedTrack(trackId);

        // 重新渲染列表
        renderPlaylist();

        // 显示成功提示
        showToast(`🎉 成功解锁 "${track.title}"！`);

        // 触发解锁成功事件
        window.dispatchEvent(new CustomEvent('trackUnlocked', {
            detail: { trackId, track, remainingCoins: coinBalance - track.price }
        }));

        return true;
    }

    // 打开播放列表
    function openPlaylist() {
        const modal = document.getElementById('playlistModal');
        modal.classList.add('active');
        state.isListOpen = true;
        renderPlaylist();
    }

    // 关闭播放列表
    function closePlaylist() {
        const modal = document.getElementById('playlistModal');
        modal.classList.remove('active');
        state.isListOpen = false;
    }

    // 切换播放列表
    function togglePlaylist() {
        if (state.isListOpen) {
            closePlaylist();
        } else {
            openPlaylist();
        }
    }

    // 初始化音频
    function initAudio() {
        audio = new Audio();
        audio.volume = state.volume;

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

        // 延迟加载：只更新UI，不预加载音频
        updateTrackUI(state.currentIndex);
    }

    // 更新曲目UI（不加载音频）
    function updateTrackUI(index) {
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;

        const track = playlist[index];
        state.currentIndex = index;

        document.getElementById('musicTitle').textContent = track.title;
        document.getElementById('musicArtist').textContent = track.artist;

        saveState();
    }

    // 加载曲目
    function loadTrack(index) {
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;

        const track = playlist[index];

        // 检查是否可播放
        if (track.type === TRACK_TYPE.PAID && !isTrackUnlocked(track)) {
            showToast('🔒 该音乐需要解锁后才能播放');
            return;
        }

        if (track.type === TRACK_TYPE.VIP && !isVIPUser()) {
            showToast('🌟 该音乐为VIP专属');
            return;
        }

        state.currentIndex = index;

        audio.src = track.url;
        audio.load();

        document.getElementById('musicTitle').textContent = track.title;
        document.getElementById('musicArtist').textContent = track.artist;

        saveState();
    }

    // 播放/暂停
    function togglePlay() {
        const currentTrack = playlist[state.currentIndex];

        // 检查当前曲目是否可播放
        if (currentTrack.type === TRACK_TYPE.PAID && !isTrackUnlocked(currentTrack)) {
            showToast('🔒 该音乐需要解锁后才能播放');
            openPlaylist();
            return;
        }

        if (currentTrack.type === TRACK_TYPE.VIP && !isVIPUser()) {
            showToast('🌟 该音乐为VIP专属');
            openPlaylist();
            return;
        }

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
        let prevIndex = state.currentIndex - 1;
        if (prevIndex < 0) prevIndex = playlist.length - 1;

        // 跳过锁定的曲目
        let attempts = 0;
        while (attempts < playlist.length) {
            const track = playlist[prevIndex];
            const canPlay = track.type === TRACK_TYPE.FREE || 
                           (track.type === TRACK_TYPE.PAID && isTrackUnlocked(track)) ||
                           (track.type === TRACK_TYPE.VIP && isVIPUser());
            if (canPlay) break;
            prevIndex--;
            if (prevIndex < 0) prevIndex = playlist.length - 1;
            attempts++;
        }

        loadTrack(prevIndex);
        if (state.isPlaying) {
            audio.play().catch(() => {});
        }
    }

    // 下一首
    function nextTrack() {
        let nextIndex = state.currentIndex + 1;
        if (nextIndex >= playlist.length) nextIndex = 0;

        // 跳过锁定的曲目
        let attempts = 0;
        while (attempts < playlist.length) {
            const track = playlist[nextIndex];
            const canPlay = track.type === TRACK_TYPE.FREE || 
                           (track.type === TRACK_TYPE.PAID && isTrackUnlocked(track)) ||
                           (track.type === TRACK_TYPE.VIP && isVIPUser());
            if (canPlay) break;
            nextIndex++;
            if (nextIndex >= playlist.length) nextIndex = 0;
            attempts++;
        }

        loadTrack(nextIndex);
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

        // 点击音乐信息打开列表
        document.getElementById('musicInfo').addEventListener('click', openPlaylist);

        // 播放列表弹窗事件
        document.getElementById('closePlaylistBtn').addEventListener('click', closePlaylist);
        document.querySelector('.playlist-modal-overlay').addEventListener('click', closePlaylist);

        // 过滤器标签
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.filter = tab.dataset.filter;
                renderPlaylist();
            });
        });

        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePlaylist();
                hideUnlockConfirm();
            }
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

                // 应用保存的状态（只更新UI，不加载音频）
                updateTrackUI(state.currentIndex);
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
            position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 28px',
            borderRadius: '12px', fontSize: '14px', zIndex: '10002', transition: 'opacity 0.3s',
            backdropFilter: 'blur(10px)', maxWidth: '80%', textAlign: 'center'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
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
        openPlaylist: openPlaylist,
        closePlaylist: closePlaylist,
        getState: () => ({ ...state }),
        setTrack: (index) => { loadTrack(index); },
        getPlaylist: () => [...playlist],
        purchaseTrack: purchaseTrack,
        isTrackUnlocked: (trackId) => {
            const track = playlist.find(t => t.id === trackId);
            return track ? isTrackUnlocked(track) : false;
        },
        getUnlockedTracks: getUnlockedTracks,
        getCoinBalance: getCoinBalance,
        // 添加测试用的硬币（用于开发调试）
        addCoins: (amount) => {
            const newBalance = getCoinBalance() + amount;
            setCoinBalance(newBalance);
            renderPlaylist();
            showToast(`💰 获得 ${amount} 枚硬币！`);
            return newBalance;
        }
    };

    // DOM就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
