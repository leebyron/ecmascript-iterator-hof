"use strict";

require('./es-abstract-operations');

global.Iterator = function Iterator(iterable) {
  var iterator = GetIterator(iterable);
  if (iterator instanceof Iterator) {
    return iterator;
  }
  return CreateAdaptedIterator(iterator);
};

Object.defineProperty(IteratorPrototype, 'constructor', {
  value: Iterator,
  writable: true,
  enumerable: false,
  configurable: true
});

Object.defineProperty(Iterator, 'prototype', {
  value: IteratorPrototype,
  writable: true,
  enumerable: false,
  configurable: false
});

function CreateAdaptedIterator(iterator) {
  if (Object(iterator) !== iterator) {
    throw new TypeError();
  }
  var adaptedIterator = ObjectCreate(
    AdaptedIteratorPrototype,
    ['[[Iterator]]']
  );
  adaptedIterator['[[Iterator]]'] = iterator;
  return adaptedIterator;
}

var AdaptedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(AdaptedIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (arguments.length > 0) {
    var value = arguments[0];
    return IteratorNext(iterator, value);
  } else {
    return IteratorNext(iterator);
  }
});

CreateMethodProperty(AdaptedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(AdaptedIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

CreateMethodProperty(IteratorPrototype, 'concat', function concat( /* ...iterables */ ) {
  var O = Object(this);
  var iterables = [O].concat(Array.prototype.slice.call(arguments));
  return CreateConcatedIterator(iterables);
});

function IsConcatSpreadableIterable(O) {
  if (Object(O) !== O) {
    return false;
  }
  var spreadable = O[Symbol.isConcatSpreadable];
  if (spreadable !== undefined) {
    return Boolean(spreadable);
  }
  if (GetMethod(O, Symbol.iterator) === undefined) {
    return false;
  }
  return true;
}

function CreateConcatedIterator(iterables) {
  var iterator = ObjectCreate(
    ConcatedIteratorPrototype,
    ['[[Iterables]]', '[[CreateIterator]]']
  );
  iterator['[[Iterables]]'] = iterables;
  iterator['[[CurrentIterator]]'] = undefined;
  return iterator;
}

var ConcatedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(ConcatedIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterables = O['[[Iterables]]'];
  if (iterables === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var initialIterator = O['[[CurrentIterator]]'];
  var iterator = initialIterator;
  while (true) {
    if (iterator === undefined) {
      if (iterables.length === 0) {
        O['[[Iterables]]'] = undefined;
        return CreateIterResultObject(undefined, true);
      }
      var E = iterables.shift();
      var spreadable = IsConcatSpreadableIterable(E);
      if (spreadable === false) {
        return CreateIterResultObject(E, false);
      }
      iterator = GetIterator(E);
      O['[[CurrentIterator]]'] = iterator;
    }
    var next;
    if (arguments.length > 0 && initialIterator === iterator) {
      var value = arguments[0];
      next = IteratorNext(iterator, value);
    } else {
      next = IteratorNext(iterator);
    }
    if (IteratorComplete(next) === true) {
      iterator = undefined;
      continue;
    }
    return next;
  }
});

CreateMethodProperty(ConcatedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterables = O['[[Iterables]]'];
  if (iterables === undefined) {
    return CreateIterResultObject(value, true);
  }
  var iterator = O['[[CurrentIterator]]'];
  if (iterator === undefined) {
    O['[[Iterables]]'] = undefined;
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterables]]'] = undefined;
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(ConcatedIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterables = O['[[Iterables]]'];
  if (iterables === undefined) {
    throw exception;
  }
  var iterator = O['[[CurrentIterator]]'];
  if (iterator === undefined) {
    O['[[Iterables]]'] = undefined;
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterables]]'] = undefined;
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

/**
 * Returns true if the search-element in the iterated values.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'includes', function includes( searchElement ) {
  var O = Object(this);
  while (true) {
    var result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return false;
    }
    var value = IteratorValue(result);
    if (SameValueZero(searchElement, value) === true) {
      return true;
    }
  }
});

/**
 * Returns true if all items in the list pass the predicate.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'every', function every( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var index = 0;
  while (true) {
    var result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return true;
    }
    var value = IteratorValue(result);
    var testResult = Boolean(callbackFn.call(T, value, index, O));
    if (testResult === false) {
      IteratorClose(O, NormalCompletion());
      return false;
    }
    index += 1;
  }
});

/**
 * Uses a predicate callbackFn returns true to keep values or false to skip
 * values of this iterator. Returns a new iterator.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'filter', function filter( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  return CreateFilteredIterator(O, callbackFn, T);
});

function CreateFilteredIterator(O, callbackFn, T) {
  var iterator = ObjectCreate(
    FilteredIteratorPrototype,
    ['[[Iterator]]', '[[Callback]]', '[[ThisArg]]', '[[NextIndex]]']
  );
  iterator['[[Iterator]]'] = O;
  iterator['[[Callback]]'] = callbackFn;
  iterator['[[ThisArg]]'] = T;
  iterator['[[NextIndex]]'] = 0;
  return iterator;
}

var FilteredIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(FilteredIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var callbackFn = O['[[Callback]]'];
  var T = O['[[ThisArg]]'];
  while (true) {
    var result;
    if (arguments.length > 0) {
      var value = arguments[0];
      result = IteratorNext(iterator, value);
    } else {
      result = IteratorNext(iterator);
    }
    if (IteratorComplete(result) === true) {
      O['[[Iterator]]'] = undefined;
      O['[[Callback]]'] = undefined;
      O['[[ThisArg]]'] = undefined;
      O['[[NextIndex]]'] = undefined;
      return result;
    }
    var iterValue = IteratorValue(result);
    var index = O['[[NextIndex]]'];
    var selected = callbackFn.call(T, iterValue, index, iterator);
    O['[[NextIndex]]'] = index + 1;
    if (Boolean(selected) === true) {
      return result;
    }
  }
});

CreateMethodProperty(FilteredIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(FilteredIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

/**
 * Returns an if the search-element in the iterated values.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'find', function find( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var index = 0;
  while (true) {
    var result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return;
    }
    var value = IteratorValue(result);
    if (Boolean(callbackFn.call(T, value, index, O)) === true) {
      return value;
    }
    index += 1;
  }
});

/**
 * FlatMaps this iterator into a new iterator by mapping each IteratorResult
 * with the transforming callbackFn, asserting an iterator is returned, and
 * flattening that response into the new iterator's output.
 */
CreateMethodProperty(IteratorPrototype, 'flatMap', function flatMap( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  return CreateFlatMappedIterator(O, callbackFn, T);
});

function CreateFlatMappedIterator(O, callbackFn, T) {
  var iterator = ObjectCreate(
    FlatMappedIteratorPrototype,
    ['[[Iterator]]', '[[Callback]]', '[[ThisArg]]', '[[NextIndex]]', '[[FlatMapIterator]]']
  );
  iterator['[[Iterator]]'] = O;
  iterator['[[Callback]]'] = callbackFn;
  iterator['[[ThisArg]]'] = T;
  iterator['[[NextIndex]]'] = 0;
  iterator['[[FlatMapIterator]]'] = null;
  return iterator;
}

var FlatMappedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(FlatMappedIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }

  while (true) {
    var flatMapIterator = O['[[FlatMapIterator]]'];
    if (!flatMapIterator) {
      var result = IteratorNext(iterator);
      if (IteratorComplete(result) === true) {
        O['[[Iterator]]'] = undefined;
        O['[[Callback]]'] = undefined;
        O['[[ThisArg]]'] = undefined;
        O['[[NextIndex]]'] = undefined;
        O['[[FlatMapIterator]]'] = undefined;
        return result;
      }

      var mapper = O['[[Callback]]'];
      var context = O['[[ThisArg]]'];
      var value = IteratorValue(result);
      var index = O['[[NextIndex]]'];
      var flatMapResult = mapper.call(context, value, index, iterator);

      if (GetMethod(flatMapResult, Symbol.iterator) === undefined) {
        throw new TypeError();
      }

      flatMapIterator = GetIterator(flatMapResult);
      O['[[FlatMapIterator]]'] = flatMapIterator;
      O['[[NextIndex]]'] = index + 1;
    }

    var result = IteratorNext(flatMapIterator);
    if (IteratorComplete(result) === true) {
      O['[[FlatMapIterator]]'] = null;
      continue; // go get a new one.
    }

    return result;
  }
});

