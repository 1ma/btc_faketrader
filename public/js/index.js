var eur
  , btc
  , buy
  , sell
  , active_orders
  , fired_orders
  , mtgox_socket
  , btcft_socket;

$(document).ready(function() {
  setupMtGoxSocket();
  setupBtcftSocket();

  $.get('/user', function(data) {
    eur = parseFloat(data.eur);
    btc = parseFloat(data.btc);
    reprintBalance();
  });

  $.get('/logs', function(allLogs) {
    _.each(allLogs, function(elem) {
      $('#log_list').append('<tr id="'+ elem._id +'"><td>'+ elem.date + '</td><td>'+ 'Starting balance' +'</td><td>' + elem.eur +'</td><td>'+ '-' +'</td><td>'+ elem.btc +'</td><td>'+ '-' +'</td></tr>');
    });
  });

  $.get('/orders', function(allOrders) {
    active_orders = _.select(allOrders, function(elem) {
      return elem.fired_date === null;
    });
    _.each(active_orders, function(elem) {
      attachActiveOrder(elem);
    });
    fired_orders = _.difference(allOrders, active_orders);
    _.each(fired_orders, function(elem) {
      attachFiredOrder(elem);
    });
  });
});

$('#submitOrderBtn').click(function() {
  var type = $('#type').val();
  var amount = $('#amount').val();
  var price = $('#price').val();
  $.post('/orders', {"type": type, "amount": amount, "price": price}, function(data) {
    active_orders.push(data);
    $('#amount').val('');
    $('#price').val('');
    $('#active_list').append('<tr id="'+ data._id +'"><td>'+ data.type + '</td><td>'+ data.amount +'</td><td>' + data.price +'</td><td>'+ data.issue_date +'</td></tr>');
  });
});

$('#submitBalanceBtn').click(function() {
  var newEur = $('#edit_eur').val();
  var newBtc = $('#edit_btc').val();
  $.post('/user', {"eur": newEur, "btc": newBtc}, function(result) {
    eur = parseFloat(newEur);
    btc = parseFloat(newBtc);
    reprintBalance();
    $.get('/logs', function(log) {
      $('#log_list').find('tr:gt(0)').remove();
      $('#log_list').append('<tr id="'+ log[0]._id +'"><td>'+ log[0].date + '</td><td>'+ 'Starting balance' +'</td><td>' + log[0].eur +'</td><td>'+ '-' +'</td><td>'+ log[0].btc +'</td><td>'+ '-' +'</td></tr>');
    });
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
        var comb_value = data.ticker.buy.value*btc + new Number(eur);
        $('#buy_disp').text('BUY: ' + data.ticker.buy.display);
        $('#sell_disp').text('SELL: ' + data.ticker.sell.display);
        $('#btc_val').text('BTC Value: ' + data.ticker.buy.value * btc + ' €');
        $('#comb_val').text('Combined Value: ' + comb_value + ' €');
      }
    }
  });
}

function reprintBalance() {
  $('#eur').text('EUR: ' + eur + ' €');
  $('#btc').text('BTC: ' + btc);
  $('#edit_eur').val(eur);
  $('#edit_btc').val(btc);
}

function attachActiveOrder(order) {
  $('#active_list').append('<tr id="'+ order._id +'"><td>'+ order.type + '</td><td>'+ order.amount +'</td><td>' + order.price +'</td><td>'+ order.issue_date +'</td></tr>');
}

function attachFiredOrder(order) {
  $('#fired_list').append('<tr id="'+ order._id +'"><td>'+ order.type + '</td><td>'+ order.amount +'</td><td>' + order.price +'</td><td>'+ order.issue_date +'</td><td>' + order.fired_date +'</td></tr>');
}

function setupBtcftSocket() {
  btcft_socket = io.connect('http://localhost');
  btcft_socket.on('fired_order', function(data) {
    eur = parseFloat(data.balance.eur);
    btc = parseFloat(data.balance.btc);
    var done = false;
    for (var i = 0; i < active_orders.length && !done; ++i) {
      if (data.order._id === active_orders[i]._id) {
        $('#'+active_orders[i]._id).remove();
        delete active_orders[i];
        active_orders = _.compact(active_orders);
        done = true;
      }
    }
    fired_orders.push(data.order);
    attachFiredOrder(data.order);
    reprintBalance();
  });
}