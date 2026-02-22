import format from "../utils/pg-format.js";
import { RelqBuilderError } from "../errors/relq-errors.js";
export class CreateSchemaBuilder {
    schemaName;
    ifNotExistsFlag = false;
    authorizationUser;
    constructor(schemaName) {
        this.schemaName = schemaName;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    authorization(user) {
        this.authorizationUser = user;
        return this;
    }
    toString() {
        let sql = 'CREATE SCHEMA';
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${format.ident(this.schemaName)}`;
        if (this.authorizationUser) {
            sql += ` AUTHORIZATION ${format.ident(this.authorizationUser)}`;
        }
        return sql;
    }
}
export class DropSchemaBuilder {
    schemaName;
    ifExistsFlag = false;
    cascadeFlag = false;
    constructor(schemaName) {
        this.schemaName = schemaName;
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        return this;
    }
    restrict() {
        this.cascadeFlag = false;
        return this;
    }
    toString() {
        let sql = 'DROP SCHEMA';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${format.ident(this.schemaName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
export class GrantBuilder {
    privileges = [];
    columnPrivileges = [];
    objectType;
    objectNames = [];
    schemaName;
    allInSchema = false;
    grantees = [];
    withGrantOption = false;
    grantedByRole;
    isRoleGrant = false;
    roleNames = [];
    withAdminOption = false;
    withInheritOption;
    withSetOption;
    grant(...privileges) {
        this.privileges.push(...privileges);
        return this;
    }
    select(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'SELECT', columns });
        }
        else {
            this.privileges.push('SELECT');
        }
        return this;
    }
    insert(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'INSERT', columns });
        }
        else {
            this.privileges.push('INSERT');
        }
        return this;
    }
    update(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'UPDATE', columns });
        }
        else {
            this.privileges.push('UPDATE');
        }
        return this;
    }
    references(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'REFERENCES', columns });
        }
        else {
            this.privileges.push('REFERENCES');
        }
        return this;
    }
    all() {
        this.privileges.push('ALL PRIVILEGES');
        return this;
    }
    onTable(...tableNames) {
        this.objectType = 'TABLE';
        this.objectNames = tableNames;
        return this;
    }
    onSequence(...sequenceNames) {
        this.objectType = 'SEQUENCE';
        this.objectNames = sequenceNames;
        return this;
    }
    onFunction(...functionSignatures) {
        this.objectType = 'FUNCTION';
        this.objectNames = functionSignatures;
        return this;
    }
    onProcedure(...procedureSignatures) {
        this.objectType = 'PROCEDURE';
        this.objectNames = procedureSignatures;
        return this;
    }
    onDatabase(...databaseNames) {
        this.objectType = 'DATABASE';
        this.objectNames = databaseNames;
        return this;
    }
    onSchema(...schemaNames) {
        this.objectType = 'SCHEMA';
        this.objectNames = schemaNames;
        return this;
    }
    onTablespace(...tablespaceNames) {
        this.objectType = 'TABLESPACE';
        this.objectNames = tablespaceNames;
        return this;
    }
    onDomain(...domainNames) {
        this.objectType = 'DOMAIN';
        this.objectNames = domainNames;
        return this;
    }
    onType(...typeNames) {
        this.objectType = 'TYPE';
        this.objectNames = typeNames;
        return this;
    }
    onLanguage(...languageNames) {
        this.objectType = 'LANGUAGE';
        this.objectNames = languageNames;
        return this;
    }
    onForeignDataWrapper(...fdwNames) {
        this.objectType = 'FOREIGN DATA WRAPPER';
        this.objectNames = fdwNames;
        return this;
    }
    onForeignServer(...serverNames) {
        this.objectType = 'FOREIGN SERVER';
        this.objectNames = serverNames;
        return this;
    }
    onLargeObject(...oids) {
        this.objectType = 'LARGE OBJECT';
        this.objectNames = oids.map(String);
        return this;
    }
    on(objectType, ...objectNames) {
        this.objectType = objectType.toUpperCase();
        this.objectNames = objectNames;
        return this;
    }
    onAllTablesInSchema(schemaName) {
        this.objectType = 'ALL TABLES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllSequencesInSchema(schemaName) {
        this.objectType = 'ALL SEQUENCES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllFunctionsInSchema(schemaName) {
        this.objectType = 'ALL FUNCTIONS IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllProceduresInSchema(schemaName) {
        this.objectType = 'ALL PROCEDURES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllRoutinesInSchema(schemaName) {
        this.objectType = 'ALL ROUTINES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    to(...grantees) {
        this.grantees.push(...grantees);
        return this;
    }
    toPublic() {
        this.grantees.push('PUBLIC');
        return this;
    }
    toCurrentUser() {
        this.grantees.push('CURRENT_USER');
        return this;
    }
    toSessionUser() {
        this.grantees.push('SESSION_USER');
        return this;
    }
    toCurrentRole() {
        this.grantees.push('CURRENT_ROLE');
        return this;
    }
    withGrant() {
        this.withGrantOption = true;
        return this;
    }
    grantedBy(role) {
        this.grantedByRole = role;
        return this;
    }
    roles(...roleNames) {
        this.isRoleGrant = true;
        this.roleNames = roleNames;
        return this;
    }
    withAdmin() {
        this.withAdminOption = true;
        return this;
    }
    withInherit(value = true) {
        this.withInheritOption = value;
        return this;
    }
    withSet(value = true) {
        this.withSetOption = value;
        return this;
    }
    toString() {
        if (this.isRoleGrant) {
            return this.buildRoleGrant();
        }
        return this.buildPrivilegeGrant();
    }
    buildRoleGrant() {
        if (this.roleNames.length === 0) {
            throw new RelqBuilderError('No roles specified for role grant', { builder: 'GrantBuilder', missing: 'roles', hint: 'Use .roles()' });
        }
        if (this.grantees.length === 0) {
            throw new RelqBuilderError('No grantees specified', { builder: 'GrantBuilder', missing: 'grantees', hint: 'Use .to()' });
        }
        const roles = this.roleNames.map(r => format.ident(r)).join(', ');
        const grantees = this.formatGrantees();
        let sql = `GRANT ${roles} TO ${grantees}`;
        const options = [];
        if (this.withAdminOption) {
            options.push('ADMIN OPTION');
        }
        if (this.withInheritOption !== undefined) {
            options.push(this.withInheritOption ? 'INHERIT TRUE' : 'INHERIT FALSE');
        }
        if (this.withSetOption !== undefined) {
            options.push(this.withSetOption ? 'SET TRUE' : 'SET FALSE');
        }
        if (options.length > 0) {
            sql += ` WITH ${options.join(', ')}`;
        }
        if (this.grantedByRole) {
            sql += ` GRANTED BY ${format.ident(this.grantedByRole)}`;
        }
        return sql;
    }
    buildPrivilegeGrant() {
        const allPrivs = this.buildPrivilegeList();
        if (allPrivs.length === 0) {
            throw new RelqBuilderError('No privileges specified', { builder: 'GrantBuilder', missing: 'privileges', hint: 'Use .grant() or column-specific methods' });
        }
        if (!this.objectType) {
            throw new RelqBuilderError('Object type required', { builder: 'GrantBuilder', missing: 'objectType', hint: 'Use .onTable(), .onSchema(), etc.' });
        }
        if (this.grantees.length === 0) {
            throw new RelqBuilderError('No grantees specified', { builder: 'GrantBuilder', missing: 'grantees', hint: 'Use .to()' });
        }
        let sql = `GRANT ${allPrivs}`;
        if (this.allInSchema) {
            sql += ` ON ${this.objectType} ${format.ident(this.schemaName)}`;
        }
        else {
            const objects = this.objectNames.map(n => {
                if (this.objectType === 'LARGE OBJECT') {
                    return n;
                }
                if (this.objectType === 'FUNCTION' || this.objectType === 'PROCEDURE' || this.objectType === 'ROUTINE') {
                    return n;
                }
                return format.ident(n);
            }).join(', ');
            sql += ` ON ${this.objectType} ${objects}`;
        }
        sql += ` TO ${this.formatGrantees()}`;
        if (this.withGrantOption) {
            sql += ' WITH GRANT OPTION';
        }
        if (this.grantedByRole) {
            sql += ` GRANTED BY ${format.ident(this.grantedByRole)}`;
        }
        return sql;
    }
    buildPrivilegeList() {
        const parts = [...this.privileges];
        for (const cp of this.columnPrivileges) {
            const cols = cp.columns.map(c => format.ident(c)).join(', ');
            parts.push(`${cp.privilege} (${cols})`);
        }
        return parts.join(', ');
    }
    formatGrantees() {
        return this.grantees.map(g => {
            const upper = g.toUpperCase();
            if (upper === 'PUBLIC' || upper === 'CURRENT_USER' || upper === 'SESSION_USER' || upper === 'CURRENT_ROLE') {
                return upper;
            }
            return format.ident(g);
        }).join(', ');
    }
}
export class RevokeBuilder {
    privileges = [];
    columnPrivileges = [];
    objectType;
    objectNames = [];
    schemaName;
    allInSchema = false;
    grantees = [];
    cascadeFlag = false;
    restrictFlag = false;
    grantOptionFor = false;
    adminOptionFor = false;
    inheritOptionFor = false;
    setOptionFor = false;
    grantedByRole;
    isRoleRevoke = false;
    roleNames = [];
    revoke(...privileges) {
        this.privileges.push(...privileges);
        return this;
    }
    select(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'SELECT', columns });
        }
        else {
            this.privileges.push('SELECT');
        }
        return this;
    }
    insert(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'INSERT', columns });
        }
        else {
            this.privileges.push('INSERT');
        }
        return this;
    }
    update(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'UPDATE', columns });
        }
        else {
            this.privileges.push('UPDATE');
        }
        return this;
    }
    references(...columns) {
        if (columns.length > 0) {
            this.columnPrivileges.push({ privilege: 'REFERENCES', columns });
        }
        else {
            this.privileges.push('REFERENCES');
        }
        return this;
    }
    all() {
        this.privileges.push('ALL PRIVILEGES');
        return this;
    }
    onTable(...tableNames) {
        this.objectType = 'TABLE';
        this.objectNames = tableNames;
        return this;
    }
    onSequence(...sequenceNames) {
        this.objectType = 'SEQUENCE';
        this.objectNames = sequenceNames;
        return this;
    }
    onFunction(...functionSignatures) {
        this.objectType = 'FUNCTION';
        this.objectNames = functionSignatures;
        return this;
    }
    onProcedure(...procedureSignatures) {
        this.objectType = 'PROCEDURE';
        this.objectNames = procedureSignatures;
        return this;
    }
    onDatabase(...databaseNames) {
        this.objectType = 'DATABASE';
        this.objectNames = databaseNames;
        return this;
    }
    onSchema(...schemaNames) {
        this.objectType = 'SCHEMA';
        this.objectNames = schemaNames;
        return this;
    }
    onTablespace(...tablespaceNames) {
        this.objectType = 'TABLESPACE';
        this.objectNames = tablespaceNames;
        return this;
    }
    onDomain(...domainNames) {
        this.objectType = 'DOMAIN';
        this.objectNames = domainNames;
        return this;
    }
    onType(...typeNames) {
        this.objectType = 'TYPE';
        this.objectNames = typeNames;
        return this;
    }
    onLanguage(...languageNames) {
        this.objectType = 'LANGUAGE';
        this.objectNames = languageNames;
        return this;
    }
    onForeignDataWrapper(...fdwNames) {
        this.objectType = 'FOREIGN DATA WRAPPER';
        this.objectNames = fdwNames;
        return this;
    }
    onForeignServer(...serverNames) {
        this.objectType = 'FOREIGN SERVER';
        this.objectNames = serverNames;
        return this;
    }
    onLargeObject(...oids) {
        this.objectType = 'LARGE OBJECT';
        this.objectNames = oids.map(String);
        return this;
    }
    on(objectType, ...objectNames) {
        this.objectType = objectType.toUpperCase();
        this.objectNames = objectNames;
        return this;
    }
    onAllTablesInSchema(schemaName) {
        this.objectType = 'ALL TABLES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllSequencesInSchema(schemaName) {
        this.objectType = 'ALL SEQUENCES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllFunctionsInSchema(schemaName) {
        this.objectType = 'ALL FUNCTIONS IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllProceduresInSchema(schemaName) {
        this.objectType = 'ALL PROCEDURES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    onAllRoutinesInSchema(schemaName) {
        this.objectType = 'ALL ROUTINES IN SCHEMA';
        this.schemaName = schemaName;
        this.allInSchema = true;
        return this;
    }
    from(...grantees) {
        this.grantees.push(...grantees);
        return this;
    }
    fromPublic() {
        this.grantees.push('PUBLIC');
        return this;
    }
    fromCurrentUser() {
        this.grantees.push('CURRENT_USER');
        return this;
    }
    fromSessionUser() {
        this.grantees.push('SESSION_USER');
        return this;
    }
    fromCurrentRole() {
        this.grantees.push('CURRENT_ROLE');
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        this.restrictFlag = false;
        return this;
    }
    restrict() {
        this.restrictFlag = true;
        this.cascadeFlag = false;
        return this;
    }
    grantOption() {
        this.grantOptionFor = true;
        return this;
    }
    adminOption() {
        this.adminOptionFor = true;
        return this;
    }
    inheritOption() {
        this.inheritOptionFor = true;
        return this;
    }
    setOption() {
        this.setOptionFor = true;
        return this;
    }
    grantedBy(role) {
        this.grantedByRole = role;
        return this;
    }
    roles(...roleNames) {
        this.isRoleRevoke = true;
        this.roleNames = roleNames;
        return this;
    }
    toString() {
        if (this.isRoleRevoke) {
            return this.buildRoleRevoke();
        }
        return this.buildPrivilegeRevoke();
    }
    buildRoleRevoke() {
        if (this.roleNames.length === 0) {
            throw new RelqBuilderError('No roles specified for role revoke', { builder: 'RevokeBuilder', missing: 'roles', hint: 'Use .roles()' });
        }
        if (this.grantees.length === 0) {
            throw new RelqBuilderError('No grantees specified', { builder: 'RevokeBuilder', missing: 'grantees', hint: 'Use .from()' });
        }
        let sql = 'REVOKE';
        if (this.adminOptionFor) {
            sql += ' ADMIN OPTION FOR';
        }
        else if (this.inheritOptionFor) {
            sql += ' INHERIT OPTION FOR';
        }
        else if (this.setOptionFor) {
            sql += ' SET OPTION FOR';
        }
        const roles = this.roleNames.map(r => format.ident(r)).join(', ');
        sql += ` ${roles} FROM ${this.formatGrantees()}`;
        if (this.grantedByRole) {
            sql += ` GRANTED BY ${format.ident(this.grantedByRole)}`;
        }
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        else if (this.restrictFlag) {
            sql += ' RESTRICT';
        }
        return sql;
    }
    buildPrivilegeRevoke() {
        const allPrivs = this.buildPrivilegeList();
        if (allPrivs.length === 0) {
            throw new RelqBuilderError('No privileges specified', { builder: 'RevokeBuilder', missing: 'privileges', hint: 'Use .revoke() or column-specific methods' });
        }
        if (!this.objectType) {
            throw new RelqBuilderError('Object type required', { builder: 'RevokeBuilder', missing: 'objectType', hint: 'Use .onTable(), .onSchema(), etc.' });
        }
        if (this.grantees.length === 0) {
            throw new RelqBuilderError('No grantees specified', { builder: 'RevokeBuilder', missing: 'grantees', hint: 'Use .from()' });
        }
        let sql = 'REVOKE';
        if (this.grantOptionFor) {
            sql += ' GRANT OPTION FOR';
        }
        sql += ` ${allPrivs}`;
        if (this.allInSchema) {
            sql += ` ON ${this.objectType} ${format.ident(this.schemaName)}`;
        }
        else {
            const objects = this.objectNames.map(n => {
                if (this.objectType === 'LARGE OBJECT') {
                    return n;
                }
                if (this.objectType === 'FUNCTION' || this.objectType === 'PROCEDURE' || this.objectType === 'ROUTINE') {
                    return n;
                }
                return format.ident(n);
            }).join(', ');
            sql += ` ON ${this.objectType} ${objects}`;
        }
        sql += ` FROM ${this.formatGrantees()}`;
        if (this.grantedByRole) {
            sql += ` GRANTED BY ${format.ident(this.grantedByRole)}`;
        }
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        else if (this.restrictFlag) {
            sql += ' RESTRICT';
        }
        return sql;
    }
    buildPrivilegeList() {
        const parts = [...this.privileges];
        for (const cp of this.columnPrivileges) {
            const cols = cp.columns.map(c => format.ident(c)).join(', ');
            parts.push(`${cp.privilege} (${cols})`);
        }
        return parts.join(', ');
    }
    formatGrantees() {
        return this.grantees.map(g => {
            const upper = g.toUpperCase();
            if (upper === 'PUBLIC' || upper === 'CURRENT_USER' || upper === 'SESSION_USER' || upper === 'CURRENT_ROLE') {
                return upper;
            }
            return format.ident(g);
        }).join(', ');
    }
}
export class CreateRoleBuilder {
    roleName;
    ifNotExistsFlag = false;
    options = {};
    constructor(roleName) {
        this.roleName = roleName;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    superuser(value = true) {
        this.options.superuser = value;
        return this;
    }
    createdb(value = true) {
        this.options.createdb = value;
        return this;
    }
    createrole(value = true) {
        this.options.createrole = value;
        return this;
    }
    inherit(value = true) {
        this.options.inherit = value;
        return this;
    }
    login(value = true) {
        this.options.login = value;
        return this;
    }
    replication(value = true) {
        this.options.replication = value;
        return this;
    }
    bypassRls(value = true) {
        this.options.bypassRls = value;
        return this;
    }
    connectionLimit(limit) {
        this.options.connectionLimit = limit;
        return this;
    }
    password(pwd) {
        this.options.password = pwd;
        return this;
    }
    validUntil(timestamp) {
        this.options.validUntil = timestamp;
        return this;
    }
    inRole(...roles) {
        this.options.inRole = roles;
        return this;
    }
    role(...roles) {
        this.options.role = roles;
        return this;
    }
    admin(...roles) {
        this.options.admin = roles;
        return this;
    }
    toString() {
        let sql = 'CREATE ROLE';
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${format.ident(this.roleName)}`;
        const opts = this.buildOptions();
        if (opts.length > 0) {
            sql += ` WITH ${opts.join(' ')}`;
        }
        return sql;
    }
    buildOptions() {
        const opts = [];
        if (this.options.superuser !== undefined) {
            opts.push(this.options.superuser ? 'SUPERUSER' : 'NOSUPERUSER');
        }
        if (this.options.createdb !== undefined) {
            opts.push(this.options.createdb ? 'CREATEDB' : 'NOCREATEDB');
        }
        if (this.options.createrole !== undefined) {
            opts.push(this.options.createrole ? 'CREATEROLE' : 'NOCREATEROLE');
        }
        if (this.options.inherit !== undefined) {
            opts.push(this.options.inherit ? 'INHERIT' : 'NOINHERIT');
        }
        if (this.options.login !== undefined) {
            opts.push(this.options.login ? 'LOGIN' : 'NOLOGIN');
        }
        if (this.options.replication !== undefined) {
            opts.push(this.options.replication ? 'REPLICATION' : 'NOREPLICATION');
        }
        if (this.options.bypassRls !== undefined) {
            opts.push(this.options.bypassRls ? 'BYPASSRLS' : 'NOBYPASSRLS');
        }
        if (this.options.connectionLimit !== undefined) {
            opts.push(`CONNECTION LIMIT ${this.options.connectionLimit}`);
        }
        if (this.options.password !== undefined) {
            if (this.options.password === null) {
                opts.push('PASSWORD NULL');
            }
            else {
                opts.push(format('PASSWORD %L', this.options.password));
            }
        }
        if (this.options.validUntil) {
            opts.push(format('VALID UNTIL %L', this.options.validUntil));
        }
        if (this.options.inRole && this.options.inRole.length > 0) {
            opts.push(`IN ROLE ${this.options.inRole.map(r => format.ident(r)).join(', ')}`);
        }
        if (this.options.role && this.options.role.length > 0) {
            opts.push(`ROLE ${this.options.role.map(r => format.ident(r)).join(', ')}`);
        }
        if (this.options.admin && this.options.admin.length > 0) {
            opts.push(`ADMIN ${this.options.admin.map(r => format.ident(r)).join(', ')}`);
        }
        return opts;
    }
}
export class AlterRoleBuilder {
    roleName;
    options = {};
    renameToValue;
    setConfig = new Map();
    resetConfig = [];
    inDatabaseName;
    constructor(roleName) {
        this.roleName = roleName;
    }
    superuser(value = true) {
        this.options.superuser = value;
        return this;
    }
    createdb(value = true) {
        this.options.createdb = value;
        return this;
    }
    createrole(value = true) {
        this.options.createrole = value;
        return this;
    }
    inherit(value = true) {
        this.options.inherit = value;
        return this;
    }
    login(value = true) {
        this.options.login = value;
        return this;
    }
    replication(value = true) {
        this.options.replication = value;
        return this;
    }
    bypassRls(value = true) {
        this.options.bypassRls = value;
        return this;
    }
    connectionLimit(limit) {
        this.options.connectionLimit = limit;
        return this;
    }
    password(pwd) {
        this.options.password = pwd;
        return this;
    }
    validUntil(timestamp) {
        this.options.validUntil = timestamp;
        return this;
    }
    renameTo(newName) {
        this.renameToValue = newName;
        return this;
    }
    set(parameter, value) {
        this.setConfig.set(parameter, value);
        return this;
    }
    setDefault(parameter) {
        this.setConfig.set(parameter, null);
        return this;
    }
    reset(parameter) {
        this.resetConfig.push(parameter);
        return this;
    }
    resetAll() {
        this.resetConfig.push('ALL');
        return this;
    }
    inDatabase(database) {
        this.inDatabaseName = database;
        return this;
    }
    toString() {
        if (this.renameToValue) {
            return `ALTER ROLE ${format.ident(this.roleName)} RENAME TO ${format.ident(this.renameToValue)}`;
        }
        const roleSpec = this.inDatabaseName
            ? `ALTER ROLE ${format.ident(this.roleName)} IN DATABASE ${format.ident(this.inDatabaseName)}`
            : `ALTER ROLE ${format.ident(this.roleName)}`;
        if (this.setConfig.size > 0) {
            const entries = Array.from(this.setConfig.entries());
            const [param, value] = entries[0];
            if (value === null) {
                return `${roleSpec} SET ${param} TO DEFAULT`;
            }
            return `${roleSpec} SET ${param} TO ${format('%L', value)}`;
        }
        if (this.resetConfig.length > 0) {
            return `${roleSpec} RESET ${this.resetConfig[0]}`;
        }
        const opts = this.buildOptions();
        if (opts.length > 0) {
            return `ALTER ROLE ${format.ident(this.roleName)} WITH ${opts.join(' ')}`;
        }
        return `ALTER ROLE ${format.ident(this.roleName)}`;
    }
    buildOptions() {
        const opts = [];
        if (this.options.superuser !== undefined) {
            opts.push(this.options.superuser ? 'SUPERUSER' : 'NOSUPERUSER');
        }
        if (this.options.createdb !== undefined) {
            opts.push(this.options.createdb ? 'CREATEDB' : 'NOCREATEDB');
        }
        if (this.options.createrole !== undefined) {
            opts.push(this.options.createrole ? 'CREATEROLE' : 'NOCREATEROLE');
        }
        if (this.options.inherit !== undefined) {
            opts.push(this.options.inherit ? 'INHERIT' : 'NOINHERIT');
        }
        if (this.options.login !== undefined) {
            opts.push(this.options.login ? 'LOGIN' : 'NOLOGIN');
        }
        if (this.options.replication !== undefined) {
            opts.push(this.options.replication ? 'REPLICATION' : 'NOREPLICATION');
        }
        if (this.options.bypassRls !== undefined) {
            opts.push(this.options.bypassRls ? 'BYPASSRLS' : 'NOBYPASSRLS');
        }
        if (this.options.connectionLimit !== undefined) {
            opts.push(`CONNECTION LIMIT ${this.options.connectionLimit}`);
        }
        if (this.options.password !== undefined) {
            if (this.options.password === null) {
                opts.push('PASSWORD NULL');
            }
            else {
                opts.push(format('PASSWORD %L', this.options.password));
            }
        }
        if (this.options.validUntil) {
            opts.push(format('VALID UNTIL %L', this.options.validUntil));
        }
        return opts;
    }
}
export class DropRoleBuilder {
    roleNames;
    ifExistsFlag = false;
    constructor(roleNames) {
        this.roleNames = Array.isArray(roleNames) ? roleNames : [roleNames];
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    toString() {
        let sql = 'DROP ROLE';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${this.roleNames.map(r => format.ident(r)).join(', ')}`;
        return sql;
    }
}
export class SetRoleBuilder {
    roleName;
    resetFlag = false;
    localFlag = false;
    sessionFlag = false;
    role(name) {
        this.roleName = name;
        return this;
    }
    none() {
        this.roleName = 'NONE';
        return this;
    }
    reset() {
        this.resetFlag = true;
        return this;
    }
    local() {
        this.localFlag = true;
        return this;
    }
    session() {
        this.sessionFlag = true;
        return this;
    }
    toString() {
        if (this.resetFlag) {
            return 'RESET ROLE';
        }
        let sql = 'SET';
        if (this.localFlag) {
            sql += ' LOCAL';
        }
        else if (this.sessionFlag) {
            sql += ' SESSION';
        }
        sql += ' ROLE';
        if (this.roleName === 'NONE') {
            sql += ' NONE';
        }
        else if (this.roleName) {
            sql += ` ${format.ident(this.roleName)}`;
        }
        return sql;
    }
}
export class ReassignOwnedBuilder {
    oldRoles = [];
    newRole;
    by(...roles) {
        this.oldRoles = roles;
        return this;
    }
    to(role) {
        this.newRole = role;
        return this;
    }
    toString() {
        if (this.oldRoles.length === 0) {
            throw new RelqBuilderError('No old roles specified', { builder: 'ReassignOwnedBuilder', missing: 'oldRoles', hint: 'Use .by()' });
        }
        if (!this.newRole) {
            throw new RelqBuilderError('No new role specified', { builder: 'ReassignOwnedBuilder', missing: 'newRole', hint: 'Use .to()' });
        }
        const oldRolesStr = this.oldRoles.map(r => format.ident(r)).join(', ');
        return `REASSIGN OWNED BY ${oldRolesStr} TO ${format.ident(this.newRole)}`;
    }
}
export class DropOwnedBuilder {
    roles = [];
    cascadeFlag = false;
    restrictFlag = false;
    by(...roles) {
        this.roles = roles;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        this.restrictFlag = false;
        return this;
    }
    restrict() {
        this.restrictFlag = true;
        this.cascadeFlag = false;
        return this;
    }
    toString() {
        if (this.roles.length === 0) {
            throw new RelqBuilderError('No roles specified', { builder: 'DropOwnedBuilder', missing: 'roles', hint: 'Use .by()' });
        }
        const rolesStr = this.roles.map(r => format.ident(r)).join(', ');
        let sql = `DROP OWNED BY ${rolesStr}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        else if (this.restrictFlag) {
            sql += ' RESTRICT';
        }
        return sql;
    }
}
export class DefaultPrivilegesBuilder {
    forRoles = [];
    inSchemas = [];
    isGrant = true;
    privileges = [];
    targetType;
    grantees = [];
    withGrantOption = false;
    cascadeFlag = false;
    forRole(...roles) {
        this.forRoles = roles;
        return this;
    }
    inSchema(...schemas) {
        this.inSchemas = schemas;
        return this;
    }
    grant(...privileges) {
        this.isGrant = true;
        this.privileges = privileges;
        return this;
    }
    revoke(...privileges) {
        this.isGrant = false;
        this.privileges = privileges;
        return this;
    }
    onTables() {
        this.targetType = 'TABLES';
        return this;
    }
    onSequences() {
        this.targetType = 'SEQUENCES';
        return this;
    }
    onFunctions() {
        this.targetType = 'FUNCTIONS';
        return this;
    }
    onRoutines() {
        this.targetType = 'ROUTINES';
        return this;
    }
    onTypes() {
        this.targetType = 'TYPES';
        return this;
    }
    onSchemas() {
        this.targetType = 'SCHEMAS';
        return this;
    }
    to(...grantees) {
        this.grantees = grantees;
        return this;
    }
    from(...grantees) {
        this.grantees = grantees;
        return this;
    }
    withGrant() {
        this.withGrantOption = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        return this;
    }
    toString() {
        let sql = 'ALTER DEFAULT PRIVILEGES';
        if (this.forRoles.length > 0) {
            const roles = this.forRoles.map(r => format.ident(r)).join(', ');
            sql += ` FOR ROLE ${roles}`;
        }
        if (this.inSchemas.length > 0) {
            const schemas = this.inSchemas.map(s => format.ident(s)).join(', ');
            sql += ` IN SCHEMA ${schemas}`;
        }
        if (this.isGrant) {
            sql += ` GRANT ${this.privileges.join(', ')} ON ${this.targetType}`;
            sql += ` TO ${this.formatGrantees()}`;
            if (this.withGrantOption) {
                sql += ' WITH GRANT OPTION';
            }
        }
        else {
            sql += ` REVOKE ${this.privileges.join(', ')} ON ${this.targetType}`;
            sql += ` FROM ${this.formatGrantees()}`;
            if (this.cascadeFlag) {
                sql += ' CASCADE';
            }
        }
        return sql;
    }
    formatGrantees() {
        return this.grantees.map(g => {
            const upper = g.toUpperCase();
            if (upper === 'PUBLIC' || upper === 'CURRENT_USER' || upper === 'SESSION_USER' || upper === 'CURRENT_ROLE') {
                return upper;
            }
            return format.ident(g);
        }).join(', ');
    }
}
