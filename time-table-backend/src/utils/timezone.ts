import { formatInTimeZone, toDate } from 'date-fns-tz';
import { parse } from 'date-fns';

/**
 * Returns the configured institution timezone from env, defaulting to 'Asia/Kolkata'
 */
export const getInstitutionTz = (): string => {
  return process.env.INSTITUTION_TIMEZONE || 'Asia/Kolkata';
};

/**
 * Returns the current date and time in the institution's timezone.
 */
export const nowInInstitutionTz = (): Date => {
  const tz = getInstitutionTz();
  // formatInTimeZone returns a string. We can parse it, or better yet, just get the current time natively.
  // Actually, we usually want the current JS Date object representing `now` for absolute time comparisons.
  return new Date();
};

/**
 * Returns the canonical date string 'YYYY-MM-DD' representing "today" in the institution's timezone.
 */
export const institutionTodayDateOnly = (): string => {
  const tz = getInstitutionTz();
  return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
};

/**
 * Returns the Day of Week (0 = Sunday, 1 = Monday ...) in the institution's timezone for "today".
 * NOTE: The backend's TimetableEntry day enum maps 1 = Monday, ..., 6 = Saturday.
 */
export const institutionTodayDayOfWeek = (): number => {
  const tz = getInstitutionTz();
  // 'i' returns day of week, 1 is Monday ... 7 is Sunday.
  const dowStr = formatInTimeZone(new Date(), tz, 'i');
  let dow = parseInt(dowStr, 10);
  return dow;
};

/**
 * Checks if a slot has already started given the current time.
 * slotStartTime is expected to be a Date object (usually only the TIME part is relevant from PG 'TIME' column)
 */
export const isSlotStarted = (slotStartTime: Date, now: Date = new Date()): boolean => {
  const tz = getInstitutionTz();
  
  // Format the current time in institution tz to 'HH:mm:ss'
  const currentTimeStr = formatInTimeZone(now, tz, 'HH:mm:ss');
  
  // The slotStartTime comes from Prisma as a Date object where the time part is what we care about.
  // We extract the time in UTC because Prisma returns `TIME` columns as 1970-01-01T{TIME}Z in UTC.
  const slotTimeStr = slotStartTime.toISOString().split('T')[1].substring(0, 8);
  
  return currentTimeStr >= slotTimeStr;
};
