"use strict";

require('./es6');

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

function CreateAdaptedIterator(originalIterator) {
  if (Object(originalIterator) !== originalIterator) {
    throw new TypeError();
  }
  var iterator = ObjectCreate(
    IteratorPrototype,
    ['[[OriginalIterator]]']
  );
  iterator['[[OriginalIterator]]'] = originalIterator;
  CreateMethodProperty(iterator, 'next', AdaptedIteratorNext);
  var returnFn = originalIterator['return'];
  if (IsCallable(returnFn) === true) {
    CreateMethodProperty(iterator, 'return', AdaptedIteratorReturn);
  }
  var throwFn = originalIterator['throw'];
  if (IsCallable(throwFn) === true) {
    CreateMethodProperty(iterator, 'throw', AdaptedIteratorThrow);
  }
  return iterator;
}

function AdaptedIteratorNext(/*[ value ]*/) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  if (arguments.length > 0) {
    var value = arguments[0];
    return IteratorNext(iterator, value);
  } else {
    return IteratorNext(iterator);
  }
}

function AdaptedIteratorReturn(value) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    throw new TypeError();
  }
  return returnFn.call(iterator, value);
}

function AdaptedIteratorThrow(exception) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
}

function IsSomeReturnable(iterators) {
  for (var i = 0; i < iterators.length; i++) {
    var iterator = iterators[i];
    var usingReturn = GetMethod(iterator, 'return');
    if (usingReturn !== undefined) {
      return true;
    }
  }
  return false;
}

CreateMethodProperty(IteratorPrototype, 'concat', function IteratorPrototype_concat( /* ...iterables */ ) {
  var O = Object(this);
  if (arguments.length === 0) {
    return O;
  }
  var iterators = Array(arguments.length + 1);
  iterators[0] = O;
  for (var i = 0; i < arguments.length; i++) {
    var iterable = arguments[i];
    if (IsIteratorConcatSpreadable(iterable) === false) {
      iterable = [iterable];
    }
    iterators[i + 1] = GetIterator(iterable);
  }
  return CreateConcatIterator(iterators);
});

function IsIteratorConcatSpreadable(O) {
  if (Object(O) !== O) {
    return false;
  }
  if (GetMethod(O, Symbol.iterator) === undefined) {
    return false;
  }
  var spreadable = O[Symbol.isConcatSpreadable];
  if (spreadable !== undefined) {
    return ToBoolean(spreadable);
  }
  return true;
}

function CreateConcatIterator(iterators) {
  if (Object(iterators) !== iterators) {
    throw new TypeError();
  }
  var iterator = ObjectCreate(
    IteratorPrototype,
    ['[[Iterators]]', '[[State]]']
  );
  iterator['[[Iterators]]'] = iterators;
  iterator['[[State]]'] = 0;
  CreateMethodProperty(iterator, 'next', ConcatIteratorNext);
  if (IsSomeReturnable(iterators) === true) {
    CreateMethodProperty(iterator, 'return', ConcatIteratorReturn);
  }
  return iterator;
}

function ConcatIteratorNext() {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var state = O['[[State]]'];
  while (true) {
    var iterator = iterators[state];
    var next = IteratorNext(iterator);
    if (IteratorComplete(next) === false) {
      return next;
    }
    state = state + 1;
    var len = iterators.length;
    if (state === len) {
      O['[[Iterators]]'] = undefined;
      return next;
    }
    O['[[State]]'] = state;
  }
}

function ConcatIteratorReturn(value) {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators !== undefined) {
    var state = O['[[State]]'];
    for (var i = state; i < iterators.length; i++) {
      var iterator = iterators[i];
      IteratorClose(iterator, NormalCompletion());
    }
  }
  return CreateIterResultObject(value, true);
}

