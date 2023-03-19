const math = require('mathjs');

const I = math.complex(0, 1);

const cadd = math.sum;
const csub = math.subtract;
const cdiv = math.divide;
const cmul = math.multiply;
const cmul_i = z => math.multiply(z, I);
const creciprocal = z => math.divide(1, z);
const csin = math.sin;
const cexp = math.exp;
const clog = math.log;
const csqrt = math.sqrt;
const cpow = math.pow;
const csquare = z => cmul(z, z);
const ccis = z => cexp(cmul_i(z));

const gamma_right = math.gamma;
const gamma_left = z => math.divide(math.pi, math.multiply(
    math.sin(math.multiply(z, math.pi)),
    gamma_right(math.subtract(1, z))
));
const gamma = z => z.re < 0.5 ? gamma_left(z) : gamma_right(z);

const beta = (z, w) => cdiv(cmul(gamma(z), gamma(w)), gamma(cadd(z, w)));
const binom = (z, w) => cdiv(z, cmul(cmul(w, csub(z, w)), beta(w, csub(z, w))));
const nome = z => cmul(cmul_i(clog(z)), 0.5/Math.PI);


const ETA_COEFFICIENTS = [
[ 1.00000000000000000000, 0.00000000000000000000],
[-1.00000000000000000000, 0.69314718055994528623],
[ 1.00000000000000000000, 1.09861228866810978211], 
[-1.00000000000000000000, 1.38629436111989057245], 
[ 0.99999999999999555911, 1.60943791243410028180], 
[-0.99999999999979938270, 1.79175946922805495731], 
[ 0.99999999999386091076, 1.94591014905531323187], 
[-0.99999999986491050485, 2.07944154167983574766], 
[ 0.99999999776946757457, 2.19722457733621956422], 
[-0.99999997147371189055, 2.30258509299404590109], 
[ 0.99999971045373836631, 2.39789527279837066942], 
[-0.99999762229395061652, 2.48490664978800035456], 
[ 0.99998395846577381452, 2.56494935746153673861], 
[-0.99990996358087780305, 2.63905732961525840707], 
[ 0.99957522481587246510, 2.70805020110221006391], 
[-0.99830090896564482872, 2.77258872223978114491], 
[ 0.99419535104495204703, 2.83321334405621616526], 
[-0.98295446518722640050, 2.89037175789616451738], 
[ 0.95672573151919981793, 2.94443897916644026225], 
[-0.90449212250748245445, 2.99573227355399085425], 
[ 0.81569498718756294764, 3.04452243772342301398], 
[-0.68698555062628596790, 3.09104245335831606667], 
[ 0.52834368695773525904, 3.13549421592914967505], 
[-0.36280435095576935023, 3.17805383034794575181], 
[ 0.21751716776255453079, 3.21887582486820056360], 
[-0.11124997091266028426, 3.25809653802148213586], 
[ 0.04729731398489586680, 3.29583686600432912428], 
[-0.01619245778522847637, 3.33220451017520380432], 
[ 0.00427566222821304867, 3.36729582998647414271], 
[-0.00081524972526846008, 3.40119738166215546116], 
[ 0.00009970680093076545, 3.43398720448514627179], 
[-0.00000586510593565794, 3.46573590279972654216], 
];

function eta_right(z) {
    return math.sum(...ETA_COEFFICIENTS.map(
        ([a, b]) => cmul(a, cexp(cmul(-b, z)))
    ));
}

function eta_left(w) {
    const z = w.neg();
    const zp1 = math.add(z, 1);

    if (z.im < 0) {return math.conj(eta_left(math.conj(w)));}


    let component_a = cmul(gamma(z), csin(cmul(z, math.pi/2)));
    if (z.im > 50) {
        const log_r = math.log(math.abs(z));
        const theta = math.arg(z);

        component_a = cmul(
            Math.sqrt(2 * Math.PI) / 2,
            I,
            cexp(cadd(
                cmul(theta - Math.PI/2, I, z),
                cmul(log_r - 1, z),
                cmul(-0.5, math.complex(log_r, theta))
            )
        ));
    }
    const component_b = cmul(z, eta_right(zp1));

    const multiplier_a = cexp(cmul(-math.log(math.pi), zp1));
    const multiplier_b = cdiv(
        csub(1, cexp(cmul(-Math.LN2, zp1))),
        csub(1, cexp(cmul(-Math.LN2, z)))
    );

    const component = cmul(component_a, component_b);
    const multiplier = cmul(multiplier_a, multiplier_b);

    return cmul(2, cmul(component, multiplier));
}

const eta = z => z.re < 0 ? eta_left(z) : eta_right(z);
const zeta = z => cdiv(eta(z), csub(1, cexp(cmul(Math.LN2, csub(1, z)))));

