/**
 * restRouter.js
 *
 * 3/14/2019
 * CS160 - ODFDS Project
 * restaurant router that handles all the routes from the restaurant page.
 */

var express = require('express');
var router = express.Router();
const restCtrl = require("../controllers/restCtrl");

/* Get request page */
router.get('/request', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Restaurant') {
    restCtrl.request(req, res); // Get restuarant location and rend the page
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

router.post('/request', restCtrl.findDriver);

/* Get track page */
router.get('/track', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Restaurant') {
    res.render('trackPage');
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

/* Post track page */
router.post('/track', restCtrl.getTrackInfo);

/*	Get the restaurant's order history page */
router.get('/rHistory', function(req, res, next) {
  if (req.session.loggedIn && req.session.type == 'Restaurant') {
    //res.render('rHistory');
    restCtrl.getOrderHistory(req, res);
  } else {
    res.render('error', {msg:'Please login to view this page!'});
  }
});

module.exports = router;
