/** 数字比较：相等 → 0，小于 → -1，大于 → 1。 */
export function number_compare(a: number, b: number): number {
    return a === b ? 0 : a < b ? -1 : 1;
}

/** 字典序比较（通用）。 */
export function lex_compare<T>(
    a: T[],
    b: T[],
    cmp: (a: T, b: T) => number,
): number {
    let len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const result = cmp(a[i], b[i]);
        if (result !== 0) return result;
    }
    return number_compare(a.length, b.length);
}

// ---------------------------------------------------------------------------
// 通用节记定义类型（Expr 类型由各 notation 自行定义）
// ---------------------------------------------------------------------------

export interface NotationItem<T> {
    expr: T;
    low: T;
}

export interface NotationDefinition<T> {
    id: string;
    name: string;
    display: (a: T) => string;
    display_equiv: (a: T) => string;
    is_limit: (a: T) => boolean;
    compare: (a: T, b: T) => number;
    FS: (a: T, index: number) => T;
    init: () => NotationItem<T>[];
}
