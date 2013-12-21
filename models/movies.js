/**
 *  neo4j movie functions
 *  these are mostly written in a functional style
 */


var _ = require('underscore');
var uuid = require('hat'); // generates uuids
var Cypher = require('../neo4j/cypher');
var Movie = require('../models/neo4j/movie');
var async = require('async');
var randomName = require('random-name');


/*
 *  Utility Functions
 */

function _randomName () {
  return randomName.first() + ' ' + randomName.last();
}

function _randomNames (n) {
  return _.times(n, _randomName);
}


/**
 *  Result Functions
 *  to be combined with queries using _.partial()
 */

// return a single movie
var _singleMovie = function (results, callback) {
  if (results.length) {
    callback(null, new Movie(results[0].movie));
  } else {
    callback(null, null);
  }
};

// return many movies
var _manyMovies = function (results, callback) {
  var movies = _.map(results, function (result) {
    return new Movie(result.movie);
  });

  callback(null, movies);
};

// return a count
var _singleCount = function (results, callback) {
  if (results.length) {
    callback(null, {
      count: results[0].c || 0
    });
  } else {
    callback(null, null);
  }
};


/**
 *  Query Functions
 *  to be combined with result functions using _.partial()
 */


var _matchBy = function (keys, params, options, callback) {
  var cypher_params = _.pick(params, keys);

  var query = [
    'MATCH (movie:Movie)',
    Cypher.where('movie', keys),
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _matchById = function (params, options, callback) {
  var cypher_params = {
    n: parseInt(params.id || 1)
  };

  var query = [
    'MATCH (movie:Movie)',
    'WHERE id(movie) = {n}',
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};


var _getByDateRange = function (params, options, callback) {
  var cypher_params = {
    start: parseInt(params.start || 0),
    end: parseInt(params.end || 0)
  };

  var query = [
    'MATCH (movie:Movie)',
    'WHERE movie.released > {start} AND movie.released < {end}',
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _getByActor = function (params, options, callback) {
  var cypher_params = {
    name: params.name
  };

  var query = [
    'MATCH (actor:Person {name: {name} })',
    'MATCH (actor)-[:ACTED_IN]->(movie)', 
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};




var _matchByUUID = Cypher(_matchById, ['id']);
var _matchByTitle = _.partial(_matchBy, ['title']);
var _matchAll = _.partial(_matchBy, []);

// gets n random movies
var _getRandom = function (params, options, callback) {
  var cypher_params = {
    n: parseInt(params.n || 1)
  };

  var query = [
    'MATCH (movie:Movie)',
    'RETURN movie, rand() as rnd',
    'ORDER BY rnd',
    'LIMIT {n}'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _getAllCount = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (movie:Movie)',
    'RETURN COUNT(movie) as c'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _updateName = function (params, options, callback) {
  var cypher_params = {
    id : params.id,
    name : params.name
  };

  var query = [
    'MATCH (movie:Movie {id:{id}})',
    'SET movie.name = {name}',
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};

// creates the movie with cypher
var _create = function (params, options, callback) {
  var cypher_params = {
    id: params.id || uuid(),
    name: params.name
  };

  var query = [
    'MERGE (movie:Movie {name: {name}, id: {id}})',
    'ON CREATE',
    'SET movie.created = timestamp()',
    'ON MATCH',
    'SET movie.lastLogin = timestamp()',
    'RETURN movie'
  ].join('\n');

  callback(null, query, cypher_params);
};

// delete the movie and any relationships with cypher
var _delete = function (params, options, callback) {
  var cypher_params = {
    id: params.id
  };

  var query = [
    'MATCH (movie:Movie {id:{id}})',
    'OPTIONAL MATCH (movie)-[r]-()',
    'DELETE movie, r',
  ].join('\n');
  callback(null, query, cypher_params);
};

// delete all movies
var _deleteAll = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (movie:Movie)',
    'OPTIONAL MATCH (movie)-[r]-()',
    'DELETE movie, r',
  ].join('\n');
  callback(null, query, cypher_params);
};


// exposed functions


// get a single movie by id
var getById = Cypher(_matchById, _singleMovie);

// Get by date range
var getByDateRange = Cypher(_getByDateRange, _manyMovies);

// Get by date range
var getByActor = Cypher(_getByActor, _manyMovies);

// get a single movie by name
var getByTitle = Cypher(_matchByTitle, _singleMovie);

// get a movie by id and update their name
var updateName = Cypher(_updateName, _singleMovie);

// create a new movie
var create = Cypher(_create, _singleMovie);

// create many new movies
var createMany = function (params, options, callback) {
  if (params.names && _.isArray(params.names)) {
    async.map(params.names, function (name, callback) {
      create({name: name}, options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else if (params.movies && _.isArray(params.movies)) {
    async.map(params.movies, function (movie, callback) {
      create(_.pick(movie, 'name', 'id'), options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else {
    callback(null, []);
  }
};

var createRandom = function (params, options, callback) {
  var names = _randomNames(params.n || 1);
  createMany({names: names}, options, callback);
};

// login a movie
var login = create;

// get all movies
var getAll = Cypher(_matchAll, _manyMovies);

// get all movies count
var getAllCount = Cypher(_getAllCount, _singleCount);

// delete a movie by id
var deleteMovie = Cypher(_delete);

// delete a movie by id
var deleteAllMovies = Cypher(_deleteAll);

// reset all movies
var resetMovies = function (params, options, callback) {
  deleteAllMovies(null, options, function (err, response) {
    if (err) return callback(err, response);
    createRandom(params, options, function (err, secondResponse) {
      if (err) return Cypher.mergeRaws(err, [response, secondResponse], callback);
      manyFriendships({
        movies: secondResponse.results,
        friendships: params.friendships
      }, options, function (err, finalResponse) {
        // this doesn't return all the movies, just the ones with friends
        Cypher.mergeRaws(err, [response, secondResponse, finalResponse], callback);
      });
    });
  });
};

// export exposed functions

module.exports = {
  getAll: getAll,
  getById: getById,
  getByTitle: getByTitle,
  getByDateRange: getByDateRange,
  getByActor: getByActor
};