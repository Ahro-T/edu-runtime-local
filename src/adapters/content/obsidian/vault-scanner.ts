import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

export interface ScannedFile {
  filePath: string;
  raw: string;
}

const NODE_DIRS = ['concepts/agents', 'concepts/harnesses', 'concepts/openclaw'] as const;
const TEMPLATE_DIR = 'templates';

export async function scanNodeFiles(vaultPath: string): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];
  for (const dir of NODE_DIRS) {
    const dirPath = join(vaultPath, dir);
    let entries: string[];
    try {
      entries = await readdir(dirPath);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (extname(entry) !== '.md') continue;
      const filePath = join(dirPath, entry);
      const raw = await readFile(filePath, 'utf-8');
      results.push({ filePath, raw });
    }
  }
  return results;
}

export async function scanTemplateFiles(vaultPath: string): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];
  const dirPath = join(vaultPath, TEMPLATE_DIR);
  let entries: string[];
  try {
    entries = await readdir(dirPath);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (extname(entry) !== '.md') continue;
    const filePath = join(dirPath, entry);
    const raw = await readFile(filePath, 'utf-8');
    results.push({ filePath, raw });
  }
  return results;
}
