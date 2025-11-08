import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Cin7Card as Card, Cin7CardContent as CardContent } from '@/components/polaris';
import { Cin7Select } from '@/components/polaris/Cin7Select';
import type { Cin7SelectOption } from '@/components/polaris/Cin7Select';
import { Cin7TextField as TextField } from '@/components/polaris/Cin7TextField';
import { Cin7Button as Button } from '@/components/polaris';
import { subDays, format, isValid } from 'date-fns';

export type DateRangePreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | '90days' | 'custom';

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
      case 'all':
        // Return a date range far in the past to capture all data
        return {
          start: new Date('2020-01-01'),
          end: now,
        };
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
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Custom range', value: 'custom' },
  ];

  const currentPreset = value?.preset || 'all';
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
    if (!value) return 'All Time';

    if (value.preset === 'custom') {
      return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
    }

    const option = presetOptions.find(opt => opt.value === value.preset);
    return option?.label || 'All Time';
  }, [value, presetOptions]);

  return (
    <div className={className} style={{ minWidth: '200px' }}>
      <Cin7Select
        label="Date Range"
        labelHidden
        options={presetOptions}
        value={currentPreset}
        onChange={handlePresetChange}
        placeholder="Select date range"
      />
    </div>
  );
};
