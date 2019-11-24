import {isNil} from 'lodash';

function formatComplex(x, y, precision) {
    if (x !== 0) {
        if (y !== 0) {
            return formatReal(x, false, precision) + formatReal(y, true, precision) + '\\, i';
        } else {
            return formatReal(x, false, precision);
        }
    } else if (y !== 0) {
        return formatReal(y, false, precision) + '\\, i';
    } else {
        return '0';
    }
}

const CONSTANTS = {
    '\\pi': Math.PI,
    '\\sqrt{2}': Math.sqrt(2),
    'e': Math.E,
}

function almostInteger(x) {
    return Math.abs(x - Math.round(x)) < 1e-10;
}

// Checks if the value is close to a nice multiple of known constants.
function checkKnown(x) {
    for (let [name, value] of Object.entries(CONSTANTS)) {
        for (let denominator of [1, 2, 3, 6, 12]) {
            const ratio = denominator * x / value;

            // Check if ratio is almost integer
            if (ratio > 0.5 && almostInteger(ratio)) {
                console.log(ratio);
                const formatInteger = x => x === 1 ? '' : x.toString()
                const numerator = formatInteger(Math.round(ratio)) + ' ' + name;

                if (denominator === 1) {
                    return numerator;
                } else {
                    return '\\frac{' + numerator + '}{' + denominator + '}';
                }
            }
        }
    }

    return null;
}

function formatReal(x, forceSign, precision) {
    const magnitude = Math.abs(x);
    const sign = x < 0 ? '-' : (
        forceSign ? '+' : ''
    );

    if (precision > 3) {
        // Try to see if value is a multiple of known constant
        const prettyMagnitude = checkKnown(magnitude);
        if (!isNil(prettyMagnitude)) {return sign + prettyMagnitude;}
    }

    let exponent = magnitude > 0 ? Math.floor(Math.log10(magnitude)) : 0;
    if (Math.abs(exponent) < 3) {exponent = 0;}

    const mantissa = magnitude * Math.pow(10, -exponent);

    const formattedMagnitude = mantissa.toFixed(precision);
    const formattedExponent = exponent === 0 ? '' : `\\times 10^{${exponent}}`;

    return sign + formattedMagnitude + formattedExponent;
}

export {formatComplex};
