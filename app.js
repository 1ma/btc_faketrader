var async = require('async');

var ctx = {};
ctx.settings = require('./settings');
async.series([setupDB, setupServer, setupMtGoxSocket, setupLogic, listen], ready);

function setupDB(callback) {
  ctx.db = require('./db');
  ctx.db.init(ctx, callback);
}

function setupServer(callback) {
  var express = require('express')
    , path    = require('path')
    , orders  = require('./routes/orders')
    , user    = require('./routes/user');

  var app = express();

  // Express settings
  app.set('port', ctx.settings.http.port);
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
  app.disable('x-powered-by');

  // Express routes
  app.get('/orders', orders.getAllOrders);
  app.post('/orders', orders.addOrder);
  app.get('/user', user.getBalance);
  app.post('/user', user.setBalance);


  ctx.app = app;
  console.log('setupServer: OK');
  callback(null);
}

function setupMtGoxSocket(callback) {
  var io = require('socket.io-client');

  var MTGOX_BTCEUR_CHANNELS = {
    trade: 'dbf1dee9-4f2e-4a08-8cb7-748919a71b21',
    depth: '057bdc6b-9f9c-44e4-bc1a-363e4443ce87',
    ticker: '0bb6da8b-f6c6-4ecf-8f0d-a544ad948c15'
  }

  var mtgox_socket = io.connect('https://socketio.mtgox.com/mtgox?Currency=EUR');
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.trade });
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.depth });

  ctx.mtgox_socket = mtgox_socket;
  console.log('setupMtGoxSocket: OK');
  callback(null);
}

function setupLogic(callback) {
  var logic = require('./logic');
  logic.init(ctx, callback);
}

function listen(callback) {
  var http = require('http')
    , io   = require('socket.io');

  var server = http.createServer(ctx.app);
  var io = io.listen(server);
  io.set('log level', 1);
  ctx.io = io;
  server.listen(ctx.app.get('port'), function() {
    console.log('listen: OK (port ' + ctx.app.get('port') + ')');
    callback(null);
  });
}

function ready(err) {
  if (err)
    throw err;
  console.log('BTC Faketrader ready to kick ass!');
}