var io  = require('socket.io')
  , ioc = require('socket.io-client');

var mtgox_api_query = 'https://socketio.mtgox.com/mtgox?Currency=EUR';

var MTGOX_BTCEUR_CHANNELS = {
  trade: 'dbf1dee9-4f2e-4a08-8cb7-748919a71b21',
  depth: '057bdc6b-9f9c-44e4-bc1a-363e4443ce87',
  ticker: '0bb6da8b-f6c6-4ecf-8f0d-a544ad948c15'
}

exports.init = function(ctx, callback) {
  // MtGox socket setup
  var mtgox_socket = ioc.connect(mtgox_api_query);
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.trade });
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.depth });
  ctx.mtgox_socket = mtgox_socket;

  // BTC Faketrader socket setup
  ctx.io = io.listen(ctx.server);
  ctx.io.set('log level', 1);

  console.log('setupMtGoxSocket: OK');
  callback(null);
};