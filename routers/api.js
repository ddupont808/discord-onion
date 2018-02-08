var express = require('express');
var router = express.Router();

var utils = require('../utils.js');
var users = require('../lib/user.js');

router.get('/users/@me', function(req, res) {
	var token = req.header('authorization');
	var keys = utils.getKeys(token);
	if(keys == null)
		res.status(401).json({ code: 0, message: "401: Unauthorized" });
	else {
		res.send('ok');
	}
});

module.exports = router;