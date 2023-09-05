/**
 * @template T
 * @typedef {() => Generator<T>} ImmatureStream
 * @typedef {Generator<T>} MatureStream
 * @typedef {MatureStream<T> | ImmatureStream<T>} Stream
 */


/**
 * @template T
 * @param {Stream<T>} stream1
 * @param {Stream<T>} stream2
 * @returns {Stream<T>} An interleaved generator of the two inputs
 */
function* plus(stream1, stream2) {
  if (typeof stream1 === 'function') {
    yield* stream2;
    yield* stream1();
  } else if (typeof stream2 === 'function') {
    yield* stream1;
    yield* stream2();
  } else {
    yield* stream1;
    yield* stream2;
  }
}

/**
 * @template T
 * @template U
 * @param {Generator<T>} seedStream
 * @param {(item: T) => Generator<U>} func
 * @returns {Generator<U>} that maps a generator of type T to a generator of type U and interleaves the results in place
 */
function* bind(seedStream, func) {
  if (typeof seedStream === 'function') {
    yield* bind(seedStream(), func);
  }

  const { value, done } = seedStream.next();
  if (done === true) {
    return;
  } else {
    const gen = func(value);
    if (typeof gen === 'function') {
      yield* bind(seedStream, func);
      yield* gen();
    } else {
      yield* gen;
      yield* bind(seedStream, func);
    }
  }
}

/**
 * @template T
 * @template U
 * @param {Generator<T>} stream
 * @param {(item: T) => U} func
 * @returns {Generator<U>} that maps a generator of type T to a generator of type U
 */
function* map(stream, func) {
  for (const item of stream) {
    yield func(item);
  }
}

/**
 * @template T
 * @param {T} item
 * @returns {Generator<T>} A generator that yields a single value
 */
function* unit(item) {
  yield item;
}

/**
 * @template T
 * @returns {Generator<T>} An empty generator
 */
function* empty() {
  return;
}


// const pull = (stream) => isIterable(stream) ? pull(stream.next().value) : stream;

/**
 * @template T
 * @param {number} numberOfAnswers
 * @param {Generator<T>} stream
 * @returns {T[]} An array of the first numberOfAnswers values from the stream
 */
const take = (numberOfAnswers, stream) => {
  let count = 0;
  let acc = [];
  for (const item of stream) {
    count++;
    acc.push(item);
    if (count >= numberOfAnswers) {
      break;
    }
  }
  return acc;
};

module.exports = {
  plus,
  bind,
  map,
  unit,
  take,
  empty
};
