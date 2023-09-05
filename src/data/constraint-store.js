const { LogicVariable } = require("../variable");

/**
 * @typedef {import("./substitution").Substitution} Substitution
 */


class ConstraintStore {
  constructor(all, index) {
    this.all = all ?? [];
    this.index = index ?? new Map();
  }

  static empty() {
    return new ConstraintStore();
  }

  add(constraint, { terms } = {}) {
    const index = new Map(
      terms
        .filter((t) => t instanceof LogicVariable)
        .map(term => [term, [constraint]])
    );
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

  /**
   * @param {Substitution} substitution
   */
  check(substitution, { terms } = {}) {
    const relevantConstraints = terms === undefined
      ? this.all
      : terms
        .map(term => this.index.get(term) || [])
        .flat();

    for (const constraint of relevantConstraints) {
      if (constraint.type === 'neq') {
        const u1 = substitution.walk(constraint.term1);
        const v1 = substitution.walk(constraint.term2);
        if (u1 === v1 || (u1 instanceof LogicVariable && u1.equals(v1))) return false; // Constraint violated
      }
      // handle other constraint types as needed
    }
    return true; // All constraints satisfied
  }
}

module.exports = {
  ConstraintStore
};
