var mongo = require('mongodb');
var db;

exports.init = function() {
  mongo.Db.connect('mongodb://localhost:27017/btcft', {auto_reconnect: true}, function(err, handler) {
    if (err)
      throw err;
    db = handler;
  });
};

exports.insertOrder = function (type, amount, price, callback) {
  var order = { type: type, amount: amount, price: price, issue_date: new Date(), fired_date: null};
  db.collection('orders', function(err, collection) {
    if (err)
      callback(err, null);
    collection.insert(order, function(err, result) {
      callback(err, result);
    });
  });
};

exports.findAllOrders = function(callback) {
  db.collection('orders', function(err, collection) {
    if (err)
      callback(err, null);
    collection.find().toArray(function (err, items) {
      callback(err, items);
    });
  });
};