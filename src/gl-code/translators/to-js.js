import {get, isNil} from 'lodash';
const math = require('mathjs');

const I = math.complex(0, 1);
const fns = {
    sub: math.subtract,
    neg: math.unaryMinus,
    mul: math.multiply,
    div: math.divide,
    real: math.re,
    imag: math.im,

    arcsin: math.asin,
    arccos: math.acos,
    arctan: math.atan,
    arcsec: math.asec,
    arccsc: math.acsc,
    arccot: math.acot,

    arsinh: math.asinh,
    arcosh: math.acosh,
    artanh: math.atanh,
    arsech: math.asech,
    arcsch: math.acsch,
    arcoth: math.acoth,

    cis: z => math.exp(math.multiply(z, I)),
}

/**
 * Returns a JS function that evaluates
 * the given AST.
 *
 * Inputs of the returned function
 * are [real, imag],
 * representing the complex input,
 * and an object {'variable_name': [real, imag]}
 * representing user-defined variables.
 *
 * The returned function outputs a
 * 2-tuple [real, imag]
 * representing the complex output,
 * along with a copy of the inputted variables (for internal reasons).
 */
function toJS(ast) {
    const errorValue = [NaN, NaN]
    if (ast === null) {return (z, v) => [errorValue, v];}

    const constants = {
        'e': Math.E,
        'pi': Math.PI,
        'tau': 2 * Math.PI,
        'phi': (1 + Math.sqrt(5))/2,
    }

    const [operator, ...args] = ast;

    if (operator === 'number') {return (z, v) => [args, v];}
    if (operator === 'variable') {
        const [name] = args;
        if (name === 'z') {return (z, v) => [z, v];}
        return (z, v) => [get(v, name, errorValue), v];
    }
    if (operator === 'constant') {return (z, v) => [[constants[args[0]], 0], v];}

    const func = math[operator] || fns[operator];
    if (!isNil(func)) {
        const destructure = z => isNil(z.re) ? [z, 0] : [z.re, z.im];
        return (z, v) => [
            destructure(func(
                ...args.map(
                    subtree => math.complex(...toJS(subtree)(z, v)[0])
                )
            )),
            v
        ];
    } else {
        return (z, v) => [errorValue, v];
    }
}

export default toJS;
