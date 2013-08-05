var db = require('../db')
  , collection = 'logs';

exports.getAllLogs = function(req, res) {
  db.findAll(collection, function(err, allOrders) {
    console.log('/logs findAll:');
    console.log(allLogs);
    if (err)
      res.send(500, 'Internal server error');
    else
      res.send(200, allLogs);
  });
};