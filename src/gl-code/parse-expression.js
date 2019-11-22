const functions = new Set([
	'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
	'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot',
	'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
	'arsinh', 'arcosh', 'artanh', 'arsech', 'arcsch', 'arcoth',
	'exp', 'log', 'ln',
	'sqrt', 'gamma', 'eta', 'zeta',

	'abs', 'arg',
	'conj', 'cis',

	'real', 'imag',
	're', 'im',
]);
const constants = new Set([
	'e', 'pi', 'tau', 'phi'
]);

export {functions, constants};
