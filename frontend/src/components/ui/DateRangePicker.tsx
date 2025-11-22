import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
];

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const getDateRange = (days: number | null): DateRange => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (days === null) {
      // All time - use a very early date
      return {
        start: '2024-01-01',
        end: end.toISOString().split('T')[0],
      };
    }

    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const handlePresetClick = (days: number | null) => {
    const range = getDateRange(days);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomDateChange = (field: 'start' | 'end', dateValue: string) => {
    if (!value) return;

    const newRange = {
      ...value,
      [field]: dateValue,
    };
    onChange(newRange);
  };

  const displayValue = value
    ? `${formatDate(value.start)} - ${formatDate(value.end)}`
    : 'Select date range';

  return (
    <div className={`relative ${className}`}>
      <button type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-primary-500/10 border border-primary-500/20 hover:border-primary-500/40 rounded-lg text-white transition-colors duration-200"
      >
        <Calendar className="w-4 h-4 text-primary-500" />
        <span className="text-sm">{displayValue}</span>
        <ChevronDown
          className={`w-4 h-4 text-primary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/useSemanticElements: This is a backdrop overlay, not a traditional button */}
          <div
            role="button"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-label="Close date picker"
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 w-80 bg-black/95 border border-primary-500/20 rounded-lg shadow-lg z-20 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-primary-500 mb-3">Quick Select</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PRESET_RANGES.map((preset) => (
                  <button type="button"
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.days)}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors text-left border border-transparent hover:border-primary-500/20"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-primary-500/20 pt-4 mb-4">
                <h3 className="text-sm font-medium text-primary-500 mb-3">Custom Range</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="date-from" className="block text-xs text-gray-400 mb-1">From</label>
                    <input
                      id="date-from"
                      type="date"
                      value={value?.start || ''}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-primary-500/20 rounded-md text-white text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="date-to" className="block text-xs text-gray-400 mb-1">To</label>
                    <input
                      id="date-to"
                      type="date"
                      value={value?.end || ''}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-primary-500/20 rounded-md text-white text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {value && (
                <div className="border-t border-primary-500/20 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(undefined);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors border border-primary-500/20 hover:border-primary-500/40"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
