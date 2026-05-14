import { endOfDay, format, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns';

export interface DateRange {
  id: DateRangeId;
  label: string;
  start: Date;
  end: Date;
}

export type DateRangeId = 'current-fy' | 'previous-fy' | 'last-90-days' | 'calendar-year';

export function getAustralianFinancialYearRange(referenceDate = new Date()): DateRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const fyStartYear = month >= 6 ? year : year - 1;

  return {
    id: 'current-fy',
    label: `FY${String(fyStartYear + 1).slice(-2)}`,
    start: startOfDay(new Date(fyStartYear, 6, 1)),
    end: endOfDay(new Date(fyStartYear + 1, 5, 30)),
  };
}

export function getPreviousAustralianFinancialYearRange(referenceDate = new Date()): DateRange {
  const current = getAustralianFinancialYearRange(referenceDate);
  const startYear = current.start.getFullYear() - 1;

  return {
    id: 'previous-fy',
    label: `FY${String(startYear + 1).slice(-2)}`,
    start: startOfDay(new Date(startYear, 6, 1)),
    end: endOfDay(new Date(startYear + 1, 5, 30)),
  };
}

export function getLast90DaysRange(referenceDate = new Date()): DateRange {
  return {
    id: 'last-90-days',
    label: 'Last 90 days',
    start: startOfDay(subDays(referenceDate, 89)),
    end: endOfDay(referenceDate),
  };
}

export function getCalendarYearRange(referenceDate = new Date()): DateRange {
  const year = referenceDate.getFullYear();

  return {
    id: 'calendar-year',
    label: String(year),
    start: startOfDay(new Date(year, 0, 1)),
    end: endOfDay(new Date(year, 11, 31)),
  };
}

export function getDateRangeOptions(referenceDate = new Date()): DateRange[] {
  return [
    getAustralianFinancialYearRange(referenceDate),
    getPreviousAustralianFinancialYearRange(referenceDate),
    getLast90DaysRange(referenceDate),
    getCalendarYearRange(referenceDate),
  ];
}

export function filterByDateRange<T extends { date: string }>(items: T[], range: DateRange): T[] {
  return items.filter((item) =>
    isWithinInterval(parseISO(item.date), {
      start: range.start,
      end: range.end,
    }),
  );
}

export function formatDateRange(range: DateRange): string {
  return `${format(range.start, 'd MMM yyyy')} - ${format(range.end, 'd MMM yyyy')}`;
}
