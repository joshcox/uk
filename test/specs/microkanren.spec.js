const { strict: assert } = require("node:assert");
const { describe, it } = require('node:test');
const { unify, callWithEmptyState, callWithFresh, disjunction, conjunction } = require("../../src/microkanren");

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
            const states = callWithEmptyState(disjunction(unify(true, true), unify(true, false)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });

        it('yields the states of the second goal when only second goal succeeds', () => {
            const states = callWithEmptyState(disjunction(unify(true, false), unify(true, true)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });

        it('yields no states when neither goal succeeds', () => {
            const states = callWithEmptyState(disjunction(unify(true, false), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields states from both goals when both goals succeed', () => {
            const states = callWithEmptyState(disjunction(unify(true, true), unify(true, true)));
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
            const states = callWithEmptyState(conjunction(unify(true, true), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields no states when only second goal succeeds', () => {
            const states = callWithEmptyState(conjunction(unify(true, false), unify(true, true)));
            assert.equal(states.next().done, true);
        });

        it('yields no states when neither goal succeeds', () => {
            const states = callWithEmptyState(conjunction(unify(true, false), unify(true, false)));
            assert.equal(states.next().done, true);
        });

        it('yields states that are successful under both goals', () => {
            const states = callWithEmptyState(conjunction(unify(true, true), unify(true, true)));
            const { value, done } = states.next();
            assert.notEqual(value, undefined);
            assert.equal(done, false);
            assert.equal(states.next().done, true);
        });
    });
});

describe('selection logic', () => {
    const parentOfGrandparent = (parent, grandparent) => disjunction(
        conjunction(unify(parent, 'Judy'), unify(grandparent, 'Eva')),
        conjunction(unify(parent, 'Wanita'), unify(grandparent, 'Hans')),
    );

    const childOfParent = (child, parent) => disjunction(
        disjunction(
            conjunction(unify(child, 'Patti'), unify(parent, 'Judy')),
            conjunction(unify(child, 'Becky'), unify(parent, 'Judy')),
        ),
        disjunction(
            conjunction(unify(child, 'Tom'), unify(parent, 'Wanita')),
            conjunction(unify(child, 'Greg'), unify(parent, 'Wanita')),
        )
    );

    const selectOneChild = (child, parent, grandparent) => conjunction(
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