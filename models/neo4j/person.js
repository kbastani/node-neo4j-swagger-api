// extracts just the data from the query results

var _ = require('underscore');

var Person = module.exports = function (_node) {
  _(this).extend(_node.data);
};

Person.prototype.movies = function (movies) {
  if (movies && movies.length) {
    this.movies = movies;
  }
  return this.movies;
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