var express = require('express');
var router = express.Router();

router.get('/users/@me', function(req, res) {
  res.send('ok');
});

module.exports = router;