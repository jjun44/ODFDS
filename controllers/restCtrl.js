/**
 * restCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Restaurant controller that handles all the post requests
 * from the front-end side for restaurnat users.
 */

const conn = require('./dbCtrl'); // Connection to the database.
const socketApi = require('./socketApi');
//const async = require("async");

/** Gets request page with restaurant information. */
module.exports.request = function (req, res) {
  // Find current user's address information.
  var sql = 'SELECT Latitude, Longitude FROM Restaurant r, \
               Location l WHERE uID = ? AND r.LocationID = l.LocationID;';
  var value = [req.session.uID]; // get current logged-in user's uID
  var distances = {}; // to hold available drivers with distances to the restaurant
  conn.query(sql, value, function (err, result) {
    if (err) { return res.render('error', {msg:'Getting Address Failed'}); }
    res.render('requestPage', { start:req.session.rAddr, rID:req.session.rID,
                                lat:result[0].Latitude, lng:result[0].Longitude });
  });
}

/** Find the nearest driver and save delivery info to the database */
module.exports.orderRequest = function (req, res) {
  console.log("Order request posted");
  calcRoute();
  findDriver();

  function calcRoute(callback) {
    console.log("Calculating route...");
    const pricePerMile = 2; // charge $2 per mile
    const pricePerMinute = .1; // charge $0.1 per minute
    var dest = req.body.destination;
    var inOneHour = Math.round((new Date().getTime() + 60 * 60 * 1000)/1000);
    googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyDNctnRjRSSJtY4Tq56wrRxowIxIGYh3zI',
      });
    googleMapsClient.directions({
        origin: req.session.rAddr, // from restaurant
        destination: dest, // to destination
        departure_time: inOneHour,
        mode: 'driving',
        traffic_model: 'best_guess'
      }, function(err, results) {
          if (!err) {
            var distance = results.json.routes[0].legs[0].distance.text;
            var duration = results.json.routes[0].legs[0].duration.text;
            var rName = req.session.rName;
            var rAddr = req.session.rAddr;
            var price = (parseFloat(distance) * pricePerMile + parseFloat(duration) * pricePerMinute).toFixed(2);
            console.log(rName, rAddr, dest, distance, duration, price);
            socketApi.sendOrderInfo(rName, rAddr, dest, distance, duration, price);
          }
      });
  }

  function findDriver() {
    console.log("Finding a driver...");
    global.distances = {};
    // Find all available drivers.
    sql = 'SELECT driverID, Name, Phone, Latitude, Longitude FROM Driver d, \
           Location lo WHERE Working = 0 and Notification = \'ON\' AND \
           d.LocationID = lo.LocationID;';
    conn.query(sql, function (err, drivers) {
       // Convert Drivers' current latitudes and longitudes into Address.
       for (const driver of drivers) {
         geoToAddress(drivers, driver);
       }
    });
  }

  function geoToAddress(drivers, driver) {
    console.log("Changing geolocation to address...");
    googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyDNctnRjRSSJtY4Tq56wrRxowIxIGYh3zI',
      });
    googleMapsClient.reverseGeocode({latlng: [driver.Latitude, driver.Longitude]
       }, function(err, res) {
          if (!err) {
            // Find nearest driver
            findNearest(drivers, driver, res.json.results[0].formatted_address, googleMapsClient);
        }
    });
  }

  function findNearest(drivers, driver, dAddr, googleMapsClient) {
    console.log("Finding the nearest driver...");
    var inOneHour = Math.round((new Date().getTime() + 60 * 60 * 1000)/1000);
    googleMapsClient.directions({
        origin: dAddr,
        destination: req.session.rAddr,
        departure_time: inOneHour,
        mode: 'driving',
        traffic_model: 'best_guess'
      }, function(err, results) {
          if (!err) {
            var distance = results.json.routes[0].legs[0].distance.text;
            var duration = results.json.routes[0].legs[0].duration.text;
            distances[driver.driverID] = [driver.Name, driver.Phone, distance, duration];
            // Find the nearest driver
            if (drivers.length == Object.keys(distances).length) {
              console.log(distances);
              var minID, minDistance = 99999;
              for (key in distances) {
                if (minDistance > parseFloat(distances[key][2])) {
                  minID = key;
                  minDistance = parseFloat(distances[key][2]);
                }
              }
              console.log(req.session.rID, req.session.rAddr,
                distances[minID][0], distances[minID][1], distances[minID][2], distances[minID][3]);
              // Save delivery info to delivery table
              saveDelivery(distances[minID], minID);
            }
          }
      });
    }

    function saveDelivery (driver, driverID) {
      console.log("Saving delievry information...");
      var today = new Date();
      var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dest = req.body.destination;
      sql = 'INSERT INTO Delivery (rID, driverID, startTime, Date, Destination) \
              VALUE(?, ?, ?, ?, ?);';
      value = [req.session.rID, driverID, time, date, dest];
      conn.query(sql, value, function (err, result) {
        if (err) { console.log('Inserting to Delivery Failed..'); }
        else {
          console.log('\nInserting delivery info into the db done successfully.\n');
          // Send driver and delivery info to the restuarant user
          socketApi.sendDriverInfo(driver[0], driver[1], driver[2], driver[3], result.insertId);
        }
      });
    }
}

