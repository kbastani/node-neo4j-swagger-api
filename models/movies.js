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

// // returns a movie and a friend
// var _singleMovieWithFriend = function (results, callback) {
//   if (!results.length) return callback();
//   callback(null, {
//     movie: new Movie(results[0].movie),
//     friend: new Movie(results[0].friend)
//   });
// };

// // returns a movie and their friends from a cypher result
// var _parseMovieWithFriends = function (result) {
//   var movie = new Movie(result.movie);
//   var friends = _.map(result.friends, function (friend) {
//     return new Movie(friend);
//   });
//   movie.friends(friends);
//   return movie;
// };

// // returns a movie and their friends
// var _singleMovieWithFriends = function (results, callback) {
//   callback(null, _parseMovieWithFriends(results[0]));
// };

// // returns a movie and their friends and friends of friends
// var _singleMovieWithFriendsAndFOF = function (results, callback) {
//   if (!results.length) return callback();

//   var movie = new Movie(results[0].movie);
//   movie.friends = _.chain(results).map(function (result) {
//     if (result.friend) {
//       var friend = new Movie(result.friend);
//       friend.friends = _.map(result.fofs, function (fof) {
//         return new Movie(fof);
//       });
//       return friend;
//     }
//   }).compact().value();
//   callback(null, movie);
// };

// // returns a movie and their friends of friends
// var _singleMovieWithFOF = function (results, callback) {
//   if (!results.length) return callback();

//   var movie = new Movie(results[0].movie);
//   movie.fof = _.map(results[0].fofs, function (fof) {
//     return new Movie(fof);
//   });
//   callback(null, movie);
// };

// // returns many movies and their friends
// var _manyMoviesWithFriends = function (results, callback) {
//   var movies = _.map(results, _parseMovieWithFriends);
//   callback(null, movies);
// };

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

var _matchByUUID = _.partial(_matchBy, ['id']);
var _matchByName = _.partial(_matchBy, ['name']);
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

// // gets n random movies with friends
// var _getRandomWithFriends = function (params, options, callback) {
//   var cypher_params = {
//     n: parseInt(params.n || 1)
//   };

//   var query = [
//     'MATCH (movie:Movie)',
//     'WITH movie, rand() as rnd',
//     'ORDER BY rnd',
//     'LIMIT {n}',
//     'OPTIONAL MATCH (movie)-[r:friend]-(friend:Movie)',
//     'RETURN movie, COLLECT(friend) as friends'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };


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

// creates many movies with cypher
// var _createMany = function (params, options, callback) {
//   var movies = _.map(params.movies, function (movie) {
//     return {
//       id: movie.id || uuid(),
//       name: movie.name
//     };
//   });

//   var cypher_params = {
//     movies: movies
//   };

//   var query = [
//     'MERGE (movie:Movie {name: {movies}.name, id: {movies}.id})',
//     'ON CREATE',
//     'SET movie.created = timestamp()',
//     'ON MATCH',
//     'SET movie.lastLogin = timestamp()',
//     'RETURN movie'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };

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


// // friend the movie
// var _friend = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     friend_id: params.friend_id
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}}), (friend:Movie {id:{friend_id}})',
//     'WHERE NOT((movie)-[:friend]-(friend)) AND NOT(movie = friend)',
//     'CREATE (movie)-[:friend {created: timestamp()}]->(friend)',
//     'RETURN movie, friend'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // friend random movie
// var _friendRandom = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     n: params.n
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}}), (friend:Movie)',
//     'WHERE NOT((movie)-[:friend]-(friend)) AND NOT(movie = friend)',
//     'WITH movie, friend, rand() as rnd',
//     'ORDER BY rnd',
//     'LIMIT {n}',
//     'CREATE (movie)-[:friend {created: timestamp()}]->(friend)',
//     'RETURN movie, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // unfriend the movie
// var _unfriend = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     friend_id: params.friend_id
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}})-[r:friend]-(friend:Movie {id:{friend_id}})',
//     'DELETE r',
//     'RETURN movie, friend'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends
// var _matchWithFriends = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}})',
//     'OPTIONAL MATCH (movie)-[r:friend]-(friend:Movie)',
//     'RETURN movie, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends and friends of friends (FOF)
// var _matchWithFriendsAndFOF = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}})',
//     'OPTIONAL MATCH (movie)-[:friend]-(friend:Movie)',
//     'OPTIONAL MATCH (friend:Movie)-[:friend]-(fof:Movie)',
//     'WHERE NOT(movie=fof)',
//     'RETURN movie, friend, COLLECT(fof) as fofs'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends of friends (FOF)
// var _matchWithFOF = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (movie:Movie {id:{id}})',
//     'OPTIONAL MATCH (movie)-[:friend]-(friend:Movie)',
//     'OPTIONAL MATCH (friend:Movie)-[:friend]-(fof:Movie)',
//     'WHERE NOT(movie=fof)',
//     'RETURN movie, COLLECT(DISTINCT fof) as fofs'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match all with friends
// var _matchAllWithFriends = function (params, options, callback) {
//   var cypher_params = {};

