import {
    deepcopy,
    lex_compare,
    NotationDefinition,
    number_compare,
    type DiagramControl,
    DisplaySet,
    DisplayMap,
} from '@/utils.ts';
import type { Diagram, Rgba } from '@/core/diagram_types.ts';
import { MN_FS_variants } from '@/notations/FS_util.ts';

const data = new Map<string, Expr>();
const data_shorter = new Map<string, Expr>();

type Sep = number;
type Vertical = Sep[];
type Entry = [number, Sep];
type Column = Entry[];
type Expr = Column[];

function is_infinite(m: Expr): boolean {
    return ('' + m).startsWith('Infinity');
}

function entry_compare(a: Entry, b: Entry): number {
    return lex_compare(a, b, number_compare);
}

function column_compare(a: Column, b: Column): number {
    return lex_compare(a, b, entry_compare);
}

function mountain_compare(a: Expr, b: Expr): number {
    if (is_infinite(a) && is_infinite(b)) return 0;
    if (is_infinite(a)) return 1;
    if (is_infinite(b)) return -1;
    return lex_compare(a, b, column_compare);
}

function mountain_is_limit(m: Expr): boolean {
    return is_infinite(m) || (m.length > 0 && m[m.length - 1].length > 0);
}

function sep_display(sep: Sep): string {
    return ','.repeat(sep + 1);
}

function vertical_display(v: Vertical): string {
    return v.map(sep_display).join('/');
}

function entry_display(e: Entry): string {
    return sep_display(e[1]) + e[0];
}

function column_display(col: Column): string {
    return '(' + col.map(entry_display).join('') + ')';
}

function mountain_display(m: Expr): string {
    if (is_infinite(m)) return 'Limit';
    return m.map(column_display).join('');
}

function mountain_from_display(str: string): Expr {
    if (str === 'Limit') return [[[Infinity] as any]];

    function parseSimpleSep(start: number): [Sep, number] {
        let c0 = 0;
        while (start + c0 < str.length && str[start + c0] === ',') c0++;
        return [c0 - 1, start + c0];
    }

    function parseExprPrefix(start: number): [Expr, number] {
        const expr: Expr = [];
        let i = start;
        while (i < str.length && str[i] === '(') {
            i++;
            const col: Column = [];
            while (i < str.length && str[i] !== ')') {
                const [sep, nextI] = parseSimpleSep(i);
                i = nextI;
                let valueStart = i;
                while (i < str.length && str[i] >= '0' && str[i] <= '9') i++;
                const valueStr = str.substring(valueStart, i);
                if (valueStr === '') throw new Error('illegal input string: ' + str);
                col.push([parseInt(valueStr), sep]);
            }
            expr.push(col);
            if (i === str.length || str[i] !== ')') throw new Error('illegal input string: ' + str);
            i++;
        }
        return [expr, i];
    }

    const [result, end] = parseExprPrefix(0);
    if (end !== str.length) throw new Error('illegal input string: ' + str);
    return result;
}

function vertical_compare(a: Vertical, b: Vertical): number {
    return lex_compare(a, b, number_compare);
}

function vertical_increase(v: Vertical, s: Sep): Vertical {
    let i = v.length;
    while (i > 0 && v[i - 1] < s) --i;
    return v.slice(0, i).concat([s]);
}

/**
 * assume v1 > v2
 * @param v1
 * @param v2
 */
function vertical_diff(v1: Vertical, v2: Vertical): Sep {
    let i = 0;
    while (i < v2.length && v1[i] === v2[i]) i++;
    return v1[i];
}

function find_index_below_row(Vi: Vertical[], v: Vertical): number {
    const working = [[] as Vertical].concat(Vi);
    let i1 = 0,
        i2 = working.length - 1;
    while (i1 < i2) {
        const i = Math.ceil((i1 + i2) / 2);
        if (vertical_compare(working[i], v) < 0) i1 = i;
        else i2 = i - 1;
    }
    return i1;
}

function parent(m: Expr, V: Vertical[][], [i, j]: [number, number]): [number, number] {
    const pi = m[i][j][0] - 1;
    const pj = find_index_below_row(V[pi], V[i][j]);
    return [pi, pj];
}

function column_verticals(column: Column): Vertical[] {
    const v: Vertical[] = [[]];
    for (let j = 0; j < column.length; j++) v.push(vertical_increase(v[j], column[j][1]));
    return v.slice(1);
}

