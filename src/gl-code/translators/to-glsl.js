import {get} from 'lodash';

function toGLSL(ast) {
    if (!isNaN(ast)) {return ast.toFixed(16);}
    if (!Array.isArray(ast)) {return ast;}

    const infixOperators = {
        'add': '+',
        'sub': '-',
        'component_mul': '*',
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
        let operands = args.map(toGLSL);
        if (operator !== 'add') {
            // Add parentheses if possibly necessary
            operands = operands.map(x => '(' + x + ')');
        }
        return operands[0] + infixOperators[operator] + operands[1];
    }

    // Unary function
    const unaryFunctions = {
        'factorial': 'cfact',
    };
    const internalName = get(unaryFunctions, operator, 'c' + operator);

    return internalName + '(' + args.map(toGLSL).join(', ') + ')';
}

export default toGLSL;
