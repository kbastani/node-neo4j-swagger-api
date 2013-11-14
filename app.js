/**
 * Module dependencies.
 */

var express     = require('express')
  , url         = require("url")
  , swagger     = require("swagger-node-express")
  , http        = require('http')
  , path        = require('path')

  , routes      = require('./routes')

  , PORT        = process.env.PORT || 3000
  , API_STRING  = '/api'
  , BASE_URL    = process.env.BASE_CALLBACK_URL || "http://localhost:"+PORT

  , app         = express()
  , subpath     = express();


app.use(API_STRING, subpath);

var petResources = require("./swagger/model_resources");

// configure api subpath
subpath.configure(function () {
  // subpath.use(express.bodyParser());
  subpath.use(express.json());
  subpath.use(express.methodOverride());
  subpath.use(app.router);

});

// all environments
app.configure(function () {
  app.set('port', PORT);
  // app.set('views', __dirname + '/views');
  // app.set('view engine', 'jade');
  // app.use(express.favicon());
  // app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.logger('dev'));

  // app.use(express.bodyParser()); //
  // app.use(express.urlencoded());
  app.use(express.json());

  app.use(express.methodOverride());
  app.use(app.router);


  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  // app.locals({
  //   title: 'Node-Neo4j-API'    // default title
  // });


});



// Set the main handler in swagger to the express app
swagger.setAppHandler(subpath);

swagger.configureSwaggerPaths("", "/api-docs", "");

// default document middleware for swagger/index.html
// app.use('/swagger', function (req, res, next) {
//   if (req.url === '/swagger') {
//     res.redirect('/swagger/');
//   }
//   next();
// });


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


var models = require("./swagger/models");

// Add models and methods to swagger
swagger.addModels(models)
  .addGet(petResources.findByTags)
  .addGet(petResources.findByStatus)
  .addGet(petResources.findById)
  .addPost(petResources.addPet)
  .addPut(petResources.updatePet)
  .addDelete(petResources.deletePet);


// Configures the app's base path and api version.
console.log(BASE_URL+API_STRING);
swagger.configure(BASE_URL+API_STRING, "0.1");


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

// app.get('/', routes.site.index);

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