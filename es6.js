"use strict";

// The following is all currently specced behavior in ES2015 (ES6).
// It is all either directly referred to in the proposal, or is contextually
// relevant to the proposal in order to produce meaningful examples.

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
