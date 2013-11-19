// neo4j cypher helper module

var db = require('./index')
, _ = require('underscore')
;

// Cypher
// for creating cypher queries and processing the results
var Cypher = function (queryFn, resultsFn) {
  return function (params, options, callback) {
    queryFn(params, options, function (err, query, cypher_params) {
      if (err) return callback(err);
      db.query(query, cypher_params, function (err, results) {
        if (err || !results.length || !_.isFunction(resultsFn)) return callback(err);
        resultsFn(results, callback);
      });
    });
  };
};


/**
 *  Util Functions
 */

var _whereTemplate = _.template('<%= nodeVar %>.<%= key %>={<%= key %>}');

Cypher.where = function (nodeVar, keys) {
  if (keys && keys.length) {
    return 'WHERE '+_.map(keys, function (key) {
      return _whereTemplate({nodeVar: nodeVar, key: key});
    }).join(' AND ');
  }
};

module.exports = Cypher;