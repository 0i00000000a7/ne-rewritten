// import { boolean_compare, deepcopy, lex_compare, number_compare, tuple_lex_compare } from '@/utils.ts';
// import { r } from '@/notations/TON/ton_helpers.ts';
//
// type Sep = number;
// type Vertical = Sep[];
// type Entry = [number, Sep];
// type Column = Entry[];
// type Mountain = Column[];
//
// type Expr = Mountain | 'Infinity';
//
// function sep_compare(s1: Sep, s2: Sep): number {
//     return number_compare(s1, s2);
// }
//
// function vertical_compare(v1: Vertical, v2: Vertical): number {
//     return lex_compare(v1, v2, sep_compare);
// }
//
// function entry_compare(e1: Entry, e2: Entry): number {
//     return tuple_lex_compare(e1, e2, [number_compare, number_compare]);
// }
//
// function column_compare(c1: Column, c2: Column): number {
//     return lex_compare(c1, c2, entry_compare);
// }
//
// function mountain_compare(m1: Mountain, m2: Mountain): number {
//     return lex_compare(m1, m2, column_compare);
// }
//
// function expr_compare(a: Expr, b: Expr): number {
//     if (a === 'Infinity' || b === 'Infinity') {
//         return boolean_compare(a === 'Infinity', b === 'Infinity');
//     }
//     return mountain_compare(a, b);
// }
//
// function vertical_increase(v: Vertical, s: Sep): Vertical {
//     let i = v.length;
//     while (i - 1 >= 0 && sep_compare(v[i - 1], s) < 0) i--;
//     return [...v.slice(0, i), s];
// }
//
// function column_verticals(c: Column): Vertical[] {
//     let result: Vertical[] = [];
//     let current: Vertical = [];
//     for (let e of c) {
//         result.push((current = vertical_increase(current, e[1])));
//     }
//     return result;
// }
//
// function find_index_below(Vi: Vertical[], v: Vertical): number {
//     let l = 0,
//         r = Vi.length;
//     while (l < r) {
//         let j = (l + r + 1) / 2;
//         let Vij = j === 0 ? [] : Vi[j - 1];
//         if (vertical_compare(Vij, v) < 0) l = j;
//         else r = j - 1;
//     }
//     return l;
// }
//
// type Position = [number, number];
//
// function parents(m: Mountain, V: Vertical[][]): Position[][] {
//     let result: Position[][] = V.map(() => []);
//     for (let i = 0; i < m.length; i++) {
//         const c = m[i];
//         for (let j = 0; j < c.length; j++) {
//             const [value, s] = c[j];
//             let pi = value - 1;
//             let pj = find_index_below(V[pi], V[i][j]);
//             result[i][j] = [pi, pj];
//         }
//     }
//     return result;
// }
//
// function subtract_1(m: Mountain, V: Vertical[][], P: Position[][]): Mountain {
//     let right: number = m.length - 1;
//     let top: number = m[right].length - 1;
//     let top_right_sep: Sep = m[right][top][1];
//     let [Ri, Rj] = P[right][top];
//
//     let result = deepcopy(m);
//     result[right].pop();
//
//     if (top_right_sep > 0) {
//         let new_sep: Sep = top_right_sep - 1;
//         let v_parent = V[Ri][Rj];
//         let v_bottom = V[top][right - 1];
//         if (vertical_compare(vertical_increase(v_parent, new_sep), v_bottom) > 0) {
//             result[right].push([Ri + 1, new_sep]);
//         }
//     }
//
//     for (let j = Rj; j < m[Ri].length; j++) {
//         result[right].push(deepcopy(m[Ri][j]));
//     }
//
//     return result;
// }
//
// function copy_column(): Column {}
//
// function extend(m0: Mountain): Mountain {
//     let right: number = m0.length - 1;
//     let top: number = m0[right].length - 1;
//     let top_right_sep: Sep = m0[right][top][1];
//
//     let V0 = m0.map(column_verticals);
//     let P0 = parents(m0, V0);
//     let [Ri, Rj] = P0[right][top];
//
//     let m = subtract_1(m0, V0, P0);
//     for (let i = Ri + 1; i < m0.length; i++) {
//         m.push(copy_column());
//     }
//     return m;
// }
