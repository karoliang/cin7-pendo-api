import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Cin7Card as Card, Cin7CardContent as CardContent } from '@/components/polaris';
import { Cin7Select } from '@/components/polaris/Cin7Select';
import type { Cin7SelectOption } from '@/components/polaris/Cin7Select';
import { Cin7TextField as TextField } from '@/components/polaris/Cin7TextField';
import { Cin7Button as Button } from '@/components/polaris';
import { subDays, format, isValid } from 'date-fns';

export type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | '90days' | 'custom';

export interface DateRangeOptions {
  preset: DateRangePreset;
  customStart?: Date;
  customEnd?: Date;
  comparison?: boolean; // Compare to previous period
}

export interface DateRangeValue {
  start: Date;
  end: Date;
  preset: DateRangePreset;
  comparison: boolean;
}

interface DateRangeSelectorProps {
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  showComparison?: boolean;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className,
  showComparison = true,
}) => {
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [comparison, setComparison] = useState(value?.comparison ?? false);

  // Calculate date range based on preset
  const calculateDateRange = (preset: DateRangePreset, start?: Date, end?: Date): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return {
          start: today,
          end: now,
        };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return {
          start: yesterday,
          end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
        };
      case '7days':
        return {
          start: subDays(today, 6),
          end: now,
        };
      case '30days':
        return {
          start: subDays(today, 29),
          end: now,
        };
      case '90days':
        return {
          start: subDays(today, 89),
          end: now,
        };
      case 'custom':
        if (start && end) {
          return { start, end };
        }
        // Default to last 7 days if custom dates not provided
        return {
          start: subDays(today, 6),
          end: now,
        };
      default:
        return {
          start: subDays(today, 6),
          end: now,
        };
    }
  };

  // Preset options
  const presetOptions: Cin7SelectOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' },
    { label: 'Custom range', value: 'custom' },
  ];

  const currentPreset = value?.preset || '7days';
  const isCustom = currentPreset === 'custom';

  // Handle preset change
  const handlePresetChange = (newPreset: string) => {
    const preset = newPreset as DateRangePreset;
    let start: Date | undefined;
    let end: Date | undefined;

    if (preset === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
    }

    const range = calculateDateRange(preset, start, end);
    onChange({
      ...range,
      preset,
      comparison,
    });
  };

  // Handle custom date change
  const handleCustomDateChange = () => {
    if (!customStart || !customEnd) return;

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);

    if (!isValid(startDate) || !isValid(endDate)) return;
    if (startDate > endDate) return;

    onChange({
      start: startDate,
      end: endDate,
      preset: 'custom',
      comparison,
    });
  };

  // Handle comparison toggle
  const handleComparisonToggle = () => {
    const newComparison = !comparison;
    setComparison(newComparison);

    if (value) {
      onChange({
        ...value,
        comparison: newComparison,
      });
    }
  };

  // Format display text for current selection
  const displayText = useMemo(() => {
    if (!value) return 'Last 7 days';

    if (value.preset === 'custom') {
      return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
    }

    const option = presetOptions.find(opt => opt.value === value.preset);
    return option?.label || 'Last 7 days';
  }, [value, presetOptions]);

  return (
    <Card className={className}>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2">
            <Cin7Select
              label="Select Period"
              labelHidden
              options={presetOptions}
              value={currentPreset}
              onChange={handlePresetChange}
              placeholder="Select date range"
            />
          </div>

          {/* Custom Date Inputs */}
          {isCustom && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Start Date"
                  type="date"
                  value={customStart}
                  onChange={(value) => setCustomStart(value)}
                  onBlur={handleCustomDateChange}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={customEnd}
                  onChange={(value) => setCustomEnd(value)}
                  onBlur={handleCustomDateChange}
                />
              </div>
              <Button
                onClick={handleCustomDateChange}
                disabled={!customStart || !customEnd}
                size="slim"
                fullWidth
              >
                Apply Custom Range
              </Button>
            </div>
          )}

          {/* Current Selection Display */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Current Selection</div>
            <div className="text-sm font-medium text-gray-900">{displayText}</div>
            {value && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.ceil((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            )}
          </div>

          {/* Comparison Toggle */}
          {showComparison && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Compare to Previous Period</span>
                <span className="text-xs text-gray-600">
                  Show trends vs {value ? Math.ceil((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24)) : 7} days before
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={comparison}
                  onChange={handleComparisonToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Quick Stats (if comparison is enabled) */}
          {comparison && value && (
            <div className="text-xs text-gray-600 p-2 bg-yellow-50 rounded border border-yellow-200">
              <strong>Comparison Period:</strong>
              {' '}
              {format(subDays(value.start, Math.ceil((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24))), 'MMM d, yyyy')}
              {' - '}
              {format(subDays(value.start, 1), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
