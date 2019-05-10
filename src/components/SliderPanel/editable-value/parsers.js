function lowerParser(text) {
	return text.toLowerCase();
}

function numberParser(text) {
	const parsed = Number(text);

	if (!Number.isNaN(parsed)) {
		return parsed;
	}
}

const parsers = {
	number: numberParser,
	lower: lowerParser
};
export default parsers;
