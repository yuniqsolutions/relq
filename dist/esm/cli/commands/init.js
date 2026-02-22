import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { defineCommand } from 'citty';
import { loadEnvConfig } from "../utils/env-loader.js";
import { initRepository, ensureRemoteTable, isInitialized } from "../utils/repo-manager.js";
import { createDefaultRelqignore } from "../utils/relqignore.js";
import { colors } from "../utils/colors.js";
import { fatal, warning, formatError } from "../utils/ui.js";
import { detectDialectFromUrl } from "../utils/dialect-router.js";
import { getAdapter } from "../adapters/registry.js";
function detectSchemaPath() {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, 'src'))) {
        return './src/db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'app'))) {
        return './app/db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'db'))) {
        return './db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'lib'))) {
        return './lib/db/schema.ts';
    }
    return './src/db/schema.ts';
}
function checkEnvVars() {
    const vars = {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_REGION: process.env.DATABASE_REGION,
        AWS_REGION: process.env.AWS_REGION,
        RELQ_PG_CONN_URL: process.env.RELQ_PG_CONN_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        AWS_DATABASE_HOST: process.env.AWS_DATABASE_HOST,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_DATABASE_USER: process.env.AWS_DATABASE_USER,
        AWS_DATABASE_NAME: process.env.AWS_DATABASE_NAME,
        AWS_DATABASE_PORT: process.env.AWS_DATABASE_PORT,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
        MYSQL_USER: process.env.MYSQL_USER,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
        MYSQL_URL: process.env.MYSQL_URL,
        PLANETSCALE_URL: process.env.PLANETSCALE_URL,
        XATA_DATABASE_URL: process.env.XATA_DATABASE_URL,
        XATA_API_KEY: process.env.XATA_API_KEY,
    };
    const connUrl = vars.RELQ_PG_CONN_URL || vars.DATABASE_URL;
    const hasConnUrl = !!connUrl;
    let detectedDialect;
    if (connUrl) {
        detectedDialect = detectDialectFromUrl(connUrl);
    }
    const hasIndividual = !!(vars.DATABASE_HOST && vars.DATABASE_NAME && vars.DATABASE_USER && vars.DATABASE_PASSWORD);
    const hasAws = !!(vars.AWS_ACCESS_KEY_ID && vars.AWS_SECRET_ACCESS_KEY && (vars.DATABASE_REGION || vars.AWS_REGION) && vars.AWS_DATABASE_NAME && vars.AWS_DATABASE_HOST);
    const hasTurso = !!(vars.TURSO_DATABASE_URL && vars.TURSO_AUTH_TOKEN);
    const hasMysql = !!(vars.MYSQL_URL || vars.PLANETSCALE_URL || (vars.MYSQL_HOST && vars.MYSQL_DATABASE && vars.MYSQL_USER));
    const hasXata = !!(vars.XATA_DATABASE_URL || vars.XATA_API_KEY);
    if (!detectedDialect) {
        if (hasAws)
            detectedDialect = 'dsql';
        else if (hasTurso)
            detectedDialect = 'turso';
        else if (vars.PLANETSCALE_URL)
            detectedDialect = 'planetscale';
        else if (hasMysql)
            detectedDialect = 'mysql';
        else if (hasXata)
            detectedDialect = 'xata';
        else if (hasIndividual || hasConnUrl)
            detectedDialect = 'postgres';
    }
    return {
        found: hasConnUrl || hasIndividual || hasAws || hasTurso || hasMysql || hasXata,
        hasConnUrl,
        hasIndividual,
        hasAws,
        hasTurso,
        hasMysql,
        hasXata,
        detectedDialect,
        vars,
    };
}
async function askDialect(detectedDialect) {
    const options = [
        { value: 'postgres', label: 'PostgreSQL', hint: detectedDialect === 'postgres' ? 'detected' : undefined },
        { value: 'cockroachdb', label: 'CockroachDB', hint: detectedDialect === 'cockroachdb' ? 'detected' : undefined },
        { value: 'nile', label: 'Nile', hint: detectedDialect === 'nile' ? 'detected' : undefined },
        { value: 'dsql', label: 'AWS DSQL', hint: detectedDialect === 'dsql' ? 'detected' : undefined },
        { value: 'mysql', label: 'MySQL', hint: detectedDialect === 'mysql' ? 'detected' : undefined },
        { value: 'mariadb', label: 'MariaDB', hint: detectedDialect === 'mariadb' ? 'detected' : undefined },
        { value: 'planetscale', label: 'PlanetScale', hint: detectedDialect === 'planetscale' ? 'detected' : undefined },
        { value: 'sqlite', label: 'SQLite', hint: detectedDialect === 'sqlite' ? 'detected' : undefined },
        { value: 'turso', label: 'Turso', hint: detectedDialect === 'turso' ? 'detected' : undefined },
        { value: 'xata', label: 'Xata', hint: detectedDialect === 'xata' ? 'detected' : undefined },
    ];
    const result = await p.select({
        message: 'Select database dialect:',
        options,
        initialValue: detectedDialect || 'postgres',
    });
    if (p.isCancel(result))
        fatal('Operation cancelled');
    return result;
}
async function askConnectionType(options) {
    const selectOptions = [];
    if (options.hasConnUrl) {
        selectOptions.push({ value: 'url', label: 'Connection URL (DATABASE_URL)' });
    }
    if (options.hasIndividual) {
        selectOptions.push({ value: 'individual', label: 'PostgreSQL Config (DATABASE_HOST, DATABASE_NAME, ...)' });
    }
    if (options.hasAws) {
        selectOptions.push({ value: 'aws', label: 'AWS DSQL (AWS_ACCESS_KEY_ID, DATABASE_REGION/AWS_REGION, ...)' });
    }
    if (options.hasTurso) {
        selectOptions.push({ value: 'turso', label: 'Turso/libSQL (TURSO_DATABASE_URL)' });
    }
    if (options.hasMysql) {
        selectOptions.push({ value: 'mysql', label: 'MySQL/PlanetScale (MYSQL_URL or PLANETSCALE_URL)' });
    }
    if (options.hasXata) {
        selectOptions.push({ value: 'xata', label: 'Xata (XATA_DATABASE_URL)' });
    }
    if (selectOptions.length === 1) {
        return selectOptions[0].value;
    }
    const result = await p.select({
        message: 'Multiple connection options found. Which connection type?',
        options: selectOptions,
        initialValue: selectOptions[0].value,
    });
    if (p.isCancel(result))
        fatal('Operation cancelled');
    return result;
}
function generateConfig(options) {
    let connectionBlock;
    const region = options.awsUseDefaultCredentials ? "AWS_REGION" : "DATABASE_REGION";
    if (options.useEnv) {
        switch (options.connectionType) {
            case 'url':
                connectionBlock = `    connection: {
        url: process.env.DATABASE_URL,
    },`;
                break;
            case 'aws':
                connectionBlock = options.awsUseDefaultCredentials
                    ? `    connection: {
        database: process.env.AWS_DATABASE_NAME,
        aws: {
            hostname: process.env.AWS_DATABASE_HOST!,
            region: process.env.${region}!,
            useDefaultCredentials: true,
        },
    },`
                    : `    connection: {
        database: process.env.AWS_DATABASE_NAME,
        aws: {
            hostname: process.env.AWS_DATABASE_HOST!,
            region: process.env.${region}!,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    },`;
                break;
            case 'turso':
                connectionBlock = `    connection: {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },`;
                break;
            case 'mysql':
                connectionBlock = `    connection: {
        url: process.env.MYSQL_URL || process.env.PLANETSCALE_URL,
    },`;
                break;
            case 'xata':
                connectionBlock = `    connection: {
        databaseUrl: process.env.XATA_DATABASE_URL,
        apiKey: process.env.XATA_API_KEY!,
    },`;
                break;
            default:
                connectionBlock = `    connection: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
    },`;
                break;
        }
    }
    else {
        switch (options.dialect) {
            case 'sqlite':
                connectionBlock = `    connection: {
        filename: '${options.database || './db.sqlite'}',
    },`;
                break;
            case 'turso':
                connectionBlock = `    connection: {
        url: '${options.host}',
        authToken: '${options.password}',
    },`;
                break;
            case 'xata':
                connectionBlock = `    connection: {
        databaseUrl: '${options.host}',
        apiKey: '${options.password}',
    },`;
                break;
            default:
                connectionBlock = `    connection: {
        host: '${options.host}',
        port: ${options.port},
        database: '${options.database}',
        user: '${options.user}',
        password: '${options.password}',
    },`;
                break;
        }
    }
    const features = [];
    if (options.includeFunctions)
        features.push('    includeFunctions: true,');
    if (options.includeTriggers)
        features.push('    includeTriggers: true,');
    if (options.includeViews)
        features.push('    includeViews: true,');
    const featuresBlock = features.length > 0 ? '\n' + features.join('\n') : '';
    const migrationsBlock = `\n\n    migrations: {\n        directory: '${options.migrationsDir}',\n    },`;
    return `import { defineConfig } from 'relq/config';

export default defineConfig({
    dialect: '${options.dialect}',

${connectionBlock}

    schema: '${options.schemaPath}',${migrationsBlock}${featuresBlock}
});
`;
}
export default defineCommand({
    meta: { name: 'init', description: 'Initialize relq in a project' },
    args: {
        dialect: { type: 'string', description: 'Set dialect' },
        force: { type: 'boolean', description: 'Overwrite existing config' },
        yes: { type: 'boolean', alias: 'y', description: 'Accept defaults' },
    },
    async run({ args }) {
        const cwd = process.cwd();
        const spin = p.spinner();
        p.intro(colors.cyan('relq init'));
        const { findConfigFileRecursive } = await import("../utils/config-loader.js");
        const { findProjectRoot } = await import("../utils/project-root.js");
        const existingConfig = findConfigFileRecursive(cwd);
        let projectRoot = cwd;
        let existingConfigValues = null;
        if (existingConfig) {
            projectRoot = existingConfig.directory;
            try {
                const { loadConfig } = await import("../../config/config.js");
                existingConfigValues = await loadConfig(existingConfig.path);
            }
            catch {
            }
            if (existingConfig.directory !== cwd) {
                p.log.info(`Found relq.config.ts in: ${colors.cyan(existingConfig.directory)}`);
                p.log.info('Initializing at project root...');
            }
        }
        else {
            const packageRoot = findProjectRoot(cwd);
            if (packageRoot && packageRoot !== cwd) {
                projectRoot = packageRoot;
                p.log.info(`Found package.json in: ${colors.cyan(packageRoot)}`);
                p.log.info('Initializing at project root...');
            }
        }
        if (existingConfig && existingConfig.directory === projectRoot) {
            const relqFolderExists = isInitialized(projectRoot);
            if (relqFolderExists) {
                p.log.success(colors.green('Relq is already initialized.'));
                p.log.info(`  ${colors.dim('-')} relq.config.ts`);
                p.log.info(`  ${colors.dim('-')} .relq/ folder`);
                p.log.info(`Use ${colors.cyan('relq status')} to see current state`);
                p.log.info(`Use ${colors.cyan('relq pull')} to sync with database`);
                p.outro('');
                return;
            }
            else {
                warning('Found relq.config.ts but .relq/ folder is missing');
                p.log.info('This could mean the setup was incomplete');
                const upgrade = await p.confirm({
                    message: 'Complete setup using existing config?',
                    initialValue: true,
                });
                if (p.isCancel(upgrade) || !upgrade) {
                    p.outro(colors.dim('Cancelled.'));
                    return;
                }
                const missingFields = [];
                if (!existingConfigValues?.schema) {
                    missingFields.push('schema');
                }
                if (!existingConfigValues?.connection?.host &&
                    !existingConfigValues?.connection?.url &&
                    !existingConfigValues?.connection?.filename) {
                    const hasEnvConnection = process.env.DATABASE_HOST ||
                        process.env.DATABASE_URL ||
                        process.env.TURSO_DATABASE_URL;
                    if (!hasEnvConnection) {
                        missingFields.push('connection');
                    }
                }
                if (missingFields.length > 0) {
                    warning('Your config is missing required fields:');
                    for (const field of missingFields) {
                        p.log.info(`  ${colors.dim('-')} ${field}`);
                    }
                    p.log.info(colors.dim("Let's fill in the missing fields:"));
                    let schemaValue = existingConfigValues?.schema;
                    if (missingFields.includes('schema')) {
                        const schemaResult = await p.text({
                            message: 'Schema file path',
                            placeholder: detectSchemaPath(),
                            initialValue: detectSchemaPath(),
                        });
                        if (p.isCancel(schemaResult))
                            fatal('Operation cancelled');
                        schemaValue = schemaResult;
                    }
                    if (missingFields.includes('connection')) {
                        p.log.warn('Connection not configured.');
                        p.log.info('  Set DATABASE_* environment variables in .env');
                        p.log.info('  or update relq.config.ts with connection details.');
                        p.outro('');
                        return;
                    }
                    if (schemaValue && missingFields.includes('schema')) {
                        spin.start('Updating relq.config.ts...');
                        const configContent = fs.readFileSync(existingConfig.path, 'utf-8');
                        let updatedContent = configContent;
                        if (updatedContent.includes('connection:')) {
                            updatedContent = updatedContent.replace(/(connection:\s*\{[^}]+\},?)/, `$1\n\n    schema: '${schemaValue}',`);
                        }
                        fs.writeFileSync(existingConfig.path, updatedContent, 'utf-8');
                        spin.stop('Updated relq.config.ts');
                        existingConfigValues = { ...existingConfigValues, schema: schemaValue };
                    }
                }
                p.log.step('Completing setup...');
                initRepository(projectRoot);
                p.log.info('  Created .relq/ folder');
                createDefaultRelqignore(projectRoot);
                p.log.info('  Created .relqignore');
                const gitignorePath = path.join(projectRoot, '.gitignore');
                if (fs.existsSync(gitignorePath)) {
                    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
                    if (!gitignore.includes('.relq')) {
                        fs.appendFileSync(gitignorePath, '\n# Relq local state\n.relq/\n');
                        p.log.info('  Added .relq/ to .gitignore');
                    }
                }
                if (existingConfigValues?.connection) {
                    spin.start('Testing database connection...');
                    try {
                        await ensureRemoteTable(existingConfigValues.connection);
                        spin.stop('Database connection verified');
                    }
                    catch {
                        spin.stop('Could not connect to database (check connection)');
                    }
                }
                p.log.success('Setup complete!');
                p.outro('Run "relq pull" to sync with database.');
                return;
            }
        }
        try {
            p.log.step('Checking for database connection...');
            const envCheck = checkEnvVars();
            let useEnv = false;
            let connectionType = 'individual';
            let dialect = envCheck.detectedDialect || 'postgres';
            let awsUseDefaultCredentials = false;
            let host = 'localhost';
            let port = '5432';
            let database = '';
            let user = 'postgres';
            let password = '';
            if (envCheck.found) {
                p.log.info('Found database connection options:');
                if (envCheck.hasConnUrl) {
                    const url = envCheck.vars.RELQ_PG_CONN_URL || envCheck.vars.DATABASE_URL;
                    p.log.info(`  ${colors.cyan('Connection URL')}`);
                    p.log.info(`    DATABASE_URL: ${url?.substring(0, 40)}...`);
                    if (envCheck.detectedDialect) {
                        p.log.info(`    ${colors.green('Detected dialect:')} ${envCheck.detectedDialect}`);
                    }
                }
                if (envCheck.hasIndividual) {
                    p.log.info(`  ${colors.cyan('PostgreSQL Config')}`);
                    if (envCheck.vars.DATABASE_HOST)
                        p.log.info(`    DATABASE_HOST: ${envCheck.vars.DATABASE_HOST}`);
                    if (envCheck.vars.DATABASE_NAME)
                        p.log.info(`    DATABASE_NAME: ${envCheck.vars.DATABASE_NAME}`);
                    if (envCheck.vars.DATABASE_USER)
                        p.log.info(`    DATABASE_USER: ${envCheck.vars.DATABASE_USER}`);
                    if (envCheck.vars.DATABASE_PASSWORD)
                        p.log.info('    DATABASE_PASSWORD: ***');
                }
                if (envCheck.hasAws) {
                    p.log.info(`  ${colors.cyan('AWS DSQL')}`);
                    if (envCheck.vars.AWS_DATABASE_HOST)
                        p.log.info(`    AWS_DATABASE_HOST: ${envCheck.vars.AWS_DATABASE_HOST}`);
                    if (envCheck.vars.DATABASE_REGION)
                        p.log.info(`    DATABASE_REGION: ${envCheck.vars.DATABASE_REGION}`);
                    if (envCheck.vars.AWS_REGION && !envCheck.vars.DATABASE_REGION)
                        p.log.info(`    AWS_REGION: ${envCheck.vars.AWS_REGION}`);
                    if (envCheck.vars.AWS_DATABASE_NAME)
                        p.log.info(`    AWS_DATABASE_NAME: ${envCheck.vars.AWS_DATABASE_NAME}`);
                    if (envCheck.vars.AWS_ACCESS_KEY_ID)
                        p.log.info(`    AWS_ACCESS_KEY_ID: ${envCheck.vars.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
                    p.log.info('    AWS_SECRET_ACCESS_KEY: ***');
                }
                if (envCheck.hasTurso) {
                    p.log.info(`  ${colors.cyan('Turso/libSQL')}`);
                    if (envCheck.vars.TURSO_DATABASE_URL)
                        p.log.info(`    TURSO_DATABASE_URL: ${envCheck.vars.TURSO_DATABASE_URL?.substring(0, 40)}...`);
                    p.log.info('    TURSO_AUTH_TOKEN: ***');
                }
                if (envCheck.hasMysql) {
                    p.log.info(`  ${colors.cyan('MySQL/PlanetScale')}`);
                    if (envCheck.vars.MYSQL_URL)
                        p.log.info(`    MYSQL_URL: ${envCheck.vars.MYSQL_URL?.substring(0, 40)}...`);
                    if (envCheck.vars.PLANETSCALE_URL)
                        p.log.info(`    PLANETSCALE_URL: ${envCheck.vars.PLANETSCALE_URL?.substring(0, 40)}...`);
                    if (envCheck.vars.MYSQL_HOST)
                        p.log.info(`    MYSQL_HOST: ${envCheck.vars.MYSQL_HOST}`);
                }
                if (envCheck.hasXata) {
                    p.log.info(`  ${colors.cyan('Xata')}`);
                    if (envCheck.vars.XATA_DATABASE_URL)
                        p.log.info(`    XATA_DATABASE_URL: ${envCheck.vars.XATA_DATABASE_URL?.substring(0, 40)}...`);
                    p.log.info('    XATA_API_KEY: ***');
                }
                const optionCount = [envCheck.hasConnUrl, envCheck.hasIndividual, envCheck.hasAws, envCheck.hasTurso, envCheck.hasMysql, envCheck.hasXata].filter(Boolean).length;
                if (optionCount > 1) {
                    connectionType = await askConnectionType(envCheck);
                    if (connectionType === 'aws')
                        dialect = 'dsql';
                    else if (connectionType === 'turso')
                        dialect = 'turso';
                    else if (connectionType === 'mysql')
                        dialect = envCheck.vars.PLANETSCALE_URL ? 'planetscale' : 'mysql';
                    else if (connectionType === 'xata')
                        dialect = 'xata';
                    else if (envCheck.detectedDialect)
                        dialect = envCheck.detectedDialect;
                    const useEnvResult = await p.confirm({
                        message: `Use ${connectionType} configuration from environment?`,
                        initialValue: true,
                    });
                    if (p.isCancel(useEnvResult))
                        fatal('Operation cancelled');
                    useEnv = useEnvResult;
                }
                else {
                    if (envCheck.hasAws) {
                        connectionType = 'aws';
                        dialect = 'dsql';
                    }
                    else if (envCheck.hasTurso) {
                        connectionType = 'turso';
                        dialect = 'turso';
                    }
                    else if (envCheck.hasMysql) {
                        connectionType = 'mysql';
                        dialect = envCheck.vars.PLANETSCALE_URL ? 'planetscale' : 'mysql';
                    }
                    else if (envCheck.hasXata) {
                        connectionType = 'xata';
                        dialect = 'xata';
                    }
                    else if (envCheck.hasConnUrl) {
                        connectionType = 'url';
                    }
                    else {
                        connectionType = 'individual';
                    }
                    const useEnvResult = await p.confirm({
                        message: 'Use these environment variables?',
                        initialValue: true,
                    });
                    if (p.isCancel(useEnvResult))
                        fatal('Operation cancelled');
                    useEnv = useEnvResult;
                }
            }
            if (useEnv) {
                dialect = await askDialect(dialect);
                if (connectionType === 'aws') {
                    const awsResult = await p.confirm({
                        message: 'Use AWS SDK default credential chain (env vars, IAM role, ~/.aws/credentials)?',
                        initialValue: true,
                    });
                    if (p.isCancel(awsResult))
                        fatal('Operation cancelled');
                    awsUseDefaultCredentials = awsResult;
                }
            }
            else {
                dialect = await askDialect(envCheck.detectedDialect);
                p.log.step('Database Connection');
                if (dialect === 'sqlite') {
                    const dbResult = await p.text({
                        message: 'Database file path',
                        placeholder: './db.sqlite',
                        initialValue: './db.sqlite',
                    });
                    if (p.isCancel(dbResult))
                        fatal('Operation cancelled');
                    database = dbResult;
                }
                else if (dialect === 'turso') {
                    const urlResult = await p.text({
                        message: 'Turso URL (libsql://...)',
                        placeholder: 'libsql://...',
                    });
                    if (p.isCancel(urlResult))
                        fatal('Operation cancelled');
                    host = urlResult;
                    const tokenResult = await p.text({
                        message: 'Auth Token',
                        placeholder: '',
                    });
                    if (p.isCancel(tokenResult))
                        fatal('Operation cancelled');
                    password = tokenResult;
                }
                else if (dialect === 'xata') {
                    const urlResult = await p.text({
                        message: 'Xata Database URL',
                        placeholder: '',
                    });
                    if (p.isCancel(urlResult))
                        fatal('Operation cancelled');
                    host = urlResult;
                    const keyResult = await p.text({
                        message: 'API Key',
                        placeholder: '',
                    });
                    if (p.isCancel(keyResult))
                        fatal('Operation cancelled');
                    password = keyResult;
                }
                else {
                    const hostResult = await p.text({
                        message: 'Host',
                        placeholder: 'localhost',
                        initialValue: 'localhost',
                    });
                    if (p.isCancel(hostResult))
                        fatal('Operation cancelled');
                    host = hostResult;
                    const connAdapter = await getAdapter(dialect);
                    const defaultPort = String(connAdapter.defaultPort);
                    const portResult = await p.text({
                        message: 'Port',
                        placeholder: defaultPort,
                        initialValue: defaultPort,
                    });
                    if (p.isCancel(portResult))
                        fatal('Operation cancelled');
                    port = portResult;
                    const dbResult = await p.text({
                        message: 'Database',
                        placeholder: '',
                    });
                    if (p.isCancel(dbResult))
                        fatal('Operation cancelled');
                    database = dbResult;
                    const defaultUser = connAdapter.defaultUser;
                    const userResult = await p.text({
                        message: 'User',
                        placeholder: defaultUser,
                        initialValue: defaultUser,
                    });
                    if (p.isCancel(userResult))
                        fatal('Operation cancelled');
                    user = userResult;
                    const passResult = await p.text({
                        message: 'Password',
                        placeholder: '',
                    });
                    if (p.isCancel(passResult))
                        fatal('Operation cancelled');
                    password = passResult;
                }
            }
            const detectedPath = detectSchemaPath();
            const schemaResult = await p.text({
                message: 'Schema file path',
                placeholder: detectedPath,
                initialValue: detectedPath,
            });
            if (p.isCancel(schemaResult))
                fatal('Operation cancelled');
            const schemaPath = schemaResult;
            const migrationsResult = await p.text({
                message: 'Migrations directory',
                placeholder: './relq',
                initialValue: './relq',
            });
            if (p.isCancel(migrationsResult))
                fatal('Operation cancelled');
            const migrationsDir = migrationsResult;
            const adapter = await getAdapter(dialect);
            const supportsFunctions = adapter.features.supportsStoredProcedures;
            const supportsTriggers = adapter.features.supportsTriggers;
            const supportsViews = adapter.features.supportsMaterializedViews;
            let includeFunctions = false;
            let includeTriggers = false;
            let includeViews = false;
            if (supportsFunctions || supportsTriggers || supportsViews) {
                p.log.step('Optional features to track:');
                if (supportsFunctions) {
                    const funcResult = await p.confirm({
                        message: 'Include functions/procedures?',
                        initialValue: false,
                    });
                    if (p.isCancel(funcResult))
                        fatal('Operation cancelled');
                    includeFunctions = funcResult;
                }
                if (supportsTriggers) {
                    const trigResult = await p.confirm({
                        message: 'Include triggers?',
                        initialValue: false,
                    });
                    if (p.isCancel(trigResult))
                        fatal('Operation cancelled');
                    includeTriggers = trigResult;
                }
                if (supportsViews) {
                    const viewResult = await p.confirm({
                        message: 'Include views?',
                        initialValue: false,
                    });
                    if (p.isCancel(viewResult))
                        fatal('Operation cancelled');
                    includeViews = viewResult;
                }
            }
            p.log.step('Creating files...');
            const configPath = path.join(cwd, 'relq.config.ts');
            if (!fs.existsSync(configPath)) {
                const configContent = generateConfig({
                    dialect,
                    useEnv,
                    connectionType,
                    awsUseDefaultCredentials,
                    host,
                    port,
                    database,
                    user,
                    password,
                    schemaPath,
                    migrationsDir,
                    includeFunctions,
                    includeTriggers,
                    includeViews,
                });
                fs.writeFileSync(configPath, configContent, 'utf-8');
                p.log.info('  Created relq.config.ts');
            }
            else {
                p.log.info('  relq.config.ts already exists');
            }
            initRepository(cwd);
            p.log.info('  Created .relq/ folder');
            createDefaultRelqignore(cwd);
            p.log.info('  Created .relqignore');
            const schemaDir = path.dirname(schemaPath);
            if (!fs.existsSync(schemaDir)) {
                fs.mkdirSync(schemaDir, { recursive: true });
                p.log.info(`  Created ${schemaDir}/`);
            }
            const gitignorePath = path.join(cwd, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
                if (!gitignore.includes('.relq')) {
                    fs.appendFileSync(gitignorePath, '\n# Relq local state\n.relq/\n');
                    p.log.info('  Added .relq/ to .gitignore');
                }
            }
            spin.start('Testing database connection...');
            try {
                const envConfig = loadEnvConfig();
                const connection = useEnv && envConfig ? envConfig : {
                    host,
                    port: parseInt(port),
                    database,
                    user,
                    password,
                };
                await ensureRemoteTable(connection);
                spin.stop('Database connection verified');
            }
            catch {
                spin.stop('Could not connect to database');
                p.log.info("Run 'relq pull' after fixing connection");
            }
            p.log.success('Relq initialized successfully!');
            p.note([
                "1. Review 'relq.config.ts'",
                "2. Run 'relq pull' to sync with database",
                "3. Run 'relq status' to see current state",
            ].join('\n'), 'Next steps');
            p.outro('');
        }
        catch (error) {
            fatal('Initialization failed', formatError(error));
        }
    },
});