//   var query = [
//     'MATCH (movie:Movie)',
//     'OPTIONAL MATCH (movie)-[r:friend]-(friend:Movie)',
//     'RETURN movie, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };



// exposed functions


// get a single movie by id
var getById = Cypher(_matchByUUID, _singleMovie);

// get a single movie by name
var getByName = Cypher(_matchByName, _singleMovie);

// get n random movies
var getRandom = Cypher(_getRandom, _manyMovies);

// // get n random movies
// var getRandomWithFriends = Cypher(_getRandomWithFriends, _manyMoviesWithFriends);

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

// // friend a movie by id
// var friendMovie = Cypher(_friend, _singleMovieWithFriend);

// // friend random movies
// var friendRandomMovie = Cypher(_friendRandom, _singleMovieWithFriends);

// // creates n new friendships between movies
// var manyFriendships = function (params, options, callback) {
//   // number of friendships to create
//   var friendships = parseInt(params.friendships || params.n || 1, 10);

//   // movie params
//   var movies = _.map(params.movies, function (movie) {
//     return {
//       id: movie.id || movie,
//       n: 0
//     };
//   });
//   var length = movies.length;

//   // randomly distribute friendships between movies
//   while (length && friendships>0) {
//     friendships--;
//     movies[Math.floor(Math.random()*length)].n++;
//   }

//   movies = _.filter(movies, function (movie) {
//     return movie.n > 0;
//   });

//   // this should be syncronous if we want to ensure no duplicates/deadlocks
//   async.mapSeries(movies, function (movie, callback) {
//     friendRandomMovie(movie, options, callback);
//   }, function (err, responses) {
//     Cypher.mergeReponses(err, responses, callback);
//   });
// };

// // creates many friendships between random movies
// var manyRandomFriendships = function (params, options, callback) {
//   getRandom(params, options, function (err, response) {
//     if (err) return callback(err, response);
//     manyFriendships({
//       movies: response.results,
//       friendships: params.friendships || params.n
//     }, options, function (err, finalResponse) {
//       Cypher.mergeRaws(err, [response, finalResponse], callback);
//     });
//   });
// };

// // unfriend a movie by id
// var unfriendMovie = Cypher(_unfriend, _singleMovieWithFriend);

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

// // get a single movie by id and all friends
// var getWithFriends = Cypher(_matchWithFriends, _singleMovieWithFriends);

// // get a single movie by id and all friends and friends of friends
// var getWithFriendsAndFOF = Cypher(_matchWithFriendsAndFOF, _singleMovieWithFriendsAndFOF);

// // get a single movie by id and all friends of friends
// var getWithFOF = Cypher(_matchWithFOF, _singleMovieWithFOF);

// // get all movies and all friends
// var getAllWithFriends = Cypher(_matchAllWithFriends, _manyMoviesWithFriends);



// export exposed functions

module.exports = {
  getById: getById,
  getByName: getByName,
  getRandom: getRandom,
  getAll: getAll,
  getAllCount: getAllCount,
  deleteMovie: deleteMovie,
  deleteAllMovies: deleteAllMovies,
  resetMovies: resetMovies
};