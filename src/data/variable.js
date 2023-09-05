class LogicVariable {
    constructor(name) {
        this.name = name;
    }

    equals(other) {
        return other instanceof LogicVariable && this.name === other.name;
    }
}

class LogicVariables {
    /**
     * @param {Object<string, LogicVariable>} registry
     * @param {number} size
     * @returns {LogicVariables}
     */
    constructor(registry, size) {
        this.registry = registry ?? {}
        this.size = size ?? 0;
    }

    /**
     * @returns {LogicVariables} an empty registry
     */
    static empty() {
        return new LogicVariables();
    }

    /**
     * @param {string} name
     * @returns {LogicVariable | undefined}
     */
    get(name) {
        return this.registry[name];
    }

    /**
     * @returns {{ variable: LogicVariable, variables: LogicVariables }} a new variable and registry
     */
    fresh() {   
        const variable = new LogicVariable(`_${this.size}`);

        return {
            variable,
            variables: new LogicVariables({
                ...this.registry, 
                [variable.name]: variable
            }, this.size + 1)
        };
    }
}

module.exports = {
    LogicVariable,
    LogicVariables
};