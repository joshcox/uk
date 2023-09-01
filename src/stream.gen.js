/**
 * @template T
 * @param {Generator<T>} stream1
 * @param {Generator<T>} stream2
 * @returns {Generator<T>} An interleaved generator of the two inputs
 */
function* plus(stream1, stream2) {
  let aDone = false;
  let bDone = false;
  let aNext = stream1.next();
  let bNext = stream2.next();

  while (!aDone || !bDone) {
    if (!aNext.done) {
      yield aNext.value;
      aNext = stream1.next();
    } else {
      aDone = true;
    }

    if (!bNext.done) {
      yield bNext.value;
      bNext = stream2.next();
    } else {
      bDone = true;
    }
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
  const streams = [seedStream];

  while (streams.length > 0) {
    let keep = [];

    for (const stream of streams) {
      const { value, done } = stream.next();

      if (!done) {
        keep.push(stream);
        if (stream === seedStream) {
          // This is our original input stream. Map the value and add it to our active streams.
          keep.push(func(value));
        } else {
          // Yield the value from the current stream.
          yield value;
        }
      }
    }

    streams.length = 0;  // Clear the array
    streams.push(...keep);  // Add the next streams to be processed
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
