/**
 * restCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Restaurant controller that handles all the post requests
 * from the front-end side for restuarnat users.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/** Gets request page with the restaurant address and geo location. */
module.exports.request = function (req, res) {
  const sql = 'select Address, Latitude, Longitude from Restaurant r, \
               Location l where uID = ? and r.LocationID = l.LocationID;';
  const value = [req.session.uID]; // get current logged-in user's uID
  conn.query(sql, value, function (err, result) {
    if (err) { return res.render('error', {msg:'Getting Address Failed'}); }
    if (result.length == 0) { console.log('No Address Info Found'); }
    return res.render('requestPage', {start:result[0].Address,
                                      lat:result[0].Latitude,
                                      lng:result[0].Longitude});
  });
}

/** Gets tracking information by the oder ID. */
module.exports.getTrackInfo = function (req, res) {
  const orderId = req.body.orderId;
  const sql = 'select d.orderId, currentLocation, Destination, distanceLeft, \
               timePassed, timeLeft, price from Delivery d, DeliveryStatus ds, \
               Price p where d.orderId = ? and d.orderId = ds.orderId and \
               d.orderId = p.orderId;';
  const value = [orderId]
  conn.query(sql, value, function (err, result) {
    // If you are unable to find the order, re render the page with an error message.
    if (err || result.length == 0) {
      console.log("Couldn't find !");
      res.render('trackPage', {message: "** Invalid order ID **"});
    } else {
      res.render('trackPage', {orderId: result[0].orderId,
                               disLeft: result[0].distanceLeft,
                               timePassed: result[0].timePassed,
                               timeLeft: result[0].timeLeft,
                               price: result[0].price});
    }
  });
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
