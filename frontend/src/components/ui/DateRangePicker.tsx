import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

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
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getDateRange = (days: number | null): DateRange => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    if (days === null) {
      // All time - use a very early date
      return {
        start: '2024-01-01',
        end: end.toISOString().split('T')[0]
      };
    }

    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
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
      [field]: dateValue
    };
    onChange(newRange);
  };

  const displayValue = value 
    ? `${formatDate(value.start)} - ${formatDate(value.end)}`
    : 'Select date range';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors duration-200"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm">{displayValue}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-200 mb-3">Quick Select</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.days)}
                    className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-sm font-medium text-gray-200 mb-3">Custom Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <input
                      type="date"
                      value={value?.start || ''}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <input
                      type="date"
                      value={value?.end || ''}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}