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
 * representing the complex input.
 * The returned function outputs a
 * 2-tuple [real, imag]
 * representing the complex output.
 */
function toJS(ast, variables) {
    const errorValue = [NaN, NaN];
    if (ast === null) {return z => errorValue;}

    const constants = {
        'e': Math.E,
        'pi': Math.PI,
        'tau': 2 * Math.PI,
        'phi': (1 + Math.sqrt(5))/2,
    }

    // Destructure this level of the AST
    const [operator, ...args] = ast;

    // Complex number literal
    if (operator === 'number') {return z => args;}

    // User-defined variable
    if (operator === 'variable') {
        const [name] = args;
        if (name === 'z') {return z => z;}
        return z => [get(variables, name, NaN), 0];
    }

    // Built-in constant
    if (operator === 'constant') {
        const [name] = args;
        return z => [constants[name], 0];
    }

    // Built-in function
    const func = math[operator] || fns[operator];
    if (!isNil(func)) {
        const destructure = z => isNil(z.re) ? [z, 0] : [z.re, z.im];
        return z => destructure(func(...args.map(
                subtree => math.complex(...toJS(subtree, variables)(z))
        )));
    }

    // Fallback if no match
    return z => errorValue;
}

export default toJS;
