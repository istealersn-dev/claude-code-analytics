import { useState } from 'react';
import { Plus, X, Calendar, Settings } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useScreenSize } from '../../hooks/useScreenSize';

interface QuickAction {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    to: '/sessions',
    label: 'View Sessions',
    icon: Calendar,
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    color: 'bg-gray-600 hover:bg-gray-700',
  },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const screenSize = useScreenSize();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Only show on mobile and tablet
  if (screenSize.isDesktop) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 mobile-fab">
      {/* Quick actions menu */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                onClick={closeMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-full text-white shadow-lg transition-all duration-200 transform hover:scale-105 touch-manipulation fab-enter ${action.color}`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 touch-manipulation no-select ${
          isOpen
            ? 'bg-red-600 hover:bg-red-700 rotate-45'
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white mx-auto" />
        ) : (
          <Plus className="h-6 w-6 text-white mx-auto" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 -z-10"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
