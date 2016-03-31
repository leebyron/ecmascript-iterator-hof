"use strict";

/**
 * The following definitions are all currently specced ECMAScript behavior
 * defined in https://tc39.github.io/ecma262/.
 *
 * The new functions exposed via global represent Abstract Operations that are
 * internal to the implementation of ECMAScript, and are not intended to be
 * exposed as callable functions. These functions are provided such that example
 * implementations of proposed specification additions can be written in a form
 * that very closely matches its associated specification text.
 *
 * These definitions are provided in full for clarity and correctness, and do
 * not necessarily indicate optimal spec-compliant implementations.
 */

// 5.2
global.Assert = function Assert(condition) {
  // Note: A step that begins with “Assert:” asserts an invariant condition of
  // its algorithm. Such assertions are used to make explicit algorithmic
  // invariants that would otherwise be implicit. Such assertions add no
  // additional semantic requirements and hence need not be checked by an
  // implementation. They are used simply to clarify algorithms.
  //
  // In order to ensure correct behavior, Assert is checked by this
  // implementation. No user code should ever be capable of violating an Assert.
  if (!condition) {
    throw new TypeError('Assert violation.');
  }
};

// 6.2.2
global.CompletionRecord = function CompletionRecord(type, value, target) {
  this['[[Type]]'] = type;
  this['[[Value]]'] = value;
  this['[[Target]]'] = target;
};

// Abstract Operations return Completion Records, however for convenience and
// to avoid constantly converting between the ECMAScript runtime environment
// and the abstract operation environment, the operations defined in this file
// simply use "return" and "throw". As the ECMAScript specification explains
// that "return 42" is shorthand for "Return NormalCompletion(42)", here we
// also typically write "return 42". However, if we have an instance of a
// CompletionRecord, `ReturnCompletion` converts back into the "return" or
// "throw" semantics of the ECMAScript environment.
global.Completion = function Completion(completion) {
  Assert(completion instanceof CompletionRecord);
  if (completion['[[Type]]'] === 'throw') {
    throw completion['[[Value]]'];
  }
  return completion['[[Value]]'];
};

// For steps where a CompletionRecord is expected (steps that do not use
// ReturnIfAbrupt) we must convert back from ECMAScript execution environment
// to the Abstract Operation environment.
//
//     let result = Invoke(object, method)
//
//     var result = GetCompletionRecord(() => object.method());
//
global.GetCompletionRecord = function GetCompletionRecord(step) {
  try {
    return NormalCompletion(step());
  } catch (error) {
    return new CompletionRecord('throw', error);
  }
};

// 6.2.2.1
global.NormalCompletion = function NormalCompletion(argument) {
  return new CompletionRecord('normal', argument, undefined);
};

// 7.1.4
global.ToInteger = function ToInteger(argument) {
  // 1. Let number be ? ToNumber(argument).
  var number = Number(argument);
  // 2. If number is NaN, return +0.
  if (number !== number) {
    return 0;
  }
  // 3. If number is +0, -0, +∞, or -∞, return number.
  if (number === 0 || number === -0 || number === Infinity || number === -Infinity) {
    return number;
  }
  // 4. Return the number value that is the same sign as number and whose
  //    magnitude is floor(abs(number)).
  var magnitude = Math.floor(Math.abs(number));
  return number < 0 ? -magnitude : magnitude;
};

// 7.1.15
global.ToLength = function ToLength(argument) {
  // 1. Let len be ? ToInteger(argument).
  var len = ToInteger(argument);
  // 2. If len ≤ +0, return +0.
  if (len <= +0) {
    return +0;
  }
  // 3. If len is +∞, return 2^53-1.
  if (len === Infinity) {
    return 9007199254740991;
  }
  // 4. Return min(len, 2^53-1).
  return len < 9007199254740991 ? len : 9007199254740991;
};

// 7.2.3
global.IsCallable = function IsCallable(argument) {
  // 1. If Type(argument) is not Object, return false.
  // 2. If argument has a [[Call]] internal method, return true.
  // 3. Return false.
  return typeof argument === 'function';
};

// 7.2.7
global.IsPropertyKey = function IsPropertyKey(argument) {
  // 1. If Type(argument) is String, return true.
  if (typeof argument === 'string') {
    return true;
  }
  // 2. If Type(argument) is Symbol, return true.
  if (typeof argument === 'symbol') {
    return true;
  }
  // 3. Return false.
  return false;
};

// 7.2.10
global.SameValueZero = function SameValueZero(x, y) {
  // 1. If Type(x) is different from Type(y), return false.
  // 2. If Type(x) is Number, then
  //   a. If x is NaN and y is NaN, return true.
  //   b. If x is +0 and y is -0, return true.
  //   c. If x is -0 and y is +0, return true.
  //   d. If x is the same Number value as y, return true.
  //   e. Return false.
  // 3. Return SameValueNonNumber(x, y).
  return x === y || (x !== x && y !== y);
};

