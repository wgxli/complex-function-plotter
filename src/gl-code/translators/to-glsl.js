import {get} from 'lodash';

const math = require('mathjs');

function terminateFloat(x) {
    const terminator = Number.isInteger(x) ? '.' : '';
    return x.toString() + terminator;
}

// Returns pair [ast_in_glsl, requires_parenthesis]
function toGLSL(ast, LOG_MODE) {
    if (!isNaN(ast)) {
        // GLSL floats must end in decimal point
        return [terminateFloat(ast), false];
    }
    if (!Array.isArray(ast)) {return [ast, false];}

    let infixOperators = {
        'add': '+',
        'sub': '-',
        'component_mul': '*',
    };
    if (LOG_MODE) {
        infixOperators = {};
    }

    const [operator, ...args] = ast;

    if (operator === 'number') {
        const [real, imag] = args;
        if (LOG_MODE) {
            const length = math.hypot(real, imag)
            return [`vec3(${real/length}, ${imag/length}, ${math.log(length)})`, false];
        } else {
            if (real === 1 && imag === 0) {return ['ONE', false];}
            if (real === 0 && imag === 1) {return ['I', false];}
            return [`vec2(${real}, ${imag})`, false];
        }
    }

    if (operator === 'variable') {return [args[0], false];}
    if (operator === 'constant') {return ['C_' + args[0].toUpperCase(), false];} // TODO FIX
    if (operator in infixOperators) {
        const op = infixOperators[operator]
        let operands = args.map(x => toGLSL(x, LOG_MODE));

        // Add parentheses where possibly necessary
        if (op === '-') {
            if (operands[1][1]) {
                operands[1][0] = '(' + operands[1][0] + ')';
            };
        } else {
            if (op !== '+') {
                operands = operands.map(x => [x[1] ? '(' + x[0] + ')' : x[0], false]);
            }
        }
        return [operands[0][0] + op + operands[1][0], operator !== 'mul'];
    }

    // Unary function
    const unaryFunctions = {
        'factorial': 'cfact',
    };
    const internalName = get(unaryFunctions, operator, 'c' + operator);

    return [internalName + '(' + args.map(x => toGLSL(x, LOG_MODE)[0]).join(', ') + ')', false];
}

export default toGLSL;
