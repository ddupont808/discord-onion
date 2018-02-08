var express = require('express');
var router = express.Router();

var utils = require('../utils.js');

router.get('/authorize', function(req, res) {
	if(req.query.user == null)
		res.status(400).json({ user: ["This field is required"] });
	else if(req.query.pass == null)
		res.status(400).json({ pass: ["This field is required"] });
	else {
		var pkey = utils.rsaPhrase(req.query.user, req.query.pass);
		utils.generateToken(pkey, (token) => res.json({ token: token }));
	}
});

module.exports = router;