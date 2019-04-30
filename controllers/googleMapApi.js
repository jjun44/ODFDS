/**
 * googleMapApi.js
 *
 * 4/23/2019
 * CS160 - ODFDS Project
 * Google Map API that controlls google map API connections.
 */

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDNctnRjRSSJtY4Tq56wrRxowIxIGYh3zI',
});
var inOneHour = Math.round((new Date().getTime() + 60 * 60 * 1000)/1000);

module.exports.calcRoute = function (start, end, callback) {
  console.log("Calculating route...");
  googleMapsClient.directions({
      origin: start,
      destination: end,
      departure_time: inOneHour,
      mode: 'driving',
      traffic_model: 'best_guess'
    }, function(err, results) {
        if (err) { console.log("Calculating route failed.."); }
        else {
          var distance = results.json.routes[0].legs[0].distance.text;
          var duration = results.json.routes[0].legs[0].duration.text;
          callback(distance, duration);
        }
    });
}

module.exports.mapClient = googleMapsClient;
