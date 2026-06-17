export var TON_noraise_compare = (x: any, y: any): number => {
    var comp = (a: any, b: any): number => {
        if (a.length) {
            if (b.length) {
                if (a[0] > b[0]) return 1;
                else if (a[0] < b[0]) return -1;
                else return comp(a.slice(1), b.slice(1));
            } else return 1;
        } else if (b.length) {
            return -1;
        } else return 0;
    };
    return comp(
        ('' + x).split(',').map((e: any) => +e),
        ('' + y).split(',').map((e: any) => +e),
    );
};

export var TON_noraise_display = (term: any): string =>
    typeof term === 'number'
        ? term === Infinity
            ? 'Limit'
            : term < 0
              ? '0'
              : 'Ω'
        : TON_noraise_display(term[0]) + TON_noraise_display(term[1]) + 'C';

export var raise = (term: any, sys: any): any =>
    typeof term === 'number'
        ? term >= 0 && term < sys
            ? [-1, raise(term + 1, sys), -2]
            : term
        : [raise(term[0], sys), raise(term[1], sys), -2];

export var TON_compare = (x: any, y: any): number => {
    var comp = (a: any, b: any): number => {
        if (a.length) {
            if (b.length) {
                if (a[0] > b[0]) return 1;
                else if (a[0] < b[0]) return -1;
                else return comp(a.slice(1), b.slice(1));
            } else return 1;
        } else if (b.length) {
            return -1;
        } else return 0;
    };
    var sysx: any,
        sysy: any,
        tmpx = ('' + x).split(','),
        tmpy = ('' + y).split(',');
    sysx = Math.max(0, ...tmpx.map(Number));
    sysy = Math.max(0, ...tmpy.map(Number));
    if (sysx < Infinity && sysy < Infinity && (sysx > 0 || sysy > 0)) {
        x = raise(x, Math.max(sysx, sysy));
        y = raise(y, Math.max(sysx, sysy));
    }
    return comp(
        ('' + x).split(',').map((e: any) => +e),
        ('' + y).split(',').map((e: any) => +e),
    );
};

export var TON_main_display = (term: any): string =>
    typeof term === 'number'
        ? term === Infinity
            ? 'Limit'
            : term < 0
              ? '0'
              : 'Ω<sub>' + term + '</sub>'
        : TON_main_display(term[0]) + TON_main_display(term[1]) + 'C';

export var TON_limit = (term: any): boolean =>
    typeof term === 'number' ? term >= 0 : typeof term[1] !== 'number' || term[1] >= 0;

export var r = (a: any, b: any): any => {
    if (typeof a === 'number') return a;
    if (TON_compare(a, b) > 0) {
        if (TON_compare(a[0], b) > 0) {
            return [r(a[0], b), r(a[1], b), -2];
        } else {
            return [-0.5, r(a[1], b), -2];
        }
    } else {
        if (TON_compare(a, b) < 0) {
            return a;
        } else {
            return -0.5;
        }
    }
};
