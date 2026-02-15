export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
export function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function formatSize(bytes) {
    if (bytes > 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes > 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
}
