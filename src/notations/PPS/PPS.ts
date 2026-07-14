import { lex_compare, number_compare } from '@/utils.ts';
import { Y_FS_variants } from '@/notations/notation_utils.ts';
import { NotationDefinition } from '@/notation-definition.ts';

export type Expr = number[];

export function INFINITY(): Expr {
    return [Infinity];
}

export function is_infinity(a: Expr): boolean {
    return '' + a === 'Infinity';
}

export function is_limit(seq: Expr): boolean {
    return seq.length > 0 && seq[seq.length - 1] > 0;
}

export function compare(a: Expr, b: Expr): number {
    return lex_compare(a, b, number_compare);
}

export function sequence_display(expr: Expr): string {
    if (is_infinity(expr)) return 'Limit';
    return '' + expr;
}

export function sequence_display_html(expr: Expr): string {
    if (is_infinity(expr)) return 'Limit';
    return expr.map((v, i) => v + '<sub style="color:grey">' + (i + 1) + '</sub>').join('');
}

export function sequence_from_display(str: string): Expr {
    if (str === 'Limit') return INFINITY();
    const result = str.split(',').map((s) => parseInt(s.trim(), 10));
    if (result.find(Number.isNaN) !== undefined) throw new Error('Illegal PPS sequence');
    return result;
}

function limit_FS(n: number): Expr {
    const result: number[] = [];
    for (let i = 0; i <= n; i++) result.push(i);
    return result;
}

type StrongExpandFn = (seq: Expr, x: number, b: number, i: number, L: number) => number;

function make_expand(expand_strong: StrongExpandFn) {
    return (seq: Expr, FSterm: number): Expr => {
        const len = seq.length;
        const x = seq[len - 1];
        const b = seq[x - 1];
        const badpart = seq.slice(x, len - 1);
        const L = len - x;
        const flag = badpart.some((val) => val === b);
        const result = seq.slice(0, -1);

        for (let i = 1; i <= FSterm; i++) {
            result.push(flag ? b : expand_strong(seq, x, b, i, L));
            result.push(...badpart.map((v) => (v < x ? v : v + L * i)));
        }
        return result;
    };
}

const expand_pps4_fn: StrongExpandFn = (seq, x, b) => {
    const idx = seq.slice(b, x - 1).findLastIndex((val) => val <= b);
    return idx !== -1 ? b + 1 + idx : b;
};

const expand_weak_fn: StrongExpandFn = (seq, x, b) => {
    const idx = seq.slice(b, x - 1).findLastIndex((val) => val === b);
    return idx !== -1 ? b + 1 + idx : b;
};

const expand_extremely_weak_fn: StrongExpandFn = (seq, x, b) => {
    for (let idx = x - 2; idx >= b; idx--) {
        if (seq[idx] === b) return b + 1 + idx;
        if (seq[idx] < b) break;
    }
    return b;
};

const expand_second_fn: StrongExpandFn = (seq, x, b, i, L) => {
    for (let idx = x - 2; idx >= b; idx--) {
        if (seq[idx] === b) return b + 1 + idx + L * i - L;
        if (seq[idx] < b) break;
    }
    return b;
};

const expand_third_fn: StrongExpandFn = (seq, x, b, i, L) => {
    const idx = seq.slice(b, x - 1).findLastIndex((val) => val === b);
    return idx !== -1 ? b + 1 + idx + L * i - L : b;
};

const expand_pps4 = make_expand(expand_pps4_fn);
const expand_weak = make_expand(expand_weak_fn);
const expand_extremely_weak = make_expand(expand_extremely_weak_fn);
const expand_second = make_expand(expand_second_fn);
const expand_third = make_expand(expand_third_fn);

function create_pps_notation(
    id: string,
    name: string,
    expand_fn: (seq: Expr, index: number) => Expr,
): NotationDefinition<Expr> {
    return {
        id,
        name,
        category_id: 'category-pps',
        display: {
            plain: sequence_display,
            html: sequence_display_html,
            from_display: sequence_from_display,
        },
        is_limit,
        compare,
        ...Y_FS_variants(expand_fn, is_infinity, limit_FS, is_limit, sequence_display),
        init: () => [INFINITY(), []],
    };
}

export const pps4 = create_pps_notation('pps4', 'Parented predecessor sequence 4', expand_pps4);

export const wpps4 = create_pps_notation('wpps4', 'Weak PPS4', expand_weak);

export const ewpps4 = create_pps_notation('ewpps4', 'Extremely weak PPS4', expand_extremely_weak);

export const spps4 = create_pps_notation('spps4', 'Second PPS4', expand_second);

export const tpps4 = create_pps_notation('tpps4', 'Third PPS4', expand_third);
