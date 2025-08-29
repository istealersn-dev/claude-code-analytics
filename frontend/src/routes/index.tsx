import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Claude Code Analytics Dashboard
        </h1>
        <p className="text-gray-400">
          Track your Claude Code usage patterns, costs, and productivity metrics
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sessions"
          value="0"
          subtitle="All time"
          icon="📊"
        />
        <StatCard
          title="Total Cost"
          value="$0.00"
          subtitle="All time"
          icon="💰"
        />
        <StatCard
          title="Token Usage"
          value="0"
          subtitle="Input + Output"
          icon="🎯"
        />
        <StatCard
          title="Cache Hit Rate"
          value="0%"
          subtitle="Efficiency"
          icon="⚡"
        />
      </div>
      
      {/* Welcome Message */}
      <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-4">
          Welcome to Claude Code Analytics
        </h2>
        <p className="text-gray-400 mb-6">
          Your dashboard is ready! Connect your Claude Code data to start tracking your usage patterns and insights.
        </p>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Sync Data
        </button>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon }: {
  title: string
  value: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="bg-background-secondary/50 border border-gray-700 rounded-lg p-6 hover:border-primary-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}