"use strict";

require('./polyfill-spec');

(function () {
  // Iterator can be mapped
  // console.log(['A', 'B', 'C'][Symbol.iterator]().next());
  // console.log(['A', 'B', 'C'].values().next());

  var mapped = ['A', 'B', 'C'][Symbol.iterator]().map(function (x) {
    return x + x;
  });
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
})();

(function () {
  // Iterator can be filtered
  var mapped = ['A', 'B', 'C', 'D', 'E', 'F'].values().filter(function (x) {
    return x.charCodeAt(0) % 2 === 0;
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
  // Iterators can be reduced
  var reduced = ['A', 'B', 'C'].values().reduce(function(x, y) {
    return x + y;
  });
  console.log(reduced);
})();

(function () {
  // Iterators can be use some
  var some = ['A', 'B', 'C'].values().some(function(x) {
    console.log('some testing', x);
    return x === 'B';
  });
  console.log(some);

  var some2 = ['A', 'B', 'C'].values().some(function(x) {
    console.log('some testing', x);
    return x === 'D';
  });
  console.log(some2);
})();

(function () {
  // iterators can use every
  var every = ['A', 'B', 'C'].values().every(function(x) {
    console.log('every testing', x);
    return x === 'B';
  });
  console.log(every);

  var every2 = ['A', 'B', 'C'].values().every(function(x) {
    console.log('every testing', x);
    return x !== 'D';
  });
  console.log(every2);
})();

(function () {
  // Iterator can be flattened
  var flattened = [['A'], [['B']], ['C']].values().flatten();
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
})();

(function () {
  // Iterator can be "flat mapped" via composition
  var flattened = ['A', 'B', 'C'].values().map(function (v) {
    return [ v, v.toLowerCase(), [v] ];
  }).flatten(1);
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
  console.log(flattened.next());
})();

(function () {
  // iterators can be concatted
  var a = ['A', 'B', 'C'];
  var concatted = a.values().concat(a, a.values(), a.values());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
})();

(function () {
  // concat respects spreadable
  var a = ['A', 'B', 'C'];
  var noSpread = ['D', 'E', 'F'];
  noSpread[Symbol.isConcatSpreadable] = false;
  var concatted = a.values().concat('XYZ', noSpread);
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
  console.log(concatted.next());
})();

(function () {
  // iterator can be sliced
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(1, 3);
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
})();

(function () {
  // slice arguments are optional
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(3);
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
})();

(function () {
  // tee returns two independent iterators
  var a = ['A', 'B', 'C'];
  var tees = a.values().tee();
  var t1 = tees[0];
  var t2 = tees[1];
  var zipped = t1.zip(t2.map(function (x) { return x + x; }));
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
  console.log(zipped.next());
})();

(function () {
  // user-land iterators can use the adaptor to get IteratorPrototype
  var iterable = {};
  iterable[Symbol.iterator] = function() {
    var i = 0;
    return {
      next: function() {
        return { value: 'Hello' + (++i), done: false };
      }
    };
  };

  var mapped = Iterator(iterable).map(function (x) { return x + x; });

  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
})();

(function () {
  // GENERATORS
  function* fib() {
    var i = 1;
    var j = 1;
    try {
      while (true) {
        var k = j;
        j = i + j;
        i = k;
        yield i;
      }
    } catch (e) {
      console.log('caught', e);
      return 'done';
    }
  }

  var mapped = fib().map(function (x) { return 'fib:' + x; });

  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.next());
  console.log(mapped.throw(new Error('wat')));
})();

(function () {
  // Transform can be used to build interesting things:

  function reductions(iterable, reducer, initial) {
    var accum;
    var needsInitial = false;
    if (arguments.length >= 3) {
      accum = initial;
    } else {
      needsInitial = true;
    }
    return Iterator(iterable).transform(function (result) {
      if (needsInitial) {
        needsInitial = false;
        accum = result.value;
        return result;
      } else {
        accum = reducer(accum, result.value);
        return { value: accum , done: false };
      }
    });
  }

  var iter = reductions([1,2,3,4], (a, v) => a + v);
  console.log(iter.next());
  console.log(iter.next());
  console.log(iter.next());
  console.log(iter.next());
  console.log(iter.next());

})();
