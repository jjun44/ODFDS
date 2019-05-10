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

/**
 * Calculate distance and estimated time
 * from location A to B using Google Map API.
 * @param {string} start start location
 * @param {string} end end location
 * @param {function} callback function to call after calculating
 */
module.exports.calcRoute = function (start, end, callback) {
  //console.log("Calculating route...");
  googleMapsClient.directions({
      origin: start,
      destination: end,
      departure_time: inOneHour,
      mode: 'driving',
      traffic_model: 'best_guess'
    }, function(err, results) {
        if (err) {
          console.log("calcRoute failed..");
        } else {
          var distance = results.json.routes[0].legs[0].distance.text;
          var duration = results.json.routes[0].legs[0].duration.text;
          // If distance is in ft, convert it to miles.
          var distInFt = distance.split(' ');
          if (distInFt[1] == 'ft') {
             distance = (distInFt[0] * 0.000189394).toFixed(5) + ' mi';
          }
          callback(distance, duration);
        }
    });
}

/**
 * Geocode an address into lat/lng usign Google Map API.
 * @param {string} addr address to geocode
 * @param {function} callback function to call after calculating
 */
module.exports.geoCode = function (addr, callback) {
  //console.log("Geocoding address...");
  googleMapsClient.geocode({address: addr}, function(err, response) {
    if (err) {
       console.log("geoCode failed...");
    } else {
       const lat = response.json.results[0].geometry.location.lat;
       const lng = response.json.results[0].geometry.location.lng;
       callback(lat, lng);
     }
  });
}

module.exports.mapClient = googleMapsClient;
