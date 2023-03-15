// Substitute bound variable with value in AST
function substitute(ast, name, value) {
    if (!Array.isArray(ast)) {return ast;}
    if (ast[0] === 'variable' && ast[1] === name) {return value;}
    return ast.map(x => substitute(x, name, value));
}

function contains(ast, name) {
    if (!Array.isArray(ast)) {return false;}
    if (ast[0] === 'variable' && ast[1] === name) {return true;}
    return ast.some(x => contains(x, name));
}

const ZERO = ['number', 0, 0];
const ONE = ['number', 1, 0];

const diffTable = {
    'sin': x => ['cos', x],
    'cos': x => ['neg', ['sin', x]],
    'tan': x => ['square', ['sec', x]],
    'sec': x => ['mul', ['sec', x], ['tan', x]],
    'csc': x => ['neg', ['mul', ['csc', x], ['cot', x]]],
    'cot': x => ['neg', ['square', ['csc', x]]],
    'arcsin': x => ['reciprocal', ['sqrt', ['sub', ONE, ['square', x]]]],
    'arccos': x => ['neg', ['reciprocal', ['sqrt', ['sub', ONE, ['square', x]]]]],
    'arctan': x => ['reciprocal', ['add', ONE, ['square', x]]],
    'arcsec': x => ['reciprocal', ['mul', ['square', x], ['sqrt', ['sub', ONE, ['reciprocal', ['square', x]]]]]],
    'arccsc': x => ['neg', ['reciprocal', ['mul', ['square', x], ['sqrt', ['sub', ONE, ['reciprocal', ['square', x]]]]]]],
    'arccot': x => ['neg', ['reciprocal', ['add', ONE, ['square', x]]]],

    'sinh': x => ['cosh', x],
    'cosh': x => ['sinh', x],
    'tanh': x => ['square', ['sech', x]],
    'sech': x => ['neg', ['mul', ['tanh', x], ['sech', x]]],
    'csch': x => ['neg', ['mul', ['coth', x], ['csch', x]]],
    'coth': x => ['neg', ['square', ['csch', x]]],
    'arsinh': x => ['reciprocal', ['sqrt', ['add', ['square', x], ONE]]],
    'arcosh': x => ['reciprocal', ['mul', ['sqrt', ['sub', x, ONE]], ['sqrt', ['add', x, ONE]]]],
    'artanh': x => ['reciprocal', ['sub', ONE, ['square', x]]],
//    'arsech': x => ['neg', ['reciprocal', ['mul', ['mul', ['sqrt', ['add', ['reciprocal', x], ONE]], ['sqrt', ['sub', ['reciprocal', x], ONE]]], ['square', x]]]],
    'arcsch': x => ['neg', ['reciprocal', ['mul', ['square', x], ['sqrt', ['add', ONE, ['reciprocal', ['square', x]]]]]]],
    'arcoth': x => ['reciprocal', ['sub', ['square', x], ONE]],

    'exp': x => ['exp', x],
    'cis': x => ['mul_i', ['cis', x]],
    'log': x => ['reciprocal', x],

    'square': x => ['component_mul', x, 2],
    'sqrt': x => ['reciprocal', ['component_mul', ['sqrt', x], 2]],
}

// Analytically compute the derivative of the given AST
// with respect to variable `arg`.
function diff(ast, arg, compile) {
    if (ast === null) {return null;}
    if (arg[0] !== 'variable') {return null;}

    if (!Array.isArray(ast)) {return ZERO;}
    if (ast[0] === 'constant' || ast[0] === 'number') {return ZERO;}
    if (ast[0] === 'variable') {return (ast[1] === arg[1]) ? ONE : ZERO;}

    if (!contains(ast, arg[1])) {return ZERO;}

    const [operator, ...args] = ast;

    // Sum rule
    if (operator === 'add' || operator === 'sub') {
        return compile([operator, ...args.map(x => diff(x, arg, compile))]);
    }
    
    // Product rule
    if (operator === 'mul') {
        return compile(['add',
            compile(['mul', args[0], diff(args[1], arg, compile)]),
            compile(['mul', args[1], diff(args[0], arg, compile)]),
        ]);
    }
    
    if (operator === 'component_mul') {
        return compile(['component_mul', diff(args[0], arg, compile), args[1]]);
    }

    // Quotient rule
    if (operator === 'div') {
        return compile(['div',
            compile(['sub',
                compile(['mul', args[1], diff(args[0], arg, compile)]),
                compile(['mul', args[0], diff(args[1], arg, compile)])
            ]),
            ['square', compile(args[1])],
        ]);
    }

    // Chain rule (analytic derivative).
    const [analyticDiff, internal] = [diffTable[ast[0]], ast[1]];
    if (analyticDiff !== undefined) {
        return compile(['mul', diff(internal, arg, compile), compile(analyticDiff(internal))]);
    }

    // Numerical fallback.
    console.log('numerical fallback:', ast, arg);
    return numericalDiff(ast, arg, compile);
}

function numericalDiff(ast, arg, compile) {
    const dz = 1e-2; // Finite difference step
    if (arg[0] !== 'variable') {return null;}

    const high = compile(substitute(ast, arg[1], ['add', arg, ['number', dz, 0]]));
    const low = compile(substitute(ast, arg[1], ['sub', arg, ['number', dz, 0]]));

    return ['component_mul', ['sub', high, low], 1/(2*dz)];
}

export {substitute};
export default diff;
