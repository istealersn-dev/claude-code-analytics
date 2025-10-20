import { CheckCircle, Clock, Database, FileText, Loader2, XCircle } from 'lucide-react';
import { useSyncWebSocket } from '../../hooks/useSyncWebSocket';

interface RealTimeSyncStatusProps {
  className?: string;
}

export function RealTimeSyncStatus({ className = '' }: RealTimeSyncStatusProps) {
  const { isConnected, syncProgress, syncStatus, error } = useSyncWebSocket();

  if (!isConnected && !syncProgress && !syncStatus) {
    return null;
  }

  const formatTime = (milliseconds?: number) => {
    if (!milliseconds) return 'Calculating...';
    
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };


  const getStatusIcon = () => {
    if (syncProgress?.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (syncProgress?.status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
    if (syncProgress?.status === 'in_progress') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (syncProgress?.status === 'completed') return 'border-green-200 bg-green-50';
    if (syncProgress?.status === 'failed') return 'border-red-200 bg-red-50';
    if (syncProgress?.status === 'in_progress') return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="text-sm font-medium text-gray-900">
            {syncProgress?.status === 'completed' && 'Sync Completed'}
            {syncProgress?.status === 'failed' && 'Sync Failed'}
            {syncProgress?.status === 'in_progress' && 'Syncing Data'}
            {syncProgress?.status === 'starting' && 'Starting Sync'}
            {!syncProgress && syncStatus?.isRunning && 'Sync Running'}
            {!syncProgress && !syncStatus?.isRunning && 'Sync Status'}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {syncProgress && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{syncProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.progress}%` }}
              />
            </div>
          </div>

          {/* File Processing Status */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {syncProgress.processedFiles} / {syncProgress.totalFiles} files
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {syncProgress.sessionsProcessed} sessions
              </span>
            </div>
          </div>

          {/* Current File */}
          {syncProgress.currentFile && (
            <div className="text-xs text-gray-500 bg-white/50 rounded p-2">
              <span className="font-medium">Processing:</span> {syncProgress.currentFile}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">{syncProgress.messagesProcessed}</div>
              <div className="text-gray-500">Messages</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{syncProgress.errors}</div>
              <div className="text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {syncProgress.estimatedTimeRemaining ? formatTime(syncProgress.estimatedTimeRemaining) : '--'}
              </div>
              <div className="text-gray-500">ETA</div>
            </div>
          </div>

          {/* Start Time */}
          <div className="text-xs text-gray-500">
            Started: {new Date(syncProgress.startTime).toLocaleTimeString()}
          </div>
        </div>
      )}

      {!syncProgress && syncStatus && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {syncStatus.isRunning ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sync is currently running</span>
              </span>
            ) : (
              <span>No active sync</span>
            )}
          </div>
          
          {syncStatus.lastSync && (
            <div className="text-xs text-gray-500">
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}
          
          {syncStatus.filesProcessed && (
            <div className="text-xs text-gray-500">
              Files processed: {syncStatus.filesProcessed}
            </div>
          )}
          
          {syncStatus.sessionsProcessed && (
            <div className="text-xs text-gray-500">
              Sessions processed: {syncStatus.sessionsProcessed}
            </div>
          )}
          
          {syncStatus.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {syncStatus.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
