/**
 * 网盘增强功能模块
 * 包含：回收站、在线预览、批量下载、文件管理、容量管理
 */

const DriveEnhanced = {
    // 存储键
    KEYS: {
        RECYCLE_BIN: 'drive_recycle_bin',
        CAPACITY: 'drive_capacity',
        USED_SPACE: 'drive_used_space',
        FOLDERS: 'drive_folders',
        FILE_TAGS: 'drive_file_tags'
    },

    // 默认容量（MB）
    DEFAULT_CAPACITY: 1024, // 1GB

    /**
     * ==================== 容量管理 ====================
     */
    
    // 获取总容量
    getCapacity() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const level = user.level || 1;
        
        // 根据等级扩容
        const baseCapacity = this.DEFAULT_CAPACITY;
        const bonusPerLevel = 512; // 每级增加512MB
        return baseCapacity + (level - 1) * bonusPerLevel;
    },

    // 获取已用空间
    getUsedSpace() {
        try {
            const data = localStorage.getItem(this.KEYS.USED_SPACE);
            return data ? parseInt(data) : 0;
        } catch (e) {
            return 0;
        }
    },

    // 更新已用空间
    updateUsedSpace(sizeMB) {
        localStorage.setItem(this.KEYS.USED_SPACE, sizeMB.toString());
    },

    // 检查是否有足够空间
    hasEnoughSpace(fileSizeMB) {
        const capacity = this.getCapacity();
        const used = this.getUsedSpace();
        return (used + fileSizeMB) <= capacity;
    },

    // 获取容量使用情况
    getCapacityInfo() {
        const total = this.getCapacity();
        const used = this.getUsedSpace();
        const free = total - used;
        const percent = Math.round((used / total) * 100);
        
        return {
            total,
            used,
            free,
            percent,
            formatted: {
                total: this.formatSize(total),
                used: this.formatSize(used),
                free: this.formatSize(free)
            }
        };
    },

    // 格式化文件大小
    formatSize(sizeMB) {
        if (sizeMB < 1) return Math.round(sizeMB * 1024) + ' KB';
        if (sizeMB < 1024) return Math.round(sizeMB) + ' MB';
        return (sizeMB / 1024).toFixed(2) + ' GB';
    },

    // 渲染容量指示器
    renderCapacityIndicator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const info = this.getCapacityInfo();
        const color = info.percent > 90 ? '#e74c3c' : info.percent > 70 ? '#f39c12' : '#27ae60';

        container.innerHTML = `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 14px; color: #666;">存储空间</span>
                    <span style="font-size: 13px; color: #999;">
                        ${info.formatted.used} / ${info.formatted.total}
                    </span>
                </div>
                <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="
                        background: ${color};
                        width: ${info.percent}%;
                        height: 100%;
                        border-radius: 4px;
                        transition: width 0.3s;
                    "></div>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #999;">
                    ${info.percent >= 90 ? '⚠️ 空间不足，请清理文件或升级等级' : 
                      info.percent >= 70 ? '💡 空间即将用尽' : 
                      `✅ 剩余 ${info.formatted.free}`}
                </div>
            </div>
        `;
    },

    /**
     * ==================== 回收站 ====================
     */
    
    // 获取回收站文件
    getRecycleBin() {
        try {
            const data = localStorage.getItem(this.KEYS.RECYCLE_BIN);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    // 保存回收站
    saveRecycleBin(items) {
        localStorage.setItem(this.KEYS.RECYCLE_BIN, JSON.stringify(items));
    },

    // 移动到回收站
    moveToRecycle(file) {
        const bin = this.getRecycleBin();
        const item = {
            ...file,
            deletedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() // 30天后过期
        };
        bin.unshift(item);
        this.saveRecycleBin(bin);
        return item;
    },

    // 从回收站恢复
    restoreFromRecycle(fileId) {
        const bin = this.getRecycleBin();
        const index = bin.findIndex(f => f.id === fileId);
        if (index === -1) return null;
        
        const file = bin[index];
        bin.splice(index, 1);
        this.saveRecycleBin(bin);
        
        // 返回恢复的文件数据
        const { deletedAt, expiresAt, ...restoredFile } = file;
        return restoredFile;
    },

    // 永久删除
    permanentDelete(fileId) {
        const bin = this.getRecycleBin();
        const index = bin.findIndex(f => f.id === fileId);
        if (index === -1) return false;
        
        bin.splice(index, 1);
        this.saveRecycleBin(bin);
        return true;
    },

    // 清空回收站
    emptyRecycleBin() {
        const bin = this.getRecycleBin();
        const freedSpace = bin.reduce((sum, f) => sum + (f.size || 0), 0);
        
        localStorage.removeItem(this.KEYS.RECYCLE_BIN);
        
        // 释放空间
        const used = this.getUsedSpace();
        this.updateUsedSpace(Math.max(0, used - freedSpace));
        
        return freedSpace;
    },

    // 自动清理过期文件
    cleanExpiredFiles() {
        const bin = this.getRecycleBin();
        const now = new Date();
        const valid = bin.filter(f => new Date(f.expiresAt) > now);
        
        if (valid.length < bin.length) {
            this.saveRecycleBin(valid);
            return bin.length - valid.length;
        }
        return 0;
    },

    // 渲染回收站
    renderRecycleBin(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.cleanExpiredFiles();
        const bin = this.getRecycleBin();

        if (bin.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 64px; margin-bottom: 15px;">🗑️</div>
                    <p>回收站是空的</p>
                    <p style="font-size: 12px; margin-top: 10px;">删除的文件会在这里保留30天</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #666; font-size: 14px;">共 ${bin.length} 个文件 · 30天后自动删除</span>
                <button onclick="DriveEnhanced.emptyRecycleBin(); DriveEnhanced.renderRecycleBin('${containerId}');" 
                        style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    清空回收站
                </button>
            </div>
            <div class="recycle-list">
                ${bin.map(file => {
                    const daysLeft = Math.ceil((new Date(file.expiresAt) - Date.now()) / 86400000);
                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            padding: 15px;
                            border-bottom: 1px solid #f0f0f0;
                            background: #fafafa;
                        ">
                            <span style="font-size: 24px; margin-right: 15px;">${this.getFileIcon(file)}</span>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 14px; color: #333; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${file.name}
                                </div>
                                <div style="font-size: 12px; color: #999;">
                                    ${this.formatSize(file.size || 0)} · ${daysLeft}天后过期
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="DriveEnhanced.restoreFile('${file.id}')" 
                                        style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    恢复
                                </button>
                                <button onclick="DriveEnhanced.deletePermanently('${file.id}')" 
                                        style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    删除
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * ==================== 在线预览 ====================
     */
    
    // 获取文件图标
    getFileIcon(file) {
        const ext = (file.name || file.filename || '').split('.').pop().toLowerCase();
        const icons = {
            // 图片
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', bmp: '🖼️',
            // 文档
            pdf: '📄', doc: '📝', docx: '📝', txt: '📃', md: '📃',
            // 表格
            xls: '📊', xlsx: '📊', csv: '📊',
            // 演示
            ppt: '📽️', pptx: '📽️',
            // 代码
            js: '💻', html: '🌐', css: '🎨', json: '📋', py: '🐍', java: '☕',
            // 视频
            mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
            // 音频
            mp3: '🎵', wav: '🎵', flac: '🎵',
            // 压缩
            zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦'
        };
        return icons[ext] || '📎';
    },

    // 检查文件是否可预览
    isPreviewable(file) {
        const ext = (file.name || file.filename || '').split('.').pop().toLowerCase();
        const previewable = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'md', 'json', 'js', 'html', 'css', 'pdf'];
        return previewable.includes(ext);
    },

    // 获取文件类型
    getFileType(file) {
        const ext = (file.name || file.filename || '').split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['txt', 'md', 'json', 'js', 'html', 'css'].includes(ext)) return 'text';
        if (ext === 'pdf') return 'pdf';
        return 'unknown';
    },

    // 预览文件
    previewFile(file) {
        const type = this.getFileType(file);
        
        switch(type) {
            case 'image':
                this.previewImage(file);
                break;
            case 'text':
                this.previewText(file);
                break;
            case 'pdf':
                this.previewPDF(file);
                break;
            default:
                alert('该文件类型暂不支持预览');
        }
    },

    // 预览图片
    previewImage(file) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="position: relative; max-width: 90%; max-height: 90%;">
                <img src="${file.url || file.downloadUrl}" style="max-width: 100%; max-height: 90vh; border-radius: 8px;">
                <button onclick="this.closest('.image-preview-modal').remove()" style="
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                ">×</button>
                <div style="text-align: center; color: white; margin-top: 10px; font-size: 14px;">
                    ${file.name}
                </div>
            </div>
        `;
        
        modal.className = 'image-preview-modal';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    },

    // 预览文本
    async previewText(file) {
        try {
            const response = await fetch(file.url || file.downloadUrl);
            const text = await response.text();
            
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    width: 100%;
                    max-width: 800px;
                    max-height: 80vh;
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">${file.name}</span>
                        <button onclick="this.closest('.text-preview-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                    <pre style="flex: 1; margin: 0; padding: 20px; overflow: auto; background: #f8f9fa; font-size: 14px; line-height: 1.6;">${this.escapeHtml(text)}</pre>
                </div>
            `;
            
            modal.className = 'text-preview-modal';
            document.body.appendChild(modal);
        } catch (e) {
            alert('预览失败：' + e.message);
        }
    },

    // 预览PDF
    previewPDF(file) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                width: 100%;
                max-width: 900px;
                height: 80vh;
                border-radius: 12px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div style="padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold;">${file.name}</span>
                    <button onclick="this.closest('.pdf-preview-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                </div>
                <iframe src="${file.url || file.downloadUrl}" style="flex: 1; border: none;"></iframe>
            </div>
        `;
        
        modal.className = 'pdf-preview-modal';
        document.body.appendChild(modal);
    },

    /**
     * ==================== 批量下载 ====================
     */
    
    // 选择的文件
    selectedFiles: new Set(),

    // 切换选择
    toggleSelection(fileId) {
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
        } else {
            this.selectedFiles.add(fileId);
        }
        this.updateSelectionUI();
    },

    // 全选/取消全选
    toggleSelectAll(files) {
        if (this.selectedFiles.size === files.length) {
            this.selectedFiles.clear();
        } else {
            files.forEach(f => this.selectedFiles.add(f.id));
        }
        this.updateSelectionUI();
    },

    // 更新选择UI
    updateSelectionUI() {
        const count = this.selectedFiles.size;
        const toolbar = document.getElementById('batchToolbar');
        if (toolbar) {
            toolbar.style.display = count > 0 ? 'flex' : 'none';
            const countEl = document.getElementById('selectedCount');
            if (countEl) countEl.textContent = `已选择 ${count} 个文件`;
        }
    },

    // 批量下载
    async batchDownload(files) {
        const selected = files.filter(f => this.selectedFiles.has(f.id));
        if (selected.length === 0) return;

        if (selected.length === 1) {
            // 单个文件直接下载
            this.downloadFile(selected[0]);
        } else {
            // 多个文件打包下载
            await this.downloadAsZip(selected);
        }
    },

    // 下载单个文件
    downloadFile(file) {
        const link = document.createElement('a');
        link.href = file.downloadUrl || file.url;
        link.download = file.name || file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // 打包下载为ZIP
    async downloadAsZip(files) {
        // 使用 JSZip 库（如果可用）
        if (typeof JSZip === 'undefined') {
            // 如果没有JSZip，逐个下载
            for (const file of files) {
                this.downloadFile(file);
                await new Promise(r => setTimeout(r, 500));
            }
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('download');

        for (const file of files) {
            try {
                const response = await fetch(file.url || file.downloadUrl);
                const blob = await response.blob();
                folder.file(file.name || file.filename, blob);
            } catch (e) {
                console.error('下载失败:', file.name, e);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `download_${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    },

    // 批量删除（移动到回收站）
    batchDelete(files) {
        const selected = files.filter(f => this.selectedFiles.has(f.id));
        if (selected.length === 0) return;

        if (!confirm(`确定要将 ${selected.length} 个文件移动到回收站吗？`)) return;

        selected.forEach(file => this.moveToRecycle(file));
        this.selectedFiles.clear();
        this.updateSelectionUI();
        
        this.showToast(`已将 ${selected.length} 个文件移动到回收站`);
    },

    /**
     * ==================== 文件管理 ====================
     */
    
    // 重命名文件
    renameFile(fileId, newName) {
        // 触发文件重命名事件，由主程序处理
        window.dispatchEvent(new CustomEvent('drive:rename', {
            detail: { fileId, newName }
        }));
    },

    // 显示重命名对话框
    showRenameDialog(file) {
        const newName = prompt('请输入新文件名：', file.name || file.filename);
        if (newName && newName !== (file.name || file.filename)) {
            this.renameFile(file.id, newName);
        }
    },

    // 移动文件到文件夹
    moveToFolder(fileId, folderId) {
        window.dispatchEvent(new CustomEvent('drive:move', {
            detail: { fileId, folderId }
        }));
    },

    // 创建文件夹
    createFolder(name, parentId = null) {
        const folders = this.getFolders();
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            parentId: parentId,
            createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        localStorage.setItem(this.KEYS.FOLDERS, JSON.stringify(folders));
        return newFolder;
    },

    // 获取所有文件夹
    getFolders() {
        try {
            const data = localStorage.getItem(this.KEYS.FOLDERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * ==================== 工具方法 ====================
     */
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

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

    // 初始化
    init() {
        // 清理过期文件
        this.cleanExpiredFiles();
        
        // 添加动画样式
        if (!document.getElementById('drive-enhanced-styles')) {
            const style = document.createElement('style');
            style.id = 'drive-enhanced-styles';
            style.textContent = `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .file-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// 导出到全局
window.DriveEnhanced = DriveEnhanced;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    DriveEnhanced.init();
});
