"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCapability = requireCapability;
const errors_1 = require("../shared/errors.cjs");
function requireCapability(relq, capability, featureName, suggestion) {
    const value = relq.capabilities[capability];
    if (value === false) {
        throw new errors_1.RelqDialectError(`${featureName} is not supported`, relq.dialect, suggestion);
    }
}
