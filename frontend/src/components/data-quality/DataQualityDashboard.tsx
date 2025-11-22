import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileX,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { StatsCard } from '../analytics/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

import { getApiUrl } from '../../config/environment';

interface DataQualityMetrics {
  totalSessions: number;
  completeSessions: number;
  incompleteSessions: number;
  duplicateSessions: number;
  orphanedMetrics: number;
  missingData: {
    sessionsWithoutEndTime: number;
    sessionsWithoutDuration: number;
    sessionsWithoutTokens: number;
    sessionsWithoutCost: number;
    metricsWithoutMessages: number;
  };
  dataIntegrity: {
    negativeTokens: number;
    negativeCosts: number;
    invalidDurations: number;
    futureTimestamps: number;
    inconsistentAggregates: number;
  };
  dataCompleteness: {
    completenessScore: number;
    missingFields: string[];
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  duplicateAnalysis: Array<{
    sessionId: string;
    duplicateCount: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  recommendations: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    affectedRecords: number;
    action?: string;
  }>;
}

interface CleanupResult {
  deletedRecords: number;
  message: string;
}

async function fetchDataQualityMetrics(): Promise<DataQualityMetrics> {
  const response = await fetch(getApiUrl('/data-quality/metrics'));
  if (!response.ok) {
    throw new Error('Failed to fetch data quality metrics');
  }
  const result = await response.json();
  return result.data;
}

async function cleanupDuplicates(): Promise<CleanupResult> {
  const response = await fetch(getApiUrl('/data-quality/cleanup/duplicates'), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to cleanup duplicates');
  }
  const result = await response.json();
  return result.data;
}

async function cleanupOrphanedMetrics(): Promise<CleanupResult> {
  const response = await fetch(getApiUrl('/data-quality/cleanup/orphaned-metrics'), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to cleanup orphaned metrics');
  }
  const result = await response.json();
  return result.data;
}

export function DataQualityDashboard() {
  const [showMissingDetails, setShowMissingDetails] = useState(false);
  const [showIntegrityDetails, setShowIntegrityDetails] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dataQualityMetrics'],
    queryFn: fetchDataQualityMetrics,
    refetchInterval: 30000,
  });

  const duplicateCleanupMutation = useMutation({
    mutationFn: cleanupDuplicates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['syncStats'] });
    },
  });

  const orphanedCleanupMutation = useMutation({
    mutationFn: cleanupOrphanedMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['syncStats'] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <h2 className="text-lg font-semibold text-white">Loading Data Quality Metrics...</h2>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="text-lg font-semibold text-red-400">Error Loading Data Quality</h2>
              <p className="text-sm text-red-300 mt-1">
                {error?.message || 'Failed to load data quality metrics'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-400';
      case 'B':
        return 'text-blue-400';
      case 'C':
        return 'text-yellow-400';
      case 'D':
        return 'text-orange-400';
      case 'F':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const hasFixableIssues = metrics.duplicateSessions > 0 || metrics.orphanedMetrics > 0;
  const hasMissingDataIssues =
    metrics.missingData.sessionsWithoutDuration > 0 ||
    metrics.missingData.sessionsWithoutTokens > 0 ||
    metrics.missingData.sessionsWithoutCost > 0;
  const hasIntegrityIssues =
    metrics.dataIntegrity.negativeTokens > 0 ||
    metrics.dataIntegrity.negativeCosts > 0 ||
    metrics.dataIntegrity.invalidDurations > 0 ||
    metrics.dataIntegrity.futureTimestamps > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Quality Dashboard
          </CardTitle>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] })}
            className="flex items-center gap-2 text-sm bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 hover:border-primary-500/50 text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="bg-black/30 border border-primary-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Overall Data Quality</h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-white">
                  {metrics.dataCompleteness.completenessScore}%
                </div>
                <div
                  className={`text-2xl font-bold ${getGradeColor(metrics.dataCompleteness.qualityGrade)}`}
                >
                  Grade {metrics.dataCompleteness.qualityGrade}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {metrics.completeSessions} of {metrics.totalSessions} sessions are complete
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Complete Sessions"
            value={metrics.completeSessions}
            subtitle={`${metrics.totalSessions > 0 ? Math.round((metrics.completeSessions / metrics.totalSessions) * 100) : 0}% of total`}
            icon={CheckCircle}
            loading={false}
          />
          <StatsCard
            title="Incomplete Sessions"
            value={metrics.incompleteSessions}
            subtitle="Missing end time or duration"
            icon={AlertTriangle}
            loading={false}
          />
          <StatsCard
            title="Duplicate Sessions"
            value={metrics.duplicateSessions}
            subtitle={metrics.duplicateSessions > 0 ? 'Auto-fixable' : 'None found'}
            icon={XCircle}
            loading={false}
          />
          <StatsCard
            title="Orphaned Metrics"
            value={metrics.orphanedMetrics}
            subtitle={metrics.orphanedMetrics > 0 ? 'Auto-fixable' : 'None found'}
            icon={FileX}
            loading={false}
          />
        </div>

        {/* Fix Actions */}
        {hasFixableIssues && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-400 mb-1">Auto-Fixable Issues Detected</h3>
                <p className="text-sm text-blue-300">
                  You have {metrics.duplicateSessions + metrics.orphanedMetrics} issues that can be
                  automatically fixed. These cleanup actions are safe and reversible.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {metrics.duplicateSessions > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${metrics.duplicateSessions} duplicate sessions?\n\nThis will keep the most recent version of each duplicate. This action cannot be undone.`,
                      )
                    ) {
                      duplicateCleanupMutation.mutate();
                    }
                  }}
                  disabled={duplicateCleanupMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {duplicateCleanupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Fix {metrics.duplicateSessions} Duplicates
                </button>
              )}

              {metrics.orphanedMetrics > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${metrics.orphanedMetrics} orphaned metric records?\n\nThese are metrics without parent sessions. This action cannot be undone.`,
                      )
                    ) {
                      orphanedCleanupMutation.mutate();
                    }
                  }}
                  disabled={orphanedCleanupMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {orphanedCleanupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileX className="w-4 h-4" />
                  )}
                  Clean {metrics.orphanedMetrics} Orphaned Records
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cleanup Success Messages */}
        {duplicateCleanupMutation.data && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              {duplicateCleanupMutation.data.message}
            </div>
          </div>
        )}

        {orphanedCleanupMutation.data && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              {orphanedCleanupMutation.data.message}
            </div>
          </div>
        )}

        {/* Missing Data Issues */}
        {hasMissingDataIssues && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <button
              type="button"
              onClick={() => setShowMissingDetails(!showMissingDetails)}
              className="w-full flex items-start gap-3 text-left"
            >
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-400 mb-1 flex items-center gap-2">
                  Missing Data Issues
                  <HelpCircle className="w-4 h-4" />
                </h3>
                <p className="text-sm text-yellow-300 mb-2">
                  Some sessions are missing critical data like duration, tokens, or cost. Click to
                  view details.
                </p>
              </div>
            </button>

            {showMissingDetails && (
              <div className="mt-4 pl-8 space-y-3">
                <div className="bg-yellow-900/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-yellow-300 font-medium">
                      Sessions Without Duration ({metrics.missingData.sessionsWithoutDuration})
                    </span>
                  </div>
                  <p className="text-xs text-yellow-200/80 mb-2">
                    <strong>What this means:</strong> These sessions are missing end times or
                    duration calculations, making it impossible to track how long conversations
                    lasted.
                  </p>
                  <p className="text-xs text-yellow-200/80">
                    <strong>How to fix:</strong> Re-sync your data. If sessions are still running,
                    they'll complete naturally. If the source data is incomplete, the issue may
                    persist.
                  </p>
                </div>

                {metrics.missingData.sessionsWithoutTokens > 0 && (
                  <div className="bg-yellow-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-yellow-300 font-medium">
                        Sessions Without Tokens ({metrics.missingData.sessionsWithoutTokens})
                      </span>
                    </div>
                    <p className="text-xs text-yellow-200/80 mb-2">
                      <strong>What this means:</strong> No token usage recorded for these sessions,
                      likely because they have no messages or the JSONL data is incomplete.
                    </p>
                    <p className="text-xs text-yellow-200/80">
                      <strong>How to fix:</strong> Check if the source JSONL files contain message
                      data. Re-sync to attempt recovery.
                    </p>
                  </div>
                )}

                {metrics.missingData.sessionsWithoutCost > 0 && (
                  <div className="bg-yellow-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-yellow-300 font-medium">
                        Sessions Without Cost ({metrics.missingData.sessionsWithoutCost})
                      </span>
                    </div>
                    <p className="text-xs text-yellow-200/80 mb-2">
                      <strong>What this means:</strong> Cost is calculated from token usage. If
                      tokens are missing, cost will be $0.00, affecting budget tracking accuracy.
                    </p>
                    <p className="text-xs text-yellow-200/80">
                      <strong>How to fix:</strong> Fix missing token data first, then costs will
                      recalculate automatically on next sync.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Integrity Issues */}
        {hasIntegrityIssues && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <button
              type="button"
              onClick={() => setShowIntegrityDetails(!showIntegrityDetails)}
              className="w-full flex items-start gap-3 text-left"
            >
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-400 mb-1 flex items-center gap-2">
                  Data Integrity Issues
                  <HelpCircle className="w-4 h-4" />
                </h3>
                <p className="text-sm text-red-300 mb-2">
                  Critical data corruption detected. These issues require manual investigation.
                  Click to view details.
                </p>
              </div>
            </button>

            {showIntegrityDetails && (
              <div className="mt-4 pl-8 space-y-3">
                {metrics.dataIntegrity.negativeTokens > 0 && (
                  <div className="bg-red-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-red-300 font-medium">
                        Negative Token Counts ({metrics.dataIntegrity.negativeTokens})
                      </span>
                    </div>
                    <p className="text-xs text-red-200/80">
                      <strong>What this means:</strong> Token counts cannot be negative. This
                      indicates data corruption or parsing errors.
                    </p>
                  </div>
                )}

                {metrics.dataIntegrity.negativeCosts > 0 && (
                  <div className="bg-red-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-red-300 font-medium">
                        Negative Costs ({metrics.dataIntegrity.negativeCosts})
                      </span>
                    </div>
                    <p className="text-xs text-red-200/80">
                      <strong>What this means:</strong> Costs cannot be negative. This indicates
                      calculation errors or data corruption.
                    </p>
                  </div>
                )}

                {metrics.dataIntegrity.futureTimestamps > 0 && (
                  <div className="bg-red-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-red-300 font-medium">
                        Future Timestamps ({metrics.dataIntegrity.futureTimestamps})
                      </span>
                    </div>
                    <p className="text-xs text-red-200/80">
                      <strong>What this means:</strong> Some sessions have timestamps in the future,
                      which is impossible and indicates clock sync issues or data corruption.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recommendations - Always Visible */}
        {metrics.recommendations.length > 0 && (
          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-blue-400">Recommendations</h3>
            </div>
            <div className="space-y-3">
              {metrics.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 bg-gray-700/50 rounded border border-gray-600"
                >
                  {rec.type === 'error' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  {rec.type === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  {rec.type === 'info' && <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium text-white">{rec.title}</div>
                    <div className="text-sm text-gray-300 mt-1">{rec.description}</div>
                    {rec.action && (
                      <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                        <span>💡</span>
                        <span>{rec.action}</span>
                      </div>
                    )}
                  </div>
                  {rec.affectedRecords > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{rec.affectedRecords}</div>
                      <div className="text-xs text-gray-400">records</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
