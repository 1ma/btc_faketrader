var db = require('../db');

exports.addOrder = function(req, res) {
  db.insertOrder(req.body.type, req.body.amount, req.body.price, function(err, order) {
    if (err)
      throw err;
    console.log('Successfuly inserted new order into DB');
    res.send(order);
  });
}

exports.getAllOrders = function(req, res) {
  db.findAllOrders(function(err, allOrders) {
    if (err)
      throw err;
    res.send(allOrders);
  });
}