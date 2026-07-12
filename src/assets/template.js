function linear_array_FS(a, index) {
    if (a === Infinity) {
        let result = Array(index).fill(0);
        result.push(1);
        return result;
    }

    let result = [...a];
    while (result.length && result[result.length - 1] === 0) result.pop();
    let i = result.findIndex((x) => x > 0);
    if (i === -1) return [];
    result[i]--;
    if (i === result.length - 1 && result[i] === 0) result.pop();
    if (i > 0) result[i - 1] = index;
    return result;
}

function anti_lex_compare(a, b) {
    if (a.length !== b.length) return a.length > b.length ? 1 : -1;
    for (let i = a.length - 1; i >= 0; i--) {
        if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    }
    return 0;
}

function linear_array_compare(a, b) {
    if (a === Infinity) return b === Infinity ? 0 : 1;
    if (b === Infinity) return -1;
    return anti_lex_compare(a, b);
}

register_notation({
    id: 'linear-array',
    name: 'Linear Array',
    // category_id: optional
    display: (a) => (a === Infinity ? 'Limit' : '(' + a.toReversed() + ')'), // plain display

    is_limit: (a) => a === Infinity || (a.length > 0 && a[0] === 0),
    // is limit ordinal
    compare: linear_array_compare,
    FS: linear_array_FS,
    init: () => [Infinity, []], // list of initial expressions
});

register_category({
    id: 'category-user-defined',
    name: 'User defined',
    simple_name: 'User', // optional
});

register_notation({
    id: 'omega1',
    name: 'Natural numbers',
    // simple name omitted
    display: {
        plain: (a) => 'a^' + (a === Infinity ? 'ω' : a),
        html: (a) => 'a<sup>' + (a === Infinity ? 'ω' : a) + '</sup>',
        latex: (a) => 'a^{' + (a === Infinity ? '\\omega' : a) + '}',
        from_display: (str) => (str === 'a^ω' ? Infinity : parseInt(str.substring(2))),
        // 'from_display' should be inverse of 'plain'
    }, // complex display. all fields except 'plain' are optional.

    display_equiv: {
        // key 'b' is the name of equiv notation
        b: {
            plain: (a) => 'a^' + (a === Infinity ? 'ω' : a),
            html: (a) => 'a<sup>' + (a === Infinity ? 'ω' : a) + '</sup>',
            // no from_display; 'latex' is auto generated from 'html'
        },
    },

    is_limit: (a) => a === Infinity,
    compare: (a, b) => (a > b ? 1 : a === b ? 0 : -1),
    FS: (a, i) => (a === Infinity ? i : a > 0 ? a - 1 : 0),
    init: () => [Infinity, 0],
});

function generate_notations(n) {
    return {
        id: 'omega-test-' + n,
        name: n + ' shifted natural numbers',
        simple_name: n + '+ω', // optional
        category_id: 'category-user-defined-generator',
        // this must be compatible with generator id
        display: (a) => (a === Infinity ? 'ω' : '' + (a + n)),

        is_limit: (a) => a === Infinity,
        compare: (a, b) => (a > b ? 1 : a === b ? 0 : -1),
        FS: (a, i) => (a === Infinity ? i : a > 0 ? a - 1 : 0),
        init: () => [Infinity, 0],
    };
}

register_category({
    id: 'category-user-defined-generator',
    name: 'n+ω',
    parent_id: 'category-user-defined', // parent
    generator: { start: 1, initial: 3, create: generate_notations },
});
