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
  const sql = 'select d.orderId, Name, Address, Destination, timeLeft, distanceLeft \
              from Restaurant r, Delivery d, DeliveryStatus ds \
              where d.orderId = 10101 and d.rId = r.rId and d.orderId = ds.orderId;'
  const value = [orderId]
  conn.query(sql, value, function (err, result) {
    if (err) { console.log("Couldn't find!"); }
    console.log(result, '\n', result.orderId);
    res.render('deliverInfo', {'orderId': result[0].orderId,
                               'rName': result[0].Name, 'rAddr': result[0].Address,
                               'dest': result[0].Destination, 'timeLeft': result[0].timeLeft,
                               'distanceLeft': result[0].distanceLeft});
  })
}
/** Adds driver user infomration to User/Driver tables. */
module.exports.addUser = function (req, res) {
  // Get user information from the driver signup page.
  const email = req.body.email;
  const pwd = req.body.pwd;
  const name = req.body.name;
  const license  = req.body.dl;
  const phone  = req.body.phone;
  const bank = req.body.bank;
  const working = 0;
  // Insert data into tables;
  var sql, value;
  addUserInfo();
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