function mountain_verticals(m: Expr): Vertical[][] {
    return m.map(column_verticals);
}

function get_references(m: Expr, rtops: Vertical[]): number[] {
    const verticals = column_verticals(m[m.length - 1]);
    verticals.unshift([]);
    const ref: number[] = [];
    let i = 0,
        j = 0;
    while (i < verticals.length && j < rtops.length) {
        if (vertical_compare(verticals[i], rtops[j]) < 0) {
            ref[j] = i;
            i++;
        } else {
            j++;
        }
    }
    return ref;
}

function expand(m0: Expr, index: number, shorter: boolean = false): Expr {
    const data_key = mountain_display(m0);
    if (shorter) {
        const v = data_shorter.get(data_key + '"' + index);
        if (v) return v;
    } else {
        const v = data.get(data_key + '"' + index);
        if (v) return v;
    }

    const rightmost = m0.length - 1;
    const topmost = m0[rightmost].length - 1;
    const m = deepcopy(m0);

    if (topmost === -1) {
        m.pop();
        return m;
    }

    const tr_entry = m[rightmost][topmost];
    const tr_separator = tr_entry[1];
    const V0 = mountain_verticals(m);
    const BRij = parent(m, V0, [rightmost, topmost]);
    const width = rightmost - BRij[0];
    const top_verticals = V0[BRij[0]].slice(0, BRij[1]);
    top_verticals.push(V0[rightmost][topmost]);

    if (tr_separator === 0) {
        m[rightmost].pop();
    } else {
        const new_tr_separator = tr_separator - 1;
        if (
            vertical_compare(
                vertical_increase(V0[BRij[0]][BRij[1] - 1] ?? [], new_tr_separator),
                V0[rightmost][topmost - 1] ?? [],
            ) <= 0
        )
            m[rightmost].pop();
        else m[rightmost][topmost][1] = new_tr_separator;
    }
    m[rightmost] = m[rightmost].concat(m[BRij[0]].slice(BRij[1]));
    const V = mountain_verticals(m);
    const magma_checks_list: number[][] = [];
    for (let i = BRij[0] + 1; i <= rightmost; i++) {
        magma_checks_list[i] = [];
        for (let j = 0; j < m[i].length; j++) {
            let working: [number, number] = [i, j];
            while (working[0] > BRij[0]) {
                if (m[working[0]].length <= working[1]) --working[1];
                working = parent(m, V, working);
            }
            magma_checks_list[i][j] =
                working[0] === BRij[0] &&
                working[1] <= BRij[1] &&
                !vertical_compare(V[working[0]][working[1] - 1] ?? [], V[i][j - 1] ?? [])
                    ? working[1]
                    : -1;
        }
    }
    for (let n = 1; n <= index; n++) {
        const refs = get_references(m, top_verticals);
        refs[-1] = -1;
        for (let dx = 1; dx <= width; dx++) {
            const x = BRij[0] + dx;
            const source_magmas = magma_checks_list[x];
            const target_column: Column = [];
            m[x].forEach((entry, y) => {
                const value = entry[0];
                if (~source_magmas[y]) {
                    const BR_index = source_magmas[y];
                    for (let j = refs[BR_index - 1] + 1; j <= refs[BR_index]; j++) {
                        if (j === refs[BR_index]) target_column.push([value + width * n, entry[1]]);
                        else target_column.push([value + width * n, m[BRij[0] + width * n][j][1]]);
                    }
                } else {
                    target_column.push([value + (value > BRij[0] ? width * n : 0), entry[1]]);
                }
            });
            m[x + width * n] = target_column;
        }
    }
    if (shorter) m.pop();
    if (shorter) data_shorter.set(data_key + '"' + index, m);
    else data.set(data_key + '"' + index, m);
    return m;
}

function Limit(n: number): Expr {
    return [[], [[1, n]]];
}

function calc_ancestor_depths(m: Expr): number[][] {
    if (!Array.isArray(m) || m.length === 0) return [];
    const V = m.map(column_verticals);
    const depthMap: number[][] = Array.from({ length: m.length }, () => []);
    const visited = new Set();

    function getDepth(i: number, j: number): number {
        const key = `${i},${j}`;
        if (visited.has(key)) return 0;
        visited.add(key);
        const [pCol, pRow] = parent(m, V, [i, j]);
        if (pCol < 0 || pCol >= m.length || pRow < 0 || pRow >= m[pCol].length) {
            visited.delete(key);
            return 0;
        }
        const depth = 1 + getDepth(pCol, pRow);
        visited.delete(key);
        return depth;
    }

    for (let i = 0; i < m.length; i++) {
        const column = m[i];
        for (let j = 0; j < column.length; j++) {
            depthMap[i][j] = getDepth(i, j);
        }
    }
    return depthMap;
}

