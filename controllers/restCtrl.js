/**
 * restCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Restaurant controller that handles all the post requests
 * from the front-end side for restuarnat users.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/** Gets tracking information by the oder ID. */
module.exports.getTrackInfo = function (req, res) {
  const orderId = req.body.orderId;
  const sql = 'select d.orderId, currentLocation, Destination, distanceLeft, \
               timePassed, timeLeft, price from Delivery d, DeliveryStatus ds, \
               Price p where d.orderId = ? and d.orderId = ds.orderId and \
               d.orderId = p.orderId;'
  const value = [orderId]
  conn.query(sql, value, function (err, result) {
    if (err) { console.log("Couldn't find!"); }
    res.render('trackPage', {'orderId': result[0].orderId,
                               'disLeft': result[0].distanceLeft,
                               'timePassed': result[0].timePassed,
                               'timeLeft': result[0].timeLeft,
                               'price': result[0].price});
  })
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
   * Insert user infomration into User table.
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
   * Inserts location information into Location table.
   * @param {integer} userId auto-generated user ID
   */
  function addLocation(userId) {
    sql = 'INSERT INTO Location (Latitude, Longitude) VALUE(?, ?);';
    value = [0, 0]; // test data
    conn.query(sql, value, function (err, result) {
      if (err) { console.log('Inserting to Location Failed'); }
      else     { addRestaurant(userId, result.insertId); }
    })
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
