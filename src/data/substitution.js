const { isPair, car, cdr, cons } = require("../list");
const { LogicVariable } = require("../variable");

/**
 * @typedef {import("../microkanren").Term} Term
 */

class Substitution {
    constructor(seed) {
        /**
         * @type {Map<Term, Term>}
         */
        this.map = seed ?? new Map();
    }

    /**
     * @returns {Substitution} an empty substitution
     */
    static empty() {
        return new Substitution();
    }

    get size() {
        return this.map.size;
    }

    /**
     * @param {Term} term1
     * @param {Term} term2
     * @returns {Substitution | false} an extended substitution, or false if term1 occurs in term2
     */
    extend(term1, term2) {
        return this.occurs(term1, term2)
            ? false
            : new Substitution(new Map(this.map).set(term1, term2));
    }

    /**
     * @param {Term} term
     * @returns {Term} the term that term maps to, or term if term is not in the substitution
     */
    walk(term) {
        if (term instanceof LogicVariable) {
            const v = this.map.get(term);
            return v === undefined ? term : this.walk(v);
        } else {
            return term;
        }
    }

    /**
     * @param {Term} term
     * @returns {Term} the term that term maps to (recursively), or term if term is not in the substitution
     */
    walkStar(term) {
        const u1 = this.walk(term);
        if (u1 instanceof LogicVariable) {
            return u1;
        } else if (isPair(u1)) {
            return cons(this.walkStar(car(u1)), this.walkStar(cdr(u1)));
        } else {
            return u1;
        }
    }

    /**
     * @param {Term} term1
     * @param {Term} term2
     * @returns {boolean} true if term1 occurs in term2
     */
    occurs(term1, term2) {
        const u = this.walk(term2);
        if (u instanceof LogicVariable) {
            return u.equals(term1)
        } else if (isPair(u)) {
            return this.occurs(term1, car(u)) || this.occurs(term1, cdr(u));
        } else {
            return false;
        }
    }

    /**
     * @param {Term} term1
     * @param {Term} term2
     * @returns {Substitution | false} the most general unifier of term1 and term2, or false if no unifier exists
     */
    unify(term1, term2) {
        const u1 = this.walk(term1);
        const v1 = this.walk(term2);
        if (u1 instanceof LogicVariable && u1.equals(v1)) {
            return this;
        } else if (u1 instanceof LogicVariable) {
            return this.extend(u1, v1);
        } else if (v1 instanceof LogicVariable) {
            return this.extend(v1, u1);
        } else if (isPair(u1) && isPair(v1)) {
            const s = this.unify(car(u1), car(v1));
            return s && s.unify(cdr(u1), cdr(v1));
        } else {
            return u1 === v1 ? this : false;
        }
    }
}

module.exports = {
    Substitution
};