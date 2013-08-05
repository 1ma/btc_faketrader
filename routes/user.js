var db = require('../db')
  , collection = 'user';

function validatePrice(input) {
  return (!isNaN(input))? input : null;
}

exports.getBalance = function(req, res) {
  db.findAll(collection, function(err, result) {
    console.log('/user findAll:');
    console.log(result);
    if (err)
      res.send(500, 'Internal server error');
    else
      res.send(200, { eur: result[0].eur, btc: result[0].btc });
  });
};

exports.setBalance = function(req, res) {
  var eur = validatePrice(req.body.eur);
  var btc = validatePrice(req.body.btc);
  if (eur !== null && btc !== null) {
    db.findAll(collection, function(err, result) {
      console.log('/user findAll:');
      console.log(result);
      if (err)
        res.send(500, 'Internal server error');
      var user = result[0];
      user.eur = eur;
      user.btc = btc;
      db.update(collection, user, function(err, result) {
        console.log('/user update:');
        console.log(result);
        if (err || result != 1) {
          res.send(500, 'Internal server error');
        } else {
          db.deleteAll('logs', function(err, result) {
            console.log('/logs deleteAll:');
            console.log(result);
            if (err) {
              res.send(500, 'Internal server error');
            } else {
              db.insert('logs', {date: new Date(), action: null, eur: eur, btc: btc}, function(err, result) {
                console.log('/logs insert:');
                console.log(result);
                if (err)
                  res.send(500, 'Internal server error');
                else
                  res.send(200, 'Ok');
              });
            }
          });
        }
      });
    });
  } else {
    res.send(400, 'Invalid request');
  }
};