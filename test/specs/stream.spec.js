const { strict: assert } = require("node:assert");
const { describe, it } = require('node:test');
const { empty, plus, map, unit, take, bind } = require("../../src/stream.gen");

describe('empty', () => {
  it('should yield a stream with no items', () => {
    const { done } = empty().next();
    assert.equal(done, true);
  });
});

describe('unit', () => {
  it('should yield a stream with one item', () => {
    const stream = unit(1);
    assert.equal(stream.next().value, 1);
    assert.equal(stream.next().done, true);
  });
});

describe('plus', () => {
  it('should yield an empty stream when two empty streams are added', () => {
    const newEmptyStream = plus(empty(), empty());
    const { done } = newEmptyStream.next();
    assert.equal(done, true);
  });

  it('yields the second stream when the first stream is empty', () => {
    const secondStream = plus(empty(), [1, 2, 3][Symbol.iterator]());
    assert.equal(secondStream.next().value, 1);
    assert.equal(secondStream.next().value, 2);
    assert.equal(secondStream.next().value, 3);
    assert.equal(secondStream.next().done, true);
  });

  it('yields the first stream when the second stream is empty', () => {
    const firstStream = plus([1, 2, 3][Symbol.iterator](), empty());
    assert.equal(firstStream.next().value, 1);
    assert.equal(firstStream.next().value, 2);
    assert.equal(firstStream.next().value, 3);
    assert.equal(firstStream.next().done, true);
  });

  it('interleaves two non-empty streams', () => {
    const first = [1, 3, 5][Symbol.iterator]();
    const second = [2, 4, 6][Symbol.iterator]();
    const interleaved = plus(first, second);
    assert.equal(interleaved.next().value, 1);
    assert.equal(interleaved.next().value, 2);
    assert.equal(interleaved.next().value, 3);
    assert.equal(interleaved.next().value, 4);
    assert.equal(interleaved.next().value, 5);
    assert.equal(interleaved.next().value, 6);
    assert.equal(interleaved.next().done, true);
  });
});

describe('bind', () => {
  it('yields an empty stream when an empty stream is passed', () => {
    const newEmptyStream = bind(empty(), () => [1][Symbol.iterator]());
    const { done } = newEmptyStream.next();
    assert.equal(done, true);
  });

  it('yields an empty stream when the mapper function returns empty streams', () => {
    const stream = bind([1, 2, 3][Symbol.iterator](), () => empty());
    assert.equal(stream.next().done, true);
  });

  it('interleaves the values of all streams created by the mapper function', () => {
    const stream = bind([1, 2, 3][Symbol.iterator](), (num) => [num, num][Symbol.iterator]());
    assert.equal(stream.next().value, 1);
    assert.equal(stream.next().value, 2);
    assert.equal(stream.next().value, 1);
    assert.equal(stream.next().value, 3);
    assert.equal(stream.next().value, 2);
    assert.equal(stream.next().value, 3);
    assert.equal(stream.next().done, true);
  });
});

describe('map', () => {
  it('yields an empty stream when an empty stream is mapped', () => {
    const newEmptyStream = map(empty(), (x) => [][Symbol.iterator]());
    const { done } = newEmptyStream.next();
    assert.equal(done, true);
  });

  it('yields a stream where all elements from the input stream are mapped via the mapper function', () => {
    const mappedStream = map([1, 2, 3][Symbol.iterator](), (x) => x * 2);
    assert.equal(mappedStream.next().value, 2);
    assert.equal(mappedStream.next().value, 4);
    assert.equal(mappedStream.next().value, 6);
    assert.equal(mappedStream.next().done, true);
  });
});

describe('take', () => {
  it('yields an empty stream when an empty stream is taken', () => {
    const array = take(0, empty());
    assert.deepEqual(array, []);
  });

  it('yields the first n elements of a stream', () => {
    const array = take(2, [1, 2, 3][Symbol.iterator]());
    assert.deepEqual(array, [1, 2]);
  });

  it('yields all elements of a stream when n is greater than the length of the stream', () => {
    const array = take(4, [1, 2, 3][Symbol.iterator]());
    assert.deepEqual(array, [1, 2, 3]);
  });
});
