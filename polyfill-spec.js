"use strict";

require('./ecmascript-reverse-iterator/polyfill-spec');


CreateMethodProperty(IteratorPrototype, 'concat', function (/*...iterables*/) {
  var O = Object(this);
  if (arguments.length === 0) {
    return O;
  }
  var iterators = new Array(arguments.length + 1);
  iterators[0] = O;
  for (var i = 0; i < arguments.length; i++) {
    var iterable = arguments[i];
    if (IsConcatIterable(iterable) === false) {
      iterable = [iterable];
    }
    iterators[i + 1] = GetIterator(iterable);
  }
  return CreateConcatIterator(iterators);
});

function IsConcatIterable(O) {
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
  var isReversable = true;
  for (var i = 0; i < iterators.length; i++) {
    var maybeReversable = iterators[i];
    var usingReverseIterator = GetMethod(maybeReversable, Symbol.reverseIterator);
    if (usingReverseIterator === undefined) {
      isReversable = false;
      break;
    }
  }
  if (isReversable) {
    CreateMethodProperty(iterator, Symbol.reverseIterator, ConcatIteratorReverse);
  }
  var isReturnable = false;
  for (var i = 0; i < iterators.length; i++) {
    var maybeReturnable = iterators[i];
    var usingReturn = GetMethod(maybeReturnable, 'return');
    if (usingReturn !== undefined) {
      isReturnable = true;
      break;
    }
  }
  if (isReturnable) {
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

function ConcatIteratorReverse() {
  var O = Object(this);
  var state = O['[[State]]'];
  if (state !== 0) {
    throw new TypeError();
  }
  var iterators = O['[[Iterators]]'];
  if (Object(iterators) !== iterators) {
    throw new TypeError();
  }
  var reverseIterators = new Array(iterators.length);
  for (var i = 0; i < iterators.length; i++) {
    var iterator = iterators[i];
    var usingReverseIterator = GetMethod(iterator, Symbol.reverseIterator);
    var reverseIterator = GetIterator(iterator, usingReverseIterator);
    reverseIterators[iterators.length - 1 - i] = reverseIterator;
  }
  return CreateConcatIterator(reverseIterators);
}

function ConcatIteratorReturn(value) {
  var O = Object(this);
  var iterators = O['[[Iterators]]'];
  if (iterators !== undefined) {
    var state = O['[[State]]'];
    for (var i = state; i < iterators.length; i++) {
      var iterator = iterators[i];
      IteratorClose(O, NormalCompletion());
    }
  }
  return CreateIterResultObject(value, true);
}

/**
 * Returns true if all items in the list pass the predicate.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'every', function (callbackFn /*[ , initialValue ]*/) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  while (true) {
    var next = IteratorStep(O);
    if (next === false) {
      return true;
    }
    var value = IteratorValue(next);
    var testResult = ToBoolean(callbackFn.call(T, value));
    if (testResult === false) {
      IteratorClose(O, NormalCompletion());
      return false;
    }
  }
});

/**
 * A specific `transform` which uses a predicate callbackFn returns true to keep
 * values or false to skip values of this iterator. Returns a new iterator.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'filter', function ( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var thisArg = arguments.length > 1 ? arguments[1] : undefined;
  var context = {
    '[[CallbackFunction]]': callbackFn,
    '[[CallbackContext]]': thisArg
  };
  return CreateTransformedIterator(O, FilterIteratorTransform, context);
});

function FilterIteratorTransform(result) {
  var O = Object(this);
  var callbackFn = O['[[CallbackFunction]]'];
  var thisArg = O['[[CallbackContext]]'];
  var value = IteratorValue(result);
  if (ToBoolean(callbackFn.call(thisArg, value)) === false) {
    return undefined;
  }
  return result;
}

/**
 * A specific `transform` which uses a mapper callbackFn to map from original
 * values to new values. Returns a new iterator. Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'map', function ( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var thisArg = arguments.length > 1 ? arguments[1] : undefined;
  var context = {
    '[[CallbackFunction]]': callbackFn,
    '[[CallbackContext]]': thisArg
  };
  return CreateTransformedIterator(O, MapIteratorTransform, context);
});

function MapIteratorTransform(result) {
  var O = Object(this);
  var callbackFn = O['[[CallbackFunction]]'];
  var thisArg = O['[[CallbackContext]]'];
  var value = IteratorValue(result);
  var mappedValue = callbackFn.call(thisArg, value);
  return CreateIterResultObject(mappedValue, false);
}

/**
 * Reduces this iterator with a reducing callbackFn to a single value.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'reduce', function ( callbackFn /*[ , initialValue ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var reduced;
  var next;
  if (arguments.length > 1) {
    reduced = arguments[1];
  } else {
    next = IteratorStep(O);
    if (next === false) {
      throw new TypeError('Reduce of empty with no initial value.');
    }
    reduced = IteratorValue(next);
  }

  while (true) {
    next = IteratorStep(O);
    if (next === false) {
      return reduced;
    }
    var value = IteratorValue(next);
    reduced = callbackFn(reduced, value);
  }
});

/**
 * Reduces this iterator in reverse order, throws if iterator is not reversable.
 * Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'reduceRight', function (callbackFn /*[ , initialValue ]*/ ) {
  var O = Object(this);
  var reduce = GetMethod(O, 'reduce');
  if (IsCallable(reduce) === false) {
    throw new TypeError();
  }
  var usingReverseIterator = GetMethod(O, Symbol.reverseIterator);
  var reverseIterator = GetIterator(O, usingReverseIterator);
  return reduce.apply(reverseIterator, arguments);
});

