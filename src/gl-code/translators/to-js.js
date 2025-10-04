import {get, isNil} from 'lodash';
import {
    zeta, eta, gamma, beta, binom, erf, lambertw,
    nome,
    theta00, theta01, theta10, theta11,
    sn, cn, dn,
    wp, wpp,
    sm, cm,
    j, e2, e4, e6, e8, e10, e12, e14, e16
} from './custom-functions.js'
const math = require('mathjs');

const constants = {
    'e': Math.E,
    'pi': Math.PI,
    'tau': 2 * Math.PI,
    'phi': (1 + Math.sqrt(5))/2,
}

function fract(z) {return math.complex(z.re - Math.floor(z.re), z.im - Math.floor(z.im));}
const mod =  (z, w) => math.multiply(w, fract(math.divide(z, w)));
const add4 = (a, b, c, d) => math.add(math.add(a, b), math.add(c, d));

const I = math.complex(0, 1);
const fns = {
    add8: (a, b, c, d, e, f, g, h) => math.add(add4(a, b, c, d), add4(e, f, g, h)),
    add4,
    mul4: (a, b, c, d) => math.multiply(math.multiply(a, b), math.multiply(c, d)),

    rawpow: math.pow,
    log: z => (z === 0) ? -1e100 : math.log((z.re < 0) ? math.add(z, math.complex(0, 1e-20)) : z), // Consistent branch cut

    sub: math.subtract,
    neg: math.unaryMinus,
    mul: math.multiply,
    div: math.divide,
    mod,
    reciprocal: z => math.divide(1, z),
    component_mul: (z, alpha) => math.complex(alpha*z.re, alpha*z.im),
    component_mul_prelog: (z, alpha) => math.complex(math.exp(alpha)*z.re, math.exp(alpha)*z.im),
    real: math.re,
    imag: math.im,
    step: z => (z.re >= 0) ? 1 : 0,

    max: (z, w) => math.complex(Math.max(z.re, w.re), Math.max(z.im, w.im)),
    min: (z, w) => math.complex(Math.min(z.re, w.re), Math.min(z.im, w.im)),

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

    gamma, beta, binom,
    eta,
    zeta,
    erf,
    lambertw,

//    factorial: z => gamma(math.add(z, 1)),

    nome,
    theta00, theta01, theta10, theta11,
    sn, cn, dn,
    wp, wpp,
    sm, cm,
    j, e2, e4, e6, e8, e10, e12, e14, e16,
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
