const { customAlphabet } = require('nanoid');

const nanoidCustom = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6
);

module.exports = {
	nanoidCustom,
};
