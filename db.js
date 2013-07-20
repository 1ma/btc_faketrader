var mongo = require('mongodb');
var db;

exports.init = function(ctx, callback) {
  var settings = ctx.settings;
  mongo.Db.connect('mongodb://' + settings.db.host + ':' + settings.db.port + '/' + settings.db.name, {auto_reconnect: true}, function(err, handler) {
    if (err)
      callback(err);
    exports.db = db = handler;
    console.log('setupDB: OK');
    callback(null);
  });
};

exports.insertOrder = function (type, amount, price, callback) {
  var order = { type: type, amount: amount, price: price, issue_date: new Date(), fired_date: null };
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