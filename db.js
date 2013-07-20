var mongo = require('mongodb');
var db;

exports.init = function(ctx, callback) {
  var settings = ctx.settings;
  mongo.Db.connect('mongodb://' + settings.db.host + ':' + settings.db.port + '/' + settings.db.name, {auto_reconnect: true}, function(err, handler) {
    if (err === null) {
      console.log('setupDB: OK');
      exports.handler = db = handler;
    }
    callback(err);
  });
};

exports.getAllOrders = function(callback) {
  db.collection('orders', function(err, collection) {
    if (err)
      callback(err, null);
    collection.find().toArray(function (err, items) {
      callback(err, items);
    });
  });
};