// Substitute bound variable with value in AST
function substitute(ast, name, value) {
    if (!Array.isArray(ast)) {return ast;}
    if (ast[0] === 'variable' && ast[1] === name) {return value;}
    return ast.map(x => substitute(x, name, value));
}

// Return AST where binary operation `op` is applied
// between all given terms (AST).
function compose(terms, op) {
    if (terms.length === 1) {return terms[0]};
    const N = Math.floor(terms.length/2);
    // Distribute evenly for faster computation
    return [op, compose(terms.slice(0, N), op), compose(terms.slice(N), op)];
}

// Apply sum or product operator.
function sumProd(operator, args) {
    if (args[1][0] !== 'variable') {return 'error(index-variable-invalid)';}

    const idxVar = args[1][1];
    const low = args[2][1];
    const high = args[3][1];
    const termAST= args[0];

    const terms = [];
    for (let i = low; i <= high; i++) {
        terms.push(substitute(termAST, idxVar, ['number', i, 0]));
    }

    if (operator === 'sum') {return compose(terms, 'add');}
    if (operator === 'prod') {return compose(terms, 'mul');}
}

// Optimize AST, and expand any higher-order constructs.
function compile(ast) {
    if (ast === null) {return null;}

    const [operator, ...args] = ast;

    if (operator === 'number' || operator === 'variable' || operator === 'constant') {
        return ast;
    }

    // Higher-order functions
    if (operator === 'sum' || operator === 'prod') {
        return sumProd(operator, args);
    }

    return [operator, ...args.map(compile)];
}

export default compile;
