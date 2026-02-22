import { execSync } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
const DOMAIN = "local.relq.studio";
const CERTS_DIR = join(homedir(), ".relq", "certs");
const KEY_FILE = `${DOMAIN}-key.pem`;
const CERT_FILE = `${DOMAIN}.pem`;
export async function ensureCertificates() {
    const keyPath = join(CERTS_DIR, KEY_FILE);
    const certPath = join(CERTS_DIR, CERT_FILE);
    const status = await checkCertificates();
    if (status.exists && !status.expired) {
        return { key: keyPath, cert: certPath };
    }
    assertMkcertInstalled();
    await mkdir(CERTS_DIR, { recursive: true });
    execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" ${DOMAIN}`, { cwd: CERTS_DIR, stdio: "pipe" });
    return { key: keyPath, cert: certPath };
}
export async function checkCertificates() {
    const keyPath = join(CERTS_DIR, KEY_FILE);
    const certPath = join(CERTS_DIR, CERT_FILE);
    try {
        await access(keyPath);
        await access(certPath);
    }
    catch {
        return { exists: false, expired: false };
    }
    try {
        const certContent = await readFile(certPath, "utf-8");
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
export function getMkcertCaRoot() {
    try {
        const output = execSync("mkcert -CAROOT", { encoding: "utf-8" });
        return output.trim();
    }
    catch {
        return null;
    }
}
export function isMkcertInstalled() {
    try {
        execSync("mkcert -version", { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
export function getMkcertInstallInstructions() {
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
