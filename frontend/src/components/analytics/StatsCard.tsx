import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading = false,
  className,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-600 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-8 bg-gray-600 rounded w-1/2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8 text-primary-500" />
          {trend && (
            <span
              className={clsx(
                'text-sm font-medium px-2 py-1 rounded-full',
                trend.value >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10',
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && <p className="text-xs text-gray-400 mt-1">{trend.label}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
