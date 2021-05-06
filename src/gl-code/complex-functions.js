import nearley from 'nearley';
import grammar from './grammar.js';

const compiledGrammar = nearley.Grammar.fromCompiled(grammar);

const argument_names = ['z', 'w', 'w1', 'w2'];

class ComplexFunction {
    constructor(name, body, dependencies, num_args) {
        if (num_args === undefined) {num_args = 1;}

        this.name = name;
        this.body = body;
        this.dependencies = dependencies || [];
        this.num_args = num_args;
    }

    apply(...parameters) {
        return `${this.name}(${parameters.join(', ')})`;
    }

    get declaration() {
        let types = Array(this.num_args);
        types.fill('vec2');
        return `vec2 ${this.name}(${types.join(', ')});`
    }

    get code() {
        let parameters = [];
        for (let i = 0; i < this.num_args; i++) {
            parameters.push(`vec2 ${argument_names[i]}`);
        }
        return `vec2 ${this.name}(${parameters.join(', ')}) {${this.body}}`;
    }
}


// DEFINITIONS //

// Miscellaneous
const mul_i = new ComplexFunction('mul_i', 'return vec2(-z.y, z.x);');
const reciprocal = new ComplexFunction('reciprocal', 'return cconj(z) / dot(z, z);', ['conj']);
const cconj = new ComplexFunction('cconj', 'return z * vec2(1.0, -1.0);');
const cabs = new ComplexFunction('cabs', 'return vec2(length(z), 0);');
const carg = new ComplexFunction('carg', 'return vec2(atan(z.y, z.x), 0);');
const csgn = new ComplexFunction('csgn', 'return z/length(z);');
const creal = new ComplexFunction('creal', 'return vec2(z.x, 0);');
const cimag = new ComplexFunction('cimag', 'return vec2(z.y, 0);');
const cfloor = new ComplexFunction('cfloor', 'return floor(z);');
const cceil = new ComplexFunction('cceil', 'return ceil(z);');
const cround = new ComplexFunction('cround', 'return floor(z + vec2(0.5, 0.5));');
const cstep = new ComplexFunction('cstep', 'return vec2(step(0.0, z.x), 0.0);');

// Exponentials
const ccis = new ComplexFunction('ccis',
    'return cexp(mul_i(z));',
    ['exp', 'mul_i']);
const cexp = new ComplexFunction('cexp',
`float magnitude = exp(z.x);
float phase = z.y;
return magnitude * vec2(cos(phase), sin(phase));`);
const clog = new ComplexFunction('clog',
`float magnitude = log(length(z));
float phase = atan(z.y, z.x);
return vec2(magnitude, phase);`);
const csqrt = new ComplexFunction('csqrt',
`float magnitude = length(z);
float phase = 0.5 * atan(z.y, z.x);
return sqrt(magnitude) * vec2(cos(phase), sin(phase));`);
const csquare = new ComplexFunction('csquare',
`float magnitude = length(z);
float phase = atan(z.y, z.x) * 2.0;
return (magnitude * magnitude) * vec2(cos(phase), sin(phase));`);

// Trigonometry //
// Basic Trigonometric Functions
const csin = new ComplexFunction('csin',
`vec2 iz = mul_i(z);
return -0.5 * mul_i(cexp(iz) - cexp(-iz));`, ['mul_i', 'exp']);
const ccos = new ComplexFunction('ccos',
`vec2 iz = mul_i(z);
return 0.5 * (cexp(iz) + cexp(-iz));`, ['mul_i', 'exp']);
const ctan = new ComplexFunction('ctan', 'return mul_i(ctanh(-mul_i(z)));', ['mul_i', 'tanh']);
const csec = new ComplexFunction('csec', 'return reciprocal(ccos(z));',
    ['reciprocal', 'cos']);
const ccsc = new ComplexFunction('ccsc', 'return reciprocal(csin(z));',
    ['reciprocal', 'sin']);
const ccot = new ComplexFunction('ccot', 'return reciprocal(ctan(z));',
    ['reciprocal', 'tan']);

// Inverse Trigonomeric Functions
const carcsin_bottom = new ComplexFunction('carcsin_bottom',
    'return -mul_i(clog(mul_i(z) + csqrt(ONE - csquare(z))));',
     ['mul_i', 'log', 'sqrt', 'square']);
