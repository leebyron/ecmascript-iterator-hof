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


#### callbackFn take three args.

Most higher order methods on *Array.prototype* accept *callbackFn* of the arity:

```js
function (value, index, collection) {...}
```

Iterator higher order methods accept the same function signature:

```js
function (value, index, iterator) {...}
```

Where `value` is (usually) the `value` key of the iterator's next result object,
`index` is an index starting at 0 which indicates how many times `next` has been
called on the iterator, and `iterator` is the iterator being operated over (and
not the collection from which it was created).


#### No <del>reduceRight</del>

While Array.prototype contains this method, it requires iterating from the
right, which is not something Iterators can do, so it is omitted.


## Methods not found on Array.prototype

#### tee

This method returns `n` independent iterators from this iterator by buffering
the original iterator.

This same method can be found in Python's [itertools](https://docs.python.org/2/library/itertools.html#itertools.tee).


#### transform

This method is the common basis for operations which return a new iterator.
*map*, *filter*, and *zip* are defined in terms of it. It allows for
simultaneous mapping and filtering as well as ending iteration early.

The iterators it returns allow for chaining of the **return**, and
**throw** methods.

```js
var myArray = [ 'A', 'B', 'C', 'D', 'E' ];
var transformed = myArray.values().transform(function (result, index) {
  // result is an IteratorResult `{ value, done }`

  // Many operations can be done:
  switch (index) {

  // Pass the result through:
  case 0:
    return result;

  // Skip a result (filter):
  case 1:
    return null;

  // Pass a different result (map):
  case 2:
    return { value: result.value + result.value, done: false };

  // End iteration early:
  case 3:
    return { value: undefined, done: true };

  }
});

// 'A'
// 'CC'
```


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


## Open Questions

 * What sort of cleanup is necessary if a HOF throws?
 * Should transforms operate on "completion value"?
