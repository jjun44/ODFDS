/**
 * driverCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Driver controller that handles all the post requests
 * from the front-end side for driver users.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/** Gets delivery information by the oder ID. */
module.exports.getDeliveryInfo = function (req, res) {
  const orderId = req.body.orderId;
  const sql = 'select d.orderId, Name, Address, Destination, timeLeft, \
               distanceLeft, price from Restaurant r, Delivery d, \
               DeliveryStatus ds, Price p where d.orderId = ? and d.rId = r.rId \
               and d.orderId = ds.orderId and d.orderId = p.orderId'
  const value = [orderId]
  conn.query(sql, value, function (err, result) {
    if (err || result.length == 0)
    {
      console.log("Couldn't find!");
      res.render('deliverInfo', {message: "** Invalid order ID **"});
    }
    else {
    console.log(result, '\n', result.orderId);
    res.render('deliverInfo', {'orderId': result[0].orderId,
                               'rName': result[0].Name, 'rAddr': result[0].Address,
                               'dest': result[0].Destination, 'timeLeft': result[0].timeLeft,
                               'distanceLeft': result[0].distanceLeft,
                               'price': result[0].price});
  }
  })
}

module.exports.getOrderHistory = function (req, res) {
  // If the user is logged into the website.

  var connects = [];
  if (req.session.loggedIn) {
    console.log('uID: ----', req.session.uID);

    // Checks for any orders from the current driver profile.
    const sql = 'select orderID \
                from Delivery \
                Where driverID in (Select driverID from Driver Where uID = ?)'
    const value = [req.session.uID];
    conn.query(sql, value, function (err, result) {
      if (err || result.length == 0) {
        console.log("no orders Logged yet.");
        res.render('dHistory');
      }
      else {    // Orders are currently logged for the user.
        for (i = 0; i < result.length; i++) {
          console.log('orderID: ', result[i]);

          // Changed sql2
          const sql2 = 'select d.orderId, Name, Address, Destination, totalTime, totalDistance, \
              price from Restaurant r, Delivery d, \
              Price p where d.orderId = ? and d.rId = r.rId \
             and d.orderId = p.orderId'
          const ids = [result[i].orderID];
          conn.query(sql2, ids, function (err, result2) {
            if (err || result2.length == 0) {
              console.log("couldnt get info");
                res.render('dHistory');
              }
            else {
                connects.push(JSON.stringify(result2));
                if (connects.length != result.length) {
                  console.log("not done");
                }
                else {
                  res.render('dHistory', {query: connects});
                }
              }
            })

        }
      }
    })
  }
}

/**
 * Gets driver user information from the user,
 * validates the user info, and saves information
 * to User/Driver tables.
 */
module.exports.addUser = function (req, res) {
  // Get user information from the driver signup page.
  const email = req.body.email;
  const pwd = req.body.pwd;

  // Added a repeat password variable to check if the passwords match
  const rPwd = req.body.repeatpwd;


  const name = req.body.name;
  const license  = req.body.dl;
  const phone  = req.body.phone;
  const bank = req.body.bank;
  const working = 0;
  // Insert data into tables;
  var sql, value;
  var error = false;
  var mEmail = false;

  validateSignUp();
  /*
    This function will be responsible for validating each input field of the page.
  */
  function validateSignUp() {
    console.log("Validating..... \n");

    var emailMess = "";
    var passMess = "";
    var dup = "";


    // If any of the fields are null, return an error message.
    if ((email.length == 0 || !email.includes("@") || !email.includes(".com")) || (pwd.length == 0 || pwd != rPwd) || name.length ==0 ||
    	license.length ==0 || (phone.length == 0 || phone.length != 10) || (bank.length == 0 || bank.length != 16))
    {
    	if (pwd.length < 4) {
    		passMess = "Password must be at least 4 characters";

    	}
    	else if (pwd != rPwd) {passMess ="Passwords don't match";}
    	error = true;
    	console.log("Missing Sign up information");
    	emailMess = "** Invalid information.  "
    }

    // Query for checking if the email already exists
    const eQuery = 'Select Email from User \
    				where Email = ?'

    const val = [email]
    conn.query(eQuery, val, function(err, result) {
    	if (err) {console.log("Error finding email");}
    	else if (result.length != 0) {
    		dup = "* Already Exists ";
    		console.log("Email Already Exists \n");
    		error = true;
    	}
    	else {
    		console.log("Email is good");
    	}
    })

    if (error == true) {
    		res.render('driverSignup', {errorM: emailMess + passMess + " **", errorEmail: dup });
    		console.log(dup);
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
     var sql = 'INSERT into User (Email, Password, Type) VALUE(?, ?, ?);';
     var value = [email, pwd, 'Driver'];
     conn.query(sql, value, function (err, result) {
       if (err) { console.log("Inserting to User Failed"); }
       else { addDriver(result.insertId); }
     })
   }
  /**
   * Inserts driver information into Driver table.
   * @param {integer} userId auto-generated user ID
   */
  function addDriver(userId) {
    sql = 'INSERT INTO Driver (uID, Name, License, Phone, \
          BankAccount, Working) VALUE(?, ?, ?, ?, ?, ?);';
    value = [userId, name, license, phone, bank, working];
    conn.query(sql, value, function (err, result) {
      if (err) { console.log('Inserting to Location Failed'); }
      else {
        console.log('\nInserting user info into the db done successfully.\n');
        res.render('index');
      }
    })
  }
}
