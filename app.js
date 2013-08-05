var async = require('async');

var ctx = {};
ctx.settings = require('./settings');

async.series([setupDB, setupServer, setupSockets, setupLogic, listen], ready);

function setupDB(callback) {
  var db = require('./db');
  db.init(ctx, callback);
}

function setupServer(callback) {
  var http    = require('http')
    , express = require('express')
    , path    = require('path')
    , orders  = require('./routes/orders')
    , logs    = require('./routes/logs')
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
  app.get('/logs', logs.getAllLogs);

  ctx.server = http.createServer(app);
  console.log('setupServer: OK');
  callback(null);
}

function setupSockets(callback) {
  var sockets = require('./sockets');
  sockets.init(ctx, callback);
}

function setupLogic(callback) {
  var logic = require('./logic');
  logic.init(ctx, callback);
}

function listen(callback) {
  ctx.server.listen(ctx.settings.http.port, function() {
    console.log('listen: OK (port ' + ctx.settings.http.port + ')');
    callback(null);
  });
}

function ready(err) {
  if (err)
    throw err;
  console.log('BTC Faketrader ready to kick ass!');
}