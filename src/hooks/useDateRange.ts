import { useContext } from 'react';
import { DateRangeContext } from './dateRangeContext';

export function useDateRange() {
  const context = useContext(DateRangeContext);

  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider');
  }

  return context;
}
