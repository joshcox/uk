const { strict: assert } = require("node:assert");
const { describe, it } = require('node:test');
const { take } = require("../../src/stream");
const { unify, callWithEmptyState, callWithFresh, run, and, fresh, delay, disjunction } = require("../../src/microkanren");
const { appendo } = require("../utility/listo");
const { list } = require("../../src");


describe('unbounded depth-first search', () => { 
    const fives = (x) => disjunction(unify(x, 5), delay(() => fives(x)));

    it('should be able to find the first five', () => {
        const [state] = take(1, callWithEmptyState(callWithFresh(fives)));
        assert.equal(state.substitution.walk(state.variables.get('_0')), 5);
    });

    it('should be able to find the second five', () => {
        const [_, state] = take(2, callWithEmptyState(callWithFresh(fives)));
        assert.equal(state.substitution.walk(state.variables.get('_0')), 5);
    });

    it('should be able to find the third five', () => {
        const [_, __, state] = take(3, callWithEmptyState(callWithFresh(fives)));
        assert.equal(state.substitution.walk(state.variables.get('_0')), 5);
    });
});

describe('list with prefix', () => {
    const listsWithPrefix = (prefix) => run(10, (solution) =>
        // Create three logic variables for holding the first list, second list, and output list of append function
        fresh((firstList, secondList, outList) => and(
            // Declare that the solution contains each of the three lists/logic variables
            unify(solution, list(
                list('First List', firstList),
                list('Second List', secondList),
                list('Out List', outList)
            )),
            // Create a fresh logic variable for holding the postfix of the output list
            fresh((postfix) => and(
                // prefix appended to post fix unifies w/ the output list
                appendo(prefix, postfix, outList),
                // first list appended to second list unifies w/ the output list
                appendo(firstList, secondList, outList)
            ))
        )));

    it.skip('should work', () => {
        const solutions = listsWithPrefix(list(1, 2, 3, 4, 5));
    });
});