// 7.3.5
global.CreateMethodProperty = function CreateMethodProperty(O, P, V) {
  // 1. Assert: Type(O) is Object.
  Assert(Object(O) === O);
  // 2. Assert: IsPropertyKey(P) is true.
  Assert(IsPropertyKey(P) === true);
  // 3. Let newDesc be the PropertyDescriptor
  //    {[[Value]]: V, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: true}.
  var newDesc = {
    value: V,
    writable: true,
    enumerable: false,
    configurable: true
  };
  // 4. Return ? O.[[DefineOwnProperty]](P, newDesc).
  return Object.defineProperty(O, P, newDesc);
};

// 7.3.9
global.GetMethod = function GetMethod(V, P) {
  // 1. Assert: IsPropertyKey(P) is true.
  Assert(IsPropertyKey(P) === true);
  // 2. Let func be ? GetV(V, P)
  var func = V[P];
  // 3. If func is either undefined or null, then return undefined.
  if (func === undefined || func === null) {
    return undefined;
  }
  // 4. If IsCallable(func) is false, then throw a TypeError exception.
  if (IsCallable(func) === false) {
    throw new TypeError('Method must be callable.');
  }
  // 5. Return func.
  return func;
};

// 7.4.1
global.GetIterator = function GetIterator(obj, method) {
  // 1. If method was not passed, then
  if (arguments.length < 2) {
    // a. Let method be ? GetMethod(obj, @@iterator).
    method = GetMethod(obj, Symbol.iterator);
  }
  // 2. Let iterator be the ? Call(method, obj).
  var iterator = method.call(obj);
  // 3. If Type(iterator) is not Object, then throw a TypeError exception.
  if (Object(iterator) !== iterator) {
    throw new TypeError('[Symbol.iterator]() must return an Iterator.');
  }
  // 4. Return iterator.
  return iterator;
};

// 7.4.2
global.IteratorNext = function IteratorNext(iterator, value) {
  var result;
  // 1. If value was not passed, then
  if (arguments.length < 2) {
    // a. Let result be ? Invoke(iterator, "next", « »).
    result = iterator.next();
  // 2. Else,
  } else {
    // a. Let result be ? Invoke(iterator, "next", « value »).
    result = iterator.next(value);
  }
  // 3. If Type(result) is not Object, throw a TypeError exception.
  if (Object(result) !== result) {
    throw new TypeError('Iterator must return IteratorResult.');
  }
  // 4. Return result.
  return result;
};

// 7.4.3
global.IteratorComplete = function IteratorComplete(iterResult) {
  // 1. Assert: Type(iterResult) is Object.
  Assert(Object(iterResult) === iterResult);
  // 2. Return ToBoolean(? Get(iterResult, "done")).
  return Boolean(iterResult['done']);
};

// 7.4.4
global.IteratorValue = function IteratorValue(iterResult) {
  // 1. Assert: Type(iterResult) is Object.
  Assert(Object(iterResult) === iterResult);
  // 2. Return ? Get(iterResult, "value").
  return iterResult['value'];
};

// 7.4.5
global.IteratorStep = function IteratorStep(iterator) {
  // 1. Let result be ? IteratorNext(iterator).
  var result = IteratorNext(iterator);
  // 2. Let done be ? IteratorComplete(result).
  var done = IteratorComplete(result);
  // 3. If done is true, return false.
  if (done === true) {
    return false;
  }
  // 4. Return result.
  return result;
};

// 7.4.6
global.IteratorClose = function IteratorClose(iterator, completion) {
  // 1. Assert: Type(iterator) is Object.
  Assert(Object(iterator) === iterator);
  // 2. Assert: completion is a Completion Record.
  Assert(completion instanceof CompletionRecord);
  // 3. Let return be ? GetMethod(iterator, "return").
  var return_ = GetMethod(iterator, 'return');
  // 4. If return is undefined, return Completion(completion).
  if (return_ === undefined) {
    return Completion(completion);
  }
  // 5. Let innerResult be Call(return, iterator, « »).
  var innerResult = GetCompletionRecord(function() { return return_.call(iterator); });
  // 6. If completion.[[Type]] is throw, return Completion(completion).
  if (completion['[[Type]]'] === 'throw') {
    return Completion(completion);
  }
  // 7. If innerResult.[[Type]] is throw, return Completion(innerResult).
  if (innerResult['[[Type]]'] === 'throw') {
    return Completion(innerResult);
  }
  // 8. If Type(innerResult.[[Value]]) is not Object, throw a TypeError exception.
  if (Object(innerResult['[[Value]]']) !== innerResult['[[Value]]']) {
    throw new TypeError('iterator.return() must return IteratorResult.');
  }
  // 9. Return Completion(completion).
  return Completion(completion);
};

