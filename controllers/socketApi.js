/**
 * socketApi.js
 *
 * 4/21/2019
 * CS160 - ODFDS Project
 * Socket API that controlls all socekt connections.
 */

var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
var users = {}; // Holds online users
socketApi.io = io;

io.on('connection', function(socket){
  /**
   * Save user information sent from the user.
   * @param {string} type user type either R (Restaurant) or D (Driver)
   * @param {string} userId user ID either rID or driverID
   */
  socket.on('saveUserInfo', function(type, userId) {
    users[userId] = {'Type': type, 'SocketID': socket.id};
    console.log('(', type, ')', userId,  ': user connected');
  });
  /** Delete disconnected user info from users. */
  socket.on('disconnect', function () {
    deleteUser();
    function deleteUser() {
      // Find user ID by socket ID and delete the user.
      for (key in users) {
        if (users[key].SocketID == socket.id) {
          console.log('(', users[key].Type, ')', key, ': user disconnected');
          delete users[key];
        }
      }
    }
  });

  //socket.emit('orderInfo', {rName: 'TestRest', rAddr: 'TestAddr'});
});

socketApi.sendOrderInfo = function(rName, rAddr, dest, distance, duration, price) {
  console.log('Sending order information to a user...');
  io.sockets.emit('orderInfo', { rName: rName, rAddr: rAddr, dest: dest,
                                   distance: distance, duration: duration, price: price });
}

socketApi.sendDriverInfo = function(dName, dPhone, distance, arrivesIn, orderID) {
  console.log('Sending delivery information to a restaurant user...');
  io.sockets.emit('driverInfo', { dName: dName, dPhone: dPhone,
                                   distance: distance, arrivesIn: arrivesIn,
                                   orderID: orderID });
}

module.exports = socketApi;
