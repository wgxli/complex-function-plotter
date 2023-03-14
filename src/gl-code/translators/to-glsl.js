import {get} from 'lodash';

// Returns pair [ast_in_glsl, requires_parenthesis]
function toGLSL(ast) {
    if (!isNaN(ast)) {
        // GLSL floats must end in decimal point
        const terminator = Number.isInteger(ast) ? '.' : '';
        return [ast.toString() + terminator, false];
    }
    if (!Array.isArray(ast)) {return [ast, false];}

    const infixOperators = {
        'add': '+',
        'sub': '-',
        'component_mul': '*',
    };

    const [operator, ...args] = ast;

    if (operator === 'number') {
        const [real, imag] = args;
        if (real === 1 && imag === 0) {return ['ONE', false];}
        if (real === 0 && imag === 1) {return ['I', false];}
        return [`vec2(${real}, ${imag})`, false];
    }

    if (operator === 'variable') {return [args[0], false];}
    if (operator === 'constant') {return ['C_' + args[0].toUpperCase(), false];}
    if (operator in infixOperators) {
        let operands = args.map(toGLSL);

        // Add parentheses where possibly necessary
        if (operator === 'sub') {
            if (operands[1][1]) {
                operands[1][0] = '(' + operands[1][0] + ')';
            };
        } else {
            if (operator !== 'add') {
                operands = operands.map(x => [x[1] ? '(' + x[0] + ')' : x[0], false]);
            }
        }
        return [operands[0][0] + infixOperators[operator] + operands[1][0], operator !== 'mul'];
    }

    // Unary function
    const unaryFunctions = {
        'factorial': 'cfact',
    };
    const internalName = get(unaryFunctions, operator, 'c' + operator);

    return [internalName + '(' + args.map(x => toGLSL(x)[0]).join(', ') + ')', false];
}

export default toGLSL;
