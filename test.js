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
  var reducer = createSpy(function(x, y) {
    return x + y;
  });
  var iter = ['A', 'B', 'C'].values();
  var reduced = iter.reduce(reducer);

  assert.equal(reduced, 'ABC');
  assert.deepStrictEqual(reducer.calls, [
    [ undefined, [ 'A', 'B', 1, iter ], 'AB' ],
    [ undefined, [ 'AB', 'C', 2, iter ], 'ABC' ],
  ]);
});

test('Iterators can be reduced with initial value', () => {
  var reducer = createSpy(function(x, y) {
    return x + y;
  });
  var iter = ['A', 'B', 'C'].values();
  var reduced = iter.reduce(reducer, '~');

  assert.equal(reduced, '~ABC');
  assert.deepStrictEqual(reducer.calls, [
    [ undefined, [ '~', 'A', 0, iter ], '~A' ],
    [ undefined, [ '~A', 'B', 1, iter ], '~AB' ],
    [ undefined, [ '~AB', 'C', 2, iter ], '~ABC' ],
  ]);
});

test('Iterators can be use some', () => {
  var someThis = { someThis: 'someThis' };
  var pred1 = createSpy(function(x) {
    return x === 'B';
  });
  var iter1 = ['A', 'B', 'C'].values();
  var some1 = iter1.some(pred1, someThis);
  assert.equal(some1, true);
  assert.deepStrictEqual(pred1.calls, [
    [ someThis, [ 'A', 0, iter1 ], false ],
    [ someThis, [ 'B', 1, iter1 ], true ],
  ]);

  var pred2 = createSpy(function(x) {
    return x === 'D';
  });
  var iter2 = ['A', 'B', 'C'].values();
  var some2 = iter2.some(pred2, someThis);
  assert.equal(some2, false);
  assert.deepStrictEqual(pred2.calls, [
    [ someThis, [ 'A', 0, iter2 ], false ],
    [ someThis, [ 'B', 1, iter2 ], false ],
    [ someThis, [ 'C', 2, iter2 ], false ],
  ]);
});

test('Iterators can be use includes', () => {
  var includes1 = ['A', 'B', 'C'].values().includes('B');
  assert.equal(includes1, true);

  var includes2 = ['A', 'B', 'C'].values().includes('D');
  assert.equal(includes2, false);

  var includes3 = [1, 2, NaN].values().includes(NaN);
  assert.equal(includes3, true);

  var includes4 = [2, 1, 0].values().includes(-0);
  assert.equal(includes4, true);
});

test('iterators can use every', () => {
  var someThis = { someThis: 'someThis' };
  var pred1 = createSpy(function(x) {
    return x !== 'B';
  });
  var iter1 = ['A', 'B', 'C'].values();
  var every1 = iter1.every(pred1, someThis);
  assert.equal(every1, false);
  assert.deepStrictEqual(pred1.calls, [
    [ someThis, [ 'A', 0, iter1 ], true ],
    [ someThis, [ 'B', 1, iter1 ], false ],
  ]);

  var pred2 = createSpy(function(x) {
    return x !== 'D';
  });
  var iter2 = ['A', 'B', 'C'].values();
  var every2 = iter2.every(pred2, someThis);
  assert.equal(every2, true);
  assert.deepStrictEqual(pred2.calls, [
    [ someThis, [ 'A', 0, iter2 ], true ],
    [ someThis, [ 'B', 1, iter2 ], true ],
    [ someThis, [ 'C', 2, iter2 ], true ],
  ]);
});

test('Iterator can flatMap', () => {
  var someThis = { someThis: 'someThis' };
  var flatMapper = createSpy(function (v) {
    return [ v[0], 'is for ' + v.toLowerCase() ];
  });
  var iter = [ 'Apple', 'Banana', 'Cherry' ].values();
  var flatMapped = iter.flatMap(flatMapper, someThis);

  assertValues(flatMapped, [ 'A', 'is for apple', 'B', 'is for banana', 'C', 'is for cherry' ]);

  assert.deepStrictEqual(flatMapper.calls, [
    [ someThis, [ 'Apple', 0, iter ], [ 'A', 'is for apple' ] ],
    [ someThis, [ 'Banana', 1, iter ], [ 'B', 'is for banana' ] ],
    [ someThis, [ 'Cherry', 2, iter ], [ 'C', 'is for cherry' ] ],
  ]);
});