/**
 * Returns true if the search-element in the iterated values.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'includes', function IteratorPrototype_includes( searchElement ) {
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
CreateMethodProperty(IteratorPrototype, 'every', function IteratorPrototype_every( callbackFn /*[ , thisArg ]*/ ) {
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
    var testResult = ToBoolean(callbackFn.call(T, value, index, O));
    if (testResult === false) {
      IteratorClose(O, NormalCompletion());
      return false;
    }
    index += 1;
  }
});

/**
 * A specific `transform` which uses a predicate callbackFn returns true to keep
 * values or false to skip values of this iterator. Returns a new iterator.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'filter', function IteratorPrototype_filter( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var context = {
    '[[FilterFunction]]': callbackFn,
    '[[FilterContext]]': T
  };
  return CreateTransformedIterator(O, FilterIteratorTransform, context);
});

function FilterIteratorTransform(result, index) {
  var O = Object(this);
  var callbackFn = O['[[FilterFunction]]'];
  var T = O['[[FilterContext]]'];
  var value = IteratorValue(result);
  if (ToBoolean(callbackFn.call(T, value, index, O)) === false) {
    return undefined;
  }
  return result;
}

/**
 * Flattens an iterator of (concat-spreadable) iterables, returning an iterator
 * of flattened values. Accepts a maximum depth to flatten to, which must be >0
 * and defaults to +Infinity.
 */
CreateMethodProperty(IteratorPrototype, 'flatten', function IteratorPrototype_flatten( /* [ depth ] */ ) {
  var O = Object(this);
  var depth;
  if (arguments.length === 0) {
    depth = Infinity;
  } else {
    depth = ToInteger(arguments[0]);
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
      if (IsIteratorConcatSpreadable(value) === true) {
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
      var result = throwFn.call(iterator, exception);
      var done = IteratorComplete(innerResult);
      if (done === true) {
        var value = IteratorValue(innerResult);
        // Return Completion{[[type]]: return , [[value]]:value, [[target]]:empty}.
        return value;
      }
    } else {
      IteratorClose(iterator, NormalCompletion());
    }
  }
  // NOTE: The next step throws a TypeError to indicate that there was a
  // protocol violation: iterator does not have a throw method.
  throw new TypeError();
}

/**
 * Equivalent to a for-of loop. Does not return any value.
 */
CreateMethodProperty(IteratorPrototype, 'forEach', function IteratorPrototype_forEach( callbackFn /*[ , thisArg ]*/ ) {
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
 * A specific `transform` which uses a mapper callbackFn to map from original
 * values to new values. Returns a new iterator. Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'map', function IteratorPrototype_map( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  var context = {
    '[[MapFunction]]': callbackFn,
    '[[MapContext]]': T
  };
  return CreateTransformedIterator(O, MapIteratorTransform, context);
});

function MapIteratorTransform(result, index) {
  var O = Object(this);
  var callbackFn = O['[[MapFunction]]'];
  var T = O['[[MapContext]]'];
  var value = IteratorValue(result);
  var mappedValue = callbackFn.call(T, value, index, O);
  return CreateIterResultObject(mappedValue, false);
}

/**
 * Reduces this iterator with a reducing callbackFn to a single value.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'reduce', function IteratorPrototype_reduce( callbackFn /*[ , initialValue ]*/ ) {
  var O = Object(this);
  if (arguments.length > 1) {
    return ReduceIterator(O, callbackFn, initialValue);
  }
  return ReduceIterator(O, callbackFn);
});

function ReduceIterator(iterator, reducerFn, initialValue) {
  if (IsCallable(reducerFn) === false) {
    throw new TypeError();
  }
  var result;
  var accumulator;
  var index = 0;
  if (arguments.length > 2) {
    accumulator = initialValue;
  } else {
    result = IteratorNext(iterator);
    if (IteratorComplete(result) === true) {
      throw new TypeError('Reduce of empty iterator with no initial value.');
    }
    accumulator = IteratorValue(result);
    index += 1;
  }

  while (true) {
    result = IteratorNext(iterator);
    if (IteratorComplete(result) === true) {
      return accumulator;
    }
    var value = IteratorValue(result);
    accumulator = reducerFn(accumulator, value, index, iterator);
    index += 1;
  }
}

