var eur
  , btc
  , buy
  , sell
  , active_orders
  , fired_orders
  , mtgox_socket;

$(document).ready(function() {
  setupMtGoxSocket();

  $.get('/user', function(data) {
    eur = data.eur;
    btc = data.btc;
    $('#eur').text('EUR: ' + eur + ' €');
    $('#btc').text('BTC: ' + btc);
  });

  $.get('/orders', function(allOrders) {
    active_orders = _.select(allOrders, function(elem) {
      return elem.fired_date === null;
    });
    console.log(active_orders);
    _.each(active_orders, function(elem) {
      $('#active_list').append('<tr><td>'+ elem.type.toUpperCase() + '</td><td>'+ elem.amount +'</td><td>' + elem.price +'</td><td>'+ elem.issue_date +'</td></tr>');
    });
    fired_orders = _.difference(allOrders, active_orders);
  });
});

$('#submitOrderBtn').click(function() {
  var type = $('#type').val();
  var amount = $('#amount').val();
  var price = $('#price').val();
  $.post('/orders', {"type": type, "amount": amount, "price": price}, function(result) {
    // TODO Print new order in active div table
    console.log('The order has been successfully recorded');
    active_orders.push(result);
    $('#active_list').append('<tr><td>'+ result.type.toUpperCase() + '</td><td>'+ result.amount +'</td><td>' + result.price +'</td><td>'+ result.issue_date +'</td></tr>');
  });
});

function setupMtGoxSocket() {
  var MTGOX_BTCEUR_CHANNELS = {
    trade: 'dbf1dee9-4f2e-4a08-8cb7-748919a71b21',
    depth: '057bdc6b-9f9c-44e4-bc1a-363e4443ce87',
    ticker: '0bb6da8b-f6c6-4ecf-8f0d-a544ad948c15'
  }

  mtgox_socket = io.connect('https://socketio.mtgox.com/mtgox?Currency=EUR');
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.trade });
  mtgox_socket.emit('message', { op: 'unsubscribe', channel: MTGOX_BTCEUR_CHANNELS.depth });

  mtgox_socket.on('message', function(data) {
    if (data.channel_name === 'ticker.BTCEUR') {
      if (buy === null || buy !== data.ticker.buy.value || sell === null || sell !== data.ticker.sell.value) {
        $('#buy_disp').text('BUY: ' + data.ticker.buy.display);
        $('#sell_disp').text('SELL: ' + data.ticker.sell.display);
        $('#btc_val').text('BTC Value: ' + data.ticker.buy.value * btc + ' €');
        $('#comb_val').text('Combined Value: ' + (data.ticker.buy.value * btc + eur) + ' €');
      }
    }
  });
}