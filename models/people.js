/**
 *  neo4j person functions
 *  these are mostly written in a functional style
 */


var _ = require('underscore');
var uuid = require('hat'); // generates uuids
var Cypher = require('../neo4j/cypher');
var Person = require('../models/neo4j/person');
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

// return a single person
var _singlePerson = function (results, callback) {
  if (results.length) {
    callback(null, new Person(results[0].person));
  } else {
    callback(null, null);
  }
};

// return many people
var _manyPersons = function (results, callback) {
  var people = _.map(results, function (result) {
    return new Person(result.person);
  });

  callback(null, people);
};

// // returns a person and a friend
// var _singlePersonWithFriend = function (results, callback) {
//   if (!results.length) return callback();
//   callback(null, {
//     person: new Person(results[0].person),
//     friend: new Person(results[0].friend)
//   });
// };

// // returns a person and their friends from a cypher result
// var _parsePersonWithFriends = function (result) {
//   var person = new Person(result.person);
//   var friends = _.map(result.friends, function (friend) {
//     return new Person(friend);
//   });
//   person.friends(friends);
//   return person;
// };

// // returns a person and their friends
// var _singlePersonWithFriends = function (results, callback) {
//   callback(null, _parsePersonWithFriends(results[0]));
// };

// // returns a person and their friends and friends of friends
// var _singlePersonWithFriendsAndFOF = function (results, callback) {
//   if (!results.length) return callback();

//   var person = new Person(results[0].person);
//   person.friends = _.chain(results).map(function (result) {
//     if (result.friend) {
//       var friend = new Person(result.friend);
//       friend.friends = _.map(result.fofs, function (fof) {
//         return new Person(fof);
//       });
//       return friend;
//     }
//   }).compact().value();
//   callback(null, person);
// };

// // returns a person and their friends of friends
// var _singlePersonWithFOF = function (results, callback) {
//   if (!results.length) return callback();

//   var person = new Person(results[0].person);
//   person.fof = _.map(results[0].fofs, function (fof) {
//     return new Person(fof);
//   });
//   callback(null, person);
// };

// // returns many people and their friends
// var _manyPersonsWithFriends = function (results, callback) {
//   var people = _.map(results, _parsePersonWithFriends);
//   callback(null, people);
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
    'MATCH (person:Person)',
    Cypher.where('person', keys),
    'RETURN person'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _matchByUUID = _.partial(_matchBy, ['id']);
var _matchByName = _.partial(_matchBy, ['name']);
var _matchAll = _.partial(_matchBy, []);

// gets n random people
var _getRandom = function (params, options, callback) {
  var cypher_params = {
    n: parseInt(params.n || 1)
  };

  var query = [
    'MATCH (person:Person)',
    'RETURN person, rand() as rnd',
    'ORDER BY rnd',
    'LIMIT {n}'
  ].join('\n');

  callback(null, query, cypher_params);
};

// // gets n random people with friends
// var _getRandomWithFriends = function (params, options, callback) {
//   var cypher_params = {
//     n: parseInt(params.n || 1)
//   };

//   var query = [
//     'MATCH (person:Person)',
//     'WITH person, rand() as rnd',
//     'ORDER BY rnd',
//     'LIMIT {n}',
//     'OPTIONAL MATCH (person)-[r:friend]-(friend:Person)',
//     'RETURN person, COLLECT(friend) as friends'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };


var _getAllCount = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (person:Person)',
    'RETURN COUNT(person) as c'
  ].join('\n');

  callback(null, query, cypher_params);
};

var _updateName = function (params, options, callback) {
  var cypher_params = {
    id : params.id,
    name : params.name
  };

  var query = [
    'MATCH (person:Person {id:{id}})',
    'SET person.name = {name}',
    'RETURN person'
  ].join('\n');

  callback(null, query, cypher_params);
};

// creates the person with cypher
var _create = function (params, options, callback) {
  var cypher_params = {
    id: params.id || uuid(),
    name: params.name
  };

  var query = [
    'MERGE (person:Person {name: {name}, id: {id}})',
    'ON CREATE',
    'SET person.created = timestamp()',
    'ON MATCH',
    'SET person.lastLogin = timestamp()',
    'RETURN person'
  ].join('\n');

  callback(null, query, cypher_params);
};

