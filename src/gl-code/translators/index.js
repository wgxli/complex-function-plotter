import {get} from 'lodash';

import toJS from './to-js';

function toGLSL(ast) {
    if (ast === null) {return null;}

    const infixOperators = {
        'add': '+',
        'sub': '-',
    };

    const [operator, ...args] = ast;

    if (operator === 'number') {
        const [real, imag] = args;
        return `vec2(${real}, ${imag})`;
    }

    if (operator === 'variable') {return args[0];}
    if (operator === 'constant') {return 'C_' + args[0].toUpperCase();}
    if (operator in infixOperators) {
        return toGLSL(args[0]) + infixOperators[operator] + toGLSL(args[1]);
    }

    // Unary function
    const unaryFunctions = {
        'factorial': 'cfact',
    };
    const internalName = get(unaryFunctions, operator, 'c' + operator);

    return internalName + '(' + args.map(toGLSL).join(', ') + ')';
}

export {toGLSL, toJS};
