"use strict";

// Micro-harness
var assert = require('assert');

var failures;
function test(name, fn) {
  try {
    fn();
    console.log('\x1B[32m' + name + '\x1B[0m');
  } catch (e) {
    if (failures) {
      failures.push([ name, e ]);
    } else {
      failures = [[ name, e ]];
      process.nextTick(function () {
        failures.forEach(function (pair) {
          console.log('\x1B[31m' + pair[0] + '\x1B[0m');
          console.log(pair[1].stack || pair[1].message || String(pair[1]));
        });
        process.exit(1);
      });
    }
  }
}

function assertValues(iterator, values) {
  assert(iterator instanceof Iterator);
  for (var i = 0; i < values.length; i++) {
    assert.deepStrictEqual(iterator.next(), { value: values[i], done: false });
  }
  // Flush the iterator
  for (var f = 0; f < 3; f++) {
    assert.deepStrictEqual(iterator.next(), { value: undefined, done: true });
  }
}

function createSpy(fn) {
  var calls = [];
  var spy = function spy() {
    var returnValue;
    if (fn) {
      returnValue = fn.apply(this, arguments);
    }
    calls.push([ this, Array.prototype.slice.apply(arguments), returnValue ]);
    return returnValue;
  };
  spy.calls = calls;
  return spy;
}


// Tests
require('./polyfill-spec');


test('Iterator can be mapped', () => {
  var mapped = ['A', 'B', 'C'][Symbol.iterator]().map(function (x) {
    return x + x;
  });

  assertValues(mapped, [ 'AA', 'BB', 'CC' ]);
});

test('Iterator can forEach', () => {
  var someThis = { someThis: 'someThis' };
  var iter = [ 'A', 'B', 'C' ].values();
  var spy = createSpy();

  iter.forEach(spy, someThis);

  assert.deepStrictEqual(spy.calls, [
    [ someThis, [ 'A', 0, iter ], undefined ],
    [ someThis, [ 'B', 1, iter ], undefined ],
    [ someThis, [ 'C', 2, iter ], undefined ],
  ]);
});

test('Iterator can be filtered', () => {
  var someThis = { someThis: 'someThis' };
  var iter = ['A', 'B', 'C', 'D', 'E', 'F'].values();
  var filterFn = createSpy(function (x) {
    return x.charCodeAt(0) % 2 === 0;
  });

  var filtered = iter.filter(filterFn, someThis);

  assertValues(filtered, [ 'B', 'D', 'F' ]);

  assert.deepStrictEqual(filterFn.calls, [
    [ someThis, [ 'A', 0, iter ], false ],
    [ someThis, [ 'B', 1, iter ], true ],
    [ someThis, [ 'C', 2, iter ], false ],
    [ someThis, [ 'D', 3, iter ], true ],
    [ someThis, [ 'E', 4, iter ], false ],
    [ someThis, [ 'F', 5, iter ], true ],
  ]);
});

test('Iterator can be filtered by index', () => {
  var someThis = { someThis: 'someThis' };
  var iter = ['A', 'B', 'C', 'D', 'E', 'F'].values();
  var filterFn = createSpy(function (x, index) {
    return index % 2 === 0;
  });

  var filtered = iter.filter(filterFn, someThis);

  assertValues(filtered, [ 'A', 'C', 'E' ]);

  assert.deepStrictEqual(filterFn.calls, [
    [ someThis, [ 'A', 0, iter ], true ],
    [ someThis, [ 'B', 1, iter ], false ],
    [ someThis, [ 'C', 2, iter ], true ],
    [ someThis, [ 'D', 3, iter ], false ],
    [ someThis, [ 'E', 4, iter ], true ],
    [ someThis, [ 'F', 5, iter ], false ],
  ]);
});

test('Values can be found in an iterator', () => {
  var someThis = { someThis: 'someThis' };
  var iter = ['Apple', 'Banana', 'Cherry', 'Durian'].values();
  var findFn = createSpy(function (x, index) {
    return x.indexOf('na') !== -1;
  });

  var found = iter.find(findFn, someThis);

  assert.equal(found, 'Banana');

  assert.deepStrictEqual(findFn.calls, [
    [ someThis, [ 'Apple', 0, iter ], false ],
    [ someThis, [ 'Banana', 1, iter ], true ],
  ]);
});

test('Iterators can be zipped', () => {
  var a1 = ['A', 'B', 'C'];
  var a2 = ['X', 'Y', 'Z'];
  var zipped = a1.values().zip(a2);

  assertValues(zipped, [ ['A', 'X'], ['B', 'Y'], ['C', 'Z'] ]);
});

test('Iterators can be reduced', () => {
  var reduced = ['A', 'B', 'C'].values().reduce(function(x, y) {
    return x + y;
  });
  console.log(reduced);
});

test('Iterators can be use some', () => {
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
});

test('Iterators can be use includes', () => {
  var includes = ['A', 'B', 'C'].values().includes('B');
  console.log(includes, true);

  var includes2 = ['A', 'B', 'C'].values().includes('D');
  console.log(includes2, false);

  var includes3 = [1, 2, NaN].values().includes(NaN);
  console.log(includes3, true);

  var includes4 = [2, 1, 0].values().includes(-0);
  console.log(includes4, true);
});

test('iterators can use every', () => {
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
});

test('Iterator can be flattened', () => {
  var flattened = [['A'], [['B']], ['C']].values().flatten();

  assertValues(flattened, [ 'A', 'B', 'C' ]);
});

test('Iterator does not flatten strings, despite being iterable', () => {
  var flattened = [['Apple'], [['Banana']], ['Cherry']].values().flatten();

  assertValues(flattened, [ 'Apple', 'Banana', 'Cherry' ]);
});

test('Iterator does not flatten non-spreadable iterables', () => {
  var spreadFalse = {
    [Symbol.isConcatSpreadable]: false,
    [Symbol.iterator]() {
      return [ 'Oh', 'No' ].values();
    }
  };

  var spreadTrue = {
    [Symbol.isConcatSpreadable]: true,
    [Symbol.iterator]() {
      return [ 'Ah', 'Yea' ].values();
    }
  };

  var spreadUndef = {
    [Symbol.iterator]() {
      return [ 'What', 'Now' ].values();
    }
  };

  var generator = function* () {
    yield 'Many';
    yield 'Values';
  };

  var flattened = [ spreadFalse, spreadTrue, spreadUndef, generator() ].values().flatten();

  assertValues(flattened, [ spreadFalse, 'Ah', 'Yea', 'What', 'Now', 'Many', 'Values' ]);
});

test('Iterator can be "flat mapped" via composition', () => {
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
});

test('iterators can be concatted', () => {
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
});

test('concat respects spreadable', () => {
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
});

test('iterator can be sliced', () => {
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(1, 3);
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
});

test('slice arguments are optional', () => {
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(3);
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
  console.log(sliced.next());
});

test('tee returns two independent iterators', () => {
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
});

test('user-land iterators can use the adaptor to get IteratorPrototype', () => {
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
});

test('GENERATORS', () => {
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
});

test('Transform can be used to build interesting things:', () => {

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

});
