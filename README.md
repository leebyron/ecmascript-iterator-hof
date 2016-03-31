# Higher Order Functions on Iterators.

**Stage:** 0, Strawman

**Author:** Lee Byron

> Note: This proposal is still very much a work in progress and has not yet been
formally proposed.

Providing common higher order function utilities to all Iterators, via the
Adaptor pattern.

This proposes introducing a new global function, `Iterator` which performs the
adaptor pattern.

```js
var myArray = [ 1, 2, 3 ]
var myIter = Iterator(myArray)
myIter instanceof Iterator // true
myIter.next() // { value: 1, done: false }
```

This provides a nicer alternative to `myArray[Symbol.iterator]()` for accessing
the default iterator for any iterable collection (including Map and Set),
provides a clearer way to access *%IteratorPrototype%*, and via the adaptor
pattern ensures the returned result has *%IteratorPrototype%* in its prototype
chain.

And if the returned result is always `Iterator(input) instanceof Iterator`, then
adding higher-order methods to *%IteratorPrototype%* enables familiar collection
methods on all iterators.

This proposal suggests adding the following methods to *%IteratorPrototype%*:

 * **concat**
 * **includes**
 * **every**
 * **filter**
 * **find**
 * **flatMap**
 * **flatten**
 * **forEach**
 * **map**
 * **reduce**
 * **slice**
 * **some**
 * **tee**
 * **zip**

TODO:

 * indexOf?
 * findIndex?
 * splice?
 * join?


These should mostly look familiar, they're almost all borrowed from the ES5
additions to *Array.prototype*, most of which originally proposed in [Array#extras](https://blogs.msdn.microsoft.com/ie/2010/12/13/ecmascript-5-part-2-array-extras/).
There are a few similarities and differences and a couple new methods:


#### callbackFn still take three args.

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

## Methods on Array.prototype not added to Iterator.prototype

Array's mutative methods (push, pop, shift, unshift, sort) do not make sense in
the context of Iterators and are omitted.

Since Iterators can only be iterated in one direction, all methods requiring
a reversed traversal are not included:

 * reduceRight
 * lastIndexOf
 * reverse


## New methods on Iterator.prototype not found on Array.prototype

#### flatMap

This method is very similar to `values().map(mapFn).flatten(1)`, however it
asserts that `mapFn` always returns an *Iterable*, and flattens that returned
value regardless of if it is *ConcatSpreadable*.

#### flatten

This method is similar to concat, however operates on an iterable of iterables
rather expecting each concatenated iterable as an argument.

```js
var deepValues = [ [ 'A' ], [ 'B' ], [ 'C' ] ]
var flat = deepValues.values().flatten() // [ 'A', 'B', 'C' ]
```

Iterator's `.flatten()` optionally accepts `depth` as a positive integer, which
limits how deep flatten will apply. If not provided (or any falsey value is
provided) it defaults to `Infinity`.

```js
var veryDeep = [ [ 'A' ], [ [ 'B' ], [ [ 'C' ], [ [ 'D' ] ] ] ] ]
var flatInf = veryDeep.values().flatten(0) // [ 'A', 'B', 'C', 'D' ]
var flat1 = veryDeep.values().flatten(1) // [ 'A', [ 'B' ], [ [ 'C' ], [ [ 'D' ] ] ] ]
var flat2 = veryDeep.values().flatten(2) // [ 'A', 'B', [ 'C' ], [ [ 'D' ] ] ]
var flat3 = veryDeep.values().flatten(3) // [ 'A', 'B', 'C', [ 'D' ] ]
```

`iterator.flatten()`, like `iterator.concat()`, only expands those values which
are *Spreadable*. This is determined very similarly to [`IsConcatSpreadable`](https://tc39.github.io/ecma262/#sec-isconcatspreadable), however the last step determines if the value is *Iterable*
rather than *Array*.

#### tee

This method returns `n` independent iterators from this iterator by buffering
the original iterator.

This same method can be found in Python's [itertools](https://docs.python.org/2/library/itertools.html#itertools.tee).

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
 * Prototypes vs method assignments
 * Test and double check all return/throw methods for appropriate behavior
