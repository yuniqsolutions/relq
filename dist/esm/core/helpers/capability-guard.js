import { RelqDialectError } from "../shared/errors.js";
export function requireCapability(relq, capability, featureName, suggestion) {
    const value = relq.capabilities[capability];
    if (value === false) {
        throw new RelqDialectError(`${featureName} is not supported`, relq.dialect, suggestion);
    }
}
