/**
 * 华容道游戏 - 核心逻辑
 * 棋盘: 4列 x 5行
 * 每个格子: 80px x 80px (含间距)
 */

// ============ 常量定义 ============
const CELL_SIZE = 80;   // 格子大小（含间距）
const PIECE_GAP = 4;    // 棋子间距
const COLS = 4;
const ROWS = 5;

// 棋子类型
const PIECE_TYPES = {
    CAOCAO: { w: 2, h: 2, cls: 'caocao', name: '曹操' },
    GUANYU: { w: 2, h: 1, cls: 'hjiang guanyu', name: '关羽' },
    ZHANGFEI: { w: 1, h: 2, cls: 'vjiang zhangfei', name: '张飞' },
    ZHAOYUN: { w: 1, h: 2, cls: 'vjiang zhaoyun', name: '赵云' },
    MACHAO: { w: 1, h: 2, cls: 'vjiang machao', name: '马超' },
    HUANGZHONG: { w: 1, h: 2, cls: 'vjiang huangzhong', name: '黄忠' },
    BING1: { w: 1, h: 1, cls: 'bing soldier', name: '兵' },
    BING2: { w: 1, h: 1, cls: 'bing soldier', name: '兵' },
    BING3: { w: 1, h: 1, cls: 'bing soldier', name: '兵' },
    BING4: { w: 1, h: 1, cls: 'bing soldier', name: '兵' },
};

