/**
 * 华容道布局验证器 - 使用 BFS 验证每个布局是否可解
 * 在 Node.js 中运行: node verify.js
 */

const COLS = 4;
const ROWS = 5;

const PIECE_TYPES = {
    CAOCAO: { w: 2, h: 2 },
    GUANYU: { w: 2, h: 1 },
    ZHANGFEI: { w: 1, h: 2 },
    ZHAOYUN: { w: 1, h: 2 },
    MACHAO: { w: 1, h: 2 },
    HUANGZHONG: { w: 1, h: 2 },
    BING1: { w: 1, h: 1 },
    BING2: { w: 1, h: 1 },
    BING3: { w: 1, h: 1 },
    BING4: { w: 1, h: 1 },
};

const LAYOUTS = {
    hengdaolima: {
        name: '横刀立马',
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
    binglinchengxia: {
        name: '兵临城下',
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

/**
 * 将棋盘状态编码为字符串（用于去重）
 * 关键优化：同类型棋子视为等价（如4个兵互换不算新状态）
 */
function encodeState(pieces) {
    const parts = [];
    // 曹操单独编码（唯一的2x2）
    const caocao = pieces.find(p => p.type === 'CAOCAO');
    parts.push(`C${caocao.col}${caocao.row}`);
    
    // 关羽（唯一的2x1横将）
    const guanyu = pieces.find(p => p.type === 'GUANYU');
    parts.push(`G${guanyu.col}${guanyu.row}`);
    
    // 竖将（1x2）- 排序后编码
    const vGenerals = pieces.filter(p => PIECE_TYPES[p.type].w === 1 && PIECE_TYPES[p.type].h === 2);
    const vPositions = vGenerals.map(p => p.col * 10 + p.row).sort((a, b) => a - b);
    parts.push('V' + vPositions.join(','));
    
    // 小兵（1x1）- 排序后编码
    const soldiers = pieces.filter(p => PIECE_TYPES[p.type].w === 1 && PIECE_TYPES[p.type].h === 1);
    const sPositions = soldiers.map(p => p.col * 10 + p.row).sort((a, b) => a - b);
    parts.push('S' + sPositions.join(','));
    
    return parts.join('|');
}

/**
 * BFS 求解华容道
 * 返回最少步数，或 -1 表示无解
 */
function solve(layoutPieces) {
    const initPieces = layoutPieces.map(p => ({
        type: p.type,
        col: p.col,
        row: p.row,
        w: PIECE_TYPES[p.type].w,
        h: PIECE_TYPES[p.type].h
    }));

    // 验证初始布局有效性
    const initGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    for (let i = 0; i < initPieces.length; i++) {
        const p = initPieces[i];
        for (let r = p.row; r < p.row + p.h; r++) {
            for (let c = p.col; c < p.col + p.w; c++) {
                if (r >= ROWS || c >= COLS || initGrid[r][c] !== -1) {
                    return { solved: false, error: `布局无效：棋子 ${p.type} 在 (${p.col},${p.row}) 冲突或越界` };
                }
                initGrid[r][c] = i;
            }
        }
    }

    const initState = encodeState(initPieces);
    const visited = new Set();
    visited.add(initState);

    const queue = [{ pieces: initPieces, steps: 0 }];
    const directions = [
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 },
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 }
    ];

    let statesExplored = 0;

    while (queue.length > 0) {
        const { pieces, steps } = queue.shift();
        statesExplored++;

        const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];
            for (let r = p.row; r < p.row + p.h; r++) {
                for (let c = p.col; c < p.col + p.w; c++) {
                    grid[r][c] = i;
                }
            }
        }

        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];

            for (const dir of directions) {
                const newCol = p.col + dir.dc;
                const newRow = p.row + dir.dr;

                if (newCol < 0 || newRow < 0 || newCol + p.w > COLS || newRow + p.h > ROWS) {
                    continue;
                }

                let canMove = true;
                for (let r = newRow; r < newRow + p.h && canMove; r++) {
                    for (let c = newCol; c < newCol + p.w && canMove; c++) {
                        if (grid[r][c] !== -1 && grid[r][c] !== i) {
                            canMove = false;
                        }
                    }
                }

                if (!canMove) continue;

                const newPieces = pieces.map((pp, idx) => {
                    if (idx === i) {
                        return { ...pp, col: newCol, row: newRow };
                    }
                    return { ...pp };
                });

                const caocao = newPieces.find(pp => pp.type === 'CAOCAO');
                if (caocao.col === 1 && caocao.row === 3) {
                    return { solved: true, steps: steps + 1, statesExplored };
                }

                const stateKey = encodeState(newPieces);
                if (!visited.has(stateKey)) {
                    visited.add(stateKey);
                    queue.push({ pieces: newPieces, steps: steps + 1 });
                }
            }
        }
    }

    return { solved: false, statesExplored };
}

// ============ 运行验证 ============
console.log('========================================');
console.log('  华容道布局验证器 - BFS 求解');
console.log('========================================\n');

let allValid = true;

for (const [key, layout] of Object.entries(LAYOUTS)) {
    process.stdout.write(`正在验证: ${layout.name} (${key})... `);
    const startTime = Date.now();
    const result = solve(layout.pieces);
    const elapsed = Date.now() - startTime;

    if (result.error) {
        console.log(`❌ 错误: ${result.error}`);
        allValid = false;
    } else if (result.solved) {
        console.log(`✅ 可解! 最少 ${result.steps} 步 (${elapsed}ms, 探索 ${result.statesExplored} 个状态)`);
    } else {
        console.log(`❌ 无解! (${elapsed}ms, 探索 ${result.statesExplored} 个状态)`);
        allValid = false;
    }
}

console.log('\n========================================');
if (allValid) {
    console.log('✅ 所有布局验证通过！每一关都可解。');
} else {
    console.log('❌ 部分布局验证失败，请检查。');
}
console.log('========================================');
