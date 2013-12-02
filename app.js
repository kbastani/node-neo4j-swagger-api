/**
 * Module dependencies.
 */

var express     = require('express')
  , url         = require("url")
  , swagger     = require("swagger-node-express")
  // , http        = require('http')
  // , path        = require('path')

  , routes      = require('./routes')

  , PORT        = process.env.PORT || 3000
  , API_STRING  = '/api/v0'
  , BASE_URL    = process.env.BASE_URL || process.env.BASE_CALLBACK_URL || "http://localhost:"+PORT

  , app         = express()
  , subpath     = express();


app.use(API_STRING, subpath);

// configure /api/v0 subpath for api versioning
subpath.configure(function () {
  // just using json for the api
  subpath.use(express.json());

  subpath.use(express.methodOverride());
});

app.configure(function () {
  // all environments
  app.set('port', PORT);
  // app.set('views', __dirname + '/views');
  // app.set('view engine', 'jade');
  app.use(express.favicon());
  // app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.logger('dev'));

  // just using json for the api
  app.use(express.json());

  app.use(express.methodOverride());
  app.use(app.router);


  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  // app.locals({
  //   title: 'node-neo4j-swagger-api'    // default title
  // });
});


// Set the main handler in swagger to the express subpath
swagger.setAppHandler(subpath);

swagger.configureSwaggerPaths("", "/api-docs", "");

// This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT
// methods, the header `api_key` OR query param `api_key` must be equal
// to the string literal `special-key`.  All other HTTP ops are A-OK
swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
      var apiKey = req.headers["api_key"];
      if (!apiKey) {
        apiKey = url.parse(req.url,true).query["api_key"]; }
      if ("special-key" == apiKey) {
        return true;
      }
      return false;
    }
    return true;
  }
);


var models = require("./models/swagger_models");

// Add models and methods to swagger
swagger.addModels(models)
  .addGet(routes.users.list)
  .addGet(routes.users.listWithFriends)
  .addGet(routes.users.findById)
  .addGet(routes.users.findByIdWithFriends)
  .addPost(routes.users.addUser)
  .addPost(routes.users.addUsers)
  .addPost(routes.users.addRandomUsers)
  .addPost(routes.users.friendRandomUser)
  .addPost(routes.users.friendUser)
  .addPost(routes.users.unfriendUser)
  .addPut(routes.users.updateUser)
  .addDelete(routes.users.deleteUser)
  .addDelete(routes.users.deleteAllUsers)
  .addPost(routes.users.resetUsers)

  // .addGet(routes.pets.findByTags)
  // .addGet(routes.pets.findByStatus)
  // .addGet(routes.pets.findById)
  // .addPost(routes.pets.addPet)
  // .addPut(routes.pets.updatePet)
  // .addDelete(routes.pets.deletePet)
  ;


// Configures the app's base path and api version.
console.log(BASE_URL+API_STRING);
swagger.configure(BASE_URL+API_STRING, "0.0.6");


// Routes

// Serve up swagger ui at /docs via static route
var docs_handler = express.static(__dirname + '/views/docs/');
app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
  if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
    res.writeHead(302, { 'Location' : req.url + '/' });
    res.end();
    return;
  }
  // take off leading /docs so that connect locates file correctly
  req.url = req.url.substr('/docs'.length);
  return docs_handler(req, res, next);
});

// redirect to /docs
app.get('/', function(req, res) {
  res.redirect('./docs');
});

// app.get('/users', routes.users.list);
// app.post('/users', routes.users.create);
// app.get('/users/:id', routes.users.show);
// app.post('/users/:id', routes.users.edit);
// app.del('/users/:id', routes.users.del);

// app.post('/users/:id/follow', routes.users.follow);
// app.post('/users/:id/unfollow', routes.users.unfollow);


app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});