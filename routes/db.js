var mongo = require('mongodb');
var db;

exports.init = function() {
  mongo.Db.connect('mongodb://localhost:27017/btcft', {auto_reconnect: true}, function(err, handler) {
    if (err)
      throw err;

    db = handler;
  });
};

/*
exports.insert = function (tag, price, callback) {
  var wish = { tag: tag, price: price, date: new Date()};
  db.collection('wishes', function(err, collection) {
    if (err)
      throw err;

    collection.insert(wish, function(err, result) {
      if (err)
        throw err;

      callback("OK");
    });
  });
};

exports.findAll = function(callback) {
  db.collection('wishes', function(err, collection) {
    if (err)
      throw err;

    collection.find().toArray(function (err, items) {
      if (err)
        throw err;

      callback(items);
    });
  });
};*/