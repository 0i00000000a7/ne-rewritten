import {describe, expect, it} from 'vitest'
import {expand_item} from '../core/expander'
import {init_dataset} from '../core/tree'
import type {NotationDefinition} from '../utils'

// ===========================================================================
// 数值节记
// ===========================================================================

const FS_array: Record<number, number[]> = {
    3: [0, 1, 2],
    7: [1, 3, 6],
    10: [0, 1, 3, 7],
    14: [11, 12, 13],
    15: [5, 8, 10, 14],
}

const notation: NotationDefinition<number> = {
    id: 'test',
    name: 'test',
    display: (n: number) => '' + n,
    is_limit: (n: number) => n in FS_array,
    compare: (a: number, b: number) => a - b,
    FS: (n: number, i: number) => {
        if (n in FS_array) {
            const arr = FS_array[n]
            if (i >= arr.length) throw new RangeError(
                `FS index ${i} out of bounds for ${n}`,
            )
            return arr[i]
        }
        return n > 0 ? n - 1 : 0
    },
    init: () => [15, 0],
}

// ===========================================================================

describe('expand_item', () => {
    it('首次展开 15：无 bound → FS(15,0) = 5', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        expand_item(n15, notation, 'FS')
        expect(n15.children.length).toBe(1)
        expect(n15.children[0].expr).toBe(5)
        expect(n15.fs_state).toEqual({variant: 'FS', index: 0})
    })

    it('第二次展开：bound=5 → FS(15,1) = 8', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        expand_item(n15, notation, 'FS')
        expand_item(n15, notation, 'FS')

        expect(n15.children.length).toBe(2)
        expect(n15.children.map(c => c.expr)).toEqual([8, 5])
        expect(n15.fs_state!.index).toBe(1)
    })

    it('连续展开 4 次累积 [14, 10, 8, 5]', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        for (let i = 0; i < 4; i++) expand_item(n15, notation, 'FS')

        expect(n15.children.map(c => c.expr)).toEqual([14, 10, 8, 5])
    })

    it('后继 8 展开得 7，7 展开得 6（bound=5）', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]
        for (let i = 0; i < 3; i++) expand_item(n15, notation, 'FS')
        const n8 = n15.children[1]
        expect(n8.expr).toBe(8)

        expand_item(n8, notation, 'FS')
        expect(n8.children.length).toBe(1)
        expect(n8.children[0].expr).toBe(7)

        // 7 是 8 的末子 → 展开结果 6 作为兄弟而非子节点
        expand_item(n8.children[0], notation, 'FS')
        expect(n8.children.length).toBe(2)
        expect(n8.children.map(c => c.expr)).toEqual([7, 6])
    })

    it('极限 10 基本列不足应报错', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]
        for (let i = 0; i < 4; i++) expand_item(n15, notation, 'FS')
        const n10 = n15.children[1]
        expect(n10.expr).toBe(10)

        expect(() => expand_item(n10, notation, 'FS')).toThrow(RangeError)
    })

    it('零 0 无法展开（FS(0,0)=0 不小于自身）', () => {
        const root = init_dataset(notation)
        const n0 = root.children[1]

        expand_item(n0, notation, 'FS')
        expect(n0.children.length).toBe(0)
    })

    it('同 variant 命中缓存递增', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        expand_item(n15, notation, 'FS')
        expand_item(n15, notation, 'FS')
        expect(n15.fs_state!.index).toBe(1)
    })
})

describe('expand nested', () => {
    it('展开 14 → FS(14,0)=11 > bound=10', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        for (let i = 0; i < 4; i++) expand_item(n15, notation, 'FS')
        const n14 = n15.children[0]
        expect(n14.expr).toBe(14)

        expand_item(n14, notation, 'FS')
        expect(n14.children.length).toBe(1)
        expect(n14.children[0].expr).toBe(11)
    })

    it('展开 14 三次 → [13, 12, 11]', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]
        for (let i = 0; i < 4; i++) expand_item(n15, notation, 'FS')
        const n14 = n15.children[0]

        expand_item(n14, notation, 'FS')
        expand_item(n14, notation, 'FS')
        expand_item(n14, notation, 'FS')

        expect(n14.children.map(c => c.expr)).toEqual([13, 12, 11])
    })

    it('variant 切换导致重扫', () => {
        const root = init_dataset(notation)
        const n15 = root.children[0]

        expand_item(n15, notation, 'FS')
        expect(n15.fs_state!.variant).toBe('FS')

        expand_item(n15, notation, 'FS_alter')
        expect(n15.fs_state!.variant).toBe('FS_alter')
    })
})

