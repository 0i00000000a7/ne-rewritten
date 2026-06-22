import { type DiagramControl, lex_compare, type NotationDefinition, number_compare } from '@/utils.ts';
import type { Diagram, Rgba } from '@/core/diagram_types';
import { Y_FS_variants } from '@/notations/FS_util.ts';

/** Bashicu 矩阵表达式：number[][]，其中 [[Infinity]] 表示极限。 */
export type Expr = number[][];

/** 判断表达式是否表示极限（[[Infinity]]）。 */
export function is_infinite(a: Expr): boolean {
    return ('' + a).startsWith('Infinity');
}

export function is_limit(a: Expr): boolean {
    return a.length > 0 && a[a.length - 1].length > 0;
}

/** 矩阵比较：先处理 Infinity，再按字典序逐列比较。 */
export function compare(a: Expr, b: Expr): number {
    if (is_infinite(a) && is_infinite(b)) return 0;
    if (is_infinite(a)) return 1;
    if (is_infinite(b)) return -1;
    return lex_compare(a, b, (ca, cb) => lex_compare(ca, cb, number_compare));
}

/** 矩阵显示为字符串。空列显示为 (0)。 */
export function display(a: Expr): string {
    if (is_infinite(a)) return 'Limit';
    return a.map((col) => '(' + (col.length > 0 ? col.map((e) => '' + e).join(',') : '0') + ')').join('');
}

/**
 * 解析 display 的输出，恢复为矩阵。
 * 采用递归向下风格，内部 parse_column / parse_expression 返回 [result, end]。
 */
export function from_display(s: string): Expr {
    if (s === 'Limit') return [[Infinity]];
    s = s.trim();
    if (s === '') return [];

    function error(): never {
        throw new Error(`Illegal input string: ${s}`);
    }

    function skip_spaces(i: number): number {
        while (i < s.length && s[i] === ' ') i++;
        return i;
    }

    function parse_column(start: number): [number[], number] {
        if (s[start] !== '(') error();
        let i = skip_spaces(start + 1);

        if (i < s.length && s[i] === ')') return [[], i + 1];

        const col: number[] = [];
        while (i < s.length) {
            i = skip_spaces(i);

            if (i < s.length && s[i] >= '0' && s[i] <= '9') {
                let num = 0;
                while (i < s.length && s[i] >= '0' && s[i] <= '9') {
                    num = num * 10 + (s.charCodeAt(i) - 48);
                    i++;
                }
                col.push(num);
                i = skip_spaces(i);
                if (i < s.length && s[i] === ',') {
                    i++;
                } else if (i < s.length && s[i] === ')') {
                    i++;
                    break;
                } else {
                    error();
                }
            } else {
                error();
            }
        }
        return [col, i];
    }

    function parse_expression(start: number): [Expr, number] {
        const result: Expr = [];
        let i = start;
        while (i < s.length) {
            i = skip_spaces(i);
            if (i >= s.length || s[i] !== '(') break;
            const [col, end] = parse_column(i);
            result.push(col);
            i = end;
        }
        return [result, i];
    }

    const [result, end] = parse_expression(0);
    if (end !== s.length) error();
    return normalize(result);
}

/** 判断矩阵是否为极限（无限或最后一列首行非零）。 */
export function matrix_is_limit(a: Expr): boolean {
    return is_infinite(a) || (a.length > 0 && a[a.length - 1][0] > 0);
}

/** 返回每列末尾不含 0 的标准形式。 */
function normalize(m: Expr): Expr {
    return m.map((col) => {
        let end = col.length;
        while (end > 0 && col[end - 1] === 0) end--;
        return col.slice(0, end);
    });
}

/**
 * 计算矩阵每列每行的父节点索引。
 * 返回 P[i][j] 表示第 i 列第 j 行的父节点所在列号。
 */
