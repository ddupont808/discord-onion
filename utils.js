const BASE32 = '234567ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bs32 = require('base-x')(BASE32);
const BigInteger = require('node-biginteger');

/*

var utils = require('./utils.js');
console.log(utils.idtob32('1208925819614629174706175')) // max value ( 2^80 - 1 )

*/

module.exports = {
	b32toid: function(b32) {
		var buf = bs32.decode(b32.toUpperCase());
		var num = BigInteger.fromBuffer(1, buf);
		
		var str = num.toString(10);
		var pad = "0000000000000000000000000";
		return pad.substring(0, pad.length - str.length) + str;
	},
	idtob32: function(b58) {
		var num = BigInteger.fromString(b58, 10);
		var buf = num.toBuffer();
		var str = bs32.encode(buf).toLowerCase();
		
		return str.substr(str.length - 16);
	}
};