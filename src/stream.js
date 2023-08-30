const { isEmpty, car, cdr, cons, empty } = require("./list");

// streams
const isImmatureStream = (stream) => typeof stream === 'function';
const isMatureStream = (stream) => !isImmatureStream(stream);
const pull = (stream) => isImmatureStream(stream) ? pull(stream()) : stream;
const takeAll = (stream) => {
    const result = [];
    stream = pull(stream);
    while (!isEmpty(stream)) {
        result.push(car(stream));
        stream = pull(cdr(stream));
    }
    return result;
};

const take = (number, stream) => {
    if (number === 0) {
        return empty;
    }
    const pulledStream = pull(stream);
    if (isEmpty(pulledStream)) {
        return empty;
    } else {
        return cons(car(pulledStream), take(number - 1, cdr(pulledStream)));
    }
};

const append = (s1, s2) => {
    if (isEmpty(s1)) {
        return s2;
    } else if (isImmatureStream(s1)) {
        return () => append(s2, s1());
    } else {
        // return cons(car(s1), append(cdr(s1), s2));
        return cons(car(s1), append(s2, cdr(s1)));
    }
};

const appendMap = (s, f) => {
    if (isEmpty(s)) {
        return s;
    } else if (isImmatureStream(s)) {
        return () => appendMap(s(), f);
    } else {
        return append(f(car(s)), appendMap(cdr(s), f));
    }
};

module.exports = {
    isImmatureStream,
    isMatureStream,
    pull,
    takeAll,
    take,
    append,
    appendMap
};