import nearley from 'nearley';
import grammar from './grammar.js';

import compile from './translators/compiler.js';

const compiledGrammar = nearley.Grammar.fromCompiled(grammar);

const argument_names = ['z', 'w', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'];

class ComplexFunction {
    constructor(name, body, log_body, dependencies, log_dep, num_args) {
        // If no log_body defined, assume it's the same
        if (Array.isArray(log_body) || log_body === undefined) {
            num_args = dependencies;
            dependencies = log_body;
            log_body = body;
            log_dep = dependencies;
        }

        if (num_args === undefined) {num_args = 1;}

        this.name = name;
        this.body = body;
        this.log_body = log_body;
        this.dependencies = dependencies || [];
        this.log_dependencies = log_dep || this.dependencies;
        this.num_args = num_args;
    }

    apply(...parameters) {
        return `${this.name}(${parameters.join(', ')})`;
    }

    get declaration() {
        const types = Array(this.num_args);
        types.fill('VEC_TYPE');
        return `VEC_TYPE ${this.name}(${types.join(', ')});`
    }

    get params() {
        let parameters = [];
        for (let i = 0; i < this.num_args; i++) {
            parameters.push(`VEC_TYPE ${argument_names[i]}`);
        }
        return parameters.join(', ');
    }

    get code() {
        return `vec2 ${this.name}(${this.params}) {${this.body}}`;
    }

    get log_code() {
        if (this.log_body === null) {return null;}
        return `vec3 ${this.name}(${this.params}) {${this.log_body}}`;
    }
}

class DummyFunction {
    constructor(dependencies, log_dependencies) {
        this.dependencies = dependencies || [];
        this.log_dependencies = log_dependencies || [];
    }
    get declaration() {return '';}
    get log_declaration() {return '';}
    get code() {return '';}
    get log_code() {return '';}
}

class ComponentMul extends ComplexFunction {
    get declaration() {return `VEC_TYPE ${this.name}(VEC_TYPE, float);`}
    get code() {return `vec2 ${this.name}(vec2 z, float w) {${this.body}}`;}
    get log_code() {return `vec3 ${this.name}(vec3 z, float w) {${this.log_body}}`;}
}
class ZetaHelper extends ComplexFunction {
    get declaration() {return `vec4 ${this.name}(VEC_TYPE, mat4, mat4);`}
    get code() {return `vec4 ${this.name}(VEC_TYPE z, mat4 ns, mat4 bases) {${this.body}}`;}
    get log_code() {return `vec4 ${this.name}(VEC_TYPE z, mat4 ns, mat4 bases) {${this.log_body}}`;}
}
class ZetaHelper2 extends ComplexFunction {
    get declaration() {return `VEC_TYPE ${this.name}(VEC_TYPE, mat4, mat4);`}
    get code() {return `vec2 ${this.name}(VEC_TYPE z, mat4 bases, mat4 coeffs) {${this.body}}`;}
    get log_code() {return `vec3 ${this.name}(VEC_TYPE z, mat4 bases, mat4 coeffs) {${this.log_body}}`;}
}
class LatticeReduce extends ComplexFunction {
    get declaration() {return `vec4 ${this.name}(vec2);`}
    get code() {return `vec4 ${this.name}(vec2 z) {${this.body}}`;}
    get log_code() {return this.code;}
}
class Nome extends ComplexFunction {
    get declaration() {return `vec4 ${this.name}(VEC_TYPE);`}
    get code() {return `vec4 ${this.name}(VEC_TYPE z) {${this.body}}`;}
    get log_code() {return this.code;}
}
class EHelper extends ComplexFunction {
    get declaration() {return `VEC_TYPE ${this.name}(vec4);`}
    get code() {return `VEC_TYPE ${this.name}(vec4 h) {${this.body}}`;}
    get log_code() {return this.code;}
}

/***** BEGIN FUNCTION DEFINITIONS *****/

// Miscellaneous
const mul_i = new ComplexFunction('cmul_i', 'return vec2(-z.y, z.x);', 'return vec3(-z.y, z.x, z.z);');
const creciprocal = new ComplexFunction('creciprocal',
'return cconj(z) / dot(z, z);',
'return vec3(cconj(z).xy/dot(z.xy, z.xy), -z.z);',
['conj'], ['conj']);
const cconj = new ComplexFunction('cconj', 'return vec2(z.x, -z.y);', 'return vec3(z.x, -z.y, z.z);');
const cabs = new ComplexFunction('cabs', 'return vec2(length(z), 0);', 'return vec3(length(z.xy), 0, z.z);');
const carg = new ComplexFunction('carg', 'return vec2(atan(z.y, z.x), 0);', 'return vec3(atan(z.y, z.x), 0, 0);');
const csgn = new ComplexFunction('csgn', 'return normalize(z);', 'return vec3(normalize(z.xy), 0);');
const creal = new ComplexFunction('creal', 'return vec2(z.x, 0);', 'return vec3(z.x, 0, z.z);');
const cimag = new ComplexFunction('cimag', 'return vec2(z.y, 0);', 'return vec3(z.y, 0, z.z);');
const cfloor = new ComplexFunction('cfloor', 'return floor(z);', 'if (z.z > 20.) {return z;} else {return vec3(floor(downconvert(z).xy), 0);}');
const cceil = new ComplexFunction('cceil', 'return floor(z + 0.9999999);', 'if (z.z > 20.) {return z;} else {return vec3(floor(downconvert(z).xy + 0.9999999), 0);}'); // Built-in ceil fails on iOS
const cround = new ComplexFunction('cround', 'return floor(z + 0.5);', 'if (z.z > 20.) {return z;} else {return vec3(floor(downconvert(z).xy + 0.5), 0);}');
const cstep = new ComplexFunction('cstep', 'return vec2(step(0., z.x), 0);', 'return vec3(step(0., z.x), 0, 0);')

// Exponentials
const ccis = new ComplexFunction('ccis', 'return cexp(cmul_i(z));', ['exp', 'mul_i']);
const cexp_raw = new ComplexFunction('cexp_raw', // ASSUME DOWNCONVERTED
`float phase = z.y;
return exp(max(z.x, -40.)) * vec3(cos(phase), sin(phase), 0).COMPONENTS;`);
const cexp = new ComplexFunction('cexp',
`float phase = z.y;
return exp(z.x) * vec2(cos(phase), sin(phase));`,
`float phase = mod(z.y * exp(z.z), TAU);
return vec3(cos(phase), sin(phase), z.x * exp(z.z));`);
const clog = new ComplexFunction('clog',
`float magnitude = log(length(z));
float phase = atan(z.y, z.x);
return vec2(magnitude, phase);`,
`return vec3(log(length(z.xy)) + z.z, atan(z.y, z.x), 0.);`); // Note: result is already downconverted
const csqrt = new ComplexFunction('csqrt',
`float magnitude = length(z);
float phase = 0.5 * atan(z.y, z.x);
return sqrt(magnitude) * vec2(cos(phase), sin(phase));`,
`float magnitude = length(z.xy);
float phase = 0.5 * atan(z.y, z.x);
return vec3(sqrt(magnitude) * vec2(cos(phase), sin(phase)), 0.5*z.z);`)
const csquare = new ComplexFunction('csquare',
`float magnitude = length(z);
float phase = atan(z.y, z.x) * 2.0;
return (magnitude * magnitude) * vec2(cos(phase), sin(phase));`,
`float magnitude = length(z.xy);
float phase = atan(z.y, z.x) * 2.0;
return vec3((magnitude * magnitude) * vec2(cos(phase), sin(phase)), 2.*z.z);`);

// Trigonometry //
// Basic Trigonometric Functions
const csin = new ComplexFunction('csin',
`VEC_TYPE iz = cmul_i(z);
return ccomponent_mul(cmul_i(csub(cexp(iz), cexp(cneg(iz)))), -0.5);`,
['neg', 'sub', 'mul_i', 'exp', 'component_mul']);
const ccos = new ComplexFunction('ccos',
`VEC_TYPE iz = cmul_i(z);
return ccomponent_mul(cadd(cexp(iz), cexp(cneg(iz))), 0.5);`,
['neg', 'add', 'mul_i', 'exp', 'component_mul']);
const ctan = new ComplexFunction('ctan', 'return cmul_i(ctanh(cneg(cmul_i(z))));', ['mul_i', 'tanh', 'neg']);
const csec = new ComplexFunction('csec', 'return creciprocal(ccos(z));',
    ['reciprocal', 'cos']);
const ccsc = new ComplexFunction('ccsc', 'return creciprocal(csin(z));',
    ['reciprocal', 'sin']);
const ccot = new ComplexFunction('ccot', 'return creciprocal(ctan(z));',
    ['reciprocal', 'tan']);

// Inverse Trigonomeric Functions
const carcsin = new ComplexFunction('carcsin',
`VEC_TYPE a = csqrt(csub(ONE, csquare(z)));
if (z.y < 0.) {
    return cneg(cmul_i(clog(cadd(a, cmul_i(z)))));
} else {
    return cneg(cmul_i(cneg(clog(csub(a, cmul_i(z))))));
}`,
['sqrt', 'square', 'mul_i', 'log', 'add', 'sub', 'neg']);


const carccos = new ComplexFunction('carccos',
'return csub(0.5*C_PI, carcsin(z));',
['arcsin', 'sub']);
const carctan = new ComplexFunction('carctan',
`VEC_TYPE iz = cmul_i(z);
return ccomponent_mul(cmul_i(csub(clog(csub(ONE, iz)), clog(cadd(ONE, iz)))), 0.5);`,
['mul_i', 'log', 'component_mul', 'add', 'sub']);

const carccot = new ComplexFunction('carccot', 'return carctan(creciprocal(z));', ['arctan', 'reciprocal']);
const carcsec = new ComplexFunction('carcsec', 'return carccos(creciprocal(z));', ['arccos', 'reciprocal']);
const carccsc = new ComplexFunction('carccsc', 'return carcsin(creciprocal(z));', ['arcsin', 'reciprocal']);


// Hyperbolic Trigonomedtric Functions
const csinh = new ComplexFunction('csinh',
`VEC_TYPE exp_z = cexp(z); return ccomponent_mul(csub(exp_z, creciprocal(exp_z)), 0.5);`,
['exp', 'sub', 'component_mul', 'reciprocal']);
const ccosh = new ComplexFunction('ccosh',
`VEC_TYPE exp_z = cexp(z); return ccomponent_mul(cadd(exp_z, creciprocal(exp_z)), 0.5);`,
['exp', 'add', 'component_mul', 'reciprocal']);
const ctanh = new ComplexFunction('ctanh',
`VEC_TYPE a = cexp(ccomponent_mul(z, 2.));
VEC_TYPE b = creciprocal(a);
if (z.x > 0.0) {
   return cdiv(csub(ONE, b), cadd(ONE, b));
} else {
   return cdiv(csub(a, ONE), cadd(a, ONE));
}`,
['exp', 'component_mul', 'reciprocal', 'sub', 'add', 'div']);
const csech = new ComplexFunction('csech',
    'return creciprocal(ccosh(z));', ['reciprocal', 'cosh']);
const ccsch = new ComplexFunction('ccsch',
    'return creciprocal(csinh(z));', ['reciprocal', 'sinh']);
const ccoth = new ComplexFunction('ccoth', 'return creciprocal(ctanh(z));', ['reciprocal', 'tanh']);

// Inverse hyperbolic trigonometric functions
const carsinh = new ComplexFunction('carsinh',
'return cneg(cmul_i(carcsin(cmul_i(z))));',
['mul_i', 'arcsin', 'neg']);
const carcosh = new ComplexFunction('carcosh',
'return cneg(cmul_i(carccos(z)));',
['mul_i', 'arccos', 'neg']);
const cartanh = new ComplexFunction('cartanh',
'return cneg(cmul_i(carctan(cmul_i(z))));',
['mul_i', 'arctan', 'neg']);
const carsech = new ComplexFunction('carsech',
'return cneg(cmul_i(carcsec(z)));',
['mul_i', 'arcsec', 'neg']);
const carcsch = new ComplexFunction('carcsch',
'return cneg(cmul_i(carccsc(cneg(cmul_i(z)))));',
['mul_i', 'arccsc', 'neg']);
const carcoth = new ComplexFunction('carcoth',
'return cneg(cmul_i(carccot(cneg(cmul_i(z)))));',
['mul_i', 'arccot', 'neg']);


// Infix Operators //
const cneg = new ComplexFunction('cneg', 'return -z;', 'return vec3(vec2(0, 0) - z.xy, z.z);'); // Subtraction needed instead of unary minus on some GPUs... (even though expressions should be equivalent)
const cadd = new ComplexFunction('cadd',
'return z+w;',
`float diff = z.z - w.z;
float p = step(0., diff);
vec3 maxarg = p*z + (1.-p)*w;
vec3 minarg = w+z-maxarg;
return maxarg + vec3(exp(-abs(diff)) * minarg.xy, 0);`,
[], [], 2);
const csub = new ComplexFunction('csub', 'return z-w;', 'return cadd(z, cneg(w));', [], ['add', 'neg'], 2);
const cmul = new ComplexFunction('cmul',
'return mat2(z, -z.y, z.x) * w;',
'return vec3(mat2(z.xy, -z.y, z.x) * w.xy, z.z+w.z);',
[], [], 2);
const ccomponent_mul = new ComponentMul('ccomponent_mul',
'return z*w;', 'return vec3(z.xy * w, z.z);', [], [], 2);
const ccomponent_mul_prelog = new ComponentMul('ccomponent_mul_prelog',
'return z*exp(w);', 'return vec3(z.xy, z.z + w);', [], [], 2);
const cdiv = new ComplexFunction('cdiv', 'return cmul(z, creciprocal(w));', ['mul', 'reciprocal'], 2);
const cmod = new ComplexFunction('cmod', 'return cmul(w, fract(downconvert(cdiv(z, w))));', ['mul', 'div'], 2)
const cpow = new ComplexFunction('cpow', 'return cexp(cmul(clog(z), w));', ['exp', 'mul', 'log'], 2);
const cadd4 = new ComplexFunction('cadd4', 'return z+w+w1+w2;',
`float offset = max(max(z.z, w.z), max(w1.z, w2.z));
vec4 scales = exp(vec4(z.z, w.z, w1.z, w2.z) - offset);
return vec3(dot(scales, vec4(z.x, w.x, w1.x, w2.x)), dot(scales, vec4(z.y, w.y, w1.y, w2.y)), offset);`,
[], [], 4);
const cadd8 = new ComplexFunction('cadd8', 'return z+w+w1+w2+w3+w4+w5+w6;',
`float offset = max(max(max(z.z, w.z), max(w1.z, w2.z)), max(max(w3.z, w4.z), max(w5.z, w6.z)));
vec4 scales1 = exp(vec4(z.z, w.z, w1.z, w2.z) - offset);
vec4 scales2 = exp(vec4(w3.z, w4.z, w5.z, w6.z) - offset);
return vec3(
    dot(scales1, vec4(z.x, w.x, w1.x, w2.x))
    + dot(scales2, vec4(w3.x, w4.x, w5.x, w6.x)),
    dot(scales1, vec4(z.y, w.y, w1.y, w2.y))
    + dot(scales2, vec4(w3.y, w4.y, w5.y, w6.y)),
    offset
);`,
[], [], 8);
const cmul4 = new ComplexFunction('cmul4', 'return cmul(cmul(z, w), cmul(w1, w2));',
'return cmul(upconvert(cmul(z, w)), upconvert(cmul(w1, w2)));', ['mul'], ['mul'], 4);

// Gamma function
const cgamma = new ComplexFunction('cgamma',
'if (z.x < 0.5) {return cgamma_left(z);} else {return cgamma_right(z);}',
'if (z.x * exp(z.z) < 0.5) {return cgamma_left(z);} else {return cgamma_right(z);}',
['cgamma_left', 'cgamma_right'], ['cgamma_left', 'cgamma_right']);
const cgamma_left = new ComplexFunction('cgamma_left', // Use functional equation
'return ccomponent_mul_prelog(creciprocal(cmul(csin(ccomponent_mul_prelog(z, LNPI)), cgamma_right(csub(ONE, z)))), LNPI);',
['mul', 'sin', 'cgamma_right', 'component_mul_prelog', 'reciprocal', 'sub']);
const cgamma_right = new ComplexFunction('cgamma_right',
`vec2 w = z - ONE;
vec2 t = w + vec2(7.5, 0);
vec2 x = vec2(0.99999999999980993, 0);
x += 676.5203681218851 * creciprocal(w + vec2(1, 0));
x -= 1259.1392167224028 * creciprocal(w + vec2(2, 0));
x += 771.32342877765313 * creciprocal(w + vec2(3, 0));
x -= 176.61502916214059 * creciprocal(w + vec2(4, 0));
x += 12.507343278686905 * creciprocal(w + vec2(5, 0));
x -= .13857109526572012 * creciprocal(w + vec2(6, 0));
x += 9.9843695780195716e-6 * creciprocal(w + vec2(7, 0));
x += 1.5056327351493116e-7 * creciprocal(w + vec2(8, 0));
return sqrt(TAU) * cmul(x, cexp(cmul(clog(t), w + vec2(0.5, 0)) - t));`, // Lanczos approximation
`vec3 scale_one = exp(-z.z) * ONE;
vec3 w = z - scale_one;
vec3 t = w + 7.5 * scale_one;
vec3 ww = vec3(w.xy, 0);
vec3 x = vec3(0.99999999999980993 * exp(z.z), 0, 0);
x += 676.5203681218851 * creciprocal(ww + scale_one);
x -= 1259.1392167224028 * creciprocal(ww + 2.*scale_one);
x += 771.32342877765313 * creciprocal(ww + 3.*scale_one);
x -= 176.61502916214059 * creciprocal(ww + 4.*scale_one);
x += 12.507343278686905 * creciprocal(ww + 5.*scale_one);
x -= .13857109526572012 * creciprocal(ww + 6.*scale_one);
x += 9.9843695780195716e-6 * creciprocal(ww + 7.*scale_one);
x += 1.5056327351493116e-7 * creciprocal(ww + 8.*scale_one);
x.z -= w.z;
return ccomponent_mul(cmul(x, cexp(csub(cmul(clog(t), w + 0.5*scale_one), t))), sqrt(TAU));`, // Lanczos approximation
['reciprocal', 'mul', 'exp', 'log'], ['sqrt', 'reciprocal', 'sub', 'mul', 'exp', 'log', 'component_mul']);
const cfact = new ComplexFunction('cfact', 'return cgamma(cadd(z, ONE));', ['gamma', 'add']);
const cbeta = new ComplexFunction('cbeta', 'return cdiv(cmul(cgamma(z), cgamma(w)), cgamma(cadd(z, w)));', ['add', 'gamma', 'div', 'mul'], 2);
const cbinom = new ComplexFunction('cbinom',
`VEC_TYPE zz = csub(z, w);
return cdiv(z, cmul(cmul(w, zz), cbeta(zz, w)));`, ['sub', 'mul', 'div', 'beta'], 2);
const clambertw = new ComplexFunction('clambertw',
`VEC_TYPE L1 = clog(z);
if (ordinate(z) < -8.) {return z;}
z = downconvert(z);
VEC_TYPE est = (length(z.xy) > 3.) ? L1 - clog(L1) : csqrt(C_E.x*z+ONE)-ONE;
for (int i = 0; i < 3; i++) {
    est -= cdiv(cmul(est, est + clog(est) - L1), ONE + est);
}
return est;`, ['component_mul', 'log', 'mul', 'div', 'add', 'sub', 'sqrt']); // Asymptotic formula + Newton's iteration.

// Dirichlet eta function
const ceta = new ComplexFunction('ceta',
`z = downconvert(z);
VEC_TYPE conjugate_mask = vec3(1., 1., 1.).COMPONENTS;
if (z.y < 0.0) {
    z = cconj(z);
    conjugate_mask.y *= -1.;
}
VEC_TYPE result;
if (z.x < 0.) {
    result = ceta_left(z);
} else {
    result = ceta_right(z);
}
return result * conjugate_mask;`,
['conj', 'ceta_left', 'ceta_right']);
const ceta_left = new ComplexFunction('ceta_left', // ASSUME DOWNCONVERTED
`z.x *= -1.0;
vec2 component_a;
const float SQ2PI2 = 1.2533141373155001;
float log_r = log(length(z));
if (z.y > 200.0) {
    component_a = SQ2PI2 * cmul_i(cexp(
        vec2(z.x, 0)
        + (log_r - 1.0) * z
        - vec2(log_r/2.0, PI/4.0)
    ));
} else if (z.y > 20.0) {
    float theta = atan(z.y, z.x);
    component_a = SQ2PI2 * cmul_i(cexp(
        (theta - PI/2.0) * cmul_i(z)
        + (log_r - 1.0) * z
        - 0.5 * vec2(log_r, theta)
    ));
} else {
    component_a = cmul(cgamma(z), csin(z * PI/2.0));
}
vec2 component_b = cmul(z, ceta_right(z + ONE));
vec2 multiplier_a = cexp(-log(PI) * (z + ONE));
vec2 multiplier_b = cdiv(ONE - cexp(-LN2 * (z + ONE)), ONE - cexp(-LN2 * z));
vec2 component = cmul(component_a, component_b);
vec2 multiplier = cmul(multiplier_a, multiplier_b);
return 2.0 * cconj(cmul(component, multiplier));`,
`z.x *= -1.;
const float SQ2PI2 = 1.2533141373155001;
vec3 component_a = cmul(cgamma(z), csin(z * PI/2.));
vec3 component_b = cmul(z, ceta_right(z + ONE));
vec3 multiplier_a = cexp(-LNPI * (z + ONE));
vec3 multiplier_b = cdiv(csub(ONE, cexp(-LN2 * (z + ONE))), csub(ONE, cexp(-LN2 * z)));
vec3 component = cmul(component_a, component_b);
vec3 multiplier = cmul(multiplier_a, multiplier_b);
return ccomponent_mul(cconj(cmul(component, multiplier)), 2.);`,
['mul_i', 'exp', 'mul', 'gamma', 'sin', 'ceta_right', 'div'],
['mul', 'gamma', 'component_mul', 'sin', 'ceta_right', 'sub', 'div']);

// Charater chi in zeta(z) = chi(1-z) zeta(1-z)
const zeta_character = new ComplexFunction('zeta_character', // ASSUME DOWNCONVERTED
`const VEC_TYPE A = vec3(-1.0 - 2.0*LN2, PI/2.0, 0).COMPONENTS; // -1 + ln(i/4)
const VEC_TYPE B = vec3(1.0 + LN2, 0, 0).COMPONENTS;

// Asymptotic approximation to
// gamma(0.5 * z) / gamma((1-z)/2)
// Good for Im(z) > 10
VEC_TYPE zconj = ONE - 2.*z;
return cexp(
    cmul(z, A + clog(zconj))
    + 0.5 * (B - clog(z))
    + (0.5 * LNPI) * zconj
);`, ['exp', 'mul', 'log']);
const ceta_strip = new ComplexFunction('ceta_strip',
'z = downconvert(z); return cmul(csub(ONE, cexp(LN2 * (ONE - z))), czeta_strip(z));',
['mul', 'exp', 'sub', 'czeta_strip']);
const czeta_helper = new ZetaHelper('czeta_helper', // ASSUME DOWNCONVERTED
`mat4 phases = z.y*bases;
float cutoff = sqrt(z.y/TAU) + 100. * step(z.y, 120.);
vec4 res = vec4(0);
for (int row = 0; row < 4; row++) {
  vec4 mags = exp(z.x*bases[row]);
  vec4 cutoff = clamp(0.884*(cutoff-ns[row] + 0.5), 0., 1.);
  vec4 mags2 = cutoff/(ns[row] * mags);
  mags *= cutoff;
  vec4 re = cos(phases[row]);
  vec4 im = sin(phases[row]);
  res += vec4(dot(mags, re), dot(mags, im), dot(mags2, re), -dot(mags2, im));
}
return res;`);
const czeta_helper_2 = new ZetaHelper2('czeta_helper_2', // ASSUME DOWNCONVERTED
`mat4 phases = z.y*bases;
vec2 res = vec2(0);
for (int row = 0; row < 4; row++) {
  vec4 mags = exp(z.x*bases[row]) * coeffs[row];
  vec4 re = cos(phases[row]);
  vec4 im = sin(phases[row]);
  res += vec2(dot(mags, re), dot(mags, im));
}
return res;`,
`mat4 phases = z.y*bases;
vec3 res = vec3(0);
for (int row = 0; row < 4; row++) {
  vec4 mags = exp(z.x*bases[row]) * coeffs[row];
  vec4 re = cos(phases[row]);
  vec4 im = sin(phases[row]);
  res += vec3(dot(mags, re), dot(mags, im), 0);
}
return res;`);

// Riemann-Siegel Formula
const czeta_strip = new ComplexFunction('czeta_strip', // ASSUME DOWNCONVERTED
`vec4 zeta_est = vec4(1., 0, 1., 0); // Estimate of zeta(z), zeta(1-z)

zeta_est += czeta_helper(z,
mat4(2.,3.,4.,5.,6.,7.,8.,9.,10.,11.,12.,13.,14.,15.,16.,17.),
mat4(-0.693147180560,-1.098612288668,-1.386294361120,-1.609437912434,-1.791759469228,-1.945910149055,-2.079441541680,-2.197224577336,-2.302585092994,-2.397895272798,-2.484906649788,-2.564949357462,-2.639057329615,-2.708050201102,-2.772588722240,-2.833213344056));
zeta_est += czeta_helper(z,
mat4(18.,19.,20.,21.,22.,23.,24.,25.,26.,27.,28.,29.,30.,31.,32.,33.),
mat4(-2.890371757896,-2.944438979166,-2.995732273554,-3.044522437723,-3.091042453358,-3.135494215929,-3.178053830348,-3.218875824868,-3.258096538021,-3.295836866004,-3.332204510175,-3.367295829986,-3.401197381662,-3.433987204485,-3.465735902800,-3.496507561466));

VEC_TYPE zetaA = vec3(zeta_est.xy, 0).COMPONENTS;
VEC_TYPE zetaB = vec3(zeta_est.zw, 0).COMPONENTS;
zetaB = cmul(zetaB, cconj(zeta_character(ONE - cconj(z))));

if (z.y < 120.) {
    // Interpolate between the two estimates of zeta(z)
    float t = 1.0 - min(z.x, 1.0);
    float alpha = t*t * (3.0 - 2.0*t); // Hermite interpolation (smoothstep)
    return mix(zetaA, zetaB, alpha);
} else {
    return cadd(zetaA, zetaB);
}`, ['conj', 'zeta_character', 'czeta_helper', 'add']);

const ceta_right = new ComplexFunction('ceta_right', // ASSUME DOWNCONVERTED
`if (z.x < 3.0 && z.y > 54.) {return ceta_strip(z);}
VEC_TYPE result = ONE;
result += czeta_helper_2(z,
mat4(-0.69314718055995,-1.09861228866811,-1.38629436111989,-1.60943791243410,-1.79175946922805,-1.94591014905531,-2.07944154167984,-2.19722457733622,-2.30258509299405,-2.39789527279837,-2.48490664978800,-2.56494935746154,-2.63905732961526,-2.70805020110221,-2.77258872223978,-2.83321334405622),
mat4(-1.00000000000000,1.00000000000000,-1.00000000000000,1.00000000000000,-0.99999999999995,0.99999999999847,-0.99999999996425,0.99999999937104,-0.99999999142280,0.99999990708781,-0.99999918494666,0.99999411949279,-0.99996466193028,0.99982127062071,-0.99923254216349,0.99718148818347));
result += czeta_helper_2(z,
mat4(-2.89037175789616,-2.94443897916644,-2.99573227355399,-3.04452243772342,-3.09104245335832,-3.13549421592915,-3.17805383034795,-3.21887582486820,-3.25809653802148,-3.29583686600433,-3.33220451017520,-3.36729582998647,-3.40119738166216,-3.43398720448515,-3.46573590279973,-3.49650756146648),
mat4(-0.99109047939434,0.97562125072353,-0.94195422388664,0.87910910712444,-0.77852772396727,0.64073335549827,-0.47964042231228,0.31968999219853,-0.18572334624203,0.09196690020310,-0.03784892366350,0.01254701255408,-0.00320994916827,0.00059346134942,-0.00007044051625,0.00000402517236));
return result;`, ['ceta_strip', 'czeta_helper_2']);

// Riemann zeta function
const czeta = new ComplexFunction('czeta',
'z = downconvert(z); return cdiv(ceta(z), csub(ONE, cexp(LN2 * (ONE - z))));',
['div', 'eta', 'exp', 'sub']);


/***** Special Functions *****/
// Erf
// Small z: https://math.stackexchange.com/questions/712434/erfaib-error-function-separate-into-real-and-imaginary-part
// Large z: Custom expansion with Fresnel integral (centered around y=x).
// See https://samuelj.li/blog/2021-05-05-erf-expansion
const rerf = new ComplexFunction('rerf',
`float k = 1. - exp(-z.x*z.x);
const float K = 1.119;

const vec4 coeff = vec4(1./12., 7./480., 5./896., 787./276480.);
float series = 1. - dot(coeff, vec4(k, k*k, k*k*k, k*k*k*k));

return vec3(K * sqrt(k) * series, 0., 0.).COMPONENTS;
`
);
const cerf_large = new ComplexFunction('cerf_large', // ASSUME DOWNCONVERTED
`VEC_TYPE k = cmul_i(creciprocal(z));
VEC_TYPE k2 = csquare(k);
VEC_TYPE corrections = ccomponent_mul_prelog(
cmul(k, ONE + 0.5 * k2),
-LNPI/2.);
return cadd(ONE, cmul_i(cmul(cexp(csquare(cmul_i(z))), corrections)));`,
['reciprocal', 'mul_i', 'component_mul_prelog', 'square', 'exp', 'mul', 'add']);
const cerf_small = new ComplexFunction('cerf_small', // ASSUME DOWNCONVERTED
`float z2 = z.x*z.x;
float xy = 2.*z.x*z.y;
float K = exp(-z2)/PI;
float q = 4.*z2;
float a = cos(xy);
float b = sin(xy);

float offset = (z.y+z.x) * max(z.y-z.x, 0.);
float scale = exp(-offset);

vec2 series = vec2(0.0, 0.0);
for (int i = 0; i < 16; i += 4) {
    vec4 k = float(i) + vec4(1., 2., 3., 4.);
    vec4 kk = k*k/4.0 + z2 + offset;
    vec4 kz = k*z.y;
    vec4 e1 = exp(kz - kk);
    vec4 e2 = exp(-kz - kk);

    vec4 aa = z.x*(e1+e2);
    vec4 bb = 0.5*k*(e1-e2);

    vec4 denom = 1./(k*k + q);
    series.x += dot(2.*z.x * exp(-kk) - a*aa + b*bb, denom);
    series.y += dot(b*aa + a*bb, denom);
}
return scale * (rerf(z) + (K/(2. * z.x)) * vec3(1.-a, b, 0).COMPONENTS) + vec3(series*2./PI, offset).COMPONENTS;`, ['rerf']);
const cerf = new ComplexFunction('cerf',
`z = downconvert(z);
VEC_TYPE result;

if (abs(z.y) > 5.5) {
    result = cerf_large(abs(z));
} else {
    result = cerf_small(abs(z));
}

if (z.y < 0.0) {result.y *= -1.;}
if (z.x < 0.0) {result.x *= -1.; result.x -= 1e-7;}

return result;`, ['cerf_small', 'cerf_large']);



/***** Elliptic Functions *****/
const cnome = new ComplexFunction('cnome',
'return ccomponent_mul(cmul_i(clog(z)), -0.5/PI);', ['log', 'mul_i', 'component_mul']);

// Jacobi Theta functions
const ctheta00 = new ComplexFunction('ctheta00',
`z = downconvert(z); w = downconvert(w);
VEC_TYPE result = ONE;
VEC_TYPE A = 2.*z;
for (int i = 2; i < 10; i += 4) {
    float n = float(i);
    VEC_TYPE B = n*w;
    result = cadd(result, cadd8(
        ccis(PI*(n-1.)*(B-w+A)),
        ccis(PI*(n-1.)*(B-w-A)),
        ccis(PI*n*(B+A)),
        ccis(PI*n*(B-A)),
        ccis(PI*(n+1.)*(B+w+A)),
        ccis(PI*(n+1.)*(B+w-A)),
        ccis(PI*(n+2.)*(B+2.*w+A)),
        ccis(PI*(n+2.)*(B+2.*w-A))
    ));
}
return result;`, ['cis', 'component_mul', 'add', 'add8'], 2);
const ctheta01 = new ComplexFunction('ctheta01', 'z = downconvert(z); w = downconvert(w); return ctheta00(z + 0.5 * ONE, w);', ['theta00'], 2);
const ctheta10 = new ComplexFunction('ctheta10',
'z = downconvert(z); w = downconvert(w); return cmul(ccis(PI * (z + 0.25 * w)), ctheta00(z + 0.5 * w, w));',
['mul', 'cis', 'theta00'], 2);
const ctheta11 = new ComplexFunction('ctheta11',
'z = downconvert(z); w = downconvert(w); return cmul(ccis(0.25 * PI * (w + 4.0 * z + 2.0 * ONE)), ctheta00(z + 0.5 * (w + ONE), w));', ['mul', 'cis', 'theta00'], 2);

// Fast thetas for small arguments
const theta000 = new ComplexFunction('theta000', // ASSUME DOWNCONVERTED
`VEC_TYPE result = 0.5*ONE;
VEC_TYPE iz = cmul_i(z);
for (int i = 1; i < 8; i++) {
    float n = float(i);
    result += cexp_raw(PI * n * n * iz);
}
return 2.*result;`, ['mul_i', 'exp_raw']); // theta00(0, z);
const theta00f = new ComplexFunction('theta00f', // ASSUME DOWNCONVERTED
`VEC_TYPE result = ONE;
VEC_TYPE A = 2.*cmul_i(z);
VEC_TYPE iw = cmul_i(w);
for (int i = 1; i < 4; i++) {
    float n = float(i);
    VEC_TYPE B = n * iw;
    result += cexp_raw(PI * n * (B + A));
    result += cexp_raw(PI * n * (B - A));
}
return result;`, ['exp_raw', 'mul_i'], 2);
const theta01f = new ComplexFunction('theta01f', // ASSUME DOWNCONVERTED
'return theta00f(z + 0.5 * ONE, w);', ['theta00f'], 2);
const theta10f = new ComplexFunction('theta10f', // ASSUME DOWNCONVERTED
'return cmul(cexp_raw(PI * cmul_i(z + 0.25 * w)), theta00f(z + 0.5 * w, w));',
['mul', 'mul_i', 'exp_raw', 'theta00f'], 2);
const theta11f = new ComplexFunction('theta11f', // ASSUME DOWNCONVERTED
'return cmul(cexp_raw(0.25 * PI * cmul_i(w + 4.0 * z + 2.0 * ONE)), theta00f(z + 0.5 * (w + ONE), w));', ['mul', 'mul_i', 'exp_raw', 'theta00f'], 2);

// Jacobi elliptic functions
const invert_tau = new ComplexFunction('invert_tau', // ASSUME DOWNCONVERTED
`VEC_TYPE rt_k = csqrt(csqrt(ONE - csquare(z)));
VEC_TYPE ell = 0.5 * cdiv(ONE - rt_k, ONE + rt_k);
VEC_TYPE log_l = clog(ell);
VEC_TYPE q = ell + 2.*cexp_raw(5.*log_l) + 15.*cexp_raw(9.*log_l);
return -cmul_i(clog(q))/PI;`,
['sqrt', 'div', 'exp_raw', 'mul_i', 'log', 'component_mul']); // Computes tau from elliptic modulus k
const jacobi_reduce = new ComplexFunction('jacobi_reduce', // ASSUME DOWNCONVERTED
`VEC_TYPE t00 = theta000(w);
VEC_TYPE zz = cdiv(z, PI*csquare(t00));
float n = 2.0 * floor(0.5 * zz.y / w.y + 0.5);
return zz - n * w;`, ['theta000', 'div', 'square', 'component_mul'], 2); // Given (z, tau), reduce z to fundamental period

const invert_code = `z = downconvert(z); w = downconvert(w);
VEC_TYPE tau = invert_tau(w);
VEC_TYPE zz = jacobi_reduce(z, tau);`;
const raw_sn = new ComplexFunction('raw_sn', // ASSUME DOWNCONVERTED
`return -cdiv(
    cmul(theta000(w), theta11f(z, w)),
    cmul(theta10f(ZERO, w), theta01f(z, w))
);`,
['div', 'mul', 'theta000', 'theta11f', 'theta10f', 'theta01f'], 2);
const raw_cn = new ComplexFunction('raw_cn',
`return cdiv(
    cmul(theta01f(ZERO, w), theta10f(z, w)),
    cmul(theta10f(ZERO, w), theta01f(z, w))
);`,
['div', 'mul', 'theta01f', 'theta10f'], 2);
const raw_dn = new ComplexFunction('raw_dn',
`return cdiv(
    cmul(theta01f(ZERO, w), theta00f(z, w)),
    cmul(theta000(w), theta01f(z, w))
);`,
['div', 'mul', 'theta01f', 'theta00f', 'theta000'], 2);
const csn = new ComplexFunction('csn',
`${invert_code}
return raw_sn(zz, tau);`,
['invert_tau', 'jacobi_reduce', 'raw_sn'], 2);
const ccn = new ComplexFunction('ccn',
`${invert_code}
return raw_cn(zz, tau);`,
['invert_tau', 'jacobi_reduce', 'raw_cn'], 2);
const cdn = new ComplexFunction('cdn',
`${invert_code}
return raw_dn(zz, tau);`,
['invert_tau', 'jacobi_reduce', 'raw_dn'], 2);

// Weierstrass p-function
// Here e1, e2, e3 are roots of 4z^3 = 1/27.
const cwp = new ComplexFunction('cwp',
`z = downconvert(z); w = downconvert(w);
float n = floor(z.y/w.y + 0.5);
VEC_TYPE zz = z - n * w;
VEC_TYPE t002 = csquare(theta000(w));
VEC_TYPE t102 = csquare(theta10f(ZERO, w));
VEC_TYPE e2 = -(PI*PI/3.0) * (csquare(t102) + csquare(t002));
return PI*PI*cmul(cmul(t002, t102), csquare(cdiv(theta01f(zz, w), theta11f(zz, w)))) + e2;` ,
['square', 'div', 'mul', 'theta000', 'theta10f', 'theta01f', 'theta11f'], 2);
const raw_wpp = new ComplexFunction('raw_wpp',
`return -2. * cmul(
    cexp_raw(3. * clog(cdiv(w, raw_sn(z, w1)))),
    cmul(raw_cn(z, w1), raw_dn(z, w1))
);`, [
    'mul', 'exp_raw', 'log', 'div',
    'raw_sn', 'raw_cn', 'raw_dn',
], 3); // wp'(zz, A, tau), post-reduction
const cwpp = new ComplexFunction('cwpp',
`z = downconvert(z); w = downconvert(w);
VEC_TYPE t004 = csquare(csquare(theta000(w)));
VEC_TYPE t104 = csquare(csquare(theta10f(ZERO, w)));
VEC_TYPE t014 = csquare(csquare(theta01f(ZERO, w)));

const float PI2_3 = PI*PI/3.0;
VEC_TYPE e1 = PI2_3 * (t004 + t014);
VEC_TYPE e2 = -PI2_3 * (t104 + t004);
VEC_TYPE e3 = PI2_3 * (t104 - t014);

VEC_TYPE A = csqrt(e1 - e3);
VEC_TYPE B = csqrt(e2 - e3);

VEC_TYPE u = cmul(z, A);
VEC_TYPE k = cdiv(B, A);
VEC_TYPE tau = invert_tau(k);
VEC_TYPE zz = jacobi_reduce(u, tau);

return raw_wpp(zz, A, tau);`, [
    'mul', 'div', 'sqrt', 'square', 
    'theta000', 'theta10f', 'theta01f',
    'invert_tau', 'jacobi_reduce',
    'raw_wpp',
], 2);

// Dixon ellptic functions
const csm = new ComplexFunction('csm', 'z = downconvert(z); return ccm(1.7666387502854499*ONE-z);', ['cm']);
const ccm = new ComplexFunction('ccm', 
`z = downconvert(z);
const VEC_TYPE A = vec3(0.42644336004913946, 0.42644336004913946, 0).COMPONENTS;
const VEC_TYPE tau = vec3(-0.5, 0.8660254037844386, 0).COMPONENTS;
VEC_TYPE u = cmul(z, A);
VEC_TYPE zz = jacobi_reduce(u, tau);
return ONE + 2. * creciprocal(3. * raw_wpp(zz, A, tau) - ONE);`,
['reciprocal', 'jacobi_reduce', 'raw_wpp']);

// Modular functions
const lattice_reduce = new LatticeReduce('lattice_reduce', // LLL basis reduction algorithm, ASSUME DOWNCONVERTED
`if (z.y < 0.) {return -1./0. * vec4(1);}
vec4 coeffs = vec4(1., 0, 0, 1.);
vec2 a = z;
vec2 b = vec2(1., 0);
for (int i = 0; i < 5; i++) {
float mu = floor(dot(a, b)/dot(b, b) + 0.5);
a -= mu * b;
coeffs.xy -= mu * coeffs.zw;
mu = floor(dot(a, b)/dot(a, a) + 0.5);
b -= mu * a;
coeffs.zw -= mu * coeffs.xy;
}
vec4 res = vec4(coeffs.x*z, coeffs.z*z) + vec4(coeffs.y, 0, coeffs.w, 0);
float p = step(length(res.xy), length(res.zw));
vec2 num = res.xy * (1.-p) + res.zw * p;
vec2 denom = res.xy * p + res.zw * (1.-p);
vec2 representative = (1.-2.*p)*cdiv(vec3(num, 0).COMPONENTS, vec3(denom, 0).COMPONENTS).xy;
return vec4(representative, denom);`, ['div']);
const nred = new Nome('nred',
`z = downconvert(z);
vec4 reduced = lattice_reduce(z.xy);
z = vec3(reduced.xy, 0).COMPONENTS;
VEC_TYPE weight = vec3(reduced.zw, 0).COMPONENTS;
VEC_TYPE q = cexp_raw(2.*PI*cmul_i(z));
return vec4(q.xy, clog(weight).xy);`, ['lattice_reduce', 'log', 'exp_raw', 'mul_i'])
const cj = new ComplexFunction('cj', // j-invariant
`z = downconvert(z);
z = vec3(lattice_reduce(z.xy).xy, 0).COMPONENTS;
VEC_TYPE q = cexp_raw(PI*cmul_i(z));
VEC_TYPE q2 = csquare(q);
VEC_TYPE a = 8.*LN2*ONE + 2.*PI*cmul_i(z) + 8.*cmul(q2, ONE - 0.5*q2); // log(theta10^8)
VEC_TYPE even = -16.*cmul(q2, ONE + q2);
VEC_TYPE odd = 16.*cmul(q, ONE + 4./3.*q2);
VEC_TYPE b = even+odd; // log(theta00^8)
VEC_TYPE c = even-odd; // log(theta01^8)
return cexp(3.*clog(cexp_raw(a) + cexp_raw(b) + cexp_raw(c)) - (a+2.*even) + 5.*LN2*ONE);`,
['lattice_reduce', 'theta00', 'theta10', 'theta01', 'log', 'exp', 'exp_raw', 'cis', 'mul_i', 'square']);
const ce2 = new ComplexFunction('ce2',
`vec4 h = nred(z);
VEC_TYPE q = vec3(h.xy, 0).COMPONENTS;
VEC_TYPE log_weight = vec3(h.zw, 0).COMPONENTS;
VEC_TYPE q2 = csquare(q);
VEC_TYPE q3 = cmul(q, q2);
VEC_TYPE q4 = csquare(q2);
VEC_TYPE q5 = cmul(q, q4);
VEC_TYPE q6 = cmul(q2, q4);
VEC_TYPE q7 = cmul(q3, q4);
VEC_TYPE q8 = csquare(q4);
VEC_TYPE series = ONE - 24.*(
    cdiv(q, ONE-q) + 2.*cdiv(q2, ONE-q2) + 3.*cdiv(q3, ONE-q3) + 4.*cdiv(q4, ONE-q4)
    +5. * cdiv(q5, ONE-q5) + 6.*cdiv(q6, ONE-q6) + 7.*cdiv(q7, ONE-q7) + 8.*cdiv(q8, ONE-q8)
);
return cmul(series, cexp(log_weight * -2.));`,
['nred', 'square', 'exp']);
const e4_helper = new EHelper('e4_helper', // Eisenstein E4, given nome/log_weight
`VEC_TYPE q = vec3(h.xy, 0).COMPONENTS;
VEC_TYPE log_weight = vec3(h.zw, 0).COMPONENTS;
VEC_TYPE q2_chr = csquare(2.8284271247*q); // 8q^2
VEC_TYPE q3_chr = cmul(3.375*q, q2_chr); // 27q^3
VEC_TYPE series = ONE + 240.*(cdiv(q, ONE-q) + q2_chr + q3_chr);
return cmul(series, cexp(log_weight * -4.));`,
['exp', 'log', 'square', 'mul', 'div']);
const e6_helper = new EHelper('e6_helper', // Eisenstein E6, given nome/log_weight
`VEC_TYPE q = vec3(h.xy, 0).COMPONENTS;
VEC_TYPE log_weight = vec3(h.zw, 0).COMPONENTS;
VEC_TYPE q2_chr = csquare(5.65685425*q); // 32q^2
VEC_TYPE q3_chr = cmul(7.59375*q, q2_chr); // 243q^3
VEC_TYPE q4_chr = csquare(q2_chr); // 1024q^5
VEC_TYPE series = ONE - 504.* (cdiv(q, ONE-q) + cdiv(q2_chr, ONE-0.03125*q2_chr) + q3_chr + q4_chr);
return cmul(series, cexp(log_weight * -6.));`,
['exp', 'log', 'square', 'mul', 'div', 'exp_raw', 'sub', 'component_mul_prelog']);
const ce4 = new ComplexFunction('ce4', 'vec4 h = nred(z); return e4_helper(h);', ['nred', 'e4_helper']);
const ce6 = new ComplexFunction('ce6', 'vec4 h = nred(z); return e6_helper(h);', ['nred', 'e6_helper']);
const ce8 = new ComplexFunction('ce8', 'return csquare(ce4(z));', ['square', 'e4']);
const ce10 = new ComplexFunction('ce10',
'vec4 h = nred(z); return cmul(e4_helper(h), e6_helper(h));',
['mul', 'nred', 'e4_helper', 'e6_helper']);
const ce12 = new ComplexFunction('ce12',
`vec4 h = nred(z); VEC_TYPE a = e4_helper(h); VEC_TYPE b = e6_helper(h);
return cadd(ccomponent_mul(cexp(3.*clog(a)), 441./691.), ccomponent_mul(csquare(b), 250./691.));`,
['add', 'nred', 'e4_helper', 'e6_helper', 'component_mul', 'square']);
const ce14 = new ComplexFunction('ce14',
`vec4 h = nred(z); return cmul(csquare(e4_helper(h)), e6_helper(h));`,
['nred', 'e4_helper', 'e6_helper', 'mul', 'square']);
const ce16 = new ComplexFunction('ce16',
`vec4 h = nred(z); VEC_TYPE a = e4_helper(h); VEC_TYPE b = e6_helper(h);
return cadd(ccomponent_mul(cexp(4.*clog(a)), 1617./3617.), ccomponent_mul(csquare(b), 2000./3617.));`,
['add', 'nred', 'e4_helper', 'e6_helper', 'component_mul', 'square']);

/**** Function List ****/
var complex_functions = {
    mul_i,
    'reciprocal': creciprocal,
    'square': csquare,
    'component_mul': ccomponent_mul,
    'component_mul_prelog': ccomponent_mul_prelog,

    'real': creal,
    'imag': cimag,

    'conj': cconj,
    'abs': cabs,
    'arg': carg,
    'sgn': csgn,
    'cis': ccis,
    'floor': cfloor,
    'ceil': cceil,
    'round': cround,
    'step': cstep,

    'exp': cexp,
    'exp_raw': cexp_raw,
    'log': clog,

    'sqrt': csqrt,
    'pow': cpow,
    'sin': csin,  'cos': ccos,  'tan': ctan,
    'sec': csec,  'csc': ccsc,  'cot': ccot,

    'arcsin': carcsin,  'arccos': carccos,  'arctan': carctan,
    'arcsec': carcsec,  'arccsc': carccsc,  'arccot': carccot,
    'sinh': csinh, 'cosh': ccosh, 'tanh': ctanh,
    'sech': csech, 'csch': ccsch, 'coth': ccoth,
    'arsinh': carsinh, 'arcosh': carcosh, 'artanh': cartanh,
    'arsech': carsech, 'arcsch': carcsch, 'arcoth': carcoth,
    'neg': cneg,
    'add': cadd,
    'add4': cadd4,
    'add8': cadd8,
    'mul4': cmul4,
    'sub': csub,
    'mul': cmul,
    'div': cdiv,
    'mod': cmod,
    'factorial': cfact,

    cgamma_left, cgamma_right,
    'gamma': cgamma,
    'beta': cbeta,
    'binom': cbinom,
    'lambertw': clambertw,

    ceta_left, ceta_strip, ceta_right,
    zeta_character, czeta_strip, czeta_helper, czeta_helper_2,
    rerf, cerf_small, cerf_large,
    'eta': ceta,
    'zeta': czeta,
    'erf': cerf,

    invert_tau, jacobi_reduce, 
    theta000, theta00f, theta01f, theta10f, theta11f,
    'nome': cnome,
    'theta00': ctheta00,
    'theta01': ctheta01,
    'theta10': ctheta10,
    'theta11': ctheta11,

    raw_sn, raw_cn, raw_dn,
    'sn': csn,
    'cn': ccn,
    'dn': cdn,

    raw_wpp,
    'wp': cwp,
    'wpp': cwpp,

    'sm': csm,
    'cm': ccm,

    lattice_reduce, nred, e4_helper, e6_helper,
    'j': cj,
    'e2': ce2,
    'e4': ce4,
    'e6': ce6,
    'e8': ce8,
    'e10': ce10,
    'e12': ce12,
    'e14': ce14,
    'e16': ce16,
};

function parseExpression(expression) {
    try {
        const parser = new nearley.Parser(compiledGrammar);
        parser.feed(expression)
        const result = parser.results[0];
        if (result !== null) {
            console.log('Raw AST:', result);
        }
        return compile(result || null);
    } catch (error) {
        console.error(error);
        return null;
    }
}

function getRequirements(ast) {
    if (!Array.isArray(ast)) {return new Set();}
    if (['number', 'variable', 'constant'].includes(ast[0])) {return new Set();}
    const requirements = new Set([ast[0]]);
    for (let subast of ast.slice(1)) {
        for (let req of getRequirements(subast)) {
            requirements.add(req);
        }
    }
    return requirements;
}

// Get function declarations and definitions.
// Only loads used functions and their dependencies.
function functionDefinitions(ast, LOG_MODE) {
    let required = null;

    if (Array.isArray(ast)) {
        // Extract functions used
        required = getRequirements(ast);
    } else {
        required = new Set();
        for (let name of Object.keys(complex_functions)) {
            if (ast.includes(name+'(')) {
                required.add(name);
            }
        }
    }

    // Resolve dependencies
    const stack = Array.from(required);
    while (stack.length > 0) {
        const f = stack.pop();
        const fObj = complex_functions[f];
        const dependencies = LOG_MODE ? fObj.log_dependencies : fObj.dependencies;
        for (let dep of dependencies) {
            if (!required.has(dep)) {
                required.add(dep);
                stack.push(dep);
            }
        }
    }
    
    console.log('Functions loaded:', required);

    const VEC_TYPE = LOG_MODE ? 'vec3' : 'vec2';
    const comp_suffix = LOG_MODE ? 'xyz' : 'xy';

    const functions = Array.from(required).map(name => complex_functions[name]);
    const declarations = functions.map(f => f.declaration.replaceAll('VEC_TYPE', VEC_TYPE));
    const definitions = functions.map(
        f => (LOG_MODE ? f.log_code : f.code).replaceAll('VEC_TYPE', VEC_TYPE).replaceAll('COMPONENTS', comp_suffix)
    );

    const declarationString = declarations.join('\n');
    const definitionString = definitions.join('\n');
    return `${declarationString}\n\n${definitionString}`;
}

export {complex_functions, parseExpression, functionDefinitions};
