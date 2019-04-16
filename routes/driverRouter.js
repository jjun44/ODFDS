/**
 * driverRouter.js
 *
 * 3/14/2019
 * CS160 - ODFDS Project
 * driver router that handles all the routes from the driver page.
 */

var express = require('express');
var router = express.Router();
const driverCtrl = require("../controllers/driverCtrl");

/* Get delivery page */
router.get('/delivery', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Driver') {
    res.render('deliverPage');
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

/* Get delivery info page */
router.get('/deliveryInfo', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Driver') {
    res.render('deliverInfo');
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

/* Post delivery info page */
router.post('/deliveryInfo', driverCtrl.getDeliveryInfo);

/*	Get Order history page	*/
router.get('/dHistory', function(req, res,next) {
  if (req.session.loggedIn && req.session.type == 'Driver') {
    //res.render('dHistory');
    driverCtrl.getOrderHistory(req, res);
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

module.exports = router;
