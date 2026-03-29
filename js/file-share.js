/**
 * 文件分享功能模块
 * 生成分享链接、提取码、设置过期时间
 */

const FileShare = {
    STORAGE_KEY: 'file_shares',

    // 分享有效期选项（天）
    EXPIRE_OPTIONS: [
        { value: 1, label: '1天' },
        { value: 7, label: '7天' },
        { value: 30, label: '30天' },
        { value: 0, label: '永久' }
    ],

    /**
     * 生成分享信息
     * @param {Object} file - 文件信息
     * @param {Object} options - 分享选项
     * @param {number} options.expireDays - 过期天数（0为永久）
     * @param {boolean} options.needCode - 是否需要提取码
     * @param {string} options.remark - 分享备注
     */
    createShare(file, options = {}) {
        const shareId = this.generateShareId();
        const code = options.needCode !== false ? this.generateCode() : null;
        const expireDays = options.expireDays !== undefined ? options.expireDays : 7;

        const share = {
            id: shareId,
            fileId: file.id,
            fileName: file.name || file.filename,
            fileSize: file.size || 0,
            fileType: file.type || this.getFileType(file.name || file.filename),
            code: code,
            expireDays: expireDays,
            createdAt: new Date().toISOString(),
            expiresAt: expireDays > 0 
                ? new Date(Date.now() + expireDays * 86400000).toISOString()
                : null, // null表示永久
            remark: options.remark || '',
            downloadCount: 0,
            viewCount: 0,
            active: true
        };

        // 保存到本地存储
        const shares = this.getShares();
        shares.unshift(share);
        this.saveShares(shares);

        return share;
    },

    /**
     * 生成唯一分享ID
     */
    generateShareId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    },

    /**
     * 生成提取码
     */
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    /**
     * 获取所有分享
     */
    getShares() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 保存分享列表
     */
    saveShares(shares) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shares));
    },

    /**
     * 获取分享详情
     */
    getShare(shareId) {
        const shares = this.getShares();
        return shares.find(s => s.id === shareId && s.active);
    },

    /**
     * 验证提取码
     */
    verifyCode(shareId, code) {
        const share = this.getShare(shareId);
        if (!share) return { success: false, message: '分享不存在或已过期' };
        if (!share.active) return { success: false, message: '分享已取消' };
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            return { success: false, message: '分享已过期' };
        }
        if (share.code && share.code !== code.toUpperCase()) {
            return { success: false, message: '提取码错误' };
        }
        
        // 增加查看次数
        this.incrementViewCount(shareId);
        
        return { success: true, share };
    },

    /**
     * 增加查看次数
     */
    incrementViewCount(shareId) {
        const shares = this.getShares();
        const share = shares.find(s => s.id === shareId);
        if (share) {
            share.viewCount = (share.viewCount || 0) + 1;
            this.saveShares(shares);
        }
    },

    /**
     * 增加下载次数
     */
    incrementDownloadCount(shareId) {
        const shares = this.getShares();
        const share = shares.find(s => s.id === shareId);
        if (share) {
            share.downloadCount = (share.downloadCount || 0) + 1;
            this.saveShares(shares);
        }
    },

    /**
     * 取消分享
     */
    cancelShare(shareId) {
        const shares = this.getShares();
        const share = shares.find(s => s.id === shareId);
        if (share) {
            share.active = false;
            this.saveShares(shares);
            return true;
        }
        return false;
    },

    /**
     * 删除分享
     */
    deleteShare(shareId) {
        let shares = this.getShares();
        shares = shares.filter(s => s.id !== shareId);
        this.saveShares(shares);
    },

    /**
     * 清理过期分享
     */
    cleanExpiredShares() {
        const shares = this.getShares();
        const now = new Date();
        let cleaned = 0;

        shares.forEach(share => {
            if (share.expiresAt && new Date(share.expiresAt) < now && share.active) {
                share.active = false;
                cleaned++;
            }
        });

        if (cleaned > 0) {
            this.saveShares(shares);
        }
        return cleaned;
    },

    /**
     * 获取文件类型
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
            video: ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
            audio: ['mp3', 'wav', 'flac', 'aac'],
            document: ['pdf', 'doc', 'docx', 'txt', 'md'],
            archive: ['zip', 'rar', '7z', 'tar', 'gz']
        };

        for (const [type, exts] of Object.entries(types)) {
            if (exts.includes(ext)) return type;
        }
        return 'other';
    },

    /**
     * 获取文件图标
     */
    getFileIcon(type) {
        const icons = {
            image: '🖼️',
            video: '🎬',
            audio: '🎵',
            document: '📄',
            archive: '📦',
            other: '📎'
        };
        return icons[type] || '📎';
    },

    /**
     * 格式化文件大小
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 格式化时间
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 获取剩余时间文本
     */
    getExpireText(share) {
        if (!share.expiresAt) return '永久有效';
        const remaining = new Date(share.expiresAt) - Date.now();
        if (remaining <= 0) return '已过期';

        const days = Math.floor(remaining / 86400000);
        const hours = Math.floor((remaining % 86400000) / 3600000);

        if (days > 0) return `${days}天后过期`;
        if (hours > 0) return `${hours}小时后过期`;
        return '即将过期';
    },

    /**
     * 显示分享对话框
     */
    showShareDialog(file) {
        // 移除已存在的对话框
        const existing = document.getElementById('shareDialog');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'shareDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        dialog.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 450px;
                overflow: hidden;
                animation: fadeIn 0.3s ease;
            ">
                <div style="padding: 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; color: #333;">分享文件</h3>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <span style="font-size: 32px; margin-right: 12px;">${this.getFileIcon(this.getFileType(file.name || file.filename))}</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${file.name || file.filename}
                            </div>
                            <div style="font-size: 12px; color: #999; margin-top: 2px;">
                                ${this.formatSize(file.size || 0)}
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">有效期</label>
                        <div style="display: flex; gap: 10px;">
                            ${this.EXPIRE_OPTIONS.map(opt => `
                                <label style="flex: 1; cursor: pointer;">
                                    <input type="radio" name="expireDays" value="${opt.value}" ${opt.value === 7 ? 'checked' : ''} style="display: none;">
                                    <span style="
                                        display: block;
                                        padding: 10px;
                                        text-align: center;
                                        border: 2px solid #e0e0e0;
                                        border-radius: 8px;
                                        font-size: 13px;
                                        transition: all 0.2s;
                                    " class="expire-option">${opt.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="needCode" checked style="margin-right: 8px;">
                            <span style="color: #666; font-size: 14px;">添加提取码</span>
                        </label>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">备注（可选）</label>
                        <input type="text" id="shareRemark" placeholder="添加备注信息..." style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                </div>

                <div style="padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px;">
                    <button onclick="document.getElementById('shareDialog').remove()" style="
                        flex: 1;
                        padding: 12px;
                        background: #f0f0f0;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                    <button onclick="FileShare.confirmShare('${file.id.replace(/'/g, "\\'")}')" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                    ">创建分享</button>
                </div>
            </div>
        `;

        // 单选框样式切换
        dialog.querySelectorAll('input[name="expireDays"]').forEach(radio => {
            radio.addEventListener('change', function() {
                dialog.querySelectorAll('.expire-option').forEach(opt => {
                    opt.style.borderColor = '#e0e0e0';
                    opt.style.background = 'transparent';
                    opt.style.color = '#666';
                });
                if (this.checked) {
                    this.nextElementSibling.style.borderColor = '#667eea';
                    this.nextElementSibling.style.background = '#667eea10';
                    this.nextElementSibling.style.color = '#667eea';
                }
            });
        });

        // 默认选中7天
        const defaultOption = dialog.querySelector('input[value="7"]');
        if (defaultOption) {
            defaultOption.nextElementSibling.style.borderColor = '#667eea';
            defaultOption.nextElementSibling.style.background = '#667eea10';
            defaultOption.nextElementSibling.style.color = '#667eea';
        }

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });

        document.body.appendChild(dialog);
    },

    /**
     * 确认创建分享
     */
    confirmShare(fileId) {
        // 获取文件信息 - 这里需要从外部传入
        window.dispatchEvent(new CustomEvent('fileshare:getFile', {
            detail: { fileId, callback: (file) => this.doCreateShare(file) }
        }));
    },

    /**
     * 执行创建分享
     */
    doCreateShare(file) {
        if (!file) return;

        const expireDays = parseInt(document.querySelector('input[name="expireDays"]:checked')?.value || 7);
        const needCode = document.getElementById('needCode')?.checked;
        const remark = document.getElementById('shareRemark')?.value || '';

        const share = this.createShare(file, {
            expireDays,
            needCode,
            remark
        });

        document.getElementById('shareDialog')?.remove();
        this.showShareResult(share);
    },

    /**
     * 显示分享结果
     */
    showShareResult(share) {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/share.html?id=${share.id}`;

        const dialog = document.createElement('div');
        dialog.id = 'shareResultDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        dialog.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 450px;
                overflow: hidden;
                animation: fadeIn 0.3s ease;
            ">
                <div style="padding: 25px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                    <h3 style="margin: 0;">分享创建成功！</h3>
                </div>
                
                <div style="padding: 25px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">分享链接</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="shareUrl" value="${shareUrl}" readonly style="
                                flex: 1;
                                padding: 12px;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                font-size: 14px;
                                background: #f8f9fa;
                            ">
                            <button onclick="FileShare.copyToClipboard('shareUrl')" style="
                                padding: 12px 20px;
                                background: #667eea;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                white-space: nowrap;
                            ">复制</button>
                        </div>
                    </div>

                    ${share.code ? `
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">提取码</label>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="
                                    padding: 15px 30px;
                                    background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%);
                                    color: white;
                                    border-radius: 8px;
                                    font-size: 24px;
                                    font-weight: bold;
                                    letter-spacing: 5px;
                                ">${share.code}</div>
                                <button onclick="FileShare.copyText('${share.code}')" style="
                                    padding: 10px 15px;
                                    background: #f0f0f0;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 13px;
                                ">复制</button>
                            </div>
                        </div>
                    ` : ''}

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 13px; color: #666;">
                        <div>📅 ${this.getExpireText(share)}</div>
                        <div style="margin-top: 5px;">📊 已下载 ${share.downloadCount} 次 · 已查看 ${share.viewCount} 次</div>
                    </div>
                </div>

                <div style="padding: 20px; border-top: 1px solid #eee;">
                    <button onclick="document.getElementById('shareResultDialog').remove()" style="
                        width: 100%;
                        padding: 12px;
                        background: #f0f0f0;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    ">完成</button>
                </div>
            </div>
        `;

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });

        document.body.appendChild(dialog);
    },

    /**
     * 复制到剪贴板
     */
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.select();
            document.execCommand('copy');
            this.showToast('已复制到剪贴板');
        }
    },

    /**
     * 复制文本
     */
    copyText(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        this.showToast('已复制到剪贴板');
    },

    /**
     * 渲染我的分享列表
     */
    renderMyShares(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.cleanExpiredShares();
        const shares = this.getShares().filter(s => s.active);

        if (shares.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 64px; margin-bottom: 15px;">📭</div>
                    <p>还没有分享</p>
                    <p style="font-size: 12px; margin-top: 10px;">分享文件后会在这里显示</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="background: white; border-radius: 12px; overflow: hidden;">
                ${shares.map(share => `
                    <div style="
                        display: flex;
                        align-items: center;
                        padding: 15px 20px;
                        border-bottom: 1px solid #f0f0f0;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'">
                        <span style="font-size: 28px; margin-right: 15px;">${this.getFileIcon(share.fileType)}</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${this.escapeHtml(share.fileName || '未命名文件')}
                            </div>
                            <div style="font-size: 12px; color: #999; margin-top: 3px;">
                                ${share.code ? `🔐 提取码: ${this.escapeHtml(share.code)} · ` : ''}
                                ⏰ ${this.getExpireText(share)} · 
                                👁️ ${share.viewCount} · ⬇️ ${share.downloadCount}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="FileShare.copyText('${window.location.origin}/share.html?id=${share.id}')" style="
                                padding: 6px 12px;
                                background: #667eea;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">复制链接</button>
                            <button onclick="FileShare.cancelShare('${share.id}'); FileShare.renderMyShares('${containerId}');" style="
                                padding: 6px 12px;
                                background: #e74c3c;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">取消</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 99999;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * 初始化
     */
    init() {
        // 添加动画样式
        if (!document.getElementById('fileshare-styles')) {
            const style = document.createElement('style');
            style.id = 'fileshare-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `;
            document.head.appendChild(style);
        }

        // 清理过期分享
        this.cleanExpiredShares();
    }
};

// 导出到全局
window.FileShare = FileShare;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    FileShare.init();
});
