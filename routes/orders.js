var db = require('../db');

function validateType(input) {
  return (input === 'buy' || input === 'sell')? input : null;
}

function validateAmount(input) {
  return (!isNaN(input))? input : null;
}

function validatePrice(input) {
  return (!isNaN(input))? input : null;
}

exports.addOrder = function(req, res) {
  var type = validateType(req.body.type);
  var amount = validateAmount(req.body.amount);
  var price = validatePrice(req.body.price);
  if (type !== null && amount !== null && price !== null) {
    var order = { type: type, amount: amount, price: price, issue_date: new Date(), fired_date: null };
    db.handler.collection('orders', function(err, collection) {
      if (err) {
        res.send(500);
      } else {
        collection.insert(order, function(err, result) {
          if (err)
            res.send(500);
          else
            res.send(200, result[0]);
        });
      }
    });
  } else {
    res.send(400);
  }
}

exports.getAllOrders = function(req, res) {
  db.handler.collection('orders', function(err, collection) {
    if (err) {
      res.send(500);
    } else {
      collection.find().toArray(function (err, items) {
        if (err)
          res.send(500);
        else
          res.send(200, items);
      });
    }
  });
}