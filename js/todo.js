/**
 * 待办事项功能模块
 * 提供待办事项的添加、编辑、删除、标记完成等功能
 */

// 待办事项状态
let todoState = {
    todos: [],
    currentFilter: 'all'
};

// 待办事项数据结构
function createTodo(text) {
    return {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// 加载待办事项
function loadTodos() {
    try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            todoState.todos = JSON.parse(savedTodos);
        }
    } catch (error) {
        console.error('加载待办事项失败:', error);
        todoState.todos = [];
    }
}

// 保存待办事项
function saveTodos() {
    try {
        localStorage.setItem('todos', JSON.stringify(todoState.todos));
    } catch (error) {
        console.error('保存待办事项失败:', error);
    }
}

// 更新待办事项列表显示
function updateTodoList() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = getFilteredTodos();
    
    todoList.innerHTML = '';
    
    filteredTodos.forEach(todo => {
        const todoItem = createTodoItem(todo);
        todoList.appendChild(todoItem);
    });
    
    updateStats();
}

// 获取过滤后的待办事项
function getFilteredTodos() {
    switch (todoState.currentFilter) {
        case 'active':
            return todoState.todos.filter(todo => !todo.completed);
        case 'completed':
            return todoState.todos.filter(todo => todo.completed);
        default:
            return todoState.todos;
    }
}

// 创建待办事项元素
function createTodoItem(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;
    
    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
            <button class="todo-edit-btn" title="编辑">✏️</button>
            <button class="todo-delete-btn" title="删除">🗑️</button>
        </div>
    `;
    
    // 添加事件监听器
    const checkbox = li.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    const editBtn = li.querySelector('.todo-edit-btn');
    editBtn.addEventListener('click', () => editTodo(todo.id));
    
    const deleteBtn = li.querySelector('.todo-delete-btn');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    return li;
}

// 切换待办事项完成状态
function toggleTodo(id) {
    const todo = todoState.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        updateTodoList();
    }
}

// 编辑待办事项
function editTodo(id) {
    const todo = todoState.todos.find(t => t.id === id);
    if (!todo) return;
    
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    const currentText = todo.text;
    
    // 创建编辑表单
    todoItem.innerHTML = `
        <input type="text" class="todo-edit-input" value="${escapeHtml(currentText)}">
        <div class="todo-actions">
            <button class="todo-save-btn" title="保存">✅</button>
            <button class="todo-cancel-btn" title="取消">❌</button>
        </div>
    `;
    
    const editInput = todoItem.querySelector('.todo-edit-input');
    const saveBtn = todoItem.querySelector('.todo-save-btn');
    const cancelBtn = todoItem.querySelector('.todo-cancel-btn');
    
    // 自动聚焦到输入框
    editInput.focus();
    editInput.select();
    
    // 保存按钮事件
    saveBtn.addEventListener('click', () => saveEditedTodo(id, editInput.value));
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => updateTodoList());
    
    // 回车保存，ESC 取消
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEditedTodo(id, editInput.value);
        } else if (e.key === 'Escape') {
            updateTodoList();
        }
    });
}

// 保存编辑后的待办事项
function saveEditedTodo(id, newText) {
    const todo = todoState.todos.find(t => t.id === id);
    if (todo && newText.trim()) {
        todo.text = newText.trim();
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        updateTodoList();
    } else {
        updateTodoList();
    }
}

// 删除待办事项
function deleteTodo(id) {
    if (confirm('确定要删除这个待办事项吗？')) {
        todoState.todos = todoState.todos.filter(t => t.id !== id);
        saveTodos();
        updateTodoList();
    }
}

// 添加待办事项
function addTodo(text) {
    if (!text.trim()) return;
    
    const newTodo = createTodo(text);
    todoState.todos.unshift(newTodo);
    saveTodos();
    updateTodoList();
}

// 清除已完成的待办事项
function clearCompleted() {
    if (todoState.todos.some(todo => todo.completed)) {
        if (confirm('确定要清除所有已完成的待办事项吗？')) {
            todoState.todos = todoState.todos.filter(todo => !todo.completed);
            saveTodos();
            updateTodoList();
        }
    }
}

// 更新统计信息
function updateStats() {
    const totalCount = todoState.todos.length;
    const completedCount = todoState.todos.filter(todo => todo.completed).length;
    
    const todoCount = document.getElementById('todoCount');
    const completedCountEl = document.getElementById('completedCount');
    
    todoCount.textContent = totalCount;
    completedCountEl.textContent = `${completedCount} 个已完成`;
}

// 设置过滤器
function setFilter(filter) {
    todoState.currentFilter = filter;
    
    // 更新按钮状态
    document.querySelectorAll('.todo-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    updateTodoList();
}

// 转义 HTML 字符
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

// 事件监听器
function setupEventListeners() {
    // 添加按钮事件
    const addBtn = document.getElementById('todoAddBtn');
    const input = document.getElementById('todoInput');
    
    addBtn.addEventListener('click', () => {
        addTodo(input.value);
        input.value = '';
        input.focus();
    });
    
    // 输入框回车事件
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodo(input.value);
            input.value = '';
        }
    });
    
    // 过滤器按钮事件
    document.getElementById('allFilter').addEventListener('click', () => setFilter('all'));
    document.getElementById('activeFilter').addEventListener('click', () => setFilter('active'));
    document.getElementById('completedFilter').addEventListener('click', () => setFilter('completed'));
    
    // 清除已完成按钮事件
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
}

// 初始化待办事项功能
function initTodo() {
    console.log('[Todo] 待办事项功能模块已初始化');
    
    // 加载待办事项
    loadTodos();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新待办事项列表
    updateTodoList();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initTodo);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTodo,
        addTodo,
        toggleTodo,
        editTodo,
        deleteTodo,
        clearCompleted,
        setFilter
    };
}