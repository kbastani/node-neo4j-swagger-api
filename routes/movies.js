// movies.js
// Routes to CRUD movies.

var Movies = require('../models/movies');

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
    "description" : "List all movies",
    "path" : "/movies",
    "notes" : "Returns all movies",
    "summary" : "Find all movies",
    "method": "GET",
    "params" : [
      // param.query("friends", "Include friends", "boolean", false, false, "LIST[true, false]", "true")
    ],
    "responseClass" : "List[Movie]",
    "errorResponses" : [swe.notFound('movies')],
    "nickname" : "getMovies"
  },
  'action': function (req, res) {
    // var friends = parseBool(req, 'friends');
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    // if (friends) {
    //   Movies.getAllWithFriends(null, options, function (err, response) {
    //     if (err || !response.results) throw swe.notFound('movies');
    //     writeResponse(res, response, start);
    //   });
    // } else {
      Movies.getAll(null, options, function (err, response) {
        if (err || !response.results) throw swe.notFound('movies');
        writeResponse(res, response, start);
      });
    // }
  }
};

exports.movieCount = {
  'spec': {
    "description" : "Movie count",
    "path" : "/movies/count",
    "notes" : "Movie count",
    "summary" : "Movie count",
    "method": "GET",
    "params" : [],
    "responseClass" : "Count",
    "errorResponses" : [swe.notFound('movies')],
    "nickname" : "movieCount"
  },
  'action': function (req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    Movies.getAllCount(null, options, function (err, response) {
      // if (err || !response.results) throw swe.notFound('movies');
      writeResponse(res, response, start);
    });
  }
};

