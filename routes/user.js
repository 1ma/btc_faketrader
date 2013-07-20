var db = require('../db');

exports.getBalance = function(req, res) {
  db.handler.collection('user', function(err, collection) {
    if (err) {
      res.send(500);
    } else {
      collection.find().toArray(function (err, items) {
        if (err)
          res.send(500);
        else
          res.send(200, { eur: items[0].eur, btc: items[0].btc });
      });
    }
  });
}