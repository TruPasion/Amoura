/**
 * Utility functions for time formatting and conversion
 */

/**
 * Converts UTC timestamp to IST (Indian Standard Time)
 * @param timestamp - UTC timestamp string (ISO format)
 * @returns Date object in IST
 */
export const convertToIST = (timestamp: string): Date => {
  const utcDate = new Date(timestamp);
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(utcDate.getTime() + istOffset);
};

/**
 * Formats timestamp to IST time (HH:MM format)
 * @param timestamp - UTC timestamp string
 * @returns Formatted time string in IST (e.g., "14:30")
 */
export const formatMessageTimeIST = (timestamp: string): string => {
  const istDate = convertToIST(timestamp);
  return istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Formats timestamp to IST time with 12-hour format
 * @param timestamp - UTC timestamp string
 * @returns Formatted time string in IST (e.g., "2:30 PM")
 */
export const formatMessageTimeIST12Hour = (timestamp: string): string => {
  const istDate = convertToIST(timestamp);
  return istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Formats timestamp to IST date and time
 * @param timestamp - UTC timestamp string
 * @returns Formatted date and time string in IST (e.g., "15 Aug, 2:30 PM")
 */
export const formatDateTimeIST = (timestamp: string): string => {
  const istDate = convertToIST(timestamp);
  return istDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Formats last seen time with relative time in IST
 * @param lastSeen - UTC timestamp string
 * @returns Formatted relative time string (e.g., "2 minutes ago", "Yesterday 2:30 PM")
 */
export const formatLastSeenIST = (lastSeen: string): string => {
  if (!lastSeen || isNaN(Date.parse(lastSeen))) {
    return "Unknown";
  }

  // Handle potential timezone issues by ensuring consistent UTC parsing
  const sanitizedLastSeen = lastSeen.replace(/\.\d{3}Z?$/, "");
  const utcDate = new Date(sanitizedLastSeen + "Z");
  const istDate = convertToIST(utcDate.toISOString());
  const now = new Date();
  const nowIST = convertToIST(now.toISOString());

  const diffInMs = nowIST.getTime() - istDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays === 1) {
    return `Yesterday ${istDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else {
    return istDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year:
        nowIST.getFullYear() !== istDate.getFullYear() ? "numeric" : undefined,
      timeZone: "Asia/Kolkata",
    });
  }
};

/**
 * Gets current IST timestamp as ISO string
 * @returns Current timestamp in IST as ISO string
 */
export const getCurrentISTTimestamp = (): string => {
  const now = new Date();
  return convertToIST(now.toISOString()).toISOString();
};
