import { format, subDays, parseISO, startOfWeek, differenceInCalendarDays } from 'date-fns';
import { Habit, Frequency } from '../models/types';

export function calculateStreak(
  habit: Habit,
  completionDates: string[],
  today: string,
  skippedDates?: string[]
): { current: number; longest: number } {
  if (completionDates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...new Set(completionDates)].sort().reverse();
  const skippedSet = new Set(skippedDates || []);

  if (habit.frequency === Frequency.DAILY) {
    return calculateDailyStreak(sortedDates, today, skippedSet);
  } else if (habit.frequency === Frequency.SPECIFIC_DAYS) {
    return calculateSpecificDaysStreak(sortedDates, today, habit.specificDays || [], skippedSet);
  } else {
    return calculateWeeklyStreak(sortedDates, today, habit.timesPerWeek || 1);
  }
}

function calculateDailyStreak(sortedDates: string[], today: string, skippedSet: Set<string>): { current: number; longest: number } {
  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Check if today or yesterday was completed (allow for not-yet-completed today)
  const todayDate = parseISO(today);
  const yesterdayStr = format(subDays(todayDate, 1), 'yyyy-MM-dd');
  const hasToday = sortedDates.includes(today);
  const hasYesterday = sortedDates.includes(yesterdayStr);

  // Calculate all streaks for longest
  const allDates = [...sortedDates].sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff = differenceInCalendarDays(parseISO(allDates[i]), parseISO(allDates[i - 1]));
      if (diff === 1) {
        tempStreak++;
      } else if (diff === 2) {
        // Check if the gap day was skipped (rest day)
        const gapDay = format(subDays(parseISO(allDates[i]), 1), 'yyyy-MM-dd');
        if (skippedSet.has(gapDay)) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);
  }

  // Calculate current streak (from today backwards)
  if (hasToday || hasYesterday || skippedSet.has(today)) {
    const startDate = hasToday ? today : (skippedSet.has(today) && hasYesterday ? yesterdayStr : hasYesterday ? yesterdayStr : today);
    if (sortedDates.includes(startDate) || skippedSet.has(startDate)) {
      current = sortedDates.includes(startDate) ? 1 : 0;
      let checkDate = format(subDays(parseISO(startDate), 1), 'yyyy-MM-dd');
      while (sortedDates.includes(checkDate) || skippedSet.has(checkDate)) {
        if (sortedDates.includes(checkDate)) current++;
        checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
      }
    }
  }

  return { current, longest: Math.max(longest, current) };
}

function calculateSpecificDaysStreak(
  sortedDates: string[],
  today: string,
  targetDays: number[],
  skippedSet: Set<string>
): { current: number; longest: number } {
  if (targetDays.length === 0) return { current: 0, longest: 0 };

  const dateSet = new Set(sortedDates);
  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Walk backwards from today, only counting target days
  const todayDate = parseISO(today);
  let checkDate = todayDate;

  for (let i = 0; i < 400; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay();

    if (targetDays.includes(dayOfWeek)) {
      if (dateSet.has(dateStr) || skippedSet.has(dateStr)) {
        if (dateSet.has(dateStr)) tempStreak++;
      } else if (i === 0) {
        // Today not completed yet, skip it
        checkDate = subDays(checkDate, 1);
        continue;
      } else {
        break;
      }
    }
    checkDate = subDays(checkDate, 1);
  }
  current = tempStreak;

  // Calculate longest by scanning all dates
  longest = Math.max(current, calculateLongestSpecificDaysStreak(sortedDates, targetDays));

  return { current, longest };
}

function calculateLongestSpecificDaysStreak(dates: string[], targetDays: number[]): number {
  if (dates.length === 0) return 0;

  const sortedAsc = [...dates].sort();
  const dateSet = new Set(sortedAsc);
  let longest = 0;

  // For each completion date, count forward how many consecutive target days are completed
  for (const startDate of sortedAsc) {
    let streak = 1;
    let checkDate = subDays(parseISO(startDate), -1);

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayOfWeek = checkDate.getDay();

      if (targetDays.includes(dayOfWeek)) {
        if (dateSet.has(dateStr)) {
          streak++;
        } else {
          break;
        }
      }
      checkDate = subDays(checkDate, -1);
      if (differenceInCalendarDays(checkDate, parseISO(startDate)) > 400) break;
    }
    longest = Math.max(longest, streak);
  }

  return longest;
}

function calculateWeeklyStreak(
  sortedDates: string[],
  today: string,
  timesPerWeek: number
): { current: number; longest: number } {
  // Group completions by week
  const weekMap = new Map<string, number>();

  for (const date of sortedDates) {
    const weekStart = format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + 1);
  }

  const sortedWeeks = [...weekMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Calculate longest
  const weeksAsc = [...sortedWeeks].reverse();
  for (let i = 0; i < weeksAsc.length; i++) {
    if (weeksAsc[i][1] >= timesPerWeek) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current (from current week backwards)
  const currentWeekStart = format(startOfWeek(parseISO(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  for (const [weekStart, count] of sortedWeeks) {
    if (count >= timesPerWeek) {
      current++;
    } else if (weekStart === currentWeekStart) {
      // Current week might not be done yet
      continue;
    } else {
      break;
    }
  }

  return { current, longest: Math.max(longest, current) };
}
