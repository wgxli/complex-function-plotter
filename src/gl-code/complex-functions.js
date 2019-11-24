import nearley from 'nearley';
import grammar from './grammar.js';

const compiledGrammar = nearley.Grammar.fromCompiled(grammar);

const argument_names = ['z', 'w'];

class ComplexFunction {
	constructor(name, body, num_args) {
		if (num_args === undefined) {num_args = 1}

		this.name = name;
		this.body = body;
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
		return `vec2 ${this.name}(${parameters.join(', ')}) {
			${this.body}
		}`
	}
}


// DEFINITIONS //

// Miscellaneous
const mul_i = new ComplexFunction('mul_i', 'return vec2(-z.y, z.x);');
const reciprocal = new ComplexFunction('reciprocal', `
	float magnitude = length(z);
	return cconj(z) / (magnitude * magnitude);`);
const cconj = new ComplexFunction('cconj', 'return vec2(z.x, -z.y);');
const cabs = new ComplexFunction('cabs', 'return vec2(length(z), 0);');
const carg = new ComplexFunction('carg', 'return vec2(atan(z.y, z.x), 0);');
const creal = new ComplexFunction('creal', 'return vec2(z.x, 0);');
const cimag = new ComplexFunction('cimag', 'return vec2(z.y, 0);');

// Exponentials
const ccis = new ComplexFunction('ccis', 'return cexp(mul_i(z));');
const cexp = new ComplexFunction('cexp', `
	float magnitude = exp(z.x);
	float phase = z.y;
	return vec2(magnitude*cos(phase), magnitude*sin(phase));
	`);
const clog = new ComplexFunction('clog', `
	float magnitude = log(length(z));
	float phase = atan(z.y, z.x);
	return vec2(magnitude, phase);
	`);
const csqrt = new ComplexFunction('csqrt', `
	float magnitude = length(z);
	float phase = atan(z.y, z.x) / 2.0;
	return sqrt(magnitude) * vec2(cos(phase), sin(phase));
	`);
const csquare = new ComplexFunction('csquare', `
	float magnitude = length(z);
	float phase = atan(z.y, z.x) * 2.0;
	return (magnitude * magnitude) * vec2(cos(phase), sin(phase));
	`);

// Trigonometry //
// Basic Trigonometric Functions
const csin = new ComplexFunction('csin', `
	vec2 iz = mul_i(z);
	return -0.5 * mul_i(cexp(iz) - cexp(-iz));
	`);
const ccos = new ComplexFunction('ccos', `
	vec2 iz = mul_i(z);
	return 0.5 * (cexp(iz) + cexp(-iz));
	`);
const ctan = new ComplexFunction('ctan', 'return cdiv(csin(z), ccos(z));');
const csec = new ComplexFunction('csec', 'return reciprocal(ccos(z));');
const ccsc = new ComplexFunction('ccsc', 'return reciprocal(csin(z));');
const ccot = new ComplexFunction('ccot', 'return cdiv(ccos(z), csin(z));');

// Inverse Trigonomeric Functions
const carcsin_bottom = new ComplexFunction('carcsin_bottom',
	'return -mul_i(clog(mul_i(z) + csqrt(ONE - csquare(z))));');
const carcsin_top = new ComplexFunction('carcsin_top',
	'return -mul_i(clog(reciprocal(csqrt(ONE - csquare(z)) - mul_i(z))));');
const carcsin = new ComplexFunction('carcsin',
	'if (z.y < 0.0) {return carcsin_bottom(z);} else {return carcsin_top(z);}');

const carccos = new ComplexFunction('carccos',
	'return -mul_i(clog(z + csqrt(csquare(z) - ONE)));');
const carctan = new ComplexFunction('carctan',`
	vec2 iz = mul_i(z);
	return 0.5 * mul_i(clog(ONE - iz) - clog(ONE + iz));
	`);

const carccot = new ComplexFunction('carccot', 'return carctan(reciprocal(z));');
const carcsec = new ComplexFunction('carcsec', 'return carccos(reciprocal(z));');
const carccsc = new ComplexFunction('carccsc', 'return carcsin(reciprocal(z));');


// Hyperbolic Trigonometric Functions
const csinh = new ComplexFunction('csinh',
	'return 0.5 * (cexp(z) - cexp(-z));');
const ccosh = new ComplexFunction('ccosh',
	'return 0.5 * (cexp(z) + cexp(-z));');
const ctanh = new ComplexFunction('ctanh', `
	vec2 a = cexp(z);
	vec2 b = cexp(-z);
	return cdiv(a - b, a + b);
	`);
const csech = new ComplexFunction('csech',
	'return reciprocal(ccosh(z));');
const ccsch = new ComplexFunction('ccsch',
	'return reciprocal(csinh(z));');
const ccoth = new ComplexFunction('ccoth', `
	vec2 a = cexp(z);
	vec2 b = cexp(-z);
	return cdiv(a + b, a - b);
	`);

// Inverse hyperbolic trigonometric functions
const carsinh = new ComplexFunction('carsinh',
	'return clog(z + csqrt(csquare(z) + ONE));');
