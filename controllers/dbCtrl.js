/**
 * dbCtrl.js
 *
 * 3/6/2019
 * CS160 - ODFDS Project
 * Database controller that connects to the ODFDS database.
 */

const mysql = require('mysql'); // Import mysql package.
var db;
/** Connects to the database. */
function connectDatabase() {
    if (!db) {
        db = mysql.createConnection({
            host: "localhost",
            user: "g3",
            password: "cs160G3!",
            database: 'ODFDS'
        });
        db.connect(function(err){
            if(!err) {
                console.log('Database is connected!');
            } else {
                console.log('Error connecting database!');
            }
        });
    }
    return db;
}

module.exports = connectDatabase();
