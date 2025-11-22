import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowLeft, ChevronRight, Clock, Hash, Wrench, Zap } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { z } from 'zod';
import { formatCurrency, formatDuration, formatNumber } from '../hooks/useAnalytics';
import { useScreenSize } from '../hooks/useScreenSize';
import { FilterPillsBar } from '../components/ui/FilterPillsBar';
import { getProjectDisplayName } from '../utils/projectNames';

import { getApiUrl } from '../config/environment';

interface Session {
  session_id: string;
  project_name?: string;
  started_at: string;
  duration_seconds?: number;
  total_cost_usd: string | number;
  total_input_tokens: number;
  total_output_tokens: number;
  model_name?: string;
  tools_used: string[];
}

interface SessionsResponse {
  sessions: Session[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
  };
}

const sessionsSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

async function fetchSessions(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<SessionsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', '20');
  queryParams.append('offset', '0');

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const url = `${getApiUrl('/analytics/sessions')}?${queryParams.toString()}`;
  console.log('Fetching sessions from URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const result = await response.json();
  console.log('Sessions API response:', result);
  return result.data;
}

export const Route = createFileRoute('/sessions')({
  component: Sessions,
  validateSearch: sessionsSearchSchema,
});

function Sessions() {
  const { dateFrom, dateTo } = Route.useSearch();
  const navigate = Route.useNavigate();
  const screenSize = useScreenSize();

  console.log('Sessions component - Search params:', { dateFrom, dateTo });

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', { dateFrom, dateTo }],
    queryFn: () => fetchSessions({ dateFrom, dateTo }),
    staleTime: 10 * 60 * 1000, // Increased cache time for better performance
    gcTime: 30 * 60 * 1000,
  });

  console.log('Sessions component - Query result:', { data, isLoading, error });

  // Virtualization setup for performance with large lists
  const parentRef = useRef<HTMLDivElement>(null);
  const sessions = useMemo(() => data?.sessions || [], [data?.sessions]);

  const virtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (screenSize.isMobile ? 80 : 96), // Smaller height on mobile
    overscan: 5, // Render 5 extra items above and below visible area
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Sessions</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm sm:text-base text-gray-400">
            Browse and analyze your Claude Code conversation sessions
          </p>
          {(dateFrom || dateTo) && (
            <div className="flex items-center gap-2">
              <span className="text-sm bg-orange-900/30 text-orange-300 px-3 py-1 rounded-full">
                📅 Filtered by:{' '}
                {dateFrom && dateTo && dateFrom.startsWith(dateTo.split('T')[0])
                  ? new Date(dateFrom).toLocaleDateString()
                  : dateFrom === dateTo
                    ? dateFrom
                    : `${dateFrom} to ${dateTo}`}
              </span>
            </div>
          )}
        </div>
        {screenSize.isMobile && dateFrom && dateTo && (
          <FilterPillsBar
            className="mt-3"
            pills={[{
              label: 'Date',
              value:
                new Date(dateFrom).toLocaleDateString() ===
                new Date(dateTo).toLocaleDateString()
                  ? new Date(dateFrom).toLocaleDateString()
                  : `${new Date(dateFrom).toLocaleDateString()} → ${new Date(dateTo).toLocaleDateString()}`,
              onClear: () =>
                navigate({
                  search: (prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }),
                }),
            }]}
          />
        )}
      </div>


      {/* Sessions List */}
      <div className="bg-black/50 border border-primary-500/20 rounded-lg backdrop-blur-sm">
        <div className="p-6 border-b border-primary-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
            <div className="flex items-center gap-3">
              {data && (
                <span className="text-sm text-gray-400">{data.pagination.total} total sessions</span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!data) return;
                  const rows = [
                    ['session_id','project_name','started_at','duration_seconds','total_cost_usd','total_input_tokens','total_output_tokens','model_name','tools_used'],
                    ...data.sessions.map((s) => [
                      s.session_id,
                      s.project_name || '',
                      s.started_at,
                      s.duration_seconds?.toString() || '',
                      typeof s.total_cost_usd === 'string' ? s.total_cost_usd : s.total_cost_usd.toString(),
                      s.total_input_tokens.toString(),
                      s.total_output_tokens.toString(),
                      s.model_name || '',
                      (s.tools_used || []).join('|'),
                    ]),
                  ];
                  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const nameParts = [
                    'sessions',
                    dateFrom ? new Date(dateFrom).toISOString().slice(0,10) : undefined,
                    dateTo ? new Date(dateTo).toISOString().slice(0,10) : undefined,
                  ].filter(Boolean).join('_');
                  a.href = url;
                  a.download = `${nameParts || 'sessions'}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-md text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-8 text-center">
            <div className="text-primary-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-primary-500 mb-2">Error Loading Sessions</h3>
            <p className="text-gray-400 mb-4">{error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4 p-4 bg-primary-500/5 rounded-lg border border-primary-500/10">
                    <div className="w-12 h-12 bg-primary-500/20 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-primary-500/20 rounded mb-2"></div>
                      <div className="h-3 bg-primary-500/20 rounded w-2/3"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-primary-500/20 rounded mb-2 w-16"></div>
                      <div className="h-3 bg-primary-500/20 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data && data.sessions.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">No sessions found</h3>
            <p className="text-gray-400 mb-6">
              Sync your Claude Code data to start viewing your conversation sessions
            </p>
            <Link
              to="/"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {sessions.length > 0 && (
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{
              height: screenSize.isMobile ? '500px' : screenSize.isTablet ? '550px' : '600px',
              // Improve touch scrolling on mobile
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const session = sessions[virtualItem.index];
                const startedAt = new Date(session.started_at);
                const projectName = getProjectDisplayName(session.project_name || 'Unknown', 'legend');
                const totalTokens = session.total_input_tokens + session.total_output_tokens;
                const cost =
                  typeof session.total_cost_usd === 'string'
                    ? parseFloat(session.total_cost_usd)
                    : session.total_cost_usd;

                return (
                  <Link
                    key={session.session_id}
                    to="/sessions/$sessionId"
                    params={{ sessionId: session.session_id }}
                    className="absolute top-0 left-0 w-full block hover:bg-primary-500/10 transition-colors border-b border-primary-500/10"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div
                      className={`${screenSize.isMobile ? 'p-4' : 'p-6'} flex items-center gap-3 sm:gap-6 h-full`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`${screenSize.isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-primary-500/10 rounded-lg flex items-center justify-center border border-primary-500/20`}
                        >
                          <Hash
                            className={`${screenSize.isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-500`}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h3 className="text-white font-medium truncate text-sm sm:text-base">
                            {projectName}
                          </h3>
                          <span className="hidden sm:inline text-gray-500 text-sm">•</span>
                          <span className="text-gray-400 text-xs sm:text-sm font-mono">
                            {session.model_name || 'unknown'}
                          </span>
                        </div>
                        <div
                          className={`flex items-center ${screenSize.isMobile ? 'gap-3 flex-wrap' : 'gap-4'} text-xs sm:text-sm text-gray-400`}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration_seconds
                              ? formatDuration(session.duration_seconds)
                              : 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatNumber(totalTokens)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {session.tools_used.length}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-medium mb-1 text-sm sm:text-base">
                          {formatCurrency(cost)}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {screenSize.isMobile
                            ? startedAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : startedAt.toLocaleDateString()}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500/50" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