const carcsin_top = new ComplexFunction('carcsin_top',
    'return -mul_i(clog(reciprocal(csqrt(ONE - csquare(z)) - mul_i(z))));',
    ['mul_i', 'log', 'reciprocal', 'square']);
const carcsin = new ComplexFunction('carcsin',
    'if (z.y < 0.0) {return carcsin_bottom(z);} else {return carcsin_top(z);}',
    ['carcsin_bottom', 'carcsin_top']);


const carccos = new ComplexFunction('carccos',
`vec2 b = csqrt(csquare(z) - ONE);
vec2 a = z + b;
if (z.x < 0.0) {a = z - b;}
return -mul_i(clog(a));`,
['mul_i', 'log', 'sqrt', 'square']);
const carctan = new ComplexFunction('carctan',
`vec2 iz = mul_i(z);
return 0.5 * mul_i(clog(ONE - iz) - clog(ONE + iz));`,
['mul_i', 'log']);

const carccot = new ComplexFunction('carccot', 'return carctan(reciprocal(z));', ['arctan', 'reciprocal']);
const carcsec = new ComplexFunction('carcsec', 'return carccos(reciprocal(z));', ['arccos', 'reciprocal']);
const carccsc = new ComplexFunction('carccsc', 'return carcsin(reciprocal(z));', ['arcsin', 'reciprocal']);


// Hyperbolic Trigonometric Functions
const csinh = new ComplexFunction('csinh',
    'return 0.5 * (cexp(z) - cexp(-z));', ['exp']);
const ccosh = new ComplexFunction('ccosh',
    'return 0.5 * (cexp(z) + cexp(-z));', ['exp']);
const ctanh = new ComplexFunction('ctanh',
`vec2 a = cexp(2.0*z);
vec2 b = cexp(-2.0*z);
if (z.x > 0.0) {
return cdiv(ONE - b, ONE + b);
} else {
return cdiv(a - ONE, a + ONE);
}`, ['exp', 'div']);
const csech = new ComplexFunction('csech',
    'return reciprocal(ccosh(z));', ['reciprocal', 'cosh']);
const ccsch = new ComplexFunction('ccsch',
    'return reciprocal(csinh(z));', ['reciprocal', 'sinh']);
const ccoth = new ComplexFunction('ccoth', 'return reciprocal(ctanh(z));', ['reciprocal', 'tanh']);

// Inverse hyperbolic trigonometric functions
const carsinh = new ComplexFunction('carsinh',
'return -mul_i(carcsin(mul_i(z)));', ['mul_i', 'arcsin']);
const carcosh = new ComplexFunction('carcosh',
    'return -mul_i(carccos(z));', ['mul_i', 'arccos']);
const cartanh = new ComplexFunction('cartanh',
    'return -mul_i(carctan(mul_i(z)));', ['mul_i', 'arctan']);
const carsech = new ComplexFunction('carsech',
    'return -mul_i(carcsec(z));', ['mul_i', 'arcsec']);
const carcsch = new ComplexFunction('carcsch',
    'return -mul_i(carccsc(-mul_i(z)));', ['mul_i', 'arccsc']);
const carcoth = new ComplexFunction('carcoth',
    'return -mul_i(carccot(-mul_i(z)));', ['mul_i', 'arccot']);


// Infix Operators //
const cneg = new ComplexFunction('cneg', 'return -z;');
const cadd = new ComplexFunction('cadd', 'return z+w;', [], 2);
const csub = new ComplexFunction('csub', 'return z-w;', [], 2);
const cmul = new ComplexFunction('cmul',
    'return mat2(z, -z.y, z.x) * w;', [], 2);
const cdiv = new ComplexFunction('cdiv',
'return cmul(z, reciprocal(w));', ['mul', 'reciprocal'], 2);
const cpow = new ComplexFunction('cpow', 'return cexp(cmul(clog(z), w));',
    ['exp', 'mul', 'log'], 2);

// Lanczos approximation
const cgamma = new ComplexFunction('cgamma',
    'if (z.x < 0.5) {return cgamma_left(z);} else {return cgamma_right(z);}',
    ['cgamma_left', 'cgamma_right']);
const cgamma_left = new ComplexFunction('cgamma_left',
    'return PI * reciprocal(cmul(csin(PI*z), cgamma_right(ONE-z)));',
    ['mul', 'sin', 'cgamma_right']);
