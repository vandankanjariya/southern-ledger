import { createContext } from 'react';
import type { DateRange, DateRangeId } from '../utils/dateFilters';

export interface DateRangeContextValue {
  selectedRange: DateRange;
  rangeOptions: DateRange[];
  selectedRangeId: DateRangeId;
  setSelectedRangeId: (rangeId: DateRangeId) => void;
}

export const DateRangeContext = createContext<DateRangeContextValue | null>(null);