// ============ 布局定义 ============
// 每个布局定义棋子的初始位置 [col, row]
const LAYOUTS = {
    hengdaolima: {
        name: '横刀立马',
        difficulty: '极难',
        minSteps: 116,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'MACHAO', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 1, row: 3 },
            { type: 'BING2', col: 2, row: 3 },
            { type: 'BING3', col: 0, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    zhiruzhibing: {
        name: '指挥若定',
        difficulty: '极难',
        minSteps: 114,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'MACHAO', col: 0, row: 0 },
            { type: 'HUANGZHONG', col: 3, row: 0 },
            { type: 'ZHANGFEI', col: 0, row: 2 },
            { type: 'ZHAOYUN', col: 3, row: 2 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'BING1', col: 1, row: 3 },
            { type: 'BING2', col: 2, row: 3 },
            { type: 'BING3', col: 1, row: 4 },
            { type: 'BING4', col: 2, row: 4 },
        ]
    },
    bingjiangguanmen: {
        name: '兵将挡路',
        difficulty: '极难',
        minSteps: 116,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'MACHAO', col: 3, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHAOYUN', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 0, row: 4 },
            { type: 'BING2', col: 1, row: 3 },
            { type: 'BING3', col: 2, row: 3 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    zuoyoubufen: {
        name: '左右布兵',
        difficulty: '困难',
        minSteps: 110,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'MACHAO', col: 0, row: 0 },
            { type: 'HUANGZHONG', col: 3, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'BING1', col: 0, row: 2 },
            { type: 'BING2', col: 0, row: 3 },
            { type: 'BING3', col: 3, row: 2 },
            { type: 'BING4', col: 3, row: 3 },
            { type: 'ZHANGFEI', col: 1, row: 3 },
            { type: 'ZHAOYUN', col: 2, row: 3 },
        ]
    },
    near: {
        name: '近在咫尺',
        difficulty: '简单',
        minSteps: 52,
        pieces: [
            { type: 'CAOCAO', col: 0, row: 1 },
            { type: 'GUANYU', col: 0, row: 0 },
            { type: 'ZHANGFEI', col: 2, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 3 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 2, row: 2 },
            { type: 'BING2', col: 2, row: 3 },
            { type: 'BING3', col: 1, row: 3 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    // ===== 以下为新增经典布局 =====
    binglinchengxia: {
        name: '兵临城下',
        difficulty: '困难',
        minSteps: 100,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 3 },
            { type: 'HUANGZHONG', col: 3, row: 3 },
            { type: 'BING1', col: 0, row: 2 },
            { type: 'BING2', col: 3, row: 2 },
            { type: 'BING3', col: 1, row: 3 },
            { type: 'BING4', col: 2, row: 3 },
        ]
    },
    qilangbagua: {
        name: '齐头并进',
        difficulty: '中等',
        minSteps: 79,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 0, row: 4 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 1, row: 2 },
            { type: 'BING2', col: 2, row: 2 },
            { type: 'BING3', col: 2, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    simianchuhan: {
        name: '四面楚歌',
        difficulty: '极难',
        minSteps: 118,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'MACHAO', col: 3, row: 0 },
            { type: 'ZHAOYUN', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 0, row: 4 },
            { type: 'BING2', col: 1, row: 4 },
            { type: 'BING3', col: 2, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    bingfensanlu: {
        name: '兵分三路',
        difficulty: '极难',
        minSteps: 116,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 0, row: 4 },
            { type: 'BING2', col: 1, row: 3 },
            { type: 'BING3', col: 2, row: 3 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    wujiangtuwei: {
        name: '五将逼宫',
        difficulty: '极难',
        minSteps: 116,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 2 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 3, row: 2 },
            { type: 'HUANGZHONG', col: 0, row: 0 },
            { type: 'BING1', col: 1, row: 3 },
            { type: 'BING2', col: 2, row: 3 },
            { type: 'BING3', col: 0, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    xiaoyaojin: {
        name: '小燕出巢',
        difficulty: '中等',
        minSteps: 82,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 4 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 1, row: 2 },
            { type: 'BING2', col: 2, row: 2 },
            { type: 'BING3', col: 1, row: 3 },
            { type: 'BING4', col: 2, row: 3 },
        ]
    },
    shuishoulianlian: {
        name: '水泄不通',
        difficulty: '困难',
        minSteps: 98,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 4 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 0, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 1, row: 2 },
            { type: 'BING2', col: 2, row: 2 },
            { type: 'BING3', col: 0, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    tuntunxiangxi: {
        name: '层层设防',
        difficulty: '困难',
        minSteps: 110,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 1, row: 3 },
            { type: 'HUANGZHONG', col: 2, row: 3 },
            { type: 'BING1', col: 0, row: 2 },
            { type: 'BING2', col: 3, row: 2 },
            { type: 'BING3', col: 0, row: 3 },
            { type: 'BING4', col: 3, row: 3 },
        ]
    },
    yichefangyu: {
        name: '一夫当关',
        difficulty: '困难',
        minSteps: 96,
        pieces: [
            { type: 'CAOCAO', col: 0, row: 0 },
            { type: 'GUANYU', col: 0, row: 2 },
            { type: 'ZHANGFEI', col: 2, row: 0 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 2, row: 2 },
            { type: 'HUANGZHONG', col: 3, row: 2 },
            { type: 'BING1', col: 0, row: 3 },
            { type: 'BING2', col: 1, row: 3 },
            { type: 'BING3', col: 2, row: 4 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    },
    bingguichensu: {
        name: '兵贵神速',
        difficulty: '极难',
        minSteps: 116,
        pieces: [
            { type: 'CAOCAO', col: 1, row: 0 },
            { type: 'GUANYU', col: 1, row: 2 },
            { type: 'ZHANGFEI', col: 0, row: 2 },
            { type: 'ZHAOYUN', col: 3, row: 0 },
            { type: 'MACHAO', col: 3, row: 2 },
            { type: 'HUANGZHONG', col: 0, row: 0 },
            { type: 'BING1', col: 0, row: 4 },
            { type: 'BING2', col: 1, row: 3 },
            { type: 'BING3', col: 2, row: 3 },
            { type: 'BING4', col: 3, row: 4 },
        ]
    }
};

// ============ 游戏状态 ============
class HuarongdaoGame {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.movesEl = document.getElementById('moves-count');
        this.minStepsEl = document.getElementById('min-steps');
        this.timerEl = document.getElementById('timer');
        this.winModal = document.getElementById('win-modal');
        this.winMovesEl = document.getElementById('win-moves');
        this.winTimeEl = document.getElementById('win-time');
        this.layoutSelect = document.getElementById('layout-select');

        this.pieces = [];
        this.grid = [];       // 4x5 网格，记录每个格子被哪个棋子占据
        this.moves = 0;
        this.seconds = 0;
        this.timerInterval = null;
        this.history = [];    // 撤销历史
        this.isWon = false;

        // 拖拽状态
        this.dragging = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragPieceStartCol = 0;
        this.dragPieceStartRow = 0;

        this.init();
    }

    init() {
        // 动态生成布局选择器
        this.populateLayoutSelect();

        // 绑定事件
        document.getElementById('btn-reset').addEventListener('click', () => this.reset());
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.winModal.classList.add('hidden');
            this.reset();
        });
        this.layoutSelect.addEventListener('change', () => this.reset());

        // 全局鼠标/触摸事件
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        document.addEventListener('touchmove', (e) => this.onDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onDragEnd(e));

        this.reset();
    }

    populateLayoutSelect() {
        this.layoutSelect.innerHTML = '';
        const difficultyOrder = { '简单': 0, '中等': 1, '困难': 2, '极难': 3 };
        const sorted = Object.entries(LAYOUTS).sort((a, b) => {
            const da = difficultyOrder[a[1].difficulty] || 0;
            const db = difficultyOrder[b[1].difficulty] || 0;
            if (da !== db) return da - db;
            return a[1].minSteps - b[1].minSteps;
        });
        for (const [key, layout] of sorted) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${layout.name}（${layout.difficulty} · ${layout.minSteps}步）`;
            this.layoutSelect.appendChild(option);
        }
    }

    // 重置游戏
    reset() {
        this.clearTimer();
        this.moves = 0;
        this.seconds = 0;
        this.history = [];
        this.isWon = false;
        this.movesEl.textContent = '0';
        this.timerEl.textContent = '00:00';
        this.winModal.classList.add('hidden');

        // 清空棋盘
        this.boardEl.innerHTML = '';
        this.pieces = [];
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

        // 加载布局
        const layoutKey = this.layoutSelect.value;
        const layout = LAYOUTS[layoutKey];

        // 显示最少步数
        this.minStepsEl.textContent = layout.minSteps || '-';

        layout.pieces.forEach((p, index) => {
            const typeInfo = PIECE_TYPES[p.type];
            const piece = {
                id: index,
                type: p.type,
                col: p.col,
                row: p.row,
                w: typeInfo.w,
                h: typeInfo.h,
                cls: typeInfo.cls,
                name: typeInfo.name,
                el: null
            };

            // 创建 DOM 元素
            const el = document.createElement('div');
            el.className = `piece ${typeInfo.cls}`;
            el.innerHTML = `<span class="piece-name">${typeInfo.name}</span>`;
            el.style.left = this.colToPixel(p.col) + 'px';
            el.style.top = this.rowToPixel(p.row) + 'px';

            // 绑定拖拽
            el.addEventListener('mousedown', (e) => this.onDragStart(e, piece));
            el.addEventListener('touchstart', (e) => this.onDragStart(e, piece), { passive: false });

            this.boardEl.appendChild(el);
            piece.el = el;
            this.pieces.push(piece);

            // 更新网格
            this.placeOnGrid(piece);
        });

        this.startTimer();
    }

    // ============ 网格操作 ============
    placeOnGrid(piece) {
        for (let r = piece.row; r < piece.row + piece.h; r++) {
            for (let c = piece.col; c < piece.col + piece.w; c++) {
                this.grid[r][c] = piece.id;
            }
        }
    }

    removeFromGrid(piece) {
        for (let r = piece.row; r < piece.row + piece.h; r++) {
            for (let c = piece.col; c < piece.col + piece.w; c++) {
                if (this.grid[r][c] === piece.id) {
                    this.grid[r][c] = null;
                }
            }
        }
    }

    // 检查棋子能否移动到指定位置
    canMoveTo(piece, newCol, newRow) {
        // 边界检查
        if (newCol < 0 || newRow < 0 || 
            newCol + piece.w > COLS || newRow + piece.h > ROWS) {
            return false;
        }

        // 碰撞检查（排除自身）
        for (let r = newRow; r < newRow + piece.h; r++) {
            for (let c = newCol; c < newCol + piece.w; c++) {
                if (this.grid[r][c] !== null && this.grid[r][c] !== piece.id) {
                    return false;
                }
            }
        }

        return true;
    }

    // ============ 坐标转换 ============
    colToPixel(col) {
        return col * CELL_SIZE + PIECE_GAP;
    }

    rowToPixel(row) {
        return row * CELL_SIZE + PIECE_GAP;
    }

    pixelToCol(px) {
        return Math.round((px - PIECE_GAP) / CELL_SIZE);
    }

    pixelToRow(px) {
        return Math.round((px - PIECE_GAP) / CELL_SIZE);
    }

    // ============ 拖拽逻辑 ============
    onDragStart(e, piece) {
        if (this.isWon) return;
        e.preventDefault();

        const pos = this.getEventPos(e);
        this.dragging = piece;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.dragPieceStartCol = piece.col;
        this.dragPieceStartRow = piece.row;

        piece.el.classList.add('dragging');
        this.dragDirection = null;

        // 计算可移动范围
        this.calcDragBounds(piece);
    }

    onDragMove(e) {
        if (!this.dragging) return;
        e.preventDefault();

        const pos = this.getEventPos(e);
        const dx = pos.x - this.dragStartX;
        const dy = pos.y - this.dragStartY;

        const piece = this.dragging;
        const baseX = this.colToPixel(this.dragPieceStartCol);
        const baseY = this.rowToPixel(this.dragPieceStartRow);

        // 确定拖拽方向（首次超过阈值时锁定）
        if (!this.dragDirection) {
            const threshold = 8;
            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                if (Math.abs(dx) >= Math.abs(dy)) {
                    this.dragDirection = this.dragBounds.canMoveH ? 'h' : (this.dragBounds.canMoveV ? 'v' : null);
                } else {
                    this.dragDirection = this.dragBounds.canMoveV ? 'v' : (this.dragBounds.canMoveH ? 'h' : null);
                }
            }
            if (!this.dragDirection) return;
        }

        let newPixelX = baseX;
        let newPixelY = baseY;

        if (this.dragDirection === 'h') {
            newPixelX = baseX + dx;
            newPixelX = Math.max(this.dragBounds.minX, Math.min(this.dragBounds.maxX, newPixelX));
        } else if (this.dragDirection === 'v') {
            newPixelY = baseY + dy;
            newPixelY = Math.max(this.dragBounds.minY, Math.min(this.dragBounds.maxY, newPixelY));
        }

        piece.el.style.left = newPixelX + 'px';
        piece.el.style.top = newPixelY + 'px';
    }

    onDragEnd(e) {
        if (!this.dragging) return;

        const piece = this.dragging;
        piece.el.classList.remove('dragging');

        // 判断是否为点击（没有实际拖拽）
        const pos = this.getEventPos(e);
        const totalDx = Math.abs(pos.x - this.dragStartX);
        const totalDy = Math.abs(pos.y - this.dragStartY);
        const isClick = totalDx < 5 && totalDy < 5;

        if (isClick) {
            // 点击自动移动：尝试四个方向
            this.tryAutoMove(piece);
            this.dragging = null;
            this.checkWin();
            return;
        }

        // 计算最终位置（吸附到网格）
        const currentLeft = parseFloat(piece.el.style.left);
        const currentTop = parseFloat(piece.el.style.top);

        let newCol = this.pixelToCol(currentLeft);
        let newRow = this.pixelToRow(currentTop);

        // 确保在有效范围内
        newCol = Math.max(0, Math.min(COLS - piece.w, newCol));
        newRow = Math.max(0, Math.min(ROWS - piece.h, newRow));

        // 验证移动是否有效
        this.removeFromGrid(piece);
        
        if (this.canMoveTo(piece, newCol, newRow) &&
            (newCol !== this.dragPieceStartCol || newRow !== this.dragPieceStartRow)) {
            // 记录历史
            this.history.push({
                pieceId: piece.id,
                fromCol: this.dragPieceStartCol,
                fromRow: this.dragPieceStartRow,
                toCol: newCol,
                toRow: newRow
            });

            // 更新位置
            piece.col = newCol;
            piece.row = newRow;
            this.moves++;
            this.movesEl.textContent = this.moves;
        } else {
            // 回到原位
            piece.col = this.dragPieceStartCol;
            piece.row = this.dragPieceStartRow;
        }

        // 吸附到网格
        piece.el.style.left = this.colToPixel(piece.col) + 'px';
        piece.el.style.top = this.rowToPixel(piece.row) + 'px';

        this.placeOnGrid(piece);
        this.dragging = null;

        // 检查胜利
        this.checkWin();
    }

    // 计算拖拽边界
    calcDragBounds(piece) {
        this.removeFromGrid(piece);

        const startCol = piece.col;
        const startRow = piece.row;

        // 向左最远
        let minCol = startCol;
        while (minCol > 0 && this.canMoveTo(piece, minCol - 1, startRow)) {
            minCol--;
        }

        // 向右最远
        let maxCol = startCol;
        while (maxCol + piece.w < COLS && this.canMoveTo(piece, maxCol + 1, startRow)) {
            maxCol++;
        }

        // 向上最远
        let minRow = startRow;
        while (minRow > 0 && this.canMoveTo(piece, startCol, minRow - 1)) {
            minRow--;
        }

        // 向下最远
        let maxRow = startRow;
        while (maxRow + piece.h < ROWS && this.canMoveTo(piece, startCol, maxRow + 1)) {
            maxRow++;
        }

        this.placeOnGrid(piece);

        // 判断主要移动方向（只允许单方向移动）
        // 先不限制方向，让拖拽更自由，但只允许水平或垂直
        this.dragBounds = {
            minX: this.colToPixel(minCol),
            maxX: this.colToPixel(maxCol),
            minY: this.rowToPixel(minRow),
            maxY: this.rowToPixel(maxRow),
            canMoveH: minCol !== maxCol,
            canMoveV: minRow !== maxRow
        };

        // 如果两个方向都能移动，根据拖拽方向决定
        this.dragDirection = null; // 将在 move 中确定
    }

    getEventPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // ============ 点击自动移动 ============
    tryAutoMove(piece) {
        const directions = [
            { dc: 0, dr: -1 }, // 上
            { dc: 0, dr: 1 },  // 下
            { dc: -1, dr: 0 }, // 左
            { dc: 1, dr: 0 },  // 右
        ];

        this.removeFromGrid(piece);

        for (const dir of directions) {
            const newCol = piece.col + dir.dc;
            const newRow = piece.row + dir.dr;

            if (this.canMoveTo(piece, newCol, newRow)) {
                // 记录历史
                this.history.push({
                    pieceId: piece.id,
                    fromCol: piece.col,
                    fromRow: piece.row,
                    toCol: newCol,
                    toRow: newRow
                });

                piece.col = newCol;
                piece.row = newRow;
                this.placeOnGrid(piece);

                piece.el.style.left = this.colToPixel(piece.col) + 'px';
                piece.el.style.top = this.rowToPixel(piece.row) + 'px';

                this.moves++;
                this.movesEl.textContent = this.moves;
                return;
            }
        }

        // 无法移动，放回原位
        this.placeOnGrid(piece);
    }

    // ============ 撤销 ============
    undo() {
        if (this.history.length === 0 || this.isWon) return;

        const last = this.history.pop();
        const piece = this.pieces[last.pieceId];

        this.removeFromGrid(piece);
        piece.col = last.fromCol;
        piece.row = last.fromRow;
        piece.el.style.left = this.colToPixel(piece.col) + 'px';
        piece.el.style.top = this.rowToPixel(piece.row) + 'px';
        this.placeOnGrid(piece);

        this.moves--;
        this.movesEl.textContent = this.moves;
    }

    // ============ 胜利检测 ============
    checkWin() {
        // 曹操到达底部中间位置 (col=1, row=3)
        const caocao = this.pieces.find(p => p.type === 'CAOCAO');
        if (caocao && caocao.col === 1 && caocao.row === 3) {
            this.isWon = true;
            this.clearTimer();

            // 显示胜利动画
            setTimeout(() => {
                this.winMovesEl.textContent = this.moves;
                this.winTimeEl.textContent = this.formatTime(this.seconds);
                this.winModal.classList.remove('hidden');
            }, 300);
        }
    }

    // ============ 计时器 ============
    startTimer() {
        this.clearTimer();
        this.seconds = 0;
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.timerEl.textContent = this.formatTime(this.seconds);
        }, 1000);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(totalSeconds) {
        const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const sec = (totalSeconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }
}

// ============ 启动游戏 ============
document.addEventListener('DOMContentLoaded', () => {
    new HuarongdaoGame();
});
