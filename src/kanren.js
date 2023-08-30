const { disj, conj, callWithEmptyState, callWithFresh } = require("./microkanren");
const { reify } = require("./reification");
const { take } = require("./stream");

const or = (goal, ...goals) => (state) => goals.reduce(disj, goal)(state);

const and = (goal, ...goals) => (state) => goals.reduce(conj, goal)(state);

const fresh = (f) => (state) => {
    const freshen = (n, variables) => n === 0
        ? f(...variables)
        : callWithFresh((v) => freshen(n - 1, [...variables, v]));
    return freshen(f.length, [])(state);
};

const conde = (...clauses) => or(...clauses.map((goals) => and(...goals)));

const runBase = (numberOfAnswers, f) => take(numberOfAnswers, callWithEmptyState(callWithFresh(f)));

const run = (numberOfAnswers, f) => reify(
    take(numberOfAnswers, callWithEmptyState(callWithFresh(f)))
);

module.exports = {
    or,
    and,
    fresh,
    conde,
    runBase,
    run
};