const cgamma_right = new ComplexFunction('cgamma_right',
`vec2 w = z - ONE;
vec2 t = w + vec2(7.5, 0);
vec2 x = vec2(0.99999999999980993, 0);
x += 676.5203681218851 * reciprocal(w + vec2(1, 0));
x -= 1259.1392167224028 * reciprocal(w + vec2(2, 0));
x += 771.32342877765313 * reciprocal(w + vec2(3, 0));
x -= 176.61502916214059 * reciprocal(w + vec2(4, 0));
x += 12.507343278686905 * reciprocal(w + vec2(5, 0));
x -= .13857109526572012 * reciprocal(w + vec2(6, 0));
x += 9.9843695780195716e-6 * reciprocal(w + vec2(7, 0));
x += 1.5056327351493116e-7 * reciprocal(w + vec2(8, 0));
return sqrt(TAU) * cmul(cpow(t, w + vec2(0.5, 0)), cmul(cexp(-t), x));`,
['reciprocal', 'mul', 'pow', 'exp']);
const cfact = new ComplexFunction('cfact', 'return cgamma(z + ONE);', ['gamma']);

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
return result * conjugate_mask;`, ['conj', 'ceta_left', 'ceta_right']);
const ceta_left = new ComplexFunction('ceta_left',
`z.x *= -1.0;
vec2 component_a;
const float SQ2PI2 = 1.2533141373155001;
float log_r = log(length(z));
if (z.y > 200.0) {
    component_a = SQ2PI2 * mul_i(cexp(
        vec2(z.x, 0)
        + (log_r - 1.0) * z
        - vec2(log_r/2.0, PI/4.0)
    ));
} else if (z.y > 20.0) {
    float theta = atan(z.y, z.x);
    component_a = SQ2PI2 * mul_i(cexp(
        (theta - PI/2.0) * mul_i(z)
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
vec2 multiplier = cexp(
    cmul(z, A + clog(ONE - 2.0 * z))
    + 0.5 * (B - clog(z))
);

return cmul(
    cexp((0.5 * LNPI) * (ONE - 2.0 * z)),
    multiplier
);`,
['exp', 'mul', 'log']);

// Riemann-Siegel Formula
const ceta_strip = new ComplexFunction('ceta_strip',
`const int N = 64;

vec2 zetaA = vec2(0.0, 0.0); // Estimate zeta(z)
vec2 zetaB = vec2(0.0, 0.0); // Estimate of zeta(1-z)

for (int i=1; i <= N; i++) {
    float n = float(i);
    float base = log(n);
    vec2 term = cexp(-base * z);
    zetaA += term;
    zetaB += reciprocal(n * term);
}

// Convert to an estimate of zeta(z) via the functional equation
zetaB = cmul(zetaB, cconj(zeta_character(ONE - cconj(z))));

// Interpolate between the two estimates of zeta(z)
float t = 1.0 - min(z.x, 1.0);
float alpha = t*t * (3.0 - 2.0*t); // Hermite interpolation (smoothstep)
vec2 zeta_val = mix(zetaA, zetaB, alpha);

// Convert to eta(z) via functional equation
return cmul(ONE - cexp(LN2 * (ONE - z)), zeta_val);`,
['exp', 'reciprocal', 'mul', 'conj', 'zeta_character']);

const ceta_right = new ComplexFunction('ceta_right',
`if (z.x < 3.0 && z.y > 50.0) {return ceta_strip(z);}
vec2 result = vec2(1.000000000000000, 0.0);
result -= 1.00000000000000000000 * cexp(-0.69314718055994528623 * z);
result += 1.00000000000000000000 * cexp(-1.09861228866810978211 * z);
result -= 1.00000000000000000000 * cexp(-1.38629436111989057245 * z);
result += 0.99999999999999555911 * cexp(-1.60943791243410028180 * z);
result -= 0.99999999999979938270 * cexp(-1.79175946922805495731 * z);
result += 0.99999999999386091076 * cexp(-1.94591014905531323187 * z);
result -= 0.99999999986491050485 * cexp(-2.07944154167983574766 * z);
result += 0.99999999776946757457 * cexp(-2.19722457733621956422 * z);
result -= 0.99999997147371189055 * cexp(-2.30258509299404590109 * z);
result += 0.99999971045373836631 * cexp(-2.39789527279837066942 * z);
result -= 0.99999762229395061652 * cexp(-2.48490664978800035456 * z);
result += 0.99998395846577381452 * cexp(-2.56494935746153673861 * z);
result -= 0.99990996358087780305 * cexp(-2.63905732961525840707 * z);
result += 0.99957522481587246510 * cexp(-2.70805020110221006391 * z);
result -= 0.99830090896564482872 * cexp(-2.77258872223978114491 * z);
result += 0.99419535104495204703 * cexp(-2.83321334405621616526 * z);
result -= 0.98295446518722640050 * cexp(-2.89037175789616451738 * z);
result += 0.95672573151919981793 * cexp(-2.94443897916644026225 * z);
result -= 0.90449212250748245445 * cexp(-2.99573227355399085425 * z);
result += 0.81569498718756294764 * cexp(-3.04452243772342301398 * z);
result -= 0.68698555062628596790 * cexp(-3.09104245335831606667 * z);
result += 0.52834368695773525904 * cexp(-3.13549421592914967505 * z);
result -= 0.36280435095576935023 * cexp(-3.17805383034794575181 * z);
result += 0.21751716776255453079 * cexp(-3.21887582486820056360 * z);
result -= 0.11124997091266028426 * cexp(-3.25809653802148213586 * z);
result += 0.04729731398489586680 * cexp(-3.29583686600432912428 * z);
result -= 0.01619245778522847637 * cexp(-3.33220451017520380432 * z);
result += 0.00427566222821304867 * cexp(-3.36729582998647414271 * z);
result -= 0.00081524972526846008 * cexp(-3.40119738166215546116 * z);
result += 0.00009970680093076545 * cexp(-3.43398720448514627179 * z);
result -= 0.00000586510593565794 * cexp(-3.46573590279972654216 * z);
return result;`,
['ceta_strip', 'exp']);

// Riemann zeta function
const czeta = new ComplexFunction('czeta',
'return cdiv(ceta(z), ONE - cexp(LN2 * (ONE - z)));', ['div', 'eta', 'exp']);


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
return -mul_i(clog(q))/PI;`, ['sqrt', 'div', 'exp', 'mul_i', 'log']); // Computes tau from elliptic modulus k
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
    cpow(cdiv(w, raw_sn(z, w1)), 3.0*ONE),
    cmul(raw_cn(z, w1), raw_dn(z, w1))
);`, [
    'mul', 'pow', 'div',
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
return ONE + 2.0 * reciprocal(3.0 * raw_wpp(zz, A, tau) - ONE);`,
['reciprocal', 'jacobi_reduce', 'raw_wpp']);

