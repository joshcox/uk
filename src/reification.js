const { isPair, cdr, car } = require("./list");
const { Substitution } = require("./data/substitution");
const { LogicVariable } = require("./variable");

/**
 * @typedef {import("./microkanren").Term} Term
 * @typedef {import("./data/state").State} State
 */

/**
 * Reify all the symbols in a term to a string representation
 * @param {Term} term
 * @param {Substitution} substitution
 * @returns {Substitution} 
 */
const reifyS = (term, substitution) => {
    const u = substitution.walk(term);
    if (u instanceof LogicVariable) {
        return substitution.extend(u, u.name);
    } else if (isPair(u)) {
        return reifyS(cdr(u), reifyS(car(u), substitution));
    } else {
        return substitution;
    }
};

/**
 * @param {State} state
 * @returns {Term} 
 */
const reifyStateWithFirstVar = (state) => {
    const term = state.substitution.walkStar(state.variables.get(`_0`));
    return reifyS(term, Substitution.empty()).walkStar(term);
};

/**
 * @param {State[]} states
 * @returns {Term[]} an array of terms with all lvars replaced with unique symbols
 */
const reify = (states) => states.map(reifyStateWithFirstVar);

module.exports = {
    reify,
    reifyStateWithFirstVar
};