exports.addMovie = {
  'spec': {
    "path" : "/movies",
    "notes" : "adds a movie to the graph",
    "summary" : "Add a new movie to the graph",
    "method": "POST",
    "responseClass" : "List[Movie]",
    "params" : [
      param.query("name", "Movie name, seperate multiple names by commas", "string", true, true)
    ],
    "errorResponses" : [swe.invalid('input')],
    "nickname" : "addMovie"
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
      Movies.createMany({
        names: names
      }, options, function (err, response) {
        if (err || !response.results) throw swe.invalid('input');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.addRandomMovies = {
  'spec': {
    "path" : "/movies/random/{n}",
    "notes" : "adds many random movies to the graph",
    "summary" : "Add many random new movies to the graph",
    "method": "POST",
    "responseClass" : "List[Movie]",
    "params" : [
      param.path("n", "Number of random movies to be created", "integer", null, 1)
    ],
    "errorResponses" : [swe.invalid('input')],
    "nickname" : "addRandomMovies"
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
      Movies.createRandom({n:n}, options, function (err, response) {
        if (err || !response.results) throw swe.invalid('input');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.findById = {
  'spec': {
    "description" : "find a movie",
    "path" : "/movies/{id}",
    "notes" : "Returns a movie based on ID",
    "summary" : "Find movie by ID",
    "method": "GET",
    "params" : [
      param.path("id", "ID of movie that needs to be fetched", "string")
    ],
    "responseClass" : "Movie",
    "errorResponses" : [swe.invalid('id'), swe.notFound('movie')],
    "nickname" : "getMovieById"
  },
  'action': function (req,res) {
    var id = req.params.id;
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();

    if (!id) throw swe.invalid('id');

    var params = {
      id: id
    };

    var callback = function (err, response) {
      if (err) throw swe.notFound('movie');
      writeResponse(res, response, start);
    };


    Movies.getById(params, options, callback);

  }
};

exports.getRandom = {
  'spec': {
    "description" : "get random movies",
    "path" : "/movies/random/{n}",
    "notes" : "Returns n random movies",
    "summary" : "get random movies",
    "method": "GET",
    "params" : [
      param.path("n", "Number of random movies get", "integer", null, 1),
      param.query("friends", "Include friends", "boolean", false, false, "LIST[true, false]", "true")
    ],
    "responseClass" : "Movie",
    "errorResponses" : [swe.invalid('id'), swe.notFound('movie')],
    "nickname" : "getRandomMovies"
  },
  'action': function (req,res) {
    var n = parseInt(req.params.n, 10);
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var friends = parseBool(req, 'friends');

    if (friends) {
      Movies.getRandomWithFriends({n: n}, options, function (err, response) {
        if (err) throw swe.notFound('movies');
        writeResponse(res, response, start);
      });
    } else {
      Movies.getRandom({n: n}, options, function (err, response) {
        if (err) throw swe.notFound('movies');
        writeResponse(res, response, start);
      });
    }
  }
};


exports.updateMovie = {
  'spec': {
    "path" : "/movies/{id}",
    "notes" : "updates a movie name",
    "method": "PUT",
    "summary" : "Update an existing movie",
    "params" : [
      param.path("id", "ID of movie that needs to be fetched", "string"),
      param.query("name", "New movie name", "string", true)
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('movie'), swe.invalid('input')],
    "nickname" : "updateMovie"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var name = parseUrl(req, 'name').trim();
    var id = req.params.id;
    if (!id || !name.length){
      throw swe.invalid('movie');
    }
    var params = {
      id: id,
      name: name
    };
    Movies.updateName(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('movie');
      writeResponse(res, response, start);
    });
  }
};


exports.deleteMovie = {
  'spec': {
    "path" : "/movies/{id}",
    "notes" : "removes a movie from the db",
    "method": "DELETE",
    "summary" : "Remove an existing movie",
    "params" : [
      param.path("id", "ID of movie that needs to be removed", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('movie')],
    "nickname" : "deleteMovie"
  },
  'action': function(req, res) {
    var id = req.params.id;
    // var start = new Date();
    if (!id) throw swe.invalid('id');

    Movies.deleteMovie({id: id}, null, function (err) {
      if (err) throw swe.invalid('movie');
      res.send(200);
    });
  }
};


exports.deleteAllMovies = {
  'spec': {
    "path" : "/movies",
    "notes" : "removes all movies from the db",
    "method": "DELETE",
    "summary" : "Removes all movies",
    "errorResponses" : [swe.invalid('movie')],
    "params" : [],
    // "responseClass": 'code', // does this work?
    "nickname" : "deleteAllMovies"
  },
  'action': function(req, res) {
    // var start = new Date();
    Movies.deleteAllMovies(null, null, function (err) {
      if (err) throw swe.invalid('movie');
      res.send(200); // is this working? swagger isn't acknowledging this
    });
  }
};

exports.resetMovies = {
  'spec': {
    "path" : "/movies",
    "notes" : "Resets the graph with new movies and friendships",
    "method": "PUT",
    "summary" : "Removes all movies and then adds n random movies",
    "errorResponses" : [swe.invalid('movie'), swe.invalid('input')],
    "responseClass" : "List[Movie]",
    "params" : [
      param.query("n", "Number of random movies to be created", "integer", null, null, null, 10),
      param.query("f", "Average number of friendships per movie", "integer", false, null, "LIST[0,1,2,3]", "2")
    ],
    "nickname" : "resetMovies"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var n = parseInt(parseUrl(req, 'n'), 10) || 10;
    var f = parseInt(parseUrl(req, 'f'), 10) || 2;
    var friendships = Math.round(f*n/2);
    Movies.resetMovies({n: n, friendships: friendships}, options, function (err, response) {
      if (err || !response.results) throw swe.invalid('input');
      writeResponse(res, response, start);
    });
  }
};


exports.friendMovie = {
  'spec': {
    "path" : "/movies/{id}/friend/{friend_id}",
    "notes" : "friends a movie by ID",
    "method": "POST",
    "summary" : "Friend an existing movie",
    "params" : [
      param.path("id", "ID of the movie", "string"),
      param.path("friend_id", "ID of the movie to be friended", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.invalid('friend_id'), swe.notFound('movie'), swe.invalid('input')],
    "nickname" : "friendMovie"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var friend_id = req.params.friend_id;
    if (!id) {
      throw swe.invalid('movie');
    }
    if (!friend_id || friend_id == id) {
      throw swe.invalid('friend_id');
    }
    var params = {
      id: id,
      friend_id: friend_id
    };
    Movies.friendMovie(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('movie');
      writeResponse(res, response, start);
    });
  }
};


exports.manyRandomFriendships = {
  'spec': {
    "path" : "/movies/random/friend/{n}",
    "notes" : "creates n random friendships",
    "method": "POST",
    "summary" : "create many random friendships",
    "params" : [
      param.path("n", "Number of random movies", "integer", null, "1")
    ],
    "errorResponses" : [swe.notFound('movies')],
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
    Movies.manyRandomFriendships(params, options, function (err, response) {
      if (err) throw swe.notFound('movies');
      writeResponse(res, response, start);
    });
  }
};

exports.friendRandomMovie = {
  'spec': {
    "path" : "/movies/{id}/friend/random/{n}",
    "notes" : "friends a random movie",
    "method": "POST",
    "summary" : "Friend an existing movie",
    "params" : [
      param.path("id", "ID of the movie", "string"),
      param.path("n", "Number of new friends", "integer", "LIST[1,2,3,4,5]", "1")
    ],
    "errorResponses" : [swe.invalid('id'), swe.notFound('movie'), swe.invalid('input')],
    "nickname" : "friendRandomMovie"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var n = parseInt(req.params.n) || 1;
    if (!id) {
      throw swe.invalid('movie');
    }
    var params = {
      id: id,
      n: n
    };
    Movies.friendRandomMovie(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('movie');
      writeResponse(res, response, start);
    });
  }
};

exports.unfriendMovie = {
  'spec': {
    "path" : "/movies/{id}/unfriend/{friend_id}",
    "notes" : "unfriend a movie by ID",
    "method": "POST",
    "summary" : "Unfriend an existing movie",
    "params" : [
      param.path("id", "ID of the movie", "string"),
      param.path("friend_id", "ID of the movie to be unfriended", "string")
    ],
    "errorResponses" : [swe.invalid('id'), swe.invalid('friend_id'), swe.notFound('movie'), swe.invalid('input')],
    "nickname" : "unfriendMovie"
  },
  'action': function(req, res) {
    var options = {
      neo4j: parseBool(req, 'neo4j')
    };
    var start = new Date();
    var id = req.params.id;
    var friend_id = req.params.friend_id;
    if (!id) {
      throw swe.invalid('movie');
    }
    if (!friend_id || friend_id == id) {
      throw swe.invalid('friend_id');
    }
    var params = {
      id: id,
      friend_id: friend_id
    };
    Movies.unfriendMovie(params, options, function (err, response) {
      if (err) throw swe.invalid('id');
      if (!response.results) throw swe.invalid('movie');
      writeResponse(res, response, start);
    });
  }
};