/**
 * Date utility functions for hierarchical tide context
 * Handles date boundary calculations for daily/weekly/monthly tides
 */

/**
 * Gets the Monday of the week containing the given date (ISO 8601 week standard)
 */
export function getWeekStart(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Gets the Sunday of the week containing the given date
 */
export function getWeekEnd(date: string | Date): string {
  const weekStart = getWeekStart(date);
  const monday = new Date(weekStart);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return sunday.toISOString().split('T')[0];
}

/**
 * Gets the first day of the month containing the given date
 */
export function getMonthStart(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Gets the last day of the month containing the given date
 */
export function getMonthEnd(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Formats a date for display (e.g., "Aug 23, 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Formats a date range for display (e.g., "Aug 18-24, 2025")
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    // Same month: "Aug 18-24, 2025"
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  } else if (start.getFullYear() === end.getFullYear()) {
    // Same year, different months: "Aug 30 - Sep 5, 2025"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
  } else {
    // Different years: "Dec 30, 2024 - Jan 5, 2025"
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Checks if a date falls within a date range (inclusive)
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}