var complex_functions = {
    mul_i, reciprocal,
    'square': csquare,

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

    carcsin_top,
    carcsin_bottom,

    'arcsin': carcsin,  'arccos': carccos,  'arctan': carctan,
    'arcsec': carcsec,  'arccsc': carccsc,  'arccot': carccot,
    'sinh': csinh, 'cosh': ccosh, 'tanh': ctanh,
    'sech': csech, 'csch': ccsch, 'coth': ccoth,
    'arsinh': carsinh, 'arcosh': carcosh, 'artanh': cartanh,
    'arsech': carsech, 'arcsch': carcsch, 'arcoth': carcoth,
    'neg': cneg,
    'add': cadd,
    'sub': csub,
    'mul': cmul,
    'div': cdiv,
    'factorial': cfact,

    cgamma_left, cgamma_right,
    'gamma': cgamma,

    ceta_left, ceta_strip, ceta_right,
    zeta_character,
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
        return result || null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function getRequirements(ast) {
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
function functionDefinitions(ast) {
    let required = null;

    if (Array.isArray(ast)) {
        // Extract functions used
        required = getRequirements(ast);

        // Resolve dependencies
        const stack = Array.from(required);
        while (stack.length > 0) {
            const f = stack.pop();
            for (let dep of complex_functions[f].dependencies) {
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
    const definitions = functions.map(f => f.code);

    const declarationString = declarations.join('\n');
    const definitionString = definitions.join('\n');
    return `${declarationString}\n\n${definitionString}`;
}

export {complex_functions, parseExpression, functionDefinitions};
