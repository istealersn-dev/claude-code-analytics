import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Bot, Clock, DollarSign, ExternalLink, Hash, Wrench, Zap } from 'lucide-react';
import { StatsCard } from '../components/analytics/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency, formatDuration, formatNumber } from '../hooks/useAnalytics';

import { getApiUrl } from '../config/environment';

interface SessionDetail {
  session_id: string;
  project_name?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  model_name?: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  tools_used: string[];
  cache_hit_count: number;
  cache_miss_count: number;
}

async function fetchSessionDetail(sessionId: string): Promise<SessionDetail> {
  const response = await fetch(getApiUrl(`/analytics/sessions/${sessionId}`));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Session not found');
    }
    throw new Error('Failed to fetch session details');
  }
  return response.json();
}

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/sessions"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Link>
        </div>

        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            {error.message === 'Session not found' ? 'Session Not Found' : 'Error Loading Session'}
          </h2>
          <p className="text-red-300 mb-4">
            {error.message === 'Session not found'
              ? 'The requested session could not be found. It may have been deleted or never existed.'
              : 'There was an error loading the session details. Please try again later.'}
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/sessions' })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Sessions
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-gray-400">
            <ArrowLeft className="w-4 h-4" />
            Loading...
          </div>
        </div>

        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded mb-8 w-1/2"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">No session data available</div>
      </div>
    );
  }

  const startedAt = new Date(session.started_at);
  const endedAt = session.ended_at ? new Date(session.ended_at) : null;
  const projectName = session.project_name || 'Unknown Project';
  const totalTokens = session.total_input_tokens + session.total_output_tokens;
  const cacheEfficiency =
    session.cache_hit_count + session.cache_miss_count > 0
      ? (session.cache_hit_count / (session.cache_hit_count + session.cache_miss_count)) * 100
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/sessions"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Session Details</h1>
        <div className="flex items-center gap-4 text-gray-400">
          <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
            {session.session_id}
          </span>
          <span>•</span>
          <span>{projectName}</span>
          <span>•</span>
          <span>
            {startedAt.toLocaleDateString()} {startedAt.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Duration"
          value={session.duration_seconds ? formatDuration(session.duration_seconds) : 'N/A'}
          subtitle={endedAt ? `Ended ${endedAt.toLocaleTimeString()}` : 'In progress'}
          icon={Clock}
          loading={false}
        />

        <StatsCard
          title="Total Cost"
          value={formatCurrency(session.total_cost_usd)}
          subtitle={`${formatNumber(totalTokens)} tokens`}
          icon={DollarSign}
          loading={false}
        />

        <StatsCard
          title="Tools Used"
          value={session.tools_used.length}
          subtitle={
            session.tools_used.slice(0, 2).join(', ') + (session.tools_used.length > 2 ? '...' : '')
          }
          icon={Wrench}
          loading={false}
        />

        <StatsCard
          title="Cache Efficiency"
          value={`${cacheEfficiency.toFixed(1)}%`}
          subtitle={`${session.cache_hit_count} hits, ${session.cache_miss_count} misses`}
          icon={Zap}
          loading={false}
        />
      </div>

      {/* Session Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Model</span>
                <span className="text-white font-mono">{session.model_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Input Tokens</span>
                <span className="text-white">{formatNumber(session.total_input_tokens)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Output Tokens</span>
                <span className="text-white">{formatNumber(session.total_output_tokens)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token Ratio</span>
                <span className="text-white">
                  {session.total_input_tokens > 0
                    ? (session.total_output_tokens / session.total_input_tokens).toFixed(2)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Tools Used ({session.tools_used.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session.tools_used.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {session.tools_used.map((tool) => (
                  <span
                    key={tool}
                    className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-sm font-mono"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No tools used in this session</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Analysis Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Message Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-white mb-2">Message Details Coming Soon</h3>
            <p className="text-gray-400 mb-4">
              Detailed message-by-message analysis will be available here, including token counts,
              processing times, and tool interactions.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
