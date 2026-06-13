import { describe, expect, it } from 'vitest'
import { BM4, display, from_display, is_infinite, type Expr } from '../notations/BM'

// ===========================================================================
// display 测试
// ===========================================================================

describe('display', () => {
    it('极限', () => {
        expect(display([[Infinity]])).toBe('Limit')
    })

    it('空矩阵', () => {
        expect(display([])).toBe('')
    })

    it('标准矩阵', () => {
        expect(display([[], []])).toBe('(0)(0)')
        expect(display([[], [1, 1]])).toBe('(0)(1,1)')
        expect(display([[], [1, 1, 1], [], [1, 1, 1]]))
            .toBe('(0)(1,1,1)(0)(1,1,1)')
        expect(display([[], [1, 1, 1], [2, 1], [1, 1, 1]]))
            .toBe('(0)(1,1,1)(2,1)(1,1,1)')
    })
})

// ===========================================================================
// fromDisplay 测试（反转 display 测试用例）
// ===========================================================================

describe('fromDisplay', () => {
    it('极限', () => {
        expect(from_display('Limit')).toEqual([[Infinity]])
    })

    it('空矩阵', () => {
        expect(from_display('')).toEqual([])
    })

    it('标准矩阵', () => {
        expect(from_display('(0)(0)')).toEqual([[], []])
        expect(from_display('(0)(1,1)')).toEqual([[], [1, 1]])
        expect(from_display('(0)(1,1,1)(0)(1,1,1)'))
            .toEqual([[], [1, 1, 1], [], [1, 1, 1]])
        expect(from_display('(0)(1,1,1)(2,1)(1,1,1)'))
            .toEqual([[], [1, 1, 1], [2, 1], [1, 1, 1]])
    })

    it('带空格的字符串', () => {
        expect(from_display('()(1, 0)')).toEqual([[], [1]])
        expect(from_display('( 0)(1,1)')).toEqual([[], [1, 1]])
        expect(from_display('(0)( 1, 1 )')).toEqual([[], [1, 1]])
        expect(from_display('( 0 , 0 ) ( 0 , 0 )')).toEqual([[], []])
    })

    it('非法格式', () => {
        expect(() => from_display('abc')).toThrow('Illegal input string: abc')
        expect(() => from_display('(0)extra')).toThrow('Illegal input string: (0)extra')
        expect(() => from_display('(0')).toThrow('Illegal input string: (0')
        expect(() => from_display('0')).toThrow('Illegal input string: 0')
    })
})

// ===========================================================================
// FS 展开测试
// ===========================================================================

describe('FS', () => {
    it('0 展开', () => {
        expect(BM4.FS([], 2)).toEqual([])
        expect(BM4.FS([], 4)).toEqual([])
    })

    it('后继展开', () => {
        expect(BM4.FS([[], []], 2)).toEqual([[]])
        expect(BM4.FS([[], [1, 1], []], 4)).toEqual([[], [1, 1]])
    })

    it('极限展开', () => {
        expect(BM4.FS([[Infinity]], 2)).toEqual([[], [1, 1, 1]])
        expect(BM4.FS([[Infinity]], 4)).toEqual([[], [1, 1, 1, 1, 1]])
    })

    it('2 行展开', () => {
        expect(BM4.FS([[], [1, 1], [1, 1]], 2))
            .toEqual([[], [1, 1], [1], [2, 1], [2], [3, 1]])
    })

    it('3 行提升展开', () => {
        expect(BM4.FS([[], [1, 1, 1], [2], [1, 1, 1]], 1))
            .toEqual([[], [1, 1, 1], [2], [1, 1], [2, 2, 1], [3]])
        expect(BM4.FS([[], [1, 1, 1], [2, 1], [1, 1, 1]], 1))
            .toEqual([[], [1, 1, 1], [2, 1], [1, 1], [2, 2, 1], [3, 2]])
        expect(BM4.FS([[], [1, 1, 1], [2, 2], [1, 1, 1]], 1))
            .toEqual([[], [1, 1, 1], [2, 2], [1, 1], [2, 2, 1], [3, 3]])
        expect(BM4.FS([[], [1, 1, 1], [2, 2, 2], [3, 1], [2, 2, 2]], 1))
            .toEqual([[], [1, 1, 1], [2, 2, 2], [3, 1], [2, 2, 1], [3, 3, 2], [4, 1]])
        expect(BM4.FS([[], [1, 1, 1], [2, 2, 2], [3, 2], [2, 2, 2]], 1))
            .toEqual([[], [1, 1, 1], [2, 2, 2], [3, 2], [2, 2, 1], [3, 3, 2], [4, 3]])
    })
})