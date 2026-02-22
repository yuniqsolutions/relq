import { DIALECT_FEATURES } from "./dialect-features.js";
export function getDialectFeatures(dialect) {
    const features = DIALECT_FEATURES.get(dialect);
    if (!features) {
        throw new Error(`Unknown dialect: ${dialect}`);
    }
    return features;
}
function normalizeTypeName(type) {
    return type
        .toUpperCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\(\d+\)/g, '')
        .replace(/\[\]/g, '');
}
export function validateColumnType(type, dialect) {
    const features = getDialectFeatures(dialect);
    const normalizedType = normalizeTypeName(type);
    const unsupportedInfo = features.unsupportedTypes.get(normalizedType);
    if (unsupportedInfo) {
        return {
            supported: false,
            type,
            dialect,
            reason: unsupportedInfo.reason,
            alternative: unsupportedInfo.alternative || features.typeAlternatives.get(normalizedType),
            docsUrl: unsupportedInfo.docsUrl,
        };
    }
    if (features.supportedTypes.has(normalizedType)) {
        return {
            supported: true,
            type,
            dialect,
        };
    }
    if (type.includes('[]')) {
        const baseType = normalizeTypeName(type.replace(/\[\]/g, ''));
        if (!features.supports.arrayColumns) {
            return {
                supported: false,
                type,
                dialect,
                reason: 'Array columns not supported',
                alternative: 'Use JSONB to store array data',
            };
        }
        return validateColumnType(baseType, dialect);
    }
    if (dialect === 'postgres') {
        return {
            supported: true,
            type,
            dialect,
        };
    }
    return {
        supported: false,
        type,
        dialect,
        reason: `Unknown type '${type}' - may not be supported`,
        alternative: 'Verify type is supported by the target dialect',
    };
}
export function validateColumnTypes(types, dialect) {
    return types
        .map(type => validateColumnType(type, dialect))
        .filter(result => !result.supported);
}
export function isIndexMethodSupported(method, dialect) {
    const features = getDialectFeatures(dialect);
    return features.supportedIndexMethods.has(method);
}
export function getSupportedIndexMethods(dialect) {
    return getDialectFeatures(dialect).supportedIndexMethods;
}
export function isFeatureSupported(feature, dialect) {
    const features = getDialectFeatures(dialect);
    return features.supports[feature];
}
export function getUnsupportedFeatures(dialect) {
    const features = getDialectFeatures(dialect);
    const unsupported = [];
    for (const [key, value] of Object.entries(features.supports)) {
        if (!value) {
            unsupported.push(key);
        }
    }
    return unsupported;
}
export function compareDialectFeatures(dialect1, dialect2) {
    const features1 = getDialectFeatures(dialect1);
    const features2 = getDialectFeatures(dialect2);
    const onlyIn1 = [];
    const onlyIn2 = [];
    const bothSupport = [];
    const neitherSupport = [];
    for (const key of Object.keys(features1.supports)) {
        const in1 = features1.supports[key];
        const in2 = features2.supports[key];
        if (in1 && in2) {
            bothSupport.push(key);
        }
        else if (in1 && !in2) {
            onlyIn1.push(key);
        }
        else if (!in1 && in2) {
            onlyIn2.push(key);
        }
        else {
            neitherSupport.push(key);
        }
    }
    return { onlyIn1, onlyIn2, bothSupport, neitherSupport };
}
export function getPortableFeatureSet() {
    const dsqlFeatures = getDialectFeatures('dsql');
    return {
        supportedTypes: dsqlFeatures.supportedTypes,
        supportedIndexMethods: dsqlFeatures.supportedIndexMethods,
        supports: { ...dsqlFeatures.supports },
    };
}
