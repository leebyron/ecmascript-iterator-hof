"use strict";

require('./ecmascript-reverse-iterator/polyfill-spec');


function AbruptCompleteIterator(O) {
  if (Object(O) !== O) {
    throw new TypeError();
  }
  var returnFn = GetMethod(O, 'return');
  if (returnFn !== undefined && IsCallable(returnFn) === true) {
    return returnFn.call(iterator);
  }
}


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
    var value = result.value;
    if (callbackFn.call(this, value)) {
      return result;
    }
  };
  var thisArg;
  if (arguments.length > 1) {
    thisArg = arguments[1];
  }
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
    var value = result.value;
    var mappedValue = callbackFn.call(this, value);
    return CreateIterResultObject(mappedValue, false);
  };
  var thisArg;
  if (arguments.length > 1) {
    thisArg = arguments[1];
  }
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
  var next = GetMethod(O, 'next');
  if (IsCallable(next) === false) {
    throw new TypeError();
  }
  var reduced;
  var result;
  if (arguments.length > 1) {
    reduced = arguments[1];
  } else {
    result = next.call(this);
    if (result.done) {
      throw new TypeError('Reduce of empty with no initial value.');
    }
    reduced = result.value;
  }

  while (true) {
    result = next.call(this);
    if (result.done !== false) {
      return reduced;
    }
    var value = result.value;
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
  var thisArg;
  if (arguments.length > 1) {
    thisArg = arguments[1];
  }
  return CreateTransformedIterator(O, callbackFn, thisArg);
});

function CreateTransformedIterator(originalIterator, transformer, context) {
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
    var nextFn = iterator.next;
    var result = nextFn.apply(iterator, arguments);
    if (result.done !== false) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      return result;
    }
    result = transformer.call(context, result);
    if (result === undefined || result === null) {
      continue;
    }
    if (Object(result) !== result) {
      throw new TypeError('Transformer must return Object or undefined.');
    }
    if (result.hasOwnProperty('done') === false ||
        result.hasOwnProperty('value') === false) {
      throw new TypeError('Transformer must return IteratorResult.');
    }
    if (result.done !== false) {
      O['[[OriginalIterator]]'] = undefined;
      O['[[TransformFunction]]'] = undefined;
      O['[[TransformContext]]'] = undefined;
      AbruptCompleteIterator(iterator);
    }
    return result;
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
  return returnFn.call(iterator);
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
    var zippedValues = [ result.value ];
    for (var i = 0; i < iterators.length; i++) {
      var iterator = iterators[i];
      var next = GetMethod(iterator, 'next');
      if (IsCallable(next) === false) {
        throw new TypeError();
      }
      var otherResult = next.call(iterator);
      if (otherResult.done !== false) {
        for (var j = 0; j < iterators.length; j++) {
          if (j !== i) {
            iterator = iterators[j];
            AbruptCompleteIterator(iterator);
          }
        }
        return otherResult;
      }
      zippedValues.push(otherResult.value);
    }
    return CreateIterResultObject(zippedValues, false);
  };
  return CreateTransformedIterator(O, zipTransformer);
});


// TODO: concat, some, every

// TODO: Reduced() proposal

// TODO: into should be it's own proposal
CreateMethodProperty(IteratorPrototype, 'into', function ( collectionType ) {
  var fromIterator = GetMethod(collectionType, Symbol.fromIterator);
  if (fromIterator === undefined) {
    throw new TypeError('Must provide collection type which accepts Iterator.');
  }
  return fromIterator.call(collectionType, this);
});

Symbol.fromIterator = Symbol('fromIterator');

CreateMethodProperty(Array, Symbol.fromIterator, function (iterator) {
  var array = new this();
  var result;
  while (!(stepResult = iterator.next()).done) {
    array.push(stepResult.value);
  }
  return array;
});
