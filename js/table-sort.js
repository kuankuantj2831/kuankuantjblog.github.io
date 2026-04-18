/**
 * 表格排序
 * 文章中的表格支持点击列标题排序
 */
class TableSort {
    constructor(options = {}) {
        this.selector = options.selector || '.article-content table, .post-content table, article table';
    }

    init() {
        const tables = document.querySelectorAll(this.selector);
        tables.forEach(table => this.enhanceTable(table));
    }

    enhanceTable(table) {
        const thead = table.querySelector('thead');
        if (!thead) return;

        const headers = thead.querySelectorAll('th');
        headers.forEach((th, index) => {
            th.style.cursor = 'pointer';
            th.style.userSelect = 'none';
            th.style.position = 'relative';
            th.style.paddingRight = '20px';

            const arrow = document.createElement('span');
            arrow.className = 'sort-arrow';
            arrow.textContent = '⇅';
            arrow.style.cssText = 'position:absolute;right:4px;font-size:11px;color:#ccc;';
            th.appendChild(arrow);

            th.addEventListener('click', () => this.sortTable(table, index, th, arrow));
        });
    }

    sortTable(table, colIndex, th, arrow) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const currentSort = th.dataset.sort;
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';

        // 重置所有箭头
        table.querySelectorAll('.sort-arrow').forEach(a => {
            a.textContent = '⇅';
            a.style.color = '#ccc';
        });

        rows.sort((a, b) => {
            const aVal = this.getCellValue(a, colIndex);
            const bVal = this.getCellValue(b, colIndex);

            let result;
            if (!isNaN(aVal) && !isNaN(bVal)) {
                result = parseFloat(aVal) - parseFloat(bVal);
            } else {
                result = aVal.localeCompare(bVal, 'zh-CN');
            }
            return newSort === 'asc' ? result : -result;
        });

        rows.forEach(row => tbody.appendChild(row));

        th.dataset.sort = newSort;
        arrow.textContent = newSort === 'asc' ? '↑' : '↓';
        arrow.style.color = '#667eea';
    }

    getCellValue(row, index) {
        const cell = row.cells[index];
        return cell ? cell.textContent.trim() : '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ts = new TableSort();
    ts.init();
});
export default TableSort;
