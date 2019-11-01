const symbols = new Set([
	'(', ')', '[', ']',
	'+', '*', '-', '/',
	'^', '!']);
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

const operators = {
	'+': [0, true],
	'-': [0, true],
	'*': [1, true],
	'/': [1, true],
	'^': [2, false],
	'!': [3, false],
}

const REMAP = {
	'pi': 'C_PI',
	'tau': 'C_TAU',
	'e': 'C_E',
	'phi': 'C_PHI'
};

export {functions, constants};
