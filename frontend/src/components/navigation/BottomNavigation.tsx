import { Link } from '@tanstack/react-router';
import { BarChart3, Calendar, Settings, Wrench, Home } from 'lucide-react';
import { useScreenSize } from '../../hooks/useScreenSize';

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const bottomNavItems: BottomNavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: Home,
  },
  {
    to: '/sessions',
    label: 'Sessions',
    icon: Calendar,
  },
  {
    to: '/charts',
    label: 'Charts',
    icon: BarChart3,
  },
  {
    to: '/dashboard-builder',
    label: 'Builder',
    icon: Wrench,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function BottomNavigation() {
  const screenSize = useScreenSize();

  // Only show on mobile devices
  if (!screenSize.isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 mobile-nav mobile-safe-area">
      <div className="flex justify-around items-center h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium text-gray-400 hover:text-white transition-colors touch-manipulation mobile-hover no-select"
              activeProps={{ className: 'text-primary-500' }}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
