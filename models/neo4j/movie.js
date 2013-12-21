// extracts just the data from the query results

var _ = require('underscore');

var Movie = module.exports = function (_node) {
  _(this).extend(_node.data);
};


Movie.prototype.actors = function (actors) {
  if (actors && actors.length) {
    this.actors = actors;
  }
  return this.actors;
};

// Movie.prototype.directors = function (directors) {
//   if (directors && directors.length) {
//     this.directors = directors;
//   }
//   return this.directors;
// };

// Movie.prototype.category = function (category) {
//   if (category) {
//     if (category.name) {
//       this.category = category;
//     } else if (category.data) {
//       this.category = _.extend(category.data);
//     }
//   }
//   return this.category;
// };