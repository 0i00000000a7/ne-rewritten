import { describe, expect, it } from 'vitest';
import { extend, Mountain } from '@/notations/SMN/SA_omega2_MN.ts';

describe('omega MN', () => {
    it('0 ,1', () => {
        const e: Mountain = [
            [],
            [[1, [0, 1], false]],
            [
                [2, [1, 0], true],
                [1, [0, 1], false],
            ],
        ];
        const e_ex: Mountain = [
            [],
            [[1, [0, 1], false]],
            [[2, [1, 0], true]],
            [
                [3, [1, 0], true],
                [3, [0, 1], false],
            ],
            [
                [4, [1, 0], true],
                [4, [2, 0], true],
                [3, [0, 1], false],
            ],
        ];
        expect(extend(e)).toEqual(e_ex);
    });
});
