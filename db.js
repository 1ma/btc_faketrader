var mongo = require('mongodb')
  , db;

exports.init = function(ctx, callback) {
  var settings = ctx.settings;
  mongo.Db.connect('mongodb://' + settings.db.host + ':' + settings.db.port + '/' + settings.db.name, {auto_reconnect: true}, function(err, handler) {
    if (err === null) {
      console.log('setupDB: OK');
      db = handler;
      ctx.db = exports;
    }
    callback(err);
  });
};

exports.findAll = function(collection, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.find().toArray(function(err, items) {
      callback(err, items);
    });
  });
};

exports.findById = function(collection, id, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.find({ '_id': id }, function(err, document) {
      callback(err, document);
    });
  });
};

exports.insert = function(collection, document, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.insert(document, { safe: true }, function(err, result) {
      callback(err, result);
    });
  });
};

exports.update = function(collection, document, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.update({ '_id': document._id }, document, { safe: true }, function(err, result) {
      callback(err, result);
    });
  });
};

exports.deleteById = function(collection, id, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.remove({ '_id': id }, { safe: true }, function(err, result) {
      callback(err, result);
    });
  });
};

exports.deleteAll = function(collection, callback) {
  db.collection(collection, function(err, collectionHandler) {
    if (err)
      callback(err, null);
    collectionHandler.remove(null, { safe: true }, function(err, result) {
      callback(err, result);
    });
  });
};
