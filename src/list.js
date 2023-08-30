const util = require('util');


class Empty {
    isList = true;
    size = 0;

    toString() {
        return util.inspect(this);
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return '()';
    }

    get [Symbol.toStringTag]() {
        return 'EmptyList';
    }
}

const empty = new Empty();

class ConsCell {
    constructor(a, d) {
        this.car = a;
        this.cdr = d;
        this.isList = this.cdr === empty || isList(this.cdr);
        this.size = isPair(this.cdr) || isList(this.cdr) ? this.cdr.size + 1 : 2;
    }

    toString() {
        return util.inspect(this, { depth: 1 });
    }

    [Symbol.for('nodejs.util.inspect.custom')](depth, options) {
        if (depth < 0) {
            return this.isList ? '[List]' : '[Pair]';
        }

        const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1 };

        if (this.isList && this.size < (options.breakLength ?? 20)) {
            return `(${join(' ', map((item) => util.inspect(item, newOptions), this))})`;
        } else if (this.isList) {
            return `
(\n\t${join('\n\t', map((item) => util.inspect(item, newOptions), this))}
)`;

        } else {
            return `(${printPair(this, newOptions)})`;
        }
    }

    get [Symbol.toStringTag]() {
        return this.isList ? 'List' : 'Pair';
    }
}

const printPair = (pair, options) => {
    if (!isPair(pair.cdr)) {
        return `${util.inspect(pair.car, options)} . ${util.inspect(pair.cdr, options)}`;
    } else {
        return `${util.inspect(pair.car, options)} ${printPair(pair.cdr, options)}`;
    }
};

// predicates
const isEmpty = (p) => p === empty;
const isPair = (p) => p instanceof ConsCell;
const isList = (p) => isEmpty(p) || (isPair(p) && p.isList);

// constructors
const cons = (a, d) => new ConsCell(a, d);
const list = (...args) => args.reduceRight((acc, arg) => cons(arg, acc), empty);

// accessors
const car = (p) => p.car;
const cdr = (p) => p.cdr;

// mapping, reducing, iteration
const reduce = (fn, seed, list) => isEmpty(list)
    ? seed
    : reduce(fn, fn(seed, car(list)), cdr(list));

const map = (fn, list) => isEmpty(list)
    ? empty
    : cons(fn(car(list)), map(fn, cdr(list)));

const join = (separator = ' ', list) => reduce(
    (acc, item) => `${acc}${acc === '' ? '' : separator}${item}`,
    '',
    list
);

// data mappers
const toArray = (list) => reduce((acc, item) => [...acc, item], [], list);

module.exports = {
    empty,
    isEmpty,
    isPair,
    isList,
    cons,
    list,
    car,
    cdr,
    reduce,
    map,
    join,
    toArray
};