// 7.4.7
global.CreateIterResultObject = function CreateIterResultObject(value, done) {
  // 1. Assert: Type(done) is Boolean.
  Assert(Boolean(done) === done);
  // 2. Let obj be ObjectCreate(%ObjectPrototype%).
  // 3. Perform CreateDataProperty(obj, "value", value).
  // 4. Perform CreateDataProperty(obj, "done", done).
  // 5. Return obj.
  return { value: value, done: done };
};

// 9.1.12
global.ObjectCreate = function ObjectCreate(proto, internalSlotsList) {
  // 1. If internalSlotsList was not provided, let internalSlotsList be a new
  //    empty List.
  // 2. Let obj be a newly created object with an internal slot for each name
  //    in internalSlotsList.
  var properties = {};
  if (internalSlotsList) {
    // Note: as there is no API for accessing "internal slots", we're emulating
    // them with standard non-configurable, non-enumerable properties.
    for (var ii = 0; ii < internalSlotsList.length; ii++) {
      var name = internalSlotsList[ii];
      properties[name] = { writable: true, configurable: false, enumerable: false };
    }
  }
  // 3. Set obj's essential internal methods to the default ordinary object
  //    definitions specified in 9.1.
  // 4. Set the [[Prototype]] internal slot of obj to proto.
  // 5. Set the [[Extensible]] internal slot of obj to true.
  // 6. Return obj.
  return Object.create(proto, properties);
};

// Note: not a specified Abstract Operation, but mentioned in prose.
global.HasAllInternalSlots = function HasAllInternalSlots(obj, internalSlotsList) {
  for (var ii = 0; ii < internalSlotsList.length; ii++) {
    var name = internalSlotsList[ii];
    if (!obj.hasOwnProperty(name)) {
      return false;
    }
  }
  return true;
};

// 19.4.1
if (!global.Symbol) {
  // Note: if Symbol is not defined, we use a crude emulation.
  global.Symbol = function Symbol(k) {
    return '@@' + k;
  };
}

// 19.4.2.3
if (!Symbol.isConcatSpreadable) {
  Object.defineProperty(Symbol, 'isConcatSpreadable', {
    value: Symbol('isConcatSpreadable'),
    writable: false,
    enumerable: false,
    configurable: false
  });
}

// 19.4.2.4
if (!Symbol.iterator) {
  Object.defineProperty(Symbol, 'iterator', {
    value: Symbol('iterator'),
    writable: false,
    enumerable: false,
    configurable: false
  });
}

// 22.1.3.1.1
global.IsConcatSpreadable = function IsConcatSpreadable(O) {
  // 1. If Type(O) is not Object, return false.
  if (Object(O) !== O) {
    return false;
  }
  // 2. Let spreadable be ? Get(O, @@isConcatSpreadable).
  var spreadable = O[Symbol.isConcatSpreadable];
  // 3. If spreadable is not undefined, return ToBoolean(spreadable).
  if (spreadable !== undefined) {
    return Boolean(spreadable);
  }
  // 4. Return ? IsArray(O).
  return Array.isArray(O);
};

// 25.1.2
var originalArrayIteratorFn = [][Symbol.iterator];
global.IteratorPrototype = (function () {
  if (originalArrayIteratorFn) {
    var arrayIterator = originalArrayIteratorFn.call([]);
    return Object.getPrototypeOf(Object.getPrototypeOf(arrayIterator));
  }
  return {};
})();

// 25.1.2.1
if (!IteratorPrototype[Symbol.iterator]) {
  CreateMethodProperty(IteratorPrototype, Symbol.iterator, function iterator() {
    return this;
  });
}

// 22.1.3
global.ArrayPrototype = Array.prototype;

var needsArrayIteratorPolyfill =
  !ArrayPrototype.entries ||
  !ArrayPrototype.keys ||
  !ArrayPrototype.values ||
  !ArrayPrototype[Symbol.iterator];

