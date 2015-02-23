"use strict";

// The following is all currently specced behavior in ES2015 (ES6).
// It is all either directly referred to in the proposal, or is contextually
// relevant to the proposal in order to produce meaningful examples.

// 6.2.2.1
global.NormalCompletion = function NormalCompletion(argument) {
  return { type: 'normal', value: argument, target: undefined };
};

// 7.1.2
global.ToBoolean = function ToBoolean(argument) {
  return !!argument;
};

// 7.1.3
global.ToNumber = function ToNumber(argument) {
  return +argument;
};

// 7.1.4
global.ToInteger = function ToInteger(argument) {
  // 1. Let number be ToNumber(argument).
  var number = ToNumber(argument);
  // 2. ReturnIfAbrupt(number).
  // 3. If number is NaN, return +0.
  if (isNaN(number)) {
    return 0;
  }
  // 4. If number is +0, -0, +Infinity, or -Infinity, return number.
  if (number === 0 || number === -0 || number === Infinity || number === -Infinity) {
    return number;
  }
  // 5. Return the number value that is the same sign as number and whose
  //    magnitude is floor(abs(number)).
  var magnitude = Math.floor(Math.abs(number));
  return number < 0 ? -magnitude : magnitude;
};

// 7.4.2 IteratorNext ( iterator, value )
global.IteratorNext = function IteratorNext(iterator, value) {
  var result;
  // 1. If value was not passed, then
  if (arguments.length < 2) {
    // a. Let result be Invoke(iterator, "next", « »).
    result = iterator.next();
  // 2. Else,
  } else {
    // a. Let result be Invoke(iterator, "next", «value»).
    result = iterator.next(value);
  }
  // 3. ReturnIfAbrupt(result).
  // 4. If Type(result) is not Object, throw a TypeError exception.
  if (Object(result) !== result) {
    throw new TypeError();
  }
  // 5. Return result.
  return result;
};

// 7.4.3 IteratorComplete ( iterResult )
global.IteratorComplete = function IteratorComplete(iterResult) {
  // 1. Assert: Type(iterResult) is Object.
  if (Object(iterResult) !== iterResult) {
    throw new TypeError();
  }
  // 2. Return ToBoolean(Get(iterResult, "done")).
  return ToBoolean(iterResult['done']);
};

// 7.4.4 IteratorValue ( iterResult )
global.IteratorValue = function IteratorValue(iterResult) {
  // 1. Assert: Type(iterResult) is Object.
  if (Object(iterResult) !== iterResult) {
    throw new TypeError();
  }
  // 2. Return Get(iterResult, "value").
  return iterResult['value'];
};

// 7.4.6 IteratorClose( iterator, completion )
global.IteratorClose = function IteratorClose(iterator, completion) {
  // 1. Assert: Type(iterator) is Object.
  if (Object(iterator) !== iterator) {
    throw new TypeError();
  }
  // 2. Assert: completion is a Completion Record.
  // 3. Let return be GetMethod(iterator, "return").
  var returnFn = GetMethod(iterator, 'return');
  // 4. ReturnIfAbrupt(return).
  // 5. If return is undefined, return completion.
  if (returnFn === undefined) {
    return completion;
  }
  // 6. Let innerResult be Call(return, iterator, « »).
  if (IsCallable(returnFn) === false) {
    throw new TypeError();
  }
  var innerResult = returnFn.call(iterator);
  // 7. If completion.[[type]] is throw, return completion.
  // 8. If innerResult.[[type]] is throw, return innerResult.
  // 9. If Type(innerResult.[[value]]) is not Object, throw a TypeError exception.
  // 10. Return completion.
};

// 22.1.3.1.1
global.IsConcatSpreadable = function IsConcatSpreadable(O) {
  if (Object(O) !== O) {
    return false;
  }
  var spreadable = O[Symbol.isConcatSpreadable];
  if (spreadable !== undefined) {
    return ToBoolean(spreadable);
  }
  return Array.isArray(O);
};
