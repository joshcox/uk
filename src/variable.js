const lvar = (name) => Symbol.for(name);
const isLvar = (lvar) => typeof lvar === 'symbol' && new RegExp('^_[0-9]+$').test(lvar.description);
const isLvarEqual = (lvar1, lvar2) => isLvar(lvar1) && isLvar(lvar2) && lvar1 === lvar2;

module.exports = {
    lvar,
    isLvar,
    isLvarEqual
};