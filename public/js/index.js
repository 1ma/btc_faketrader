var MTGOX_BTCEUR_CHANNELS = {
  trade: 'dbf1dee9-4f2e-4a08-8cb7-748919a71b21',
  depth: '057bdc6b-9f9c-44e4-bc1a-363e4443ce87',
  ticker: '0bb6da8b-f6c6-4ecf-8f0d-a544ad948c15'
}

var mtgox_socket = io.connect('https://socketio.mtgox.com/mtgox?Currency=EUR');

mtgox_socket.emit('message', {
  op: 'unsubscribe',
  channel: MTGOX_BTCEUR_CHANNELS.trade
});
mtgox_socket.emit('message', {
  op: 'unsubscribe',
  channel: MTGOX_BTCEUR_CHANNELS.depth
});

mtgox_socket.on('message', function(data) {
  if (data.channel_name == 'ticker.BTCEUR') {
    $('#buy_disp').text('BUY: ' + data.ticker.buy.display);
    $('#sell_disp').text('SELL: ' + data.ticker.sell.display);
  }
});

$('#submitOrderBtn').click(function() {
  var type = $('#type').val();
  var amount = $('#amount').val();
  var price = $('#price').val();

  console.log(type + ' ' + amount + ' ' + price);
  $.post('/orders', {"type": type, "amount": amount, "price": price}, function() {
    // TODO Print new order in active div table
    console.log('The order has been successfully recorded');
  });
});