import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Database,
  FileX,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const API_BASE = 'http://localhost:3001/api';

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
  const response = await fetch(`${API_BASE}/data-quality/metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch data quality metrics');
  }
  const result = await response.json();
  return result.data;
}

async function cleanupDuplicates(): Promise<CleanupResult> {
  const response = await fetch(`${API_BASE}/data-quality/cleanup/duplicates`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to cleanup duplicates');
  }
  const result = await response.json();
  return result.data;
}

async function cleanupOrphanedMetrics(): Promise<CleanupResult> {
  const response = await fetch(`${API_BASE}/data-quality/cleanup/orphaned-metrics`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to cleanup orphaned metrics');
  }
  const result = await response.json();
  return result.data;
}

export function DataQualityDashboard() {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dataQualityMetrics'],
    queryFn: fetchDataQualityMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const duplicateCleanupMutation = useMutation({
    mutationFn: cleanupDuplicates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const orphanedCleanupMutation = useMutation({
    mutationFn: cleanupOrphanedMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
          <h2 className="text-lg font-semibold text-white">Loading Data Quality Metrics...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="text-lg font-semibold text-red-400">Error Loading Data Quality</h2>
            <p className="text-sm text-red-300 mt-1">
              {error?.message || 'Failed to load data quality metrics'}
            </p>
          </div>
        </div>
      </div>
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-white">Data Quality Dashboard</h2>
        </div>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['dataQualityMetrics'] })}
          className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overall Quality Score */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium mb-1">Overall Data Quality</h3>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-white">
                {metrics.dataCompleteness.completenessScore}%
              </div>
              <div
                className={`text-xl font-bold ${getGradeColor(metrics.dataCompleteness.qualityGrade)}`}
              >
                Grade {metrics.dataCompleteness.qualityGrade}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Sessions</div>
            <div className="text-lg font-bold text-white">
              {metrics.totalSessions.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <div className="text-sm text-green-400">Complete Sessions</div>
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.completeSessions.toLocaleString()}
          </div>
          <div className="text-xs text-green-300">
            {metrics.totalSessions > 0
              ? Math.round((metrics.completeSessions / metrics.totalSessions) * 100)
              : 0}
            % of total
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <div className="text-sm text-yellow-400">Incomplete</div>
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.incompleteSessions.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-300">Missing end time/duration</div>
        </div>

        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <div className="text-sm text-red-400">Duplicates</div>
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.duplicateSessions.toLocaleString()}
          </div>
          <div className="text-xs text-red-300">Session ID conflicts</div>
        </div>

        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileX className="w-4 h-4 text-purple-400" />
            <div className="text-sm text-purple-400">Orphaned</div>
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.orphanedMetrics.toLocaleString()}
          </div>
          <div className="text-xs text-purple-300">Metrics without sessions</div>
        </div>
      </div>

      {/* Detailed Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Missing Data */}
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h3 className="font-medium text-orange-400">Missing Data</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Without End Time:</span>
              <span className="text-white font-medium">
                {metrics.missingData.sessionsWithoutEndTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Without Duration:</span>
              <span className="text-white font-medium">
                {metrics.missingData.sessionsWithoutDuration}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Without Tokens:</span>
              <span className="text-white font-medium">
                {metrics.missingData.sessionsWithoutTokens}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Without Cost:</span>
              <span className="text-white font-medium">
                {metrics.missingData.sessionsWithoutCost}
              </span>
            </div>
          </div>
        </div>

        {/* Data Integrity */}
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="font-medium text-blue-400">Data Integrity</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Negative Tokens:</span>
              <span className="text-white font-medium">{metrics.dataIntegrity.negativeTokens}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Negative Costs:</span>
              <span className="text-white font-medium">{metrics.dataIntegrity.negativeCosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Invalid Durations:</span>
              <span className="text-white font-medium">
                {metrics.dataIntegrity.invalidDurations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Future Timestamps:</span>
              <span className="text-white font-medium">
                {metrics.dataIntegrity.futureTimestamps}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup Actions */}
      {(metrics.duplicateSessions > 0 || metrics.orphanedMetrics > 0) && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="font-medium text-blue-400">Data Cleanup Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {metrics.duplicateSessions > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to remove ${metrics.duplicateSessions} duplicate sessions? This action cannot be undone.`,
                    )
                  ) {
                    duplicateCleanupMutation.mutate();
                  }
                }}
                disabled={duplicateCleanupMutation.isPending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
              >
                {duplicateCleanupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Remove {metrics.duplicateSessions} Duplicates
              </button>
            )}

            {metrics.orphanedMetrics > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to remove ${metrics.orphanedMetrics} orphaned metric records? This action cannot be undone.`,
                    )
                  ) {
                    orphanedCleanupMutation.mutate();
                  }
                }}
                disabled={orphanedCleanupMutation.isPending}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
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

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="font-medium text-green-400">Recommendations</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showRecommendations ? 'Hide' : `Show ${metrics.recommendations.length}`}
            </button>
          </div>

          {showRecommendations && (
            <div className="space-y-3">
              {metrics.recommendations.map((rec) => (
                <div
                  key={rec.title}
                  className="flex gap-3 p-3 bg-gray-700/50 rounded border border-gray-600"
                >
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <div className="font-medium text-white">{rec.title}</div>
                    <div className="text-sm text-gray-300 mt-1">{rec.description}</div>
                    {rec.action && (
                      <div className="text-xs text-gray-400 mt-2">💡 {rec.action}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{rec.affectedRecords}</div>
                    <div className="text-xs text-gray-400">records</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cleanup Success Messages */}
      {duplicateCleanupMutation.data && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            {duplicateCleanupMutation.data.message}
          </div>
        </div>
      )}

      {orphanedCleanupMutation.data && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            {orphanedCleanupMutation.data.message}
          </div>
        </div>
      )}
    </div>
  );
}
