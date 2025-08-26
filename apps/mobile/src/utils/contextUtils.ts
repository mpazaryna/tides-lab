import { TimeContextType } from "../context/TimeContext";

// Calculate target date based on context and offset
export const getDateWithOffset = (context: TimeContextType, offset: number): Date => {
  const now = new Date();
  const targetDate = new Date(now);
  
  switch (context) {
    case "daily":
      targetDate.setDate(now.getDate() - offset);
      break;
      
    case "weekly":
      targetDate.setDate(now.getDate() - (offset * 7));
      break;
      
    case "monthly":
      targetDate.setMonth(now.getMonth() - offset);
      break;
      
    case "project":
      // Project context doesn't have time navigation
      return now;
      
    default:
      return now;
  }
  
  return targetDate;
};

// Get formatted date range with offset support
export const getContextDateRangeWithOffset = (context: TimeContextType, offset: number = 0): string => {
  const targetDate = getDateWithOffset(context, offset);
  
  switch (context) {
    case "daily":
      return targetDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long", 
        day: "numeric"
      });
    
    case "weekly":
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString("en-US", { 
        month: "long", day: "numeric" 
      })} - ${endOfWeek.toLocaleDateString("en-US", { 
        month: "long", day: "numeric" 
      })}`;
    
    case "monthly":
      return targetDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
    
    case "project":
      return "Long-term Goals";
    
    default:
      return "Current Focus";
  }
};

// Backward compatibility function
export const getContextDateRange = (context: TimeContextType): string => {
  return getContextDateRangeWithOffset(context, 0);
};