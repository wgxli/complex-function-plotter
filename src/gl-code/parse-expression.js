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
	'conj', 'cis'
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

function symbolParser(expression, lastToken) {
	let char = expression.charAt();
	let type = 'operator';
	let text = null;
	let precedence = null;
	let left_associative = null;

	if (symbols.has(char)) {text = char;}

	if (text === '(' || text === '[') {type = 'left-bracket';}
	if (text === ')' || text === ']') {type = 'right-bracket';}
	if (operators.hasOwnProperty(text)) {
		[precedence, left_associative] = operators[text];
	}

	// Unary minus
	if (text === '-' && (
		lastToken === null
		|| lastToken.type === 'operator'
		|| lastToken.type === 'left-bracket')) {
		text = '$';
		precedence = 3;
		left_associative = false;
	}

	return {
		type: type,
		text: text,
		precedence: precedence,
		left_associative: left_associative
	};
}

function matchRegex(expression, regex) {
	const match = expression.match(regex);
	if (match === null) {
		return null;
	} else {
		return match[0];
	}
}

function numberParser(expression) {
	return {
		type: 'number',
		text: matchRegex(expression, /^(([0-9]+(\.[0-9]+)?i?)|i)/)
	};
}

function wordParser(expression) {
	let type = 'variable';
	const text = matchRegex(expression, /^[a-z]+/);

	if (functions.has(text)) {type = 'function';}

	return {
		type: type,
		text: text
	}
}

const token_parsers = [
	numberParser,
	symbolParser,
	wordParser
];

// END PARSERS //


const REMAP = {
	'pi': 'C_PI',
	'tau': 'C_TAU',
	'e': 'C_E',
	'phi': 'C_PHI'
};
function tokenize(expression) {
	const tokens = [];
	let lastToken = null;

	while (expression.length > 0) {
		let found = false;
		expression = expression.trim();

		// Loop through each parser and attempt to parse a token
		for (const parser of token_parsers) {
			let token = parser(expression, lastToken);

			// If parse is successful, extract token and restart parsing
			if (token.text !== null) {
				// console.log('Token', token);
				expression = expression.slice(token.text.length);
				if (REMAP.hasOwnProperty(token.text)) {
					token.text = REMAP[token.text];
				}
				tokens.push(token);
				lastToken = token;
				found = true;
				break;
			}
		}

		if (!found) {
			console.log(`Error parsing token from ${expression}`);
			return null;
		}
	}
	return tokens
}

function parseExpression(expression) {
	expression = expression.replace(/\*\*/g, '^');
	const tokens = tokenize(expression);
	const operator_stack = [];
	const output = [];

	// Return null on tokenization error
	if (tokens === null) {return null;}


	// Shunting yard algorithm
	tokens.reverse();
	while (tokens.length > 0) {
		let token = tokens.pop();

		switch (token.type) {
			case 'number':
				output.push(token);
				break;

			case 'variable':
				output.push(token);
				break;

			case 'function':
				operator_stack.push(token)
				break;

			case 'operator':
				while (operator_stack.length > 0) {
					let operator = operator_stack.pop();
					let stop = true;

					if (operator.type === 'function') {
						stop = false;
					} else if (operator.type === 'operator') {
						if (operator.precedence > token.precedence) {
							stop = false;
						} else if (
							operator.precedence === token.precedence
							&& operator.left_associative) {
							stop = false;
						}
					}

					if (stop) {
						operator_stack.push(operator);
						break;
					} else {
						output.push(operator);
					}
				}
				operator_stack.push(token);
				break;

			case 'left-bracket':
				operator_stack.push(token);
				break;

			case 'right-bracket':
				let found = false;
				while (operator_stack.length > 0) {
					let operator = operator_stack.pop();
					if (operator.type !== 'left-bracket') {
						output.push(operator);
					} else {
						found = true
						break;
					}
				}
				if (!found) {
					console.log('Mismatched parentheses!');
					return null;
				}
				break;

			default:
				console.log(`Unknown token type ${token.type}!`);
				return null;
		}
	}

	while (operator_stack.length > 0) {
		let operator = operator_stack.pop();
		if (operator.type === 'left-bracket' || operator.type === 'right-bracket') {
			console.log('Mismatched parentheses!');
			return null;
		}
		output.push(operator);
	}

	// console.log('RPN:', output.map(x => x.text).join(' '));
	return output;
}

export {parseExpression, functions, constants};
