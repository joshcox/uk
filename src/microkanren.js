const { LogicVariable } = require("./variable");
const { plus, bind, take } = require("./stream");
const { State } = require("./data/state");
const { reify } = require("./reification");

/**
 * @typedef {import("./data/substitution").Substitution} Substitution
 * @typedef {undefined | null | boolean | string | number | List | Symbol} Term
 *
 */

/**
 * A goal is a function that, given a state, returns a `Generator<State>`.
 * A function that returns a goal is denoted as a "Goal Constructor".
 * @typedef {(state: State) => Generator<State>} Goal
 */

/**
 * @param {Term} term1
 * @param {Term} term2
 * @returns {Goal} that succeeds if term1 and term2 unify
 */
const unify = (term1, term2) => function* (state) {
  const substitution = state.substitution.unify(term1, term2);
  if (substitution !== false) {
    const newState = state.update({ substitution });
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
const notEqual = (term1, term2) => function* (state) {
  const newState = state.update({
    constraints: state.constraints.add({
      type: 'neq',
      term1,
      term2
    }, { terms: [term1, term2] })
  });

  if (newState.isConsistent({ terms: [term1, term2] })) {
    yield newState;
  }
};

/**
 * @param {...Term} terms
 * @returns {Goal} that succeeds if all terms are not equal
 */
const noneEqual = (...terms) => function* (state) {
  const constraints = [];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      constraints.push(notEqual(terms[i], terms[j]));
    }
  }
  yield* and(...constraints)(state);
};

/**
 * @param {Goal} goal1
 * @param {Goal} goal2
 * @returns {Goal} that succeeds if either goal1 or goal2 succeeds
 */
const disjunction = (goal1, goal2) => function* (state) {
  yield* plus(goal1(state), goal2(state));
};

/**
 * @param {...Goal} goals
 * @returns {Goal} that succeeds if any goal succeeds
 */
const disjunctionAll = (...goals) => function* (state) {
  yield* goals.reduceRight((acc, goal) => disjunction(goal, acc), fail)(state);
};

/**
 * @alias disjunctionAll
 */
const or = disjunctionAll;

/**
 * @param {Goal} goal1
 * @param {Goal} goal2
 * @returns {Goal} that succeeds if both goal1 and goal2 succeed
 */
const conjunction = (goal1, goal2) => function* (state) {
  yield* bind(goal1(state), goal2);
};

/**
 * @param {...Goal} goals
 * @returns {Goal} that succeeds if all goals succeed
 */
const conjunctionAll = (...goals) => function* (state) {
  yield* goals.reduceRight((acc, goal) => conjunction(goal, acc), success)(state);
};

/**
 * @alias conjunctionAll
 */
const and = conjunctionAll;

/**
 * Each array of goals is a "clause". The conde goal is a disjunction of conjunctions.
 * That is it to say, if any clause succeeds where each clause is a conjunction of goals, 
 * then the conde goal succeeds.
 * @param {...Goal[]} clauses
 * @returns {Goal} that succeeds if any clause succeeds
 */
const conde = function* (...clauses) {
  yield* or(...clauses.map((goals) => and(...goals)));
};

/**
 * @param {(lvar: LogicVariable) => Goal} freshGoalConstructor
 * @returns {Goal} that succeeds if f succeeds with a fresh lvar
 */
const callWithFresh = (freshGoalConstructor) => function* (state) {
  const { variable, variables } = state.variables.fresh();
  yield* freshGoalConstructor(variable)(state.update({ variables }));
};

/**
 * @param {(...lvars: LogicVariable[]) => Goal} freshGoalConstructor
 * @returns {Goal} that succeeds if f succeeds with fresh lvars
 */
const fresh = (freshGoalConstructor) => function* (state) {
  let variables = state.variables;
  let lvars = [];
  for (let i = 0; i < freshGoalConstructor.length; i++) {
    const fresh = variables.fresh();
    lvars.push(fresh.variable);
    variables = fresh.variables;
  }

  // call the fresh goal constructor with the lvars and the new state
  yield* freshGoalConstructor(...lvars)(state.update({ variables }));
};

const withLogicVariables = fresh;

/**
 * @type {Goal} that always succeeds
 */
const success = function* (state) {
  yield state;
};

/**
 * @type {Goal} that always fails
 */
const fail = function* (_state) {
  return;
};

/**
 * @param {Goal} goal
 * @returns {Goal} that is delayed after called with a state. When the thunk is called, the goal is executed with the state.
 */
const delay = (goal) => (state) => () => goal()(state);

/**
 * @param {Goal} goal
 * @param {State} state
 * @returns {Generator<State>} that is called with a state
 */
const callWithState = (goal, state) => goal(state);

/**
 * @param {Goal} goal
 * @returns {Generator<State>} that is called with an empty state
 */
const callWithEmptyState = (goal) => goal(State.empty());

/**
 * @param {number} numberOfAnswers
 * @param {(lvar: Term) => Goal} freshGoalConstructor
 */
const run = (numberOfAnswers, freshGoalConstructor) => reify(
  take(numberOfAnswers, callWithEmptyState(fresh(freshGoalConstructor)))
);

module.exports = {
  success,
  fail,
  unify,
  notEqual,
  noneEqual,
  disjunction,
  disjunctionAll,
  or,
  conjunction,
  conjunctionAll,
  and,
  conde,
  callWithFresh,
  fresh,
  withLogicVariables,
  delay,
  callWithEmptyState,
  run
};