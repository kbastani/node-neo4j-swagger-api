// people.js
// Routes to CRUD people.

var People = require('../models/people');

var sw = require("swagger-node-express");
var param = sw.params;
var url = require("url");
var swe = sw.errors;
var _ = require('underscore');


/*
 *  Util Functions
 */

function writeResponse (res, response, start) {
  sw.setHeaders(res);
  res.header('Duration-ms', new Date() - start);
  if (response.neo4j) {
    res.header('Neo4j', JSON.stringify(response.neo4j));
  }
  res.send(JSON.stringify(response.results));
}

function parseUrl(req, key) {
  return url.parse(req.url,true).query[key];
}

function parseBool (req, key) {
  return 'true' == url.parse(req.url,true).query[key];
}


/*
 * API Specs and Functions
 */

exports.list = {
  'spec': {
    "description" : "List all people",
    "path" : "/people",
    "notes" : "Returns all people",
    "summary" : "Find all people",
    "method": "GET",
    "params" : [
      // param.query("friends", "Include friends", "boolean", false, false, "LIST[true, false]", "true")
    ],
    "responseClass" : "List[Person]",
    "errorResponses" : [swe.notFound('people')],
    "nickname" : "getPeople"
  },
  'action': function (req, res) {
    // var friends = parseBool(req, 'friends');
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    // if (friends) {
    //   People.getAllWithFriends(null, options, function (err, response) {
    //     if (err || !response.results) throw swe.notFound('people');
    //     writeResponse(res, response, start);
    //   });
    // } else {
      People.getAll(null, options, function (err, response) {
        if (err || !response.results) throw swe.notFound('people');
        writeResponse(res, response, start);
      });
    // }
  }
};

exports.findPersonByDirectedMovie = {
  'spec': {
    "description" : "Find a director",
    "path" : "/people/director/movie/{title}",
    "notes" : "Returns a person who directed a movie",
    "summary" : "Find person who directed a movie by title",
    "method": "GET",
    "params" : [
      param.path("title", "Title of the movie that the person directed", "string")
    ],
    "responseClass" : "Person",
    "errorResponses" : [swe.invalid('title'), swe.notFound('person')],
    "nickname" : "getPersonByDirectedMovie"
  },
  'action': function (req,res) {
    var title = req.params.title;
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    if (!title) throw swe.invalid('title');

    var params = {
      title: title
    };

    var callback = function (err, response) {
      if (err) throw swe.notFound('person');
      writeResponse(res, response, start);
    };


    People.getDirectorByMovie(params, options, callback);

  }
};

exports.findActorsByCoActor = {
  'spec': {
    "description" : "Find co-actors of person",
    "path" : "/people/coactors/person/{name}",
    "notes" : "Returns all people that acted in a movie with a person",
    "summary" : "Find all people that acted in a movie with a person",
    "method": "GET",
    "params" : [
      param.path("name", "Name of the person with co-actors", "string")
    ],
    "responseClass" : "List[Person]",
    "errorResponses" : [swe.notFound('people')],
    "nickname" : "getCoActorsOfPerson"
  },
  'action': function (req, res) {
    var name = req.params.name;
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    if (!name) throw swe.invalid('name');

    var params = {
      name: name
    };

    var callback = function (err, response) {
      if (err) throw swe.notFound('person');
      writeResponse(res, response, start);
    };


    People.getCoActorsByPerson(params, options, callback);
  }
};

exports.findRolesByMovie = {
  'spec': {
    "description" : "Find people with a role in a movie",
    "path" : "/people/roles/movie/{title}",
    "notes" : "Returns all people and their role in a movie",
    "summary" : "Find all people and their role in a movie",
    "method": "GET",
    "params" : [
      param.path("title", "Title of the movie", "string")
    ],
    "responseClass" : "List[Role]",
    "errorResponses" : [swe.notFound('roles')],
    "nickname" : "getRolesByMovie"
  },
  'action': function (req, res) {
    var title = req.params.title;
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    if (!title) throw swe.invalid('title');

    var params = {
      title: title
    };

    var callback = function (err, response) {
      if (err) throw swe.notFound('role');
      writeResponse(res, response, start);
    };


    People.getRolesByMovie(params, options, callback);
  }
};

exports.personCount = {
  'spec': {
    "description" : "Person count",
    "path" : "/people/count",
    "notes" : "Person count",
    "summary" : "Person count",
    "method": "GET",
    "params" : [],
    "responseClass" : "Count",
    "errorResponses" : [swe.notFound('people')],
    "nickname" : "personCount"
  },
  'action': function (req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    People.getAllCount(null, options, function (err, response) {
      // if (err || !response.results) throw swe.notFound('people');
      writeResponse(res, response, start);
    });
  }
};

