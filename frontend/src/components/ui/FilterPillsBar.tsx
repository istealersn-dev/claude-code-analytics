import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Pill {
  label: string;
  value: string;
  onClear: () => void;
}

interface FilterPillsBarProps {
  pills: Pill[];
  className?: string;
  actions?: ReactNode;
}

export function FilterPillsBar({ pills, className, actions }: FilterPillsBarProps) {
  if (!pills.length) return null;

  return (
    <div className={`bg-background-secondary/50 border border-gray-700 rounded-lg ${className || ''}`}>
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {pills.map((pill, idx) => (
            <button
              key={`${pill.label}-${idx}`}
              type="button"
              onClick={pill.onClear}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-600 bg-gray-800 text-gray-200 text-xs whitespace-nowrap"
            >
              <span className="font-medium">{pill.label}:</span>
              <span className="font-mono text-gray-300">{pill.value}</span>
              <X className="w-3 h-3 text-gray-400" />
            </button>
          ))}
        </div>
        {actions && <div className="ml-auto flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

