import { type NotationDefinition, number_compare } from '@/utils';

/** ω 表达式：Infinity 表示 ω，有限数表示后继。 */
export type Expr = number;

/** 判断是否为 ω。 */
export function is_infinite(a: Expr): boolean {
    return a === Infinity;
}

/** 序数比较。 */
export function compare(a: Expr, b: Expr): number {
    return number_compare(a, b);
}

/** 显示为字符串。ω 显示为 ω。 */
export function display(a: Expr): string {
    return a === Infinity ? 'ω' : '' + a;
}

/**
 * 解析 display 的输出，恢复为表达式。
 * 支持 'ω', 'w', 以及数字字符串。
 */
export function from_display(s: string): Expr {
    s = s.trim().toLowerCase();
    if (s === 'ω' || s === 'w') return Infinity;
    if (!/^-?\d+$/.test(s)) throw new Error(`Illegal input string: ${s}`);
    return parseInt(s, 10);
}

export const omega: NotationDefinition<Expr> = {
    id: 'omega',
    name: 'ω',
    display: { plain: display, from_display },
    is_limit: (a) => a === Infinity,
    compare,
    FS: (a, i) => (a === Infinity ? i : a > 0 ? a - 1 : 0),

    init: () => [Infinity, 0],
};
