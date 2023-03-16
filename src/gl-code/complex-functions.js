import nearley from 'nearley';
import grammar from './grammar.js';

import compile from './translators/compiler.js';

const compiledGrammar = nearley.Grammar.fromCompiled(grammar);

const argument_names = ['z', 'w', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'];

//const VEC_TYPE = 'vec3'; // Log-Cartesian
const VEC_TYPE = 'vec2'; // Cartesian

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
        types.fill(VEC_TYPE);
        return `${VEC_TYPE} ${this.name}(${types.join(', ')});`
    }

    get params() {
        let parameters = [];
        for (let i = 0; i < this.num_args; i++) {
            parameters.push(`${VEC_TYPE} ${argument_names[i]}`);
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
    get declaration() {return `${VEC_TYPE} ${this.name}(${VEC_TYPE}, float);`}
    get code() {return `${VEC_TYPE} ${this.name}(${VEC_TYPE} z, float w) {${this.body}}`;}
    get log_code() {return `${VEC_TYPE} ${this.name}(${VEC_TYPE} z, float w) {${this.log_body}}`;}
}
class ZetaHelper extends ComplexFunction {
    get declaration() {return `vec4 ${this.name}(vec2, mat4, mat4);`}
    get code() {return `vec4 ${this.name}(vec2 z, mat4 ns, mat4 bases) {${this.body}}`;}
}
class ZetaHelper2 extends ComplexFunction {
    get declaration() {return `vec2 ${this.name}(vec2, mat4, mat4);`}
    get code() {return `vec2 ${this.name}(vec2 z, mat4 bases, mat4 coeffs) {${this.body}}`;}
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
const cceil = new ComplexFunction('cceil', 'return floor(z + vec2(0.9999999, 0.9999999));', ''); // Built-in ceil fails on iOS
const cround = new ComplexFunction('cround', 'return floor(z + vec2(0.5, 0.5));', '');
const cstep = new ComplexFunction('cstep', 'return vec2(step(0., z.x), 0);', 'return vec3(step(0., z.x), 0, 0);')

// Exponentials
const ccis = new ComplexFunction('ccis', 'return cexp(cmul_i(z));', ['exp', 'mul_i']);
const cexp = new ComplexFunction('cexp',
`float phase = z.y;
return exp(z.x) * vec2(cos(phase), sin(phase));`,
`float phase = z.y * exp(z.z);
return vec3(cos(phase), sin(phase), z.x * exp(z.z));`);
const clog = new ComplexFunction('clog',
`float magnitude = log(length(z));
float phase = atan(z.y, z.x);
return vec2(magnitude, phase);`,
`return vec3(log(length(z.xy)) + z.z, atan(z.y, z.x), 0.);`);
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
`float magnitude = length(z);
float phase = atan(z.y, z.x) * 2.0;
return vec3((magnitude * magnitude) * vec2(cos(phase), sin(phase)), 2.*z.z);`);

// Trigonometry //
// Basic Trigonometric Functions
const csin = new ComplexFunction('csin',
`${VEC_TYPE} iz = cmul_i(z);
return ccomponent_mul(cmul_i(csub(cexp(iz), cexp(cneg(iz)))), -0.5);`,
['neg', 'sub', 'mul_i', 'exp', 'component_mul']);
const ccos = new ComplexFunction('ccos',
`${VEC_TYPE} iz = cmul_i(z);
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
`${VEC_TYPE} a = csqrt(csub(ONE, csquare(z)));
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
`vec2 iz = cmul_i(z);
return 0.5 * cmul_i(clog(ONE - iz) - clog(ONE + iz));`,
`return csub(clog(csub(LOG_ONE, z + LOG_I)), clog(cadd(LOG_ONE, z + LOG_I))) + vec2(-LN2, PI/2.);`,
['mul_i', 'log'], ['sub', 'add', 'log']);

const carccot = new ComplexFunction('carccot', 'return carctan(creciprocal(z));', ['arctan', 'reciprocal']);
const carcsec = new ComplexFunction('carcsec', 'return carccos(creciprocal(z));', ['arccos', 'reciprocal']);
const carccsc = new ComplexFunction('carccsc', 'return carcsin(creciprocal(z));', ['arcsin', 'reciprocal']);


// Hyperbolic Trigonometric Functions
const csinh = new ComplexFunction('csinh',
    'return 0.5 * (cexp(z) - cexp(-z));',
    'vec2 a = cexp(z); return csub(a, -a) - vec2(LN2, 0);',
    ['exp'], ['exp', 'sub']);
const ccosh = new ComplexFunction('ccosh',
    'return 0.5 * (cexp(z) + cexp(-z));',
    'vec2 a = cexp(z); return cadd(a, -a) - vec2(LN2, 0);',
    ['exp'], ['exp', 'add']);
const ctanh = new ComplexFunction('ctanh',
`${VEC_TYPE} a = cexp(ccomponent_mul(z, 2.));
${VEC_TYPE} b = creciprocal(a);
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
'return -cmul_i(carcsin(cmul_i(z)));',
'return carcsin(z + LOG_I) - LOG_I;',
['mul_i', 'arcsin'], ['arcsin']);
const carcosh = new ComplexFunction('carcosh',
    'return -cmul_i(carccos(z));',
    'return carccos(z) - LOG_I;',
    ['mul_i', 'arccos'], ['arccos']);
const cartanh = new ComplexFunction('cartanh',
    'return -cmul_i(carctan(cmul_i(z)));',
    'return carctan(z + LOG_I) - LOG_I;',
    ['mul_i', 'arctan'], ['arctan']);
const carsech = new ComplexFunction('carsech',
    'return -cmul_i(carcsec(z));',
    'return carcsec(z) - LOG_I;',
    ['mul_i', 'arcsec'], ['arcsec']);
const carcsch = new ComplexFunction('carcsch',
    'return -cmul_i(carccsc(-cmul_i(z)));',
    'return carccsc(z - LOG_I) - LOG_I;',
    ['mul_i', 'arccsc'], ['arccsc']);
const carcoth = new ComplexFunction('carcoth',
    'return -cmul_i(carccot(-cmul_i(z)));',
    'return carccot(z - LOG_I) - LOG_I;',
    ['mul_i', 'arccot'], ['arccot']);


// Infix Operators //
const cneg = new ComplexFunction('cneg', 'return -z;', 'return vec3(-z.xy, z.z);');
const cadd = new ComplexFunction('cadd',
'return z+w;',
`vec3 delta = vec3(0, 0, max(z.z, w.z));
return delta + downconvert(z-delta) + downconvert(w-delta);`,
[], [], 2);
const csub = new ComplexFunction('csub', 'return z-w;', 'return cadd(z, cneg(w));', [], ['add', 'neg'], 2);
const cmul = new ComplexFunction('cmul',
'return mat2(z, -z.y, z.x) * w;',
'return vec3(mat2(z.xy, -z.y, z.x) * w.xy, z.z+w.z);',
[], [], 2);
const ccomponent_mul = new ComponentMul('ccomponent_mul',
'return z*w;', 'return vec3(z.xy * w, z.z);', [], [], 2);
const cdiv = new ComplexFunction('cdiv', 'return cmul(z, creciprocal(w));', ['mul', 'reciprocal'], 2);
const cpow = new ComplexFunction('cpow', 'return cexp(cmul(clog(z), w));', ['exp', 'mul', 'log'], 2);
const cadd4 = new ComplexFunction('cadd4', 'return z+w+w1+w2;',
`float offset = max(max(z.x, w.x), max(w1.x, w2.x));
vec2 delta = vec2(offset, 0);
return clogcart(
    cexpcart(z - delta)
    + cexpcart(w - delta)
    + cexpcart(w1 - delta)
    + cexpcart(w2 - delta)
) + delta;`,
[], [], 4);
const cadd8 = new ComplexFunction('cadd8', 'return z+w+w1+w2+w3+w4+w5+w6;',
`float offset = max(max(max(z.x, w.x), max(w1.x, w2.x)), max(max(w3.x, w4.x), max(w5.x, w6.x)));
vec2 delta = vec2(offset, 0);
return clogcart(
    cexpcart(z - delta)
    + cexpcart(w - delta)
    + cexpcart(w1 - delta)
    + cexpcart(w2 - delta)
    + cexpcart(w3 - delta)
    + cexpcart(w4 - delta)
    + cexpcart(w5 - delta)
    + cexpcart(w6 - delta)
) + delta;`,
[], [], 8);

// Gamma function
const cgamma = new ComplexFunction('cgamma',
    'if (z.x < 0.5) {return cgamma_left(z);} else {return cgamma_right(z);}',
    'if (cos(z.y) < 0.5 * exp(-z.x)) {return cgamma_left(z);} else {return cgamma_right(z);}',
    ['cgamma_left', 'cgamma_right']);
const cgamma_left = new ComplexFunction('cgamma_left',
    'return PI * creciprocal(cmul(csin(PI*z), cgamma_right(ONE-z)));',
    'return -(csin(z + vec2(LNPI, 0)) + cgamma_right(csub(LOG_ONE, z))) + vec2(LNPI, 0);',
    ['mul', 'sin', 'cgamma_right'], ['mul', 'sin', 'cgamma_right']);
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
`vec2 base = cadd(z, -csub(z + vec2(log(12.), 0), -z - vec2(log(10.), 0)));
return csqrt(vec2(LN2+LNPI, 0)-z) + cpow(base - ONE, z);`, // Stirling approximation
['reciprocal', 'mul', 'exp', 'log'], ['sqrt', 'pow', 'add', 'sub']);
const cfact = new ComplexFunction('cfact', 'return cgamma(z + ONE);', 'return cgamma(cadd(z, LOG_ONE));', ['gamma'], ['gamma', 'add']);

// Dirichlet eta function
const ceta = new ComplexFunction('ceta',
`vec2 conjugate_mask = vec2(1.0, 1.0);
if (z.y < 0.0) {
    z = cconj(z);
    conjugate_mask.y *= -1.0;
}
vec2 result;
if (z.x < 0.0) {
    result = ceta_left(z);
} else {
    result = ceta_right(z);
}
return result * conjugate_mask;`,
'return ceta_right(z);',
['conj', 'ceta_left', 'ceta_right'], ['ceta_right']);
const ceta_left = new ComplexFunction('ceta_left',
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
['mul_i', 'exp', 'mul', 'gamma', 'sin', 'ceta_right', 'div']);

// Charater chi in zeta(z) = chi(1-z) zeta(1-z)
const zeta_character = new ComplexFunction('zeta_character',
`const vec2 A = vec2(-1.0 - 2.0*LN2, PI/2.0); // -1 + ln(i/4)
const vec2 B = vec2(1.0 + LN2, 0);

// Asymptotic approximation to
// gamma(0.5 * z) / gamma((1-z)/2)
// Good for Im(z) > 10
vec2 zconj = ONE - 2.*z;
return cexp(
    cmul(z, A + clog(zconj))
    + 0.5 * (B - clog(z))
    + (0.5 * LNPI) * zconj
);`,
`const vec2 A = vec2(-1.0 - 2.0*LN2, PI/2.0); // -1 + ln(i/4)
const vec2 B = vec2(1.0 + LN2, 0);

vec2 zcomp = csub(LOG_ONE, z + vec2(LN2, 0));
return 0.5*LNPI * cexp(zcomp) + 0.5 * (B - z) + cpow(A + zcomp, z);`,
['exp', 'mul', 'log'], ['exp', 'gamma', 'add', 'sub', 'pow']);
const ceta_strip = new ComplexFunction('ceta_strip',
'return cmul(ONE - cexp(LN2 * (ONE - z)), czeta_strip(z));',
['mul', 'exp', 'czeta_strip']);
const czeta_helper = new ZetaHelper('czeta_helper',
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
const czeta_helper_2 = new ZetaHelper2('czeta_helper_2',
`mat4 phases = z.y*bases;
vec2 res = vec2(0);
for (int row = 0; row < 4; row++) {
  vec4 mags = exp(z.x*bases[row]) * coeffs[row];
  vec4 re = cos(phases[row]);
  vec4 im = sin(phases[row]);
  res += vec2(dot(mags, re), dot(mags, im));
}
return res;`);
// Riemann-Siegel Formula
const czeta_strip = new ComplexFunction('czeta_strip',
`vec4 zeta_est = vec4(1., 0, 1., 0); // Estimate of zeta(z), zeta(1-z)

zeta_est += czeta_helper(z,
mat4(2.,3.,4.,5.,6.,7.,8.,9.,10.,11.,12.,13.,14.,15.,16.,17.),
mat4(-0.693147180560,-1.098612288668,-1.386294361120,-1.609437912434,-1.791759469228,-1.945910149055,-2.079441541680,-2.197224577336,-2.302585092994,-2.397895272798,-2.484906649788,-2.564949357462,-2.639057329615,-2.708050201102,-2.772588722240,-2.833213344056));
zeta_est += czeta_helper(z,
mat4(18.,19.,20.,21.,22.,23.,24.,25.,26.,27.,28.,29.,30.,31.,32.,33.),
mat4(-2.890371757896,-2.944438979166,-2.995732273554,-3.044522437723,-3.091042453358,-3.135494215929,-3.178053830348,-3.218875824868,-3.258096538021,-3.295836866004,-3.332204510175,-3.367295829986,-3.401197381662,-3.433987204485,-3.465735902800,-3.496507561466));

vec2 zetaA = zeta_est.xy;
vec2 zetaB = zeta_est.zw;
zetaB = cmul(zetaB, cconj(zeta_character(ONE - cconj(z))));

if (z.y < 120.) {
    // Interpolate between the two estimates of zeta(z)
    float t = 1.0 - min(z.x, 1.0);
    float alpha = t*t * (3.0 - 2.0*t); // Hermite interpolation (smoothstep)
    return mix(zetaA, zetaB, alpha);
} else {
    return zetaA + zetaB;
}`,
`vec2 exp_z = cexp(z);
vec2 zetaA = cadd8(
vec2(0, 0),
-0.693147180560 * exp_z,
-1.098612288668 * exp_z,
-1.386294361120 * exp_z,
-1.609437912434 * exp_z,
-1.791759469228 * exp_z,
-1.945910149055 * exp_z,
-2.079441541680 * exp_z);
vec2 zetaB = cadd8(
vec2(0, 0),
0.693147180560 * exp_z - vec2(0.693147180560, 0),
1.098612288668 * exp_z - vec2(1.098612288668, 0),
1.386294361120 * exp_z - vec2(1.386294361120, 0),
1.609437912434 * exp_z - vec2(1.609437912434, 0),
1.791759469228 * exp_z - vec2(1.791759469228, 0),
1.945910149055 * exp_z - vec2(1.945910149055, 0),
2.079441541680 * exp_z - vec2(2.079441541680, 0));

// Convert to an estimate of zeta(z) via the functional equation
zetaB += zeta_character(csub(ONE, z));
return cadd(zetaA, zetaB);`,
['conj', 'zeta_character', 'czeta_helper'],
['exp', 'add', 'sub', 'add8', 'zeta_character']);

const ceta_right = new ComplexFunction('ceta_right',
`if (z.x < 3.0 && z.y > 50.0) {return ceta_strip(z);}
vec2 result = vec2(1., 0);
result += czeta_helper_2(z,
mat4(-0.69314718055995,-1.09861228866811,-1.38629436111989,-1.60943791243410,-1.79175946922805,-1.94591014905531,-2.07944154167984,-2.19722457733622,-2.30258509299405,-2.39789527279837,-2.48490664978800,-2.56494935746154,-2.63905732961526,-2.70805020110221,-2.77258872223978,-2.83321334405622),
mat4(-1.00000000000000,1.00000000000000,-1.00000000000000,1.00000000000000,-0.99999999999995,0.99999999999847,-0.99999999996425,0.99999999937104,-0.99999999142280,0.99999990708781,-0.99999918494666,0.99999411949279,-0.99996466193028,0.99982127062071,-0.99923254216349,0.99718148818347));
result += czeta_helper_2(z,
mat4(-2.89037175789616,-2.94443897916644,-2.99573227355399,-3.04452243772342,-3.09104245335832,-3.13549421592915,-3.17805383034795,-3.21887582486820,-3.25809653802148,-3.29583686600433,-3.33220451017520,-3.36729582998647,-3.40119738166216,-3.43398720448515,-3.46573590279973,-3.49650756146648),
mat4(-0.99109047939434,0.97562125072353,-0.94195422388664,0.87910910712444,-0.77852772396727,0.64073335549827,-0.47964042231228,0.31968999219853,-0.18572334624203,0.09196690020310,-0.03784892366350,0.01254701255408,-0.00320994916827,0.00059346134942,-0.00007044051625,0.00000402517236));


return result;`,
`vec2 exp_z = cexp(z);
return csub(cadd8(
vec2(-0.000000000001, 0.),
-1.098612288668 * exp_z + vec2(-0.000000049658, 0.),
-1.609437912434 * exp_z + vec2(-0.000030793306, 0.),
-1.945910149055 * exp_z + vec2(-0.002516654739, 0.),
-2.197224577336 * exp_z + vec2(-0.050509444705, 0.),
-2.397895272798 * exp_z + vec2(-0.367799673850, 0.),
-2.564949357462 * exp_z + vec2(-1.408124489866, 0.),
-2.708050201102 * exp_z + vec2(-3.826020429371, 0.)
), cadd8(
-0.693147180560 * exp_z + vec2(-0.000000000579, 0.),
-1.386294361120 * exp_z + vec2(-0.000001698718, 0.),
-1.791759469228 * exp_z + vec2(-0.000341188253, 0.),
-2.079441541680 * exp_z + vec2(-0.013102678429, 0.),
-2.302585092994 * exp_z + vec2(-0.151061198284, 0.),
-2.484906649788 * exp_z + vec2(-0.763635984596, 0.),
-2.639057329615 * exp_z + vec2(-2.385658846981, 0.),
-2.772588722240 * exp_z + vec2(-6.023245006707, 0.)
));`,
['ceta_strip', 'czeta_helper_2'], ['exp', 'sub', 'add8']);

// Riemann zeta function
const czeta = new ComplexFunction('czeta',
'return cdiv(ceta(z), ONE - cexp(LN2 * (ONE - z)));',
//'return ceta(z) - csub(LOG_ONE, cexp(csub(LOG_ONE, z) + vec2(log(LN2), 0)));',
'return czeta_strip(z);',
['div', 'eta', 'exp'], ['czeta_strip']);


/***** Special Functions *****/
// Erf
// Small z: https://math.stackexchange.com/questions/712434/erfaib-error-function-separate-into-real-and-imaginary-part
// Large z: Custom expansion with Fresnel integral (centered around y=x).
// See https://samuelj.li/blog/2021-05-05-erf-expansion
const rerf = new ComplexFunction('rerf',
`float k = 1.0 - exp(-z.x*z.x);
const float K = 1.1283791671;

const vec4 coeff = vec4(
    1.0/12.0,
    7.0/480.0,
    5.0/896.0,
    787.0/276480.0
);

float series = 1.0;
series -= dot(
    coeff,
    vec4(k, k*k, k*k*k, k*k*k*k)
);

return vec2(K * sqrt(k) * series, 0.0);
`
);
const cerf_large = new ComplexFunction('cerf_large',
`const float TWO_SQRTPI = 1.1283791671;
const vec2 W = 0.70710678118 * vec2(1.0, 1.0);
const vec2 W_BAR = W * vec2(1.0, -1.0);
vec2 rs = cmul(z, W_BAR);
float r = rs.x;
float s = rs.y;

vec2 CS = ONE - TWO_SQRTPI * (0.5/r) * cmul(W, cmul(
    vec2(cos(r*r), -sin(r*r)),
    vec2(0.5/(r*r), -1.0)
));

const vec4 re_coeff = vec4(2.0, -1.5, 13.125, -324.84375);
const vec4 im_coeff = vec4(1.0, -3.75, 59.0625, -2111.484375);
float r4 = r*r*r*r;
vec4 r_power = vec4(1.0, 1.0/r4, 1.0/(r4*r4), 1.0/(r4*r4*r4))/r;

vec2 I0 = vec2(dot(r_power, re_coeff), dot(r_power, im_coeff)/(r*r));
vec2 I1 = s/(r*r) * vec2(-2.0*s/r - 3.0/(r*r), 2.0 - 2.0*s*s/(r*r));
vec2 integral = cmul(
    cexp(s * vec2(2.0*r, s)),
    I1 + I0 
) - I0;
return CS + (TWO_SQRTPI/4.0) * cmul(W, cmul(vec2(sin(r*r), cos(r*r)), integral));
`, ['mul', 'exp'])
const cerf_small = new ComplexFunction('cerf_small',
`
float K = exp(-z.x*z.x)/PI;
float q = 4.0*z.x*z.x;
float a = cos(2.0*z.x*z.y);
float b = sin(2.0*z.x*z.y);

mat2 M = mat2(-z.x*a, z.x*b, 0.5*b, 0.5*a);

vec2 series = vec2(0.0, 0.0);
for (int i = 1; i < 32; i++) {
    float k = float(i);
    float kk = k*k/4.0 + z.x*z.x;
    float e1 = exp(k*z.y - kk);
    float e2 = exp(-k*z.y - kk);

    series += 1.0/(k*k + q) * (
        vec2(2.0*z.x * exp(-kk), 0.0)
        + M * vec2(e1+e2, k * (e1-e2))
    );
}
return rerf(z) + (K/(2.0 * z.x)) * vec2(1.0-a, b) + 2.0/PI*series;
`,
['rerf']
);
const cerf = new ComplexFunction('cerf',
`
vec2 result;

if (abs(z.y) > 8.0) {
    result = cerf_large(abs(z));
} else {
    result = cerf_small(abs(z));
}

if (z.y < 0.0) {result.y *= -1.0;}
if (z.x < 0.0) {result.x *= -1.0;}

return result;
`, ['cerf_small', 'cerf_large'])


/***** Elliptic Functions *****/
// Jacobi Theta functions
const ctheta00 = new ComplexFunction('ctheta00',
`vec2 result = vec2(1.0, 0.0);
vec2 A = 2.0 * z;
for (int i = 1; i < 6; i++) {
    float n = float(i);
    vec2 B = n * w;
    result += ccis(PI * n * (B + A));
    result += ccis(PI * n * (B - A));
}
return result;`, ['cis'], 2);
const ctheta01 = new ComplexFunction('ctheta01', 'return ctheta00(z + 0.5 * ONE, w);', ['theta00'], 2);
const ctheta10 = new ComplexFunction('ctheta10',
'return cmul(ccis(PI * (z + 0.25 * w)), ctheta00(z + 0.5 * w, w));',
['mul', 'cis', 'theta00'], 2);
const ctheta11 = new ComplexFunction('ctheta11',
'return cmul(ccis(0.25 * PI * (w + 4.0 * z + 2.0 * ONE)), ctheta00(z + 0.5 * (w + ONE), w));', ['mul', 'cis', 'theta00'], 2);

const theta000 = new ComplexFunction('theta000',
`vec2 result = vec2(1.0, 0.0);
for (int i = 1; i < 8; i++) {
    float n = float(i);
    result += 2.0 * ccis(PI * n * n * z);
}
return result;`, ['cis']); // theta00(0, z);

// Jacobi elliptic functions
const invert_tau = new ComplexFunction('invert_tau',
`
vec2 rt_k = csqrt(csqrt(ONE - csquare(z)));
vec2 ell = 0.5 * cdiv(ONE - rt_k, ONE + rt_k);
vec2 log_l = clog(ell);
vec2 q = ell + 2.0 * cexp(5.0 * log_l) + 15.0 * cexp(9.0 * log_l);
return -cmul_i(clog(q))/PI;`, ['sqrt', 'div', 'exp', 'mul_i', 'log']); // Computes tau from elliptic modulus k
const jacobi_reduce = new ComplexFunction('jacobi_reduce',
`vec2 t00 = theta000(w);
vec2 zz = cdiv(z, PI * csquare(t00));
float n = 2.0 * floor(0.5 * zz.y / w.y + 0.5);
return zz - n * w;`, ['theta000', 'div', 'square'], 2); // Given (z, tau), reduce z to fundamental period

const invert_code = `vec2 tau = invert_tau(w);
vec2 zz = jacobi_reduce(z, tau);`;
const raw_sn = new ComplexFunction('raw_sn',
`return -cdiv(
    cmul(theta000(w), ctheta11(z, w)),
    cmul(ctheta10(vec2(0, 0), w), ctheta01(z, w))
);`,
['div', 'mul', 'theta000', 'theta11', 'theta10', 'theta01'], 2);
const raw_cn = new ComplexFunction('raw_cn',
`return cdiv(
    cmul(ctheta01(vec2(0, 0), w), ctheta10(z, w)),
    cmul(ctheta10(vec2(0, 0), w), ctheta01(z, w))
);`,
['div', 'mul', 'theta01', 'theta10'], 2);
const raw_dn = new ComplexFunction('raw_dn',
`return cdiv(
    cmul(ctheta01(vec2(0, 0), w), ctheta00(z, w)),
    cmul(theta000(w), ctheta01(z, w))
);`,
['div', 'mul', 'theta01', 'theta00', 'theta000'], 2);
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
`float n = floor(z.y/w.y + 0.5);
vec2 zz = z - n * w;
vec2 t002 = csquare(theta000(w));
vec2 t102 = csquare(ctheta10(vec2(0,0), w));
vec2 e2 = -(PI*PI/3.0) * (csquare(t102) + csquare(t002));
return PI*PI*cmul(cmul(t002, t102), csquare(cdiv(ctheta01(zz, w), ctheta11(zz, w)))) + e2;` ,
['square', 'div', 'mul', 'theta000', 'theta10', 'theta01', 'theta11'], 2);
const raw_wpp = new ComplexFunction('raw_wpp',
`return -2.0 * cmul(
    cexp(3. * clog(cdiv(w, raw_sn(z, w1)))),
    cmul(raw_cn(z, w1), raw_dn(z, w1))
);`, [
    'mul', 'exp', 'log', 'div',
    'raw_sn', 'raw_cn', 'raw_dn',
], 3); // wp'(zz, A, tau), post-reduction
const cwpp = new ComplexFunction('cwpp',
`vec2 t004 = csquare(csquare(theta000(w)));
vec2 t104 = csquare(csquare(ctheta10(vec2(0, 0), w)));
vec2 t014 = csquare(csquare(ctheta01(vec2(0, 0), w)));

const float PI2_3 = PI*PI/3.0;
vec2 e1 = PI2_3 * (t004 + t014);
vec2 e2 = -PI2_3 * (t104 + t004);
vec2 e3 = PI2_3 * (t104 - t014);

vec2 A = csqrt(e1 - e3);
vec2 B = csqrt(e2 - e3);

vec2 u = cmul(z, A);
vec2 k = cdiv(B, A);
vec2 tau = invert_tau(k);
vec2 zz = jacobi_reduce(u, tau);

return raw_wpp(zz, A, tau);`, [
    'mul', 'div', 'sqrt', 'square', 
    'theta000', 'theta10', 'theta01',
    'invert_tau', 'jacobi_reduce',
    'raw_wpp',
], 2);

// Dixon ellptic functions
const csm = new ComplexFunction('csm', 'return ccm(1.7666387502854499*ONE-z);', ['cm']);
const ccm = new ComplexFunction('ccm', 
`const vec2 A = vec2(0.42644336004913946, 0.42644336004913946);
const vec2 tau = vec2(-0.5, 0.8660254037844386);
vec2 u = cmul(z, A);
vec2 zz = jacobi_reduce(u, tau);
return ONE + 2.0 * creciprocal(3.0 * raw_wpp(zz, A, tau) - ONE);`,
['reciprocal', 'jacobi_reduce', 'raw_wpp']);

/**** Higher-Order Functions ****/
var complex_functions = {
    mul_i,
    'reciprocal': creciprocal,
    'square': csquare,
    'component_mul': ccomponent_mul,

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
    'rawpow': new DummyFunction(),
    'sub': csub,
    'mul': cmul,
    'div': cdiv,
    'factorial': cfact,

    cgamma_left, cgamma_right,
    'gamma': cgamma,

    ceta_left, ceta_strip, ceta_right,
    zeta_character, czeta_strip, czeta_helper, czeta_helper_2,
    rerf, cerf_small, cerf_large,
    'eta': ceta,
    'zeta': czeta,
    'erf': cerf,

    invert_tau, jacobi_reduce, theta000,
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
    } else {
        required = new Set();
        for (let name of Object.keys(complex_functions)) {
            required.add(name);
        }
    }
    
    console.log('Functions loaded:', required);

    const functions = Array.from(required).map(name => complex_functions[name]);
    const declarations = functions.map(f => f.declaration);
    const definitions = functions.map(f => LOG_MODE ? f.log_code : f.code);

    const declarationString = declarations.join('\n');
    const definitionString = definitions.join('\n');
    return `${declarationString}\n\n${definitionString}`;
}

export {complex_functions, parseExpression, functionDefinitions};