function convert_to_layer(om: Expr): Expr {
    if (is_infinite(om)) return om;

    const depthMap = calc_ancestor_depths(om);
    const dm = deepcopy(om);
    for (let i = 0; i < dm.length; i++) {
        const column = dm[i];
        for (let j = 0; j < column.length; j++) {
            const entry = column[j];
            entry[0] = depthMap[i][j] + 1;
        }
    }
    return dm;
}

function convert_from_layer(dm: Expr): Expr {
    if (is_infinite(dm)) return dm;

    const om = deepcopy(dm);

    let V = om.map(column_verticals);
    for (let i = 0; i < om.length; i++) {
        const column = om[i];
        for (let j = 0; j < column.length; j++) {
            const entry = column[j];

            let i1 = i,
                j1 = j - 1;
            while (true) {
                if (i1 === 0) {
                    entry[0] = 1;
                    break;
                }
                if (j1 >= 0) {
                    [i1, j1] = parent(om, V, [i1, j1]);
                } else {
                    i1 = i1 - 1;
                }
                let j0 = find_index_below_row(V[i1], j === 0 ? [0] : V[i][j - 1].concat([0]));
                if (j0 === dm[i1].length || dm[i1][j0][0] < entry[0]) {
                    entry[0] = i1 + 1;
                    break;
                }
            }
        }
    }

    return om;
}

export interface DiagramData {
    current_equiv: string | undefined;
    invert_vertical?: boolean;
}