if (needsArrayIteratorPolyfill) {

  // 22.1.3.4
  CreateMethodProperty(ArrayPrototype, 'entries', function entries() {
    // 1. Let O be ? ToObject(this value).
    var O = Object(this);
    // 2. Return CreateArrayIterator(O, "key+value").
    return CreateArrayIterator(O, 'key+value');
  });

  // 22.1.3.14
  CreateMethodProperty(ArrayPrototype, 'keys', function keys() {
    // 1. Let O be ? ToObject(this value).
    var O = Object(this);
    // 3. Return CreateArrayIterator(O, "key").
    return CreateArrayIterator(O, 'key');
  });

  // 22.1.3.30
  CreateMethodProperty(ArrayPrototype, 'values', function values() {
    // 1. Let O be ? ToObject(this value).
    var O = Object(this);
    // 3. Return CreateArrayIterator(O, "value").
    return CreateArrayIterator(O, 'value');
  });

  // 22.1.3.31
  CreateMethodProperty(ArrayPrototype, Symbol.iterator, ArrayPrototype.values);

  // 22.1.5.1
  global.CreateArrayIterator = function CreateArrayIterator(array, kind) {
    // 1. Assert: Type(array) is Object.
    Assert(Object(array) === array);
    // 2. Let iterator be ObjectCreate(%ArrayIteratorPrototype%,
    //    « [[IteratedObject]], [[ArrayIteratorNextIndex]], [[ArrayIterationKind]] »).
    var iterator = ObjectCreate(
      ArrayIteratorPrototype,
      ['[[IteratedObject]]', '[[ArrayIteratorNextIndex]]', '[[ArrayIterationKind]]']
    );
    // 3. Set iterator's [[IteratedObject]] internal slot to array.
    iterator['[[IteratedObject]]'] = array;
    // 4. Set iterator's [[ArrayIteratorNextIndex]] internal slot to 0.
    iterator['[[ArrayIteratorNextIndex]]'] = 0;
    // 5. Set iterator's [[ArrayIterationKind]] internal slot to kind.
    iterator['[[ArrayIterationKind]]'] = kind;
    // 6. Return iterator.
    return iterator;
  };

  // 22.1.5.2
  global.ArrayIteratorPrototype = (function () {
    if (originalArrayIteratorFn) {
      var arrayIterator = originalArrayIteratorFn.call([]);
      return Object.getPrototypeOf(arrayIterator);
    }
    return ObjectCreate(IteratorPrototype);
  })();

  // 22.1.5.2.1
  CreateMethodProperty(ArrayIteratorPrototype, 'next', function() {
    // 1. Let O be the this value.
    var O = this;
    // 2. If Type(O) is not Object, throw a TypeError exception.
    if (Object(O) !== O) {
      throw new TypeError('ArrayIterator.prototype.next called on incompatible receiver.');
    }
    // 3. If O does not have all of the internal slots of an Array Iterator
    //    Instance (22.1.5.3), throw a TypeError exception.
    if (!HasAllInternalSlots(O, ['[[IteratedObject]]', '[[ArrayIteratorNextIndex]]', '[[ArrayIterationKind]]'])) {
      throw new TypeError('ArrayIterator.prototype.next called on incompatible receiver.');
    }
    // 4. Let a be the value of the [[IteratedObject]] internal slot of O.
    var a = O['[[IteratedObject]]'];
    // 5. If a is undefined, return CreateIterResultObject(undefined, true).
    if (a === undefined) {
      return CreateIterResultObject(undefined, true);
    }
    // 6. Let index be the value of the [[ArrayIteratorNextIndex]] internal slot of O.
    var index = O['[[ArrayIteratorNextIndex]]'];
    // 7. Let itemKind be the value of the [[ArrayIterationKind]] internal slot of O.
    var itemKind = O['[[ArrayIterationKind]]'];
    // 8. If a has a [[TypedArrayName]] internal slot, then
    //    a. Let len be the value of a's [[ArrayLength]] internal slot.
    // 9. Else,
    //    b. Let len be ? ToLength(? Get(a, "length")).
    var len = ToLength(a.length);
    // 10. If index ≥ len, then
    if (index >= len) {
      // a. Set the value of the [[IteratedObject]] internal slot of O to undefined.
      O['[[IteratedObject]]'] = undefined;
      // b. Return CreateIterResultObject(undefined, true).
      return CreateIterResultObject(undefined, true);
    }
    // 11. Set the value of the [[ArrayIteratorNextIndex]] internal slot of O to index+1.
    O['[[ArrayIteratorNextIndex]]'] = index + 1;
    // 12. If itemKind is "key", then return CreateIterResultObject(index, false);
    if (itemKind === 'key') {
      return CreateIterResultObject(index, false);
    }
    // 13. Let elementKey be ! ToString(index).
    // 14. Let elementValue be ? Get(a, elementKey).
    var elementValue = a[index];
    // 15. If itemKind is "value", let result be elementValue.
    var result;
    if (itemKind === 'value') {
      result = elementValue;
    // 16. Else,
    } else {
      // a. Assert itemKind is "key+value",.
      Assert(itemKind === 'key+value');
      // b. Let result be CreateArrayFromList(«index, elementValue»).
      result = [index, elementValue];
    }
    // 17. Return CreateIterResultObject(result, false).
    return CreateIterResultObject(result, false);
  });
}
