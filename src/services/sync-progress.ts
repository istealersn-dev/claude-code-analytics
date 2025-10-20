import { webSocketService, type SyncProgressUpdate } from './websocket.js';

export interface SyncProgressTracker {
  totalFiles: number;
  processedFiles: number;
  sessionsProcessed: number;
  messagesProcessed: number;
  errors: number;
  startTime: Date;
  currentFile?: string;
  status: 'starting' | 'in_progress' | 'completed' | 'failed';
}

export class SyncProgressService {
  private progress: SyncProgressTracker | null = null;

  startSync(totalFiles: number, currentFile?: string) {
    this.progress = {
      totalFiles,
      processedFiles: 0,
      sessionsProcessed: 0,
      messagesProcessed: 0,
      errors: 0,
      startTime: new Date(),
      currentFile,
      status: 'starting',
    };

    this.broadcastProgress();
  }

  updateProgress(
    processedFiles: number,
    sessionsProcessed: number,
    messagesProcessed: number,
    errors: number = 0,
    currentFile?: string
  ) {
    if (!this.progress) return;

    this.progress.processedFiles = processedFiles;
    this.progress.sessionsProcessed = sessionsProcessed;
    this.progress.messagesProcessed = messagesProcessed;
    this.progress.errors = errors;
    this.progress.currentFile = currentFile;
    this.progress.status = 'in_progress';

    this.broadcastProgress();
  }

  completeSync(success: boolean = true) {
    if (!this.progress) return;

    this.progress.status = success ? 'completed' : 'failed';
    this.broadcastProgress();

    // Clear progress after a delay
    setTimeout(() => {
      this.progress = null;
    }, 5000);
  }

  failSync(error: string) {
    if (!this.progress) return;

    this.progress.status = 'failed';
    this.broadcastProgress();

    // Clear progress after a delay
    setTimeout(() => {
      this.progress = null;
    }, 10000);
  }

  private broadcastProgress() {
    if (!this.progress) return;

    const progressPercentage = this.progress.totalFiles > 0 
      ? Math.round((this.progress.processedFiles / this.progress.totalFiles) * 100)
      : 0;

    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining();

    webSocketService.sendSyncProgress({
      status: this.progress.status,
      progress: progressPercentage,
      currentFile: this.progress.currentFile,
      totalFiles: this.progress.totalFiles,
      processedFiles: this.progress.processedFiles,
      sessionsProcessed: this.progress.sessionsProcessed,
      messagesProcessed: this.progress.messagesProcessed,
      errors: this.progress.errors,
      startTime: this.progress.startTime.toISOString(),
      estimatedTimeRemaining,
    });
  }

  private calculateEstimatedTimeRemaining(): number | undefined {
    if (!this.progress || this.progress.processedFiles === 0) return undefined;

    const elapsed = Date.now() - this.progress.startTime.getTime();
    const filesPerMs = this.progress.processedFiles / elapsed;
    const remainingFiles = this.progress.totalFiles - this.progress.processedFiles;
    
    return Math.round(remainingFiles / filesPerMs);
  }

  getCurrentProgress(): SyncProgressTracker | null {
    return this.progress;
  }

  isSyncRunning(): boolean {
    return this.progress !== null && this.progress.status === 'in_progress';
  }
}

// Singleton instance
export const syncProgressService = new SyncProgressService();