test('Iterator.flatMap always iterates result', () => {
  var iter = [ 'App', 'Bat', 'Cow' ].values();
  var flatMapped = iter.flatMap(function (x) { return x; });

  assertValues(flatMapped, [ 'A', 'p', 'p', 'B', 'a', 't', 'C', 'o', 'w' ]);
});

test('flatMap useful with generators', () => {

  var initial = function *(x) {
    yield 'Apple';
    yield 'Banana';
    yield 'Cherry';
  };

  var flatMapped = initial().flatMap(function *(x) {
    yield x.toUpperCase();
    yield x.toLowerCase();
  });

  assertValues(flatMapped, [ 'APPLE', 'apple', 'BANANA', 'banana', 'CHERRY', 'cherry' ]);

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
  var mapper = createSpy(function (v) {
    return [ v, v.toLowerCase(), [v] ];
  });
  var iter = ['A', 'B', 'C'].values();
  var flattened = iter.map(mapper).flatten(1);

  assertValues(flattened, [ 'A', 'a', [ 'A' ], 'B', 'b', [ 'B' ], 'C', 'c', [ 'C' ], ]);
  assert.deepStrictEqual(mapper.calls, [
    [ undefined, [ 'A', 0, iter ], [ 'A', 'a', [ 'A' ] ] ],
    [ undefined, [ 'B', 1, iter ], [ 'B', 'b', [ 'B' ] ] ],
    [ undefined, [ 'C', 2, iter ], [ 'C', 'c', [ 'C' ] ] ],
  ]);
});

test('iterators can be concatted', () => {
  var a = ['A', 'B'];
  var concatted = a.values().concat(a, a.keys(), a.entries());
  assertValues(concatted, [ 'A', 'B', 'A', 'B', 0, 1, [ 0, 'A' ], [ 1, 'B' ] ]);
});

test('concat respects spreadable', () => {
  var a = [ 'A', 'B', 'C' ];
  var noSpread = [ 'D', 'E', 'F' ];
  noSpread[Symbol.isConcatSpreadable] = false;
  var concatted = a.values().concat('XYZ', [ 'Q', 'R' ], noSpread);

  assertValues(concatted, [ 'A', 'B', 'C', 'XYZ', 'Q', 'R', [ 'D', 'E', 'F' ] ]);
});

