/**
 * Converts a date string to a specific timezone and formats it.
 * 
 * @param {string|Date} dateInput - The date (ISO string, Date object, etc.)
 * @param {string} timeZone - IANA Timezone string (e.g., "Asia/Kolkata", "UTC")
 * @returns {string} - Formatted string "YYYY-MM-DD HH:mm"
 */
export function convertToUserTimezone(dateInput, timeZone) {
  // 1. Handle empty inputs immediately
  if (!dateInput) return "";

  // 2. Normalize the Timezone
  // If timeZone is empty or invalid, default to the user's browser/system timezone
  let targetTimeZone = timeZone;
  
  if (!targetTimeZone || typeof targetTimeZone !== "string") {
    targetTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // 3. Create a Date Object
  const date = new Date(dateInput);

  // 4. Validate Date
  if (isNaN(date.getTime())) {
    console.warn("Invalid Date detected:", dateInput);
    return dateInput; // Return original string to avoid empty table cell
  }

  // 5. Format using Intl (Native Browser API)
  // We use "en-CA" (Canadian English) because it naturally outputs "YYYY-MM-DD"
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format (change to true for AM/PM)
      timeZone: targetTimeZone, // conversion happens here magicallly
    });

    // Format output: "2023-12-05, 14:30" -> cleanup comma -> "2023-12-05 14:30"
    const formattedDate = formatter.format(date).replace(", ", " ");
    return formattedDate;

  } catch (error) {
    console.error(`Timezone "${targetTimeZone}" is invalid. Falling back to System Time.`);
    
    // Fallback: Format using system timezone if the provided one was garbage
    return date.toLocaleString("en-CA", {
       year: "numeric", month: "2-digit", day: "2-digit", 
       hour: "2-digit", minute: "2-digit", hour12: false 
    }).replace(", ", " ");
  }
}