/**
 * Returns a new iterator which represents a slice of this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'slice', function IteratorPrototype_slice( start, end ) {
  var O = Object(this);
  var relativeStart = ToInteger(start);
  if (relativeStart < 0) {
    throw new TypeError('Slice start must not be negative.');
  }
  var relativeEnd;
  if (end === undefined) {
    relativeEnd = Infinity;
  } else {
    relativeEnd = ToInteger(end);
    if (relativeEnd < 0) {
      throw new TypeError('Slice end must not be negative.');
    }
  }
  var context = {
    '[[Start]]': relativeStart,
    '[[End]]': relativeEnd,
    '[[Count]]': 0
  };
  return CreateTransformedIterator(O, SliceIteratorTransform, context);
});

function SliceIteratorTransform(result) {
  var O = Object(this);
  var start = O['[[Start]]'];
  var end = O['[[End]]'];
  var count = O['[[Count]]'];
  O['[[Count]]'] = count + 1;
  if (count < start) {
    return undefined;
  }
  if (count === end) {
    return CreateIterResultObject(undefined, true);
  }
  return result;
}

/**
 * Returns true if any item in the list passes the predicate.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'some', function IteratorPrototype_some( callbackFn /*[ , thisArg ]*/ ) {
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
    var testResult = ToBoolean(callbackFn.call(T, value, index, O));
    if (testResult === true) {
      IteratorClose(O, NormalCompletion());
      return true;
    }
    index += 1;
  }
});

CreateMethodProperty(IteratorPrototype, 'tee', function IteratorPrototype_tee( amount ) {
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
    IteratorPrototype,
    ['[[OriginalIterator]]', '[[Buffer]]', '[[BufferHead]]']
  );
  iterator['[[OriginalIterator]]'] = originalIterator;
  iterator['[[Buffer]]'] = buffer;
  iterator['[[BufferHead]]'] = bufferHead;
  CreateMethodProperty(iterator, 'next', TeeIteratorNext);
  CreateMethodProperty(iterator, 'return', TeeIteratorReturn);
  return iterator;
}

function TeeIteratorNext() {
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
    var iterator = O['[[OriginalIterator]]'];
    result = IteratorNext(iterator);
    bufferHead['[[Value]]'] = result;
    var bufferTail = { '[[Value]]': undefined, '[[Next]]': undefined };
    bufferHead['[[Next]]'] = bufferTail;
    buffer['[[Tail]]'] = bufferTail;
    O['[[BufferHead]]'] = bufferTail;
  }
  if (IteratorComplete(result) === true) {
    buffer['[[Count]]'] = buffer['[[Count]]'] - 1;
    O['[[OriginalIterator]]'] = undefined;
    O['[[Buffer]]'] = undefined;
    O['[[BufferHead]]'] = undefined;
  }
  return result;
}

function TeeIteratorReturn(value) {
  var O = Object(this);
  var buffer = O['[[Buffer]]'];
  if (buffer !== undefined) {
    var count = buffer['[[Count]]'];
    if (count === 1) {
      var iterator = O['[[OriginalIterator]]'];
      IteratorClose(iterator); // TODO note why no completion record?
    }
    buffer['[[Count]]'] = count - 1;
    O['[[OriginalIterator]]'] = undefined;
    O['[[Buffer]]'] = undefined;
    O['[[BufferHead]]'] = undefined;
  }
  return CreateIterResultObject(value, true);
}

/**
 * Transforms this iterator into a new iterator by mapping each IteratorResult
 * with the transforming callbackFn. Consumes this iterator.
 *
 * callbackFn should accept one argument *result*, the IteratorResult returned
 * by this iterator's `next` method. It should return either an IteratorResult
 * or undefined/null. This affords a transformer a few outcomes:
 *
 *  * Yield the original *result* unchanged - simply return *result*
 *  * Map the original value to a new value - return a new IteratorResult with
 *    the desired value.
 *  * Filter out the original value - return undefined or null
 *  * End iteration early - return IteratorResult where *done* is **true**.
 *
 */