test('concat supports generators', () => {
  function* genABC() {
    yield 'A';
    yield 'B';
    yield 'C';
  }

  var iter = genABC().concat(genABC(), genABC());

  assertValues(iter, [ 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C' ]);
});

test('concat supports throw', () => {
  function* genABC() {
    try {
      yield 'A';
      yield 'B';
      yield 'C';
    } catch (error) {
      yield 'Err:' + error;
    }
  }

  var iter = genABC().concat(genABC(), genABC());

  assert.deepStrictEqual(iter.next(), { value: 'A', done: false });
  assert.deepStrictEqual(iter.next(), { value: 'B', done: false });
  assert.deepStrictEqual(iter.next(), { value: 'C', done: false });
  assert.deepStrictEqual(iter.throw('X'), { value: 'Err:X', done: false });
  assert.deepStrictEqual(iter.next(), { value: 'A', done: false });
  assert.deepStrictEqual(iter.next(), { value: 'B', done: false });
  assert.deepStrictEqual(iter.throw('X'), { value: 'Err:X', done: false });
  assert.deepStrictEqual(iter.next(), { value: 'A', done: false });
  assert.deepStrictEqual(iter.throw('X'), { value: 'Err:X', done: false });
  assert.deepStrictEqual(iter.next(), { value: undefined, done: true });
  assert.deepStrictEqual(iter.next(), { value: undefined, done: true });
});

test('concat throws from unstarted state leads to completed state', () => {
  function* genABC() {
    try {
      yield 'A';
      yield 'B';
      yield 'C';
    } catch (error) {
      yield 'Err:' + error;
    }
  }

  var iter = genABC().concat(genABC(), genABC());

  var error = new Error();
  assert.throws(function () {
    iter.throw(error);
  }, function (caught) {
    return caught === error;
  });

  assert.deepStrictEqual(iter.next(), { value: undefined, done: true });
});

test('concat throws from completed state', () => {
  function* genABC() {
    try {
      yield 'A';
      yield 'B';
      yield 'C';
    } catch (error) {
      yield 'Err:' + error;
    }
  }

  var iter = genABC().concat(genABC(), genABC());

  // Consume iterator.
  assertValues(iter, [ 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C' ]);

  var error = new Error();
  assert.throws(function () {
    iter.throw(error);
  }, function (caught) {
    return caught === error;
  });

  assert.deepStrictEqual(iter.next(), { value: undefined, done: true });
});

test('iterator can be sliced', () => {
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(1, 3);

  assertValues(sliced, [ 'B', 'C' ]);
});

test('slice end argument is optional', () => {
  var a = ['A', 'B', 'C', 'D', 'E', 'F'];
  var sliced = a.values().slice(3);

  assertValues(sliced, [ 'D', 'E', 'F' ]);
});

test('slice arguments cannot be negative', () => {
  assert.throws(function () {
    [ 'A', 'B', 'C' ].values().slice(-1);
  }, TypeError);

  assert.throws(function () {
    [ 'A', 'B', 'C' ].values().slice(0, -1);
  }, TypeError);
});

test('tee returns independent iterators', () => {
  var a = ['A', 'B', 'C'];
  var tees = a.values().tee(4);
  var t1 = tees[0];
  var t2 = tees[1];
  var t3 = tees[2];
  var t4 = tees[3];

  assertValues(t1, [ 'A', 'B', 'C' ]);
  assertValues(t2, [ 'A', 'B', 'C' ]);
  assertValues(t3, [ 'A', 'B', 'C' ]);
  assertValues(t4, [ 'A', 'B', 'C' ]);
});

test('tee returns two independent iterators by default', () => {
  var a = ['A', 'B', 'C'];
  var tees = a.values().tee();
  var t1 = tees[0];
  var t2 = tees[1];

  assertValues(t1, [ 'A', 'B', 'C' ]);
  assertValues(t2, [ 'A', 'B', 'C' ]);
});

test('user-land iterators can use the adaptor to get IteratorPrototype', () => {
  var next = createSpy(function () {
    if (!this.i) {
      this.i = 0;
    }
    if (this.i === 3) {
      return { value: undefined, done: true };
    }
    return { value: 'Hi' + (++this.i), done: false };
  });

  var myIterable = {
    [Symbol.iterator]: function() {
      return {
        [Symbol.iterator]: function() { return this; },
        next: next
      }
    }
  };

  var mapper = createSpy(function (x) { return x + x; });

  var origIter = myIterable[Symbol.iterator]();
  var iter = Iterator(origIter);
  var mapped = iter.map(mapper);

  assertValues(mapped, [ 'Hi1Hi1', 'Hi2Hi2', 'Hi3Hi3' ]);

  assert.deepStrictEqual(next.calls, [
    [ origIter, [], { value: 'Hi1', done: false } ],
    [ origIter, [], { value: 'Hi2', done: false } ],
    [ origIter, [], { value: 'Hi3', done: false } ],
    [ origIter, [], { value: undefined, done: true } ],
  ]);

  assert.deepStrictEqual(mapper.calls, [
    [ undefined, [ 'Hi1', 0, iter ], 'Hi1Hi1' ],
    [ undefined, [ 'Hi2', 1, iter ], 'Hi2Hi2' ],
    [ undefined, [ 'Hi3', 2, iter ], 'Hi3Hi3' ],
  ]);
});

test('Generators can be mapped and catch errors', () => {
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
      return 'done:' + e.message;
    }
  }

  var mapped = fib().map(function (x) { return 'fib:' + x; });

  assert.deepStrictEqual(
    mapped.next(),
    { value: 'fib:1', done: false }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: 'fib:2', done: false }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: 'fib:3', done: false }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: 'fib:5', done: false }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: 'fib:8', done: false }
  );
  assert.deepStrictEqual(
    mapped.throw(new Error('wat')),
    { value: 'done:wat', done: true }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: undefined, done: true }
  );
  assert.deepStrictEqual(
    mapped.next(),
    { value: undefined, done: true }
  );
});
