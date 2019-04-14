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

/* GET home page */
router.get('/', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Driver') {
    res.redirect('/driver'); // driver user is logged in
  } else if (req.session.loggedIn && req.session.type == 'Restaurant') {
    res.redirect('/rest'); // restuarnt user is logged in
  } else {
    res.render('index');
  }
});

/* Login validation */
router.post('/', mainCtrl.login);

/* Logout */
router.get('/logout', mainCtrl.logout);

/* Get restaurant's dashboard */
router.get('/rest', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Restaurant') {
    res.render('restaurantMain');
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

/* Get driver's dashboard */
router.get('/driver', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Driver') {
    res.render('driverMain');
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

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
