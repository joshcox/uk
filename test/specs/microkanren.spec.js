const { strict: assert } = require("node:assert");
const { describe, it } = require('node:test');
const { and, fresh, run } = require("../../src/kanren");
const { list } = require("../../src/list");
const { unify, callWithEmptyState, callWithFresh, disj, conj } = require("../../src/microkanren");
const { appendo } = require("../utility/listo");

describe('unify', () => {
    it('yields the state in which the two values are unified', () => {
        const states = callWithEmptyState(unify(true, true));
        const { value, done } = states.next();
        assert.notEqual(value, undefined);
        assert.equal(done, false);
        assert.equal(states.next().done, true);
    });

    it('yields no states when two values do not unify', () => {
        const states = callWithEmptyState(unify(true, false));
        assert.equal(states.next().done, true);
    });
});

describe('disj', () => {
    describe('when the child goals yield 0 or 1 states', () => {
        it('yields the states of the first goal when only first goal succeeds', () => {
            const states = callWithEmptyState(disj(unify(true, true), unify(true, false)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });

        it('yields the states of the second goal when only second goal succeeds', () => {
            const states = callWithEmptyState(disj(unify(true, false), unify(true, true)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });

        it('yields no states when neither goal succeeds', () => {
            const states = callWithEmptyState(disj(unify(true, false), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields states from both goals when both goals succeed', () => {
            const states = callWithEmptyState(disj(unify(true, true), unify(true, true)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            const { value: value2, done: done2 } = states.next();
            assert.notEqual(value2, undefined);
            assert.equal(done2, false);
            assert.equal(states.next().done, true);
        });
    });
});

describe('conj', () => {
    describe('when the child goals yield 0 or 1 states', () => {
        it('yields no states when only first goal succeeds', () => {
            const states = callWithEmptyState(conj(unify(true, true), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields no states when only second goal succeeds', () => {
            const states = callWithEmptyState(conj(unify(true, false), unify(true, true)));
            assert.equal(states.next().done, true);
        });

        it('yields no states when neither goal succeeds', () => {
            const states = callWithEmptyState(conj(unify(true, false), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields states that are successful under both goals', () => {
            const states = callWithEmptyState(conj(unify(true, true), unify(true, true)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });
    });
});

describe('selection logic', () => {
    const parentOfGrandparent = (parent, grandparent) => disj(
        conj(unify(parent, 'Judy'), unify(grandparent, 'Eva')),
        conj(unify(parent, 'Wanita'), unify(grandparent, 'Hans')),
    );

    const childOfParent = (child, parent) => disj(
        disj(
            conj(unify(child, 'Patti'), unify(parent, 'Judy')),
            conj(unify(child, 'Becky'), unify(parent, 'Judy')),
        ),
        disj(
            conj(unify(child, 'Tom'), unify(parent, 'Wanita')),
            conj(unify(child, 'Greg'), unify(parent, 'Wanita')),
        )
    );

    const selectOneChild = (child, parent, grandparent) => conj(
        childOfParent(child, parent),
        parentOfGrandparent(parent, grandparent)
    );

    it('should select one child', () => {
        const states = callWithEmptyState(
            callWithFresh((child) =>
                callWithFresh(parent =>
                    callWithFresh(grandparent =>
                        selectOneChild(child, parent, grandparent)))));
        const state = states.next();
        assert.equal(state.done, false);
    });
});

describe('general', () => {
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
        const solutionsInArrays = toArray(map(toArray, solutions));
        assert.equal(solutionsInArrays.length, 10);
    });
});