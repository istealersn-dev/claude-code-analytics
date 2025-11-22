import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  FileText,
  Loader2,
  RotateCw,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { StatsCard } from '../components/analytics/StatsCard';
import { DataQualityDashboard } from '../components/data-quality/DataQualityDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useSyncWebSocket } from '../hooks/useSyncWebSocket';

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

interface DataQualityMetrics {
  dataCompleteness: {
    completenessScore: number;
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
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

async function fetchDataQualityMetrics(): Promise<DataQualityMetrics> {
  const response = await fetch(getApiUrl('/data-quality/metrics'));
  if (!response.ok) {
    throw new Error('Failed to fetch data quality metrics');
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
    enabled: !syncStatus?.isRunning,
  });

  const { data: syncStats } = useQuery({
    queryKey: ['syncStats'],
    queryFn: fetchSyncStats,
  });

  const { data: dataQuality } = useQuery({
    queryKey: ['dataQualityMetrics'],
    queryFn: fetchDataQualityMetrics,
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
      queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] });
      setShowSyncResult(true);
      setTimeout(() => setShowSyncResult(false), 10000);
    },
  });

  const { isConnected, syncProgress: wsSyncProgress, syncStatus: wsSyncStatus } = useSyncWebSocket();

  const hasDataQualityIssues = dataQuality && dataQuality.dataCompleteness.completenessScore < 80;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage data synchronization and view analytics health
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {wsSyncProgress?.status === 'in_progress' ? (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing {wsSyncProgress.progress}%</span>
            </div>
          ) : wsSyncStatus?.isRunning ? (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sync running</span>
            </div>
          ) : (
            <span className="text-gray-400">No active sync</span>
          )}
        </div>
      </div>

      {showSyncResult && syncMutation.data && (
        <div className="bg-black/30 border border-green-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
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

      {syncMutation.isError && (
        <div className="bg-black/30 border border-red-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Sessions"
              value={syncStats?.totalSessions || 0}
              subtitle="In database"
              icon={Database}
              loading={!syncStats}
            />
            <StatsCard
              title="Total Messages"
              value={syncStats?.totalMessages || 0}
              subtitle="Conversation records"
              icon={FileText}
              loading={!syncStats}
            />
            <StatsCard
              title="Database Size"
              value={syncStats?.databaseSize || 'N/A'}
              subtitle="Total storage"
              icon={TrendingUp}
              loading={!syncStats}
            />
            <StatsCard
              title="Ready to Sync"
              value={syncPreview ? syncPreview.newFiles + syncPreview.updatedFiles : 0}
              subtitle={syncPreview ? `${syncPreview.newFiles} new, ${syncPreview.updatedFiles} updated` : 'Loading...'}
              icon={Activity}
              loading={!syncPreview}
            />
          </div>

          {syncStatus && (
            <div className="bg-black/30 border border-primary-500/20 rounded-lg p-4 mb-4">
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
                    {syncStatus.lastSync && !isNaN(new Date(syncStatus.lastSync).getTime()) && (
                      <p className="text-sm text-gray-400">
                        Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {syncStatus.status === 'in_progress' && syncStatus.progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      {syncStatus.progress.processedFiles} of {syncStatus.progress.totalFiles} files
                    </span>
                    <span className="text-gray-300">{Math.round(syncStatus.progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${syncStatus.progress.percentage}%` }}
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
          </div>
        </CardContent>
      </Card>

      {hasDataQualityIssues && (
        <div className="mb-6">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="text-yellow-400 font-medium">Data Quality Issues Detected</h3>
                <p className="text-sm text-yellow-300 mt-1">
                  Your data quality score is {dataQuality.dataCompleteness.completenessScore}% (Grade {dataQuality.dataCompleteness.qualityGrade}).
                  Review the dashboard below to address issues.
                </p>
              </div>
            </div>
          </div>
          <DataQualityDashboard />
        </div>
      )}
    </div>
  );
}
