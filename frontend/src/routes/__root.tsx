import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-gradient-dark text-white">
        <nav className="border-b border-gray-800 bg-background-secondary/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-primary-500">
                  Claude Code Analytics
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-white' }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sessions"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-white' }}
                >
                  Sessions
                </Link>
                <Link
                  to="/charts"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-white' }}
                >
                  Interactive Charts
                </Link>
                <Link
                  to="/dashboard-builder"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-white' }}
                >
                  Dashboard Builder
                </Link>
                <Link
                  to="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-white' }}
                >
                  Settings
                </Link>
                <Link
                  to="/debug"
                  className="px-3 py-2 rounded-md text-sm font-medium text-orange-300 hover:text-orange-200 hover:bg-gray-700 transition-colors"
                  activeProps={{ className: 'bg-gray-700 text-orange-200' }}
                >
                  Debug
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