// creates many people with cypher
// var _createMany = function (params, options, callback) {
//   var people = _.map(params.people, function (person) {
//     return {
//       id: person.id || uuid(),
//       name: person.name
//     };
//   });

//   var cypher_params = {
//     people: people
//   };

//   var query = [
//     'MERGE (person:Person {name: {people}.name, id: {people}.id})',
//     'ON CREATE',
//     'SET person.created = timestamp()',
//     'ON MATCH',
//     'SET person.lastLogin = timestamp()',
//     'RETURN person'
//   ].join('\n');

//   callback(null, query, cypher_params);
// };

// delete the person and any relationships with cypher
var _delete = function (params, options, callback) {
  var cypher_params = {
    id: params.id
  };

  var query = [
    'MATCH (person:Person {id:{id}})',
    'OPTIONAL MATCH (person)-[r]-()',
    'DELETE person, r',
  ].join('\n');
  callback(null, query, cypher_params);
};

// delete all people
var _deleteAll = function (params, options, callback) {
  var cypher_params = {};

  var query = [
    'MATCH (person:Person)',
    'OPTIONAL MATCH (person)-[r]-()',
    'DELETE person, r',
  ].join('\n');
  callback(null, query, cypher_params);
};


// // friend the person
// var _friend = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     friend_id: params.friend_id
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}}), (friend:Person {id:{friend_id}})',
//     'WHERE NOT((person)-[:friend]-(friend)) AND NOT(person = friend)',
//     'CREATE (person)-[:friend {created: timestamp()}]->(friend)',
//     'RETURN person, friend'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // friend random person
// var _friendRandom = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     n: params.n
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}}), (friend:Person)',
//     'WHERE NOT((person)-[:friend]-(friend)) AND NOT(person = friend)',
//     'WITH person, friend, rand() as rnd',
//     'ORDER BY rnd',
//     'LIMIT {n}',
//     'CREATE (person)-[:friend {created: timestamp()}]->(friend)',
//     'RETURN person, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // unfriend the person
// var _unfriend = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id,
//     friend_id: params.friend_id
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}})-[r:friend]-(friend:Person {id:{friend_id}})',
//     'DELETE r',
//     'RETURN person, friend'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends
// var _matchWithFriends = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}})',
//     'OPTIONAL MATCH (person)-[r:friend]-(friend:Person)',
//     'RETURN person, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends and friends of friends (FOF)
// var _matchWithFriendsAndFOF = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}})',
//     'OPTIONAL MATCH (person)-[:friend]-(friend:Person)',
//     'OPTIONAL MATCH (friend:Person)-[:friend]-(fof:Person)',
//     'WHERE NOT(person=fof)',
//     'RETURN person, friend, COLLECT(fof) as fofs'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match with friends of friends (FOF)
// var _matchWithFOF = function (params, options, callback) {
//   var cypher_params = {
//     id: params.id
//   };

//   var query = [
//     'MATCH (person:Person {id:{id}})',
//     'OPTIONAL MATCH (person)-[:friend]-(friend:Person)',
//     'OPTIONAL MATCH (friend:Person)-[:friend]-(fof:Person)',
//     'WHERE NOT(person=fof)',
//     'RETURN person, COLLECT(DISTINCT fof) as fofs'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };

// // match all with friends
// var _matchAllWithFriends = function (params, options, callback) {
//   var cypher_params = {};

//   var query = [
//     'MATCH (person:Person)',
//     'OPTIONAL MATCH (person)-[r:friend]-(friend:Person)',
//     'RETURN person, COLLECT(friend) as friends'
//   ].join('\n');
//   callback(null, query, cypher_params);
// };



// exposed functions


// get a single person by id
var getById = Cypher(_matchByUUID, _singlePerson);

// get a single person by name
var getByName = Cypher(_matchByName, _singlePerson);

// get n random people
var getRandom = Cypher(_getRandom, _manyPersons);

