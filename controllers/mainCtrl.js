/**
 * mainCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Main controller that handles all the post requests
 * from the main page.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/**
 * Destroys the session and rends the main page.
 */
module.exports.logout = function (req, res) {
  req.session.destroy(function(err) {
    if (err) { return res.render('error', {msg:'Session Destruction Failed'}); }
    else { return res.redirect('/'); }
  })
}
/**
 * Checks if the user info matches with the data in the database.
 * If matched, creates session variables, logeedIn and uID, to track the user,
 * and directs the user to the corresponding dashboard.
 * Otherwise, show an error message.
 */
module.exports.login = function (req, res) {
  // Get login information from the login form in the main page.
  const email = req.body.email;
  const pwd = req.body.pwd;
  // Login validation.
  const sql = 'select * from User where Email = ? and Password = ?;';
  const value = [email, pwd];
  conn.query(sql, value, function (err, result) {
     if (err) { // Querying failed.
        return res.render('error', {msg:'Login Connection Failed'});
     }
     if (result.length <= 0) { // User not found.
        return res.render('index', {errorMessage:'Invalid Login, Try again.'});
     } else { // User found.
        console.log('Login validation success');
        // Sets session variables to track the user.
        req.session.loggedIn = true;
        req.session.uID = result[0].uID;
        req.session.type = result[0].Type;
        console.log('uID:',req.session.uID, req.session.type, 'sessionID:',req.sessionID);
        // Compare type to rend a corresponding dashboard.
        if (result[0].Type == 'Driver'){ return res.render('driverMain'); }
        else { return res.render('restaurantMain'); }
     }
  })
}
