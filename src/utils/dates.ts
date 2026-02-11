import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday as isTodayFns, subDays, differenceInDays, parseISO, startOfDay } from 'date-fns';

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function isToday(dateString: string): boolean {
  return isTodayFns(parseISO(dateString));
}

export function getDayOfWeek(dateString?: string): number {
  const d = dateString ? parseISO(dateString) : new Date();
  return d.getDay();
}

export function getWeekStart(date?: Date): Date {
  return startOfWeek(date || new Date(), { weekStartsOn: 1 });
}

export function getWeekEnd(date?: Date): Date {
  return endOfWeek(date || new Date(), { weekStartsOn: 1 });
}

export function getWeekDays(date?: Date): string[] {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function daysBetween(dateA: string, dateB: string): number {
  return Math.abs(differenceInDays(parseISO(dateA), parseISO(dateB)));
}

export function getPastDays(count: number): string[] {
  const today = startOfDay(new Date());
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    days.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  return days;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
