function formatComplex(x, y) {
    if (x !== 0) {
        if (y !== 0) {
            return formatReal(x, false) + formatReal(y, true) + '\\, i';
        } else {
            return formatReal(x, false);
        }
    } else if (y !== 0) {
        return formatReal(y, false) + '\\, i';
    } else {
        return '0';
    }
}

function formatReal(x, forceSign) {
    const magnitude = Math.abs(x);

    let exponent = magnitude > 0 ? Math.floor(Math.log10(magnitude)) : 0;
    if (Math.abs(exponent) < 3) {exponent = 0;}

    const mantissa = magnitude * Math.pow(10, -exponent);

    const formattedMagnitude = mantissa.toFixed(3);
    const formattedExponent = exponent === 0 ? '' : `\\times 10^{${exponent}}`;

    const sign = x < 0 ? '-' : (
        forceSign ? '+' : ''
    );

    return sign + formattedMagnitude + formattedExponent;
}

export {formatComplex};
