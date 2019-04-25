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

socketApi.io = io;

io.on('connection', function(socket){
  console.log(socket.id, 'A user connected');
  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });
});

socketApi.sendDeliveryInfo = function(dName, dPhone, distance, arrivesIn, orderID) {
  console.log('Sending delivery information to a restaurant user...');
  io.sockets.emit('driverFound', { dName: dName, dPhone: dPhone,
                                   distance: distance, arrivesIn: arrivesIn,
                                   orderID: orderID });
}

module.exports = socketApi;