// Small z: https://math.stackexchange.com/questions/712434/erfaib-error-function-separate-into-real    -and-imaginary-part
// Large z: Expansion around infinity.
function erf_large(z) {
    const k = cmul_i(creciprocal(z));
    const k2 = csquare(k);
    const corrections = cdiv(
        cmul(k, cadd(1, cmul(k2, cadd(0.5, cmul(0.75, k2))))),
        math.sqrt(Math.PI)
    );
    return cadd(1, cmul_i(cmul(cexp(csquare(cmul_i(z))), corrections)));
}

function erf(z) {
    if (Math.abs(z.im) > 8.5) {
        return erf_large(z);
    }

    const K = math.exp(-z.re*z.re)/Math.PI;
    const q = 4*z.re*z.re;
    const a = math.cos(2*z.re*z.im);
    const b = math.sin(2*z.re*z.im);

    const series = [math.erf(z.re), cmul(K/(2*z.re), math.complex(1-a, b))];
    for (let k = 1; k < 65; k++) {
        const kk = k*k/4 + z.re*z.re;
        const e1 = math.exp(k*z.im - kk)/2;
        const e2 = math.exp(-k*z.im - kk)/2;
        const multiplier = 1/(k*k+q) * 2/Math.PI;
        const re = multiplier * (2*z.re*(math.exp(-kk)-a*(e1+e2)) + k*b*(e1-e2));
        const im = multiplier * (2*z.re*b*(e1+e2) + k*a*(e1-e2));
        series.push(math.complex(re, im));
    }

    return math.sum(series);
}

/***** Elliptic Functions *****/
function theta00(z, tau) {
    let result = 1;
    for (let n = 1; n < 8; n++) {
        const A = math.complex(0, Math.PI * n);
        const B = cmul(A, 2, z);
        const C = cmul(A, n, tau);
        result = cadd(
            result,
            cexp(cadd(C, B)),
            cexp(csub(C, B))
        );
    }
    return result;
}
const theta01 = (z, tau) => theta00(cadd(z, 0.5), tau);
const theta10 = (z, tau) => cmul(
    cexp(cmul(math.complex(0, Math.PI/4), cadd(tau, cmul(4, z)))),
    theta00(cadd(z, cmul(0.5, tau)), tau)
);
const theta11 = (z, tau) => cmul(
    cexp(cmul(math.complex(0, Math.PI/4), cadd(tau, cmul(4, z), 2))),
    theta00(cadd(z, cmul(0.5, tau), 0.5), tau)
);

function invert_tau(k) {
    const root_k = csqrt(csqrt(csub(1, cmul(k, k))));
    const l = cmul(0.5, cdiv(csub(1, root_k), cadd(1, root_k)));
    const q = cadd(
        l,
        cmul(2, cpow(l, 5)),
        cmul(15, cpow(l, 9)),
        cmul(150, cpow(l, 13))
    );
    return cmul(clog(q), math.complex(0, -1/Math.PI));
}

function jacobi_reduce(z, k) {
    const tau = invert_tau(k);
    const t00 = theta00(0, tau);
    const zz = cdiv(z, cmul(Math.PI, t00, t00));
    const n = 2 * Math.round(0.5 * zz.im/tau.im);
    return [csub(zz, cmul(n, tau)), tau];
}

function raw_sn(zz, tau) {
    return cdiv(cmul(
        -1, theta00(0, tau), theta11(zz, tau)
    ), cmul(
        theta10(0, tau), theta01(zz, tau)
    ));
}

function raw_cn(zz, tau) {
    return cdiv(cmul(
        theta01(0, tau), theta10(zz, tau)
    ), cmul(
        theta10(0, tau), theta01(zz, tau)
    ));
}

function raw_dn(zz, tau) {
    return cdiv(cmul(
        theta01(0, tau), theta00(zz, tau)
    ), cmul(
        theta00(0, tau), theta01(zz, tau)
    ));
}

const sn = (z, k) => raw_sn(...jacobi_reduce(z, k));
const cn = (z, k) => raw_cn(...jacobi_reduce(z, k));
const dn = (z, k) => raw_dn(...jacobi_reduce(z, k));


// Weierstrass p-function
function wp(z, tau) {
    const n = Math.round(z.im/tau.im);
    const zz = csub(z, cmul(n, tau));

    const t002 = csquare(theta00(0, tau));
    const t102 = csquare(theta10(0, tau));
    const e2 = cmul(-Math.PI*Math.PI/3, cadd(csquare(t102), csquare(t002)));
    return cadd(cmul(
        Math.PI*Math.PI,
        t002, t102,
        csquare(cdiv(theta01(zz, tau), theta11(zz, tau)))
    ), e2);
}

