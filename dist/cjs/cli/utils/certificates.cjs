"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCertificates = ensureCertificates;
exports.checkCertificates = checkCertificates;
exports.getMkcertCaRoot = getMkcertCaRoot;
exports.isMkcertInstalled = isMkcertInstalled;
exports.getMkcertInstallInstructions = getMkcertInstallInstructions;
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const DOMAIN = "local.relq.studio";
const CERTS_DIR = (0, node_path_1.join)((0, node_os_1.homedir)(), ".relq", "certs");
const KEY_FILE = `${DOMAIN}-key.pem`;
const CERT_FILE = `${DOMAIN}.pem`;
async function ensureCertificates() {
    const keyPath = (0, node_path_1.join)(CERTS_DIR, KEY_FILE);
    const certPath = (0, node_path_1.join)(CERTS_DIR, CERT_FILE);
    const status = await checkCertificates();
    if (status.exists && !status.expired) {
        return { key: keyPath, cert: certPath };
    }
    assertMkcertInstalled();
    await (0, promises_1.mkdir)(CERTS_DIR, { recursive: true });
    (0, node_child_process_1.execSync)(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" ${DOMAIN}`, { cwd: CERTS_DIR, stdio: "pipe" });
    return { key: keyPath, cert: certPath };
}
async function checkCertificates() {
    const keyPath = (0, node_path_1.join)(CERTS_DIR, KEY_FILE);
    const certPath = (0, node_path_1.join)(CERTS_DIR, CERT_FILE);
    try {
        await (0, promises_1.access)(keyPath);
        await (0, promises_1.access)(certPath);
    }
    catch {
        return { exists: false, expired: false };
    }
    try {
        const certContent = await (0, promises_1.readFile)(certPath, "utf-8");
        const expiresAt = parseCertificateExpiry(certContent);
        if (expiresAt && expiresAt.getTime() < Date.now()) {
            return { exists: true, expired: true, expiresAt };
        }
        return {
            exists: true,
            expired: false,
            paths: { key: keyPath, cert: certPath },
            expiresAt: expiresAt ?? undefined,
        };
    }
    catch {
        return { exists: true, expired: true };
    }
}
function getMkcertCaRoot() {
    try {
        const output = (0, node_child_process_1.execSync)("mkcert -CAROOT", { encoding: "utf-8" });
        return output.trim();
    }
    catch {
        return null;
    }
}
function isMkcertInstalled() {
    try {
        (0, node_child_process_1.execSync)("mkcert -version", { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
function getMkcertInstallInstructions() {
    return [
        "mkcert is required for local HTTPS.",
        "",
        "Install mkcert:",
        "  macOS:   brew install mkcert nss",
        "  Linux:   sudo apt install mkcert",
        "  Windows: choco install mkcert",
        "",
        "Then install the local CA:",
        "  mkcert -install",
    ].join("\n");
}
function assertMkcertInstalled() {
    if (!isMkcertInstalled()) {
        throw new Error(getMkcertInstallInstructions());
    }
}
function parseCertificateExpiry(pemContent) {
    try {
        const { X509Certificate } = require("node:crypto");
        const cert = new X509Certificate(pemContent);
        return new Date(cert.validTo);
    }
    catch {
        return null;
    }
}
