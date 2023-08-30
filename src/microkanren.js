const { extendSubstitution, walk } = require("./substitution");
const { isLvar, isLvarEqual, lvar } = require("./variable");

const { empty, cons, car, cdr, isPair, isEmpty } = require("./list");
const { appendMap, append } = require("./stream");

class State {
    constructor(substitution, count) {
        this.substitution = substitution;
        this.count = count;
    }

    increment(n) {
        return new State(this.substitution, this.count + n);
    }

    static empty() {
        return new State(new Map(), 0);
    }

    get [Symbol.toStringTag]() {
        return 'State';
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `State { substitution: ${JSON.stringify(this.substitution)}, count: ${this.count} }`;
    }
}

// unification algorithm
const unification = (term1, term2, substitution) => {
    const u1 = walk(term1, substitution);
    const v1 = walk(term2, substitution);
    if (isLvarEqual(u1, v1)) {
        return substitution;
    } else if (isLvar(u1)) {
        return extendSubstitution(u1, v1, substitution);
    } else if (isLvar(v1)) {
        return extendSubstitution(v1, u1, substitution);
    } else if (isPair(u1) && isPair(v1)) {
        const s = unification(car(u1), car(v1), substitution);
        return s && unification(cdr(u1), cdr(v1), s);
    } else {
        return u1 === v1 ? substitution : false;
    }
};

// microkanren
const mzero = empty;
const unit = (state) => cons(state, mzero);
const mplus = append;
const bind = appendMap;

// operators
const unify = (term1, term2) => (state) => {
    const substitution = unification(term1, term2, state.substitution);
    return substitution === false ? mzero : unit(new State(substitution, state.count));
};

const disj = (goal1, goal2) => (state) => mplus(goal1(state), goal2(state));

const conj = (goal1, goal2) => (state) => bind(goal1(state), goal2);

const callWithFresh = (f) => (state) => f(lvar(`_${state.count}`))(state.increment(1));

const delay = (goal) => (state) => () => goal()(state);

const callWithEmptyState = (goal) => goal(State.empty());

const neq = (u, v) => (state) => isEmpty(unify(u, v)(state)) ? unit(state) : mzero;

module.exports = {
    unify,
    neq,
    disj,
    conj,
    callWithFresh,
    delay,
    callWithEmptyState
};





