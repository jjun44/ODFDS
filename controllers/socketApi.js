/**
 * socketApi.js
 *
 * 4/21/2019
 * CS160 - ODFDS Project
 * Socket API that controlls all socekt connections.
 */

var socket_io = require('socket.io');
var restCtrl = require('./restCtrl');
var driverCtrl = require('./driverCtrl');
var io = socket_io();
var socketApi = {};
var users = {}; // Holds online users
socketApi.io = io;

io.on('connection', function(socket){
  /**
   * Saves user information sent from the user.
   * @param {string} type user type either R (Restaurant) or D (Driver)
   * @param {string} userId user ID either rID or driverID
   */
  socket.on('saveUserInfo', function(type, userId) {
    users[userId] = {'Type': type, 'SocketID': socket.id};
    console.log('(', type, ')', userId,  ': user connected (', socket.id, ')');
  });

  /**
   * Turn on/off driver's notification setting when user clicks.
   * @param {string} dID driver ID
   * @param {string} onOff either 'ON' or 'OFF'
   */
  socket.on('updateNotifi', function(dID, onOff) {
    driverCtrl.updateNotification(dID, onOff);
  });

  /** Deletes disconnected user info from the online user list. */
  socket.on('disconnect', function () {
    // Find user ID by socket ID and delete the user.
    for (key in users) {
      if (users[key].SocketID == socket.id) {
        console.log('(', users[key].Type, ')', key, ': user disconnected');
        delete users[key];
      }
    }
  });

  /**
   * When order accepted by a driver, driver infomration will be sent to
   * the restaurant user requested.
   * @param {string} dID driver ID
   * @param {string} rID restaurnt ID
   * @param {string} dest delivery destination
   * @param {string} time delivery duration
   * @param {string} price delievery price
   * @param {string} dName driver's name
   * @param {string} dPhone driver's phone number
   * @param {string} distToRest distance from driver's loc to restaurant
   * @param {string} timeToRest travel time from driver's loc to restaurnt
   */
  socket.on('orderAccepted', function(dID, rID, dest, dist, time, price, dName, dPhone, distToRest, timeToRest) {
    // Send driver info to the restaurant user.
    io.to(users[rID].SocketID).emit('driverInfo', { dID: dID, dName: dName,
                  dPhone: dPhone, distance: distToRest, arrivesIn: timeToRest });
    // Update driver's Working variable.
    driverCtrl.updateWorking(dID, 'Working + 1');
    // Save order information to the database.
    restCtrl.saveOrder(rID, dID, dest, dist, time, price);
  });

  /**
   * When order compeleted, update order status and
   * driver's working status.
   * @param {string} dID driver ID who worked on the order
   * @param {string} orderID order ID compeleted
   */
  socket.on('orderCompleted', function(dID, orderID) {
      console.log(dID, orderID, ": order completed");
      driverCtrl.updateOrderStatus(orderID);
      driverCtrl.updateWorking(dID, 'Working - 1');
  });

  socket.on('driverLoc', function(driverID, latlng, destination) {
    console.log(driverID, latlng.lat, latlng.lng);
    driverCtrl.updateLocation(driverID, latlng.lat, latlng.lng);
    driverCtrl.trackRoute(latlng.lat, latlng.lng, destination);
  });
});

socketApi.trackRouteInfo = function(distance, duration) {
  console.log("socket:trackRouteInfo:", distance, duration);
  io.sockets.emit('trackRoute', { distLeft: distance, timeLeft: duration });
}

/**
 * Sends an error message to users.
 * @param {string} errMsg error message.
 */
socketApi.sendMsg = function(msg) {
  io.sockets.emit('msg', { msg: msg });
}

/**
 * Sends route information to users.
 * @param {string} rID restaurnt ID
 * @param {string} rName restaurnt name
 * @param {string} rAddr restaurnt address
 * @param {string} dest delivery destination
 * @param {Object} order order information including distance, time, and price
 * @param {Object} driver nearest driver information
 */
socketApi.sendRouteInfo = function(rID, rName, rAddr, dest, order, driver) {
  /* Send order information to restaurant users.  */
  io.sockets.emit('orderInfoToR', { rName: rName, rAddr: rAddr, dest: dest,
                                    distance: order.dist, duration: order.time, price: order.price });
  /* Send order information to driver users.  */
  if (driver !== null) {
    io.to(users[driver.id].SocketID).emit('orderInfoToD', { rID: rID, rName: rName, rAddr: rAddr, dest: dest,
                                      distance: order.dist, duration: order.time, price: order.price,
                                      dID: driver.id, dName: driver.name, dPhone: driver.phone,
                                      distToRest: driver.distToRest, timeToRest: driver.timeToRest });
  }
}

/**
 * Sends order ID information to users.
 * @param {string} orderID orderID created from the database.
 */
socketApi.sendOrderID = function(orderID) {
  io.sockets.emit('orderID', { orderID: orderID });
}

module.exports = socketApi;
