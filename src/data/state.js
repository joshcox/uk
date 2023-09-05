const { LogicVariables } = require("../variable");
const { ConstraintStore } = require("./constraint-store");
const { Substitution } = require("./substitution");

class State {
  /**
   * @param {LogicVariables} variables
   * @param {Substitution} substitution
   * @param {ConstraintStore} constraints
   */
  constructor(variables, substitution, constraints) {
    /**
     * @type {Substitution}
     */
    this.substitution = substitution;
    /**
     * @type {LogicVariables}
     */
    this.variables = variables;
    /**
     * @type {ConstraintStore}
     */
    this.constraints = constraints;
  }

  static empty() {
    return new State(
      LogicVariables.empty(),
      Substitution.empty(),
      ConstraintStore.empty()
    );
  }

  /**
   * @param {Partial<State>} param0
   * @returns {State} a new state with the given fields updated
   */
  update({ substitution, variables, constraints }) {
    return new State(
      variables ?? this.variables,
      substitution ?? this.substitution,
      constraints ?? this.constraints
    );
  }

  /**
   * @param {{ terms: import("../microkanren").Term[] }} param0
   * @returns {boolean} true if the state is consistent
   */
  isConsistent({ terms } = {}) {
    return this.constraints.check(this.substitution, { terms });
  }

  get [Symbol.toStringTag]() {
    return 'State';
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return `State { substitution: ${JSON.stringify(this.substitution)}, variables: ${this.variables.size} }`;
  }
}

module.exports = {
  State
};
