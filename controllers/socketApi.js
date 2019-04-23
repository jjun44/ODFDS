var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

io.on('connection', function(socket){
  console.log('A user connected');
});

socketApi.driverInfo = function(dName, dPhone, distance, arrivesIn) {
  console.log(dName, dPhone, distance, arrivesIn);
  io.sockets.emit('driverFound', { dName: dName, dPhone: dPhone,
                                     distance: distance, arrivesIn: arrivesIn });
}

module.exports = socketApi;
