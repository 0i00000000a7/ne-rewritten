import {
    number_compare,
    lex_compare,
    type NotationDefinition,
} from '../utils'

/** Bashicu 矩阵表达式：number[][]，其中 [[Infinity]] 表示极限。 */
export type Expr = number[][]

// ---------------------------------------------------------------------------
// Expr 相关操作
// ---------------------------------------------------------------------------

/** 判断表达式是否表示极限（[[Infinity]]）。 */
export function is_infinite(a: Expr): boolean {
    return ('' + a).startsWith('Infinity')
}

/** 矩阵比较：先处理 Infinity，再按字典序逐列比较。 */
export function compare(a: Expr, b: Expr): number {
    if (is_infinite(a) && is_infinite(b)) return 0
    if (is_infinite(a)) return 1
    if (is_infinite(b)) return -1
    return lex_compare(a, b, (ca, cb) => lex_compare(ca, cb, number_compare))
}

/** 矩阵显示为字符串。 */
export function display(a: Expr): string {
    if (is_infinite(a)) return 'Limit'
    return a
        .map(col => '(' + col.map(entry => '' + entry).join(',') + ')')
        .join('')
}

/** 判断矩阵是否为极限（无限或最后一列首行非零）。 */
export function matrix_is_limit(a: Expr): boolean {
    return is_infinite(a) || (a.length > 0 && a[a.length - 1][0] > 0)
}

// ---------------------------------------------------------------------------
// BM4 算法内部函数
// ---------------------------------------------------------------------------

/**
 * 计算矩阵每列每行的父节点索引。
 * 返回 P[i][j] 表示第 i 列第 j 行的父节点所在列号。
 */
function parents(m: Expr): number[][] {
    const result: number[][] = []
    for (let i = 0; i < m.length; i++) {
        result.push([])
        for (let j = 0; j < m[i].length; j++) {
            let p: number | undefined = i
            while (true) {
                p = (j > 0 ? result[p!][j - 1] : p! - 1)
                if (p < 0) p = undefined
                if (p === undefined) break
                if (m[p][j] < m[i][j]) break
            }
            if (p !== undefined) result[i].push(p); else break
        }
    }
    return result
}

/**
 * 计算上升阈值 (ascending threshold)。
 * 对于每一行 i（i ≥ r），确定展开时应从哪一列开始上升。
 */
function ascending_threshold(
    P: number[][],
    r: number,
    j_max: number,
): number[] {
    const result: number[] = []
    result[r] = j_max

    for (let i = r + 1; i < P.length; i++) {
        let result_i: number | undefined
        for (let j = 0; j < j_max; j++) {
            const pij = P[i][j]
            if (pij === undefined || pij < r || j >= result[pij]) {
                result_i = j
                break
            }
        }
        result[i] = result_i ?? j_max
    }

    return result
}

/** BM4 展开算法。 */
function expand(m: Expr, index: number): Expr {
    if (m.length === 0) return m

    const rightmost = m.length - 1
    const col_last = m[rightmost]
    const height = col_last.length - 1
    let topmost = height
    for (; topmost >= 0; --topmost) {
        if (col_last[topmost] > 0) break
    }

    let result = m.slice(0, rightmost)
    if (topmost < 0) return result

    const P = parents(m)
    const r = P[rightmost][topmost]
    const A = ascending_threshold(P, r, topmost)
    const col_r = m[r]
    const offset = Array.from(
        {length: topmost},
        (_, j) => col_last[j] - col_r[j],
    )

    for (let w = 1; w <= index; ++w) {
        for (let i = r; i < rightmost; ++i) {
            result.push(
                m[i].map((value, y) => y < A[i] ? value + offset[y] * w : value,),
            )
        }
    }

    if (
        height > 0 &&
        result.every(column => column[height] === 0)
    ) {
        result = result.map(column => column.slice(0, height))
    }
    return result
}

/**
 * 将 Bashicu 矩阵转换为 0-Y 数列。
 * 用于显示等价表示。
 */
function convert_to_0Y(m: Expr): number[] {
    const P = parents(m)
    const mountain: number[][] = []
    for (let i = 0; i < m.length; i++) {
        mountain.push([])
        for (let j = P[i].length - 1; j >= 0; j--) {
            const up = mountain[i][j + 1] ?? 1
            const left = mountain[P[i][j]][j] ?? 1
            mountain[i][j] = up + left
        }
    }
    return mountain.map(col => col[0] ?? 1)
}

// ---------------------------------------------------------------------------
// 节记定义（导出给注册器使用）
// ---------------------------------------------------------------------------

/** 基础数列展开缓存。 */
const data: Record<string, Expr[]> = {}

export const BM4: NotationDefinition<Expr> = {
    id: 'bm4',
    name: 'Bashicu matrix',
    display: display,
    display_equiv: m =>
        is_infinite(m) ? '1,ω' : '' + convert_to_0Y(m),
    is_limit: matrix_is_limit,
    compare: compare,

    FS: (m, index) => {
        if (is_infinite(m))
            return [
                Array(index + 1).fill(0),
                Array(index + 1).fill(1),
            ]
        if (m.length === 0) return []

        const datakey = display(m)
        if (!data[datakey]) data[datakey] = []
        else if (data[datakey][index] !== undefined)
            return data[datakey][index]

        return (data[datakey][index] = expand(m, index))
    },

    init: () => [
        {expr: [[Infinity]], low: []},
        {expr: [], low: []},
    ],
}