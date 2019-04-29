/**
 * restCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Restaurant controller that handles all the post requests
 * from the front-end side for restaurnat users.
 */

const conn = require('./dbCtrl'); // Connection to the database.
const socketApi = require('./socketApi'); // Connection to socekt API.
const googleMap = require('./googleMapApi'); // Connection to Google Map API.
const pricePerMile = 2; // Charge $2 per mile.
const pricePerMinute = .5; // Charge $0.5 per minute.

/** Gets request page with restaurant information. */
module.exports.request = function (req, res) {
  // Find current user's geo location information.
  var sql = 'SELECT Latitude, Longitude FROM Restaurant r, \
               Location l WHERE uID = ? AND r.LocationID = l.LocationID;';
  var value = [req.session.uID]; // get current logged-in user's uID
  conn.query(sql, value, function (err, result) {
    if (err) { return res.render('error', {msg:'Getting Address Failed'}); }
    res.render('requestPage', { start:req.session.rAddr, rID:req.session.rID,
                                lat:result[0].Latitude, lng:result[0].Longitude });
  });
}

/**
 * Posts request page.
 * - Calculates and validates a delivery route
 * - Sends the route information to the restaurant user.
 * - Finds the nearest available driver.
 * - Sends the route info to the driver.
 */
module.exports.orderRequest = function (req, res) {
  const rID = req.session.rID;
  const rName = req.session.rName;
  const rAddr = req.session.rAddr;
  const dest = req.body.destination;
  // Holds route information.
  var OrderInfo = function(dist, time, price) {
    this.dist = dist;
    this.time = time;
    this.price = price;
  };
  // Holds the nearest driver information.
  var DriverInfo = function(dID, dName, dPhone, dist, time) {
    this.id = dID;
    this.name = dName;
    this.phone = dPhone;
    this.distToRest = dist;
    this.timeToRest = time;
  };
  var distances = {}; // Holds available drivers with distances to the restaurant.
  // Calculate the route from the restaurant location to the destination.
  googleMap.calcRoute(rAddr, dest, routeInfo);
  /**
   * Calculates the order price based on the distance and duration,
   * saves the order inforamtion and sends to the restaurant user.
   * If the order is not valid, sends an error message,
   * otherwise, it will continue to find available drivers.
   * @param {string} distance distance from restaurnt to destination
   * @param {string} duration delivery duration
   */
  function routeInfo(distance, duration) {
      var price = (parseFloat(distance) * pricePerMile + parseFloat(duration) * pricePerMinute).toFixed(2);
      var orderInfo = new OrderInfo(distance, duration, price);
      // Send route information to the restaurant user.
      socketApi.sendRouteInfo(rID, rName, rAddr, dest, orderInfo, null);
      // If order is not valid, send error message to the restaurant user.
      if (price < 6 || parseFloat(duration) > 30) {
        var err = "Order can't be made: \
                   we can't take order less than $6 or taking more than 30min.";
        socketApi.sendErrMsg(err);
      } else {
        // If order is valid, find available drivers.
        findDrivers(orderInfo);
      }
  }
  /**
   * Finds all available drivers and
   * loops each driver to find the nearest one.
   * @param {Object} orderInfo order information
   */
  function findDrivers(orderInfo) {
    // Find all available drivers.
    sql = 'SELECT driverID, Name, Phone, Latitude, Longitude FROM Driver d, \
           Location lo WHERE Working = 0 and Notification = \'ON\' AND \
           d.LocationID = lo.LocationID;';
    conn.query(sql, function (err, drivers) {
       // For each available driver, covert lat/lng to address and find nearest driver.
       for (const driver of drivers) {
         findNearest(drivers, driver, orderInfo);
       }
    });
  }
  /**
   * Converts driver's geo location to address,
   * calculates distance/duration from that address to the restaurnt,
   * if it's last driver to calculate, find the nearest one,
   * and sends the order information to the nearest driver found.
   * @param {Object} drivers all available drives
   * @param {Object} driver driver to calculate distance/duration to the restaurnt
   * @param {Object} orderInfo order information
   */
  function findNearest(drivers, driver, orderInfo) {
    // Convert driver's current latitude and longitude into address.
    googleMap.mapClient.reverseGeocode({latlng: [driver.Latitude, driver.Longitude]
       }, function(err, res) {
          if (!err) {
            var dAddr = res.json.results[0].formatted_address; // Converted address.
            /**
             * Saves current driver info and finds the nearest driver.
             * @param {string} distance distance from driver to restaurnt
             * @param {string} duration duration from driver to restaurnt
             */
            var nearestDriver = function (distance, duration) {
              // Save current driver information to the object of all drivers.
              distances[driver.driverID] = [driver.Name, driver.Phone, distance, duration];
              // Find the nearest driver.
              if (drivers.length == Object.keys(distances).length) {
                console.log(distances);
                var minID, minDistance = 99999;
                for (key in distances) {
                  if (minDistance > parseFloat(distances[key][2])) {
                    minID = key;
                    minDistance = parseFloat(distances[key][2]);
                  }
                }
                // Save the nearest driver info.
                var driverInfo = new DriverInfo(minID, distances[minID][0], distances[minID][1],
                  distances[minID][2], distances[minID][3]);
                console.log(distances); // Print all available drivers info.
                // Print the restaurant and the nearest driver info.
                console.log(rID, rAddr, driverInfo.id, driverInfo.name,
                  driverInfo.phone, driverInfo.distToRest, driverInfo.timeToRest);
                // Send route information to the corresponding driver.
                socketApi.sendRouteInfo(rID, rName, rAddr, dest, orderInfo, driverInfo);
              }
            }
            // Caluclate distance/duration from driver to restaurnt.
            googleMap.calcRoute(dAddr, rAddr, nearestDriver);
        }
    });
  }
}

/**
 * Saves order information into
 * Delivery and Price tables in the database,
 * and sends order ID information to the user.
 */
module.exports.saveOrder = function (rID, dID, dest, dist, duration, price) {
  var today = new Date();
  var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  // Save delivery information to Delivery table in the database.
  var sql = 'INSERT INTO Delivery (rID, driverID, startTime, Date, Destination) \
             VALUE(?, ?, ?, ?, ?);';
  var value = [rID, dID, time, date, dest];
  conn.query(sql, value, function (err, result) {
    if (err) { console.log('Inserting to Delivery Failed..'); }
    else {
      console.log('Inserting delivery info into the db done successfully.');
      socketApi.sendOrderID(result.insertId); // Send order ID to the restaurant user.
      savePrice(result.insertId); // Save price infomration.
    }
  });

  /**
   * Saves price information to the Price table in the database.
   * @param {string} orderID order ID created from the Delivery table.
   */
  function savePrice(orderID) {
    sql = 'INSERT INTO Price (orderID, totalDistance, totalTime, Price) \
           VALUE(?, ?, ?, ?);';
    value = [orderID, dist, duration, price];
    conn.query(sql, value, function (err, result) {
      if (err) { console.log('Inserting to Price table Failed..'); }
      else {
        console.log('Inserting to Price table done successfully.');
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

/**
 * Gets restaurnt user information from the user,
 * validates the user info, and saves information
 * to User/Location/Restaurant tables.
 * It will also geocode the address to save into the Location table.
 */
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
    googleMap.mapClient.geocode({address: addr}, function(err, response) {
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
