var express = require('express');
var router = express.Router();

router.get('/authorize', function(req, res) {
  res.send('ok');
});

module.exports = router;