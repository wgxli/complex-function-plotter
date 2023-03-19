/*****
 * Compile higher-order constructs in AST,
 * and perform some AST optimizations.
 */
import {constants, fns} from './to-js.js';
import diff, {substitute} from './derivative.js';

const math = require('mathjs');


// Return AST where binary operation `op` is applied
// between all given terms (AST).
function compose(terms, op, op4, op8) {
    // Empty sum/product
    if (terms.length === 0) {return (op === 'sum') ? ['number', 0, 0] : ['number', 1, 0];}

    // Trivial sum/product
    if (terms.length === 1) {return terms[0]};

    // Distribute evenly for faster computation
    const N = Math.floor(terms.length/2);
    const app = (a, b) => compose(terms.slice(a, b), op, op4, op8);

    if (N >= 4 && op8 !== undefined) {
        const NN = Math.floor(N/2);
        const NNN = Math.floor(N/4);
        return compile([op8,
            app(0, NNN), app(NNN, NN), app(NN, NN+NNN), app(NN+NNN, N),
            app(N, N+NNN), app(N+NNN, N+NN), app(N+NN, N+NN+NNN), app(N+NN+NNN, undefined)
        ]);
    } else {
        if (N >= 2 && op4 !== undefined) {
            const NN = Math.floor(N/2);
            return compile([op4, app(0, NN), app(NN, N), app(N, N+NN), app(N+NN, undefined)]);
        } else {
            return compile([op, compose(terms.slice(0, N), op), compose(terms.slice(N), op)]);
        }
    }
}

// Apply sum or product operator.
function sumProd(operator, args) {
    // Evaluate lower/upper bounds
    args[2] = compile(args[2]);
    args[3] = compile(args[3]);
    
    if (args[1][0] !== 'variable') {return null;}
    if (args[2][0] !== 'number') {return null;}
    if (args[3][0] !== 'number') {return null;}

    const idxVar = args[1][1];
    const low = args[2][1];
    const high = args[3][1];
    const termAST = args[0];

    const terms = [];
    for (let i = low; i <= high; i++) {
        terms.push(compile(substitute(termAST, idxVar, ['number', i, 0])));
    }

    if (operator === 'sum') {return compose(terms, 'add', 'add4', 'add8');} // Log-cartesian
//    if (operator === 'sum') {return compose(terms, 'add');} // Cartesian
    if (operator === 'prod') {return compose(terms, 'mul', 'mul4');}
}

function getConst(val) {
    let re = null;
    let im = null;

    if (!isNaN(val)) {re = val; im = 0;}
    if (val[0] === 'number') {re = val[1]; im = val[2];}
    if (val[0] === 'constant') {re = constants[val[1]]; im = 0;}

    return math.complex(re, im);
}

function destructure(val) {
    if (val.re === undefined) {return ['number', val, 0];}
    return ['number', val.re, val.im];
}

function isConst(ast) {
    return !isNaN(ast) || ast[0] === 'number' || ast[0] === 'constant';
}

function isZero(ast) {
    return ast[0] === 'number' && ast[1] === 0 && ast[2] === 0;
}

const inverseMap = {
    'neg': 'neg',
    'reciprocal': 'reciprocal',
    'conj': 'conj',
    'exp': 'log',
    'sin': 'arcsin',
    'cos': 'arccos',
    'tan': 'arctan',
    'sec': 'arcsec',
    'csc': 'arccsc',
    'cot': 'arccot',
    'sinh': 'arsinh',
    'cosh': 'arcosh',
    'tanh': 'artanh',
    'sech': 'arsech',
    'csch': 'arcsch',
    'coth': 'arcoth',
    'square': 'sqrt',
}


