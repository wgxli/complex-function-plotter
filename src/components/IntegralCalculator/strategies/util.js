// 16-point Gaussian quadrature
const GAUSS_COEFFICIENTS = [
    [0.1894506104550685,  0.0950125098376374],
    [0.1826034150449236,  0.2816035507792589],
    [0.1691565193950025,  0.4580167776572274],
    [0.1495959888165767,  0.6178762444026438],
    [0.1246289712555339,  0.7554044083550030],
    [0.0951585116824928,  0.8656312023878318],
    [0.0622535239386479,  0.9445750230732326],
    [0.0271524594117541,  0.9894009349916499],

    [0.1894506104550685, -0.0950125098376374],
    [0.1826034150449236, -0.2816035507792589],
    [0.1691565193950025, -0.4580167776572274],
    [0.1495959888165767, -0.6178762444026438],
    [0.1246289712555339, -0.7554044083550030],
    [0.0951585116824928, -0.8656312023878318],
    [0.0622535239386479, -0.9445750230732326],
    [0.0271524594117541, -0.9894009349916499],
];

// Integrates a function R -> C
// from start to end via
// Gaussian quadrature.
function integrateReal(start, end, mapping) {
    // Reparameterize to [-1, 1]
    const dx = end - start;
    const submap = t => mapping(
        start + 0.5 * dx * (1 + t)
    );

    // Estimate average value of f over the given interval
    const result = [0, 0];
    for (let [weight, abscissa] of GAUSS_COEFFICIENTS) {
        const [u, v] = submap(abscissa);
        result[0] += u * dx * weight / 2;
        result[1] += v * dx * weight / 2;
    }
    return result;
}

// Integrates f(z) dz along the given line segment.
// Start and end are 2-tuples representing
// the start and end points in the complex plane.
// Mapping is a function [x, y] -> [u, v]
// representing f.
function integrateSegment(start, end, mapping) {
    const [x0, y0] = start;
    const [x1, y1] = end;

    // Compute dz
    const dx = x1 - x0;
    const dy = y1 - y0;

    // Approximate average value of f(z)
    // along the segment by Gaussian quadrature
    const submap = t => mapping([
        x0 + t * dx,
        y0 + t * dy,
    ]);
    const [u, v] = integrateReal(0, 1, submap);

    return [
        u * dx - v * dy,
        v * dx + u * dy,
    ];
}

export {integrateReal, integrateSegment};
