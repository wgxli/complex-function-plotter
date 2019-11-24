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

function formatReal(x, forceSign, precision) {
    const magnitude = Math.abs(x);

    let exponent = magnitude > 0 ? Math.floor(Math.log10(magnitude)) : 0;
    if (Math.abs(exponent) < 3) {exponent = 0;}

    const mantissa = magnitude * Math.pow(10, -exponent);

    const formattedMagnitude = mantissa.toFixed(precision);
    const formattedExponent = exponent === 0 ? '' : `\\times 10^{${exponent}}`;

    const sign = x < 0 ? '-' : (
        forceSign ? '+' : ''
    );

    return sign + formattedMagnitude + formattedExponent;
}

export {formatComplex};
