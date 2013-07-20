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
    db.insertOrder(type, amount, price, function(err, order) {
      if (err)
        throw err;
      console.log('Successfuly inserted new order into DB');
      console.log(order);
      res.send(order);
    });
  } else {
    console.log('Invalid request for orders.addOrder');
  }
}

exports.getAllOrders = function(req, res) {
  db.findAllOrders(function(err, allOrders) {
    if (err)
      throw err;
    res.send(allOrders);
  });
}