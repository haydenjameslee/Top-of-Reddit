var mysql = require('mysql');
var keys = require('./keys');

var pool = mysql.createPool({
  host : 'localhost',
  user : keys.dbUser,
  password : keys.dbPassword,
  database: "reddit",
  connectionLimit: 10
});

function sqlQuery(sql, callback) {
  var params = Array.prototype.slice.call(arguments, 0);
  params = params.slice(2, params.length);
  //get a connection from the pool
  pool.getConnection(function(err, connection) {
    if (err) { console.log(err); callback(true); return; }
    //make the query
    connection.query(sql, params, function(err, results) {
      if (err) { console.log(err); callback(true); return; }
      callback(false, results);
    });
    connection.release();
  });
}

exports.addStory = function (title, link, shortLink, callback) {
  var sql = "INSERT INTO stories (Title, Link, ShortLink) VALUES (?, ?, ?);";
  sqlQuery(sql, callback, title, link, shortLink);
};

exports.incrementStory = function (link, callback) {
  var sql = "UPDATE stories SET NumAtTop = NumAtTop + 1 WHERE Link = ?;";
  sqlQuery(sql, callback, link);
};

exports.getRecentStories = function (callback) {
  var sql = "SELECT * FROM stories ORDER BY `Timestamp` DESC LIMIT 10;";
  sqlQuery(sql, callback);
};
