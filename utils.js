const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE32 = '234567ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const bs58 = require('base-x')(BASE58);
const bs32 = require('base-x')(BASE32);

module.exports = {
	b32tob58: function(b32) {
		return bs58.encode(bs32.decode(b32.toUpperCase()));
	},
	b58tob32: function(b58) {
		return bs32.encode(bs58.decode(b58)).toLowerCase();
	}
};