var _ = require('underscore');
var DEBUG = true; // Run processActiveOrders() every time MtGox emits data

exports.init = function(ctx, callback) {
  ctx.logic = {};
  ctx.logic.buy = null;
  ctx.logic.sell = null;

  ctx.db.findAll('orders', function(err, allOrders) {
    if (err) {
      callback(err);
    } else {
      ctx.logic.active_orders = _.select(allOrders, function(elem) {
        return elem.fired_date === null;
      });
      ctx.db.findAll('user', function(err, result) {
        if (err)
            callback(err);
        if (result.length === 0) {
          ctx.db.insert('user', { eur: 0, btc: 0 }, function(err, result) {
            if (err === null) {
              ctx.logic.eur = parseFloat(0);
              ctx.logic.btc = parseFloat(0);
              console.log('setupLogic: OK');
            }
            callback(err);
          });
        } else {
          ctx.logic.eur = parseFloat(result[0].eur);
          ctx.logic.btc = parseFloat(result[0].btc);
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

      if (DEBUG || last_buy != ctx.logic.buy || last_sell != ctx.logic.sell) {
        ctx.logic.buy = last_buy;
        ctx.logic.sell = last_sell;
        ctx.db.findAll('orders', function(err, allOrders) {
          if (err) {
            throw err;
          } else {
            ctx.logic.active_orders = _.select(allOrders, function(elem) {
              return elem.fired_date === null;
            });
            ctx.db.findAll('user', function(err, userData) {
              if (err)
                throw err;
              var dbEur = parseFloat(userData[0].eur);
              var dbBtc = parseFloat(userData[0].btc);
              ctx.logic.eur = (dbEur != ctx.logic.eur)? dbEur : ctx.logic.eur;
              ctx.logic.btc = (dbBtc != ctx.logic.btc)? dbBtc : ctx.logic.btc;
              processActiveOrders();
            });
          }
        });
      }
    }
  });

  function processActiveOrders() {
    console.log('ProcessActiveOrders()');
    console.log('BUY: ' + ctx.logic.buy);
    console.log('SELL: ' + ctx.logic.sell);
    console.log('EUR: ' + ctx.logic.eur);
    console.log('BTC: ' + ctx.logic.btc);
    var updated = false;
    for (var i = 0; i < ctx.logic.active_orders.length; ++i) {
      var o = ctx.logic.active_orders[i];
      o.amount = parseFloat(o.amount);
      o.price = parseFloat(o.price);
      console.log('Ordre ' + i + ': ' + JSON.stringify(o));
      if (o.type === 'BUY' && o.price >= ctx.logic.sell) {
        console.log(' Es compleix la condicio');
        if (ctx.logic.sell*o.amount <= ctx.logic.eur) {
          console.log('   Es pot executar');
          updated = true;
          // 1. Omplir el camp fired_date amb linstant actual en memoria
          o.fired_date = new Date();
          // 2. Si es una ordre BUY:  EUR -= ctx.logic.sell*order.amount; BTC += order.amount;
          ctx.logic.eur -= ctx.logic.sell*o.amount;
          ctx.logic.btc += o.amount;
          console.log('post actualitzacio: ' + ctx.logic.eur + ' ' + ctx.logic.btc);
          // 3. Actualitzar document a la BD
          ctx.db.update('orders', o, function(err, result) {
            if (err || result != 1)
              throw err;
            // 4. Notificar clients: Passarlis la ID de la ordre que ha saltat, amb socket.io probablement
            // Nota interessant: En el moment de definir aquesta crida ctx.io encara es undefined, pero estara
            // setejada correctament quan s'acabi d'inicialitzar el servidor i es comenci a executar el listener
            ctx.io.sockets.emit('fired_order', { order: o, balance: { eur: ctx.logic.eur, btc: ctx.logic.btc } });
          });
        }
      }
      if (o.type === 'SELL' && o.price <= ctx.logic.buy) {
        console.log(' Es compleix la condicio');
        if (o.amount <= ctx.logic.btc) {
          console.log('   Es pot executar');
          updated = true;
          // 1. Omplir el camp fired_date amb linstant actual en memoria
          o.fired_date = new Date();
          // 2. Si es una ordre SELL: EUR += ctx.logic.buy*order.amount; BTC -= order.amount;
          ctx.logic.eur += ctx.logic.buy*o.amount;
          ctx.logic.btc -= o.amount;
          // 3. Actualitzar document a la BD
          ctx.db.update('orders', o, function(err, result) {
            if (err || result != 1)
              throw err;
            // 4. Notificar clients: Passarlis la ID de la ordre que ha saltat, amb socket.io probablement
            ctx.io.sockets.emit('fired_order', { order: o, balance: { eur: ctx.logic.eur, btc: ctx.logic.btc } });
          });
        }
      }
    }
    if (updated) {
      ctx.db.findAll('user', function(err, user) {
        if (err)
          throw err;
        user[0].eur = ctx.logic.eur;
        user[0].btc = ctx.logic.btc;
        ctx.db.update('user', user[0], function(err, result) {
          if (err || result != 1)
            throw err;
        });
      });
    }
  }
};