function parents(m: Expr): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < m.length; i++) {
        result.push([]);
        for (let j = 0; j < m[i].length; j++) {
            let p: number | undefined = i;
            while (true) {
                p = j > 0 ? result[p!][j - 1] : p! - 1;
                if (p < 0) p = undefined;
                if (p === undefined) break;
                if ((m[p][j] ?? 0) < m[i][j]) break;
            }
            if (p !== undefined) result[i].push(p);
            else break;
        }
    }
    return result;
}

/**
 * 计算各列的阈值 A[i]。
 * 一项在复制时递增当且仅当它的祖先项经过根列。
 * A[i] 是列 i 中首个祖先链不经过根列的行号（0-based）。
 *
 * 判定：行 j 的祖先不经过根列，当 P[i][j] 无定义、
 * P[i][j] < r、或其自身的该行已不递增。
 */
function ascending_threshold(P: number[][], r: number, j_max: number): number[] {
    const result: number[] = [];
    result[r] = j_max;

    for (let i = r + 1; i < P.length; i++) {
        let result_i: number | undefined;
        for (let j = 0; j < j_max; j++) {
            const pij = P[i][j];
            if (pij === undefined || pij < r || j >= result[pij]) {
                result_i = j;
                break;
            }
        }
        result[i] = result_i ?? j_max;
    }

    return result;
}

/** BM4 展开算法。展开结果自动标准化。 */
function expand(m: Expr, index: number): Expr {
    if (m.length === 0) return m;

    const rightmost = m.length - 1;
    const col_last = m[rightmost];
    const height = col_last.length - 1;
    let topmost = height;
    for (; topmost >= 0; --topmost) {
        if (col_last[topmost] > 0) break;
    }

    let result = m.slice(0, rightmost);
    if (topmost < 0) return result;

    const P = parents(m);
    const r = P[rightmost][topmost];
    const A = ascending_threshold(P, r, topmost);
    const col_r = m[r];
    const offset = Array.from({ length: topmost }, (_, j) => col_last[j] - (col_r[j] ?? 0));

    for (let w = 1; w <= index; ++w) {
        for (let i = r; i < rightmost; ++i) {
            result.push(
                Array.from({ length: Math.max(m[i].length, A[i]) }, (_, y) => {
                    const val = m[i][y] ?? 0;
                    return y < A[i] ? val + offset[y] * w : val;
                }),
            );
        }
    }

    return result;
}

function Limit(n: number): Expr {
    return [[], Array.from({ length: n + 1 }, () => 1)];
}

/** 基础数列展开缓存。 */
interface MountainData {
    m: Expr;
    M: number[][];
    P: number[][];
}

/**
 * 计算山脉图数值矩阵。
 * mountain[i][j] = up + left，其中 up 是上一行的值，left 是父节点的值。
 * 底部行 (j=0) 即为 0Y 序列。
 * 值为 0 的 BM 行已被省略，绘制山脉图时补充完整。
 */
function compute_mountain(m: Expr): MountainData {
    const P = parents(m);
    const h = Math.max(...m.map((col) => col.length));
    const diagram_rows = h + 1;
    const M: number[][] = [];
    for (let i = 0; i < m.length; i++) {
        M.push([]);
        for (let j = diagram_rows - 1; j >= 0; j--) {
            if (j >= P[i].length || P[i][j] < 0) {
                M[i][j] = 1;
            } else {
                const up = M[i][j + 1] ?? 1;
                const left = M[P[i][j]][j] ?? 1;
                M[i][j] = up + left;
            }
        }
    }
    return { m, M, P };
}

/**
 * 将 Bashicu 矩阵转换为 0-Y 数列。
 * 用于显示等价表示。
 */
export function convert_to_0Y(m: Expr): number[] {
    return compute_mountain(m).M.map((col) => col[0]);
}

export function display_0Y(m: Expr): string {
    return is_infinite(m) ? '1,ω' : convert_to_0Y(m).join(',');
}

