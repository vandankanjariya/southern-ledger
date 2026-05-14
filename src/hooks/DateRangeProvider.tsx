import { useMemo, useState } from 'react';
import { DateRangeContext } from './dateRangeContext';
import { type DateRangeId, getDateRangeOptions } from '../utils/dateFilters';

interface DateRangeProviderProps {
  children: React.ReactNode;
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  const rangeOptions = useMemo(() => getDateRangeOptions(new Date()), []);
  const [selectedRangeId, setSelectedRangeId] = useState<DateRangeId>('current-fy');
  const selectedRange = rangeOptions.find((range) => range.id === selectedRangeId) ?? rangeOptions[0];

  const value = useMemo(
    () => ({
      rangeOptions,
      selectedRange,
      selectedRangeId,
      setSelectedRangeId,
    }),
    [rangeOptions, selectedRange, selectedRangeId],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}
