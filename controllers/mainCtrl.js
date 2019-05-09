/**
 * mainCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Main controller that handles all the post requests
 * from the main page including login and logout.
 */

const conn = require('./dbCtrl'); // Connection to the database.

/**
 * Destroys the session and rends the main page when the user log outs.
 * If the user is a driver, make sure to turn off his/her notification setting.
 */
module.exports.logout = function (req, res) {
  // Turn off driver's notification setting.
  if (req.session.type == 'Driver') {
    var sql = "update Driver set Notification = 'OFF' where driverID = ?;";
    conn.query(sql, req.session.dID, function(err, result) {
      if (err) { console.log("Failed to turn off notification."); }
      else { console.log("Driver's notifiaction turned off."); }
    });
  }
  // Destory the session and rend the main page.
  req.session.destroy(function(err) {
    if (err) { return res.render('error', {msg:'Session Destruction Failed'}); }
    else { return res.redirect('/'); }
  });
}

/**
 * Login validation.
 * If validation is successful, creates session variables to track the user,
 * and directs the user to the corresponding dashboard.
 * Otherwise, show an error message.
 */
module.exports.login = function (req, res) {
  // Get user typed email and password from the login form in the main page.
  const email = req.body.email;
  const pwd = req.body.pwd;
  // Login validation.
  var sql = 'select uID, Type from User where Email = ? and Password = ?;';
  var value = [email, pwd];
  conn.query(sql, value, function (err, result) {
    // Querying failed.
     if (err) {
        return res.render('error', {msg:'Database Connection Failed.'});
     }
     // User not found.
     if (result.length <= 0) {
        return res.render('index', {errorLogin:'Invalid Login, Try again.'});
      }
     // User found.
      console.log('Login validation success');
      // Sets session variables to track the user.
      req.session.loggedIn = true;
      req.session.uID = result[0].uID;
      req.session.type = result[0].Type;
      // Compare type to add more session variables and rend a corresponding dashboard.
      if (result[0].Type == 'Driver'){ // Driver user
        // Get driverID and copy it to session variable.
        sql = 'select driverID from Driver where uID = ?;'
        conn.query(sql, req.session.uID, function (err, result) {
          if (err) { console.log('Database connecton failed: Driver'); }
          req.session.dID = result[0].driverID;
          console.log('uID:',req.session.uID, req.session.type, req.session.dID, 'sessionID:',req.sessionID);
          return res.render('driverMain');
        })
      }
      else { // Restaurant user
        // Get restaurant ID, name, and address and copy them to session variables.
        sql = 'select rID, Name, Address from Restaurant where uID = ?;'
        conn.query(sql, req.session.uID, function (err, result) {
          if (err) { console.log('Database connecton failed: Restaurant'); }
          req.session.rID = result[0].rID;
          req.session.rName = result[0].Name;
          req.session.rAddr = result[0].Address;
          console.log('uID:',req.session.uID, req.session.type, req.session.rID,
                      req.session.rName, req.session.rAddr, 'sessionID:',req.sessionID);
          return res.render('restaurantMain');
        })
      }
  });
}
