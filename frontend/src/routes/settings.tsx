import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Configure your analytics dashboard preferences and data sync options
        </p>
      </div>
      
      {/* Data Sync Settings */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Data Synchronization</h2>
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
              <button type="button" className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-r-lg font-medium transition-colors">
                Browse
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Path to your Claude Code data directory
            </p>
          </div>
          
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
          
          <button type="button" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Sync Now
          </button>
        </div>
      </div>
      
      {/* Display Settings */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Display Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-400 mb-2">
              Default Time Range
            </label>
            <select id="time-range" className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
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
            <select id="currency" className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
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
            <select id="retention" className="w-full md:w-auto bg-background-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none">
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
            <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Clear All Data
            </button>
            <p className="text-xs text-gray-500 mt-1">
              This action cannot be undone
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}