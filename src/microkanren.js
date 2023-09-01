const { extendSubstitution, walk } = require("./substitution");
const { isLvar, isLvarEqual, lvar } = require("./variable");

const { car, cdr, isPair } = require("./list");
const { plus, bind } = require("./stream.gen");

class ConstraintStore {
  all = [];
  index = new Map();

  constructor(all, index) {
    this.all = all;
    this.index = index;
  }

  add(constraint, { terms } = {}) {
    const index = new Map(terms.filter(isLvar).map(term => [term, [constraint]]));
    for (const [lvar, constraints] of this.index.entries()) {
      index.set(lvar, [
        ...constraints,
        ...index.get(lvar) || []
      ]);
    }

    return new ConstraintStore(
      [...this.all, constraint],
      index
    );
  }

  check(substitution, { terms } = {}) {
    const relevantConstraints = terms === undefined
      ? this.all
      : terms
        .map(term => this.index.get(term) || [])
        .flat();

    for (const constraint of relevantConstraints) {
      if (constraint.type === 'neq') {
        const u1 = walk(constraint.term1, substitution);
        const v1 = walk(constraint.term2, substitution);
        if (u1 === v1 || isLvarEqual(u1, v1)) return false; // Constraint violated
      }
      // handle other constraint types as needed
    }
    return true; // All constraints satisfied
  }
}

class State {
  constructor(substitution, count, constraintStore) {
    /**
     * @type {Map<Term, Term>}
     * @instance
     */
    this.substitution = substitution;
    /**
     * @type {number}
     */
    this.count = count;
    /**
     * @type {ConstraintStore}
     */
    this.constraints = constraintStore;
  }

  increment(n) {
    return new State(this.substitution, this.count + n, this.constraints);
  }

  updateSubstitution(substitution) {
    return new State(substitution, this.count, this.constraints);
  }

  addConstraint(constraint, { terms } = {}) {
    return new State(this.substitution, this.count, this.constraints.add(constraint, { terms }));
  }

  isConsistent({ terms } = {}) {
    return this.constraints.check(this.substitution, { terms });
  }

  static empty() {
    return new State(new Map(), 0, new ConstraintStore([], new Map()));
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

/**
 * @typedef {undefined | null | boolean | string | number | List | Symbol} Term
 * @typedef {(state: State) => Generator<State>} Goal
 */

/**
 * @param {Term} term1
 * @param {Term} term2
 * @returns {Goal} that succeeds if term1 and term2 unify
 */
const unify = (term1, term2) => function* (state) {
  const substitution = unification(term1, term2, state.substitution);
  if (substitution !== false) {
    const newState = state.updateSubstitution(substitution);
    if (newState.isConsistent({ terms: [term1, term2] })) {
      yield newState;
    }
  }
};

/**
 * @param {Term} term1
 * @param {Term} term2
 * @returns {Goal} that succeeds if term1 and term2 are not equal
 */
const neq = (term1, term2) => function* (state) {
  const newConstraint = {
    type: 'neq',
    term1,
    term2
  };

  const newState = state.addConstraint(newConstraint, { terms: [term1, term2] });
  if (newState.isConsistent({ terms: [term1, term2] })) {
    yield newState;
  }
};

/**
 * @param {Goal} goal1
 * @param {Goal} goal2
 * @returns {Goal} that succeeds if either goal1 or goal2 succeeds
 */
const disj = (goal1, goal2) => function* (state) {
  yield* plus(goal1(state), goal2(state));
};

/**
 * @param {Goal} goal1
 * @param {Goal} goal2
 * @returns {Goal} that succeeds if both goal1 and goal2 succeed
 */
const conj = (goal1, goal2) => function* (state) {
  yield* bind(goal1(state), goal2);
};

/**
 * @param {(lvar: Term) => Goal} f
 * @returns {Goal} that succeeds if f succeeds with a fresh lvar
 */
const callWithFresh = (f) => function* (state) {
  yield* f(lvar(`_${state.count}`))(state.increment(1));
};

/**
 * @param {Goal} goal
 * @returns {Goal} that is delayed after called with a state. When the thunk is called, the goal is executed with the state.
 */
const delay = (goal) => (state) => () => goal()(state);

/**
 * @param {Goal} goal
 * @returns {Generator<State>} that is called with an empty state
 */
const callWithEmptyState = (goal) => goal(State.empty());

module.exports = {
  unify,
  neq,
  disj,
  conj,
  callWithFresh,
  delay,
  callWithEmptyState
};