/**
 * restRouter.js
 *
 * 3/14/2019
 * CS160 - ODFDS Project
 * restaurant router that handles all the routes from the restaurant page.
 */

var express = require('express');
var router = express.Router();
//const restCtrl = require("../controllers/restCtrl");

/* Get request page */
router.get('/request', function(req, res, next) {
	res.render('requestPage');
});

module.exports = router;
