"use strict";

// 7.2.2
function IsCallable(argument) {
  return typeof argument === 'function';
}

// 7.3.5
function CreateMethodProperty(O, P, V) {
  var newDesc = {
    value: V,
    writable: true,
    enumerable: false,
    configurable: false,
  };
  return Object.defineProperty(O, P, newDesc);
}

// 7.3.7
function GetMethod(O, P) {
  // 1. Assert: Type(O) is Object.
  if (Object(O) !== O) {
    throw new TypeError();
  }
  // 2. Assert: IsPropertyKey(P) is true.
  // 3. Let func be the result of calling the [[Get]] internal method of O passing P and O as the arguments.
  // 4. ReturnIfAbrupt(func).
  var func = O[P];
  // 5. If func is either undefined or null, then return undefined.
  if (func === undefined || func === null) {
    return undefined;
  }
  // 6. If IsCallable(func) is false, then throw a TypeError exception.
  if (IsCallable(func) === false) {
    throw new TypeError();
  }
  // 7. Return func.
  return func;
}

// 7.4.2
function GetIterator(obj, method) {
  // 1. ReturnIfAbrupt(obj).
  // 2. If method was not passed, then
  if (arguments.length < 2) {
    // a. Let method be GetMethod(obj, @@iterator).
    // b. ReturnIfAbrupt(method).
    method = GetMethod(obj, Symbol.iterator);
  }
  // 3. If IsCallable(method) is false, then throw a TypeError exception.
  if (IsCallable(method) === false) {
    throw new TypeError('method must be callable');
  }
  // 4. Let iterator be the result of calling the [[Call]] internal method of
  //    method with obj as thisArgument and an empty List as argumentsList.
  var iterator = method.call(obj);
  // 5. ReturnIfAbrupt(iterator).
  // 6. If Type(iterator) is not Object, then throw a TypeError exception.
  if (Object(iterator) !== iterator) {
    throw new TypeError('method must return an iterator');
  }
  // 7. Return iterator.
  return iterator;
}

// 7.4.8
function CreateIterResultObject(value, done) {
  // 1. Assert: Type(done) is Boolean.
  // 2. Let obj be ObjectCreate(%ObjectPrototype%).
  // 3. Perform CreateDataProperty(obj, "value", value).
  // 4. Perform CreateDataProperty(obj, "done", done).
  // 5. Return obj.
  return { value: value, done: done };
}

// 9.1.13
function ObjectCreate(proto, internalSlotsList) {
  var properties = {};
  if (internalSlotsList) {
    for (var ii = 0; ii < internalSlotsList.length; ii++) {
      var name = internalSlotsList[ii];
      properties[name] = { writable: true, configurable: false, enumerable: false };
    }
  }
  return Object.create(proto, properties);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

CreateMethodProperty(IteratorPrototype, Symbol.iterator, function() { return this; });
CreateMethodProperty(Array.prototype, 'values', Array.prototype[Symbol.iterator]);


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function AbruptCompleteIterator(O) {
  if (Object(O) !== O) {
    throw new TypeError();
  }
  var returnFn = O.return;
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
  var next = O.next;
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
 * Transforms this iterator into a new iterator by mapping each IteratorResult
 * with the transforming callbackFn. Consumes this iterator.
 *
 * callbackFn should accept one argument: the IteratorResult returned by this
 * iterator's `next` method. It should return either an IteratorResult or
 * undefined/null.
 *
 * If callbackFn returns an IteratorResult with done = true, the resulting
 * iterator will stop iteration and callbackFn will not be called again.
 *
 * If callbackFn returns undefined or null, that IteratorResult will be skipped.
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
  iterator.next = TransformedIteratorNext;
  var returnFn = iterator.return;
  if (IsCallable(returnFn)) {
    iterator.return = TransformedIteratorReturn;
  }
  return iterator;
}

function TransformedIteratorReturn(value) {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    return CreateIterResultObject(value, true);
  }
  var returnFn = iterator.return;
  if (IsCallable(returnFn) === false) {
    throw new TypeError();
  }
  return returnFn.call(iterator);
}

function TransformedIteratorNext() {
  var O = Object(this);
  var iterator = O['[[OriginalIterator]]'];
  if (iterator === undefined) {
    CreateIterResultObject(undefined, true);
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

/**
 * A specific `transform` which "zips" another iterable with this iterator,
 * returning a new iterator which yields IteratorResults where the value
 * property contains an array tuple of the values of each iterator.
 */
CreateMethodProperty(IteratorPrototype, 'zip', function (/* ...iterables */) {
  var O = Object(this);
  var iterators = [];
  for (var i = 0; i < arguments.length; i++) {
    var iterable = Object(arguments[i]);
    var iterator = GetIterator(iterable);
    iterators.push(iterator);
  }
  var zipTransformer = function (result) {
    var zippedValues = [ result.value ];
    for (var i = 0; i < iterators.length; i++) {
      var iterator = iterators[i];
      var next = iterator.next;
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


// TODO: concat, some, every, reduceRight

// TODO: build atop the ReverseIterable protocol

// TODO: Reduced() proposal

// TODO: into should be it's own proposal
CreateMethodProperty(IteratorPrototype, 'into', function ( collectionType ) {
  var fromIterator = collectionType[Symbol.fromIterator];
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
