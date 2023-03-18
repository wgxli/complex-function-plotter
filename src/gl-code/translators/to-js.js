import {get, isNil} from 'lodash';
import {
    zeta, eta, gamma, erf,
    theta00, theta01, theta10, theta11,
    sn, cn, dn,
    wp, wpp,
    sm, cm,
    j,
} from './custom-functions.js'
const math = require('mathjs');

const constants = {
    'e': Math.E,
    'pi': Math.PI,
    'tau': 2 * Math.PI,
    'phi': (1 + Math.sqrt(5))/2,
}

const add4 = (a, b, c, d) => math.add(math.add(a, b), math.add(c, d));

const I = math.complex(0, 1);
const fns = {
    add8: (a, b, c, d, e, f, g, h) => math.add(add4(a, b, c, d), add4(e, f, g, h)),
    add4,
    mul4: (a, b, c, d) => math.multiply(math.multiply(a, b), math.multiply(c, d)),
    rawpow: math.pow,
    sub: math.subtract,
    neg: math.unaryMinus,
    mul: math.multiply,
    div: math.divide,
    reciprocal: z => math.divide(1, z),
    component_mul: (z, alpha) => math.complex(alpha*z.re, alpha*z.im),
    component_mul_prelog: (z, alpha) => math.complex(math.exp(alpha)*z.re, math.exp(alpha)*z.im),
    real: math.re,
    imag: math.im,
    step: z => (z.re >= 0) ? 1 : 0,

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

    gamma,
    eta,
    zeta,
    erf,

//    factorial: z => gamma(math.add(z, 1)),

    theta00, theta01, theta10, theta11,
    sn, cn, dn,
    wp, wpp,
    sm, cm,
    j,
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
    if (!isNaN(ast)) {return z => [ast, 0];}

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
    const func = fns[operator] || math[operator];
    if (!isNil(func)) {
        const destructure = z => isNil(z.re) ? [z, 0] : [z.re, z.im];
        return z => destructure(func(...args.map(
                subtree => math.complex(...toJS(subtree, variables)(z))
        )));
    }

    // Fallback if no match
    return z => errorValue;
}

export {constants, fns};
export default toJS;
