import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Loader2,
  RefreshCw,
  RotateCw,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataQualityDashboard } from '../components/data-quality/DataQualityDashboard';

import { getApiUrl } from '../config/environment';

interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  filesProcessed?: number;
  sessionsProcessed?: number;
  status?: string;
  progress?: {
    currentFile?: string;
    processedFiles: number;
    totalFiles: number;
    percentage: number;
  };
}

interface SyncPreview {
  newFiles: number;
  updatedFiles: number;
  estimatedSessions: number;
  files: {
    new: Array<{ path: string; size: number; modifiedTime: string }>;
    updated: Array<{ path: string; size: number; modifiedTime: string }>;
  };
}

interface SyncStats {
  totalSessions: number;
  totalMessages: number;
  oldestSession: string;
  newestSession: string;
  databaseSize: string;
}

interface SyncResult {
  success: boolean;
  data: {
    summary: {
      filesProcessed: number;
      newFiles: number;
      updatedFiles: number;
      sessionsInserted: number;
      messagesInserted: number;
      metricsInserted: number;
      duplicatesSkipped: number;
      errors: number;
    };
    timing: {
      durationMs: number;
      durationHuman: string;
    };
    errors?: {
      count: number;
      details: Array<{ sessionId: string; error: string }>;
    };
  };
}

async function fetchSyncStatus(): Promise<SyncStatus> {
  const response = await fetch(getApiUrl('/sync/status'));
  if (!response.ok) {
    throw new Error('Failed to fetch sync status');
  }
  const result = await response.json();
  return result.data;
}

async function fetchSyncPreview(): Promise<SyncPreview> {
  const response = await fetch(getApiUrl('/sync/preview'));
  if (!response.ok) {
    throw new Error('Failed to fetch sync preview');
  }
  const result = await response.json();
  return result.data;
}

async function fetchSyncStats(): Promise<SyncStats> {
  const response = await fetch(getApiUrl('/sync/stats'));
  if (!response.ok) {
    throw new Error('Failed to fetch sync stats');
  }
  const result = await response.json();
  return result.data;
}

async function runSync(): Promise<SyncResult> {
  const response = await fetch(getApiUrl('/sync/run'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incremental: true }),
  });
  if (!response.ok) {
    throw new Error('Sync failed');
  }
  return response.json();
}

export const Route = createFileRoute('/settings')({
  component: Settings,
});

