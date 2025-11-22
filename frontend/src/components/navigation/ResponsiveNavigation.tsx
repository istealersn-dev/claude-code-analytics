import { Link } from '@tanstack/react-router';
import { Calendar, Settings, Home } from 'lucide-react';
import { MobileNavigation } from './MobileNavigation';
import { useScreenSize } from '../../hooks/useScreenSize';

interface NavigationItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
}

const navigationItems: NavigationItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: Home,
  },
  {
    to: '/sessions',
    label: 'Sessions',
    shortLabel: 'Sessions',
    icon: Calendar,
  },
  {
    to: '/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Settings,
  },
];

export function ResponsiveNavigation() {
  const screenSize = useScreenSize();

  return (
    <nav className="border-b border-primary-500/20 bg-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-500 hover:text-primary-400 transition-colors">
              <span className="hidden sm:inline">Claude Code Analytics</span>
              <span className="sm:hidden">CCA</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {screenSize.isDesktop && (
            <div className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                    activeProps={{ className: 'bg-primary-500/20 text-primary-500' }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tablet Navigation - Compact */}
          {screenSize.isTablet && (
            <div className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center space-x-1 px-2 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                    activeProps={{ className: 'bg-primary-500/20 text-primary-500' }}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </nav>
  );
}