// Optimize AST, and expand any higher-order constructs.
function compile(ast) {
    if (!Array.isArray(ast)) {return ast;}

    let [operator, ...args] = ast;
    if (operator === 'number' || operator === 'variable' || operator === 'constant') {
        return ast;
    }

    // Higher-order functions
    if (operator === 'sum' || operator === 'prod') {
        return sumProd(operator, args);
    }

    args = args.map(compile);
    if (operator === 'diff') {
        return diff(args[0], args[1], compile);
    }

    // Aliases
    if (operator === 'factorial') {return compile(['gamma', ['add', args[0], ['number', 1, 0]]]);}


    // Evaluate if all arguments are constant
    if (args.every(isConst)) {
        const fn = fns[operator] || math[operator];
        return destructure(fn(...args.map(getConst)));
    }

    // Cancel out inverse functions
    if (inverseMap[operator] !== undefined) {
        if (Array.isArray(args[0]) && args[0][0] === inverseMap[operator]) {
            return args[0][1];
        }
    }


    // Optimizations
    if (operator === 'add') {
        if (isZero(args[0])) {return args[1];}
        if (isZero(args[1])) {return args[0];}
    }

    if (operator === 'sub') {
        if (isZero(args[0])) {return compile(['neg', args[1]]);}
        if (isZero(args[1])) {return args[0];}
    }

    if (operator === 'div') {
        if (isConst(args[1])) {
            return compile(['mul', compile(['reciprocal', args[1]]), args[0]]);
        }

        if (isConst(args[0])) {
            return compile(['mul', args[0], compile(['reciprocal', args[1]])]);
        }
    }

    if (operator === 'mul') {
        // Place constant in front
        if (isConst(args[1])) {args = [args[1], args[0]];}

        // Deal with constant case
        if (isConst(args[0])) {
            const val = getConst(args[0]);

            // Real scale factor
            if (val.im === 0) {
                return compile(['component_mul', args[1], val.re]);
            }
        }
    }

    if (operator === 'component_mul') {
        if (args[1] === 0) {return ['number', 0, 0];}
        if (args[1] === 1) {return args[0];}
        if (args[1] === -1) {return ['neg', args[0]];}
        if (args[1] > 0) {
            return ['component_mul_prelog', args[0], math.log(args[1])];
        } else {
            return ['component_mul_prelog', compile(['neg', args[0]]), math.log(-args[1])];
        }
    }

    if (operator === 'pow') {
        if (isConst(args[0])) {
            return ['exp', compile(['mul', compile(['log', args[0]]), args[1]])];
        }

        if (isConst(args[1])) {
            const val = getConst(args[1]);
            const subAST = args[0];
            if (val.im === 0) {
                if (val.re === -1) {return compile(['reciprocal', subAST]);}
                if (val.re === 0) {return ['number', 1, 0];}
                if (val.re === 0.5) {return ['sqrt', subAST];}
                if (val.re === 1) {return subAST;}
                if (val.re === 2) {return compile(['square', subAST]);}
                return ['exp', compile(['component_mul', ['log', subAST], val.re])]; // Cartesian only
            }
        }

//        return ['exp', ['mul', ['log', args[0]], args[1]]]; // Cartesian only
    }

    if (operator === 'beta') {
        if (isConst(args[0])) {args = [args[1], args[0]];}
        if (isConst(args[1])) {
            const val = getConst(args[1]);
            if (val.im === 0 && Number.isInteger(val.re) && val.re > 0 && val.re < 20) {
                const prefactor = compile(['component_mul', args[0], math.factorial(val.re)/val.re]);
                const terms = [prefactor];
                for (let i = 1; i < val.re; i++) {
                    terms.push(['add', args[0], ['number', i, 0]]);
                }
                return ['reciprocal', compose(terms, 'mul', 'mul4')];
            }
        }
    }

    if (operator === 'binom') {
        if (isConst(args[1])) {
            const val = getConst(args[1]);
            if (val.im === 0) {
                if (val.re === 0) {return ['number', 1, 0];}
                if (Number.isInteger(val.re) && val.re > 0 && val.re < 20) {
                    const terms = [];
                    for (let i = 0; i < val.re; i++) {
                        terms.push(['sub', args[0], ['number', i, 0]]);
                    }
                    return compile(['component_mul', compose(terms, 'mul', 'mul4'), 1/math.factorial(val.re)]);
                }
            }
        }
        if (isZero(args[0])) {return ['number', 0, 0];}
    }

    return [operator, ...args];
}

export default compile;
