// 文件上传管理脚本
(function() {
  'use strict';

  // DOM 元素
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const fileItems = document.getElementById('fileItems');
  const uploadBtn = document.getElementById('uploadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const uploadProgressContainer = document.getElementById('uploadProgressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const uploadedItems = document.getElementById('uploadedItems');
  const notification = document.getElementById('notification');

  // 文件列表
  let files = [];
  let uploadedFiles = [];

  // 从 localStorage 加载已上传文件
  function loadUploadedFiles() {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      uploadedFiles = JSON.parse(saved);
      
      // 过滤掉没有文件数据的旧记录
      const validFiles = uploadedFiles.filter(file => file.data);
      
      // 如果有无效文件被过滤，更新存储
      if (validFiles.length !== uploadedFiles.length) {
        uploadedFiles = validFiles;
        saveUploadedFiles();
        console.log('已清理旧的无效文件记录');
      }
      
      renderUploadedFiles();
    }
  }

  // 保存已上传文件到 localStorage
  function saveUploadedFiles() {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }

  // 初始化
  function init() {
    loadUploadedFiles();
    bindEvents();
  }

  // 绑定事件
  function bindEvents() {
    // 点击上传区域
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // 点击选择文件按钮
    selectFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // 上传按钮
    uploadBtn.addEventListener('click', handleUpload);

    // 清空按钮
    clearBtn.addEventListener('click', handleClear);
    
    // 清空全部已上传文件按钮
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', handleClearAll);
    }
    
    // 清除缓存按钮
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', handleClearCache);
    }
  }

  // 处理文件选择
  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  }

  // 拖拽悬停
  function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  }

  // 拖拽离开
  function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
  }

  // 拖拽放下
  function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }

  // 添加文件到列表
  function addFiles(newFiles) {
    newFiles.forEach(file => {
      // 检查是否已存在
      const exists = files.some(f => f.name === file.name && f.size === file.size);
      if (!exists) {
        files.push(file);
      }
    });

    renderFileList();
    updateUploadButton();
    
    if (newFiles.length > 0) {
      showNotification(`已添加 ${newFiles.length} 个文件`, 'success');
    }
  }

  // 渲染文件列表
  function renderFileList() {
    if (files.length === 0) {
      fileItems.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <p>暂无文件</p>
        </div>
      `;
      return;
    }

    fileItems.innerHTML = files.map((file, index) => `
      <div class="file-item">
        <div class="file-info">
          <div class="file-icon">${getFileExtension(file.name).toUpperCase()}</div>
          <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
          </div>
        </div>
        <button class="file-remove" onclick="window.uploadManager.removeFile(${index})">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('');
  }

  // 渲染已上传文件
  function renderUploadedFiles() {
    if (uploadedFiles.length === 0) {
      uploadedItems.innerHTML = `
        <div class="empty-state">
          <p>还没有上传任何文件</p>
        </div>
      `;
      return;
    }

    uploadedItems.innerHTML = uploadedFiles.map((file, index) => `
      <div class="uploaded-item">
        <div class="uploaded-item-icon">✓</div>
        <div class="uploaded-item-name" title="${file.name}">${file.name}</div>
        <div class="uploaded-item-date">${file.date}</div>
        <div class="uploaded-item-actions">
          <button class="uploaded-item-btn download-btn" onclick="window.uploadManager.downloadFile(${index})" title="下载文件">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="uploaded-item-btn delete-btn" onclick="window.uploadManager.deleteFile(${index})" title="删除文件">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // 移除文件
  function removeFile(index) {
    files.splice(index, 1);
    renderFileList();
    updateUploadButton();
    showNotification('文件已移除', 'info');
  }

  // 清空列表
  function handleClear() {
    if (files.length === 0) {
      showNotification('列表已经是空的', 'info');
      return;
    }

    files = [];
    fileInput.value = '';
    renderFileList();
    updateUploadButton();
    showNotification('已清空文件列表', 'info');
  }

  // 更新上传按钮状态
  function updateUploadButton() {
    uploadBtn.disabled = files.length === 0;
  }

  // 处理上传
  function handleUpload() {
    if (files.length === 0) return;

    // 显示进度条
    uploadProgressContainer.style.display = 'block';
    uploadBtn.disabled = true;
    clearBtn.disabled = true;

    // 模拟上传过程
    simulateUpload();
  }

  // 模拟上传过程
  function simulateUpload() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        handleUploadComplete();
      }

      updateProgress(progress);
    }, 200);
  }

  // 更新进度
  function updateProgress(progress) {
    const percent = Math.min(Math.round(progress), 100);
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
  }

  // 上传完成
  function handleUploadComplete() {
    const uploadedCount = files.length;
    const currentDate = new Date().toLocaleString('zh-CN');
    let processedCount = 0;

    // 处理每个文件，将其转换为 base64 保存
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        uploadedFiles.unshift({
          name: file.name,
          size: formatFileSize(file.size),
          date: currentDate,
          type: file.type,
          data: e.target.result // base64 数据
        });
        
        processedCount++;
        
        // 所有文件处理完成后保存
        if (processedCount === files.length) {
          saveUploadedFiles();
          renderUploadedFiles();
        }
      };
      
      // 读取文件为 base64
      reader.readAsDataURL(file);
    });

    // 清空待上传列表
    files = [];
    fileInput.value = '';
    renderFileList();

    // 重置进度条
    setTimeout(() => {
      uploadProgressContainer.style.display = 'none';
      progressFill.style.width = '0%';
      progressText.textContent = '0%';
      updateUploadButton();
      clearBtn.disabled = false;
      
      showNotification(`成功上传 ${uploadedCount} 个文件！`, 'success');
    }, 500);
  }

  // 显示通知
  function showNotification(message, type = 'info') {
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // 获取文件扩展名
  function getFileExtension(filename) {
    const ext = filename.split('.').pop();
    return ext || 'FILE';
  }

  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 下载文件
  function downloadFile(index) {
    const file = uploadedFiles[index];
    
    if (!file.data) {
      showNotification('文件数据不存在，无法下载', 'error');
      return;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`开始下载：${file.name}`, 'success');
  }

  // 删除已上传的文件
  function deleteFile(index) {
    const file = uploadedFiles[index];
    
    if (confirm(`确定要删除文件"${file.name}"吗？`)) {
      uploadedFiles.splice(index, 1);
      saveUploadedFiles();
      renderUploadedFiles();
      showNotification('文件已删除', 'info');
    }
  }

  // 清空所有已上传的文件
  function handleClearAll() {
    if (uploadedFiles.length === 0) {
      showNotification('没有可清空的文件', 'info');
      return;
    }
    
    if (confirm(`确定要清空所有已上传的文件吗？\n共 ${uploadedFiles.length} 个文件将被删除，此操作不可恢复！`)) {
      uploadedFiles = [];
      saveUploadedFiles();
      renderUploadedFiles();
      showNotification('已清空所有文件', 'success');
    }
  }

  // 清除浏览器缓存
  function handleClearCache() {
    if (confirm('确定要清除所有浏览器缓存数据吗？\n\n这将清除：\n- 所有已上传的文件\n- 所有本地存储数据\n\n此操作不可恢复！')) {
      try {
        // 清除所有 localStorage 数据
        localStorage.clear();
        
        // 重置状态
        uploadedFiles = [];
        files = [];
        fileInput.value = '';
        
        // 重新渲染界面
        renderFileList();
        renderUploadedFiles();
        
        showNotification('✓ 缓存已清除！页面将在 2 秒后刷新...', 'success');
        
        // 延迟刷新页面
        setTimeout(() => {
          location.reload();
        }, 2000);
        
      } catch (error) {
        showNotification('清除缓存失败：' + error.message, 'error');
      }
    }
  }

  // 暴露给全局
  window.uploadManager = {
    removeFile: removeFile,
    downloadFile: downloadFile,
    deleteFile: deleteFile
  };

  // 初始化
  init();

})();