function raw_wpp(zz, A, tau) {
    return cmul(
        -2,
        cpow(cdiv(A, raw_sn(zz, tau)), 3),
        raw_cn(zz, tau), raw_dn(zz, tau)
    );
}

function wpp(z, tau) {
    const t004 = csquare(csquare(theta00(0, tau)));
    const t104 = csquare(csquare(theta10(0, tau)));
    const t014 = csquare(csquare(theta01(0, tau)));

    const PI2_3 = Math.PI * Math.PI / 3;
    const e1 = cmul(PI2_3, cadd(t004, t014));
    const e2 = cmul(-PI2_3, cadd(t104, t004));
    const e3 = cmul(PI2_3, csub(t104, t014));
    const A = csqrt(csub(e1, e3));
    const B = csqrt(csub(e2, e3));

    const u = cmul(z, A);
    const k = cdiv(B, A);
    const [zz, tau2] = jacobi_reduce(u, k);

    return raw_wpp(zz, A, tau2);
}


// Dixon elliptic functions
const e2v = math.complex(0.20998684165, 0);
const e1 = math.complex(-0.10499342083, 0.18185393933);
const e3 = math.complex(-0.10499342083, -0.18185393933);

const A = csqrt(csub(e1, e3));
const B = csqrt(csub(e2v, e3));
const k = cdiv(B, A);

function cm(z) {
    const u = cmul(z, A);
    const [zz, tau] = jacobi_reduce(u, k);
    return cadd(1, cdiv(2, csub(cmul(3, raw_wpp(zz, A, tau)), 1)));
}

function sm(z) {
    return cm(csub(1.7666387502854499, z));
}

function dot(z, w) {return z.re * w.re + z.im * w.im;}

function lattice_reduce(z) {
    if (z.im < 0) {return [math.complex(0, 1/0), 0];}
    const coeffs = [math.complex(1, 0), I];
    let a = z;
    let b = math.complex(1, 0);
    for (let i = 0; i < 16; i++) {
        let mu = Math.round(dot(a, b)/dot(b, b));
        a = csub(a, cmul(mu, b));
        coeffs[0] = csub(coeffs[0], cmul(mu, coeffs[1]));

        mu = Math.round(dot(a, b)/dot(a, a));
        b = csub(b, cmul(mu, a));
        coeffs[1] = csub(coeffs[1], cmul(mu, coeffs[0]));
    }
    const num = cadd(cmul(coeffs[0].re, z), coeffs[0].im);
    const denom = cadd(cmul(coeffs[1].re, z), coeffs[1].im);
    const res = cdiv(num, denom);
    if (math.abs(res) < 1) {return [cdiv(-1, res), num];}
    return [res, denom];
}

function j(z) {
    z = lattice_reduce(z)[0];
    const a = theta10(0, z);
    const b = theta00(0, z);
    const c = theta01(0, z);

    return cmul(32, cdiv(
        cpow(cadd(cadd(cpow(a, 8), cpow(b, 8)), cpow(c, 8)), 3),
        cpow(cmul(a, cmul(b, c)), 8)
    ));
}

function e_term(q, n, p) {
    const qn = math.pow(q, n);
    return cmul(math.pow(n, p), cdiv(qn, csub(1, qn)));
}

function eisenstein(z, coeff, pow) {
    let [zz, weight] = lattice_reduce(z);
    const q = ccis(cmul(2*Math.PI, zz));
    let series = 0;
    for (let n = 1; n < 8; n++) {series = cadd(series, e_term(q, n, pow));}
    return cmul(cadd(1, cmul(coeff, series)), cpow(weight, -2*pow));
}

function e2(z) {return eisenstein(z, -24, 1);}
function e4(z) {return eisenstein(z, 240, 3);}
function e6(z) {return eisenstein(z, -504, 5);}
function e8(z) {return csquare(e4(z));}
function e10(z) {return cmul(e4(z), e6(z));}
function e12(z) {return cadd(cmul(441/691, cpow(e4(z), 3)), cmul(250/691, csquare(e6(z))));}
function e14(z) {return cmul(e8(z), e6(z));}
function e16(z) {
    const a = e4(z); const b = e6(z);
    return cadd(cmul(1617/3617, csquare(csquare(a))), cmul(2000/3617, cmul(a, csquare(b))));
}

export {
    zeta, eta, gamma, beta, binom, erf,
    nome,
    theta00, theta01, theta10, theta11,
    sn, cn, dn,
    wp, wpp,
    sm, cm,
    j, e2, e4, e6, e8, e10, e12, e14, e16
};