CreateMethodProperty(FlatMappedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var flatMapIterator = O['[[FlatMapIterator]]'];
  if (flatMapIterator !== undefined) {
    // TODO: call return on FlatMapIterator first.
    IteratorClose(flatMapIterator, NormalCompletion());
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    O['[[Iterator]]'] = undefined;
    IteratorClose(iterator, NormalCompletion());
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(FlatMappedIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var flatMapIterator = O['[[FlatMapIterator]]'];
  if (flatMapIterator) {
    var throwFn = GetMethod(flatMapIterator, 'throw');
    if (throwFn === undefined) {
      IteratorClose(iterator, NormalCompletion());
    } else {
      var result = throwFn.call(iterator, exception);
      if (IteratorComplete(result) === true) {
        // Return Completion{[[type]]: return , [[value]]:value, [[target]]:empty}.
        return result;
      }
    }
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    O['[[Iterator]]'] = undefined;
    IteratorClose(iterator, NormalCompletion());
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

/**
 * Flattens an iterator of (concat-spreadable) iterables, returning an iterator
 * of flattened values. Accepts a maximum depth to flatten to, which must be >0
 * and defaults to +Infinity.
 */
CreateMethodProperty(IteratorPrototype, 'flatten', function flatten( /* [ depth ] */ ) {
  var O = Object(this);
  var depth;
  if (arguments.length === 0) {
    depth = Infinity;
  } else {
    depth = ToInteger(arguments[0]);
    if (depth < 0) {
      throw new TypeError();
    }
    if (depth === 0) {
      depth = Infinity;
    }
  }
  return CreateFlattenIterator(O, depth);
});

function CreateFlattenIterator(originalIterator, depth) {
  if (Object(originalIterator) !== originalIterator) {
    throw new TypeError();
  }
  var iterator = ObjectCreate(
    IteratorPrototype,
    ['[[Depth]]', '[[IteratorStack]]']
  );
  iterator['[[Depth]]'] = depth;
  iterator['[[IteratorStack]]'] = [ originalIterator ];
  CreateMethodProperty(iterator, 'next', FlattenIteratorNext);
  CreateMethodProperty(iterator, 'return', FlattenIteratorReturn);
  CreateMethodProperty(iterator, 'throw', FlattenIteratorThrow);
  return iterator;
}

function FlattenIteratorNext() {
  var O = Object(this);
  var depth = O['[[Depth]]'];
  var stack = O['[[IteratorStack]]'];
  while (stack.length) {
    var currentIterator = stack[stack.length - 1];
    var result = IteratorNext(currentIterator);
    if (IteratorComplete(result) === true) {
      stack.pop();
      continue;
    }
    if (stack.length <= depth) {
      var value = IteratorValue(result);
      if (IsConcatSpreadableIterable(value) === true) {
        var nextIterator = GetIterator(value);
        stack.push(nextIterator);
        continue;
      }
    }
    return result;
  }
  return CreateIterResultObject(undefined, true);
}

function FlattenIteratorReturn(value) {
  var O = Object(this);
  var stack = O['[[IteratorStack]]'];
  while (stack.length !== 0) {
    var iterator = stack.pop();
    IteratorClose(iterator, NormalCompletion());
  }
  return CreateIterResultObject(value, true);
}

function FlattenIteratorThrow(exception) {
  var O = Object(this);
  var stack = O['[[IteratorStack]]'];
  while (stack.length !== 0) {
    var iterator = stack.pop();
    var throwFn = GetMethod(iterator, 'throw');
    if (throwFn !== undefined) {
      try {
        return throwFn.call(iterator, exception);
      } catch (ex) {
        exception = ex;
      }
    } else {
      IteratorClose(iterator, NormalCompletion());
    }
  }
  throw exception;
}

/**
 * Equivalent to a for-of loop. Does not return any value.
 */
CreateMethodProperty(IteratorPrototype, 'forEach', function forEach( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var result;
  var index = 0;
  while (true) {
    result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return;
    }
    var value = IteratorValue(result);
    callbackFn.call(T, value, index, O);
    index += 1;
  }
});

/**
 * Uses a mapper callbackFn to map from original values to new values.
 * Returns a new iterator. Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'map', function map( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  return CreateMappedIterator(O, callbackFn, T);
});

function CreateMappedIterator(O, callbackFn, T) {
  var iterator = ObjectCreate(
    MappedIteratorPrototype,
    ['[[Iterator]]', '[[Callback]]', '[[ThisArg]]', '[[NextIndex]]']
  );
  iterator['[[Iterator]]'] = O;
  iterator['[[Callback]]'] = callbackFn;
  iterator['[[ThisArg]]'] = T;
  iterator['[[NextIndex]]'] = 0;
  return iterator;
}

var MappedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(MappedIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var callbackFn = O['[[Callback]]'];
  var T = O['[[ThisArg]]'];
  var result;
  if (arguments.length > 0) {
    var value = arguments[0];
    result = IteratorNext(iterator, value);
  } else {
    result = IteratorNext(iterator);
  }
  if (IteratorComplete(result) === true) {
    O['[[Iterator]]'] = undefined;
    O['[[Callback]]'] = undefined;
    O['[[ThisArg]]'] = undefined;
    O['[[NextIndex]]'] = undefined;
    return result;
  }
  var iterValue = IteratorValue(result);
  var index = O['[[NextIndex]]'];
  var mappedValue = callbackFn.call(T, iterValue, index, iterator);
  O['[[NextIndex]]'] = index + 1;

  return CreateIterResultObject(mappedValue, false);
});

CreateMethodProperty(MappedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(MappedIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

/**
 * Reduces this iterator with a reducing callbackFn to a single value.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'reduce', function reduce( callbackFn /*[ , initialValue ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var result;
  var accumulator;
  var index = 0;
  if (arguments.length > 1) {
    accumulator = arguments[1];
  } else {
    result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      throw new TypeError('Reduce of empty iterator with no initial value.');
    }
    accumulator = IteratorValue(result);
    index += 1;
  }

  while (true) {
    result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return accumulator;
    }
    var value = IteratorValue(result);
    accumulator = callbackFn(accumulator, value, index, O);
    index += 1;
  }
});

/**
 * Returns a new iterator which represents a slice of this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'slice', function slice( start, end ) {
  var O = Object(this);
  start = ToInteger(start);
  if (start < 0) {
    throw new TypeError('Slice start must not be negative.');
  }
  if (end === undefined) {
    end = Infinity;
  } else {
    end = ToInteger(end);
    if (end < 0) {
      throw new TypeError('Slice end must not be negative.');
    }
  }
  return CreateSlicedIterator(O, start, end);
});

function CreateSlicedIterator(O, start, end) {
  var iterator = ObjectCreate(
    SlicedIteratorPrototype,
    ['[[Iterator]]', '[[Start]]', '[[End]]', '[[NextIndex]]']
  );
  iterator['[[Iterator]]'] = O;
  iterator['[[Start]]'] = start;
  iterator['[[End]]'] = end;
  iterator['[[NextIndex]]'] = 0;
  return iterator;
}

var SlicedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(SlicedIteratorPrototype, 'next', function next( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var start = O['[[Start]]'];
  var end = O['[[End]]'];

  while (true) {
    var index = O['[[NextIndex]]'];

    if (index >= end) {
      O['[[Iterator]]'] = undefined;
      IteratorClose(iterator, NormalCompletion());
      return CreateIterResultObject(value, true);
    }

    var result;
    if (arguments.length > 0 && index >= start) {
      var value = arguments[0];
      result = IteratorNext(iterator, value);
    } else {
      result = IteratorNext(iterator);
    }

    if (IteratorComplete(result) === true) {
      O['[[Iterator]]'] = undefined;
      return result;
    }

    O['[[NextIndex]]'] = index + 1;

    if (index >= start) {
      return result;
    }
  }
});

CreateMethodProperty(SlicedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    return CreateIterResultObject(value, true);
  }
  return returnFn.call(iterator, value);
});

CreateMethodProperty(SlicedIteratorPrototype, 'throw', function throw_( exception ) {
  var O = Object(this);
  var iterator = O['[[Iterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    IteratorClose(iterator, NormalCompletion());
    O['[[Iterator]]'] = undefined;
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
});

/**
 * Returns true if any item in the list passes the predicate.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'some', function some( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var index = 0;
  while (true) {
    var result = IteratorNext(O);
    if (IteratorComplete(result) === true) {
      return false;
    }
    var value = IteratorValue(result);
    var testResult = callbackFn.call(T, value, index, O);
    if (Boolean(testResult) === true) {
      IteratorClose(O, NormalCompletion());
      return true;
    }
    index += 1;
  }
});

CreateMethodProperty(IteratorPrototype, 'tee', function tee( amount ) {
  var O = Object(this);
  if (amount === undefined) {
    amount = 2;
  } else {
    amount = ToInteger(amount);
  }
  var bufferTail = { '[[Value]]': undefined, '[[Next]]': undefined };
  var buffer = { '[[Tail]]': bufferTail, '[[Count]]': amount };
  var iterators = Array(amount);
  for (var i = 0; i < amount; i++) {
    var iterator = CreateTeeIterator(O, buffer, bufferTail);
    iterators[i] = iterator;
  }
  return iterators;
});

function CreateTeeIterator(originalIterator, buffer, bufferHead) {
  var iterator = ObjectCreate(
    TeeIteratorPrototype,
    ['[[Iterator]]', '[[Buffer]]', '[[BufferHead]]']
  );
  iterator['[[Iterator]]'] = originalIterator;
  iterator['[[Buffer]]'] = buffer;
  iterator['[[BufferHead]]'] = bufferHead;
  return iterator;
}

var TeeIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(TeeIteratorPrototype, 'next', function next() {
  var O = Object(this);
  var buffer = O['[[Buffer]]'];
  if (buffer === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var bufferHead = O['[[BufferHead]]'];
  var result = bufferHead['[[Value]]'];
  if (result !== undefined) {
    O['[[BufferHead]]'] = bufferHead['[[Next]]'];
  } else {
    var bufferTail = buffer['[[Tail]]'];
    if (bufferHead !== bufferTail) {
      throw new TypeError();
    }
    var iterator = O['[[Iterator]]'];
    result = IteratorNext(iterator);
    bufferHead['[[Value]]'] = result;
    var bufferTail = { '[[Value]]': undefined, '[[Next]]': undefined };
    bufferHead['[[Next]]'] = bufferTail;
    buffer['[[Tail]]'] = bufferTail;
    O['[[BufferHead]]'] = bufferTail;
  }
  if (IteratorComplete(result) === true) {
    buffer['[[Count]]'] = buffer['[[Count]]'] - 1;
    O['[[Iterator]]'] = undefined;
    O['[[Buffer]]'] = undefined;
    O['[[BufferHead]]'] = undefined;
  }
  return result;
});

CreateMethodProperty(TeeIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var buffer = O['[[Buffer]]'];
  if (buffer !== undefined) {
    var count = buffer['[[Count]]'];
    if (count === 1) {
      var iterator = O['[[Iterator]]'];
      IteratorClose(iterator, NormalCompletion());
    }
    buffer['[[Count]]'] = count - 1;
    O['[[Iterator]]'] = undefined;
    O['[[Buffer]]'] = undefined;
    O['[[BufferHead]]'] = undefined;
  }
  return CreateIterResultObject(value, true);
});

/**
 * "zips" other iterables with this iterator, returning a new iterator which
 * yields IteratorResults where the value property contains an array tuple of
 * the values of each iterator.
 */
CreateMethodProperty(IteratorPrototype, 'zip', function zip( /* ...iterables */ ) {
  var O = Object(this);
  var iterators = Array(arguments.length + 1);
  iterators[0] = O;
  for (var i = 0; i < arguments.length; i++) {
    var iterable = Object(arguments[i]);
    iterators[i + 1] = GetIterator(iterable);
  }
  return CreateZipIterator(iterators);
});

function CreateZipIterator(iterators) {
  if (Object(iterators) !== iterators) {
    throw new TypeError();
  }
  var iterator = ObjectCreate(
    ZippedIteratorPrototype,
    ['[[Iterators]]']
  );
  iterator['[[Iterators]]'] = iterators;
  return iterator;
}

var ZippedIteratorPrototype = Object.create(IteratorPrototype);

CreateMethodProperty(ZippedIteratorPrototype, 'next', function next() {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var zippedValues = Array(iterators.length);
  for (var i = 0; i < iterators.length; i++) {
    var iterator = iterators[i];
    var result = IteratorNext(iterator);
    if (IteratorComplete(result) === true) {
      for (var j = 0; j < iterators.length; j++) {
        if (j !== i) {
          iterator = iterators[j];
          IteratorClose(iterator, NormalCompletion());
        }
      }
      return result;
    }
    zippedValues[i] = IteratorValue(result);
  }
  return CreateIterResultObject(zippedValues, false);
});

CreateMethodProperty(ZippedIteratorPrototype, 'return', function return_( value ) {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators !== undefined) {
    for (var i = 0; i < iterators.length; i++) {
      var iterator = iterators[i];
      IteratorClose(iterator, NormalCompletion());
    }
  }
  return CreateIterResultObject(value, true);
});