CreateMethodProperty(IteratorPrototype, 'transform', function IteratorPrototype_transform( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  var thisArg = arguments.length > 1 ? arguments[1] : undefined;
  return CreateTransformedIterator(O, callbackFn, thisArg);
});

function CreateTransformedIterator(originalIterator, transformer, context) {
  if (Object(originalIterator) !== originalIterator) {
    throw new TypeError();
  }
  if (IsCallable(transformer) === false) {
    throw new TypeError();
  }
  var iterator = ObjectCreate(
    IteratorPrototype,
    ['[[OriginalIterator]]', '[[TransformFunction]]', '[[TransformContext]]', '[[TransformIndex]]']
  );
  iterator['[[OriginalIterator]]'] = originalIterator;
  iterator['[[TransformFunction]]'] = transformer;
  iterator['[[TransformContext]]'] = context;
  iterator['[[TransformIndex]]'] = 0;

  CreateMethodProperty(iterator, 'next', TransformedIteratorNext);
  var returnFn = originalIterator['return'];
  if (IsCallable(returnFn) === true) {
    CreateMethodProperty(iterator, 'return', TransformedIteratorReturn);
  }
  var throwFn = originalIterator['throw'];
  if (IsCallable(throwFn) === true) {
    CreateMethodProperty(iterator, 'throw', TransformedIteratorThrow);
  }
  return iterator;
}

function TransformedIteratorNext( /*[ value ]*/ ) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var transformer = O['[[TransformFunction]]'];
  var context = O['[[TransformContext]]'];
  var result;
  if (arguments.length > 0) {
    var value = arguments[0];
    result = IteratorNext(iterator, value);
  } else {
    result = IteratorNext(iterator);
  }
  while (true) {
    if (IteratorComplete(result) === true) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      O['[[TransformIndex]]'] = undefined;
      return result;
    }
    var index = O['[[TransformIndex]]'];
    result = transformer.call(context, result, index, O);
    O['[[TransformIndex]]'] = index + 1;
    if (result === undefined || result === null) {
      result = IteratorNext(iterator);
      continue;
    }
    if (Object(result) !== result) {
      throw new TypeError();
    }
    if (IteratorComplete(result) === true) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      O['[[TransformIndex]]'] = undefined;
      IteratorClose(iterator, NormalCompletion());
    }
    return result;
  }
}

function TransformedIteratorReturn(value) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = GetMethod(iterator, 'return');
  if (IsCallable(returnFn) === false) {
    throw new TypeError();
  }
  return returnFn.call(iterator, value);
}

function TransformedIteratorThrow(exception) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    throw exception;
  }
  var throwFn = GetMethod(iterator, 'throw');
  if (IsCallable(throwFn) === false) {
    throw new TypeError();
  }
  return throwFn.call(iterator, exception);
}


/**
 * "zips" other iterables with this iterator, returning a new iterator which
 * yields IteratorResults where the value property contains an array tuple of
 * the values of each iterator.
 */
CreateMethodProperty(IteratorPrototype, 'zip', function IteratorPrototype_zip( /* ...iterables */ ) {
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
    IteratorPrototype,
    ['[[Iterators]]']
  );
  iterator['[[Iterators]]'] = iterators;
  CreateMethodProperty(iterator, 'next', ZipIteratorNext);
  if (IsSomeReturnable(iterators) === true) {
    CreateMethodProperty(iterator, 'return', ZipIteratorReturn);
  }
  return iterator;
}

function ZipIteratorNext() {
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
}

function ZipIteratorReturn(value) {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators !== undefined) {
    for (var i = 0; i < iterators.length; i++) {
      var iterator = iterators[i];
      IteratorClose(iterator, NormalCompletion());
    }
  }
  return CreateIterResultObject(value, true);
}
