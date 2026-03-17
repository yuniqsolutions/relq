"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSourceTrackingIds = validateSourceTrackingIds;
const ts_morph_1 = require("ts-morph");
function createSourceFile(filePath, content) {
    const project = new ts_morph_1.Project({
        useInMemoryFileSystem: true,
        compilerOptions: { allowJs: true, strict: false },
    });
    return project.createSourceFile(filePath, content);
}
function hasIdCall(node) {
    const calls = node.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    for (const call of calls) {
        const expr = call.getExpression();
        if (ts_morph_1.Node.isPropertyAccessExpression(expr) && expr.getName() === '$id') {
            return true;
        }
    }
    if (ts_morph_1.Node.isCallExpression(node)) {
        const expr = node.getExpression();
        if (ts_morph_1.Node.isPropertyAccessExpression(expr) && expr.getName() === '$id') {
            return true;
        }
    }
    return false;
}
function hasTrackingIdProperty(node, propName = '$trackingId') {
    if (!ts_morph_1.Node.isObjectLiteralExpression(node))
        return false;
    for (const prop of node.getProperties()) {
        if (ts_morph_1.Node.isPropertyAssignment(prop) && prop.getName() === propName) {
            return true;
        }
    }
    return false;
}
function getFirstStringArg(node) {
    if (!ts_morph_1.Node.isCallExpression(node)) {
        const calls = node.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
        for (const call of calls) {
            const args = call.getArguments();
            if (args.length > 0 && ts_morph_1.Node.isStringLiteral(args[0])) {
                return args[0].getLiteralValue();
            }
        }
        return undefined;
    }
    const args = node.getArguments();
    if (args.length > 0 && ts_morph_1.Node.isStringLiteral(args[0])) {
        return args[0].getLiteralValue();
    }
    return undefined;
}
function findInnermostCall(node) {
    if (ts_morph_1.Node.isCallExpression(node)) {
        const expr = node.getExpression();
        if (ts_morph_1.Node.isPropertyAccessExpression(expr)) {
            const inner = findInnermostCall(expr.getExpression());
            return inner || node;
        }
        return node;
    }
    if (ts_morph_1.Node.isPropertyAccessExpression(node)) {
        return findInnermostCall(node.getExpression());
    }
    return undefined;
}
function getElementName(node) {
    const text = node.getText();
    const singleQuoteMatch = text.match(/['"]([^'"]+)['"]/);
    if (singleQuoteMatch)
        return singleQuoteMatch[1];
    return undefined;
}
function validateTableExport(source, exportName, issues) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)];
        const defineTableCall = allCalls.find(n => {
            if (!ts_morph_1.Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return ts_morph_1.Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        if (!defineTableCall)
            continue;
        const args = defineTableCall.getArguments();
        if (args.length === 0)
            continue;
        const tableName = ts_morph_1.Node.isStringLiteral(args[0]) ? args[0].getLiteralValue() : exportName;
        const optionsArg = args[2];
        if (!optionsArg || !ts_morph_1.Node.isObjectLiteralExpression(optionsArg)) {
            issues.push({
                severity: 'error',
                kind: 'missing',
                entity: 'table',
                location: tableName,
                message: `Missing $trackingId on table "${tableName}".`,
            });
        }
        else if (!hasTrackingIdProperty(optionsArg, '$trackingId')) {
            issues.push({
                severity: 'error',
                kind: 'missing',
                entity: 'table',
                location: tableName,
                message: `Missing $trackingId on table "${tableName}".`,
            });
        }
        const columnsArg = args[1];
        if (columnsArg && ts_morph_1.Node.isObjectLiteralExpression(columnsArg)) {
            validateColumns(columnsArg, tableName, issues);
        }
        if (optionsArg && ts_morph_1.Node.isObjectLiteralExpression(optionsArg)) {
            validateCallbackArray(optionsArg, 'indexes', 'index', tableName, issues);
            validateCallbackArray(optionsArg, 'constraints', 'constraint', tableName, issues);
            validateCallbackArray(optionsArg, 'checkConstraints', 'constraint', tableName, issues);
        }
    }
}
function validateColumns(columnsObj, tableName, issues) {
    if (!ts_morph_1.Node.isObjectLiteralExpression(columnsObj))
        return;
    for (const prop of columnsObj.getProperties()) {
        if (!ts_morph_1.Node.isPropertyAssignment(prop))
            continue;
        const colKey = prop.getName();
        const init = prop.getInitializer();
        if (!init)
            continue;
        if (!hasIdCall(init)) {
            const sqlName = getFirstStringArg(init) || colKey;
            issues.push({
                severity: 'error',
                kind: 'missing',
                entity: 'column',
                location: `${tableName}.${sqlName}`,
                message: `Missing $id() on column "${tableName}.${sqlName}".`,
            });
        }
    }
}
function validateCallbackArray(optionsObj, callbackName, entityType, tableName, issues) {
    if (!ts_morph_1.Node.isObjectLiteralExpression(optionsObj))
        return;
    for (const prop of optionsObj.getProperties()) {
        if (!ts_morph_1.Node.isPropertyAssignment(prop))
            continue;
        if (prop.getName() !== callbackName)
            continue;
        const arrowFn = prop.getInitializer();
        if (!arrowFn || !ts_morph_1.Node.isArrowFunction(arrowFn))
            continue;
        const body = arrowFn.getBody();
        if (!body || !ts_morph_1.Node.isArrayLiteralExpression(body))
            continue;
        for (const element of body.getElements()) {
            if (!hasIdCall(element)) {
                const name = getElementName(element) || '(unknown)';
                issues.push({
                    severity: 'error',
                    kind: 'missing',
                    entity: entityType,
                    location: `${tableName}.${name}`,
                    message: `Missing $id() on ${entityType} "${tableName}.${name}".`,
                });
            }
        }
    }
}
const TOP_LEVEL_BUILDERS = new Set([
    'pgEnum', 'pgDomain', 'pgFunction', 'pgTrigger',
    'pgView', 'pgMaterializedView', 'pgPolicy',
]);
const SEQUENCE_BUILDER = 'pgSequence';
function getBuilderName(init) {
    const calls = [
        ...(ts_morph_1.Node.isCallExpression(init) ? [init] : []),
        ...init.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression),
    ];
    for (const call of calls) {
        const expr = call.getExpression();
        if (ts_morph_1.Node.isIdentifier(expr)) {
            const name = expr.getText();
            if (TOP_LEVEL_BUILDERS.has(name) || name === SEQUENCE_BUILDER || name === 'defineTable') {
                return name;
            }
        }
    }
    return undefined;
}
function validateTopLevelExport(init, exportName, builderName, issues) {
    if (builderName === SEQUENCE_BUILDER) {
        const calls = [
            ...(ts_morph_1.Node.isCallExpression(init) ? [init] : []),
            ...init.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression),
        ];
        const seqCall = calls.find(c => {
            const e = c.getExpression();
            return ts_morph_1.Node.isIdentifier(e) && e.getText() === SEQUENCE_BUILDER;
        });
        if (!seqCall)
            return;
        const args = seqCall.getArguments();
        const name = (args.length > 0 && ts_morph_1.Node.isStringLiteral(args[0]))
            ? args[0].getLiteralValue()
            : exportName;
        const optionsArg = args[1];
        if (!optionsArg || !ts_morph_1.Node.isObjectLiteralExpression(optionsArg) ||
            !hasTrackingIdProperty(optionsArg, 'trackingId')) {
            issues.push({
                severity: 'error',
                kind: 'missing',
                entity: 'table',
                location: name,
                message: `Missing trackingId on sequence "${name}".`,
            });
        }
        return;
    }
    if (!hasIdCall(init)) {
        const name = getFirstStringArg(init) || exportName;
        const entityMap = {
            pgEnum: 'enum',
            pgDomain: 'domain',
            pgFunction: 'function',
            pgTrigger: 'trigger',
            pgView: 'view',
            pgMaterializedView: 'materialized view',
            pgPolicy: 'policy',
        };
        const entityType = entityMap[builderName] || builderName;
        issues.push({
            severity: 'error',
            kind: 'missing',
            entity: 'table',
            location: name,
            message: `Missing $id() on ${entityType} "${name}".`,
        });
    }
}
function validateSourceTrackingIds(filePath, content) {
    const source = createSourceFile(filePath, content);
    const issues = [];
    for (const decl of source.getVariableDeclarations()) {
        const init = decl.getInitializer();
        if (!init)
            continue;
        const exportName = decl.getName();
        const builderName = getBuilderName(init);
        if (!builderName)
            continue;
        if (builderName === 'defineTable') {
            validateTableExport(source, exportName, issues);
        }
        else {
            validateTopLevelExport(init, exportName, builderName, issues);
        }
    }
    return issues;
}