// ===========================================================================
// ω 节记
// ===========================================================================

const omega_notation: NotationDefinition<number> = {
    id: 'omega',
    name: 'ω',
    display: (n: number) =>
        n === Infinity ? 'ω' : n === 0 ? '0' : '' + n,
    is_limit: (n: number) => n === Infinity,
    compare: (a: number, b: number) => a - b,
    FS: (n: number, i: number) => {
        if (n === Infinity) return i
        return n > 0 ? n - 1 : 0
    },
    FS_alter: (n: number, i: number) => {
        if (n === Infinity) return i * 2
        return n > 0 ? n - 1 : 0
    },
    init: () => [Infinity, 0],
}

describe('omega', () => {
    it('FS 展开 ω：bound=0 → FS(ω,1)=1', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        expand_item(w, omega_notation, 'FS')
        expect(w.children.length).toBe(1)
        expect(w.children[0].expr).toBe(1)
        expect(w.fs_state).toEqual({variant: 'FS', index: 1})
    })

    it('FS 连续展开 ω 得 [5, 4, 3, 2, 1]', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        for (let i = 0; i < 5; i++) expand_item(w, omega_notation, 'FS')

        expect(w.children.map(c => c.expr)).toEqual([5, 4, 3, 2, 1])
    })

    it('FS_alter 展开 ω：bound=0 → FS(ω,1)=2', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        expand_item(w, omega_notation, 'FS_alter')
        expect(w.children.length).toBe(1)
        expect(w.children[0].expr).toBe(2)
        expect(w.fs_state).toEqual({variant: 'FS_alter', index: 1})
    })

    it('FS_alter 连续展开得 [10, 8, 6, 4, 2]', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        for (let i = 0; i < 5; i++) expand_item(w, omega_notation, 'FS_alter')

        expect(w.children.map(c => c.expr)).toEqual([10, 8, 6, 4, 2])
    })

    it('FS → FS_alter 切换重扫', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        for (let i = 0; i < 3; i++) expand_item(w, omega_notation, 'FS')
        expect(w.fs_state!.index).toBe(3)

        expand_item(w, omega_notation, 'FS_alter')
        expect(w.children.map(c => c.expr)).toEqual([4, 3, 2, 1])
        expect(w.fs_state!.variant).toBe('FS_alter')
        expect(w.fs_state!.index).toBe(2)
    })

    it('FS_alter → FS 切换重扫', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        for (let i = 0; i < 3; i++) expand_item(w, omega_notation, 'FS_alter')

        expand_item(w, omega_notation, 'FS')
        expect(w.children.map(c => c.expr)).toEqual([7, 6, 4, 2])
        expect(w.fs_state!.variant).toBe('FS')
        expect(w.fs_state!.index).toBe(7)
    })

    it('来回切换 FS ↔ FS_alter', () => {
        const root = init_dataset(omega_notation)
        const w = root.children[0]

        expand_item(w, omega_notation, 'FS')
        expand_item(w, omega_notation, 'FS')

        expand_item(w, omega_notation, 'FS_alter')  // 4 > 2
        expand_item(w, omega_notation, 'FS_alter')  // 6 > 4 (cache)
        expand_item(w, omega_notation, 'FS')         // 7 > 6 (rescan)
        expand_item(w, omega_notation, 'FS_alter')   // 8 > 7 (rescan)

        expect(w.children.map(c => c.expr)).toEqual([8, 7, 6, 4, 2, 1])
    })
})
