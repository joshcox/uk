const { and, fresh, conde } = require("../../src/kanren");
const { cons, empty } = require("../../src/list");
const { unify } = require("../../src/microkanren");

/**
 * @module test/utility/listo
 * @description
 * Utility functions for working with lists in microkanren.
 */

// Append two lists together
const appendo = (list1, list2, result) =>
    // conde is an "or" going down the parameter list, where every array of goals is an "and"
    // This is the same as saying: `or(and(...), and(...), and(...))
    conde(
        // If the first list is empty, then the result is the second list
        [unify(list1, empty), unify(list2, result)],
        // Otherwise, the result is the first list appended to the second list
        [fresh((a, d, res) => and(
            // The first list is a cons cell with the first element and the rest of the list
            unify(list1, cons(a, d)),
            // The result is a cons cell with the first element and the rest of the list
            unify(result, cons(a, res)),
            // The rest of the list is the result of appending the rest of the first list to the second list
            // We delay this goal to prevent unbounded infinite recursion
            // delay(() => appendo(d, list2, res))
            appendo(d, list2, res)
        ))]
    );

module.exports = {
    appendo
};