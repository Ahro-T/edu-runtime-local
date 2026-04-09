import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const NODE_DIRS = ['agents', 'harnesses', 'openclaw'];
const TEMPLATE_DIR = 'templates';
export async function scanNodeFiles(vaultPath) {
    const results = [];
    for (const dir of NODE_DIRS) {
        const dirPath = join(vaultPath, dir);
        let entries;
        try {
            entries = await readdir(dirPath);
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (extname(entry) !== '.md')
                continue;
            const filePath = join(dirPath, entry);
            const raw = await readFile(filePath, 'utf-8');
            results.push({ filePath, raw });
        }
    }
    return results;
}
export async function scanTemplateFiles(vaultPath) {
    const results = [];
    const dirPath = join(vaultPath, TEMPLATE_DIR);
    let entries;
    try {
        entries = await readdir(dirPath);
    }
    catch {
        return results;
    }
    for (const entry of entries) {
        if (extname(entry) !== '.md')
            continue;
        const filePath = join(dirPath, entry);
        const raw = await readFile(filePath, 'utf-8');
        results.push({ filePath, raw });
    }
    return results;
}
//# sourceMappingURL=vault-scanner.js.map