exports.addPerson = {
  'spec': {
    "path" : "/people",
    "notes" : "adds a person to the graph",
    "summary" : "Add a new person to the graph",
    "method": "POST",
    "responseClass" : "List[Person]",
    "params" : [
      param.query("name", "Person name, seperate multiple names by commas", "string", true, true)
    ],
    "errorResponses" : [swe.invalid('input')],
    "nickname" : "addPerson"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var names = _.invoke(parseUrl(req, 'name').split(','), 'trim');
    if (!names.length){
      throw swe.invalid('name');
    } else {
      People.createMany({
        names: names
      }, options, function (err, response) {
        if (err || !response.results) throw swe.invalid('input');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.addRandomPeople = {
  'spec': {
    "path" : "/people/random/{n}",
    "notes" : "adds many random people to the graph",
    "summary" : "Add many random new people to the graph",
    "method": "POST",
    "responseClass" : "List[Person]",
    "params" : [
      param.path("n", "Number of random people to be created", "integer", null, 1)
    ],
    "errorResponses" : [swe.invalid('input')],
    "nickname" : "addRandomPeople"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var n = parseInt(req.params.n, 10);
    if (!n){
      throw swe.invalid('input');
    } else {
      People.createRandom({n:n}, options, function (err, response) {
        if (err || !response.results) throw swe.invalid('input');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.findByName = {
  'spec': {
    "description" : "find a person",
    "path" : "/people/name/{name}",
    "notes" : "Returns a person based on name",
    "summary" : "Find person by name",
    "method": "GET",
    "params" : [
      param.path("name", "Name of person that needs to be fetched", "string")
    ],
    "responseClass" : "Person",
    "errorResponses" : [swe.invalid('name'), swe.notFound('person')],
    "nickname" : "getPersonByName"
  },
  'action': function (req,res) {
    var name = req.params.name;
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    if (!name) throw swe.invalid('name');

    var params = {
      name: name
    };

    var callback = function (err, response) {
      if (err) throw swe.notFound('person');
      writeResponse(res, response, start);
    };

    People.getByName(params, options, callback);
  }
};

exports.getRandom = {
  'spec': {
    "description" : "get random people",
    "path" : "/people/random/{n}",
    "notes" : "Returns n random people",
    "summary" : "get random people",
    "method": "GET",
    "params" : [
      param.path("n", "Number of random people get", "integer", null, 1),
      param.query("friends", "Include friends", "boolean", false, false, "LIST[true, false]", "true")
    ],
    "responseClass" : "Person",
    "errorResponses" : [swe.invalid('id'), swe.notFound('person')],
    "nickname" : "getRandomPeople"
  },
  'action': function (req,res) {
    var n = parseInt(req.params.n, 10);
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var friends = parseBool(req, 'friends');

    if (friends) {
      People.getRandomWithFriends({n: n}, options, function (err, response) {
        if (err) throw swe.notFound('people');
        writeResponse(res, response, start);
      });
    } else {
      People.getRandom({n: n}, options, function (err, response) {
        if (err) throw swe.notFound('people');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.updatePerson = {
  'spec': {
    "path" : "/people/{id}",
    "notes" : "updates a person name",
    "method": "PUT",
    "summary" : "Update an existing person",
    "params" : [
      param.path("id", "ID of person that needs to be fetched", "string"),
      param.query("name", "New person name", "string", true)
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('person'), swe.invalid('input')],
    "nickname" : "updatePerson"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var name = parseUrl(req, 'name').trim();
    var id = req.params.id;
    if (!id || !name.length){
      throw swe.invalid('person');
    }
    var params = {
      id: id,
      name: name
    };
    People.updateName(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('person');
      writeResponse(res, response, start);
    });
  }
};


exports.deletePerson = {
  'spec': {
    "path" : "/people/{id}",
    "notes" : "removes a person from the db",
    "method": "DELETE",
    "summary" : "Remove an existing person",
    "params" : [
      param.path("id", "ID of person that needs to be removed", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('person')],
    "nickname" : "deletePerson"
  },
  'action': function(req, res) {
    var id = req.params.id;
    // var start = new Date();
    if (!id) throw swe.invalid('id');

    People.deletePerson({id: id}, null, function (err) {
      if (err) throw swe.invalid('person');
      res.send(200);
    });
  }
};


exports.deleteAllPeople = {
  'spec': {
    "path" : "/people",
    "notes" : "removes all people from the db",
    "method": "DELETE",
    "summary" : "Removes all people",
    "errorResponses" : [swe.invalid('person')],
    "params" : [],
    // "responseClass": 'code', // does this work?
    "nickname" : "deleteAllPeople"
  },
  'action': function(req, res) {
    // var start = new Date();
    People.deleteAllPeople(null, null, function (err) {
      if (err) throw swe.invalid('person');
      res.send(200); // is this working? swagger isn't acknowledging this
    });
  }
};

exports.resetPeople = {
  'spec': {
    "path" : "/people",
    "notes" : "Resets the graph with new people and friendships",
    "method": "PUT",
    "summary" : "Removes all people and then adds n random people",
    "errorResponses" : [swe.invalid('person'), swe.invalid('input')],
    "responseClass" : "List[Person]",
    "params" : [
      param.query("n", "Number of random people to be created", "integer", null, null, null, 10),
      param.query("f", "Average number of friendships per person", "integer", false, null, "LIST[0,1,2,3]", "2")
    ],
    "nickname" : "resetPeople"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var n = parseInt(parseUrl(req, 'n'), 10) || 10;
    var f = parseInt(parseUrl(req, 'f'), 10) || 2;
    var friendships = Math.round(f*n/2);
    People.resetPeople({n: n, friendships: friendships}, options, function (err, response) {
      if (err || !response.results) throw swe.invalid('input');
      writeResponse(res, response, start);
    });
  }
};


exports.friendPerson = {
  'spec': {
    "path" : "/people/{id}/friend/{friend_id}",
    "notes" : "friends a person by ID",
    "method": "POST",
    "summary" : "Friend an existing person",
    "params" : [
      param.path("id", "ID of the person", "string"),
      param.path("friend_id", "ID of the person to be friended", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.invalid('friend_id'), swe.notFound('person'), swe.invalid('input')],
    "nickname" : "friendPerson"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var friend_id = req.params.friend_id;
    if (!id) {
      throw swe.invalid('person');
    }
    if (!friend_id || friend_id == id) {
      throw swe.invalid('friend_id');
    }
    var params = {
      id: id,
      friend_id: friend_id
    };
    People.friendPerson(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('person');
      writeResponse(res, response, start);
    });
  }
};


exports.manyRandomFriendships = {
  'spec': {
    "path" : "/people/random/friend/{n}",
    "notes" : "creates n random friendships",
    "method": "POST",
    "summary" : "create many random friendships",
    "params" : [
      param.path("n", "Number of random people", "integer", null, "1")
    ],
    "errorResponses" : [swe.notFound('people')],
    "nickname" : "manyRandomFriendships"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var n = parseInt(req.params.n, 10) || 1;
    var params = {
      n: n
    };
    People.manyRandomFriendships(params, options, function (err, response) {
      if (err) throw swe.notFound('people');
      writeResponse(res, response, start);
    });
  }
};

exports.friendRandomPerson = {
  'spec': {
    "path" : "/people/{id}/friend/random/{n}",
    "notes" : "friends a random person",
    "method": "POST",
    "summary" : "Friend an existing person",
    "params" : [
      param.path("id", "ID of the person", "string"),
      param.path("n", "Number of new friends", "integer", "LIST[1,2,3,4,5]", "1")
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('person'), swe.invalid('input')],
    "nickname" : "friendRandomPerson"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var n = parseInt(req.params.n) || 1;
    if (!id) {
      throw swe.invalid('person');
    }
    var params = {
      id: id,
      n: n
    };
    People.friendRandomPerson(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('person');
      writeResponse(res, response, start);
    });
  }
};

exports.unfriendPerson = {
  'spec': {
    "path" : "/people/{id}/unfriend/{friend_id}",
    "notes" : "unfriend a person by ID",
    "method": "POST",
    "summary" : "Unfriend an existing person",
    "params" : [
      param.path("id", "ID of the person", "string"),
      param.path("friend_id", "ID of the person to be unfriended", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.invalid('friend_id'), swe.notFound('person'), swe.invalid('input')],
    "nickname" : "unfriendPerson"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var friend_id = req.params.friend_id;
    if (!id) {
      throw swe.invalid('person');
    }
    if (!friend_id || friend_id == id) {
      throw swe.invalid('friend_id');
    }
    var params = {
      id: id,
      friend_id: friend_id
    };
    People.unfriendPerson(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('person');
      writeResponse(res, response, start);
    });
  }
};