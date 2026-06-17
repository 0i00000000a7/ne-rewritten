export var aSAN_compare = (a: any, b: any): number => {
    if (typeof a === 'number') {
        if (typeof b === 'number') return a > b ? 1 : a < b ? -1 : 0;
        a = [a];
    }
    if (typeof b === 'number') b = [b];
    if (a.length > b.length) return 1;
    if (a.length < b.length) return -1;
    var tmp: any, k: any;
    for (k = a.length; k--; ) {
        tmp = aSAN_compare(a[k], b[k]);
        if (tmp !== 0) return tmp;
    }
    return 0;
};

export var aSAN_display = (a: any): string =>
    typeof a === 'number' ? '' + a : '' + a === '1,Infinity' ? 'Limit' : '(' + a.map(aSAN_display).join() + ')';

export var aSAN_base = (A: any): any => (typeof A === 'number' ? A : aSAN_base(A[0]));

export var aSAN_able = (a: any): boolean => typeof a !== 'number' && aSAN_base(a) === 1;

export var aSAN_semiable = (a: any): any => a !== 1;
