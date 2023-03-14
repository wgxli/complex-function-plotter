import {get} from 'lodash';

function toGLSL(ast) {
    if (ast === null) {return null;}

    const infixOperators = {
        'add': '+',
        'sub': '-',
    };

    const [operator, ...args] = ast;

    if (operator === 'number') {
        const [real, imag] = args;
        if (real === 1 && imag === 0) {return 'ONE';}
        if (real === 0 && imag === 1) {return 'I';}
        return `vec2(${real}, ${imag})`;
    }

    if (operator === 'variable') {return args[0];}
    if (operator === 'constant') {return 'C_' + args[0].toUpperCase();}
    if (operator in infixOperators) {
        return toGLSL(args[0]) + infixOperators[operator] + '(' + toGLSL(args[1]) + ')';
    }

    // Unary function
    const unaryFunctions = {
        'factorial': 'cfact',
    };
    const internalName = get(unaryFunctions, operator, 'c' + operator);

    return internalName + '(' + args.map(toGLSL).join(', ') + ')';
}

export default toGLSL;