// // get n random people
// var getRandomWithFriends = Cypher(_getRandomWithFriends, _manyPersonsWithFriends);

// get a person by id and update their name
var updateName = Cypher(_updateName, _singlePerson);

// create a new person
var create = Cypher(_create, _singlePerson);

// create many new people
var createMany = function (params, options, callback) {
  if (params.names && _.isArray(params.names)) {
    async.map(params.names, function (name, callback) {
      create({name: name}, options, callback);
    }, function (err, responses) {
      Cypher.mergeReponses(err, responses, callback);
    });
  } else if (params.people && _.isArray(params.people)) {
    async.map(params.people, function (person, callback) {
      create(_.pick(person, 'name', 'id'), options, callback);
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

// login a person
var login = create;

// get all people
var getAll = Cypher(_matchAll, _manyPersons);

// get all people count
var getAllCount = Cypher(_getAllCount, _singleCount);

// // friend a person by id
// var friendPerson = Cypher(_friend, _singlePersonWithFriend);

// // friend random people
// var friendRandomPerson = Cypher(_friendRandom, _singlePersonWithFriends);

// // creates n new friendships between people
// var manyFriendships = function (params, options, callback) {
//   // number of friendships to create
//   var friendships = parseInt(params.friendships || params.n || 1, 10);

//   // person params
//   var people = _.map(params.people, function (person) {
//     return {
//       id: person.id || person,
//       n: 0
//     };
//   });
//   var length = people.length;

//   // randomly distribute friendships between people
//   while (length && friendships>0) {
//     friendships--;
//     people[Math.floor(Math.random()*length)].n++;
//   }

//   people = _.filter(people, function (person) {
//     return person.n > 0;
//   });

//   // this should be syncronous if we want to ensure no duplicates/deadlocks
//   async.mapSeries(people, function (person, callback) {
//     friendRandomPerson(person, options, callback);
//   }, function (err, responses) {
//     Cypher.mergeReponses(err, responses, callback);
//   });
// };

// // creates many friendships between random people
// var manyRandomFriendships = function (params, options, callback) {
//   getRandom(params, options, function (err, response) {
//     if (err) return callback(err, response);
//     manyFriendships({
//       people: response.results,
//       friendships: params.friendships || params.n
//     }, options, function (err, finalResponse) {
//       Cypher.mergeRaws(err, [response, finalResponse], callback);
//     });
//   });
// };

// // unfriend a person by id
// var unfriendPerson = Cypher(_unfriend, _singlePersonWithFriend);

// delete a person by id
var deletePerson = Cypher(_delete);

// delete a person by id
var deleteAllPersons = Cypher(_deleteAll);

// reset all people
var resetPersons = function (params, options, callback) {
  deleteAllPersons(null, options, function (err, response) {
    if (err) return callback(err, response);
    createRandom(params, options, function (err, secondResponse) {
      if (err) return Cypher.mergeRaws(err, [response, secondResponse], callback);
      manyFriendships({
        people: secondResponse.results,
        friendships: params.friendships
      }, options, function (err, finalResponse) {
        // this doesn't return all the people, just the ones with friends
        Cypher.mergeRaws(err, [response, secondResponse, finalResponse], callback);
      });
    });
  });
};

// // get a single person by id and all friends
// var getWithFriends = Cypher(_matchWithFriends, _singlePersonWithFriends);

// // get a single person by id and all friends and friends of friends
// var getWithFriendsAndFOF = Cypher(_matchWithFriendsAndFOF, _singlePersonWithFriendsAndFOF);

// // get a single person by id and all friends of friends
// var getWithFOF = Cypher(_matchWithFOF, _singlePersonWithFOF);

// // get all people and all friends
// var getAllWithFriends = Cypher(_matchAllWithFriends, _manyPersonsWithFriends);



// export exposed functions

module.exports = {
  getById: getById,
  getByName: getByName,
  getRandom: getRandom,
  getAll: getAll,
  getAllCount: getAllCount,
  deletePerson: deletePerson,
  deleteAllPersons: deleteAllPersons,
  resetPersons: resetPersons
};