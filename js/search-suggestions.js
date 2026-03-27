/**
 * 搜索建议 - Search Suggestions
 * 实时搜索建议和自动补全
 */

class SearchSuggestions {
    constructor(options = {}) {
        this.options = {
            inputSelector: '#searchInput, #searchKeyword, input[type="search"]',
            suggestionsLimit: 8,
            debounceTime: 200,
            ...options
        };
        
        this.input = null;
        this.suggestionsContainer = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        
        this.init();
    }
    
    init() {
        this.input = document.querySelector(this.options.inputSelector);
        if (!this.input) {
            console.log('[搜索建议] 未找到搜索输入框');
            return;
        }
        
        this.createSuggestionsContainer();
        this.bindEvents();
        this.injectStyles();
        
        console.log('[搜索建议] 系统已初始化');
    }
    
    createSuggestionsContainer() {
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'search-suggestions';
        this.suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            margin-top: 8px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        this.input.parentElement.style.position = 'relative';
        this.input.parentElement.appendChild(this.suggestionsContainer);
    }
    
    bindEvents() {
        // 输入防抖
        let debounceTimer;
        this.input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.fetchSuggestions(e.target.value);
            }, this.options.debounceTime);
        });
        
        // 键盘导航
        this.input.addEventListener('keydown', (e) => {
            if (!this.suggestionsContainer.style.display || this.suggestionsContainer.style.display === 'none') return;
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigate(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigate(-1);
                    break;
                case 'Enter':
                    if (this.selectedIndex >= 0) {
                        e.preventDefault();
                        this.selectSuggestion(this.selectedIndex);
                    }
                    break;
                case 'Escape':
                    this.hide();
                    break;
            }
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hide();
            }
        });
    }
    
    async fetchSuggestions(query) {
        if (!query.trim()) {
            this.hide();
            return;
        }
        
        // 模拟获取建议（实际应从API获取）
        const mockSuggestions = [
            { type: 'article', title: `${query} 的搜索结果 1`, url: '/search?q=' + encodeURIComponent(query) },
            { type: 'article', title: `${query} 的搜索结果 2`, url: '/search?q=' + encodeURIComponent(query) },
            { type: 'tag', title: `标签: ${query}`, url: '/tags/' + encodeURIComponent(query) },
            { type: 'category', title: `分类: ${query}`, url: '/category/' + encodeURIComponent(query) }
        ];
        
        this.suggestions = mockSuggestions;
        this.renderSuggestions();
    }
    
    renderSuggestions() {
        if (this.suggestions.length === 0) {
            this.hide();
            return;
        }
        
        this.suggestionsContainer.innerHTML = this.suggestions.map((s, i) => `
            <div class="suggestion-item ${i === 0 ? 'selected' : ''}" data-index="${i}">
                <span class="suggestion-icon">${this.getIcon(s.type)}</span>
                <span class="suggestion-text">${this.highlightMatch(s.title)}</span>
            </div>
        `).join('');
        
        this.selectedIndex = 0;
        this.suggestionsContainer.style.display = 'block';
        
        // 绑定点击事件
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(parseInt(item.dataset.index));
            });
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index);
                this.updateSelection();
            });
        });
    }
    
    getIcon(type) {
        const icons = {
            article: '📄',
            tag: '🏷️',
            category: '📁'
        };
        return icons[type] || '🔍';
    }
    
    highlightMatch(text) {
        const query = this.input.value;
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    navigate(direction) {
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) this.selectedIndex = this.suggestions.length - 1;
        if (this.selectedIndex >= this.suggestions.length) this.selectedIndex = 0;
        this.updateSelection();
    }
    
    updateSelection() {
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, i) => {
            item.classList.toggle('selected', i === this.selectedIndex);
        });
    }
    
    selectSuggestion(index) {
        const suggestion = this.suggestions[index];
        if (suggestion) {
            window.location.href = suggestion.url;
        }
    }
    
    hide() {
        this.suggestionsContainer.style.display = 'none';
        this.selectedIndex = -1;
    }
    
    injectStyles() {
        if (document.getElementById('search-suggestions-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'search-suggestions-styles';
        style.textContent = `
            .search-suggestions {
                animation: suggestionsFadeIn 0.2s ease;
            }
            
            .suggestion-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.15s;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .suggestion-item:hover,
            .suggestion-item.selected {
                background: #f5f5f5;
            }
            
            .suggestion-icon {
                font-size: 1.2em;
            }
            
            .suggestion-text {
                flex: 1;
                color: #333;
                font-size: 14px;
            }
            
            .suggestion-text mark {
                background: #fff3cd;
                color: inherit;
                padding: 0 2px;
                border-radius: 2px;
            }
            
            @keyframes suggestionsFadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchSuggestions = new SearchSuggestions();
    });
} else {
    window.searchSuggestions = new SearchSuggestions();
}

export default SearchSuggestions;
