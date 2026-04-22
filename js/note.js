/**
 * 笔记功能模块
 * 提供笔记的创建、编辑、删除、搜索等核心功能
 */

// 笔记状态
let noteState = {
    notes: [],
    currentFilter: 'all',
    currentNoteId: null,
    searchTerm: ''
};

// 笔记数据结构
function createNote(title, content, tags = []) {
    return {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        tags: tags,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// 加载笔记
function loadNotes() {
    try {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
            noteState.notes = JSON.parse(savedNotes);
        }
    } catch (error) {
        console.error('加载笔记失败:', error);
        noteState.notes = [];
    }
}

// 保存笔记
function saveNotes() {
    try {
        localStorage.setItem('notes', JSON.stringify(noteState.notes));
    } catch (error) {
        console.error('保存笔记失败:', error);
    }
}

// 更新笔记列表显示
function updateNoteList() {
    const noteList = document.getElementById('noteList');
    const filteredNotes = getFilteredNotes();
    
    noteList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        document.getElementById('noteEmptyState').style.display = 'block';
        return;
    }
    
    document.getElementById('noteEmptyState').style.display = 'none';
    
    filteredNotes.forEach(note => {
        const noteItem = createNoteItem(note);
        noteList.appendChild(noteItem);
    });
}

// 获取过滤后的笔记
function getFilteredNotes() {
    let filteredNotes = [...noteState.notes];
    
    // 应用搜索过滤
    if (noteState.searchTerm) {
        const searchTerm = noteState.searchTerm.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // 应用分类过滤
    switch (noteState.currentFilter) {
        case 'recent':
            filteredNotes = filteredNotes.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            ).slice(0, 10);
            break;
        case 'favorites':
            filteredNotes = filteredNotes.filter(note => note.favorite);
            break;
    }
    
    return filteredNotes;
}

// 创建笔记列表项
function createNoteItem(note) {
    const noteItem = document.createElement('div');
    noteItem.className = `note-item ${noteState.currentNoteId === note.id ? 'selected' : ''}`;
    noteItem.dataset.id = note.id;
    
    noteItem.innerHTML = `
        <div class="note-title">${escapeHtml(note.title)}</div>
        <div class="note-preview">${escapeHtml(note.content)}</div>
        <div class="note-meta">
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div>
                ${note.favorite ? '⭐' : ''}
                ${formatDate(note.updatedAt)}
            </div>
        </div>
    `;
    
    noteItem.addEventListener('click', () => selectNote(note.id));
    
    return noteItem;
}

// 选择笔记
function selectNote(id) {
    noteState.currentNoteId = id;
    const note = noteState.notes.find(n => n.id === id);
    
    if (note) {
        document.getElementById('noteTitleInput').value = note.title;
        document.getElementById('noteContentInput').value = note.content;
        document.getElementById('noteDeleteBtn').style.display = 'inline-block';
        document.getElementById('noteContentSection').classList.add('active');
        
        // 高亮选中项
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`.note-item[data-id="${id}"]`).classList.add('selected');
    }
}

// 取消选择笔记
function deselectNote() {
    noteState.currentNoteId = null;
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteContentInput').value = '';
    document.getElementById('noteDeleteBtn').style.display = 'none';
    document.getElementById('noteContentSection').classList.remove('active');
    
    // 移除高亮
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// 保存笔记
function saveNote() {
    const title = document.getElementById('noteTitleInput').value;
    const content = document.getElementById('noteContentInput').value;
    
    if (!title || !content) {
        alert('请输入笔记标题和内容');
        return;
    }
    
    if (noteState.currentNoteId) {
        // 编辑现有笔记
        const note = noteState.notes.find(n => n.id === noteState.currentNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
    } else {
        // 新建笔记
        const newNote = createNote(title, content);
        noteState.notes.unshift(newNote);
        noteState.currentNoteId = newNote.id;
    }
    
    saveNotes();
    updateNoteList();
    
    // 高亮当前笔记
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('selected');
    });
    if (noteState.currentNoteId) {
        const selectedItem = document.querySelector(`.note-item[data-id="${noteState.currentNoteId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
    
    alert('笔记保存成功');
}

// 删除笔记
function deleteNote() {
    if (!noteState.currentNoteId) return;
    
    if (confirm('确定要删除此笔记吗？')) {
        noteState.notes = noteState.notes.filter(n => n.id !== noteState.currentNoteId);
        noteState.currentNoteId = null;
        saveNotes();
        updateNoteList();
        deselectNote();
        alert('笔记删除成功');
    }
}

// 新建笔记
function newNote() {
    deselectNote();
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteContentInput').value = '';
    document.getElementById('noteContentSection').classList.add('active');
    document.getElementById('noteTitleInput').focus();
}

// 设置过滤器
function setFilter(filter) {
    noteState.currentFilter = filter;
    
    // 更新按钮状态
    document.querySelectorAll('.note-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    updateNoteList();
}

// 搜索笔记
function searchNotes() {
    const searchInput = document.getElementById('noteSearchInput');
    noteState.searchTerm = searchInput.value;
    updateNoteList();
}

// 事件监听器
function setupEventListeners() {
    // 搜索按钮事件
    document.getElementById('noteSearchBtn').addEventListener('click', searchNotes);
    
    // 搜索输入框回车事件
    document.getElementById('noteSearchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchNotes();
        }
    });
    
    // 新建笔记按钮事件
    document.getElementById('noteAddBtn').addEventListener('click', newNote);
    
    // 过滤器按钮事件
    document.getElementById('allNotesBtn').addEventListener('click', () => setFilter('all'));
    document.getElementById('recentNotesBtn').addEventListener('click', () => setFilter('recent'));
    document.getElementById('favoritesBtn').addEventListener('click', () => setFilter('favorites'));
    
    // 保存按钮事件
    document.getElementById('noteSaveBtn').addEventListener('click', saveNote);
    
    // 取消按钮事件
    document.getElementById('noteCancelBtn').addEventListener('click', deselectNote);
    
    // 删除按钮事件
    document.getElementById('noteDeleteBtn').addEventListener('click', deleteNote);
    
    // 编辑区域回车事件
    document.getElementById('noteContentInput').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            saveNote();
        }
    });
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return date.toLocaleDateString();
    }
}

// 工具函数：转义HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"]/g, function(m) { return map[m]; });
}

// 初始化笔记功能
function initNote() {
    console.log('[Note] 笔记功能模块已初始化');
    
    // 加载笔记
    loadNotes();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新笔记列表
    updateNoteList();
}

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNote,
        createNote,
        saveNote,
        deleteNote,
        selectNote,
        deselectNote,
        searchNotes,
        setFilter
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initNote);