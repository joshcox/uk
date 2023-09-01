const { disj, conj, callWithEmptyState, callWithFresh, neq } = require("./microkanren");
const { reify } = require("./reification");
const { take } = require("./stream.gen");
const { lvar } = require("./variable");

const success = function* (state) {
    yield state;
};

const fail = function* () {
    return;
};

const or = (...goals) => function* (state) {
    yield* goals.reduceRight((acc, goal) => disj(goal, acc), fail)(state);
};

const and = (...goals) => function* (state) {
    yield* goals.reduceRight((acc, goal) => conj(goal, acc), success)(state);
};

const fresh = (f) => function* (state) {
    const lvars = Array.from({ length: f.length }, (_, i) => lvar(`_${state.count + i}`));
    const newState = state.increment(f.length);
    yield* f(...lvars)(newState);
};

const conde = function* (...clauses) {
    yield* or(...clauses.map((goals) => and(...goals)));
};

const unequal = (...terms) => function* (state) {
    const constraints = [];
    for (let i = 0; i < terms.length; i++) {
        for (let j = i + 1; j < terms.length; j++) {
            constraints.push(neq(terms[i], terms[j]))
        }
    }
    yield* and(...constraints)(state);
};

const runBase = (numberOfAnswers, f) => take(numberOfAnswers, callWithEmptyState(callWithFresh(f)));

const run = (numberOfAnswers, f) => reify(
    take(numberOfAnswers, callWithEmptyState(callWithFresh(f)))
);

module.exports = {
    or,
    and,
    unequal,
    fresh,
    conde,
    runBase,
    run
};