const { isPair, cdr, car, map } = require("./list");
const { walk, walkStar } = require("./substitution");
const { isLvar, lvar } = require("./variable");

const reifyName = (n) => `_${n}`;

const reifyS = (term, substitution) => {
    const u = walk(term, substitution);
    if (isLvar(u)) {
        const n = reifyName(substitution.size);
        return new Map(substitution).set(u, n);
    } else if (isPair(u)) {
        return reifyS(cdr(u), reifyS(car(u), substitution));
    } else {
        return substitution;
    }
};

const reifyStateWithFirstVar = (state) => {
    const term = walkStar(lvar(`_0`), state.substitution);
    return walkStar(term, reifyS(term, new Map()));
};

const reify = (states) => map(reifyStateWithFirstVar, states);

module.exports = {
    reify
};