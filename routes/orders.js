var db = require('./db');

exports.addOrder = function(req, res) {
  console.log('orders.addOrder invoked: ' + req.body.type + ' ' + req.body.amount + ' ' + req.body.price);
}