const carcosh = new ComplexFunction('carcosh',
	'return clog(z + csqrt(csquare(z) - ONE));');
const cartanh = new ComplexFunction('cartanh',
	'return 0.5 * clog(cdiv(ONE + z, ONE - z));');
const carsech = new ComplexFunction('carsech',
	'return clog(cdiv(ONE + csqrt(ONE - csquare(z)), z));');
const carcsch = new ComplexFunction('carcsch',
	'return clog(cdiv(ONE + csqrt(ONE + csquare(z)), z));');
const carcoth = new ComplexFunction('carcoth',
	'return 0.5 * clog(cdiv(z + ONE, z - ONE));');


// Infix Operators //
const cneg = new ComplexFunction('cneg', 'return -z;');
const cadd = new ComplexFunction('cadd', 'return z+w;', 2);
const csub = new ComplexFunction('csub', 'return z-w;', 2);
const cmul = new ComplexFunction('cmul', `
	return vec2(z.x*w.x-z.y*w.y, z.x*w.y+z.y*w.x);
	`, 2);
const cdiv = new ComplexFunction('cdiv', `
	float magnitude = length(w);
	return cmul(z, cconj(w)) / (magnitude*magnitude);
	`, 2);
const cpow = new ComplexFunction('cpow', 'return cexp(cmul(clog(z), w));', 2);

// Lanczos approximation
const cgamma = new ComplexFunction('cgamma',
	'if (z.x < 0.5) {return cgamma_left(z);} else {return cgamma_right(z);}');
const cgamma_left = new ComplexFunction('cgamma_left',
	'return PI * reciprocal(cmul(csin(PI*z), cgamma_right(ONE-z)));');
const cgamma_right = new ComplexFunction('cgamma_right', `
	vec2 w = z - ONE;
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
	return sqrt(TAU) * cmul(cpow(t, w + vec2(0.5, 0)), cmul(cexp(-t), x));
	`);
const cfact = new ComplexFunction('cfact', 'return cgamma(z + ONE);');

// Dirichlet eta function
const ceta = new ComplexFunction('ceta', `
    vec2 conjugate_mask = vec2(1.0, 1.0);

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

    return result * conjugate_mask;
`);
const ceta_left = new ComplexFunction('ceta_left', `
	z.x *= -1.0;

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

	return 2.0 * cconj(cmul(component, multiplier));
`);

// Charater chi in zeta(z) = chi(1-z) zeta(1-z)
const zeta_character = new ComplexFunction('zeta_character', `
    const vec2 A = vec2(-1.0 - 2.0*LN2, PI/2.0); // -1 + ln(i/4)
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
    );
`);

// Riemann-Siegel Formula
const ceta_strip = new ComplexFunction('ceta_strip', `
    const int N = 50;

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
    return cmul(ONE - cexp(LN2 * (ONE - z)), zeta_val);
`);

const ceta_right = new ComplexFunction('ceta_right', `
    if (z.x < 3.0 && z.y > 50.0) {return ceta_strip(z);}
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
    return result;
`);

// Riemann zeta function
const czeta = new ComplexFunction('czeta',
	'return cdiv(ceta(z), ONE - cexp(LN2 * (ONE - z)));');


var complex_functions = {
    'mul_i': mul_i,
    'reciprocal': reciprocal,
    'square': csquare,

    'real': creal,
    're': creal,
    'imag': cimag,
    'im': cimag,

    'conj': cconj,
    'abs': cabs,
    'arg': carg,
    'cis': ccis,

    'exp': cexp,
    'log': clog,
    'ln': clog,

    'sqrt': csqrt,
    '^': cpow,
    'sin': csin,  'cos': ccos,  'tan': ctan,
    'sec': csec,  'csc': ccsc,  'cot': ccot,

    'carcsin_top': carcsin_top,
    'carcsin_bottom': carcsin_bottom,

    'arcsin': carcsin,  'arccos': carccos,  'arctan': carctan,
    'arcsec': carcsec,  'arccsc': carccsc,  'arccot': carccot,
    'sinh': csinh, 'cosh': ccosh, 'tanh': ctanh,
    'sech': csech, 'csch': ccsch, 'coth': ccoth,
    'arsinh': carsinh, 'arcosh': carcosh, 'artanh': cartanh,
    'arsech': carsech, 'arcsch': carcsch, 'arcoth': carcoth,
    '$': cneg,
    '+': cadd,
    '-': csub,
    '*': cmul,
    '/': cdiv,
    '!': cfact,

    'cgamma_left': cgamma_left,
    'cgamma_right': cgamma_right,
    'gamma': cgamma,

    'ceta_left': ceta_left,
    'ceta_strip': ceta_strip,
    'ceta_right': ceta_right,
    'eta': ceta,

    'zeta_character': zeta_character,
    'zeta': czeta
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

const declarations = new Set(Object.values(complex_functions).map(f => f.declaration))
const definitions = new Set(Object.values(complex_functions).map(f => f.code))

const declarationString = Array.from(declarations).join('\n');
const definitionString = Array.from(definitions).join('\n');

const functionDefinitions = `${declarationString}\n\n${definitionString}`;

export {complex_functions, parseExpression, functionDefinitions};
