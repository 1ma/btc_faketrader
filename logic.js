var _ = require('underscore');

var buy = null;
var sell = null;
var eur = parseFloat(0);
var btc = parseFloat(0);
var active_orders = [];

var DEBUG = true; // Run processActiveOrders() every time MtGox emits new quotes

exports.init = function(ctx, callback) {
  ctx.db.findAll('orders', function(err, allOrders) {
    if (err) {
      callback(err);
    } else {
      active_orders = _.select(allOrders, function(elem) {
        return elem.fired_date === null;
      });
      ctx.db.findAll('user', function(err, result) {
        if (err)
            callback(err);
        if (result.length === 0) {
          ctx.db.insert('user', { eur: eur, btc: btc }, function(err, result) {
            if (err) {
              callback(err);
            } else {
              console.log('setupLogic: OK');
              callback(null);
            }
          });
        } else {
          eur = parseFloat(result[0].eur);
          btc = parseFloat(result[0].btc);
          console.log('setupLogic: OK');
          callback(null);
        }
      });
    }
  });

  ctx.mtgox_socket.on('message', function(data) {
    if (data.channel_name == 'ticker.BTCEUR') {
      var last_buy = parseFloat(data.ticker.buy.value);
      var last_sell = parseFloat(data.ticker.sell.value);

      console.log( new Date() + ' BUY -> ' + last_buy + ' | SELL -> ' + last_sell);

      if (DEBUG || last_buy != buy || last_sell != sell) {
        buy = last_buy;
        sell = last_sell;
        ctx.db.findAll('orders', function(err, allOrders) {
          if (err) {
            throw err;
          } else {
            active_orders = _.select(allOrders, function(elem) {
              return elem.fired_date === null;
            });
            ctx.db.findAll('user', function(err, userData) {
              if (err)
                throw err;
              var dbEur = parseFloat(userData[0].eur);
              var dbBtc = parseFloat(userData[0].btc);
              eur = (dbEur != eur)? dbEur : eur;
              btc = (dbBtc != btc)? dbBtc : btc;
              processActiveOrders();
            });
          }
        });
      }
    }
  });

  function processActiveOrders() {
    console.log('ProcessActiveOrders()');
    console.log('BUY: ' + buy);
    console.log('SELL: ' + sell);
    console.log('EUR: ' + eur);
    console.log('BTC: ' + btc);
    var updated = false;
    for (var i = 0; i < active_orders.length; ++i) {
      var o = active_orders[i];
      o.amount = parseFloat(o.amount);
      o.price = parseFloat(o.price);
      console.log('Ordre ' + i + ': ' + JSON.stringify(o));
      if (o.type === 'BUY' && o.price >= sell) {
        console.log(' Es compleix la condicio');
        if (sell*o.amount <= eur) {
          console.log('   Es pot executar');
          updated = true;
          // 1. Omplir el camp fired_date amb linstant actual en memoria
          o.fired_date = new Date();
          // 2. Si es una ordre BUY:  EUR -= sell*order.amount; BTC += order.amount;
          eur -= sell*o.amount;
          btc += o.amount;
          console.log('post actualitzacio: ' + eur + ' ' + btc);
          // 3. Actualitzar document a la BD
          ctx.db.update('orders', o, function(err, result) {
            if (err || result != 1)
              throw err;
            // 4. Notificar clients: Passarlis la ID de la ordre que ha saltat, amb socket.io probablement
            ctx.io.sockets.emit('fired_order', { order: o, balance: { eur: eur, btc: btc } });
          });
        }
      }
      if (o.type === 'SELL' && o.price <= buy) {
        console.log(' Es compleix la condicio');
        if (o.amount <= btc) {
          console.log('   Es pot executar');
          updated = true;
          // 1. Omplir el camp fired_date amb linstant actual en memoria
          o.fired_date = new Date();
          // 2. Si es una ordre SELL: EUR += buy*order.amount; BTC -= order.amount;
          eur += buy*o.amount;
          btc -= o.amount;
          // 3. Actualitzar document a la BD
          ctx.db.update('orders', o, function(err, result) {
            if (err || result != 1)
              throw err;
            // 4. Notificar clients: Passarlis la ID de la ordre que ha saltat, amb socket.io probablement
            ctx.io.sockets.emit('fired_order', { order: o, balance: { eur: eur, btc: btc } });
          });
        }
      }
    }
    if (updated) {
      ctx.db.findAll('user', function(err, user) {
        if (err)
          throw err;
        user[0].eur = eur;
        user[0].btc = btc;
        ctx.db.update('user', user[0], function(err, result) {
          if (err || result != 1)
            throw err;
        });
      });
    }
  }
};