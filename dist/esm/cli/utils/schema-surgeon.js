import { Project, SyntaxKind, Node } from 'ts-morph';
function createSourceFile(filePath, content) {
    const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: { allowJs: true, strict: false },
    });
    return project.createSourceFile(filePath, content);
}
function findExportCallExpression(source, exportName) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        let node = init;
        while (Node.isCallExpression(node) || Node.isPropertyAccessExpression(node)) {
            const parent = node.getParent();
            if (!parent)
                break;
            if (Node.isCallExpression(parent) || Node.isPropertyAccessExpression(parent)) {
                node = parent;
            }
            else {
                break;
            }
        }
        if (Node.isCallExpression(node))
            return node;
        if (Node.isCallExpression(init))
            return init;
    }
    return undefined;
}
function findIdCallInChain(node) {
    const calls = node.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
        const expr = call.getExpression();
        if (Node.isPropertyAccessExpression(expr) && expr.getName() === '$id') {
            return call;
        }
    }
    return undefined;
}
function findTrackingIdProperty(source, exportName) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const defineTableCalls = init.getDescendantsOfKind(SyntaxKind.CallExpression).filter(c => {
            const e = c.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        const call = defineTableCalls[0];
        if (!call) {
            const e = Node.isCallExpression(init) ? init.getExpression() : undefined;
            if (e && Node.isIdentifier(e) && e.getText() === 'defineTable') {
                return findTrackingIdInCall(init);
            }
            continue;
        }
        return findTrackingIdInCall(call);
    }
    return undefined;
}
function findTrackingIdInCall(call) {
    const args = call.getArguments();
    const optionsArg = args[2];
    if (!optionsArg || !Node.isObjectLiteralExpression(optionsArg))
        return undefined;
    for (const prop of optionsArg.getProperties()) {
        if (Node.isPropertyAssignment(prop) && prop.getName() === '$trackingId') {
            const val = prop.getInitializer();
            if (val && Node.isStringLiteral(val)) {
                return { node: prop, value: val.getLiteralValue() };
            }
        }
    }
    return undefined;
}
function findSequenceTrackingId(source, exportName) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const seqCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)].filter(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'pgSequence';
        });
        const call = seqCalls[0];
        if (!call)
            continue;
        const args = call.getArguments();
        const optionsArg = args[1];
        if (!optionsArg || !Node.isObjectLiteralExpression(optionsArg))
            continue;
        for (const prop of optionsArg.getProperties()) {
            if (Node.isPropertyAssignment(prop) && prop.getName() === 'trackingId') {
                const val = prop.getInitializer();
                if (val && Node.isStringLiteral(val)) {
                    return { node: prop, value: val.getLiteralValue() };
                }
            }
        }
    }
    return undefined;
}
function findCallbackArrayElements(source, exportName, callbackName) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)];
        const defineTableCall = allCalls.find(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        if (!defineTableCall)
            continue;
        const args = defineTableCall.getArguments();
        const optionsArg = args[2];
        if (!optionsArg || !Node.isObjectLiteralExpression(optionsArg))
            continue;
        for (const prop of optionsArg.getProperties()) {
            if (!Node.isPropertyAssignment(prop))
                continue;
            if (prop.getName() !== callbackName)
                continue;
            const arrowFn = prop.getInitializer();
            if (!arrowFn || !Node.isArrowFunction(arrowFn))
                continue;
            const body = arrowFn.getBody();
            if (!body || !Node.isArrayLiteralExpression(body))
                continue;
            return body.getElements();
        }
    }
    return [];
}
function findColumnExpression(source, exportName, columnKey) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)];
        const defineTableCall = allCalls.find(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        if (!defineTableCall)
            continue;
        const args = defineTableCall.getArguments();
        const columnsArg = args[1];
        if (!columnsArg || !Node.isObjectLiteralExpression(columnsArg))
            continue;
        for (const prop of columnsArg.getProperties()) {
            if (Node.isPropertyAssignment(prop) && prop.getName() === columnKey) {
                return prop.getInitializer();
            }
        }
    }
    return undefined;
}
function buildIdInsertEdit(node, trackingId, description) {
    const end = node.getEnd();
    return {
        start: end,
        end,
        text: `.$id('${trackingId}')`,
        description,
    };
}
function buildIdReplaceEdit(idCall, newTrackingId, description) {
    return {
        start: idCall.getStart(),
        end: idCall.getEnd(),
        text: `.$id('${newTrackingId}')`,
        description,
    };
}
function buildTrackingIdPropertyInsert(source, exportName, trackingId, description) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)];
        const defineTableCall = allCalls.find(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        if (!defineTableCall)
            continue;
        const args = defineTableCall.getArguments();
        const optionsArg = args[2];
        if (!optionsArg || !Node.isObjectLiteralExpression(optionsArg))
            continue;
        const closeBrace = optionsArg.getEnd() - 1;
        const props = optionsArg.getProperties();
        if (props.length > 0) {
            const lastProp = props[props.length - 1];
            const afterLastProp = lastProp.getEnd();
            return {
                start: afterLastProp,
                end: afterLastProp,
                text: `,\n    $trackingId: '${trackingId}'`,
                description,
            };
        }
        else {
            return {
                start: closeBrace,
                end: closeBrace,
                text: `\n    $trackingId: '${trackingId}',\n`,
                description,
            };
        }
    }
    return undefined;
}
function buildTrackingIdPropertyReplace(propNode, newTrackingId, description) {
    return {
        start: propNode.getStart(),
        end: propNode.getEnd(),
        text: `$trackingId: '${newTrackingId}'`,
        description,
    };
}
function buildSequenceTrackingIdInsert(source, exportName, trackingId, description) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)];
        const seqCall = allCalls.find(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'pgSequence';
        });
        if (!seqCall)
            continue;
        const args = seqCall.getArguments();
        const optionsArg = args[1];
        if (!optionsArg || !Node.isObjectLiteralExpression(optionsArg))
            continue;
        const props = optionsArg.getProperties();
        if (props.length > 0) {
            const lastProp = props[props.length - 1];
            return {
                start: lastProp.getEnd(),
                end: lastProp.getEnd(),
                text: `, trackingId: '${trackingId}'`,
                description,
            };
        }
    }
    return undefined;
}
export function applyEdits(source, edits) {
    const sorted = [...edits].sort((a, b) => b.start - a.start);
    let result = source;
    for (const edit of sorted) {
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    }
    return result;
}
export function computeTrackingIdEdits(filePath, content, issues, parsedSchema, exportMap) {
    const source = createSourceFile(filePath, content);
    const edits = [];
    for (const issue of issues) {
        const edit = computeSingleEdit(source, issue, parsedSchema, exportMap);
        if (edit)
            edits.push(edit);
    }
    return edits;
}
function computeSingleEdit(source, issue, schema, exportMap) {
    const { entity, location, kind } = issue;
    const parts = location.split('.');
    const tableName = parts[0];
    const entityName = parts.slice(1).join('.');
    const table = schema.tables.find(t => t.name === tableName);
    switch (entity) {
        case 'table': {
            const exportName = exportMap.get(tableName);
            if (!exportName)
                return undefined;
            const newId = table?.trackingId;
            if (!newId)
                return undefined;
            if (kind === 'missing') {
                return buildTrackingIdPropertyInsert(source, exportName, newId, `Add $trackingId to table "${tableName}"`);
            }
            else {
                const existing = findTrackingIdProperty(source, exportName);
                if (existing) {
                    return buildTrackingIdPropertyReplace(existing.node, newId, `Replace duplicate $trackingId on table "${tableName}"`);
                }
            }
            break;
        }
        case 'column': {
            const exportName = exportMap.get(tableName);
            if (!exportName)
                return undefined;
            const col = table?.columns.find(c => c.name === entityName);
            if (!col?.trackingId)
                return undefined;
            const colNode = findColumnExpression(source, exportName, entityName)
                || findColumnByDbName(source, exportName, entityName);
            if (!colNode)
                return undefined;
            if (kind === 'missing') {
                return buildIdInsertEdit(colNode, col.trackingId, `Add $id to column "${location}"`);
            }
            else {
                const idCall = findIdCallInChain(colNode);
                if (idCall) {
                    return buildIdReplaceEdit(idCall, col.trackingId, `Replace duplicate $id on column "${location}"`);
                }
            }
            break;
        }
        case 'index': {
            const exportName = exportMap.get(tableName);
            if (!exportName)
                return undefined;
            const idx = table?.indexes.find(i => i.name === entityName);
            if (!idx?.trackingId)
                return undefined;
            const elements = findCallbackArrayElements(source, exportName, 'indexes');
            const indexNode = findElementByName(elements, entityName);
            if (!indexNode)
                return undefined;
            if (kind === 'missing') {
                return buildIdInsertEdit(indexNode, idx.trackingId, `Add $id to index "${location}"`);
            }
            else {
                const idCall = findIdCallInChain(indexNode);
                if (idCall) {
                    return buildIdReplaceEdit(idCall, idx.trackingId, `Replace duplicate $id on index "${location}"`);
                }
            }
            break;
        }
        case 'constraint': {
            const exportName = exportMap.get(tableName);
            if (!exportName)
                return undefined;
            const con = table?.constraints.find(c => c.name === entityName);
            if (!con?.trackingId)
                return undefined;
            let elements = findCallbackArrayElements(source, exportName, 'constraints');
            let conNode = findElementByName(elements, entityName);
            if (!conNode) {
                elements = findCallbackArrayElements(source, exportName, 'checkConstraints');
                conNode = findElementByName(elements, entityName);
            }
            if (!conNode)
                return undefined;
            if (kind === 'missing') {
                return buildIdInsertEdit(conNode, con.trackingId, `Add $id to constraint "${location}"`);
            }
            else {
                const idCall = findIdCallInChain(conNode);
                if (idCall) {
                    return buildIdReplaceEdit(idCall, con.trackingId, `Replace duplicate $id on constraint "${location}"`);
                }
            }
            break;
        }
    }
    return undefined;
}
function findColumnByDbName(source, exportName, dbName) {
    for (const decl of source.getVariableDeclarations()) {
        if (decl.getName() !== exportName)
            continue;
        const init = decl.getInitializer();
        if (!init)
            continue;
        const allCalls = [init, ...init.getDescendantsOfKind(SyntaxKind.CallExpression)];
        const defineTableCall = allCalls.find(n => {
            if (!Node.isCallExpression(n))
                return false;
            const e = n.getExpression();
            return Node.isIdentifier(e) && e.getText() === 'defineTable';
        });
        if (!defineTableCall)
            continue;
        const args = defineTableCall.getArguments();
        const columnsArg = args[1];
        if (!columnsArg || !Node.isObjectLiteralExpression(columnsArg))
            continue;
        for (const prop of columnsArg.getProperties()) {
            if (!Node.isPropertyAssignment(prop))
                continue;
            const val = prop.getInitializer();
            if (!val)
                continue;
            const strings = val.getDescendantsOfKind(SyntaxKind.StringLiteral);
            for (const s of strings) {
                if (s.getLiteralValue() === dbName) {
                    return val;
                }
            }
            if (prop.getName() === dbName) {
                return val;
            }
        }
    }
    return undefined;
}
function findElementByName(elements, name) {
    for (const el of elements) {
        const text = el.getText();
        if (text.includes(`'${name}'`) || text.includes(`"${name}"`)) {
            return el;
        }
    }
    return undefined;
}
export function computeTopLevelEdits(filePath, content, entityType, entities, exportMap, issues) {
    const source = createSourceFile(filePath, content);
    const edits = [];
    for (const issue of issues) {
        const entityName = issue.location;
        const entity = entities.find(e => e.name === entityName);
        if (!entity?.trackingId)
            continue;
        const exportName = exportMap.get(entityName);
        if (!exportName)
            continue;
        if (entityType === 'sequence') {
            if (issue.kind === 'missing') {
                const edit = buildSequenceTrackingIdInsert(source, exportName, entity.trackingId, `Add trackingId to sequence "${entityName}"`);
                if (edit)
                    edits.push(edit);
            }
            else {
                const existing = findSequenceTrackingId(source, exportName);
                if (existing) {
                    edits.push({
                        start: existing.node.getStart(),
                        end: existing.node.getEnd(),
                        text: `trackingId: '${entity.trackingId}'`,
                        description: `Replace duplicate trackingId on sequence "${entityName}"`,
                    });
                }
            }
        }
        else {
            const callExpr = findExportCallExpression(source, exportName);
            if (!callExpr)
                continue;
            if (issue.kind === 'missing') {
                edits.push(buildIdInsertEdit(callExpr, entity.trackingId, `Add $id to ${entityType} "${entityName}"`));
            }
            else {
                const idCall = findIdCallInChain(callExpr);
                if (idCall) {
                    edits.push(buildIdReplaceEdit(idCall, entity.trackingId, `Replace duplicate $id on ${entityType} "${entityName}"`));
                }
            }
        }
    }
    return edits;
}
