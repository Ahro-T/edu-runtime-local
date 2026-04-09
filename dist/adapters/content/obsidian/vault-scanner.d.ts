export interface ScannedFile {
    filePath: string;
    raw: string;
}
export declare function scanNodeFiles(vaultPath: string): Promise<ScannedFile[]>;
export declare function scanTemplateFiles(vaultPath: string): Promise<ScannedFile[]>;
//# sourceMappingURL=vault-scanner.d.ts.map