import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sessions')({
  component: Sessions,
})

function Sessions() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Sessions</h1>
        <p className="text-gray-400">
          Browse and analyze your Claude Code conversation sessions
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-400 mb-2">
              Date Range
            </label>
            <select id="date-range" className="w-full bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 24 hours</option>
              <option>All time</option>
            </select>
          </div>
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-400 mb-2">
              Project
            </label>
            <select id="project" className="w-full bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
              <option>All projects</option>
            </select>
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-400 mb-2">
              Model
            </label>
            <select id="model" className="w-full bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
              <option>All models</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
        </div>
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No sessions found
          </h3>
          <p className="text-gray-400 mb-6">
            Sync your Claude Code data to start viewing your conversation sessions
          </p>
          <button type="button" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Sync Data
          </button>
        </div>
      </div>
    </div>
  )
}