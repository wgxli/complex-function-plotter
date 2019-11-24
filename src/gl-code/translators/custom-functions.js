const math = require('mathjs');

const cadd = math.sum;
const csub = math.subtract;
const cdiv = math.divide;
const cmul = math.multiply;
const csin = math.sin;
const cexp = math.exp;

const gamma_right = math.gamma;
const gamma_left = z => math.divide(math.pi, math.multiply(
    math.sin(math.multiply(z, math.pi)),
    gamma_right(math.subtract(1, z))
));
const gamma = z => z.re < 0.5 ? gamma_left(z) : gamma_right(z);


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

        const I = math.complex(0, 1);

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

export {zeta, eta, gamma};