function Settings() {
  const [showSyncResult, setShowSyncResult] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const queryClient = useQueryClient();

  const { data: syncStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: fetchSyncStatus,
    refetchInterval: (query) =>
      query.state.data?.status === 'in_progress' ? 1000 : 5000,
  });

  const { data: syncPreview } = useQuery({
    queryKey: ['syncPreview'],
    queryFn: fetchSyncPreview,
    enabled: !syncStatus?.isRunning, // Only fetch when not syncing
  });

  const { data: syncStats } = useQuery({
    queryKey: ['syncStats'],
    queryFn: fetchSyncStats,
  });

  const syncMutation = useMutation({
    mutationFn: runSync,
    onMutate: () => {
      setSyncProgress(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['syncPreview'] });
      queryClient.invalidateQueries({ queryKey: ['syncStats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setShowSyncResult(true);
      setTimeout(() => setShowSyncResult(false), 10000);
    },
  });

  // Update progress based on sync status
  useEffect(() => {
    if (syncStatus?.progress) {
      setSyncProgress(syncStatus.progress.percentage);
    }
  }, [syncStatus?.progress]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Configure your analytics dashboard preferences and data sync options
        </p>
      </div>

      {/* Sync Success/Result Banner */}
      {showSyncResult && syncMutation.data && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="text-green-400 font-medium">Sync Completed Successfully</h3>
              <p className="text-sm text-green-300 mt-1">
                Processed {syncMutation.data.data.summary.filesProcessed} files, added{' '}
                {syncMutation.data.data.summary.sessionsInserted} sessions in{' '}
                {syncMutation.data.data.timing.durationHuman}
              </p>
              {syncMutation.data.data.errors && syncMutation.data.data.errors.count > 0 && (
                <p className="text-sm text-yellow-300 mt-1">
                  ⚠️ {syncMutation.data.data.errors.count} files had errors
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sync Error Banner */}
      {syncMutation.isError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-400 font-medium">Sync Failed</h3>
              <p className="text-sm text-red-300 mt-1">
                {syncMutation.error?.message || 'Unknown error occurred during sync'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => syncMutation.mutate()}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium transition-colors"
                >
                  Retry Sync
                </button>
                <button
                  type="button"
                  onClick={() => syncMutation.reset()}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Success Banner with detailed results */}
      {showSyncResult &&
        syncMutation.data &&
        syncMutation.data.data.errors &&
        syncMutation.data.data.errors.count > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-yellow-400 font-medium">Sync Completed with Warnings</h3>
                <p className="text-sm text-yellow-300 mt-1">
                  {syncMutation.data.data.errors.count} files encountered errors during processing
                </p>
                <details className="mt-3">
                  <summary className="text-sm text-yellow-200 cursor-pointer hover:text-yellow-100 select-none">
                    View Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-yellow-900/20 rounded border border-yellow-600">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {syncMutation.data.data.errors.details.slice(0, 5).map((error) => (
                        <div key={error.sessionId} className="text-xs">
                          <div className="font-mono text-yellow-200">{error.sessionId}</div>
                          <div className="text-yellow-300 ml-2">{error.error}</div>
                        </div>
                      ))}
                      {syncMutation.data.data.errors.count > 5 && (
                        <div className="text-xs text-yellow-400 italic">
                          ... and {syncMutation.data.data.errors.count - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

      {/* Data Sync Settings */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Data Synchronization</h2>
          {statusLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>

        {/* Enhanced Sync Status */}
        {syncStatus && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    syncStatus.status === 'in_progress'
                      ? 'bg-yellow-400 animate-pulse'
                      : syncStatus.status === 'completed'
                        ? 'bg-green-400'
                        : syncStatus.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                  }`}
                />
                <div>
                  <p className="text-white font-medium">
                    Status:{' '}
                    {syncStatus.status === 'in_progress'
                      ? 'Syncing...'
                      : syncStatus.status === 'completed'
                        ? 'Up to date'
                        : syncStatus.status === 'failed'
                          ? 'Failed'
                          : 'Ready'}
                  </p>
                  {syncStatus.lastSync && (
                    <p className="text-sm text-gray-400">
                      Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                {syncStatus.sessionsProcessed && (
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {syncStatus.sessionsProcessed.toLocaleString()} sessions
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {syncStatus.status === 'in_progress' && syncStatus.progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    {syncStatus.progress.processedFiles} of {syncStatus.progress.totalFiles} files
                  </span>
                  <span className="text-gray-300">{Math.round(syncProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
                {syncStatus.progress.currentFile && (
                  <p className="text-xs text-gray-400 truncate">
                    Processing: {syncStatus.progress.currentFile}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sync Preview */}
        {syncPreview && !syncStatus?.isRunning && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-blue-400">Ready to Sync</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{syncPreview.newFiles}</div>
                <div className="text-gray-400">New Files</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{syncPreview.updatedFiles}</div>
                <div className="text-gray-400">Updated Files</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{syncPreview.estimatedSessions}</div>
                <div className="text-gray-400">Est. Sessions</div>
              </div>
            </div>
          </div>
        )}

        {/* Database Stats */}
        {syncStats && (
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-300">Database Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {syncStats.totalSessions.toLocaleString()}
                </div>
                <div className="text-gray-400">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {syncStats.totalMessages.toLocaleString()}
                </div>
                <div className="text-gray-400">Total Messages</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-white">
                  {syncStats.oldestSession
                    ? new Date(syncStats.oldestSession).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div className="text-gray-400">Oldest Session</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-white">{syncStats.databaseSize}</div>
                <div className="text-gray-400">Database Size</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="directory" className="block text-sm font-medium text-gray-400 mb-2">
              Claude Code Directory
            </label>
            <div className="flex">
              <input
                id="directory"
                type="text"
                className="flex-1 bg-background-primary border border-gray-600 rounded-l-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                placeholder="~/.claude/projects"
                readOnly
              />
              <button
                type="button"
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-r-lg font-medium transition-colors"
              >
                Browse
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Path to your Claude Code data directory</p>
          </div>

          {/* Auto-sync Settings */}
          <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="auto-sync"
                className="w-4 h-4 text-primary-500 bg-background-primary border-gray-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="auto-sync" className="text-sm text-gray-300">
                Enable automatic data synchronization
              </label>
            </div>

            <div className="ml-7 space-y-3 text-sm">
              <div>
                <label htmlFor="sync-interval" className="block text-gray-400 mb-1">
                  Sync Interval
                </label>
                <select
                  id="sync-interval"
                  className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                  disabled
                >
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60" selected>
                    Every hour
                  </option>
                  <option value="240">Every 4 hours</option>
                  <option value="1440">Daily</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sync-on-startup"
                  className="w-4 h-4 text-primary-500 bg-background-primary border-gray-600 rounded focus:ring-primary-500"
                  disabled
                />
                <label htmlFor="sync-on-startup" className="text-gray-400">
                  Sync on application startup
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sync-before-idle"
                  className="w-4 h-4 text-primary-500 bg-background-primary border-gray-600 rounded focus:ring-primary-500"
                  disabled
                />
                <label htmlFor="sync-before-idle" className="text-gray-400">
                  Sync when system goes idle
                </label>
              </div>

              <div className="text-xs text-gray-500 italic mt-2">
                ℹ️ Auto-sync features coming in a future update
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || syncStatus?.status === 'in_progress'}
              className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {syncMutation.isPending || syncStatus?.status === 'in_progress' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['syncStatus'] })}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Data Quality Dashboard */}
      <DataQualityDashboard />

      {/* Display Settings */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Display Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-400 mb-2">
              Default Time Range
            </label>
            <select
              id="time-range"
              className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 24 hours</option>
              <option>All time</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-400 mb-2">
              Currency
            </label>
            <select
              id="currency"
              className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="retention" className="block text-sm font-medium text-gray-400 mb-2">
              Data Retention Period
            </label>
            <select
              id="retention"
              className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option>90 days</option>
              <option>180 days</option>
              <option>1 year</option>
              <option>Forever</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Older data will be automatically cleaned up
            </p>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear All Data
            </button>
            <p className="text-xs text-gray-500 mt-1">This action cannot be undone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
