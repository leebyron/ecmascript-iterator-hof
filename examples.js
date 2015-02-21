"use strict";

require('./polyfill-spec');

(function () {
  // Iterator can be mapped
  var mapped = ['A', 'B', 'C'].values().map(function (x) {
    return x + x;
  });
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
})();

(function () {
  // Iterators can be zipped
  var a1 = ['A', 'B', 'C'];
  var a2 = ['X', 'Y', 'Z'];
  var zipped = a1.values().zip(a2);
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
})();

(function () {
  // Transformed iterators can be reversed
  var revMapped = ['A', 'B', 'C'].values().map(function (x) {
    return x + x;
  }).reverse();
  console.log(revMapped.next());
  console.log(revMapped.next());
  console.log(revMapped.next());
  console.log(revMapped.next());
  console.log(revMapped.next());
})();
