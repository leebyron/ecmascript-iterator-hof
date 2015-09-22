# Higher Order Functions on Iterators.

**Stage:** 0, Strawman

**Author:** Lee Byron

Providing common higher order function utilities to all Iterators.

This proposal is still very much a work in progress and has not yet been
formally proposed.

This proposal suggests adding the following methods to *%IteratorPrototype%*:

 * **concat**
 * **every**
 * **filter**
 * **flatten**
 * **map**
 * **reduce**
 * **slice**
 * **some**
 * **tee**
 * **transform**
 * **zip**

These should mostly look familiar, they're almost all borrowed from the ES5
additions to *Array.prototype*. There are a few differences and some new methods:


#### callbackFn take one arg, not three args.

Most higher order ops on *Array.prototype* accept *callbackFn* of the arity:

```js
function (value, index, collection) {...}
```

Iterators do not have a concept of index. It is also not helpful to provide the
iterator itself as an argument since that arg is there to faciliate mutation and
iterators do not have mutative methods.

The higher order ops on *%IteratorPrototype%* accept *callbackFn* of the arity:

```js
function (value) {...}
```

Where *value* is usually the *value* property of an *IteratorResult*.


#### No <del>reduceRight</del>

While Array.prototype contains this method, it requires iterating from the
right, which is not something Iterators can do, so it is omitted.


#### tee

This method returns `n` independent iterators from this iterator by buffering
the original iterator.

Borrowed from Python's itertools.


#### transform

This method is the common basis for operations which return a new iterator.
*map*, *filter*, and *zip* are defined in terms of it. It allows for
simultaneous mapping and filtering as well as ending iteration early.

The iterators it returns allow for chaining of the **return**, and
**throw** methods.


#### zip

This method allows for multiple iterables to be "zipped" together into an
iterable of Array objects. This is a fairly common higher order operation in
functional languages, but is especially useful in tandem with the *Map*
constructor which expects an iterable of [K, V] arrays.

```js
var keys = ['A', 'B', 'C'];
var vals = ['X', 'Y', 'Z'];
var map = new Map(keys.values().zip(vals));
```


## Testing:

```
node examples.js
```

