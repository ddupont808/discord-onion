const BASE32 = '234567ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bs32 = require('base-x')(BASE32);
const base32 = require('hi-base32');
const BigInteger = require('node-biginteger');

const crypto = require('crypto');
const cryptico = require('cryptico');
const NodeRSA = require('node-rsa');

/*

var utils = require('./utils.js');
console.log(utils.idtob32('1208925819614629174706175')) // max value ( 2^80 - 1 )

1208925819614629174706176
9999999999999999999999999

*/

var tokens = {};

module.exports = {
	b32toid: function(b32) {
		var buf = bs32.decode(b32.toUpperCase());
		var num = BigInteger.fromBuffer(1, buf);
		
		var str = num.multiply(BigInteger.fromString('8')).toString(10);
		var pad = "0000000000000000000000000";
		
		return pad.substring(0, pad.length - str.length) + str;
	},
	idtob32: function(b58) {
		var num = BigInteger.fromString(b58, 10).divide(BigInteger.fromString('8'));
		var buf = num.toBuffer();
		var str = bs32.encode(buf).toLowerCase();
		
		return str.substr(str.length - 16);
	},
	rsaPhrase: function(user, pass) {		
		var phrase = `${user} :::: ${pass}`;
		var rsk = cryptico.generateRSAKey(phrase, 1025);
		
		var key = new NodeRSA();
		
		key.importKey({
			n: new Buffer(rsk.n.toByteArray()),
			e: rsk.e,
			d: new Buffer(rsk.d.toByteArray()),
			p: new Buffer(rsk.p.toByteArray()),
			q: new Buffer(rsk.q.toByteArray()),
			dmp1: new Buffer(rsk.dmp1.toByteArray()),
			dmq1: new Buffer(rsk.dmq1.toByteArray()),
			coeff: new Buffer(rsk.coeff.toByteArray())
		}, 'components');
		
		return new Buffer(key.exportKey('pkcs1-private-der')).toString('base64');
	},
	getKeys: function(token) {
		return tokens[token];
	},
	generateToken: function(pkey, cb) {
		var onion = module.exports.get_onion(pkey);
		var id = module.exports.b32toid(onion);
		
		crypto.randomBytes(24, function(err, buffer) {
			var rand = buffer.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
			var token = `${new Buffer(id.substr(0, 18)).toString('base64')}.D${rand.substr(0, 5)}.${rand.substr(5, 27)}`;
			
			tokens[token] = {
				pkey: pkey,
				onion: onion,
				id: id
			};
			
			cb(token);
		});
	},
	get_onion: function(key) {		
		var shasum = crypto.createHash('sha1');
		var rsa = new NodeRSA();
		
		rsa.importKey(new Buffer(key, 'base64'), 'pkcs1-private-der');
		shasum.update(rsa.exportKey('pkcs1-public-der'));
		return base32.encode(new Buffer(shasum.digest('hex'), 'hex')).toLowerCase().substring(0, 16);
	}
};