import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { FileInfo } from '../types/index.js';

export class FileDiscoveryService {
  private claudeDataDir: string;

  constructor(claudeDataDir?: string) {
    this.claudeDataDir = claudeDataDir || join(homedir(), '.claude', 'projects');
  }

  async findClaudeCodeFiles(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      if (!(await this.directoryExists(this.claudeDataDir))) {
        console.warn(`Claude data directory not found: ${this.claudeDataDir}`);
        return files;
      }

      const projectDirs = await this.getDirectories(this.claudeDataDir);

      for (const projectDir of projectDirs) {
        const projectPath = join(this.claudeDataDir, projectDir);
        const jsonlFiles = await this.findJSONLFiles(projectPath);
        files.push(...jsonlFiles);
      }

      return files.sort((a, b) => b.modified_time.getTime() - a.modified_time.getTime());
    } catch (error) {
      console.error('Error discovering Claude Code files:', error);
      return files;
    }
  }

  async findNewAndUpdatedFiles(lastSyncTimestamp: Date | null): Promise<{
    newFiles: FileInfo[];
    updatedFiles: FileInfo[];
    allFiles: FileInfo[];
  }> {
    const allFiles = await this.findClaudeCodeFiles();

    if (!lastSyncTimestamp) {
      return {
        newFiles: allFiles,
        updatedFiles: [],
        allFiles,
      };
    }

    const newFiles = allFiles.filter((file) => file.modified_time > lastSyncTimestamp);

    const updatedFiles = allFiles.filter((file) => {
      const isModifiedAfterSync = file.modified_time > lastSyncTimestamp;
      const isNotNew = file.modified_time <= lastSyncTimestamp;
      return isModifiedAfterSync && isNotNew;
    });

    newFiles.forEach((file) => (file.is_new = true));
    updatedFiles.forEach((file) => (file.is_updated = true));

    return {
      newFiles,
      updatedFiles,
      allFiles,
    };
  }

  async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile() || !filePath.endsWith('.jsonl')) {
        return null;
      }

      return {
        path: filePath,
        modified_time: stats.mtime,
        size: stats.size,
        is_new: false,
        is_updated: false,
      };
    } catch (_error) {
      return null;
    }
  }

  async verifyFileAccess(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async getDirectories(path: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(path, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  private async findJSONLFiles(directoryPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(directoryPath, entry.name);

        if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          const fileInfo = await this.getFileInfo(fullPath);
          if (fileInfo) {
            files.push(fileInfo);
          }
        } else if (entry.isDirectory()) {
          const subFiles = await this.findJSONLFiles(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${directoryPath}:`, error);
    }

    return files;
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
    directories: string[];
  }> {
    const files = await this.findClaudeCodeFiles();

    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null,
        directories: [],
      };
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const modifiedTimes = files.map((file) => file.modified_time.getTime());
    const oldestFile = new Date(Math.min(...modifiedTimes));
    const newestFile = new Date(Math.max(...modifiedTimes));

    const directories = [
      ...new Set(
        files.map((file) => {
          const relativePath = file.path.replace(this.claudeDataDir, '');
          const parts = relativePath.split('/').filter(Boolean);
          return parts[0] || '';
        }),
      ),
    ].filter(Boolean);

    return {
      totalFiles: files.length,
      totalSize,
      oldestFile,
      newestFile,
      directories,
    };
  }
}
