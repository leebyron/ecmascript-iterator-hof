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
    var iterable = Object(arguments[i]);
    if (GetMethod(iterable, Symbol.iterator) === undefined ||
        IsConcatSpreadable(iterable) === false) {
      iterable = [iterable];
    }
    iterators[i + 1] = GetIterator(iterable);
  }
  return CreateConcatIterator(iterators);
});

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
    var iterator = iterators[i];
    var usingReverseIterator = GetMethod(originalIterator, Symbol.reverseIterator);
    if (usingReverseIterator === undefined) {
      isReversable = false;
      break;
    }
  }
  if (isReversable) {
    CreateMethodProperty(iterator, Symbol.reverseIterator, ConcatIteratorReverse);
  }
  var returnFn = iterator['return'];
  if (IsCallable(returnFn) === true) {
    CreateMethodProperty(iterator, 'return', ConcatIteratorReturn);
  }
  var throwFn = iterator['throw'];
  if (IsCallable(throwFn) === true) {
    CreateMethodProperty(iterator, 'throw', ConcatIteratorThrow);
  }
  return iterator;
}

function ConcatIteratorNext() {
  // TODO
  // 1. Let O be ToObject(this value).
  // 2. ReturnIfAbrupt(O).
  // 3. Let A be ArraySpeciesCreate(O, 0).
  // 4. ReturnIfAbrupt(A).
  // 5. Let n be 0.
  // 6. Let items be a List whose first element is O and whose subsequent elements are, in left to right order, the arguments that were passed to this function invocation.
  // 7. Repeat, while items is not empty
  //   a. Remove the first element from items and let E be the value of the element.
  //   b. Let spreadable be IsConcatSpreadable(E).
  //   c. ReturnIfAbrupt(spreadable).
  //   d. If spreadable is true, then
  //     i. Let k be 0.
  //     ii. Let len be ToLength(Get(E, "length")).
  //     iii. ReturnIfAbrupt(len).
  //     iv. If n + len > 253-1, throw a TypeError exception.
  //     v. Repeat, while k < len
  //       1. Let P be ToString(k).
  //       2. Let exists be HasProperty(E, P).
  //       3. ReturnIfAbrupt(exists).
  //       4. If exists is true, then
  //         a. Let subElement be Get(E, P).
  //         b. ReturnIfAbrupt(subElement).
  //         c. Let status be CreateDataPropertyOrThrow (A, ToString(n), subElement). d. ReturnIfAbrupt(status).
  //       5. Increase n by 1.
  //       6. Increase k by 1.
  //   e. Else E is added as a single item rather than spread,
  //     i. If n ≥ 253-1, throw a TypeError exception.
  //     ii. Let status be CreateDataPropertyOrThrow (A, ToString(n), E).
  //     iii. ReturnIfAbrupt(status).
  //     iv. Increase n by 1.
  // 8. Let setStatus be Set(A, "length", n, true).
  // 9. ReturnIfAbrupt(setStatus).
  // 10. Return A.
}

function ConcatIteratorReverse() {
  var O = Object(this);
  var state = O['[[state]]'];
  if (state !== 0) {
    throw new TypeError();
  }
  var iterators = O['[[iterators]]'];
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
  // TODO
}

function ConcatIteratorThrow(exception) {
  // TODO
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
  var filterTransformer = function (result) {
    var value = IteratorValue(result);
    if (callbackFn.call(this, value)) {
      return result;
    }
  };
  var thisArg = arguments.length > 1 ? arguments[1] : undefined;
  return CreateTransformedIterator(O, filterTransformer, thisArg);
});

/**
 * A specific `transform` which uses a mapper callbackFn to map from original
 * values to new values. Returns a new iterator. Consumes this iterator.
 */
CreateMethodProperty(IteratorPrototype, 'map', function ( callbackFn /*[ , thisArg ]*/ ) {
  var O = Object(this);
  if (IsCallable(callbackFn) === false) {
    throw new TypeError();
  }
  var mapTransformer = function (result) {
    var value = IteratorValue(result);
    var mappedValue = callbackFn.call(this, value);
    return CreateIterResultObject(mappedValue, false);
  };
  var thisArg = arguments.length > 1 ? arguments[1] : undefined;
  return CreateTransformedIterator(O, mapTransformer, thisArg);
});

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
