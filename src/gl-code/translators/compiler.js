/*****
 * Compile higher-order constructs in AST,
 * and perform some AST optimizations.
 */
import {constants, fns} from './to-js.js';

const math = require('mathjs');


// Substitute bound variable with value in AST
function substitute(ast, name, value) {
    if (!Array.isArray(ast)) {return ast;}
    if (ast[0] === 'variable' && ast[1] === name) {return value;}
    return ast.map(x => substitute(x, name, value));
}

// Return AST where binary operation `op` is applied
// between all given terms (AST).
function compose(terms, op) {
    if (terms.length === 1) {return terms[0]};
    const N = Math.floor(terms.length/2);
    // Distribute evenly for faster computation
    return [op, compose(terms.slice(0, N), op), compose(terms.slice(N), op)];
}

// Apply sum or product operator.
function sumProd(operator, args) {
    if (args[1][0] !== 'variable') {return null;}

    const idxVar = args[1][1];
    const low = args[2][1];
    const high = args[3][1];
    const termAST = args[0];

    const terms = [];
    for (let i = low; i <= high; i++) {
        terms.push(compile(substitute(termAST, idxVar, ['number', i, 0])));
    }

    if (operator === 'sum') {return compose(terms, 'add');}
    if (operator === 'prod') {return compose(terms, 'mul');}
}

// Apply derivative operator.
function diff(ast, arg) {
    const dz = 1e-2; // Finite difference step
    if (arg[0] !== 'variable') {return null;}

    const high = compile(substitute(ast, arg[1], ['add', arg, ['number', dz, 0]]));
    const low = compile(substitute(ast, arg[1], ['sub', arg, ['number', dz, 0]]));

    return ['component_mul', ['sub', high, low], 1/(2*dz)];
}

function getConst(val) {
    let re = null;
    let im = null;

    if (val[0] === 'number') {
        re = val[1];
        im = val[2];
    }
    if (val[0] === 'constant') {
        re = constants[val[1]];
        im = 0;
    }
    return math.complex(re, im);
}

function destructure(val) {return ['number', val.re, val.im];}

function mul(a, b) {return destructure(math.multiply(getConst(a), getConst(b)));}

function isConst(ast) {
    return ast[0] === 'number' || ast[0] === 'constant';
}


// Optimize AST, and expand any higher-order constructs.
function compile(ast) {
    if (ast === null) {return null;}

    const [operator, ...args] = ast;

    if (operator === 'number' || operator === 'variable' || operator === 'constant') {
        return ast;
    }

    // Higher-order functions
    if (operator === 'sum' || operator === 'prod') {
        return sumProd(operator, args);
    }

    if (operator === 'diff') {
        return diff(args[0], args[1]);
    }

    // Static functions
    if (args.every(isConst)) {
        const fn = fns[operator] || math[operator];
        return destructure(fn(...args.map(getConst)));
    }

    // Optimizations
    if (operator === 'div') {
        if (isConst(args[1])) {
            return compile(['mul', compile(['reciprocal', args[1]]), args[0]]);
        }

        if (isConst(args[0])) {
            return compile(['mul', args[0], compile(['reciprocal', args[1]])]);
        }
    }

    if (operator === 'mul') {
        if (isConst(args[0])) {
            const val = getConst(args[0]);

            // Both constants
            if (isConst(args[1])) {
                return ['number', ...mul(val, args[1])];
            }

            // Real scale factor
            if (val.im === 0) {
                if (val.re === 1) {return compile(args[1]);}
                if (val.re === -1) {return ['neg', compile(args[1])];}
                return ['component_mul', compile(args[1]), val.re];
            }
        } else {
            // Swap arguments
            if (isConst(args[1])) {
                return compile(['mul', args[1], args[0]]);
            }
        }
    }

    if (operator === 'pow') {
        if (isConst(args[0])) {
            return ['exp', compile(['mul', compile(['log', args[0]]), args[1]])];
        }

        if (isConst(args[1])) {
            const val = getConst(args[1]);
            const subAST = compile(args[0]);
            if (val.im === 0) {
                if (val.re === -1) {return ['reciprocal', subAST];}
                if (val.re === 0) {return ['number', 1, 0];}
                if (val.re === 0.5) {return ['sqrt', subAST];}
                if (val.re === 1) {return subAST;}
                if (val.re === 2) {return ['square', subAST];}
            }
        }
    }

    return [operator, ...args.map(compile)];
}

export default compile;