const draw_diagram_control: DiagramControl<Expr, DiagramData> = {
    default_data: { current_equiv: undefined, invert_vertical: undefined },
    draw_diagram: (_expr: Expr, _data: DiagramData): Diagram | undefined => {
        if (is_infinite(_expr) || _expr.length === 0) return undefined;

        const invert_vertical = _data.invert_vertical ?? false;

        const vertical_set = new DisplaySet<Vertical>(vertical_display);
        const m = _expr;
        const m_display = _data.current_equiv === 'layer' ? convert_to_layer(_expr) : _expr;
        const V = m.map(column_verticals);

        vertical_set.add([]);
        for (let Vi of V) for (let v of Vi) vertical_set.add(v);
        const sorted_verticals = vertical_set.values().sort(vertical_compare);
        const vertical_index = new DisplayMap<Vertical, number>(vertical_display);
        for (let i = 0; i < sorted_verticals.length; i++) {
            vertical_index.set(sorted_verticals[i], i);
        }

        const diagram_entries: (string | undefined)[][] = Array.from({ length: m.length }, () =>
            Array.from({ length: vertical_index.size }, () => undefined),
        );

        const diagram_left_legs: ([number, number] | undefined)[][] = Array.from({ length: m.length }, () =>
            Array.from({ length: vertical_index.size }, () => undefined),
        );

        for (let i = 0; i < m.length; ++i) {
            diagram_entries[i][0] = '*';
            for (let j = 0; j < m[i].length; j++) {
                const vj = vertical_index.get(V[i][j])!;

                diagram_entries[i][vj] = entry_display(m_display[i][j]);

                const [pi, pj] = parent(m, V, [i, j]);
                const pvj = pj === 0 ? 0 : vertical_index.get(V[pi][pj - 1])!;

                diagram_left_legs[i][vj] = [pi, pvj];
            }
        }

        const H = 40;
        const HS = 5;
        const W = 30;
        const WV = 50;
        const H_off = 10;
        const padding = 10;
        const text_size = 14;

        const line_heights: number[] = [];
        const heights: number[] = [0];
        for (let i = 1; i < sorted_verticals.length; i++) {
            const sep: Sep = vertical_diff(sorted_verticals[i], sorted_verticals[i - 1]);
            const d_height = H + HS * sep;
            heights.push(heights[i - 1] + d_height);

            for (let k = 0; k <= sep; k++) line_heights.push(heights[i - 1] + H / 2 + HS * k);
        }

        const height_last = heights[heights.length - 1] + padding;
        const total_height = height_last + padding;
        const width = WV + m.length * W;
        const calc_cy = (vj: number) => (invert_vertical ? padding + heights[vj] : height_last - heights[vj]);

        const elements: Diagram['elements'] = [];
        const lines: Diagram['elements'] = [];
        const extra_text: Diagram['extra_text'] = [];
        const black: Rgba = { r: 0, g: 0, b: 0 };
        const gray: Rgba = { r: 200, g: 200, b: 200 };
        // 翻转时连接方向取反：原 "中心下方" 为 cy+H_off，翻转后 "下方" 变为 cy-H_off
        const h_off_vec = invert_vertical ? -H_off : H_off;

        // horizontal grid lines
        for (const h of line_heights) {
            const y = invert_vertical ? h + padding : height_last - h;
            lines.push({
                type: 'line',
                x1: 0,
                y1: y,
                x2: width,
                y2: y,
                stroke: true,
                stroke_color: gray,
                width: 1,
            });
        }

        for (let vj = 0; vj < sorted_verticals.length; vj++) {
            const cx = WV / 2;
            const cy = calc_cy(vj);
            extra_text.push({
                text: vertical_display(sorted_verticals[vj]),
                x: cx,
                y: cy,
                size: text_size,
                color: black,
                align: 'center',
            });
        }

        for (let i = 0; i < m.length; i++) {
            for (let vj = 0; vj < sorted_verticals.length; vj++) {
                const text = diagram_entries[i][vj];
                if (text === undefined) continue;

                const cx = WV + W * i + W / 2;
                const cy = calc_cy(vj);

                // right leg: connect to the nearest existing node below
                if (vj > 0) {
                    let kv = vj - 1;
                    while (kv > 0 && diagram_entries[i][kv] === undefined) kv--;
                    if (diagram_entries[i][kv] !== undefined) {
                        const cy_below = calc_cy(kv);
                        lines.push({
                            type: 'line',
                            x1: cx,
                            y1: cy + h_off_vec,
                            x2: cx,
                            y2: cy_below - h_off_vec,
                            stroke: true,
                            stroke_color: black,
                            width: 1,
                        });
                    }
                }

                // left leg fold line
                const leg = diagram_left_legs[i][vj];
                if (leg !== undefined && vj > 0) {
                    const [pi, pvj] = leg;
                    const p_cx = WV + W * pi + W / 2;
                    const cy_mid = calc_cy(vj - 1);
                    const cy_target = calc_cy(pvj);

                    // segment 1: (i, vj) → (pi, vj-1)
                    lines.push({
                        type: 'line',
                        x1: cx,
                        y1: cy + h_off_vec,
                        x2: p_cx,
                        y2: cy_mid - h_off_vec,
                        stroke: true,
                        stroke_color: black,
                        width: 1,
                    });
                    // segment 2: (pi, vj-1) → (pi, pvj)
                    lines.push({
                        type: 'line',
                        x1: p_cx,
                        y1: cy_mid - h_off_vec,
                        x2: p_cx,
                        y2: cy_target - h_off_vec,
                        stroke: true,
                        stroke_color: black,
                        width: 1,
                    });
                }

                // value text
                extra_text.push({
                    text: text,
                    x: cx,
                    y: cy,
                    size: text_size,
                    color: black,
                    align: 'center',
                });
            }
        }

        elements.unshift(...lines);
        return { width, height: total_height, elements, extra_text };
    },
    handle_action: (data: DiagramData, action): DiagramData | null => {
        if (action.type === 'scroll') {
            if (action.direction === 'down') {
                return { ...data, invert_vertical: true };
            } else if (action.direction === 'up') {
                return { ...data, invert_vertical: false };
            }
        }
        return null;
    },
};

export const omega_MN: NotationDefinition<Expr> = {
    id: 'omega-mn',
    name: 'ω mountain notation (ωMN)',
    simple_name: 'ωMN',
    display: { plain: mountain_display, from_display: mountain_from_display },
    display_equiv: {
        layer: {
            plain: (m) => mountain_display(convert_to_layer(m)),
            from_display: (str) => convert_from_layer(mountain_from_display(str)),
        },
    },
    is_limit: mountain_is_limit,
    compare: mountain_compare,
    draw_diagram: draw_diagram_control,
    ...MN_FS_variants(expand, is_infinite, Limit, mountain_is_limit, mountain_display),
    init: () => [[[[Infinity] as any]], [[]], []],
};
