/**
 * driverRouter.js
 *
 * 3/14/2019
 * CS160 - ODFDS Project
 * driver router that handles all the routes from the driver page.
 */

var express = require('express');
var router = express.Router();
var path = require('path');
var app = express();
//const driverCtrl = require("../controllers/driverCtrl");

app.use(express.static(path.join(__dirname, 'public')));

/* Get delivery page */
router.get('/delivery', function(req, res, next) {
	res.render('deliverPage');
});
/* Get delivery info page */
router.get('/deliveryInfo', function(req, res, next) {
	res.render('deliverInfo');
});

module.exports = router;
