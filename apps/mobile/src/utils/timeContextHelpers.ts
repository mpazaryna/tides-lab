import { TimeContextType } from "../context/TimeContext";

/**
 * Converts a number to its ordinal form (1st, 2nd, 3rd, etc.)
 */
const getOrdinal = (num: number): string => {
  const suffix = ["th", "st", "nd", "rd"];
  const mod = num % 100;
  return num + (suffix[(mod - 20) % 10] || suffix[mod] || suffix[0]);
};

/**
 * Simple time context formatting
 * 
 * Examples:
 * - Daily: "Today", "Yesterday", "2 days ago", "3 days ago", etc.
 * - Weekly: "This week", "1 week ago", "2 weeks ago", etc.
 * - Monthly: "This month", "1 month ago", "2 months ago", etc.
 */
export const getHumanisticTimeContext = (
  context: TimeContextType,
  dateOffset: number
): string => {
  if (dateOffset === 0) {
    switch (context) {
      case "daily": return "Today";
      case "weekly": return "This week";
      case "monthly": return "This month";
      case "project": return "Current";
      default: return "Current";
    }
  }

  if (context === "daily") {
    if (dateOffset === 1) return "Yesterday";
    return `${dateOffset} days ago`;
  }
  
  if (context === "weekly") {
    return `${dateOffset} week${dateOffset > 1 ? 's' : ''} ago`;
  }
  
  if (context === "monthly") {
    return `${dateOffset} month${dateOffset > 1 ? 's' : ''} ago`;
  }
  
  return "Historical";
};

/**
 * Formats simple time context (for basic navigation)
 */
export const getSimpleTimeContext = (
  context: TimeContextType,
  dateOffset: number
): string => {
  if (dateOffset === 0) {
    switch (context) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "project": return "Current";
      default: return "Current";
    }
  }

  if (context === "daily") {
    if (dateOffset === 1) return "Yesterday";
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - dateOffset);
    return targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else if (context === "weekly") {
    if (dateOffset === 1) return "Last Week";
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() + dateOffset * 7));
    return `Week of ${weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  } else if (context === "monthly") {
    if (dateOffset === 1) return "Last Month";
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - dateOffset, 1);
    return targetMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }
  
  return "Historical";
};