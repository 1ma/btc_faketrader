var async   = require('async');

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
    , user   = require('./routes/user');

  var app = express();

  // Express settings
  app.set('port', process.env.PORT || ctx.settings.http.port || 5000);
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));

  // Express routes
  app.post('/orders', orders.addOrder);
  app.get('/orders', orders.getAllOrders);
  app.get('/user', user.getBalance);

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
  var _ = require('underscore');


  ctx.logic = {};
  // TODO Llegir EUR i BTC de la BD, fent servir nomes el valor de settings quan a la DB no hi es
  ctx.logic.eur = ctx.settings.eur;
  ctx.logic.btc = ctx.settings.btc;

  // TODO Guardar un valor recent de buy i sell a la BD i llegirlo en aquest punt
  ctx.logic.buy = 0;
  ctx.logic.sell = 1000000;
  ctx.logic.open_orders = [];
  ctx.db.findAllOrders(function(err, allOrders) {
    if (err)
      callback(err);

    open_orders = _.select(allOrders, function(elem){
      return elem.fired_date == null;
    });
  });

  ctx.mtgox_socket.on('message', function(data) {
    if (data.channel_name == 'ticker.BTCEUR') {
      var last_buy = data.ticker.buy.value;
      var last_sell = data.ticker.sell.value;

      console.log( new Date().getTime() + ' BUY -> ' + last_buy + ' | SELL -> ' + last_sell);

      if (last_buy != ctx.logic.buy || last_sell != ctx.logic.sell) {
        console.log('Updated local prices');
        ctx.logic.buy = last_buy;
        ctx.logic.sell = last_sell;
        processActiveOrders();
      }
    }
  });

  console.log('setupLogic: OK');
  callback(null);
  function processActiveOrders() {
    // TODO Comprovar per cada ordre de mercat si cal activarla

    // Passos quan salta ordre de mercat:
    // 1. Omplir el camp fired_date amb linstant actual en memoria
    // 2. Si es una ordre BUY:  EUR -= order.price; BTC += order.amount;
    //    Si es una ordre SELL: EUR += order.price; BTC += order.amount;
    // 3. Notificar clients: Passarlis la ID de la ordre que ha saltat, amb socket.io probablement
    // 4. Actualitzar document a la BD
  }
}

function listen(callback) {
  var http = require('http');

  http.createServer(ctx.app).listen(ctx.app.get('port'), function() {
    console.log('listen: OK (port ' + ctx.app.get('port') + ')');
    callback(null);
  });
}

function ready(err) {
  if (err)
    throw err;
  console.log('Ready to kick ass!');
}