/** Gets tracking information by the oder ID. */
module.exports.getTrackInfo = function (req, res) {
  const orderId = req.body.orderId;
  const sql = 'select d.orderId, Destination, distanceLeft, \
               timePassed, timeLeft, price from Delivery d, DeliveryStatus ds, \
               Price p where d.orderId = ? and d.orderId = ds.orderId and \
               d.orderId = p.orderId;';
  const value = [orderId]
  conn.query(sql, value, function (err, result) {
    // If you are unable to find the order, re-render the page with an error message.
    if (err || result.length == 0) {
      console.log("Couldn't find !");
      return res.render('trackPage', {message: "** Invalid order ID **"});
    } else {
      return res.render('trackPage', {orderId: result[0].orderId,
                                      destination: result[0].Destination,
                                      disLeft: result[0].distanceLeft,
                                      timePassed: result[0].timePassed,
                                      timeLeft: result[0].timeLeft,
                                      price: result[0].price});
    }
  });
}

module.exports.getOrderHistory = function (req, res) {
  var connects = [];
  if (req.session.loggedIn) {
    console.log('uID: ----', req.session.uID);

    // Check for any orders that the restaurant has.
    const sql = 'select orderID \
                from Delivery \
                Where rID in (Select rID from Restaurant Where uID = ?)'
    const value = [req.session.uID];
    conn.query(sql, value, function(err, result) {
      if (err || result.length == 0) {
        console.log("no orders Logged yet.");
        res.render('rHistory');
      }
      else {
        for (i = 0; i < result.length; i++) {
          console.log("orderID: ", result[i]);
          const sql2 = 'select d.orderId, dr.Name, r.Name, dr.Phone, Destination, timePassed, price \
                        from Restaurant r, Delivery d, DeliveryStatus ds, Price p, Driver dr \
                        where d.orderId = ? and d.rId = r.rId and d.orderId = ds.orderId and d.orderId = p.orderId and d.driverID = dr.driverID'
          const ids = [result[i].orderID];
          conn.query(sql2, ids, function(err, result2) {
            if (err || result2.length ==0) {
              console.log(err);
              res.render('rHistory');
            }
            else {
              connects.push(JSON.stringify(result2));
              if (connects.length != result2.length) {
                console.log("not Done");
              }
              else {
                res.render('rHistory', {query: connects, } );
              }
            }
          })
        }
      }
    })
  }
}

/** Adds restauraunt user infomration to User/Location/Restaurant tables. */
module.exports.addUser = function (req, res) {
  // Get user information from the restuarnt signup page.
  const email = req.body.email;
  const pwd = req.body.pwd;
  const rPwd = req.body.repeatpwd;
  const name = req.body.name;
  const addr  = req.body.address;
  const phone  = req.body.phone;
  const creditCard = req.body.creditCard;
  // Insert data into tables;
  var sql, value;
  validateSignUp();
  /*
    This function will be responsible for validating each input field of the page.
  */
  function validateSignUp() {
    console.log("Validating..... \n");
    var emailMess = "";
    var passMess = "";
    var dup = "";
    var error = false;
    // If any of the fields are null, return an error message.
    if ((email.length == 0 || !email.includes("@") || !email.includes(".com")) || (pwd.length == 0 || pwd != rPwd) || name.length ==0 ||
      addr.length ==0 || (phone.length == 0 || phone.length != 10) || (creditCard.length == 0 || creditCard.length != 16))
    {
      if (pwd.length < 4) {
        passMess = "Password must be at least 4 characters";
      }
      else if (pwd != rPwd) {passMess = "Passwords don't match.";}
      error = true;
      console.log("Missing Sign up information");
      emailMess = "** Invalid information.  "
    }
    const eQuery = 'Select Email from User \
            where Email = ?'
    const val = [email]
    conn.query(eQuery, val, function(err, result) {
      if (err) {console.log("Error finding email");}
      if (result.length != 0) {
        dup = "* Already Exists ";
        console.log("Email Already Exists \n");
        error = true;
      }
      else {
        console.log("Email is good");
      }
    })
    if (error == true) {
        console.log("Errors in the page; Reloading");
        res.render('restaurantSignup', {errorM: emailMess + passMess + " **", errorEmail: dup });
    }
    else {
      console.log("Validation is complete; Continue to adding user.");
      addUserInfo();
    }
  }
  /**
   * Insert user information into User table.
   */
  function addUserInfo() {
    sql = 'INSERT into User (Email, Password, Type) VALUE(?, ?, ?);';
    value = [email, pwd, 'Restaurant'];
    conn.query(sql, value, function (err, result) {
      if (err) { console.log('Inserting to User Failed'); }
      else     { addLocation(result.insertId); }
    })
  }
  /**
   * Converts address to latitude and longitude and
   * inserts location information into Location table.
   * @param {integer} userId auto-generated user ID
   */
  function addLocation(userId) {
    sql = 'INSERT INTO Location (Latitude, Longitude) VALUE(?, ?);';
    // Convert address into latitude and Longitude
    googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyDNctnRjRSSJtY4Tq56wrRxowIxIGYh3zI',
     });
    googleMapsClient.geocode({address: addr}, function(err, response) {
       if (!err) {
         const lat = response.json.results[0].geometry.location.lat;
         const lng = response.json.results[0].geometry.location.lng;
         const value = [lat, lng];
         conn.query(sql, value, function (err, result) {
           if (err) { console.log('Inserting to Location Failed'); }
           else     { addRestaurant(userId, result.insertId); }
         })
       }
     });
  }
  /**
   * Inserts restuarnt info into Restaurant table
   * and rends the main page.
   * @param {integer} userId auto-generated user ID
   * @param {integer} locId auto-generated location ID
   */
  function addRestaurant(userId, locId) {
    sql = 'INSERT INTO Restaurant (uId, Name, Address, LocationID, \
                    Phone, CreditCard) VALUE(?, ?, ?, ?, ?, ?);';
    value = [userId, name, addr, locId, phone, creditCard];
    conn.query(sql, value, function (err, result) {
      if (err) { console.log('Inserting to Restaurant Failed'); }
      else {
        console.log('\nInserting user info into the db done successfully.\n');
        res.render('index');
      }
    })
  }
}