export function compute_0Y_mountain(seq: number[]): MountainData {
    const P: number[][] = Array.from({ length: seq.length }, () => []);
    const M: number[][] = Array.from({ length: seq.length }, (_, i) => [seq[i]]);
    const m: Expr = Array.from({ length: seq.length }, (_) => []);

    for (let j = 0; ; j++) {
        let has_next = false;
        for (let i = 0; i < seq.length; i++) {
            if (M[i][j] === 1) {
                M[i].push(1);
            } else {
                let p = j === 0 ? i - 1 : P[i][j - 1];
                while (p >= 0) {
                    if (M[i][j] > M[p][j]) break;
                    p = j === 0 ? p - 1 : P[p][j - 1];
                }
                if (p >= 0) {
                    P[i].push(p);
                    M[i].push(M[i][j] - M[p][j]);
                    m[i].push((m[p][j] ?? 0) + 1);
                    has_next = true;
                } else {
                    throw new Error('Illegal 0Y sequence: ' + seq);
                }
            }
        }
        if (!has_next) break;
    }
    return { M, P, m };
}

export function from_display_0Y(str: string): Expr {
    if (str === 'Limit' || str === '1,ω' || str === '1,w') return [[Infinity]];
    const result = str.split(',').map((s) => parseInt(s.trim(), 10));
    if (result.find(Number.isNaN) !== undefined) throw new Error('Illegal omega-Y sequence');
    return compute_0Y_mountain(result).m;
}

export interface DiagramData {
    current_equiv: '0Y' | undefined;
}

const draw_diagram_control: DiagramControl<Expr, DiagramData> = {
    default_data: { current_equiv: undefined },
    draw_diagram: (m: Expr, _data: DiagramData): Diagram | undefined => {
        if (is_infinite(m) || m.length === 0) return undefined;
        const { M, P } = compute_mountain(m);
        const A = 30;
        const rows = Math.max(...M.map((col) => col.length));
        const cols = M.length;
        const width = (cols + 1) * A;
        const height = (rows + 1) * A;
        const elements: Diagram['elements'] = [];
        const lines: Diagram['elements'] = [];
        const extra_text: Diagram['extra_text'] = [];
        const black: Rgba = { r: 0, g: 0, b: 0 };
        const off = 5; // port offset from node center

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < M[i].length; j++) {
                const cx = i * A + A;
                const cy = (rows - j) * A;
                const val = _data.current_equiv === '0Y' ? M[i][j] : ((m[i] ?? [])[j] ?? 0);

                // fold line: up from (i,j) then left-down to parent
                if (j < P[i].length && P[i][j] >= 0 && j + 1 < M[i].length) {
                    const up_cy = (rows - j - 1) * A;
                    const p_cx = P[i][j] * A + A;
                    // vertical: top port of (i,j) → bottom port of (i,j+1)
                    lines.push({
                        type: 'line',
                        x1: cx,
                        y1: cy - off,
                        x2: cx,
                        y2: up_cy + off,
                        stroke: true,
                        stroke_color: black,
                        width: 1,
                    });
                    // diagonal: bottom port of (i,j+1) → top port of (P[i][j], j)
                    lines.push({
                        type: 'line',
                        x1: cx,
                        y1: up_cy + off,
                        x2: p_cx,
                        y2: cy - off,
                        stroke: true,
                        stroke_color: black,
                        width: 1,
                    });
                }

                // value text (no circle)
                extra_text.push({
                    text: '' + val,
                    x: cx,
                    y: cy,
                    size: 10,
                    color: black,
                    align: 'center',
                });
            }
        }

        elements.unshift(...lines);
        return { width, height, elements, extra_text };
    },
};

export const BM4: NotationDefinition<Expr> = {
    id: 'bm4',
    name: 'Bashicu matrix (BMS)',
    simple_name: 'BMS',
    display: { plain: display, from_display },
    display_equiv: {
        '0Y': {
            plain: display_0Y,
            from_display: from_display_0Y,
        },
    },
    is_limit: matrix_is_limit,
    compare,
    draw_diagram: draw_diagram_control,

    ...Y_FS_variants(expand, is_infinite, Limit, is_limit, display),

    init: () => [[[Infinity]], []],

    debug: { compute_0Y_mountain },
};
