import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu, X, BarChart3, Calendar, Settings, Wrench, Bug, Home } from 'lucide-react';
import { useScreenSize } from '../../hooks/useScreenSize';

interface NavigationItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and analytics',
  },
  {
    to: '/sessions',
    label: 'Sessions',
    icon: Calendar,
    description: 'View all sessions',
  },
  {
    to: '/charts',
    label: 'Charts',
    icon: BarChart3,
    description: 'Interactive visualizations',
  },
  {
    to: '/dashboard-builder',
    label: 'Builder',
    icon: Wrench,
    description: 'Custom dashboards',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'App configuration',
  },
  {
    to: '/debug',
    label: 'Debug',
    icon: Bug,
    description: 'Development tools',
  },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const screenSize = useScreenSize();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Don't render on desktop
  if (screenSize.isDesktop) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 mobile-overlay md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-sm bg-gray-900 shadow-xl mobile-menu-enter">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation items */}
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-4">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMenu}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group touch-manipulation mobile-hover"
                        activeProps={{ className: 'bg-primary-600 text-white' }}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800">
                <div className="text-xs text-gray-400 text-center">
                  Claude Code Analytics
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
