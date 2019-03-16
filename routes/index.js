/**
 * index.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * main router that handles all the routes from the main page.
 */

var express = require('express');
var router = express.Router();
const mainCtrl = require("../controllers/mainCtrl");
const restCtrl = require("../controllers/restCtrl");
const driverCtrl = require("../controllers/driverCtrl");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
/* Login validation */
router.post('/', mainCtrl.login);

/* Get restaurant sing up page */
router.get('/restSignup', function(req, res, next) {
   res.render('restaurantSignup');
});
/* Post restuarnt sign up page */
router.post('/restSignup', restCtrl.addUser);

/* Get driver sing up page */
router.get('/driverSignup', function(req, res, next) {
    res.render('driverSignup');
});
/* Post driver sign up page */
router.post('/driverSignup', driverCtrl.addUser);

module.exports = router;
