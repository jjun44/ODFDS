/**
 * mainCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Main controller that handles all the post requests
 * from the main page.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/* Login validation. */
module.exports.login = function (req, res) {
  // Get login information from the login form in the main page.
  const email = req.body.email;
  const pwd = req.body.pwd;
  loginValidation();
  /**
   * Check if the user info matches with the data in the database.
   */
  function loginValidation() {
    const sql = 'select * from User where Email = ? and Password = ?;';
    const value = [email, pwd];
    conn.query(sql, value, function (err, result) {
        if (err) { console.log('Login Connection Failed'); }
        if (result.length <= 0) { console.log('No user found'); }
        else {
          console.log('Login validation success');
          // Compare type to rend a corresponding page.
          if (result[0].Type == 'Driver'){ res.render('driverMain'); }
          else { res.render('restaurantMain'); }
        }
    })
  }
}
