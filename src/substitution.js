const { isPair, car, cdr, cons } = require("./list");
const { isLvar, isLvarEqual } = require("./variable");

const empySubstitution = () => new Map();

// walk term in substitution
const walk = (term, substitution) => {
    if (isLvar(term)) {
        const v = substitution.get(term);
        if (v === undefined) {
            return term;
        } else {
            return walk(v, substitution);
        }
    } else {
        return term;
    }
};

// walk every term in substitution
const walkStar = (term, substitution) => {
    const u1 = walk(term, substitution);
    if (isLvar(u1)) {
        return u1;
    } else if (isPair(u1)) {
        return cons(walkStar(car(u1), substitution), walkStar(cdr(u1), substitution));
    } else {
        return u1;
    }
};

const occursCheck = (term1, term2, substitution) => {
    const u = walk(term2, substitution);
    if (isLvar(u)) {
        return isLvarEqual(term1, u);
    } else if (isPair(u)) {
        return occursCheck(term1, car(u), substitution) || occursCheck(term1, cdr(u), substitution);
    } else {
        return false;
    }
};

// const extS = (term1, term2, substitution) => new Map(substitution).set(term1, term2);
const extendSubstitution = (term1, term2, substitution) => occursCheck(term1, term2, substitution)
    ? false
    : new Map(substitution).set(term1, term2);

module.exports = {
    empySubstitution,
    walk,
    walkStar,
    extendSubstitution
};