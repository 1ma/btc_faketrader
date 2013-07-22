var db = require('../db')
  , collection = 'users';

function validateType(input) {
  return (input === 'BUY' || input === 'SELL')? input : null;
}

function validateAmount(input) {
  return (!isNaN(input))? input : null;
}

function validatePrice(input) {
  return (!isNaN(input))? input : null;
}

exports.getAllOrders = function(req, res) {
  db.findAll(collection, function(err, allOrders) {
    console.log('/orders findAll:');
    console.log(allOrders);
    if (err)
      res.send(500, 'DB Error!');
    else
      res.send(200, allOrders);
  });
}

exports.addOrder = function(req, res) {
  var type   = validateType(req.body.type);
  var amount = validateAmount(req.body.amount);
  var price  = validatePrice(req.body.price);
  if (type !== null && amount !== null && price !== null) {
    var order = { type: type, amount: amount, price: price, issue_date: new Date(), fired_date: null };
    db.insert(collection, order, function(err, result) {
      console.log('/orders insert:');
      console.log(result);
      if (err)
        res.send(500, 'Internal server error');
      else
        res.send(200, result[0]);   // TODO Canviar a result[0]._id
    });
  } else {
    res.send(400, 'Invalid request');
  }
}