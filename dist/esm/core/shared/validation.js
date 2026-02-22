import { RelqQueryError } from "../../errors/relq-errors.js";
import { debugLog } from "../helpers/methods.js";
export function validateData(tableName, data, operation, mappings, config) {
    const validation = config?.validation;
    if (validation?.enabled === false)
        return;
    const mapping = mappings.get(tableName);
    if (!mapping) {
        debugLog(config, `No mapping found for table: ${tableName}. Available:`, Array.from(mappings.keys()));
        return;
    }
    const errors = [];
    const validateLength = validation?.validateLength !== false;
    const validateTypes = validation?.validateTypes !== false;
    const onError = validation?.onError ?? 'throw';
    debugLog(config, `Validating ${operation} on ${tableName}. Fields:`, Object.keys(data));
    for (const [propName, value] of Object.entries(data)) {
        if (value === null || value === undefined)
            continue;
        const colType = mapping.propToType.get(propName);
        const colTypeStr = typeof colType === 'string' ? colType : null;
        if (validateTypes && colTypeStr) {
            const jsType = typeof value;
            const upperType = colTypeStr.toUpperCase();
            if (['INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'INT2', 'INT4', 'INT8', 'SERIAL'].some(t => upperType.includes(t))) {
                if (jsType !== 'number' && jsType !== 'bigint' && jsType !== 'string') {
                    errors.push(`${propName}: expected number for ${colType}, got ${jsType}`);
                }
            }
            else if (['REAL', 'DOUBLE', 'FLOAT', 'NUMERIC', 'DECIMAL'].some(t => upperType.includes(t))) {
                if (jsType !== 'number' && jsType !== 'string') {
                    errors.push(`${propName}: expected number for ${colType}, got ${jsType}`);
                }
            }
            else if (upperType.includes('BOOL')) {
                if (jsType !== 'boolean') {
                    errors.push(`${propName}: expected boolean for ${colType}, got ${jsType}`);
                }
            }
            else if (['VARCHAR', 'CHAR', 'TEXT', 'UUID'].some(t => upperType.includes(t))) {
                if (jsType !== 'string') {
                    errors.push(`${propName}: expected string for ${colType}, got ${jsType}`);
                }
            }
        }
        if (validateLength && typeof value === 'string' && colTypeStr) {
            const lengthMatch = colTypeStr.match(/(?:var)?char\((\d+)\)/i);
            if (lengthMatch) {
                const maxLength = parseInt(lengthMatch[1], 10);
                if (value.length > maxLength) {
                    errors.push(`${propName}: string length ${value.length} exceeds ${colTypeStr} limit of ${maxLength}`);
                }
            }
        }
        const validateFn = mapping.propToValidate.get(propName);
        if (validateFn) {
            const isValid = validateFn(value);
            debugLog(config, `Domain validation for '${propName}' with value '${value}': isValid=${isValid}`);
            if (!isValid) {
                errors.push(`${propName}: value '${value}' failed domain validation`);
            }
        }
        const compositeFields = mapping.propToFields.get(propName);
        if (compositeFields && value && typeof value === 'object') {
            validateComposite(propName, value, compositeFields, errors, config);
        }
        const checkValues = mapping.propToCheckValues.get(propName);
        if (checkValues && checkValues.length > 0 && typeof value === 'string') {
            if (!checkValues.includes(value)) {
                errors.push(`${propName}: value '${value}' not in allowed values [${checkValues.join(', ')}]`);
            }
        }
    }
    if (errors.length > 0) {
        const message = `Validation failed for ${operation} on ${tableName}:\n  - ${errors.join('\n  - ')}`;
        debugLog(config, message);
        if (onError === 'throw') {
            throw new RelqQueryError(message);
        }
        else if (onError === 'warn') {
            console.warn('[Relq]', message);
        }
        else if (onError === 'log') {
            console.log('[Relq]', message);
        }
    }
}
export function validateComposite(propName, value, fields, errors, config) {
    const validation = config?.validation;
    const validateLength = validation?.validateLength !== false;
    const validateTypes = validation?.validateTypes !== false;
    for (const [fieldName, colDef] of Object.entries(fields)) {
        const colConfig = colDef;
        const fieldValue = value[fieldName];
        const colType = colConfig.$sqlType ?? colConfig.$config?.$type ?? (typeof colConfig.$type === 'string' ? colConfig.$type : 'TEXT');
        const upperType = colType.toUpperCase();
        const isNullable = colConfig.$config?.$nullable ?? colConfig.$nullable;
        debugLog(config, `Composite field '${propName}.${fieldName}': value=${JSON.stringify(fieldValue)}, colType=${colType}, nullable=${isNullable}`);
        if (fieldValue === null || fieldValue === undefined) {
            if (isNullable === false) {
                errors.push(`${propName}.${fieldName}: cannot be null`);
            }
            continue;
        }
        if (validateTypes && upperType) {
            const jsType = typeof fieldValue;
            if (['INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'SERIAL'].some(t => upperType.includes(t))) {
                if (jsType !== 'number' && jsType !== 'bigint' && jsType !== 'string') {
                    errors.push(`${propName}.${fieldName}: expected number, got ${jsType}`);
                }
            }
            else if (['VARCHAR', 'CHAR', 'TEXT'].some(t => upperType.includes(t))) {
                if (jsType !== 'string') {
                    errors.push(`${propName}.${fieldName}: expected string, got ${jsType}`);
                }
            }
        }
        if (validateLength && typeof fieldValue === 'string' && typeof colType === 'string') {
            const lengthMatch = colType.match(/(?:var)?char\((\d+)\)/i);
            if (lengthMatch) {
                const maxLength = parseInt(lengthMatch[1], 10);
                if (fieldValue.length > maxLength) {
                    errors.push(`${propName}.${fieldName}: length ${fieldValue.length} exceeds ${maxLength}`);
                }
            }
        }
        if (colConfig.$validate && typeof colConfig.$validate === 'function') {
            if (!colConfig.$validate(fieldValue)) {
                errors.push(`${propName}.${fieldName}: failed domain validation`);
            }
        }
        if (colConfig.$fields && fieldValue && typeof fieldValue === 'object') {
            validateComposite(`${propName}.${fieldName}`, fieldValue, colConfig.$fields, errors, config);
        }
    }
}