/**
 * Returns true if any item in the list passes the predicate.
 * Consumes the iterable.
 */
CreateMethodProperty(IteratorPrototype, 'some', function (callbackFn /*[ , initialValue ]*/) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var T = arguments.length > 1 ? arguments[1] : undefined;
  while (true) {
    var next = IteratorStep(O);
    if (next === false) {
      return false;
    }
    var value = IteratorValue(next);
    var testResult = ToBoolean(callbackFn.call(T, value));
    if (testResult === true) {
      IteratorClose(O, NormalCompletion());
      return true;
    }
  }
});

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
CreateMethodProperty(IteratorPrototype, 'transform', function ( callbackFn /*[ , thisArg ]*/ ) {
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
    ['[[OriginalIterator]]', '[[TransformFunction]]', '[[TransformContext]]']
  );
  iterator['[[OriginalIterator]]'] = originalIterator;
  iterator['[[TransformFunction]]'] = transformer;
  iterator['[[TransformContext]]'] = context;
  CreateMethodProperty(iterator, 'next', TransformedIteratorNext);
  var reverseIterable = originalIterator[Symbol.reverseIterator];
  if (IsCallable(reverseIterable) === true) {
    CreateMethodProperty(iterator, Symbol.reverseIterator, TransformedIteratorReverse);
  }
  var returnFn = iterator['return'];
  if (IsCallable(returnFn) === true) {
    CreateMethodProperty(iterator, 'return', TransformedIteratorReturn);
  }
  var throwFn = iterator['throw'];
  if (IsCallable(throwFn) === true) {
    CreateMethodProperty(iterator, 'throw', TransformedIteratorThrow);
  }
  return iterator;
}

function TransformedIteratorNext() {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(undefined, true);
  }
  var transformer = O['[[TransformFunction]]'];
  var context = O['[[TransformContext]]'];
  while (true) {
    var next = IteratorStep(iterator);
    if (next === false) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      return next;
    }
    next = transformer.call(context, next);
    if (next === undefined || next === null) {
      continue;
    }
    if (IteratorComplete(next) === true) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      IteratorClose(iterator, NormalCompletion());
    }
    return next;
  }
}

function TransformedIteratorReverse() {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  var usingReverseIterator = iterator[Symbol.reverseIterator];
  if (usingReverseIterator === undefined) {
    throw new TypeError('Iterator is not reversable.');
  }
  var reverseIterator = GetIterator(iterator, usingReverseIterator);
  var transformer = O['[[TransformFunction]]'];
  var context = O['[[TransformContext]]'];
  return CreateTransformedIterator(reverseIterator, transformer, context);
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
 * A specific `transform` which "zips" another iterable with this iterator,
 * returning a new iterator which yields IteratorResults where the value
 * property contains an array tuple of the values of each iterator.
 */
CreateMethodProperty(IteratorPrototype, 'zip', function (/* ...iterables */) {
  var O = Object(this);
  var iterators = new Array(arguments.length);
  for (var i = 0; i < arguments.length; i++) {
    var iterable = Object(arguments[i]);
    iterators[i] = GetIterator(iterable);
  }
  var zipTransformer = function (result) {
    var zippedValues = new Array(iterators.length + 1);
    zippedValues[0] = IteratorValue(result);
    for (var i = 0; i < iterators.length; i++) {
      var iterator = iterators[i];
      var next = IteratorStep(iterator);
      if (next === false) {
        for (var j = 0; j < iterators.length; j++) {
          if (j !== i) {
            iterator = iterators[j];
            IteratorClose(iterator, NormalCompletion());
          }
        }
        return otherResult;
      }
      zippedValues[i + 1] = IteratorValue(next);
    }
    return CreateIterResultObject(zippedValues, false);
  };
  return CreateTransformedIterator(O, zipTransformer);
});


// TODO: move ES6 spec details only used by this spec into this repo

// TODO: Reduced() proposal

// TODO: into should be it's own FromIterable proposal.
// It should also affect Promise.all
// CreateMethodProperty(IteratorPrototype, 'into', function ( collectionType ) {
//   var fromIterator = GetMethod(collectionType, Symbol.fromIterator);
//   if (fromIterator === undefined) {
//     throw new TypeError('Must provide collection type which accepts Iterator.');
//   }
//   return fromIterator.call(collectionType, this);
// });

// Symbol.fromIterator = Symbol('fromIterator');

// CreateMethodProperty(Array, Symbol.fromIterator, function (iterator) {
//   var array = new this();
//   while (true) {
//     var next = IteratorStep(iterator);
//     if (next === false) {
//       return array;
//     }
//     var value = IteratorValue(next);
//     array.push(value);
//   }
// });
